const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

// Generate new training plan
router.post('/generate', planController.generatePlan);

// Get user's plans
router.get('/user/:userId', planController.getUserPlans);

// Get specific plan
router.get('/:planId', planController.getPlanById);

// Update plan
router.put('/:planId', planController.updatePlan);

// Delete plan
router.delete('/:planId', planController.deletePlan);

module.exports = router;
