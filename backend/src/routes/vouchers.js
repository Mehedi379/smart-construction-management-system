const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const voucherController = require('../controllers/voucherController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');
const { filterByProject } = require('../middleware/projectFilter');

router.use(authMiddleware);

// Apply project filter to all voucher routes
router.use(filterByProject);

// Create voucher - ANY authenticated user can create
router.post('/', 
    [
        body('voucher_type').isIn(['payment', 'expense', 'receipt', 'journal']).withMessage('Valid voucher type is required'),
        body('date').isDate().withMessage('Valid date is required'),
        body('amount').isNumeric().withMessage('Valid amount is required'),
        handleValidationErrors
    ], 
    voucherController.createVoucher
);

router.get('/', voucherController.getVouchers);
router.get('/:id', voucherController.getVoucherById);

router.put('/:id', [
    body('amount').optional().isNumeric().withMessage('Valid amount is required'),
    handleValidationErrors
], voucherController.updateVoucher);

router.delete('/:id', authorize('admin', 'accountant'), voucherController.deleteVoucher);

module.exports = router;
