const pool = require('../config/database');

/**
 * Audit Service - Log all critical system actions
 */
class AuditService {
    /**
     * Log an action
     * @param {Object} params
     * @param {number} params.userId - User who performed the action
     * @param {string} params.action - Action performed (create, update, delete, approve, etc.)
     * @param {string} params.entityType - Type of entity (voucher, sheet, user, etc.)
     * @param {number} params.entityId - ID of the entity
     * @param {Object} params.oldValues - Previous values (before change)
     * @param {Object} params.newValues - New values (after change)
     * @param {Object} params.req - Express request object (for IP and user agent)
     */
    static async log({ userId, action, entityType, entityId, oldValues = null, newValues = null, req = null }) {
        try {
            await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_values, new_values, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    action,
                    entityType,
                    entityId,
                    oldValues ? JSON.stringify(oldValues) : null,
                    newValues ? JSON.stringify(newValues) : null,
                    req ? req.ip : null,
                    req ? req.get('User-Agent') : null
                ]
            );
            
            console.log(`[AUDIT] User ${userId} performed ${action} on ${entityType} ${entityId}`);
        } catch (error) {
            // Don't throw error - audit logging should not break the main flow
            console.error('[AUDIT ERROR] Failed to log action:', error.message);
        }
    }

    /**
     * Get audit logs with filters
     */
    static async getLogs(filters = {}) {
        let query = `
            SELECT 
                al.*,
                u.name as user_name,
                u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.user_id) {
            query += ' AND al.user_id = ?';
            params.push(filters.user_id);
        }

        if (filters.action) {
            query += ' AND al.action = ?';
            params.push(filters.action);
        }

        if (filters.entity_type) {
            query += ' AND al.entity = ?';
            params.push(filters.entity_type);
        }

        if (filters.entity_id) {
            query += ' AND al.entity_id = ?';
            params.push(filters.entity_id);
        }

        if (filters.from_date) {
            query += ' AND al.created_at >= ?';
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            query += ' AND al.created_at <= ?';
            params.push(filters.to_date);
        }

        query += ' ORDER BY al.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [logs] = await pool.query(query, params);
        return logs;
    }

    /**
     * Get audit statistics
     */
    static async getStats(days = 30) {
        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total_actions,
                COUNT(DISTINCT user_id) as active_users,
                COUNT(DISTINCT entity_type) as entity_types_affected,
                DATE(created_at) as action_date
             FROM audit_logs
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY action_date DESC`,
            [days]
        );

        const [actionBreakdown] = await pool.query(
            `SELECT 
                action,
                COUNT(*) as count
             FROM audit_logs
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY action
             ORDER BY count DESC`,
            [days]
        );

        return {
            dailyStats: stats,
            actionBreakdown
        };
    }
}

module.exports = AuditService;
