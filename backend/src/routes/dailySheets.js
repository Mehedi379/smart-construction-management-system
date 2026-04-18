const express = require('express');
const router = express.Router();
const { DailySheetController, upload, voucherUpload } = require('../controllers/dailySheetController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { filterByProject } = require('../middleware/projectFilter');

// All routes require authentication
router.use(authMiddleware);

// Apply project filter to all daily sheet routes
router.use(filterByProject);

// Upload image for OCR (single file)
router.post('/upload-image', upload.single('image'), DailySheetController.processOCR);

// Scan voucher receipt with OCR
router.post('/scan-voucher', voucherUpload.single('voucher'), DailySheetController.scanVoucher);

// Create daily sheet - Only authorized roles can create
router.post('/', 
    authMiddleware,
    DailySheetController.createSheet
);

// Get all daily sheets
router.get('/', DailySheetController.getSheets);

// Get project balance
router.get('/balance', DailySheetController.getProjectBalance);

// Get single sheet
router.get('/:id', DailySheetController.getSheetById);

// Update sheet
router.put('/:id', DailySheetController.updateSheet);

// Add signature
router.post('/:id/signature', DailySheetController.addSignature);

// Delete sheet
router.delete('/:id', authorize('admin', 'accountant'), DailySheetController.deleteSheet);

// Analytics & Reporting
router.get('/:id/breakdown', DailySheetController.getSheetBreakdown);
router.get('/analytics/project-stats', DailySheetController.getProjectExpenseStats);
router.get('/analytics/project-summary', DailySheetController.getProjectSummary);
router.get('/analytics/recent-activity', DailySheetController.getRecentActivity);

// PDF Generation
router.get('/:id/pdf', DailySheetController.getSheetPDF);

// Signature Workflow (using stored procedures)
router.post('/:id/sign', DailySheetController.signSheet);
router.post('/:id/reject', DailySheetController.rejectSheet);
router.post('/:id/restart-workflow', DailySheetController.restartWorkflow);

// Send sheet for signature workflow
router.post('/:id/send-for-signature', DailySheetController.sendForSignature);

// Signature Request System (NEW)
// Send request to specific role
router.post('/:id/signature-requests/send', DailySheetController.sendSignatureRequest);

// Sign sheet (when request received)
router.post('/:id/signature-requests/sign', DailySheetController.signWithRequest);

// Get signature request status
router.get('/:id/signature-requests/status', DailySheetController.getSignatureRequestStatus);

// Get my pending signature requests
router.get('/my-signature-requests', DailySheetController.getMySignatureRequests);

module.exports = router;
