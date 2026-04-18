const pool = require('../config/database');

exports.createProject = async (projectData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Generate sequential project code if not provided (PRJ001, PRJ002, etc.)
        let projectCode = projectData.project_code || projectData.project_id;
        if (!projectCode) {
            const [lastProject] = await conn.query(
                `SELECT project_code FROM projects ORDER BY id DESC LIMIT 1`
            );
            
            let nextNum = 1;
            if (lastProject.length > 0) {
                const lastCode = lastProject[0].project_code;
                const match = lastCode.match(/\d+/);
                if (match) {
                    nextNum = parseInt(match[0]) + 1;
                }
            }
            projectCode = `PRJ${String(nextNum).padStart(3, '0')}`;
        }
        
        const projectName = projectData.project_name || projectData.name;
        const budget = projectData.estimated_budget || projectData.budget || 0;
        const status = projectData.status || 'ongoing'; // Use status from form data, default to 'ongoing'
        
        const [result] = await conn.query(
            `INSERT INTO projects (
                project_code, project_name, client_id, location, description,
                estimated_budget, start_date, end_date, status, created_by
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectCode,
                projectName,
                projectData.location || null,
                projectData.description || null,
                budget,
                projectData.start_date || new Date(),
                projectData.end_date || null,
                status,
                projectData.created_by
            ]
        );

        await conn.commit();
        return { id: result.insertId, project_code: projectCode };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getProjects = async (filters = {}, user = null) => {
    let query = `SELECT p.* FROM projects p`;
    
    // ROLE-BASED FILTERING
    // For non-admin users, join with employees table to filter by assigned project
    if (user && user.role !== 'admin') {
        query += ` INNER JOIN employees emp ON p.id = emp.assigned_project_id AND emp.user_id = ?`;
    }
    
    query += ` WHERE 1=1`;
    const params = user && user.role !== 'admin' ? [user.id] : [];

    if (filters.status) {
        query += ' AND p.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    
    // Get stats for each project using subqueries to avoid Cartesian product
    const projectsWithStats = await Promise.all(rows.map(async (project) => {
        const [[expenseRow]] = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE project_id = ?',
            [project.id]
        );
        const [[incomeRow]] = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM vouchers WHERE project_id = ? AND voucher_type = ? AND status = ?',
            [project.id, 'receipt', 'approved']
        );
        const [[workerRow]] = await pool.query(
            'SELECT COUNT(DISTINCT employee_id) as count FROM vouchers WHERE project_id = ? AND employee_id IS NOT NULL',
            [project.id]
        );
        
        return {
            ...project,
            total_expense: parseFloat(expenseRow.total),
            total_income: parseFloat(incomeRow.total),
            profit_loss: parseFloat(incomeRow.total) - parseFloat(expenseRow.total),
            worker_count: parseInt(workerRow.count) || 0
        };
    }));
    
    return projectsWithStats;
};

exports.getProjectById = async (id) => {
    const [projects] = await pool.query(`
        SELECT p.*, 
               COALESCE((SELECT SUM(amount) FROM expenses WHERE project_id = p.id), 0) as total_expense,
               COALESCE((SELECT SUM(today_expense) FROM daily_sheets WHERE project_id = p.id AND status = 'approved'), 0) as total_sheet_cost,
               COALESCE((SELECT SUM(today_expense) FROM daily_sheets WHERE project_id = p.id), 0) as total_sheet_cost_all,
               (p.estimated_budget - 
                COALESCE((SELECT SUM(today_expense) FROM daily_sheets WHERE project_id = p.id AND status = 'approved'), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE project_id = p.id), 0)
               ) as remaining_balance,
               (p.estimated_budget - 
                COALESCE((SELECT SUM(today_expense) FROM daily_sheets WHERE project_id = p.id AND status = 'approved'), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE project_id = p.id), 0)
               ) as profit_loss,
               (SELECT COUNT(DISTINCT e.id) FROM employees e WHERE e.assigned_project_id = p.id AND e.status = 'active') as worker_count,
               (SELECT COUNT(*) FROM daily_sheets WHERE project_id = p.id) as sheet_count
        FROM projects p 
        WHERE p.id = ?
    `, [id]);
    
    if (projects.length === 0) return null;
    
    const project = projects[0];
    return {
        ...project,
        estimated_budget: parseFloat(project.estimated_budget),
        total_expense: parseFloat(project.total_expense),
        total_sheet_cost: parseFloat(project.total_sheet_cost),
        total_sheet_cost_all: parseFloat(project.total_sheet_cost_all),
        remaining_balance: parseFloat(project.remaining_balance),
        profit_loss: parseFloat(project.profit_loss),
        worker_count: parseInt(project.worker_count) || 0,
        sheet_count: parseInt(project.sheet_count) || 0,
        sheet_count: parseInt(project.sheet_count) || 0
    };
};

exports.updateProject = async (id, projectData) => {
    // Use correct column names from database
    const projectName = projectData.project_name || projectData.name;
    const budget = projectData.estimated_budget || projectData.budget;
    const projectCode = projectData.project_code || projectData.project_id;
    
    await pool.query(
        `UPDATE projects SET 
            project_code = COALESCE(?, project_code),
            project_name = ?, location = ?, description = ?,
            estimated_budget = ?, start_date = ?, end_date = ?, status = ?
         WHERE id = ?`,
        [
            projectCode,
            projectName,
            projectData.location,
            projectData.description,
            budget,
            projectData.start_date,
            projectData.end_date,
            projectData.status,
            id
        ]
    );
    return { id };
};

exports.deleteProject = async (id) => {
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return { id };
};

exports.getProjectStats = async (projectId) => {
    // Get total expenses
    const [expenses] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_expense 
         FROM expenses WHERE project_id = ?`,
        [projectId]
    );

    // Get total income
    const [income] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_income 
         FROM vouchers WHERE project_id = ? AND voucher_type = 'receipt'`,
        [projectId]
    );

    // Get active workers count
    const [workers] = await pool.query(
        `SELECT COUNT(DISTINCT e.id) as worker_count 
         FROM employees e 
         WHERE e.assigned_project_id = ? AND e.status = 'active'`,
        [projectId]
    );

    // Get voucher count
    const [vouchers] = await pool.query(
        `SELECT COUNT(*) as voucher_count 
         FROM vouchers WHERE project_id = ?`,
        [projectId]
    );

    return {
        total_expense: parseFloat(expenses[0].total_expense),
        total_income: parseFloat(income[0].total_income),
        profit_loss: parseFloat(income[0].total_income) - parseFloat(expenses[0].total_expense),
        worker_count: workers[0].worker_count,
        voucher_count: vouchers[0].voucher_count
    };
};

exports.getAllProjectsSummary = async () => {
    const [projects] = await pool.query('SELECT * FROM projects WHERE status = "active"');
    
    const summary = await Promise.all(projects.map(async (project) => {
        const stats = await this.getProjectStats(project.id);
        return {
            ...project,
            ...stats
        };
    }));

    return summary;
};
