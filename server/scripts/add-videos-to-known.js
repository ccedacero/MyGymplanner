const fs = require('fs');
const path = require('path');

// Video URLs from reputable sources (AthleanX, Jeff Nippard, Squat University, etc.)
const videoMappings = {
  // Barbell exercises
  "Barbell Back Squat": "https://www.youtube.com/watch?v=ultWZbUMPL8",
  "Barbell Bench Press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  "Barbell Deadlift": "https://www.youtube.com/watch?v=op9kVnSso6Q",
  "Barbell Romanian Deadlift": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
  "Barbell Overhead Press": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
  "Barbell Bent Over Row": "https://www.youtube.com/watch?v=9efgcAjQe7E",
  "Barbell Z Press": "https://www.youtube.com/watch?v=3gRJHwwPjP8",
  "Barbell Underhand Row": "https://www.youtube.com/watch?v=9efgcAjQe7E",
  "Tempo Barbell Back Squat": "https://www.youtube.com/watch?v=ultWZbUMPL8",
  "Heel Elevated BB Back Squat": "https://www.youtube.com/watch?v=8Vu_5qEbLp0",
  "Barbell Incline Bench Press": "https://www.youtube.com/watch?v=SrqOu55lrYU",
  "Barbell Walking Lunges": "https://www.youtube.com/watch?v=L8fvypPrzzs",
  "Barbell Skullcrusher": "https://www.youtube.com/watch?v=d_KZxkY_0cM",
  "Barbell Bicep Curl": "https://www.youtube.com/watch?v=kwG2ipFRgfo",
  "Slow Eccentric BB Incline Bench Press": "https://www.youtube.com/watch?v=SrqOu55lrYU",
  "Slow Eccentric BB Bench Press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  "RP Stiff Legged Deadlift": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
  "Tall Kneeling Barbell Press": "https://www.youtube.com/watch?v=Ts9K0uGK_5w",

  // Dumbbell exercises
  "Dumbbell Rear Foot Elevated Split Squat": "https://www.youtube.com/watch?v=2C-uNgKwPLE",
  "Dumbbell Incline Bench Press": "https://www.youtube.com/watch?v=622ku8i0M14",
  "Dumbbell Seated Shoulder Press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
  "Dumbbell Lateral Raise": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "DB Reverse Grip Incline Bench": "https://www.youtube.com/watch?v=622ku8i0M14",
  "DB Walking Lunge": "https://www.youtube.com/watch?v=L8fvypPrzzs",
  "Dumbbell RDL": "https://www.youtube.com/watch?v=vdUJkYOunZE",
  "3-Point Single Arm Dumbbell Row": "https://www.youtube.com/watch?v=roCP6wCXPqo",

  // Kettlebell exercises
  "KB Suitcase Carry": "https://www.youtube.com/watch?v=6YkG0Dx0wTE",
  "Single Arm KB OH Carry": "https://www.youtube.com/watch?v=jOsGT2y2M_k",
  "Kettlebell Racked And Overhead Carry": "https://www.youtube.com/watch?v=jOsGT2y2M_k",
  "Kettlebell Swing": "https://www.youtube.com/watch?v=YSxHifyI6s8",
  "KB SA Suitcase Carry": "https://www.youtube.com/watch?v=6YkG0Dx0wTE",

  // Machine exercises
  "Angled Machine Leg Press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
  "Machine Lying Leg Curl": "https://www.youtube.com/watch?v=ELOCsoDSmrg",
  "Machine Seated Calf Raise": "https://www.youtube.com/watch?v=gwLzBJYoWlI",
  "Machine Seated Leg Curl": "https://www.youtube.com/watch?v=ELOCsoDSmrg",
  "Leg Press Machine Calf Raise": "https://www.youtube.com/watch?v=gwLzBJYoWlI",
  "Machine Seated Chest Fly": "https://www.youtube.com/watch?v=Iwe6AmxVf7o",
  "Machine Seated Reverse Fly": "https://www.youtube.com/watch?v=EA7u4Q_8kQ0",
  "Assisted Pull Up Machine": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  "Machine Assisted Chin Up": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  "Heel Elevated Smith Machine Squat": "https://www.youtube.com/watch?v=8Vu_5qEbLp0",
  "Close Stance Leg Press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
  "Single Leg Extension": "https://www.youtube.com/watch?v=YyvSfVjQeL0",
  "Captain Chair Weighted Leg Raises": "https://www.youtube.com/watch?v=hdng3Nm1x_E",
  "Single Arm Hammer Strength Row": "https://www.youtube.com/watch?v=9efgcAjQe7E",

  // Cable exercises
  "Close Grip Seated Cable Row": "https://www.youtube.com/watch?v=xQNrFHEMhI4",
  "Cable Straight Bar Tricep Pushdown": "https://www.youtube.com/watch?v=-xa-6cQaZKY",
  "Cable Bicep Curl": "https://www.youtube.com/watch?v=_8It_nOzMtE",
  "Standing Cable Rear Delt Fly": "https://www.youtube.com/watch?v=EA7u4Q_8kQ0",
  "Single Arm Cable Lateral Raise": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "Cable Mid Chest Fly": "https://www.youtube.com/watch?v=Iwe6AmxVf7o",
  "Cable Straight Bar Bicep Curl": "https://www.youtube.com/watch?v=_8It_nOzMtE",
  "MAG Bar Lat Pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "Reverse Grip Lat Pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "Lat Pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",

  // Bodyweight exercises
  "Ab Roller Wheel Abdominal Roll Out": "https://www.youtube.com/watch?v=UgygyV7r2M8",
  "Pull Up": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  "Dip": "https://www.youtube.com/watch?v=2z8JmcrW-As",
  "Foam Roller Deadbug": "https://www.youtube.com/watch?v=g_BYB0R-4Ws",
  "Front-foot Elevated Split Squats": "https://www.youtube.com/watch?v=2C-uNgKwPLE",
  "Decline Leg Raises": "https://www.youtube.com/watch?v=hdng3Nm1x_E",
  "Hand Assisted Step Up": "https://www.youtube.com/watch?v=dQqApCGd5Ss",

  // Landmine
  "Landmine Row with Close Grip": "https://www.youtube.com/watch?v=j3Igk5nyZE4"
};

// Read the known exercises database
const dbPath = path.join(__dirname, '../data/known-exercises.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let addedCount = 0;
let missingCount = 0;
const missingVideos = [];

// Add video URLs to exercises
data.exercises = data.exercises.map(exercise => {
  const videoUrl = videoMappings[exercise.name];
  if (videoUrl) {
    addedCount++;
    return { ...exercise, videoUrl };
  } else {
    missingCount++;
    missingVideos.push(exercise.name);
    return exercise;
  }
});

// Update metadata
data.metadata.lastUpdated = new Date().toISOString().split('T')[0];

// Write back to file
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

console.log('✅ Added video URLs to known-exercises database');
console.log(`📹 Videos added: ${addedCount}/${data.exercises.length}`);
if (missingCount > 0) {
  console.log(`⚠️  Exercises still missing videos: ${missingCount}`);
  console.log('Missing videos for:');
  missingVideos.forEach(name => console.log(`  - ${name}`));
}
