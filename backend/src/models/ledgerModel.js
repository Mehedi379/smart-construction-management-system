const pool = require('../config/database');

exports.createAccount = async (accountData) => {
    const [result] = await pool.query(
        `INSERT INTO ledger_accounts (
            account_code, account_name, account_type, reference_id,
            opening_balance, current_balance, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            accountData.account_code,
            accountData.account_name,
            accountData.account_type,
            accountData.reference_id || null,
            accountData.opening_balance || 0,
            accountData.opening_balance || 0,
            accountData.status || 'active',
            accountData.notes || null
        ]
    );
    return result.insertId;
};

exports.getAccounts = async (filters = {}) => {
    let query = 'SELECT * FROM ledger_accounts';
    const conditions = [];
    const values = [];

    if (filters.account_type) {
        conditions.push('account_type = ?');
        values.push(filters.account_type);
    }

    if (filters.status) {
        conditions.push('status = ?');
        values.push(filters.status);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY account_name ASC';

    const [accounts] = await pool.query(query, values);
    return accounts;
};

exports.getAccountById = async (id) => {
    const [accounts] = await pool.query('SELECT * FROM ledger_accounts WHERE id = ?', [id]);
    return accounts[0] || null;
};

exports.getLedgerEntries = async (accountId, filters = {}) => {
    let query = `SELECT le.*, v.voucher_no, v.voucher_type, e.expense_date, e.category as expense_category
                 FROM ledger_entries le
                 LEFT JOIN vouchers v ON le.voucher_id = v.id
                 LEFT JOIN expenses e ON le.expense_id = e.id
                 WHERE le.account_id = ?`;
    
    const values = [accountId];

    if (filters.from_date) {
        query += ' AND le.entry_date >= ?';
        values.push(filters.from_date);
    }

    if (filters.to_date) {
        query += ' AND le.entry_date <= ?';
        values.push(filters.to_date);
    }

    query += ' ORDER BY le.entry_date ASC, le.id ASC';

    const [entries] = await pool.query(query, values);

    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = entries.map(entry => {
        if (entry.entry_type === 'debit') {
            runningBalance += entry.debit_amount - entry.credit_amount;
        } else {
            runningBalance -= entry.credit_amount - entry.debit_amount;
        }
        return {
            ...entry,
            running_balance: runningBalance
        };
    });

    return entriesWithBalance;
};

exports.createEntry = async (entryData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO ledger_entries (
                account_id, entry_date, voucher_id, expense_id, description,
                debit_amount, credit_amount, balance, entry_type,
                reference_no, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
            [
                entryData.account_id,
                entryData.entry_date,
                entryData.voucher_id || null,
                entryData.expense_id || null,
                entryData.description || null,
                entryData.debit_amount || 0,
                entryData.credit_amount || 0,
                entryData.entry_type,
                entryData.reference_no || null,
                entryData.created_by
            ]
        );

        // Update account balance
        const balanceChange = entryData.entry_type === 'debit' 
            ? (entryData.debit_amount - entryData.credit_amount)
            : -(entryData.credit_amount - entryData.debit_amount);

        await conn.query(
            `UPDATE ledger_accounts 
             SET current_balance = current_balance + ? 
             WHERE id = ?`,
            [balanceChange, entryData.account_id]
        );

        await conn.commit();
        return result.insertId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getBalanceSummary = async () => {
    const [summary] = await pool.query(`
        SELECT 
            account_type,
            COUNT(*) as account_count,
            SUM(opening_balance) as total_opening,
            SUM(current_balance) as total_current
        FROM ledger_accounts
        WHERE status = 'active'
        GROUP BY account_type
    `);

    const [totals] = await pool.query(`
        SELECT 
            SUM(current_balance) as grand_total
        FROM ledger_accounts
        WHERE status = 'active'
    `);

    return {
        byType: summary,
        grandTotal: totals[0].grand_total || 0
    };
};
