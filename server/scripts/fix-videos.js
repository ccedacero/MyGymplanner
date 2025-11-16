const fs = require('fs').promises;
const path = require('path');

const EXERCISES_PATH = path.join(__dirname, '../data/exercises-database.json');

// Working replacement videos from reputable fitness channels
const videoReplacements = {
  'ex010': 'https://www.youtube.com/watch?v=MeIiIdhvXT4', // Goblet Squat - Jeff Nippard
  'ex015': 'https://www.youtube.com/watch?v=4AObAU-EcYE', // Sumo Deadlift - ScottHermanFitness
  'ex035': 'https://www.youtube.com/watch?v=EA7u4Q_8kp0', // Rear Delt Flyes - Jeff Nippard
  'ex036': 'https://www.youtube.com/watch?v=F3QY8V8GJG4', // Upright Row - ScottHermanFitness
  'ex041': 'https://www.youtube.com/watch?v=_8It_nOzMtE', // Cable Curl - ScottHermanFitness
  'ex054': 'https://www.youtube.com/watch?v=Ud9t2Ev7B-Q', // Cable Crunches - ScottHermanFitness
  'ex063': 'https://www.youtube.com/watch?v=RiCVXmdUv7g', // Rack Pulls - Alan Thrall
  'ex073': 'https://www.youtube.com/watch?v=gn5dRWCN7-0', // Running (Intervals) - Global Triathlon Network
  'ex075': 'https://www.youtube.com/watch?v=s9zPTQe5bLQ', // Sprints - Sprint Hacks
  'ex076': 'https://www.youtube.com/watch?v=5bjKpxEfBtg', // Cycling (Easy) - GCN
  'ex077': 'https://www.youtube.com/watch?v=DZjavdUzHKc', // Cycling (Intervals) - GCN
  'ex078': 'https://www.youtube.com/watch?v=OBc2OX32F2A', // Cycling (Tempo) - GCN
  'ex084': 'https://www.youtube.com/watch?v=r2MpAaLO4kE', // Stair Climber - Bowflex
  'ex085': 'https://www.youtube.com/watch?v=Dzstb2BkZzg', // Elliptical - Bowflex
  'ex086': 'https://www.youtube.com/watch?v=w8JYfXiSxoc', // Battle Ropes - ATHLEAN-X
  'ex087': 'https://www.youtube.com/watch?v=PvYq5dj2_sE', // Assault Bike - Rogue Fitness
  'ex088': 'https://www.youtube.com/watch?v=w5P47vJE7yg', // Ski Erg - Concept2
  'ex089': 'https://www.youtube.com/watch?v=ajCITFjVPqs', // Sled Push - Garage Gym Reviews
  'ex090': 'https://www.youtube.com/watch?v=PjV89SJ9z9k', // Sled Pull - Critical Bench
  'ex092': 'https://www.youtube.com/watch?v=mmq5zZfmIws', // Tabata - FitnessBlender
  'ex098': 'https://www.youtube.com/watch?v=tBV_qjWxS0Y', // Muscle-Ups - Calisthenicmovement
  'ex099': 'https://www.youtube.com/watch?v=IUhELDEiJ5g'  // L-Sit - Calisthenicmovement
};

async function fixBrokenVideos() {
  try {
    // Read the exercises database
    const data = await fs.readFile(EXERCISES_PATH, 'utf8');
    const exercises = JSON.parse(data);

    let fixedCount = 0;

    // Update each exercise with broken video
    exercises.exercises = exercises.exercises.map(exercise => {
      if (videoReplacements[exercise.id]) {
        console.log(`Fixing ${exercise.id}: ${exercise.name}`);
        fixedCount++;
        return {
          ...exercise,
          videoUrl: videoReplacements[exercise.id]
        };
      }
      return exercise;
    });

    // Write the updated database back
    await fs.writeFile(EXERCISES_PATH, JSON.stringify(exercises, null, 2));

    console.log(`\n✅ Fixed ${fixedCount} broken video links!`);
    console.log('📝 Updated exercises-database.json');
  } catch (error) {
    console.error('❌ Error fixing videos:', error);
    process.exit(1);
  }
}

fixBrokenVideos();
