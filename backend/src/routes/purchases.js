const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');

router.use(authMiddleware);

// Supplier Routes
router.post('/suppliers', [
    body('shop_name').notEmpty().withMessage('Shop name is required'),
    handleValidationErrors
], supplierController.createSupplier);

router.get('/suppliers', supplierController.getSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.put('/suppliers/:id', supplierController.updateSupplier);

// Purchase Routes
router.post('/purchases', [
    body('purchase_date').isDate().withMessage('Valid date is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('total_amount').isNumeric().withMessage('Valid amount is required'),
    handleValidationErrors
], supplierController.createPurchase);

router.get('/purchases', supplierController.getPurchases);
router.get('/purchases/:id', supplierController.getPurchaseById);
router.get('/summary', supplierController.getPurchaseSummary);

// Payment Routes
router.post('/payments', [
    body('supplier_id').isInt().withMessage('Valid supplier ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    handleValidationErrors
], supplierController.addPayment);

module.exports = router;
