const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { filterByProject } = require('../middleware/projectFilter');

// Public route - get active projects (for registration)
router.get('/active', projectController.getActiveProjects);

// All routes require authentication
router.use(authMiddleware);

// Apply project filter to project routes
router.use(filterByProject);

router.post('/create', authorize('admin'), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/summary', authorize('admin'), projectController.getProjectsSummary);
router.get('/:id/dashboard', projectController.getProjectDashboard);
router.get('/:id/financials', projectController.getProjectFinancials);
router.get('/:id/categories', projectController.getProjectCategories);
router.get('/:id/category-stats', projectController.getProjectCategoryStats);
router.get('/:id', projectController.getProjectById);
router.put('/:id', authorize('admin'), projectController.updateProject);
router.delete('/:id', authorize('admin'), projectController.deleteProject);

module.exports = router;
