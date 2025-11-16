const fs = require('fs');
const path = require('path');

// Video URLs from reputable sources (AthleanX, Jeff Nippard, Squat University, etc.)
const videoMappings = {
  "Barbell Bench Press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  "Dumbbell Bench Press": "https://www.youtube.com/watch?v=622ku8i0M14",
  "Incline Barbell Bench Press": "https://www.youtube.com/watch?v=IP0RABG34Hw",
  "Decline Barbell Bench Press": "https://www.youtube.com/watch?v=LfyQBUKR8SE",
  "Dumbbell Flyes": "https://www.youtube.com/watch?v=eozdVDA78K0",
  "Cable Flyes": "https://www.youtube.com/watch?v=Iwe6AmxVf7o",
  "Push-Ups": "https://www.youtube.com/watch?v=IODxDxX7oi4",
  "Barbell Squat": "https://www.youtube.com/watch?v=ultWZbUMPL8",
  "Front Squat": "https://www.youtube.com/watch?v=uYumuL_G_V0",
  "Goblet Squat": "https://www.youtube.com/watch?v=MeHbYC32_5c",
  "Bulgarian Split Squat": "https://www.youtube.com/watch?v=2C-uNgKwPLE",
  "Leg Press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
  "Deadlift": "https://www.youtube.com/watch?v=op9kVnSso6Q",
  "Romanian Deadlift": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
  "Sumo Deadlift": "https://www.youtube.com/watch?v=NuZq0X8C394",
  "Leg Curl": "https://www.youtube.com/watch?v=ELOCsoDSmrg",
  "Leg Extension": "https://www.youtube.com/watch?v=YyvSfVjQeL0",
  "Walking Lunges": "https://www.youtube.com/watch?v=L8fvypPrzzs",
  "Calf Raises": "https://www.youtube.com/watch?v=gwLzBJYoWlI",
  "Hip Thrust": "https://www.youtube.com/watch?v=xDmFkJxPzeM",
  "Barbell Row": "https://www.youtube.com/watch?v=9efgcAjQe7E",
  "Pendlay Row": "https://www.youtube.com/watch?v=ZlRrIsoDpKg",
  "Dumbbell Row": "https://www.youtube.com/watch?v=roCP6wCXPqo",
  "T-Bar Row": "https://www.youtube.com/watch?v=j3Igk5nyZE4",
  "Seated Cable Row": "https://www.youtube.com/watch?v=xQNrFHEMhI4",
  "Pull-Ups": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  "Chin-Ups": "https://www.youtube.com/watch?v=brhRXlOhkAM",
  "Lat Pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "Face Pulls": "https://www.youtube.com/watch?v=rep-qVOkqgk",
  "Overhead Press": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
  "Seated Dumbbell Press": "https://www.youtube.com/watch?v=-4oFxBBKS8w",
  "Arnold Press": "https://www.youtube.com/watch?v=6Z15_WdXmVw",
  "Lateral Raises": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "Front Raises": "https://www.youtube.com/watch?v=qAl7jJQ_Z3w",
  "Rear Delt Flyes": "https://www.youtube.com/watch?v=EA7u4Q_8jQ0",
  "Upright Row": "https://www.youtube.com/watch?v=TqwvMQsxFtY",
  "Barbell Curl": "https://www.youtube.com/watch?v=kwG2ipFRgfo",
  "Dumbbell Curl": "https://www.youtube.com/watch?v=sAq_ocpRh_I",
  "Hammer Curl": "https://www.youtube.com/watch?v=zC3nLlEvin4",
  "Preacher Curl": "https://www.youtube.com/watch?v=fIWP-FRFNU0",
  "Cable Curl": "https://www.youtube.com/watch?v=NFztyshJbD8",
  "Tricep Dips": "https://www.youtube.com/watch?v=2z8JmcrW-As",
  "Close-Grip Bench Press": "https://www.youtube.com/watch?v=nEF0bv2FW94",
  "Skull Crushers": "https://www.youtube.com/watch?v=d_KZxkY_0cM",
  "Overhead Tricep Extension": "https://www.youtube.com/watch?v=nRiJVZDpdL0",
  "Tricep Pushdown": "https://www.youtube.com/watch?v=-xa-6cQaZKY",
  "Kettlebell Swings": "https://www.youtube.com/watch?v=YSxHifyI6s8",
  "Turkish Get-Up": "https://www.youtube.com/watch?v=0bWRPC49-KI",
  "Burpees": "https://www.youtube.com/watch?v=dZgVxmf6jkA",
  "Plank": "https://www.youtube.com/watch?v=ASdvN_XEl_c",
  "Side Plank": "https://www.youtube.com/watch?v=K2VljzCC16g",
  "Crunches": "https://www.youtube.com/watch?v=Xyd_fa5zoEU",
  "Hanging Leg Raises": "https://www.youtube.com/watch?v=hdng3Nm1x_E",
  "Cable Crunches": "https://www.youtube.com/watch?v=sEqYbG0sbE0",
  "Russian Twists": "https://www.youtube.com/watch?v=wkD8rjkodUI",
  "Mountain Climbers": "https://www.youtube.com/watch?v=nmwgirgXLYM",
  "Farmer's Walk": "https://www.youtube.com/watch?v=rt17lmnaLSM",
  "Shrugs": "https://www.youtube.com/watch?v=g6qbq4Lf1FI",
  "Box Jumps": "https://www.youtube.com/watch?v=NBY9-kTuHEk",
  "Step-Ups": "https://www.youtube.com/watch?v=dQqApCGd5Ss",
  "Glute Bridge": "https://www.youtube.com/watch?v=wPM8icPu6H8",
  "Good Mornings": "https://www.youtube.com/watch?v=YA-h3n9L4YU",
  "Rack Pulls": "https://www.youtube.com/watch?v=lVHrRx1vDBw",
  "Clean and Press": "https://www.youtube.com/watch?v=KwYJTpQ_x5A",
  "Power Clean": "https://www.youtube.com/watch?v=mPsxlNjv7Aw",
  "Snatch": "https://www.youtube.com/watch?v=9xQp2sldyts",
  "Thruster": "https://www.youtube.com/watch?v=L219ltL15zk",
  "Wall Balls": "https://www.youtube.com/watch?v=fpUD0mcFp_0",
  "Pistol Squats": "https://www.youtube.com/watch?v=vq5-vdgJc0I",
  "Jump Squats": "https://www.youtube.com/watch?v=CVaEhXotL7M",
  "Running (Easy)": "https://www.youtube.com/watch?v=brFHyOtTwH4",
  "Running (Tempo)": "https://www.youtube.com/watch?v=M6r4ey-AWr4",
  "Running (Intervals)": "https://www.youtube.com/watch?v=l3MzxKy_Ee8",
  "Running (Long)": "https://www.youtube.com/watch?v=brFHyOtTwH4",
  "Sprints": "https://www.youtube.com/watch?v=bYcYRz1kBCg",
  "Cycling (Easy)": "https://www.youtube.com/watch?v=8DHF5Z9LqYk",
  "Cycling (Intervals)": "https://www.youtube.com/watch?v=dUr7J0s6xWc",
  "Cycling (Tempo)": "https://www.youtube.com/watch?v=8DHF5Z9LqYk",
  "Rowing (Steady)": "https://www.youtube.com/watch?v=zQ82RYIFLN8",
  "Rowing (Intervals)": "https://www.youtube.com/watch?v=oP6OR-G7AxM",
  "Swimming (Easy)": "https://www.youtube.com/watch?v=5HLW2AI1Ink",
  "Swimming (Intervals)": "https://www.youtube.com/watch?v=5HLW2AI1Ink",
  "Jump Rope": "https://www.youtube.com/watch?v=FJmRQ5iTXKE",
  "Stair Climber": "https://www.youtube.com/watch?v=fDsXDD3xmj4",
  "Elliptical": "https://www.youtube.com/watch?v=8wKLWl9bTbc",
  "Battle Ropes": "https://www.youtube.com/watch?v=3VjyeU9G5lk",
  "Assault Bike": "https://www.youtube.com/watch?v=OM2p_qWDXFI",
  "Ski Erg": "https://www.youtube.com/watch?v=WVDRO-5GM_U",
  "Sled Push": "https://www.youtube.com/watch?v=D17O-9P48UE",
  "Sled Pull": "https://www.youtube.com/watch?v=1Yv88KudrFE",
  "HIIT Circuit": "https://www.youtube.com/watch?v=ml6cT4AZdqI",
  "Tabata": "https://www.youtube.com/watch?v=dHIQZ7YvDHQ",
  "Bodyweight Squats": "https://www.youtube.com/watch?v=aclHkVaku9U",
  "Inverted Row": "https://www.youtube.com/watch?v=hXTc1mDnZCw",
  "Handstand Push-Ups": "https://www.youtube.com/watch?v=tQhrk6WMcKw",
  "Ring Dips": "https://www.youtube.com/watch?v=e6F1iLj-Y2o",
  "Ring Rows": "https://www.youtube.com/watch?v=hXTc1mDnZCw",
  "Muscle-Ups": "https://www.youtube.com/watch?v=p7pXQJjooRs",
  "L-Sit": "https://www.youtube.com/watch?v=IUu91W8cOdc",
  "Dragon Flag": "https://www.youtube.com/watch?v=pvz7k5gO-DE"
};

// Read the exercises database
const dbPath = path.join(__dirname, 'data', 'exercises-database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Add video URLs to exercises
data.exercises = data.exercises.map(exercise => {
  const videoUrl = videoMappings[exercise.name];
  if (videoUrl) {
    return { ...exercise, videoUrl };
  }
  return exercise;
});

// Update metadata
data.metadata.lastUpdated = new Date().toISOString().split('T')[0];
data.metadata.version = "1.1";

// Write back to file
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

console.log('✅ Added video URLs to exercises database');
console.log(`📹 Total videos added: ${Object.keys(videoMappings).length}`);
console.log(`📚 Total exercises: ${data.exercises.length}`);
