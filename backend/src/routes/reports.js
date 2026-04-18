const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');
const { filterByProject } = require('../middleware/projectFilter');

router.use(authMiddleware);

// Apply project filter to all report routes
router.use(filterByProject);

// All authenticated users can access reports
router.get('/profit-loss', reportController.getProfitLoss);
router.get('/daily', reportController.getDailyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/dashboard', reportController.getDashboardStats);
router.get('/export/excel', reportController.exportToExcel);
router.get('/export/pdf', reportController.exportToPDF);

module.exports = router;
