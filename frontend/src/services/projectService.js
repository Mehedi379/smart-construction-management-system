// ============================================
// PROJECT SERVICE WITH AUTO-ACCOUNT SETUP
// Smart Construction Management System
// ============================================

import api from './api';

export const projectService = {
    // Get all projects (admin sees all, users see their project)
    getProjects: async (filters = {}) => {
        const response = await api.get('/projects', { params: filters });
        return response.data;
    },

    // Get active projects (for registration dropdown)
    getActiveProjects: async () => {
        const response = await api.get('/projects/active');
        return response.data;
    },

    // Get project by ID
    getProjectById: async (projectId) => {
        const response = await api.get(`/projects/${projectId}`);
        return response.data;
    },

    // Create new project (admin only)
    createProject: async (projectData) => {
        const response = await api.post('/projects/create', projectData);
        return response.data;
    },

    // Update project
    updateProject: async (projectId, projectData) => {
        const response = await api.put(`/projects/${projectId}`, projectData);
        return response.data;
    },

    // Delete project
    deleteProject: async (projectId) => {
        const response = await api.delete(`/projects/${projectId}`);
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

    // Get projects summary (global admin view)
    getProjectsSummary: async () => {
        const response = await api.get('/projects/summary');
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
    },

    // Export project report
    exportProjectReport: async (projectId, format = 'excel') => {
        const response = await api.get(`/projects/${projectId}/export/${format}`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export default projectService;
