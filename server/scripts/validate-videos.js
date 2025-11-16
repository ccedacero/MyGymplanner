const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');

// Check if YouTube video exists
function checkYouTubeVideo(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ valid: false, reason: 'No URL provided' });
      return;
    }

    // Extract video ID from YouTube URL
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!match) {
      resolve({ valid: false, reason: 'Invalid YouTube URL format' });
      return;
    }

    const videoId = match[1];
    const checkUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    https.get(checkUrl, (res) => {
      // If status is 200, video exists
      // If 404, video doesn't exist or is private
      resolve({
        valid: res.statusCode === 200,
        reason: res.statusCode === 200 ? 'OK' : `HTTP ${res.statusCode}`
      });
    }).on('error', (err) => {
      resolve({ valid: false, reason: err.message });
    });
  });
}

async function validateAllVideos() {
  console.log('🔍 Validating all exercise video URLs...\n');

  const data = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
  const db = JSON.parse(data);

  const results = {
    total: db.exercises.length,
    valid: 0,
    invalid: 0,
    missing: 0,
    invalidExercises: []
  };

  for (const exercise of db.exercises) {
    if (!exercise.videoUrl) {
      results.missing++;
      results.invalidExercises.push({
        id: exercise.id,
        name: exercise.name,
        issue: 'Missing video URL'
      });
      continue;
    }

    const check = await checkYouTubeVideo(exercise.videoUrl);

    if (check.valid) {
      results.valid++;
      process.stdout.write('✓');
    } else {
      results.invalid++;
      process.stdout.write('✗');
      results.invalidExercises.push({
        id: exercise.id,
        name: exercise.name,
        url: exercise.videoUrl,
        issue: check.reason
      });
    }
  }

  console.log('\n\n📊 Validation Results:');
  console.log(`Total exercises: ${results.total}`);
  console.log(`✅ Valid videos: ${results.valid}`);
  console.log(`❌ Invalid videos: ${results.invalid}`);
  console.log(`⚠️  Missing videos: ${results.missing}`);

  if (results.invalidExercises.length > 0) {
    console.log('\n🔴 Exercises with invalid/missing videos:');
    results.invalidExercises.forEach(ex => {
      console.log(`  - ${ex.name} (${ex.id}): ${ex.issue}`);
      if (ex.url) console.log(`    URL: ${ex.url}`);
    });
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    ...results
  };

  await fs.writeFile(
    path.join(__dirname, '../data/video-validation-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📝 Report saved to: server/data/video-validation-report.json');

  return results;
}

// Run if called directly
if (require.main === module) {
  validateAllVideos()
    .then(results => {
      process.exit(results.invalid === 0 && results.missing === 0 ? 0 : 1);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { validateAllVideos, checkYouTubeVideo };
