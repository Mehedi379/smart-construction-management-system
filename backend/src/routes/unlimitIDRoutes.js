// ============================================
// UNLIMITED ID DETECTION & AUTO-UPDATE ROUTES
// Smart Construction Management System
// ============================================

const express = require('express');
const router = express.Router();
const unlimitIDController = require('../controllers/unlimitIDController');
const autoIDVerificationController = require('../controllers/autoIDVerificationController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/ids/detect
 * @desc    Detect ALL IDs in the system
 * @access  Admin
 */
router.get('/detect', unlimitIDController.detectAllIDs);

/**
 * @route   POST /api/admin/ids/auto-fix
 * @desc    Auto-fix ALL ID issues
 * @access  Admin
 */
router.post('/auto-fix', unlimitIDController.autoFixAllIDs);

/**
 * @route   POST /api/admin/ids/sync-auto-increment
 * @desc    Sync all auto-increment IDs
 * @access  Admin
 */
router.post('/sync-auto-increment', unlimitIDController.syncAutoIncrements);

/**
 * @route   GET /api/admin/ids/report
 * @desc    Generate comprehensive ID report
 * @access  Admin
 */
router.get('/report', unlimitIDController.generateIDReport);

/**
 * @route   GET /api/admin/ids/validate/:table
 * @desc    Validate specific table IDs
 * @access  Admin
 */
router.get('/validate/:table', unlimitIDController.validateTableIDs);

/**
 * @route   POST /api/admin/ids/bulk-update
 * @desc    Bulk update IDs with custom mapping
 * @access  Admin
 */
router.post('/bulk-update', unlimitIDController.bulkUpdateIDs);

/**
 * @route   GET /api/admin/ids/health
 * @desc    Get database health score
 * @access  Admin
 */
router.get('/health', unlimitIDController.getHealthScore);

// ============================================
// NEW AUTO-VERIFICATION ROUTES
// ============================================

/**
 * @route   GET /api/admin/ids/auto-verify
 * @desc    Run automatic ID verification
 * @access  Admin
 */
router.get('/auto-verify', autoIDVerificationController.runAutoVerification);

/**
 * @route   GET /api/admin/ids/health-report
 * @desc    Get comprehensive health report
 * @access  Admin
 */
router.get('/health-report', autoIDVerificationController.getHealthReport);

/**
 * @route   GET /api/admin/ids/role-verification
 * @desc    Get role verification details
 * @access  Admin
 */
router.get('/role-verification', autoIDVerificationController.getRoleVerification);

/**
 * @route   POST /api/admin/ids/fix-project-assignments
 * @desc    Fix missing project assignments
 * @access  Admin
 */
router.post('/fix-project-assignments', autoIDVerificationController.fixProjectAssignments);

module.exports = router;
