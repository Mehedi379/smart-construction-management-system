import api from './api';

export const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    logout: async () => {
        try {
            // Try to call backend logout (but don't fail if it errors)
            try {
                await api.post('/auth/logout');
            } catch (error) {
                console.warn('Backend logout failed, clearing local data anyway:', error.message);
            }
            
            // Always clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Logout error:', error);
            // Force clear even if error
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Admin approval functions
    getPendingApprovals: async () => {
        const response = await api.get('/auth/pending-approvals');
        return response.data;
    },

    getAllUserStats: async () => {
        const response = await api.get('/auth/all-user-stats');
        return response.data;
    },

    approveUser: async (userId, role) => {
        const response = await api.put(`/auth/approve/${userId}`, { role });
        return response.data;
    },

    rejectUser: async (userId) => {
        const response = await api.delete(`/auth/reject/${userId}`);
        return response.data;
    }
};

export const employeeService = {
    registerEmployee: async (employeeData) => {
        const response = await api.post('/employees/register', employeeData);
        return response.data;
    },

    getEmployees: async (filters = {}) => {
        const response = await api.get('/employees', { params: filters });
        return response.data;
    },

    getEmployeeById: async (id) => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },

    updateEmployee: async (id, employeeData) => {
        const response = await api.put(`/employees/${id}`, employeeData);
        return response.data;
    },

    deleteEmployee: async (id) => {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    },

    getEmployeeStats: async () => {
        const response = await api.get('/employees/stats/summary');
        return response.data;
    }
};

export const projectService = {
    createProject: async (projectData) => {
        const response = await api.post('/projects/create', projectData);
        return response.data;
    },

    getProjects: async (filters = {}) => {
        const response = await api.get('/projects', { params: filters });
        return response.data;
    },

    // Get active projects (public - no auth required)
    getActiveProjects: async () => {
        const response = await api.get('/projects/active');
        return response.data;
    },

    getProjectById: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    updateProject: async (id, projectData) => {
        const response = await api.put(`/projects/${id}`, projectData);
        return response.data;
    },

    deleteProject: async (id) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },

    getProjectsSummary: async () => {
        const response = await api.get('/projects/summary');
        return response.data;
    },

    // Get project dashboard with financial stats
    getProjectDashboard: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/dashboard`);
        return response.data;
    },

    // Get project financial summary
    getProjectFinancials: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/financials`);
        return response.data;
    },

    // Get category-wise employees for a project
    getProjectCategories: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/categories`);
        return response.data;
    },

    // Get category-wise employee statistics for a project
    getProjectCategoryStats: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/category-stats`);
        return response.data;
    },

    // Get daily sheets for a project
    getProjectSheets: async (projectId, filters = {}) => {
        const response = await api.get(`/projects/${projectId}/sheets`, { params: filters });
        return response.data;
    },

    // Get vouchers for a project
    getProjectVouchers: async (projectId, filters = {}) => {
        const response = await api.get(`/projects/${projectId}/vouchers`, { params: filters });
        return response.data;
    },

    // Get expenses for a project
    getProjectExpenses: async (projectId, filters = {}) => {
        const response = await api.get(`/projects/${projectId}/expenses`, { params: filters });
        return response.data;
    }
};

export const voucherService = {
    createVoucher: async (voucherData) => {
        const response = await api.post('/vouchers', voucherData);
        return response.data;
    },

    getVouchers: async (filters = {}) => {
        const response = await api.get('/vouchers', { params: filters });
        return response.data;
    },

    getVoucherById: async (id) => {
        const response = await api.get(`/vouchers/${id}`);
        return response.data;
    },

    updateVoucher: async (id, voucherData) => {
        const response = await api.put(`/vouchers/${id}`, voucherData);
        return response.data;
    },

    deleteVoucher: async (id) => {
        const response = await api.delete(`/vouchers/${id}`);
        return response.data;
    }
};

export const expenseService = {
    createExpense: async (expenseData) => {
        const response = await api.post('/expenses', expenseData);
        return response.data;
    },

    getExpenses: async (filters = {}) => {
        const response = await api.get('/expenses', { params: filters });
        return response.data;
    },

    getExpenseSummary: async (filters = {}) => {
        const response = await api.get('/expenses/summary', { params: filters });
        return response.data;
    },

    updateExpense: async (id, expenseData) => {
        const response = await api.put(`/expenses/${id}`, expenseData);
        return response.data;
    },

    deleteExpense: async (id) => {
        const response = await api.delete(`/expenses/${id}`);
        return response.data;
    }
};

export const ledgerService = {
    createAccount: async (accountData) => {
        const response = await api.post('/ledger/accounts', accountData);
        return response.data;
    },

    getAccounts: async (filters = {}) => {
        const response = await api.get('/ledger/accounts', { params: filters });
        return response.data;
    },

    getLedger: async (accountId, filters = {}) => {
        const response = await api.get(`/ledger/${accountId}`, { params: filters });
        return response.data;
    },

    createEntry: async (entryData) => {
        const response = await api.post('/ledger/entries', entryData);
        return response.data;
    },

    getBalanceSummary: async () => {
        const response = await api.get('/ledger/balance');
        return response.data;
    }
};

export const reportService = {
    getProfitLoss: async (filters = {}) => {
        const response = await api.get('/reports/profit-loss', { params: filters });
        return response.data;
    },

    getDailyReport: async (date) => {
        const response = await api.get('/reports/daily', { params: { date } });
        return response.data;
    },

    getMonthlyReport: async (year, month) => {
        const response = await api.get('/reports/monthly', { params: { year, month } });
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await api.get('/reports/dashboard');
        return response.data;
    },

    exportToExcel: async (type, from_date, to_date) => {
        const response = await api.get('/reports/export/excel', {
            params: { type, from_date, to_date },
            responseType: 'blob'
        });
        return response.data;
    },

    exportToPDF: async (type, from_date, to_date) => {
        const response = await api.get('/reports/export/pdf', {
            params: { type, from_date, to_date },
            responseType: 'blob'
        });
        return response.data;
    }
};

export const purchaseService = {
    createPurchase: async (purchaseData) => {
        const response = await api.post('/purchases/purchases', purchaseData);
        return response.data;
    },

    getPurchases: async (filters = {}) => {
        const response = await api.get('/purchases/purchases', { params: filters });
        return response.data;
    },

    getPurchaseById: async (id) => {
        const response = await api.get(`/purchases/purchases/${id}`);
        return response.data;
    },

    createSupplier: async (supplierData) => {
        const response = await api.post('/purchases/suppliers', supplierData);
        return response.data;
    },

    getSuppliers: async (filters = {}) => {
        const response = await api.get('/purchases/suppliers', { params: filters });
        return response.data;
    },

    getSupplierById: async (id) => {
        const response = await api.get(`/purchases/suppliers/${id}`);
        return response.data;
    },

    updateSupplier: async (id, supplierData) => {
        const response = await api.put(`/purchases/suppliers/${id}`, supplierData);
        return response.data;
    },

    addPayment: async (paymentData) => {
        const response = await api.post('/purchases/payments', paymentData);
        return response.data;
    },

    getPurchaseSummary: async () => {
        const response = await api.get('/purchases/summary');
        return response.data;
    }
};

export const dailySheetService = {
    createSheet: async (sheetData) => {
        const response = await api.post('/sheets', sheetData);
        return response.data;
    },

    getSheets: async (filters = {}) => {
        const response = await api.get('/sheets', { params: filters });
        return response.data;
    },

    getSheetById: async (id) => {
        const response = await api.get(`/sheets/${id}`);
        return response.data;
    },

    updateSheet: async (id, sheetData) => {
        const response = await api.put(`/sheets/${id}`, sheetData);
        return response.data;
    },

    deleteSheet: async (id) => {
        const response = await api.delete(`/sheets/${id}`);
        return response.data;
    },

    uploadImage: async (formData) => {
        const response = await api.post('/sheets/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    addSignature: async (sheetId, role, signatureData) => {
        const response = await api.post(`/sheets/${sheetId}/signature`, {
            role,
            signature_data: signatureData
        });
        return response.data;
    },

    getProjectBalance: async (projectId, date) => {
        const response = await api.get('/sheets/balance', {
            params: { project_id: projectId, date }
        });
        return response.data;
    },

    sendForSignature: async (sheetId) => {
        const response = await api.post(`/sheets/${sheetId}/send-for-signature`);
        return response.data;
    },

    // Signature Request System (NEW)
    sendSignatureRequest: async (sheetId, roleCode) => {
        const response = await api.post(`/sheets/${sheetId}/signature-requests/send`, { roleCode });
        return response.data;
    },

    signWithRequest: async (sheetId, roleCode, signatureData, comments = '') => {
        const response = await api.post(`/sheets/${sheetId}/signature-requests/sign`, {
            roleCode,
            signatureData,
            comments
        });
        return response.data;
    },

    getSignatureRequestStatus: async (sheetId) => {
        const response = await api.get(`/sheets/${sheetId}/signature-requests/status`);
        return response.data;
    },

    getMySignatureRequests: async () => {
        const response = await api.get('/sheets/my-signature-requests');
        return response.data;
    }
};

export { workflowService } from './workflowService';
