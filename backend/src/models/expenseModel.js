const pool = require('../config/database');

exports.createExpense = async (expenseData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO expenses (
                expense_date, category, subcategory, amount, description,
                project_id, voucher_id, paid_to, payment_method, receipt_image, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                expenseData.expense_date,
                expenseData.category,
                expenseData.subcategory || null,
                expenseData.amount,
                expenseData.description || null,
                expenseData.project_id || null,
                expenseData.voucher_id || null,
                expenseData.paid_to || null,
                expenseData.payment_method || 'cash',
                expenseData.receipt_image || null,
                expenseData.created_by
            ]
        );

        // Create ledger entry
        if (expenseData.account_id) {
            await conn.query(
                `INSERT INTO ledger_entries (
                    account_id, entry_date, expense_id, description,
                    debit_amount, credit_amount, balance, entry_type,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, 0, 'debit', ?)`,
                [
                    expenseData.account_id,
                    expenseData.expense_date,
                    result.insertId,
                    expenseData.description || 'Expense entry',
                    expenseData.amount,
                    0,
                    expenseData.created_by
                ]
            );

            await conn.query(
                `UPDATE ledger_accounts 
                 SET current_balance = current_balance + ? 
                 WHERE id = ?`,
                [expenseData.amount, expenseData.account_id]
            );
        }

        await conn.commit();
        return result.insertId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getExpenses = async (filters = {}, user = null, projectFilter = null) => {
    let query = `SELECT e.*, p.project_name, u.name as created_by_name 
                 FROM expenses e 
                 LEFT JOIN projects p ON e.project_id = p.id
                 LEFT JOIN users u ON e.created_by = u.id`;
    
    const conditions = [];
    const values = [];

    // PROJECT-BASED FILTERING (from middleware)
    // Non-admin users can only see expenses from their assigned project
    if (projectFilter && !projectFilter.isAdmin && projectFilter.projectId) {
        conditions.push('e.project_id = ?');
        values.push(projectFilter.projectId);
    } else if (user && user.role !== 'admin' && !projectFilter) {
        // Fallback to old method if projectFilter not provided
        query += ` INNER JOIN employees emp ON emp.user_id = ? AND e.project_id = emp.assigned_project_id `;
        values.push(user.id);
    }

    if (filters.from_date) {
        conditions.push('e.expense_date >= ?');
        values.push(filters.from_date);
    }

    if (filters.to_date) {
        conditions.push('e.expense_date <= ?');
        values.push(filters.to_date);
    }

    if (filters.category) {
        conditions.push('e.category = ?');
        values.push(filters.category);
    }

    if (filters.project_id) {
        conditions.push('e.project_id = ?');
        values.push(filters.project_id);
    }

    if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
    } else if (user && user.role !== 'admin') {
        // If no other conditions but user is non-admin
        // (already added INNER JOIN above)
    } else {
        query += ' WHERE 1=1';
    }

    query += ' ORDER BY e.expense_date DESC, e.id DESC';

    if (filters.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(filters.limit));
        if (filters.offset) {
            query += ' OFFSET ?';
            values.push(parseInt(filters.offset));
        }
    }

    const [expenses] = await pool.query(query, values);
    return expenses;
};

exports.getExpenseSummary = async (filters = {}) => {
    let query = `SELECT 
                    category,
                    COUNT(*) as count,
                    SUM(amount) as total_amount
                 FROM expenses`;
    
    const conditions = [];
    const values = [];

    if (filters.from_date) {
        conditions.push('expense_date >= ?');
        values.push(filters.from_date);
    }

    if (filters.to_date) {
        conditions.push('expense_date <= ?');
        values.push(filters.to_date);
    }

    if (filters.project_id) {
        conditions.push('project_id = ?');
        values.push(filters.project_id);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY category ORDER BY total_amount DESC';

    const [summary] = await pool.query(query, values);
    return summary;
};

exports.deleteExpense = async (id) => {
    const [result] = await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

exports.updateExpense = async (id, expenseData) => {
    const fields = [];
    const values = [];

    // Build dynamic update query
    if (expenseData.expense_date) {
        fields.push('expense_date = ?');
        values.push(expenseData.expense_date);
    }
    if (expenseData.category) {
        fields.push('category = ?');
        values.push(expenseData.category);
    }
    if (expenseData.subcategory !== undefined) {
        fields.push('subcategory = ?');
        values.push(expenseData.subcategory);
    }
    if (expenseData.amount) {
        fields.push('amount = ?');
        values.push(expenseData.amount);
    }
    if (expenseData.description !== undefined) {
        fields.push('description = ?');
        values.push(expenseData.description);
    }
    if (expenseData.project_id !== undefined) {
        fields.push('project_id = ?');
        values.push(expenseData.project_id);
    }
    if (expenseData.paid_to !== undefined) {
        fields.push('paid_to = ?');
        values.push(expenseData.paid_to);
    }
    if (expenseData.payment_method) {
        fields.push('payment_method = ?');
        values.push(expenseData.payment_method);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(id);

    const [result] = await pool.query(
        `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};
