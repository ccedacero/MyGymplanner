const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads with security improvements
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    // Check file extension as well (defense in depth)
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Get all exercises (with optional equipment filter)
router.get('/', exerciseController.getAllExercises);

// Get all stretches (must be before /:id to avoid conflicts)
router.get('/stretches/all', exerciseController.getAllStretches);

// Get stretch by ID (must be before general /:id route)
router.get('/stretches/:id', exerciseController.getStretchById);

// Get exercise substitutes (must be before /:id to avoid conflicts)
router.get('/:id/substitutes', exerciseController.getExerciseSubstitutes);

// Get exercise by ID
router.get('/:id', exerciseController.getExerciseById);

// Get exercises filtered by equipment
router.get('/filter/equipment', exerciseController.filterByEquipment);

// Upload custom exercises (CSV/Excel) - requires authentication
router.post('/upload', authenticateToken, upload.single('file'), exerciseController.uploadCustomExercises);

// Add custom exercise manually
router.post('/custom', authenticateToken, exerciseController.addCustomExercise);

// Update custom exercise
router.put('/custom/:id', authenticateToken, exerciseController.updateCustomExercise);

// Delete custom exercise
router.delete('/custom/:id', authenticateToken, exerciseController.deleteCustomExercise);

// Get user's custom exercises
router.get('/user/:userId/custom', authenticateToken, exerciseController.getUserCustomExercises);

module.exports = router;
