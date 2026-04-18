// ============================================
// AUTOMATIC ID VERIFICATION & UPDATE SERVICE
// Smart Construction Management System
// ============================================
// This service runs automatically to verify and fix ID issues
// Ensures all roles have proper project assignments

const pool = require('../config/database');

class AutoIDVerificationService {
    
    /**
     * Run complete ID verification
     * Call this on server startup or schedule it
     */
    static async runCompleteVerification() {
        console.log('\n🔍 Starting Automatic ID Verification...');
        
        const results = {
            timestamp: new Date().toISOString(),
            checks: [],
            fixes: [],
            errors: []
        };

        try {
            // Run all verification checks
            await this.verifyRoleEnum(results);
            await this.verifyProjectAssignments(results);
            await this.verifyForeignKeys(results);
            await this.verifyAutoIncrements(results);
            await this.verifyOrphanRecords(results);
            
            console.log('✅ Automatic ID Verification Complete');
            console.log(`   Checks: ${results.checks.length}`);
            console.log(`   Fixes Applied: ${results.fixes.length}`);
            console.log(`   Errors: ${results.errors.length}\n`);
            
            return results;
        } catch (error) {
            console.error('❌ ID Verification failed:', error);
            results.errors.push({
                check: 'complete_verification',
                error: error.message
            });
            return results;
        }
    }

    /**
     * Verify role ENUM includes all necessary roles
     */
    static async verifyRoleEnum(results) {
        try {
            const requiredRoles = [
                'admin',
                'head_office_accounts_1',
                'head_office_accounts_2',
                'deputy_head_office',
                'site_manager',
                'site_engineer',
                'site_director',
                'deputy_director',
                'project_director',
                'engineer',
                'accountant',
                'employee'
            ];

            // Get current ENUM values
            const [enumResult] = await pool.query(
                `SELECT COLUMN_TYPE as enum_values 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'users' 
                 AND COLUMN_NAME = 'role'`
            );

            if (enumResult.length === 0) {
                results.checks.push({
                    check: 'role_enum',
                    status: 'FAIL',
                    message: 'Role column not found'
                });
                return;
            }

            const enumValues = enumResult[0].enum_values;
            const missingRoles = requiredRoles.filter(role => !enumValues.includes(role));

            if (missingRoles.length > 0) {
                results.checks.push({
                    check: 'role_enum',
                    status: 'FAIL',
                    message: `Missing roles: ${missingRoles.join(', ')}`
                });

                // Auto-fix: Update ENUM
                console.log('🔧 Auto-fixing role ENUM...');
                await pool.query(
                    `ALTER TABLE users MODIFY COLUMN role ENUM(${requiredRoles.map(r => `'${r}'`).join(', ')}) DEFAULT 'employee'`
                );

                results.fixes.push({
                    fix: 'role_enum_updated',
                    added_roles: missingRoles
                });

                results.checks[results.checks.length - 1].status = 'FIXED';
                results.checks[results.checks.length - 1].message = 'Role ENUM updated successfully';
            } else {
                results.checks.push({
                    check: 'role_enum',
                    status: 'PASS',
                    message: 'All required roles present'
                });
            }
        } catch (error) {
            results.errors.push({
                check: 'role_enum',
                error: error.message
            });
        }
    }

    /**
     * Verify all users have proper project assignments
     */
    static async verifyProjectAssignments(results) {
        try {
            // Find approved users without project assignments (except admin)
            const [usersWithoutProjects] = await pool.query(
                `SELECT u.id, u.email, u.role, u.name
                 FROM users u
                 LEFT JOIN employees e ON u.id = e.user_id
                 WHERE u.is_approved = TRUE
                 AND u.role != 'admin'
                 AND (e.assigned_project_id IS NULL OR e.id IS NULL)`
            );

            if (usersWithoutProjects.length > 0) {
                results.checks.push({
                    check: 'project_assignments',
                    status: 'WARNING',
                    message: `${usersWithoutProjects.length} users missing project assignments`,
                    users: usersWithoutProjects
                });

                // Log to audit table
                for (const user of usersWithoutProjects) {
                    await pool.query(
                        `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_values)
                         VALUES (?, 'warning_missing_project', 'user', ?, ?)`,
                        [user.id, user.id, JSON.stringify({
                            email: user.email,
                            role: user.role,
                            issue: 'Missing project assignment'
                        })]
                    );
                }
            } else {
                results.checks.push({
                    check: 'project_assignments',
                    status: 'PASS',
                    message: 'All users have proper project assignments'
                });
            }
        } catch (error) {
            results.errors.push({
                check: 'project_assignments',
                error: error.message
            });
        }
    }

    /**
     * Verify foreign key relationships
     */
    static async verifyForeignKeys(results) {
        try {
            const foreignKeyChecks = [
                {
                    table: 'employees',
                    column: 'user_id',
                    references: 'users.id',
                    name: 'employee_user_relationship'
                },
                {
                    table: 'employees',
                    column: 'assigned_project_id',
                    references: 'projects.id',
                    name: 'employee_project_relationship'
                },
                {
                    table: 'vouchers',
                    column: 'project_id',
                    references: 'projects.id',
                    name: 'voucher_project_relationship'
                },
                {
                    table: 'expenses',
                    column: 'project_id',
                    references: 'projects.id',
                    name: 'expense_project_relationship'
                },
                {
                    table: 'daily_sheets',
                    column: 'project_id',
                    references: 'projects.id',
                    name: 'sheet_project_relationship'
                }
            ];

            for (const check of foreignKeyChecks) {
                const [brokenRefs] = await pool.query(
                    `SELECT COUNT(*) as count 
                     FROM ${check.table} 
                     WHERE ${check.column} IS NOT NULL 
                     AND ${check.column} NOT IN (SELECT id FROM ${check.references.split('.')[0]})`
                );

                if (brokenRefs[0].count > 0) {
                    results.checks.push({
                        check: check.name,
                        status: 'FAIL',
                        message: `${brokenRefs[0].count} broken references in ${check.table}.${check.column}`
                    });
                } else {
                    results.checks.push({
                        check: check.name,
                        status: 'PASS',
                        message: `All ${check.table}.${check.column} references valid`
                    });
                }
            }
        } catch (error) {
            results.errors.push({
                check: 'foreign_keys',
                error: error.message
            });
        }
    }

    /**
     * Verify auto-increment values are correct
     */
    static async verifyAutoIncrements(results) {
        try {
            const tables = [
                'users', 'employees', 'projects', 'expenses',
                'vouchers', 'daily_sheets', 'purchases',
                'signature_requests', 'workflow_steps', 'audit_logs'
            ];

            for (const table of tables) {
                const [rows] = await pool.query(
                    `SELECT MAX(id) as max_id FROM ${table}`
                );

                const maxId = rows[0]?.max_id || 0;
                
                await pool.query(
                    `ALTER TABLE ${table} AUTO_INCREMENT = ${maxId + 1}`
                );
            }

            results.checks.push({
                check: 'auto_increments',
                status: 'PASS',
                message: 'All auto-increment values synced'
            });
        } catch (error) {
            results.errors.push({
                check: 'auto_increments',
                error: error.message
            });
        }
    }

    /**
     * Find and report orphan records
     */
    static async verifyOrphanRecords(results) {
        try {
            const orphanChecks = [
                {
                    table: 'employees',
                    condition: 'user_id NOT IN (SELECT id FROM users)',
                    name: 'orphan_employees'
                },
                {
                    table: 'vouchers',
                    condition: 'project_id NOT IN (SELECT id FROM projects)',
                    name: 'orphan_vouchers'
                },
                {
                    table: 'expenses',
                    condition: 'project_id NOT IN (SELECT id FROM projects)',
                    name: 'orphan_expenses'
                }
            ];

            let totalOrphans = 0;

            for (const check of orphanChecks) {
                const [orphans] = await pool.query(
                    `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.condition}`
                );

                if (orphans[0].count > 0) {
                    totalOrphans += orphans[0].count;
                    results.checks.push({
                        check: check.name,
                        status: 'WARNING',
                        message: `${orphans[0].count} orphan records in ${check.table}`
                    });
                }
            }

            if (totalOrphans === 0) {
                results.checks.push({
                    check: 'orphan_records',
                    status: 'PASS',
                    message: 'No orphan records found'
                });
            }
        } catch (error) {
            results.errors.push({
                check: 'orphan_records',
                error: error.message
            });
        }
    }

    /**
     * Get comprehensive ID health report
     */
    static async getHealthReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_users: 0,
                total_projects: 0,
                total_employees: 0,
                role_distribution: {},
                project_assignments: {},
                health_score: 100
            }
        };

        try {
            // Get total counts
            const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
            report.summary.total_users = userCount[0].count;

            const [projectCount] = await pool.query('SELECT COUNT(*) as count FROM projects');
            report.summary.total_projects = projectCount[0].count;

            const [empCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
            report.summary.total_employees = empCount[0].count;

            // Get role distribution
            const [roleDist] = await pool.query(
                'SELECT role, COUNT(*) as count FROM users GROUP BY role'
            );
            report.summary.role_distribution = roleDist.reduce((acc, row) => {
                acc[row.role] = row.count;
                return acc;
            }, {});

            // Get project assignments
            const [projAssign] = await pool.query(
                `SELECT p.id, p.project_code, p.project_name, COUNT(e.id) as employee_count
                 FROM projects p
                 LEFT JOIN employees e ON p.id = e.assigned_project_id
                 GROUP BY p.id`
            );
            report.summary.project_assignments = projAssign.reduce((acc, row) => {
                acc[row.project_code] = {
                    name: row.project_name,
                    employees: row.employee_count
                };
                return acc;
            }, {});

            // Calculate health score
            const verification = await this.runCompleteVerification();
            const totalChecks = verification.checks.length;
            const passedChecks = verification.checks.filter(c => c.status === 'PASS').length;
            
            report.summary.health_score = totalChecks > 0 
                ? Math.round((passedChecks / totalChecks) * 100) 
                : 100;

            report.verification = verification;

            return report;
        } catch (error) {
            console.error('Failed to generate health report:', error);
            return report;
        }
    }
}

module.exports = AutoIDVerificationService;
