// ============================================
// FINANCIAL ENGINE SERVICE
// Real-time auto-calculation for projects
// Smart Construction Management System
// ============================================

const pool = require('../config/database');

class FinancialEngine {
    
    /**
     * Calculate complete project financials
     * This is the CORE calculation engine
     */
    static async calculateProjectFinancials(projectId) {
        const conn = await pool.getConnection();
        
        try {
            // Get project budget
            const [project] = await conn.query(
                `SELECT id, estimated_budget, project_name, project_code 
                 FROM projects WHERE id = ?`,
                [projectId]
            );
            
            if (project.length === 0) {
                throw new Error('Project not found');
            }
            
            const budget = project[0].estimated_budget;
            
            // Calculate total from approved daily sheets
            const [sheetTotals] = await conn.query(
                `SELECT 
                    COUNT(*) as sheet_count,
                    COALESCE(SUM(total_labor_cost), 0) as total_labor_cost,
                    COALESCE(SUM(total_material_cost), 0) as total_material_cost,
                    COALESCE(SUM(grand_total), 0) as total_sheet_cost
                 FROM daily_sheets
                 WHERE project_id = ? AND status = 'approved'`,
                [projectId]
            );
            
            // Calculate total from approved vouchers
            const [voucherTotals] = await conn.query(
                `SELECT 
                    COUNT(*) as voucher_count,
                    COALESCE(SUM(amount), 0) as total_voucher_cost
                 FROM vouchers
                 WHERE project_id = ? AND status = 'approved'`,
                [projectId]
            );
            
            // Calculate total from expenses
            const [expenseTotals] = await conn.query(
                `SELECT 
                    COUNT(*) as expense_count,
                    COALESCE(SUM(amount), 0) as total_expense
                 FROM expenses
                 WHERE project_id = ?`,
                [projectId]
            );
            
            // Calculate grand total
            const totalCost = parseFloat(sheetTotals[0].total_sheet_cost) + 
                            parseFloat(voucherTotals[0].total_voucher_cost) + 
                            parseFloat(expenseTotals[0].total_expense);
            
            // Calculate balance
            const remainingBalance = budget - totalCost;
            const profitLoss = budget - totalCost;
            
            // Get category-wise breakdown
            const [categoryBreakdown] = await conn.query(
                `SELECT 
                    c.category_name,
                    c.category_type,
                    COUNT(DISTINCT e.id) as employee_count,
                    COALESCE(SUM(se.total_amount), 0) as total_spent
                 FROM categories c
                 LEFT JOIN employees e ON c.id = e.category_id 
                    AND e.assigned_project_id = ? AND e.status = 'active'
                 LEFT JOIN sheet_entries se ON c.id = se.category_id 
                    AND se.project_id = ? AND se.sheet_id IN (
                        SELECT id FROM daily_sheets WHERE project_id = ? AND status = 'approved'
                    )
                 WHERE c.is_active = TRUE
                 GROUP BY c.id
                 ORDER BY total_spent DESC`,
                [projectId, projectId, projectId]
            );
            
            // Get employee statistics
            const [employeeStats] = await conn.query(
                `SELECT 
                    c.category_name,
                    COUNT(*) as count,
                    SUM(CASE WHEN e.monthly_salary > 0 THEN e.monthly_salary ELSE 0 END) as total_monthly,
                    SUM(CASE WHEN e.daily_wage > 0 THEN e.daily_wage ELSE 0 END) as total_daily
                 FROM employees e
                 JOIN categories c ON e.category_id = c.id
                 WHERE e.assigned_project_id = ? AND e.status = 'active'
                 GROUP BY c.category_name`,
                [projectId]
            );
            
            // Build financial summary
            const financialSummary = {
                projectId,
                projectName: project[0].project_name,
                projectCode: project[0].project_code,
                budget: parseFloat(budget),
                
                // Costs
                totalSheetCost: parseFloat(sheetTotals[0].total_sheet_cost),
                totalVoucherCost: parseFloat(voucherTotals[0].total_voucher_cost),
                totalExpenseCost: parseFloat(expenseTotals[0].total_expense),
                totalLaborCost: parseFloat(sheetTotals[0].total_labor_cost),
                totalMaterialCost: parseFloat(sheetTotals[0].total_material_cost),
                totalCost: parseFloat(totalCost),
                
                // Balance
                remainingBalance: parseFloat(remainingBalance),
                profitLoss: parseFloat(profitLoss),
                budgetUtilization: budget > 0 ? ((totalCost / budget) * 100).toFixed(2) : 0,
                
                // Counts
                sheetCount: sheetTotals[0].sheet_count,
                voucherCount: voucherTotals[0].voucher_count,
                expenseCount: expenseTotals[0].expense_count,
                
                // Breakdowns
                categoryBreakdown: categoryBreakdown,
                employeeStats: employeeStats,
                
                // Timestamp
                calculatedAt: new Date().toISOString()
            };
            
            // Update projects table with latest totals
            await conn.query(
                `UPDATE projects 
                 SET 
                    total_cost = ?,
                    total_sheet_cost = ?,
                    total_voucher_cost = ?,
                    total_labor_cost = ?,
                    remaining_balance = ?,
                    profit_loss = ?,
                    updated_at = NOW()
                 WHERE id = ?`,
                [
                    financialSummary.totalCost,
                    financialSummary.totalSheetCost,
                    financialSummary.totalVoucherCost,
                    financialSummary.totalLaborCost,
                    financialSummary.remainingBalance,
                    financialSummary.profitLoss,
                    projectId
                ]
            );
            
            // Update financial summary table
            await conn.query(
                `INSERT INTO project_financial_summary (
                    project_id, summary_date, budget,
                    total_labor_cost, total_material_cost, total_voucher_cost,
                    total_expense, grand_total_cost,
                    remaining_balance, profit_loss, category_breakdown
                ) VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    budget = VALUES(budget),
                    total_labor_cost = VALUES(total_labor_cost),
                    total_material_cost = VALUES(total_material_cost),
                    total_voucher_cost = VALUES(total_voucher_cost),
                    total_expense = VALUES(total_expense),
                    grand_total_cost = VALUES(grand_total_cost),
                    remaining_balance = VALUES(remaining_balance),
                    profit_loss = VALUES(profit_loss),
                    category_breakdown = VALUES(category_breakdown),
                    updated_at = NOW()`,
                [
                    projectId,
                    financialSummary.budget,
                    financialSummary.totalLaborCost,
                    financialSummary.totalMaterialCost,
                    financialSummary.totalVoucherCost,
                    financialSummary.totalExpenseCost,
                    financialSummary.totalCost,
                    financialSummary.remainingBalance,
                    financialSummary.profitLoss,
                    JSON.stringify(categoryBreakdown)
                ]
            );
            
            return financialSummary;
            
        } catch (error) {
            throw error;
        } finally {
            conn.release();
        }
    }
    
    /**
     * Get global summary for all projects (Admin Dashboard)
     */
    static async getGlobalSummary() {
        const [summary] = await pool.query(
            `SELECT 
                COUNT(*) as total_projects,
                SUM(estimated_budget) as total_budget,
                SUM(total_cost) as total_cost,
                SUM(total_sheet_cost) as total_sheet_cost,
                SUM(total_voucher_cost) as total_voucher_cost,
                SUM(remaining_balance) as total_remaining,
                SUM(profit_loss) as total_profit_loss,
                AVG(budget_utilization) as avg_utilization
             FROM projects
             WHERE status IN ('ongoing', 'planning')`
        );
        
        // Get highest cost project
        const [highestCostProject] = await pool.query(
            `SELECT id, project_name, project_code, total_cost, estimated_budget
             FROM projects
             ORDER BY total_cost DESC
             LIMIT 1`
        );
        
        // Get category-wise spending across all projects
        const [categorySpending] = await pool.query(
            `SELECT 
                c.category_name,
                COUNT(DISTINCT p.id) as project_count,
                SUM(se.total_amount) as total_spent
             FROM categories c
             LEFT JOIN sheet_entries se ON c.id = se.category_id
             LEFT JOIN daily_sheets ds ON se.sheet_id = ds.id
             LEFT JOIN projects p ON ds.project_id = p.id
             WHERE c.is_active = TRUE AND ds.status = 'approved'
             GROUP BY c.id
             ORDER BY total_spent DESC`
        );
        
        return {
            ...summary[0],
            highestCostProject: highestCostProject[0] || null,
            categorySpending: categorySpending,
            calculatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Trigger recalculation after data changes
     */
    static async triggerRecalculation(projectId) {
        try {
            const result = await this.calculateProjectFinancials(projectId);
            return {
                success: true,
                message: 'Financials recalculated',
                data: result
            };
        } catch (error) {
            console.error('Recalculation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = FinancialEngine;
