const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Sheet signature workflow
router.post('/sheets/:id/sign', workflowController.signSheet);
router.post('/sheets/:id/reject', workflowController.rejectSheet);
router.get('/sheets/:id/signature-status', workflowController.getSheetSignatureStatus);
router.post('/sheets/:id/generate-pdf', workflowController.generateSheetPDF);

// Pending signatures
router.get('/my-pending-signatures', workflowController.getMyPendingSignatures);

// Notifications
router.get('/notifications', workflowController.getMyNotifications);
router.get('/notifications/unread-count', workflowController.getUnreadCount);
router.put('/notifications/:id/read', workflowController.markNotificationAsRead);
router.put('/notifications/read-all', workflowController.markAllNotificationsAsRead);

module.exports = router;
