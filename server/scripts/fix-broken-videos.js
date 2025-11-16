const fs = require('fs').promises;
const path = require('path');

const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');

// Working video replacements from trusted fitness YouTubers
// Channels: AthleanX, Jeff Nippard, ScottHermanFitness, Calisthenicmovement
const videoFixes = {
  'ex003': 'https://www.youtube.com/watch?v=SrqOu55lrYU', // Incline Bench - Jeff Nippard
  'ex010': 'https://www.youtube.com/watch?v=qaQPfi8f5Q0', // Goblet Squat - Squat University
  'ex015': 'https://www.youtube.com/watch?v=TjZrmfcOq24', // Sumo Deadlift - Alan Thrall
  'ex027': 'https://www.youtube.com/watch?v=eGo4IYlbE5g', // Chin-Ups - AthleanX
  'ex031': 'https://www.youtube.com/watch?v=qEwKCR5JCog', // Seated Dumbbell Press - Scott Herman
  'ex034': 'https://www.youtube.com/watch?v=sAq_ocpRh_I', // Front Raises - AthleanX
  'ex035': 'https://www.youtube.com/watch?v=tCziNvaIgj8', // Rear Delt Flyes - Jeff Nippard
  'ex036': 'https://www.youtube.com/watch?v=aGFF9wR49zs', // Upright Row - Scott Herman
  'ex041': 'https://www.youtube.com/watch?v=NFz4d5NvmZw', // Cable Curl - AthleanX
  'ex054': 'https://www.youtube.com/watch?v=IC-CSkI64x8', // Cable Crunches - AthleanX
  'ex063': 'https://www.youtube.com/watch?v=dc8-AD2ZoYo', // Rack Pulls - Buff Dudes
  'ex072': 'https://www.youtube.com/watch?v=gLVZ_s6uYOs', // Running Tempo - Running Channel
  'ex073': 'https://www.youtube.com/watch?v=Y9A7qVAaI_E', // Running Intervals - Global Triathlon Network
  'ex075': 'https://www.youtube.com/watch?v=GELfbHMR1MM', // Sprints - Coach Jay Johnson
  'ex076': 'https://www.youtube.com/watch?v=qeWSuKUUlHQ', // Cycling Easy - GCN
  'ex077': 'https://www.youtube.com/watch?v=OXupQ3NQiIg', // Cycling Intervals - GCN
  'ex078': 'https://www.youtube.com/watch?v=qeWSuKUUlHQ', // Cycling Tempo - GCN
  'ex084': 'https://www.youtube.com/watch?v=mDuIRPS8t0w', // Stair Climber - Anabolic Aliens
  'ex085': 'https://www.youtube.com/watch?v=Dzstb2BkZzg', // Elliptical - Fitness Blender
  'ex086': 'https://www.youtube.com/watch?v=wKAYvg7CKvI', // Battle Ropes - Onnit
  'ex087': 'https://www.youtube.com/watch?v=LSJU2CX6wMk', // Assault Bike - WODprep
  'ex088': 'https://www.youtube.com/watch?v=6kcK2w0rD8I', // Ski Erg - Concept2
  'ex089': 'https://www.youtube.com/watch?v=nUr7RXlDHg4', // Sled Push - EliteFTS
  'ex090': 'https://www.youtube.com/watch?v=FgjPxzaM0CI', // Sled Pull - The Ready State
  'ex092': 'https://www.youtube.com/watch?v=bO7vKi7Q6Vs', // Tabata - Fitness Blender
  'ex096': 'https://www.youtube.com/watch?v=mRznU6pzez0', // Ring Dips - Calisthenics Movement
  'ex098': 'https://www.youtube.com/watch?v=tVH4y5d0W-0', // Muscle-Ups - Calisthenics Movement
  'ex099': 'https://www.youtube.com/watch?v=RtYsQ0w_dPM'  // L-Sit - FitnessFAQs
};

async function fixBrokenVideos() {
  console.log('🔧 Fixing broken video URLs...\n');

  const data = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
  const db = JSON.parse(data);

  let fixed = 0;

  for (const exercise of db.exercises) {
    if (videoFixes[exercise.id]) {
      const oldUrl = exercise.videoUrl;
      exercise.videoUrl = videoFixes[exercise.id];
      console.log(`✅ Fixed ${exercise.name} (${exercise.id})`);
      console.log(`   Old: ${oldUrl}`);
      console.log(`   New: ${exercise.videoUrl}\n`);
      fixed++;
    }
  }

  // Save updated database
  await fs.writeFile(EXERCISES_DB_PATH, JSON.stringify(db, null, 2));

  console.log(`\n✨ Fixed ${fixed} broken video URLs!`);
  console.log('📝 Updated exercises-database.json');

  return fixed;
}

// Run if called directly
if (require.main === module) {
  fixBrokenVideos()
    .then(fixed => {
      console.log(`\n✅ Done! Fixed ${fixed} videos.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { fixBrokenVideos };
