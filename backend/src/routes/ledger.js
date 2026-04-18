const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ledgerController = require('../controllers/ledgerController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');

router.use(authMiddleware);

// Only admin and accountant can access ledger
router.use(authorize('admin', 'accountant'));

router.post('/accounts', [
    body('account_code').notEmpty().withMessage('Account code is required'),
    body('account_name').notEmpty().withMessage('Account name is required'),
    body('account_type').isIn(['employee', 'client', 'supplier', 'project', 'bank', 'cash', 'expense', 'income']).withMessage('Valid account type is required'),
    handleValidationErrors
], ledgerController.createAccount);

router.get('/accounts', ledgerController.getAccounts);
router.get('/balance', ledgerController.getBalanceSummary);

router.post('/entries', [
    body('account_id').isInt().withMessage('Valid account ID is required'),
    body('entry_date').isDate().withMessage('Valid date is required'),
    body('entry_type').isIn(['debit', 'credit']).withMessage('Valid entry type is required'),
    handleValidationErrors
], ledgerController.createEntry);

router.get('/:accountId', ledgerController.getLedger);

module.exports = router;
