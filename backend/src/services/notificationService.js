const pool = require('../config/database');

class NotificationService {
    /**
     * Create a new notification
     */
    static async createNotification(userId, notificationType, entityType, entityId, title, message) {
        const [result] = await pool.query(
            `INSERT INTO notifications (user_id, notification_type, entity_type, entity_id, title, message)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, notificationType, entityType, entityId, title, message]
        );
        return result.insertId;
    }

    /**
     * Notify the next role in the workflow to sign
     */
    static async notifyNextRole(sheetId, workflowId, currentStep) {
        try {
            // Get next role from workflow steps
            const [steps] = await pool.query(
                `SELECT ws.role_id, r.role_name, r.role_code 
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ? AND ws.step_number = ?`,
                [workflowId, currentStep]
            );

            if (steps.length === 0) return;

            // Get project_id from sheet
            const [sheetData] = await pool.query(
                'SELECT project_id FROM daily_sheets WHERE id = ?',
                [sheetId]
            );

            if (sheetData.length === 0) return;

            const projectId = sheetData[0].project_id;

            // Find ALL users with this role AND same project
            const [users] = await pool.query(
                `SELECT u.id as user_id, u.name, u.email 
                 FROM users u
                 INNER JOIN employees e ON u.id = e.user_id
                 WHERE u.role = ? 
                 AND u.is_active = TRUE
                 AND e.assigned_project_id = ?`,
                [steps[0].role_code, projectId]
            );

            // Send notification to ALL matching users
            for (const user of users) {
                await this.createNotification(
                    user.user_id,
                    'signature_request',
                    'sheet',
                    sheetId,
                    'New Sheet Requires Your Signature',
                    `A sheet requires approval and signature from ${steps[0].role_name}. Please review and sign.`,
                    `/sheets/${sheetId}`
                );
                
                console.log(`✅ Notification sent to ${user.name} for sheet ${sheetId}`);
            }
        } catch (error) {
            console.error('Error notifying next role:', error);
        }
    }

    /**
     * Get notifications for a user
     */
    static async getMyNotifications(userId, filters = {}) {
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (filters.is_read !== undefined) {
            query += ' AND is_read = ?';
            params.push(filters.is_read);
        }

        if (filters.notification_type) {
            query += ' AND notification_type = ?';
            params.push(filters.notification_type);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [notifications] = await pool.query(query, params);
        return notifications;
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId) {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
            [notificationId]
        );
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId) {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
    }

    /**
     * Get unread notification count
     */
    static async getUnreadCount(userId) {
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        return result[0].count;
    }
}

module.exports = NotificationService;
