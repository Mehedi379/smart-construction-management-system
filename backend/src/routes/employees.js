const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { filterByProject } = require('../middleware/projectFilter');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// Apply project filter (admin can see all)
router.use(filterByProject);

// Employee CRUD
router.post('/register', employeeController.registerEmployee);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Employee statistics
router.get('/stats/summary', employeeController.getEmployeeStats);

module.exports = router;
