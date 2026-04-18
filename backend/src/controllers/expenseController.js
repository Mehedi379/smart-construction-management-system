const expenseModel = require('../models/expenseModel');

exports.createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            created_by: req.user.id
        };

        const expenseId = await expenseModel.createExpense(expenseData);

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: { id: expenseId }
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expense',
            error: error.message
        });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const filters = {
            from_date: req.query.from_date,
            to_date: req.query.to_date,
            category: req.query.category,
            project_id: req.query.project_id,
            limit: req.query.limit,
            offset: req.query.offset
        };

        // Pass project filter from middleware
        const expenses = await expenseModel.getExpenses(filters, req.user, req.projectFilter);

        res.json({
            success: true,
            data: expenses
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses'
        });
    }
};

exports.getExpenseSummary = async (req, res) => {
    try {
        const filters = {
            from_date: req.query.from_date,
            to_date: req.query.to_date,
            project_id: req.query.project_id
        };

        const summary = await expenseModel.getExpenseSummary(filters);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get expense summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense summary'
        });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const deleted = await expenseModel.deleteExpense(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete expense'
        });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const updated = await expenseModel.updateExpense(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found or not updated'
            });
        }

        res.json({
            success: true,
            message: 'Expense updated successfully'
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense'
        });
    }
};
