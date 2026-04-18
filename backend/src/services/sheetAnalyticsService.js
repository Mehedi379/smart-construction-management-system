const pool = require('../config/database');

class SheetAnalyticsService {
    /**
     * Get category-wise breakdown for a sheet
     */
    static async getSheetBreakdown(sheetId) {
        try {
            // Call stored procedure
            const [results] = await pool.query('CALL get_sheet_breakdown(?)', [sheetId]);
            
            return {
                category_breakdown: results[0] || [],
                type_breakdown: results[1] || [],
                user_breakdown: results[2] || []
            };
        } catch (error) {
            console.error('Error getting sheet breakdown:', error);
            throw error;
        }
    }

    /**
     * Get project summary (daily/weekly/monthly)
     */
    static async getProjectSummary(projectId, period, startDate, endDate) {
        try {
            const [results] = await pool.query('CALL get_project_summary(?, ?, ?, ?)', [
                projectId,
                period,
                startDate,
                endDate
            ]);
            
            return results[0] || [];
        } catch (error) {
            console.error('Error getting project summary:', error);
            throw error;
        }
    }

    /**
     * Get real-time project expense stats
     */
    static async getProjectExpenseStats(projectId) {
        try {
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT ds.id) as total_sheets,
                    COUNT(DISTINCT sv.voucher_id) as total_vouchers,
                    SUM(ds.total_amount) as total_expense,
                    SUM(CASE WHEN ds.status = 'approved' THEN ds.total_amount ELSE 0 END) as approved_expense,
                    SUM(CASE WHEN ds.status IN ('pending', 'in_review') THEN ds.total_amount ELSE 0 END) as pending_expense,
                    AVG(ds.total_amount) as avg_daily_expense,
                    MAX(ds.total_amount) as max_daily_expense,
                    MIN(ds.total_amount) as min_daily_expense
                FROM daily_sheets ds
                LEFT JOIN sheet_vouchers sv ON ds.id = sv.sheet_id
                WHERE ds.project_id = ?`,
                [projectId]
            );

            // Get category breakdown for entire project
            const [categories] = await pool.query(
                `SELECT 
                    v.expense_category,
                    COUNT(v.id) as voucher_count,
                    SUM(v.amount) as category_total,
                    ROUND((SUM(v.amount) / (SELECT SUM(total_amount) FROM daily_sheets WHERE project_id = ?)) * 100, 2) as percentage
                FROM vouchers v
                INNER JOIN sheet_vouchers sv ON v.id = sv.voucher_id
                INNER JOIN daily_sheets ds ON sv.sheet_id = ds.id
                WHERE ds.project_id = ?
                GROUP BY v.expense_category
                ORDER BY category_total DESC`,
                [projectId, projectId]
            );

            return {
                ...stats[0],
                category_breakdown: categories
            };
        } catch (error) {
            console.error('Error getting project expense stats:', error);
            throw error;
        }
    }

    /**
     * Get recent activity for a project
     */
    static async getRecentActivity(projectId, limit = 10) {
        try {
            const [activities] = await pool.query(
                `SELECT 
                    'voucher' as activity_type,
                    v.voucher_no as reference,
                    v.amount,
                    v.status,
                    u.name as created_by,
                    v.created_at,
                    v.date as activity_date
                FROM vouchers v
                INNER JOIN users u ON v.created_by = u.id
                WHERE v.project_id = ?
                
                UNION ALL
                
                SELECT 
                    'sheet' as activity_type,
                    ds.sheet_no as reference,
                    ds.total_amount as amount,
                    ds.status,
                    u.name as created_by,
                    ds.created_at,
                    ds.sheet_date as activity_date
                FROM daily_sheets ds
                INNER JOIN users u ON ds.created_by = u.id
                WHERE ds.project_id = ?
                
                ORDER BY created_at DESC
                LIMIT ?`,
                [projectId, projectId, parseInt(limit)]
            );

            return activities;
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        }
    }
}

module.exports = SheetAnalyticsService;
