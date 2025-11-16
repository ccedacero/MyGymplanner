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

  const prompt = `You are an expert personal trainer and exercise scientist. Generate a detailed ${daysPerWeek}-day per week workout plan with the following specifications:

**User Profile:**
- Experience Level: ${experienceLevel}
- Primary Goal: ${goal}
- Days per Week: ${daysPerWeek}
- Session Length: ${sessionLength} minutes
- Strength/Cardio Ratio: ${strengthCardioRatio}
- Available Equipment: ${equipment.join(', ')}

**Requirements:**
1. Follow evidence-based exercise programming principles
2. Use compound movements as foundations
3. Include proper progression for experience level
4. Assign appropriate sets, reps, and rest periods
5. Balance muscle groups and prevent overtraining
6. Include warm-up recommendations

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
            "sets": 3,
            "reps": "8-12",
            "rest": "90 sec"
          }
        }
      ]
    }
  ],
  "duration": "12 weeks",
  "currentWeek": 1,
  "aiGenerated": true,
  "notes": "Important notes about the program"
}

Focus on proven exercises with proper form cues. Ensure variety and balance.`;

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
