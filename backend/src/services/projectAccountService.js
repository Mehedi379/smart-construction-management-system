// ============================================
// PROJECT ACCOUNT SERVICE
// Auto-creates accounting structure for new projects
// Smart Construction Management System
// ============================================

const pool = require('../config/database');

class ProjectAccountService {
    
    /**
     * Create default accounts structure for a new project
     * Called automatically when project is created
     */
    static async createDefaultAccounts(projectId, projectName) {
        const conn = await pool.getConnection();
        
        try {
            await conn.beginTransaction();
            
            // Default accounts for every project
            const defaultAccounts = [
                {
                    account_code: `PRJ${projectId}-LABOR`,
                    account_name: `${projectName} - Labor Costs`,
                    account_type: 'expense',
                    category: 'Labor'
                },
                {
                    account_code: `PRJ${projectId}-MATERIAL`,
                    account_name: `${projectName} - Material Costs`,
                    account_type: 'expense',
                    category: 'Material'
                },
                {
                    account_code: `PRJ${projectId}-EQUIPMENT`,
                    account_name: `${projectName} - Equipment Costs`,
                    account_type: 'expense',
                    category: 'Equipment'
                },
                {
                    account_code: `PRJ${projectId}-MISC`,
                    account_name: `${projectName} - Miscellaneous`,
                    account_type: 'expense',
                    category: 'Miscellaneous'
                },
                {
                    account_code: `PRJ${projectId}-INCOME`,
                    account_name: `${projectName} - Project Income`,
                    account_type: 'revenue',
                    category: 'Income'
                },
                {
                    account_code: `PRJ${projectId}-BUDGET`,
                    account_name: `${projectName} - Budget Allocation`,
                    account_type: 'asset',
                    category: 'Budget'
                }
            ];
            
            // Insert default accounts
            for (const account of defaultAccounts) {
                await conn.query(
                    `INSERT INTO project_accounts (
                        project_id, account_code, account_name, 
                        account_type, category, opening_balance, current_balance
                    ) VALUES (?, ?, ?, ?, ?, 0, 0)`,
                    [projectId, account.account_code, account.account_name, 
                     account.account_type, account.category]
                );
            }
            
            // Initialize financial summary
            await conn.query(
                `INSERT INTO project_financial_summary (
                    project_id, summary_date, budget,
                    total_labor_cost, total_material_cost, total_voucher_cost,
                    total_expense, grand_total_cost,
                    remaining_balance, profit_loss
                ) VALUES (?, CURDATE(), 0, 0, 0, 0, 0, 0, 0, 0)`,
                [projectId]
            );
            
            await conn.commit();
            
            return {
                success: true,
                message: `Default accounts created for project ${projectId}`,
                accountsCreated: defaultAccounts.length
            };
            
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
    
    /**
     * Get all accounts for a project
     */
    static async getProjectAccounts(projectId) {
        const [accounts] = await pool.query(
            `SELECT * FROM project_accounts 
             WHERE project_id = ? AND is_active = TRUE
             ORDER BY category, account_name`,
            [projectId]
        );
        
        return accounts;
    }
    
    /**
     * Update account balance
     */
    static async updateAccountBalance(projectId, accountCode, amount, type = 'debit') {
        const multiplier = type === 'debit' ? 1 : -1;
        
        await pool.query(
            `UPDATE project_accounts 
             SET current_balance = current_balance + (? * ?)
             WHERE project_id = ? AND account_code = ?`,
            [amount, multiplier, projectId, accountCode]
        );
    }
    
    /**
     * Get category-wise breakdown for a project
     */
    static async getCategoryBreakdown(projectId) {
        const [breakdown] = await pool.query(
            `SELECT 
                c.category_name,
                c.category_type,
                COUNT(DISTINCT CASE WHEN c.category_type = 'employee' THEN e.id END) as employee_count,
                COALESCE(SUM(CASE WHEN c.category_type = 'employee' THEN e.monthly_salary + (e.daily_wage * 30) END), 0) as total_salary_estimate,
                COALESCE(SUM(CASE WHEN se.entry_type IN ('labor', 'material', 'expense') THEN se.total_amount END), 0) as total_spent
             FROM categories c
             LEFT JOIN employees e ON c.id = e.category_id AND e.assigned_project_id = ? AND e.status = 'active'
             LEFT JOIN sheet_entries se ON c.id = se.category_id AND se.project_id = ?
             WHERE c.is_active = TRUE
             GROUP BY c.id, c.category_name, c.category_type
             ORDER BY c.category_type, c.category_name`,
            [projectId, projectId]
        );
        
        return breakdown;
    }
}

module.exports = ProjectAccountService;
