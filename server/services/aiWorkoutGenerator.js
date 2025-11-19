const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * Generate a workout plan using Claude AI as a fallback/backup
 * This is used when:
 * - Exercise database is insufficient
 * - User wants AI-customized workouts
 * - System needs intelligent exercise substitution
 */
async function generateAIWorkoutPlan(config) {
  const {
    userId,
    daysPerWeek,
    sessionLength,
    goal,
    strengthCardioRatio,
    experienceLevel,
    equipment
  } = config;

  const prompt = `You are an expert personal trainer and exercise scientist with deep knowledge of hypertrophy research. Generate a detailed ${daysPerWeek}-day per week workout plan with the following specifications:

**User Profile:**
- Experience Level: ${experienceLevel}
- Primary Goal: ${goal}
- Days per Week: ${daysPerWeek}
- Session Length: ${sessionLength} minutes
- Strength/Cardio Ratio: ${strengthCardioRatio}
- Available Equipment: ${equipment.join(', ')}

**CRITICAL SCIENCE-BASED REQUIREMENTS:**

**Volume & Frequency (Based on 2024 Meta-Analyses):**
- **12-20 sets per muscle group per week** (Maximum Adaptive Volume range)
- **2x frequency per muscle** (train each muscle group 2x per week for optimal protein synthesis)
- **2-4 exercises per muscle group** per week
- **3-4 sets per exercise** (optimal stimulus-to-fatigue ratio)

**Rep Ranges & Intensity:**
- **Primary: 6-12 reps @ 60-80% 1RM** (hypertrophy sweet spot)
- **Secondary: 12-20 reps** for metabolic stress and variety
- **Train to 1-3 RIR** (Reps in Reserve) = RPE 7-9 (not to complete failure)

**Rest Periods (Research-backed):**
- **Compound exercises: 2-3 minutes** (allows recovery for next set quality)
- **Isolation exercises: 1-2 minutes**
- DO NOT use 60-second rest for everything - this is outdated

**Exercise Selection & Order:**
- **70-80% compound movements, 20-30% isolation**
- **Essential compounds:** Squat, Deadlift/Hip Hinge, Horizontal Press, Overhead Press, Row/Pull-up
- **Exercise order:** Heavy compounds → Light compounds → Isolation
- **4-5 exercises minimum per session** (not counting warm-up)

**Movement Patterns to Cover:**
- Squat (knee-dominant)
- Hip Hinge (hip-dominant)
- Horizontal Push & Pull
- Vertical Push & Pull
- Core/Anti-rotation

**Progressive Overload:**
- Use double progression: add reps within range, then increase weight
- Track all lifts for systematic progression
- Deload every 6 weeks (reduce volume 50%)

**Output Format (JSON):**
Return a valid JSON object with this structure:
{
  "splitType": "upper-lower|full-body|ppl",
  "weekSchedule": [
    {
      "day": "Monday",
      "type": "upper|lower|cardio|rest|full-body",
      "exercises": [
        {
          "name": "Exercise Name",
          "category": "strength|cardio",
          "muscleGroups": ["chest", "triceps"],
          "equipment": ["barbell", "bench"],
          "difficulty": "beginner|intermediate|advanced",
          "type": "compound|isolation",
          "description": "Brief description",
          "volume": {
            "sets": 4,
            "reps": "6-12",
            "rest": "2.5 min"
          }
        }
      ]
    }
  ],
  "weeklyVolume": {
    "chest": 14,
    "back": 16,
    "shoulders": 15,
    "quads": 15,
    "hamstrings": 14,
    "biceps": 12,
    "triceps": 12
  },
  "duration": "12 weeks",
  "currentWeek": 1,
  "aiGenerated": true,
  "deloadWeek": 6,
  "notes": "Progressive overload via double progression. Deload every 6 weeks by cutting volume 50%."
}

**VOLUME VERIFICATION:**
After creating the program, calculate and verify that EVERY major muscle group receives 12-20 sets per week. If any muscle is below 12 sets or above 20 sets, adjust the program.

Focus on proven compound exercises. Ensure variety and balance. Prioritize exercises with high stimulus-to-fatigue ratios.`;

  try {
    console.log('🤖 Generating AI workout plan...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract JSON from response
    const responseText = message.content[0].text;

    // Try to find JSON in response (Claude might add explanation around it)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const planData = JSON.parse(jsonMatch[0]);

    // Add metadata
    planData.config = config;
    planData.createdAt = new Date().toISOString();
    planData.userId = userId;
    planData.id = `plan-ai-${Date.now()}`;

    console.log('✅ AI workout plan generated successfully');
    return planData;

  } catch (error) {
    console.error('❌ AI workout generation failed:', error.message);
    throw new Error(`AI workout generation failed: ${error.message}`);
  }
}

/**
 * Find exercise video using AI
 */
async function findExerciseVideo(exerciseName) {
  const prompt = `Find a high-quality YouTube tutorial video for the exercise: "${exerciseName}".

Return ONLY a valid YouTube URL from trusted fitness channels like:
- AthleanX
- Jeff Nippard
- ScottHermanFitness
- Squat University
- Alan Thrall
- Calisthenicmovement
- GCN (cycling)
- Global Triathlon Network

Format: https://www.youtube.com/watch?v=VIDEO_ID

Return ONLY the URL, nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const url = message.content[0].text.trim();

    // Validate it's a YouTube URL
    if (url.includes('youtube.com/watch')) {
      return url;
    }

    return null;
  } catch (error) {
    console.error(`Failed to find video for ${exerciseName}:`, error.message);
    return null;
  }
}

/**
 * Suggest exercise substitution using AI
 */
async function suggestExerciseSubstitution(exercise, availableEquipment, reason = 'equipment unavailable') {
  const prompt = `Suggest the best substitute exercise for "${exercise.name}" because ${reason}.

Available equipment: ${availableEquipment.join(', ')}
Target muscle groups: ${exercise.muscleGroups?.join(', ') || 'not specified'}
Exercise type: ${exercise.type || 'not specified'}

Provide a single exercise name that:
1. Uses available equipment
2. Targets similar muscle groups
3. Has similar movement pattern
4. Is appropriate for the same skill level

Return ONLY the exercise name, nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Exercise substitution failed:', error.message);
    return null;
  }
}

module.exports = {
  generateAIWorkoutPlan,
  findExerciseVideo,
  suggestExerciseSubstitution
};
