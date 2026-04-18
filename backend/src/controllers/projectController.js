const projectModel = require('../models/projectModel');
const ProjectAccountService = require('../services/projectAccountService');
const FinancialEngine = require('../services/financialEngine');

// Get active projects (public endpoint - no auth required)
// Only returns projects with status 'planning' or 'ongoing' for registration
exports.getActiveProjects = async (req, res) => {
    try {
        const pool = require('../config/database');
        const [projects] = await pool.query(
            `SELECT id, project_code, project_name, location, status 
             FROM projects 
             WHERE status IN ('ongoing', 'planning')
             ORDER BY project_name ASC`
        );
        
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: error.message
        });
    }
};

exports.createProject = async (req, res) => {
    try {
        console.log('📝 Creating project with data:', req.body);
        
        // Create project
        const result = await projectModel.createProject({
            ...req.body,
            created_by: req.user.id
        });

        console.log('✅ Project created:', result);
        
        // Auto-create default accounts for the project
        try {
            await ProjectAccountService.createDefaultAccounts(result.id, req.body.project_name);
            console.log('✅ Default accounts created for project', result.id);
        } catch (accountError) {
            console.error('⚠️  Account creation warning:', accountError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Project created successfully with default accounts',
            data: result
        });
    } catch (error) {
        console.error('❌ Failed to create project:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create project: ' + error.message,
            error: error.message
        });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const projects = await projectModel.getProjects(req.query, req.user);
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: error.message
        });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const project = await projectModel.getProjectById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const stats = await projectModel.getProjectStats(project.id);
        
        res.json({
            success: true,
            data: { ...project, ...stats }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: error.message
        });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const result = await projectModel.updateProject(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Project updated successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update project',
            error: error.message
        });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        await projectModel.deleteProject(req.params.id);
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete project',
            error: error.message
        });
    }
};

exports.getProjectsSummary = async (req, res) => {
    try {
        const summary = await projectModel.getAllProjectsSummary();
        
        // Calculate totals
        const totals = summary.reduce((acc, project) => ({
            total_projects: acc.total_projects + 1,
            total_income: acc.total_income + project.total_income,
            total_expense: acc.total_expense + project.total_expense,
            total_workers: acc.total_workers + project.worker_count
        }), {
            total_projects: 0,
            total_income: 0,
            total_expense: 0,
            total_workers: 0
        });

        res.json({
            success: true,
            data: {
                projects: summary,
                totals: {
                    ...totals,
                    overall_profit: totals.total_income - totals.total_expense
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects summary',
            error: error.message
        });
    }
};

// Get enhanced project dashboard (with role counts, financial summary, engineer activity)
exports.getProjectDashboard = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = require('../config/database');

        // Get project details
        const [projects] = await pool.query(
            `SELECT * FROM projects WHERE id = ?`,
            [id]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const project = projects[0];

        // Get employee count by role
        const [employeeCounts] = await pool.query(
            `SELECT 
                u.role,
                COUNT(*) as count
             FROM employees e
             INNER JOIN users u ON e.user_id = u.id
             WHERE e.assigned_project_id = ?
             GROUP BY u.role`,
            [id]
        );

        // Convert to object
        const roleCounts = {
            admin: 0,
            accountant: 0,
            engineer: 0,
            viewer: 0,
            total: 0
        };

        employeeCounts.forEach(row => {
            roleCounts[row.role] = parseInt(row.count);
            roleCounts.total += parseInt(row.count);
        });

        // Get financial summary
        const [financialSummary] = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN voucher_type = 'receipt' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN voucher_type = 'payment' THEN amount ELSE 0 END), 0) as total_expense,
                COUNT(*) as total_vouchers,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_vouchers,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_vouchers,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_vouchers
             FROM vouchers
             WHERE project_id = ?`,
            [id]
        );

        // Get daily sheet stats
        const [sheetStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_sheets,
                SUM(CASE WHEN is_locked = TRUE THEN 1 ELSE 0 END) as locked_sheets,
                SUM(CASE WHEN is_locked = FALSE THEN 1 ELSE 0 END) as unlocked_sheets
             FROM daily_sheets
             WHERE project_id = ?`,
            [id]
        );

        // Get engineer activity (voucher count per engineer)
        const [engineerActivity] = await pool.query(
            `SELECT 
                u.id as user_id,
                u.name as engineer_name,
                u.email as engineer_email,
                COUNT(DISTINCT v.id) as voucher_count,
                COALESCE(SUM(v.amount), 0) as total_voucher_amount,
                COUNT(DISTINCT ds.id) as sheet_count
             FROM employees e
             INNER JOIN users u ON e.user_id = u.id
             LEFT JOIN vouchers v ON v.created_by = u.id AND v.project_id = ?
             LEFT JOIN daily_sheets ds ON ds.created_by = u.id AND ds.project_id = ?
             WHERE e.assigned_project_id = ? AND u.role = 'engineer'
             GROUP BY u.id, u.name, u.email
             ORDER BY voucher_count DESC`,
            [id, id, id]
        );

        // Get monthly expense trend (last 6 months)
        const [monthlyTrend] = await pool.query(
            `SELECT 
                DATE_FORMAT(voucher_date, '%Y-%m') as month,
                SUM(CASE WHEN voucher_type = 'receipt' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN voucher_type = 'payment' THEN amount ELSE 0 END) as expense
             FROM vouchers
             WHERE project_id = ? 
                AND voucher_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(voucher_date, '%Y-%m')
             ORDER BY month ASC`,
            [id]
        );

        // Get recent activities
        const [recentActivities] = await pool.query(
            `(SELECT 
                'voucher' as type,
                v.voucher_no as ref_no,
                v.description,
                v.amount,
                v.status,
                v.created_at,
                u.name as created_by
             FROM vouchers v
             LEFT JOIN users u ON v.created_by = u.id
             WHERE v.project_id = ?
             ORDER BY v.created_at DESC
             LIMIT 5)
             UNION ALL
             (SELECT 
                'sheet' as type,
                ds.sheet_no as ref_no,
                ds.location as description,
                ds.today_expense as amount,
                ds.status,
                ds.created_at,
                u.name as created_by
             FROM daily_sheets ds
             LEFT JOIN users u ON ds.created_by = u.id
             WHERE ds.project_id = ?
             ORDER BY ds.created_at DESC
             LIMIT 5)
             ORDER BY created_at DESC
             LIMIT 10`,
            [id, id]
        );

        // Calculate profit/loss
        const totalIncome = parseFloat(financialSummary[0].total_income) || 0;
        const totalExpense = parseFloat(financialSummary[0].total_expense) || 0;
        const profitLoss = totalIncome - totalExpense;

        res.json({
            success: true,
            data: {
                project: {
                    id: project.id,
                    project_name: project.project_name,
                    project_code: project.project_code,
                    location: project.location,
                    budget: project.budget,
                    status: project.status,
                    start_date: project.start_date,
                    end_date: project.end_date,
                    description: project.description
                },
                employee_counts: roleCounts,
                financial_summary: {
                    total_income: totalIncome,
                    total_expense: totalExpense,
                    profit_loss: profitLoss,
                    profit_loss_status: profitLoss >= 0 ? 'profit' : 'loss',
                    total_vouchers: parseInt(financialSummary[0].total_vouchers),
                    approved_vouchers: parseInt(financialSummary[0].approved_vouchers),
                    pending_vouchers: parseInt(financialSummary[0].pending_vouchers),
                    rejected_vouchers: parseInt(financialSummary[0].rejected_vouchers)
                },
                sheet_stats: {
                    total_sheets: parseInt(sheetStats[0].total_sheets),
                    locked_sheets: parseInt(sheetStats[0].locked_sheets),
                    unlocked_sheets: parseInt(sheetStats[0].unlocked_sheets)
                },
                engineer_activity: engineerActivity,
                monthly_trend: monthlyTrend,
                recent_activities: recentActivities
            }
        });

    } catch (error) {
        console.error('Get project dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project dashboard',
            error: error.message
        });
    }
};

// Get project financial summary (real-time calculation)
exports.getProjectFinancials = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Calculate real-time financials
        const financials = await FinancialEngine.calculateProjectFinancials(id);
        
        res.json({
            success: true,
            data: financials
        });
    } catch (error) {
        console.error('Get project financials error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project financials',
            error: error.message
        });
    }
};

// Get global projects summary (Admin only)
exports.getProjectsSummary = async (req, res) => {
    try {
        // Get global summary
        const summary = await FinancialEngine.getGlobalSummary();
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get projects summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects summary',
            error: error.message
        });
    }
};

// Get category-wise employees for a project
exports.getProjectCategories = async (req, res) => {
    try {
        const { id } = req.params;
        
        const breakdown = await ProjectAccountService.getCategoryBreakdown(id);
        
        res.json({
            success: true,
            data: breakdown
        });
    } catch (error) {
        console.error('Get project categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project categories',
            error: error.message
        });
    }
};

// Get category-wise employee statistics for a project
exports.getProjectCategoryStats = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('\n📊 GET /api/projects/:id/category-stats called');
        console.log('📊 Project ID:', id);
        
        const pool = require('../config/database');
        
        // Get employee counts by category for this project
        const [stats] = await pool.query(
            `SELECT 
                e.category,
                COUNT(*) as count
            FROM employees e
            WHERE e.assigned_project_id = ?
            AND e.status = 'active'
            GROUP BY e.category`,
            [id]
        );
        
        console.log('📊 Query result:', stats);
        
        // Convert to object format with lowercase keys
        const categoryStats = {};
        stats.forEach(row => {
            if (row.category) {
                // Store with original case and lowercase for flexibility
                categoryStats[row.category] = row.count;
                categoryStats[row.category.toLowerCase()] = row.count;
            }
        });
        
        console.log('📊 Category stats object:', JSON.stringify(categoryStats, null, 2));
        console.log('✅ Category stats sent successfully\n');
        
        res.json({
            success: true,
            data: categoryStats
        });
    } catch (error) {
        console.error('❌ Get category stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category statistics',
            error: error.message
        });
    }
};
