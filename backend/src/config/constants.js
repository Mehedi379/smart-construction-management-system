// ============================================
// SYSTEM CONSTANTS
// Centralized constants for roles, statuses, and configurations
// ============================================

// ============================================
// ROLES
// ============================================
export const ROLES = {
    ADMIN: 'admin',
    HEAD_OFFICE_ADMIN: 'head_office_admin',
    SITE_MANAGER: 'site_manager',
    PROJECT_DIRECTOR: 'project_director',
    DEPUTY_DIRECTOR: 'deputy_director',
    ACCOUNTANT: 'accountant',
    HEAD_OFFICE_ACCOUNTS: 'head_office_accounts',
    ENGINEER: 'engineer',
    EMPLOYEE: 'employee'
};

export const ROLE_HIERARCHY = {
    [ROLES.ADMIN]: 1,
    [ROLES.HEAD_OFFICE_ADMIN]: 2,
    [ROLES.SITE_MANAGER]: 2,
    [ROLES.PROJECT_DIRECTOR]: 3,
    [ROLES.ENGINEER]: 3,
    [ROLES.DEPUTY_DIRECTOR]: 4,
    [ROLES.ACCOUNTANT]: 4,
    [ROLES.HEAD_OFFICE_ACCOUNTS]: 5,
    [ROLES.EMPLOYEE]: 10
};

// ============================================
// VOUCHER STATUSES
// ============================================
export const VOUCHER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// ============================================
// SHEET STATUSES
// ============================================
export const SHEET_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    LOCKED: 'locked'
};

// ============================================
// SIGNATURE STATUSES
// ============================================
export const SIGNATURE_STATUS = {
    PENDING: 'pending',
    SIGNED: 'signed',
    REJECTED: 'rejected'
};

// ============================================
// NOTIFICATION TYPES
// ============================================
export const NOTIFICATION_TYPE = {
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    ERROR: 'error'
};

// ============================================
// WORKFLOW STEPS (Sheet Approval)
// ============================================
export const WORKFLOW_STEPS = [
    { step: 1, role: ROLES.SITE_MANAGER, name: 'Site Manager Approval' },
    { step: 2, role: ROLES.ENGINEER, name: 'Site Engineer Approval' },
    { step: 3, role: ROLES.PROJECT_DIRECTOR, name: 'Project Director Approval' },
    { step: 4, role: ROLES.DEPUTY_DIRECTOR, name: 'Deputy Director Approval' },
    { step: 5, role: ROLES.HEAD_OFFICE_ACCOUNTS, name: 'Head Office Accounts Approval' },
    { step: 6, role: ROLES.HEAD_OFFICE_ADMIN, name: 'Head Office Admin Final Approval' }
];

export const WORKFLOW_TEMPLATE_ID = {
    SHEET_APPROVAL: 2,
    VOUCHER_APPROVAL: 1
};

// ============================================
// EXPENSE CATEGORIES
// ============================================
export const EXPENSE_CATEGORY = {
    MATERIAL: 'material',
    LABOR: 'labor',
    SERVICE: 'service',
    EQUIPMENT: 'equipment',
    OTHER: 'other'
};

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHOD = {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
    CHECK: 'check',
    MOBILE_BANKING: 'mobile_banking'
};

// ============================================
// VOUCHER TYPES
// ============================================
export const VOUCHER_TYPE = {
    PAYMENT: 'payment',
    EXPENSE: 'expense',
    RECEIPT: 'receipt',
    JOURNAL: 'journal'
};

// ============================================
// PAGINATION DEFAULTS
// ============================================
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 500
};

// ============================================
// FILE UPLOAD LIMITS
// ============================================
export const FILE_UPLOAD = {
    MAX_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    ALLOWED_DOC_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx']
};

// ============================================
// RATE LIMITING
// ============================================
export const RATE_LIMIT = {
    GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    GENERAL_MAX: 100,
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX: 10
};

// ============================================
// PASSWORD RULES
// ============================================
export const PASSWORD_RULES = {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100
};

// ============================================
// JWT CONFIG
// ============================================
export const JWT_CONFIG = {
    EXPIRES_IN: '7d',
    ISSUER: 'smart-construction-system'
};

// ============================================
// AUDIT ACTIONS
// ============================================
export const AUDIT_ACTIONS = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    APPROVE: 'approve',
    REJECT: 'reject',
    SIGN: 'sign',
    LOGIN: 'login',
    LOGOUT: 'logout'
};

// ============================================
// AUDIT ENTITY TYPES
// ============================================
export const AUDIT_ENTITIES = {
    USER: 'user',
    VOUCHER: 'voucher',
    SHEET: 'sheet',
    PROJECT: 'project',
    EMPLOYEE: 'employee',
    EXPENSE: 'expense',
    SIGNATURE: 'signature'
};
