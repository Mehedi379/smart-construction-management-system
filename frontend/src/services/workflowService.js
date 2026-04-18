import api from './api';

export const workflowService = {
    /**
     * Sign a sheet with digital signature
     */
    signSheet: async (sheetId, signatureData, comments = '') => {
        const response = await api.post(`/workflow/sheets/${sheetId}/sign`, {
            signature_data: signatureData,
            comments
        });
        return response.data;
    },

    /**
     * Get signature status for a sheet
     */
    getSheetSignatureStatus: async (sheetId) => {
        const response = await api.get(`/workflow/sheets/${sheetId}/signature-status`);
        return response.data;
    },

    /**
     * Generate PDF for a sheet
     */
    generateSheetPDF: async (sheetId) => {
        const response = await api.post(`/workflow/sheets/${sheetId}/generate-pdf`);
        return response.data;
    },

    /**
     * Get my notifications
     */
    getMyNotifications: async (filters = {}) => {
        const response = await api.get('/workflow/notifications', { params: filters });
        return response.data;
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async () => {
        const response = await api.get('/workflow/notifications/unread-count');
        return response.data;
    },

    /**
     * Mark notification as read
     */
    markNotificationAsRead: async (notificationId) => {
        const response = await api.put(`/workflow/notifications/${notificationId}/read`);
        return response.data;
    },

    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead: async () => {
        const response = await api.put('/workflow/notifications/read-all');
        return response.data;
    },

    /**
     * Get my pending signatures
     */
    getMyPendingSignatures: async () => {
        const response = await api.get('/workflow/my-pending-signatures');
        return response.data;
    }
};
