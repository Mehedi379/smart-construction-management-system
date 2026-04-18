// ============================================
// PRODUCTION-READY AUTH CONTROLLER
// Smart Construction Management System
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Register New User
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        const {
            name, email, password, phone,
            designation, category, department,
            assigned_project_id
        } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Auto-assign role based on category (ONE-to-ONE mapping)
        let assignedRole = 'employee';
        
        switch(category) {
            case 'Site Manager':
                assignedRole = 'site_manager';
                break;
            case 'Site Engineer':
                assignedRole = 'site_engineer';
                break;
            case 'Site Director':
                assignedRole = 'site_director';
                break;
            case 'Accounts':
                assignedRole = 'accountant';
                break;
            case 'Engineering':
                assignedRole = 'engineer';
                break;
            case 'Employee':
            default:
                assignedRole = 'employee';
                break;
        }

        console.log('📝 Backend Registration - Category:', category, '→ Role:', assignedRole);

        // Create user (PENDING approval)
        const [userResult] = await conn.query(
            `INSERT INTO users (
                name, email, password, phone, role, 
                is_approved, is_active, status
            ) VALUES (?, ?, ?, ?, ?, FALSE, FALSE, 'inactive')`,
            [name, email, hashedPassword, phone, assignedRole]
        );

        const userId = userResult.insertId;

        // Create employee record
        const employeeId = `EMP${String(userId).padStart(4, '0')}`;
        
        await conn.query(
            `INSERT INTO employees (
                user_id, employee_id, name, phone, 
                designation, category, department,
                assigned_project_id, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [userId, employeeId, name, phone, designation, category, department, assigned_project_id || null, userId]
        );

        await conn.commit();

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please wait for admin approval.',
            data: {
                userId,
                employeeId,
                role: assignedRole,
                status: 'pending_approval'
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};

/**
 * User Login
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check approval status
        if (!user.is_approved) {
            return res.status(403).json({
                success: false,
                message: 'Account pending admin approval. Please contact administrator.'
            });
        }

        // Check active status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Get employee details
        const [employees] = await pool.query(
            'SELECT id, employee_id, assigned_project_id FROM employees WHERE user_id = ?',
            [user.id]
        );

        // Office roles need employee records for project assignment (ID-WISE)
        // Only admin has global access
        const globalAccessRoles = ['admin'];
        
        const isRegistered = globalAccessRoles.includes(user.role) || employees.length > 0;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    is_registered: isRegistered,
                    assigned_project_id: employees[0]?.assigned_project_id || null
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get Current User
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get Pending Approvals (Admin Only)
 * GET /api/auth/pending-approvals
 */
exports.getPendingApprovals = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.id, u.name, u.email, u.phone, 
                u.role, u.requested_role, 
                u.is_approved, u.is_active, 
                u.created_at,
                e.employee_id, e.designation, e.category, e.department,
                p.project_name, p.project_code
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             WHERE u.is_approved = FALSE
             ORDER BY u.created_at DESC`,
            []
        );

        res.json({
            success: true,
            data: users,
            count: users.length
        });

    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending approvals',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Approve User (Admin Only)
 * PUT /api/auth/approve/:userId
 */
exports.approveUser = async (req, res) => {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        const { userId } = req.params;
        const { role } = req.body;
        const adminId = req.user.id;

        // Check if user exists and is pending
        const [users] = await conn.query(
            'SELECT id, is_approved FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (users[0].is_approved) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'User is already approved'
            });
        }

        // Approve user
        await conn.query(
            `UPDATE users 
             SET is_approved = TRUE, 
                 is_active = TRUE,
                 status = 'active',
                 approved_by = ?,
                 approved_at = NOW()
             WHERE id = ?`,
            [adminId, userId]
        );

        // Update role if provided
        if (role) {
            await conn.query(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, userId]
            );
        }

        await conn.commit();

        res.json({
            success: true,
            message: 'User approved successfully'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Approve user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};

/**
 * Reject User (Admin Only) - SOFT DELETE
 * DELETE /api/auth/reject/:userId
 */
exports.rejectUser = async (req, res) => {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        const { userId } = req.params;
        const adminId = req.user.id;

        // Check if user exists and is pending
        const [users] = await conn.query(
            'SELECT id, is_approved FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (users[0].is_approved) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot reject an approved user'
            });
        }

        // Soft delete: Mark as rejected and inactive
        await conn.query(
            `UPDATE users 
             SET is_approved = FALSE, 
                 is_active = FALSE,
                 status = 'rejected',
                 approved_by = ?,
                 approved_at = NOW()
             WHERE id = ?`,
            [adminId, userId]
        );

        // Delete employee record (if exists)
        await conn.query(
            'DELETE FROM employees WHERE user_id = ?',
            [userId]
        );

        await conn.commit();

        res.json({
            success: true,
            message: 'User rejected and removed successfully'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Reject user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};

/**
 * Get All User Stats (Admin Only)
 * GET /api/auth/all-user-stats
 */
exports.getAllUserStats = async (req, res) => {
    try {
        // Get total users by role (approved only)
        const [approvedStats] = await pool.query(
            `SELECT role, COUNT(*) as count 
             FROM users 
             WHERE is_approved = TRUE AND is_active = TRUE
             GROUP BY role`
        );

        // Get pending users by requested role
        const [pendingStats] = await pool.query(
            `SELECT requested_role as role, COUNT(*) as count 
             FROM users 
             WHERE is_approved = FALSE
             GROUP BY requested_role`
        );

        // Get total counts
        const [totalApproved] = await pool.query(
            `SELECT COUNT(*) as total FROM users WHERE is_approved = TRUE AND is_active = TRUE`
        );

        const [totalPending] = await pool.query(
            `SELECT COUNT(*) as total FROM users WHERE is_approved = FALSE`
        );

        // Get all users with details
        const [allUsers] = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.is_approved,
                u.is_active,
                u.status,
                u.created_at,
                e.employee_id,
                e.assigned_project_id,
                p.project_code,
                p.project_name
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             ORDER BY u.created_at DESC`
        );

        // Get project-wise user counts
        const [projectStats] = await pool.query(
            `SELECT 
                p.id as project_id,
                p.project_code,
                p.project_name,
                COUNT(u.id) as total_users,
                SUM(CASE WHEN u.is_approved = TRUE THEN 1 ELSE 0 END) as approved_users,
                SUM(CASE WHEN u.is_approved = FALSE THEN 1 ELSE 0 END) as pending_users
             FROM projects p
             LEFT JOIN employees e ON p.id = e.assigned_project_id
             LEFT JOIN users u ON e.user_id = u.id
             GROUP BY p.id, p.project_code, p.project_name
             ORDER BY p.id`
        );

        res.json({
            success: true,
            data: {
                approved: {
                    total: totalApproved[0].total,
                    by_role: approvedStats
                },
                pending: {
                    total: totalPending[0].total,
                    by_role: pendingStats
                },
                projects: projectStats,
                users: allUsers
            }
        });

    } catch (error) {
        console.error('Get all user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Logout User
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
    try {
        // For JWT, logout is handled client-side by removing the token
        // This endpoint can be used for logging or cleanup if needed
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;
