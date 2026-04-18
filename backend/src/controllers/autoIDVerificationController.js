// ============================================
// AUTOMATIC ID VERIFICATION CONTROLLER
// Smart Construction Management System
// ============================================

const AutoIDVerificationService = require('../services/autoIDVerificationService');

/**
 * Run complete ID verification
 * GET /api/admin/ids/auto-verify
 */
exports.runAutoVerification = async (req, res) => {
    try {
        const results = await AutoIDVerificationService.runCompleteVerification();
        
        res.json({
            success: true,
            message: 'Automatic ID verification completed',
            data: results
        });
    } catch (error) {
        console.error('Auto verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run auto verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get comprehensive health report
 * GET /api/admin/ids/health-report
 */
exports.getHealthReport = async (req, res) => {
    try {
        const report = await AutoIDVerificationService.getHealthReport();
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Health report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate health report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get role verification details
 * GET /api/admin/ids/role-verification
 */
exports.getRoleVerification = async (req, res) => {
    try {
        const pool = require('../config/database');
        
        // Get all users with their role details and project assignments
        const [users] = await pool.query(
            `SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.role,
                u.is_approved,
                u.is_active,
                u.status,
                u.created_at,
                u.last_login,
                e.employee_id,
                e.assigned_project_id,
                e.designation,
                e.category,
                p.project_code,
                p.project_name,
                CASE 
                    WHEN u.role = 'admin' THEN 'GLOBAL ACCESS'
                    ELSE 'PROJECT-SPECIFIC'
                END as access_level
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             ORDER BY 
                 FIELD(u.role,
                     'admin',
                     'project_director',
                     'head_office_accounts_1',
                     'head_office_accounts_2',
                     'deputy_head_office',
                     'site_director',
                     'deputy_director',
                     'site_manager',
                     'accountant',
                     'site_engineer',
                     'engineer',
                     'employee'
                 ),
                 u.email`
        );

        // Get role hierarchy
        const [roles] = await pool.query(
            `SELECT 
                'admin' as role, 'Administrator' as display_name, 
                'Global Access - Can see all projects and manage system' as description,
                1 as hierarchy_level, 'GLOBAL' as access_type
             UNION ALL
             SELECT 'head_office_accounts_1', 'Head Office Accounts 1', 'Project-specific accounts role - Primary', 2, 'PROJECT'
             UNION ALL
             SELECT 'head_office_accounts_2', 'Head Office Accounts 2', 'Project-specific accounts role - Secondary', 2, 'PROJECT'
             UNION ALL
             SELECT 'deputy_head_office', 'Deputy Head Office', 'Project-specific deputy director role', 3, 'PROJECT'
             UNION ALL
             SELECT 'site_manager', 'Site Manager', 'Project-specific site management', 4, 'PROJECT'
             UNION ALL
             SELECT 'site_engineer', 'Site Engineer', 'Project-specific engineering role', 5, 'PROJECT'
             UNION ALL
             SELECT 'site_director', 'Site Director', 'Project-specific director role', 3, 'PROJECT'
             UNION ALL
             SELECT 'deputy_director', 'Deputy Director', 'Project-specific deputy director', 3, 'PROJECT'
             UNION ALL
             SELECT 'project_director', 'Project Director', 'Project-specific project director', 2, 'PROJECT'
             UNION ALL
             SELECT 'engineer', 'Engineer', 'Project-specific engineering staff', 5, 'PROJECT'
             UNION ALL
             SELECT 'accountant', 'Accountant', 'Project-specific accounting staff', 4, 'PROJECT'
             UNION ALL
             SELECT 'employee', 'Employee', 'Project-specific general employee', 6, 'PROJECT'
             ORDER BY hierarchy_level`
        );

        res.json({
            success: true,
            data: {
                users,
                roles,
                total_users: users.length,
                roles_defined: roles.length
            }
        });
    } catch (error) {
        console.error('Role verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get role verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Fix missing project assignments
 * POST /api/admin/ids/fix-project-assignments
 */
exports.fixProjectAssignments = async (req, res) => {
    const conn = await require('../config/database').getConnection();
    
    try {
        await conn.beginTransaction();

        const { projectId } = req.body;

        if (!projectId) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        // Verify project exists
        const [projects] = await conn.query('SELECT id FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Find users without project assignments
        const [usersWithoutProjects] = await conn.query(
            `SELECT u.id, u.email, u.role
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             WHERE u.is_approved = TRUE
             AND u.role != 'admin'
             AND (e.assigned_project_id IS NULL OR e.id IS NULL)`
        );

        const fixed = [];

        for (const user of usersWithoutProjects) {
            // Check if employee record exists
            const [employees] = await conn.query(
                'SELECT id FROM employees WHERE user_id = ?',
                [user.id]
            );

            if (employees.length > 0) {
                // Update existing employee record
                await conn.query(
                    'UPDATE employees SET assigned_project_id = ? WHERE user_id = ?',
                    [projectId, user.id]
                );
            } else {
                // Create new employee record
                const employeeId = `EMP${String(user.id).padStart(4, '0')}`;
                await conn.query(
                    `INSERT INTO employees (
                        user_id, employee_id, name, phone,
                        designation, category, department,
                        assigned_project_id, status, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
                    [user.id, employeeId, user.email, '', user.role, user.role, user.role, projectId, user.id]
                );
            }

            fixed.push({
                user_id: user.id,
                email: user.email,
                role: user.role,
                assigned_project_id: projectId
            });
        }

        await conn.commit();

        res.json({
            success: true,
            message: `Fixed ${fixed.length} users`,
            data: {
                fixed_count: fixed.length,
                users: fixed
            }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Fix project assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix project assignments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};
