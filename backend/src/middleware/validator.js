// ============================================
// INPUT VALIDATION MIDDLEWARE
// Smart Construction Management System
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Registration Validation
 */
const validateRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Name can only contain letters, spaces, and hyphens'),
    
    body('email')
        .trim()
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail()
        .custom(async (value) => {
            const pool = require('../config/database');
            const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [value]);
            if (users.length > 0) {
                throw new Error('Email already registered');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
        .withMessage('Valid phone number is required'),
    
    body('category')
        .isIn(['Labor', 'Accounts', 'Management', 'Engineer', 'Supervisor'])
        .withMessage('Invalid category. Must be: Labor, Accounts, Management, Engineer, or Supervisor'),
    
    body('designation')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Designation must be less than 100 characters'),
    
    body('assigned_project_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid project ID'),
    
    handleValidationErrors
];

/**
 * Login Validation
 */
const validateLogin = [
    body('email')
        .trim()
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    handleValidationErrors
];

/**
 * Project Creation Validation
 */
const validateProjectCreation = [
    body('project_name')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 3, max: 200 }).withMessage('Project name must be 3-200 characters'),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Location must be less than 500 characters'),
    
    body('estimated_budget')
        .optional()
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    
    body('start_date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    
    body('end_date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .custom((value, { req }) => {
            if (req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    
    body('status')
        .optional()
        .isIn(['planning', 'ongoing', 'completed', 'on_hold', 'cancelled'])
        .withMessage('Invalid status'),
    
    handleValidationErrors
];

/**
 * Voucher Creation Validation
 */
const validateVoucherCreation = [
    body('voucher_type')
        .isIn(['payment', 'expense', 'receipt', 'journal'])
        .withMessage('Invalid voucher type'),
    
    body('amount')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    
    body('date')
        .isISO8601().withMessage('Invalid date format'),
    
    body('project_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid project ID'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    
    body('payment_method')
        .optional()
        .isIn(['cash', 'bank', 'mobile_banking', 'cheque'])
        .withMessage('Invalid payment method'),
    
    handleValidationErrors
];

/**
 * Employee Update Validation
 */
const validateEmployeeUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
        .withMessage('Valid phone number is required'),
    
    body('daily_wage')
        .optional()
        .isFloat({ min: 0 }).withMessage('Daily wage must be a positive number'),
    
    body('monthly_salary')
        .optional()
        .isFloat({ min: 0 }).withMessage('Monthly salary must be a positive number'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status'),
    
    body('assigned_project_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid project ID'),
    
    handleValidationErrors
];

/**
 * ID Parameter Validation
 */
const validateIdParam = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),
    
    handleValidationErrors
];

/**
 * Pagination Validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
    query('sort')
        .optional()
        .isIn(['asc', 'desc']).withMessage('Sort must be asc or desc'),
    
    query('orderBy')
        .optional()
        .isLength({ max: 50 }).withMessage('Invalid order by field'),
    
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateProjectCreation,
    validateVoucherCreation,
    validateEmployeeUpdate,
    validateIdParam,
    validatePagination,
    handleValidationErrors
};
