const pool = require('../config/database');

exports.getProfitLoss = async (filters = {}) => {
    console.log('=== GET PROFIT/LOSS REPORT ===');
    console.log('Filters:', filters);
    
    const conditions = [];
    const values = [];

    if (filters.from_date) {
        conditions.push('date >= ?');
        values.push(filters.from_date);
    }

    if (filters.to_date) {
        conditions.push('date <= ?');
        values.push(filters.to_date);
    }

    // Income WHERE clause (for vouchers table)
    const incomeWhere = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') + ' AND voucher_type = ? AND status = ?' : 'WHERE voucher_type = ? AND status = ?';
    
    // Expense WHERE clause (for expenses table - use expense_date instead of date)
    let expenseWhere = '';
    if (conditions.length > 0) {
        const expenseConditions = conditions.map(c => c.replace('date', 'expense_date'));
        expenseWhere = 'WHERE ' + expenseConditions.join(' AND ');
    }

    console.log('Income Query:', incomeWhere);
    console.log('Expense Query:', expenseWhere);

    // Get total income from vouchers (receipt type)
    const [incomeResult] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM vouchers
        ${incomeWhere}
    `, [...values, 'receipt', 'approved']);

    // Get total expenses from expenses table
    const [expenseResult] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_expense
        FROM expenses
        ${expenseWhere}
    `, values);

    const totalIncome = parseFloat(incomeResult[0].total_income);
    const totalExpense = parseFloat(expenseResult[0].total_expense);
    const profitLoss = totalIncome - totalExpense;

    console.log('Total Income:', totalIncome);
    console.log('Total Expense:', totalExpense);
    console.log('Profit/Loss:', profitLoss);

    return {
        total_income: totalIncome,
        total_expense: totalExpense,
        profit_loss: profitLoss,
        is_profit: profitLoss >= 0
    };
};

exports.getDailyReport = async (date) => {
    const [expenses] = await pool.query(`
        SELECT 
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date = ?
    `, [date]);

    const [vouchers] = await pool.query(`
        SELECT 
            voucher_type,
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total
        FROM vouchers
        WHERE date = ?
        GROUP BY voucher_type
    `, [date]);

    const [transactions] = await pool.query(`
        SELECT 
            transaction_type,
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE transaction_date = ?
        GROUP BY transaction_type
    `, [date]);

    return {
        date,
        expenses: expenses[0],
        vouchers,
        transactions
    };
};

exports.getMonthlyReport = async (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const [expenses] = await pool.query(`
        SELECT 
            DATE(expense_date) as date,
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date BETWEEN ? AND ?
        GROUP BY DATE(expense_date)
        ORDER BY date
    `, [startDate, endDate]);

    const [summary] = await pool.query(`
        SELECT 
            category,
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date BETWEEN ? AND ?
        GROUP BY category
        ORDER BY total DESC
    `, [startDate, endDate]);

    const profitLoss = await this.getProfitLoss({
        from_date: startDate,
        to_date: endDate
    });

    return {
        period: `${year}-${String(month).padStart(2, '0')}`,
        daily_expenses: expenses,
        category_summary: summary,
        profit_loss: profitLoss
    };
};

exports.getDashboardStats = async (user = null, projectFilter = null) => {
    console.log('=== GET DASHBOARD STATS ===');
    
    // Determine project filter for ID-wise access
    let projectIdFilter = null;
    
    // Non-admin users: filter by their assigned project
    if (projectFilter && !projectFilter.isAdmin && projectFilter.projectId) {
        projectIdFilter = projectFilter.projectId;
        console.log('ID-WISE FILTER: Project ID =', projectIdFilter);
    }
    
    // Today's expenses
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    let todayExpensesQuery = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date = ?
    `;
    let todayExpensesParams = [today];
    
    if (projectIdFilter) {
        todayExpensesQuery += ' AND project_id = ?';
        todayExpensesParams.push(projectIdFilter);
    }
    
    const [todayExpenses] = await pool.query(todayExpensesQuery, todayExpensesParams);
    console.log('Today expenses:', todayExpenses[0].total);

    // Total income (approved receipts) - ID-wise
    let incomeQuery = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM vouchers
        WHERE voucher_type = 'receipt' AND status = 'approved'
    `;
    let incomeParams = [];
    
    if (projectIdFilter) {
        incomeQuery += ' AND project_id = ?';
        incomeParams.push(projectIdFilter);
    }
    
    const [monthlyIncome] = await pool.query(incomeQuery, incomeParams);
    console.log('Total income:', monthlyIncome[0].total);

    // Total expenses - ID-wise
    let expensesQuery = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
    `;
    let expensesParams = [];
    
    if (projectIdFilter) {
        expensesQuery += ' WHERE project_id = ?';
        expensesParams.push(projectIdFilter);
    }
    
    const [monthlyExpenses] = await pool.query(expensesQuery, expensesParams);
    console.log('Total expenses:', monthlyExpenses[0].total);

    // Pending vouchers - ID-wise
    let pendingVouchersQuery = `
        SELECT COUNT(*) as count
        FROM vouchers
        WHERE status = 'pending'
    `;
    let pendingVouchersParams = [];
    
    if (projectIdFilter) {
        pendingVouchersQuery += ' AND project_id = ?';
        pendingVouchersParams.push(projectIdFilter);
    }
    
    const [pendingVouchers] = await pool.query(pendingVouchersQuery, pendingVouchersParams);
    console.log('Pending vouchers:', pendingVouchers[0].count);

    // Total projects - ID-wise
    let projectsQuery = `
        SELECT COUNT(*) as count
        FROM projects
    `;
    let projectsParams = [];
    
    if (projectIdFilter) {
        projectsQuery += ' WHERE id = ?';
        projectsParams.push(projectIdFilter);
    }
    
    const [totalProjects] = await pool.query(projectsQuery, projectsParams);
    console.log('Total projects:', totalProjects[0].count);

    // Total employees - ID-wise
    let employeesQuery = `
        SELECT COUNT(*) as count
        FROM employees e
        WHERE e.status = 'active'
    `;
    let employeesParams = [];
    
    if (projectIdFilter) {
        employeesQuery += ' AND e.assigned_project_id = ?';
        employeesParams.push(projectIdFilter);
    }
    
    const [totalEmployees] = await pool.query(employeesQuery, employeesParams);
    console.log('Total employees:', totalEmployees[0].count);

    // Role-wise breakdown - ID-wise
    let roleQuery = `
        SELECT COALESCE(u.role, 'employee') as role, COUNT(*) as count
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.status = 'active'
    `;
    let roleParams = [];
    
    if (projectIdFilter) {
        roleQuery += ' AND e.assigned_project_id = ?';
        roleParams.push(projectIdFilter);
    }
    
    roleQuery += ' GROUP BY u.role ORDER BY count DESC';
    
    const [roleBreakdown] = await pool.query(roleQuery, roleParams);
    console.log('Role breakdown:', roleBreakdown.length);

    // Category-wise breakdown (all projects) - Using employee category
    const [categoryBreakdown] = await pool.query(`
        SELECT e.category, COUNT(*) as count
        FROM employees e
        WHERE e.status = 'active'
        GROUP BY e.category
        ORDER BY count DESC
    `);
    console.log('Category breakdown:', categoryBreakdown.length);

    // Project-wise breakdown with ID isolation
    const [projectBreakdown] = await pool.query(`
        SELECT 
            p.id as project_id,
            p.project_code,
            p.project_name,
            p.status,
            p.estimated_budget,
            COALESCE((
                SELECT SUM(today_expense) 
                FROM daily_sheets 
                WHERE project_id = p.id AND status = 'approved'
            ), 0) as total_expense,
            COALESCE((
                SELECT SUM(today_expense) 
                FROM daily_sheets 
                WHERE project_id = p.id AND status = 'approved'
            ), 0) as total_sheet_cost,
            (SELECT COUNT(DISTINCT e.id) 
             FROM employees e 
             WHERE e.assigned_project_id = p.id AND e.status = 'active') as employee_count
        FROM projects p
        ORDER BY p.id
    `);
    console.log('Project breakdown count:', projectBreakdown.length);

    // Get category breakdown for each project
    const projectCategoryBreakdown = await Promise.all(projectBreakdown.map(async (project) => {
        const [categories] = await pool.query(`
            SELECT e.category, COUNT(*) as count
            FROM employees e
            WHERE e.assigned_project_id = ? AND e.status = 'active'
            GROUP BY e.category
            ORDER BY count DESC
        `, [project.project_id]);
        return {
            ...project,
            category_breakdown: categories
        };
    }));

    // Expense category breakdown (where money is going)
    const [expenseByCategory] = await pool.query(`
        SELECT 
            e.category,
            COUNT(*) as count,
            COALESCE(SUM(e.amount), 0) as total_amount,
            COUNT(DISTINCT e.project_id) as projects_count
        FROM expenses e
        GROUP BY e.category
        ORDER BY total_amount DESC
    `);
    console.log('Expense categories:', expenseByCategory.length);

    // Daily sheets expense trend (last 7 days)
    const [sheetsTrend] = await pool.query(`
        SELECT 
            ds.sheet_date,
            COUNT(*) as sheet_count,
            COALESCE(SUM(ds.today_expense), 0) as daily_total
        FROM daily_sheets ds
        WHERE ds.sheet_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY ds.sheet_date
        ORDER BY ds.sheet_date ASC
    `);
    console.log('Sheets trend:', sheetsTrend.length);

    // Top expense items (highest spending)
    const [topExpenses] = await pool.query(`
        SELECT 
            e.description,
            e.category,
            e.amount,
            e.expense_date,
            p.project_name,
            p.project_code
        FROM expenses e
        LEFT JOIN projects p ON e.project_id = p.id
        ORDER BY e.amount DESC
        LIMIT 10
    `);
    console.log('Top expenses:', topExpenses.length);

    // Voucher type breakdown
    const [voucherByType] = await pool.query(`
        SELECT 
            v.voucher_type,
            COUNT(*) as count,
            COALESCE(SUM(v.amount), 0) as total_amount,
            SUM(CASE WHEN v.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN v.status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM vouchers v
        GROUP BY v.voucher_type
    `);
    console.log('Voucher types:', voucherByType.length);

    // Calculate totals from projects (ID-wise, no mixing)
    let totalBudget = 0;
    let totalExpense = 0;
    let totalIncomeCalc = 0;
    let totalEmployeesCalc = 0;

    projectBreakdown.forEach(project => {
        totalBudget += parseFloat(project.estimated_budget) || 0;
        totalExpense += parseFloat(project.total_expense) || 0;
        totalIncomeCalc += parseFloat(project.estimated_budget) || 0;
        totalEmployeesCalc += parseInt(project.employee_count) || 0;
    });

    // Get recent transactions (combine vouchers and expenses)
    const [vouchers] = await pool.query(`
        SELECT 
            id,
            date as transaction_date,
            voucher_type as transaction_type,
            amount,
            description,
            created_at
        FROM vouchers
        ORDER BY date DESC
        LIMIT 5
    `);

    const [expenses] = await pool.query(`
        SELECT 
            id,
            expense_date as transaction_date,
            'expense' as transaction_type,
            amount,
            description,
            created_at
        FROM expenses
        ORDER BY expense_date DESC
        LIMIT 5
    `);

    // Combine and sort by date
    const recentTransactions = [...vouchers, ...expenses]
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(0, 10)
        .map(t => ({
            ...t,
            amount: parseFloat(t.amount)
        }));

    // MY VOUCHERS - For worker/engineer roles (ID-wise detection)
    let myVouchers = 0;
    let myPending = 0;
    
    if (user && user.id) {
        // Get user's employee record to find their employee_id
        const [employeeRecords] = await pool.query(
            'SELECT employee_id, assigned_project_id FROM employees WHERE user_id = ? LIMIT 1',
            [user.id]
        );
        
        if (employeeRecords.length > 0) {
            const employeeId = employeeRecords[0].employee_id;
            const assignedProjectId = employeeRecords[0].assigned_project_id;
            
            console.log('📊 User employee_id:', employeeId);
            console.log('📊 Assigned project_id:', assignedProjectId);
            
            // Count all vouchers for this employee
            let myVouchersQuery = `
                SELECT COUNT(*) as count
                FROM vouchers
                WHERE employee_id = ?
            `;
            let myVouchersParams = [employeeId];
            
            // If user has assigned project, filter by project too
            if (assignedProjectId) {
                myVouchersQuery += ' AND project_id = ?';
                myVouchersParams.push(assignedProjectId);
            }
            
            const [myVouchersResult] = await pool.query(myVouchersQuery, myVouchersParams);
            myVouchers = parseInt(myVouchersResult[0].count) || 0;
            
            // Count pending vouchers for this employee
            let myPendingQuery = `
                SELECT COUNT(*) as count
                FROM vouchers
                WHERE employee_id = ? AND status = 'pending'
            `;
            let myPendingParams = [employeeId];
            
            if (assignedProjectId) {
                myPendingQuery += ' AND project_id = ?';
                myPendingParams.push(assignedProjectId);
            }
            
            const [myPendingResult] = await pool.query(myPendingQuery, myPendingParams);
            myPending = parseInt(myPendingResult[0].count) || 0;
            
            console.log('📊 My vouchers:', myVouchers);
            console.log('📊 My pending:', myPending);
        }
    }

    return {
        today_expenses: parseFloat(todayExpenses[0].total),
        monthly_income: parseFloat(monthlyIncome[0].total),
        monthly_expenses: parseFloat(monthlyExpenses[0].total),
        monthly_profit: parseFloat(monthlyIncome[0].total) - parseFloat(monthlyExpenses[0].total),
        pending_vouchers: parseInt(pendingVouchers[0].count),
        total_projects: parseInt(totalProjects[0].count),
        total_employees: parseInt(totalEmployees[0].count),
        role_breakdown: roleBreakdown.map(r => ({
            role: r.role,
            count: parseInt(r.count)
        })),
        category_breakdown: categoryBreakdown.map(c => ({
            category: c.category,
            count: parseInt(c.count)
        })),
        recent_transactions: recentTransactions,
        // Project-wise breakdown (ID-wise isolated)
        project_breakdown: projectCategoryBreakdown.map(p => {
            const totalExpense = parseFloat(p.total_expense);
            const budget = parseFloat(p.estimated_budget);
            return {
                ...p,
                estimated_budget: budget,
                total_expense: totalExpense,
                total_sheet_cost: parseFloat(p.total_sheet_cost),
                remaining_balance: budget - totalExpense,
                profit_loss: budget - totalExpense,
                employee_count: parseInt(p.employee_count),
                sheet_count: 0,
                voucher_count: 0,
                category_breakdown: p.category_breakdown.map(c => ({
                    category: c.category,
                    count: parseInt(c.count)
                }))
            };
        }),
        // Calculated totals from all projects
        all_projects_budget: totalBudget,
        all_projects_expense: totalExpense,
        all_projects_income: totalIncomeCalc,
        all_projects_employees: totalEmployeesCalc,
        // Expense analytics
        expense_by_category: expenseByCategory.map(e => ({
            ...e,
            total_amount: parseFloat(e.total_amount),
            count: parseInt(e.count),
            projects_count: parseInt(e.projects_count)
        })),
        // Daily trend (last 7 days)
        sheets_trend: sheetsTrend.map(s => ({
            ...s,
            sheet_count: parseInt(s.sheet_count),
            daily_total: parseFloat(s.daily_total)
        })),
        // Top expenses
        top_expenses: topExpenses.map(t => ({
            ...t,
            amount: parseFloat(t.amount)
        })),
        // Voucher breakdown
        voucher_by_type: voucherByType.map(v => ({
            ...v,
            total_amount: parseFloat(v.total_amount),
            count: parseInt(v.count),
            approved_count: parseInt(v.approved_count),
            pending_count: parseInt(v.pending_count)
        })),
        // User-specific voucher counts (ID-wise)
        my_vouchers: myVouchers,
        my_pending: myPending
    };
};
