const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Get all exercises (with optional equipment filter)
router.get('/', exerciseController.getAllExercises);

// Get exercise by ID
router.get('/:id', exerciseController.getExerciseById);

// Get exercises filtered by equipment
router.get('/filter/equipment', exerciseController.filterByEquipment);

// Upload custom exercises (CSV/Excel)
router.post('/upload', upload.single('file'), exerciseController.uploadCustomExercises);

// Add custom exercise manually
router.post('/custom', exerciseController.addCustomExercise);

// Update custom exercise
router.put('/custom/:id', exerciseController.updateCustomExercise);

// Delete custom exercise
router.delete('/custom/:id', exerciseController.deleteCustomExercise);

// Get user's custom exercises
router.get('/user/:userId/custom', exerciseController.getUserCustomExercises);

module.exports = router;
