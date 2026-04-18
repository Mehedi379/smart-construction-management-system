// ============================================
// UNLIMITED ID DETECTION & AUTO-UPDATE CONTROLLER
// Smart Construction Management System
// ============================================

const UnlimitIDService = require('../services/unlimitIDService');

/**
 * Detect ALL IDs in the system
 * GET /api/admin/ids/detect
 */
exports.detectAllIDs = async (req, res) => {
    try {
        const idMap = await UnlimitIDService.detectAllIDs();
        
        res.json({
            success: true,
            data: idMap,
            summary: {
                total_users: idMap.users.length,
                total_employees: idMap.employees.length,
                total_projects: idMap.projects.length,
                total_expenses: idMap.expenses.length,
                total_vouchers: idMap.vouchers.length,
                total_sheets: idMap.daily_sheets.length,
                total_purchases: idMap.purchases.length,
                total_signatures: idMap.signature_requests.length,
                total_workflows: idMap.workflow_steps.length,
                total_issues: idMap.relationships.length
            }
        });

    } catch (error) {
        console.error('Detect IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to detect IDs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Auto-fix ALL ID issues
 * POST /api/admin/ids/auto-fix
 */
exports.autoFixAllIDs = async (req, res) => {
    try {
        const { action = 'nullify' } = req.body;
        
        // Validate action
        if (!['nullify', 'reassign', 'delete'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be: nullify, reassign, or delete'
            });
        }

        const results = await UnlimitIDService.autoFixAllIDs({ action });
        
        res.json({
            success: true,
            message: `Auto-fix completed with action: ${action}`,
            data: results,
            summary: results.summary
        });

    } catch (error) {
        console.error('Auto-fix IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to auto-fix IDs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Sync all auto-increment IDs
 * POST /api/admin/ids/sync-auto-increment
 */
exports.syncAutoIncrements = async (req, res) => {
    try {
        const results = await UnlimitIDService.syncAutoIncrements();
        
        res.json({
            success: true,
            message: 'Auto-increment IDs synced successfully',
            data: results
        });

    } catch (error) {
        console.error('Sync auto-increment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync auto-increment IDs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Generate comprehensive ID report
 * GET /api/admin/ids/report
 */
exports.generateIDReport = async (req, res) => {
    try {
        const report = await UnlimitIDService.generateIDReport();
        
        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Generate ID report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate ID report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Validate specific table IDs
 * GET /api/admin/ids/validate/:table
 */
exports.validateTableIDs = async (req, res) => {
    try {
        const { table } = req.params;
        
        // Validate table name
        const allowedTables = [
            'users', 'employees', 'projects', 'expenses', 
            'vouchers', 'daily_sheets', 'purchases', 
            'signature_requests', 'workflow_steps', 'audit_logs'
        ];
        
        if (!allowedTables.includes(table)) {
            return res.status(400).json({
                success: false,
                message: `Invalid table. Must be one of: ${allowedTables.join(', ')}`
            });
        }

        const idMap = await UnlimitIDService.detectAllIDs();
        const tableData = idMap[table] || [];
        
        // Find issues for this table
        const tableIssues = idMap.relationships.filter(issue => issue.table === table);
        
        res.json({
            success: true,
            data: {
                table,
                total_records: tableData.length,
                issues: tableIssues,
                issue_count: tableIssues.length
            }
        });

    } catch (error) {
        console.error('Validate table IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate table IDs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Bulk update IDs with custom mapping
 * POST /api/admin/ids/bulk-update
 */
exports.bulkUpdateIDs = async (req, res) => {
    const conn = await require('../config/database').getConnection();
    
    try {
        await conn.beginTransaction();

        const { updates } = req.body;
        
        if (!Array.isArray(updates) || updates.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'Updates array is required'
            });
        }

        const results = [];
        
        for (const update of updates) {
            const { table, id, field, value } = update;
            
            // Validate input
            if (!table || !id || !field || value === undefined) {
                results.push({
                    update,
                    success: false,
                    error: 'Missing required fields: table, id, field, value'
                });
                continue;
            }

            try {
                const query = `UPDATE ${table} SET ${field} = ? WHERE id = ?`;
                await conn.query(query, [value, id]);
                
                results.push({
                    update,
                    success: true,
                    message: `Updated ${table}.${id}.${field} = ${value}`
                });
            } catch (error) {
                results.push({
                    update,
                    success: false,
                    error: error.message
                });
            }
        }

        await conn.commit();

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            message: `Bulk update completed: ${successCount} succeeded, ${failCount} failed`,
            data: results
        });

    } catch (error) {
        await conn.rollback();
        console.error('Bulk update IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update IDs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
};

/**
 * Get database health score
 * GET /api/admin/ids/health
 */
exports.getHealthScore = async (req, res) => {
    try {
        const idMap = await UnlimitIDService.detectAllIDs();
        const healthScore = UnlimitIDService.calculateHealthScore(idMap);
        
        res.json({
            success: true,
            data: {
                health_score: healthScore,
                status: healthScore >= 90 ? 'EXCELLENT' : 
                        healthScore >= 70 ? 'GOOD' : 
                        healthScore >= 50 ? 'FAIR' : 'POOR',
                total_records: 
                    idMap.users.length + 
                    idMap.employees.length + 
                    idMap.projects.length + 
                    idMap.expenses.length + 
                    idMap.vouchers.length + 
                    idMap.daily_sheets.length + 
                    idMap.purchases.length + 
                    idMap.signature_requests.length + 
                    idMap.workflow_steps.length,
                total_issues: idMap.relationships.length
            }
        });

    } catch (error) {
        console.error('Get health score error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get health score',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
