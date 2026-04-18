// ============================================
// PRODUCTION-READY SECURITY MIDDLEWARE
// Smart Construction Management System
// ============================================

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookie
        const token = req.header('Authorization')?.replace('Bearer ', '') 
                   || req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists and is active
        const [users] = await pool.query(
            'SELECT id, email, role, is_approved, is_active, status FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token invalid.'
            });
        }

        const user = users[0];

        // Verify user is approved and active
        if (!user.is_approved) {
            return res.status(403).json({
                success: false,
                message: 'Account pending admin approval'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Contact admin.'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Authorization Middleware
 * Checks if user has required role(s)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Project Access Control Middleware
 * Ensures user can only access their assigned projects
 */
const checkProjectAccess = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const projectId = req.params.id || req.body.project_id || req.query.project_id;

        // Admin can access all projects
        if (userRole === 'admin') {
            return next();
        }

        // Check if user has access to this project
        const [employees] = await pool.query(
            `SELECT e.id FROM employees e
             INNER JOIN users u ON e.user_id = u.id
             WHERE e.user_id = ? AND e.assigned_project_id = ?`,
            [userId, projectId]
        );

        if (employees.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this project'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Project access check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Audit Log Middleware
 * Logs all critical actions
 */
const auditLog = (entity) => {
    return async (req, res, next) => {
        // Store original send method
        const originalSend = res.json;

        // Override send method
        res.json = function(body) {
            // Log action if successful
            if (body && body.success !== false) {
                pool.query(
                    `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address, user_agent)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        req.user?.id || null,
                        req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : req.method === 'DELETE' ? 'delete' : 'view',
                        entity,
                        body.data?.id || req.params.id || null,
                        req.ip,
                        req.headers['user-agent'] || null
                    ]
                ).catch(err => console.error('Audit log error:', err));
            }

            // Call original send
            return originalSend.call(this, body);
        };

        next();
    };
};

module.exports = { 
    authMiddleware, 
    authorize, 
    checkProjectAccess,
    auditLog 
};
