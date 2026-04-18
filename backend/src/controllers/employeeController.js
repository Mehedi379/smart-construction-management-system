// ============================================
// PRODUCTION-READY EMPLOYEE CONTROLLER
// Smart Construction Management System
// ============================================

const pool = require('../config/database');

/**
 * Get All Employees (APPROVED ONLY) with Pagination
 * GET /api/employees?page=1&limit=20&status=active&category=Labor
 */
/**
 * Register New Employee (Admin Only)
 */
exports.registerEmployee = async (req, res) => {
    try {
        // Note: Employee registration is handled through auth/register with approval system
        // This endpoint is kept for compatibility but employees should register through the public registration
        res.status(400).json({
            success: false,
            message: 'Employees should register through the public registration page with admin approval'
        });
    } catch (error) {
        console.error('Register employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register employee',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            category, 
            department,
            project_id,
            search,
            orderBy = 'name',
            sort = 'asc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build WHERE clause
        let whereClause = `WHERE u.is_approved = TRUE AND u.is_active = TRUE`;
        const values = [];

        if (status) {
            whereClause += ' AND e.status = ?';
            values.push(status);
        }

        if (category) {
            whereClause += ' AND e.category = ?';
            values.push(category);
        }

        if (department) {
            whereClause += ' AND e.department = ?';
            values.push(department);
        }

        if (project_id) {
            whereClause += ' AND e.assigned_project_id = ?';
            values.push(project_id);
        }

        if (search) {
            whereClause += ' AND (e.name LIKE ? OR e.employee_id LIKE ? OR e.phone LIKE ?)';
            const searchTerm = `%${search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        // Get employees with pagination
        const [employees] = await pool.query(
            `SELECT 
                e.*,
                u.email,
                u.role,
                u.phone as user_phone,
                p.project_name,
                p.project_code
             FROM employees e
             INNER JOIN users u ON e.user_id = u.id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             ${whereClause}
             ORDER BY e.${orderBy} ${sort === 'desc' ? 'DESC' : 'ASC'}
             LIMIT ? OFFSET ?`,
            [...values, parseInt(limit), offset]
        );

        // Get total count
        const [totalResult] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM employees e
             INNER JOIN users u ON e.user_id = u.id
             ${whereClause}`,
            values
        );

        const total = totalResult[0].total;

        res.json({
            success: true,
            data: employees,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_items: total,
                items_per_page: parseInt(limit),
                has_next: offset + employees.length < total,
                has_prev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employees',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get Employee by ID
 * GET /api/employees/:id
 */
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [employees] = await pool.query(
            `SELECT 
                e.*,
                u.email,
                u.role,
                u.is_approved,
                u.is_active,
                p.project_name,
                p.project_code
             FROM employees e
             INNER JOIN users u ON e.user_id = u.id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             WHERE e.id = ?`,
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: employees[0]
        });

    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get Employee Statistics
 * GET /api/employees/stats
 */
exports.getEmployeeStats = async (req, res) => {
    try {
        // Total approved employees
        const [totalResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.is_approved = TRUE AND u.is_active = TRUE
        `);

        // Employees by project
        const [byProject] = await pool.query(`
            SELECT 
                p.id as project_id,
                p.project_name,
                p.project_code,
                COUNT(e.id) as employee_count
            FROM projects p
            LEFT JOIN employees e ON p.id = e.assigned_project_id
            LEFT JOIN users u ON e.user_id = u.id 
                AND u.is_approved = TRUE 
                AND u.is_active = TRUE
            WHERE p.status IN ('ongoing', 'planning')
            GROUP BY p.id, p.project_name, p.project_code
            ORDER BY employee_count DESC
        `);

        // Employees by role
        const [byRole] = await pool.query(`
            SELECT 
                u.role,
                COUNT(*) as count
            FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.is_approved = TRUE AND u.is_active = TRUE
            GROUP BY u.role
        `);

        // Employees by category
        const [byCategory] = await pool.query(`
            SELECT 
                e.category,
                COUNT(*) as count
            FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.is_approved = TRUE AND u.is_active = TRUE
            GROUP BY e.category
        `);

        res.json({
            success: true,
            data: {
                total: totalResult[0].total,
                by_project: byProject,
                by_role: byRole,
                by_category: byCategory
            }
        });

    } catch (error) {
        console.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update Employee
 * PUT /api/employees/:id
 */
exports.updateEmployee = async (req, res) => {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const updates = req.body;

        // Check if employee exists
        const [employees] = await conn.query('SELECT id, user_id FROM employees WHERE id = ?', [id]);
        
        if (employees.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Build update query
        const allowedFields = ['name', 'phone', 'designation', 'category', 'department', 'daily_wage', 'monthly_salary', 'status', 'assigned_project_id'];
        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateValues.push(id);

        // Update employee
        await conn.query(
            `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        await conn.commit();

        res.json({
            success: true,
            message: 'Employee updated successfully'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Update employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update employee',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};

/**
 * Delete Employee (Soft Delete)
 * DELETE /api/employees/:id
 */
exports.deleteEmployee = async (req, res) => {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const adminId = req.user.id;

        // Check if employee exists
        const [employees] = await conn.query('SELECT id, user_id FROM employees WHERE id = ?', [id]);
        
        if (employees.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const employee = employees[0];

        // Soft delete employee
        await conn.query(
            'UPDATE employees SET status = ? WHERE id = ?',
            ['inactive', id]
        );

        // Deactivate user account
        await conn.query(
            'UPDATE users SET is_active = FALSE, status = ? WHERE id = ?',
            ['inactive', employee.user_id]
        );

        // Log action
        await conn.query(
            `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_values)
             VALUES (?, ?, ?, ?, ?)`,
            [adminId, 'delete_employee', 'employee', id, JSON.stringify({ status: 'inactive' })]
        );

        await conn.commit();

        res.json({
            success: true,
            message: 'Employee deactivated successfully'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete employee',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};

module.exports = exports;
