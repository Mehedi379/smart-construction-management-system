// ============================================
// UNLIMITED ID DETECTION & AUTO-UPDATE SERVICE
// Smart Construction Management System
// ============================================

const pool = require('../config/database');

class UnlimitIDService {
    
    /**
     * Scan ALL tables and detect ID relationships
     * Returns comprehensive map of all IDs in system
     */
    static async detectAllIDs() {
        const conn = await pool.getConnection();
        
        try {
            const idMap = {
                users: [],
                employees: [],
                projects: [],
                expenses: [],
                vouchers: [],
                daily_sheets: [],
                purchases: [],
                signature_requests: [],
                workflow_steps: [],
                audit_logs: [],
                relationships: []
            };

            // Scan users table
            const [users] = await conn.query(
                'SELECT id, name, email, role, is_approved, is_active FROM users ORDER BY id'
            );
            idMap.users = users;

            // Scan employees table
            const [employees] = await conn.query(
                `SELECT e.id, e.employee_id, e.user_id, e.name, e.assigned_project_id, 
                        e.status, u.email, u.role
                 FROM employees e
                 LEFT JOIN users u ON e.user_id = u.id
                 ORDER BY e.id`
            );
            idMap.employees = employees;

            // Scan projects table
            const [projects] = await conn.query(
                'SELECT id, project_code, project_name, created_by, status FROM projects ORDER BY id'
            );
            idMap.projects = projects;

            // Scan expenses table
            const [expenses] = await conn.query(
                `SELECT id, voucher_id, project_id, created_by, amount 
                 FROM expenses ORDER BY id`
            );
            idMap.expenses = expenses;

            // Scan vouchers table
            const [vouchers] = await conn.query(
                `SELECT id, project_id, created_by, approved_by, amount, status 
                 FROM vouchers ORDER BY id`
            );
            idMap.vouchers = vouchers;

            // Scan daily_sheets table
            const [sheets] = await conn.query(
                `SELECT id, project_id, created_by, sheet_date, status 
                 FROM daily_sheets ORDER BY id`
            );
            idMap.daily_sheets = sheets;

            // Scan purchases table
            const [purchases] = await conn.query(
                `SELECT id, project_id, created_by, supplier_id, total_amount 
                 FROM purchases ORDER BY id`
            );
            idMap.purchases = purchases;

            // Scan signature_requests table
            const [signatures] = await conn.query(
                `SELECT id, sheet_id, requested_by, signed_by, role_code, status 
                 FROM signature_requests ORDER BY id`
            );
            idMap.signature_requests = signatures;

            // Scan workflow_steps table
            const [workflows] = await conn.query(
                `SELECT id, sheet_id, step_number, assigned_to, status 
                 FROM workflow_steps ORDER BY id`
            );
            idMap.workflow_steps = workflows;

            // Scan audit_logs table
            const [audits] = await conn.query(
                `SELECT id, user_id, entity, entity_id, action 
                 FROM audit_logs ORDER BY id DESC LIMIT 100`
            );
            idMap.audit_logs = audits;

            // Detect relationships and mismatches
            idMap.relationships = await this.detectRelationships(conn, idMap);

            return idMap;

        } finally {
            conn.release();
        }
    }

    /**
     * Detect ID relationships and mismatches across all tables
     */
    static async detectRelationships(conn, idMap) {
        const relationships = [];

        // Check employee -> user relationships
        for (const emp of idMap.employees) {
            const userExists = idMap.users.some(u => u.id === emp.user_id);
            if (!userExists && emp.user_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'employees',
                    id: emp.id,
                    field: 'user_id',
                    value: emp.user_id,
                    references: 'users.id',
                    issue: 'User ID does not exist in users table'
                });
            }

            const projectExists = idMap.projects.some(p => p.id === emp.assigned_project_id);
            if (!projectExists && emp.assigned_project_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'employees',
                    id: emp.id,
                    field: 'assigned_project_id',
                    value: emp.assigned_project_id,
                    references: 'projects.id',
                    issue: 'Project ID does not exist in projects table'
                });
            }
        }

        // Check expenses -> voucher/project/user relationships
        for (const exp of idMap.expenses) {
            if (exp.voucher_id) {
                const voucherExists = idMap.vouchers.some(v => v.id === exp.voucher_id);
                if (!voucherExists) {
                    relationships.push({
                        type: 'BROKEN_REFERENCE',
                        table: 'expenses',
                        id: exp.id,
                        field: 'voucher_id',
                        value: exp.voucher_id,
                        references: 'vouchers.id',
                        issue: 'Voucher ID does not exist'
                    });
                }
            }

            const projectExists = idMap.projects.some(p => p.id === exp.project_id);
            if (!projectExists && exp.project_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'expenses',
                    id: exp.id,
                    field: 'project_id',
                    value: exp.project_id,
                    references: 'projects.id',
                    issue: 'Project ID does not exist'
                });
            }
        }

        // Check vouchers -> project/user relationships
        for (const voucher of idMap.vouchers) {
            const projectExists = idMap.projects.some(p => p.id === voucher.project_id);
            if (!projectExists && voucher.project_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'vouchers',
                    id: voucher.id,
                    field: 'project_id',
                    value: voucher.project_id,
                    references: 'projects.id',
                    issue: 'Project ID does not exist'
                });
            }
        }

        // Check daily_sheets relationships
        for (const sheet of idMap.daily_sheets) {
            const projectExists = idMap.projects.some(p => p.id === sheet.project_id);
            if (!projectExists && sheet.project_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'daily_sheets',
                    id: sheet.id,
                    field: 'project_id',
                    value: sheet.project_id,
                    references: 'projects.id',
                    issue: 'Project ID does not exist'
                });
            }
        }

        // Check signature_requests relationships
        for (const sig of idMap.signature_requests) {
            const sheetExists = idMap.daily_sheets.some(s => s.id === sig.sheet_id);
            if (!sheetExists && sig.sheet_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'signature_requests',
                    id: sig.id,
                    field: 'sheet_id',
                    value: sig.sheet_id,
                    references: 'daily_sheets.id',
                    issue: 'Sheet ID does not exist'
                });
            }
        }

        // Check purchases relationships
        for (const purchase of idMap.purchases) {
            const projectExists = idMap.projects.some(p => p.id === purchase.project_id);
            if (!projectExists && purchase.project_id) {
                relationships.push({
                    type: 'BROKEN_REFERENCE',
                    table: 'purchases',
                    id: purchase.id,
                    field: 'project_id',
                    value: purchase.project_id,
                    references: 'projects.id',
                    issue: 'Project ID does not exist'
                });
            }
        }

        return relationships;
    }

    /**
     * Auto-update and fix all ID mismatches
     */
    static async autoFixAllIDs(options = {}) {
        const conn = await pool.getConnection();
        const results = {
            fixed: [],
            errors: [],
            summary: {
                total_issues: 0,
                fixed_count: 0,
                error_count: 0
            }
        };

        try {
            await conn.beginTransaction();

            const idMap = await this.detectAllIDs();
            results.summary.total_issues = idMap.relationships.length;

            for (const issue of idMap.relationships) {
                try {
                    const fixResult = await this.fixIssue(conn, issue, options);
                    if (fixResult.success) {
                        results.fixed.push(fixResult);
                        results.summary.fixed_count++;
                    } else {
                        results.errors.push(fixResult);
                        results.summary.error_count++;
                    }
                } catch (error) {
                    results.errors.push({
                        issue,
                        error: error.message,
                        success: false
                    });
                    results.summary.error_count++;
                }
            }

            await conn.commit();
            return results;

        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    /**
     * Fix individual ID issue
     */
    static async fixIssue(conn, issue, options) {
        const { action = 'nullify' } = options;

        switch (action) {
            case 'nullify':
                return await this.nullifyBrokenReference(conn, issue);
            
            case 'reassign':
                return await this.reassignReference(conn, issue);
            
            case 'delete':
                return await this.deleteOrphanRecord(conn, issue);
            
            default:
                return { success: false, error: 'Unknown action' };
        }
    }

    /**
     * Nullify broken reference (set to NULL)
     */
    static async nullifyBrokenReference(conn, issue) {
        const query = `UPDATE ${issue.table} SET ${issue.field} = NULL WHERE id = ?`;
        await conn.query(query, [issue.id]);

        return {
            success: true,
            action: 'nullified',
            table: issue.table,
            id: issue.id,
            field: issue.field,
            old_value: issue.value,
            new_value: null
        };
    }

    /**
     * Reassign reference to valid ID
     */
    static async reassignReference(conn, issue) {
        // Find closest valid ID
        let validId = null;

        if (issue.references === 'users.id') {
            const [users] = await conn.query('SELECT id FROM users ORDER BY id LIMIT 1');
            validId = users[0]?.id;
        } else if (issue.references === 'projects.id') {
            const [projects] = await conn.query(
                'SELECT id FROM projects WHERE status = "ongoing" ORDER BY id LIMIT 1'
            );
            validId = projects[0]?.id;
        }

        if (!validId) {
            return { success: false, error: 'No valid ID found for reassignment' };
        }

        const query = `UPDATE ${issue.table} SET ${issue.field} = ? WHERE id = ?`;
        await conn.query(query, [validId, issue.id]);

        return {
            success: true,
            action: 'reassigned',
            table: issue.table,
            id: issue.id,
            field: issue.field,
            old_value: issue.value,
            new_value: validId
        };
    }

    /**
     * Delete orphan record
     */
    static async deleteOrphanRecord(conn, issue) {
        const query = `DELETE FROM ${issue.table} WHERE id = ?`;
        await conn.query(query, [issue.id]);

        return {
            success: true,
            action: 'deleted',
            table: issue.table,
            id: issue.id
        };
    }

    /**
     * Sync all auto-increment IDs
     */
    static async syncAutoIncrements() {
        const conn = await pool.getConnection();
        const results = [];

        try {
            const tables = [
                'users', 'employees', 'projects', 'expenses', 
                'vouchers', 'daily_sheets', 'purchases', 
                'signature_requests', 'workflow_steps', 'audit_logs'
            ];

            for (const table of tables) {
                const [rows] = await conn.query(
                    `SELECT MAX(id) as max_id FROM ${table}`
                );

                const maxId = rows[0]?.max_id || 0;
                
                await conn.query(
                    `ALTER TABLE ${table} AUTO_INCREMENT = ${maxId + 1}`
                );

                results.push({
                    table,
                    max_id: maxId,
                    next_id: maxId + 1,
                    synced: true
                });
            }

            return results;

        } finally {
            conn.release();
        }
    }

    /**
     * Generate comprehensive ID report
     */
    static async generateIDReport() {
        const idMap = await this.detectAllIDs();
        
        const report = {
            timestamp: new Date().toISOString(),
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
            },
            issues: idMap.relationships,
            health_score: this.calculateHealthScore(idMap)
        };

        return report;
    }

    /**
     * Calculate database health score (0-100)
     */
    static calculateHealthScore(idMap) {
        const totalRecords = 
            idMap.users.length + 
            idMap.employees.length + 
            idMap.projects.length + 
            idMap.expenses.length + 
            idMap.vouchers.length + 
            idMap.daily_sheets.length + 
            idMap.purchases.length + 
            idMap.signature_requests.length + 
            idMap.workflow_steps.length;

        const issueCount = idMap.relationships.length;
        
        if (totalRecords === 0) return 100;

        const healthScore = Math.max(0, 100 - (issueCount / totalRecords * 100));
        return Math.round(healthScore * 10) / 10;
    }
}

module.exports = UnlimitIDService;
