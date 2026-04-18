// ============================================
// PROJECT-BASED DATA ISOLATION MIDDLEWARE
// Smart Construction Management System
// ============================================

const pool = require('../config/database');

/**
 * Middleware to filter data by user's assigned project
 * Non-admin users can only access their assigned project data
 * Admin users can access all projects
 */
const filterByProject = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin can access all projects - no filtering needed
        // Office roles are now ID-WISE (assigned to specific projects)
        const globalAccessRoles = ['admin'];
        
        if (globalAccessRoles.includes(userRole)) {
            req.projectFilter = {
                isAdmin: true,
                projectId: null
            };
            return next();
        }

        // Get user's assigned project from employees table
        const [employees] = await pool.query(
            'SELECT assigned_project_id FROM employees WHERE user_id = ?',
            [userId]
        );

        if (employees.length === 0 || !employees[0].assigned_project_id) {
            return res.status(403).json({
                success: false,
                message: 'No project assigned. Please contact administrator.'
            });
        }

        // Set project filter for non-admin users
        req.projectFilter = {
            isAdmin: false,
            projectId: employees[0].assigned_project_id
        };

        next();
    } catch (error) {
        console.error('Project filter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply project filter'
        });
    }
};

/**
 * Helper function to add project filter to SQL queries
 * @param {string} baseQuery - Base SQL query
 * @param {object} projectFilter - Project filter from req.projectFilter
 * @param {string} columnName - Column name for project_id (default: 'project_id')
 * @returns {object} - { query, params }
 */
const applyProjectFilter = (baseQuery, projectFilter, columnName = 'project_id') => {
    const params = [];
    let query = baseQuery;

    // Only apply filter for non-admin users
    if (!projectFilter.isAdmin && projectFilter.projectId) {
        // Check if query already has WHERE clause
        const hasWhere = query.toLowerCase().includes('where');
        
        if (hasWhere) {
            query += ` AND ${columnName} = ?`;
        } else {
            query += ` WHERE ${columnName} = ?`;
        }
        
        params.push(projectFilter.projectId);
    }

    return { query, params };
};

/**
 * Middleware to validate project access
 * Ensures user can only access their assigned project
 */
const validateProjectAccess = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const requestedProjectId = req.params.projectId || req.body.project_id || req.query.project_id;

        // Admin and Head Office roles can access all projects
        const globalAccessRoles = [
            'admin',
            'head_office_accounts_1',
            'head_office_accounts_2',
            'deputy_head_office'
        ];

        if (globalAccessRoles.includes(userRole)) {
            return next();
        }

        // Get user's assigned project
        const [employees] = await pool.query(
            'SELECT assigned_project_id FROM employees WHERE user_id = ?',
            [userId]
        );

        if (employees.length === 0 || !employees[0].assigned_project_id) {
            return res.status(403).json({
                success: false,
                message: 'No project assigned. Please contact administrator.'
            });
        }

        const userProjectId = employees[0].assigned_project_id;

        // If requesting specific project, validate it matches user's project
        if (requestedProjectId && parseInt(requestedProjectId) !== userProjectId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your assigned project.'
            });
        }

        // Set the project ID for the request
        req.userProjectId = userProjectId;
        next();
    } catch (error) {
        console.error('Project access validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate project access'
        });
    }
};

module.exports = {
    filterByProject,
    applyProjectFilter,
    validateProjectAccess
};
