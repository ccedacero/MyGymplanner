const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authenticateToken } = require('../middleware/auth');

// Generate new training plan
router.post('/generate', authenticateToken, planController.generatePlan);

// Get user's plans
router.get('/user/:userId', authenticateToken, planController.getUserPlans);

// Get specific plan
router.get('/:planId', authenticateToken, planController.getPlanById);

// Update plan
router.put('/:planId', authenticateToken, planController.updatePlan);

// Delete plan
router.delete('/:planId', authenticateToken, planController.deletePlan);

module.exports = router;
