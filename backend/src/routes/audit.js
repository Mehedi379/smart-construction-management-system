const express = require('express');
const router = express.Router();
const AuditService = require('../services/auditService');
const { authMiddleware, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// Get audit logs with filters
router.get('/', async (req, res) => {
    try {
        const filters = {
            user_id: req.query.user_id,
            action: req.query.action,
            entity_type: req.query.entity_type,
            entity_id: req.query.entity_id,
            from_date: req.query.from_date,
            to_date: req.query.to_date,
            limit: req.query.limit || 100
        };

        const logs = await AuditService.getLogs(filters);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await AuditService.getStats(days);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit statistics'
        });
    }
});

module.exports = router;
