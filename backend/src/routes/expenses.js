const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const expenseController = require('../controllers/expenseController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');
const { filterByProject } = require('../middleware/projectFilter');

router.use(authMiddleware);

// Apply project filter to all expense routes
router.use(filterByProject);

// All authenticated users can view expenses
router.get('/', expenseController.getExpenses);
router.get('/summary', expenseController.getExpenseSummary);

// Only admin, accountant, and engineer can create expenses
router.post('/', authorize('admin', 'accountant', 'engineer'), [
    body('expense_date').isDate().withMessage('Valid date is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    handleValidationErrors
], expenseController.createExpense);

router.delete('/:id', authorize('admin', 'accountant'), expenseController.deleteExpense);

// Update expense (admin and accountant only)
router.put('/:id', authorize('admin', 'accountant'), [
    body('expense_date').optional().isDate().withMessage('Valid date is required'),
    body('category').optional().notEmpty().withMessage('Category is required'),
    body('amount').optional().isNumeric().withMessage('Valid amount is required'),
    handleValidationErrors
], expenseController.updateExpense);

module.exports = router;
