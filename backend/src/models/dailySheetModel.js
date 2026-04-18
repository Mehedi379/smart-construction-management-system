const pool = require('../config/database');

class DailySheetModel {
    // Create new daily sheet
    static async create(sheetData) {
        const {
            sheet_no, project_id, sheet_date, location,
            previous_balance, today_expense, remaining_balance,
            receipt_image, ocr_text, created_by
        } = sheetData;

        const [result] = await pool.query(
            `INSERT INTO daily_sheets 
            (sheet_no, project_id, sheet_date, location, previous_balance, 
             today_expense, remaining_balance, receipt_image, ocr_text, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sheet_no, project_id || null, sheet_date, location || '',
             previous_balance || 0, today_expense || 0, remaining_balance || 0,
             receipt_image || null, ocr_text || null, created_by]
        );

        return result.insertId;
    }

    // Get all daily sheets with filters
    static async findAll(filters = {}) {
        let query = `
            SELECT ds.*, p.project_name, p.project_code, u.name as created_by_name
            FROM daily_sheets ds
            LEFT JOIN projects p ON ds.project_id = p.id
            LEFT JOIN users u ON ds.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.project_id) {
            query += ' AND ds.project_id = ?';
            params.push(filters.project_id);
        }

        if (filters.date) {
            query += ' AND ds.sheet_date = ?';
            params.push(filters.date);
        }

        if (filters.from_date) {
            query += ' AND ds.sheet_date >= ?';
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            query += ' AND ds.sheet_date <= ?';
            params.push(filters.to_date);
        }

        if (filters.status) {
            query += ' AND ds.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY ds.sheet_date DESC, ds.created_at DESC';

        const [sheets] = await pool.query(query, params);
        return sheets;
    }

    // Get single daily sheet with items and signatures
    static async findById(id) {
        // Get sheet details
        const [sheets] = await pool.query(
            `SELECT ds.*, p.project_name, p.project_code, u.name as created_by_name
             FROM daily_sheets ds
             LEFT JOIN projects p ON ds.project_id = p.id
             LEFT JOIN users u ON ds.created_by = u.id
             WHERE ds.id = ?`,
            [id]
        );

        if (sheets.length === 0) return null;

        const sheet = sheets[0];

        // Get items
        const [items] = await pool.query(
            `SELECT * FROM daily_sheet_items 
             WHERE sheet_id = ? 
             ORDER BY item_no ASC`,
            [id]
        );

        // Get signatures
        const [signatures] = await pool.query(
            `SELECT * FROM daily_sheet_signatures WHERE sheet_id = ?`,
            [id]
        );

        return {
            ...sheet,
            items,
            signatures: signatures[0] || null
        };
    }

    // Add items to daily sheet
    static async addItems(sheetId, items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await pool.query(
                `INSERT INTO daily_sheet_items 
                (sheet_id, item_no, description, qty, rate, amount, source, source_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [sheetId, i + 1, item.description, item.qty || 0, item.rate || 0,
                 item.amount, item.source || 'manual', item.source_id || null]
            );
        }
    }

    // Create or update signatures
    static async saveSignatures(sheetId, signatureData) {
        const [existing] = await pool.query(
            'SELECT id FROM daily_sheet_signatures WHERE sheet_id = ?',
            [sheetId]
        );

        // Build signature data for database
        const dbData = {
            sheet_id: sheetId,
            receiver_signature: signatureData.receiver?.signature || null,
            receiver_name: signatureData.receiver?.name || null,
            receiver_date: signatureData.receiver?.date || null,
            payer_signature: signatureData.payer?.signature || null,
            payer_name: signatureData.payer?.name || null,
            payer_date: signatureData.payer?.date || null,
            prepared_by_signature: signatureData.prepared_by?.signature || signatureData.prepared_by_signature || null,
            prepared_by_name: signatureData.prepared_by?.name || signatureData.prepared_by_name || null,
            prepared_by_date: signatureData.prepared_by?.date || signatureData.prepared_by_date || null,
            checked_by_signature: signatureData.checked_by?.signature || null,
            checked_by_name: signatureData.checked_by?.name || null,
            checked_by_date: signatureData.checked_by?.date || null,
            approved_by_signature: signatureData.approved_by?.signature || null,
            approved_by_name: signatureData.approved_by?.name || null,
            approved_by_date: signatureData.approved_by?.date || null
        };

        if (existing.length > 0) {
            // Update
            await pool.query(
                `UPDATE daily_sheet_signatures SET ? WHERE sheet_id = ?`,
                [dbData, sheetId]
            );
        } else {
            // Insert
            await pool.query(
                `INSERT INTO daily_sheet_signatures SET ?`,
                dbData
            );
        }

        // Check if all 5 signatures are complete and auto-lock
        await this.checkAndAutoLock(sheetId);
    }

    // Check if all signatures are complete and lock sheet
    static async checkAndAutoLock(sheetId) {
        const [signatures] = await pool.query(
            `SELECT receiver_signature, payer_signature, prepared_by_signature, 
                    checked_by_signature, approved_by_signature
             FROM daily_sheet_signatures
             WHERE sheet_id = ?`,
            [sheetId]
        );

        if (signatures.length === 0) return false;

        const sig = signatures[0];
        const completedSignatures = [
            sig.receiver_signature,
            sig.payer_signature,
            sig.prepared_by_signature,
            sig.checked_by_signature,
            sig.approved_by_signature
        ].filter(s => s !== null && s !== undefined && s !== '').length;

        // If all 5 signatures are present, lock the sheet
        if (completedSignatures === 5) {
            await this.lockSheet(sheetId);
            return true;
        }

        return false;
    }

    // Lock sheet (prevent edits)
    static async lockSheet(sheetId) {
        await pool.query(
            `UPDATE daily_sheets 
             SET status = 'approved', 
                 is_locked = TRUE, 
                 locked_at = NOW()
             WHERE id = ?`,
            [sheetId]
        );
    }

    // Check if sheet is locked
    static async isLocked(sheetId) {
        const [sheets] = await pool.query(
            'SELECT is_locked, status FROM daily_sheets WHERE id = ?',
            [sheetId]
        );

        if (sheets.length === 0) return false;
        return sheets[0].is_locked === 1 || sheets[0].status === 'approved';
    }

    // Update sheet
    static async update(id, updateData) {
        // Check if sheet is locked
        const isSheetLocked = await this.isLocked(id);
        
        if (isSheetLocked) {
            throw new Error('Sheet is locked. All 5 signatures are complete. Cannot edit.');
        }

        await pool.query(
            'UPDATE daily_sheets SET ? WHERE id = ?',
            [updateData, id]
        );
    }

    // Delete sheet
    static async delete(id) {
        await pool.query('DELETE FROM daily_sheets WHERE id = ?', [id]);
    }

    // Generate sheet number (YYMMDD + sequence)
    static async generateSheetNo() {
        const today = new Date();
        const prefix = today.getFullYear().toString().slice(-2) +
                      (today.getMonth() + 1).toString().padStart(2, '0') +
                      today.getDate().toString().padStart(2, '0');

        const [result] = await pool.query(
            `SELECT COUNT(*) as count FROM daily_sheets 
             WHERE sheet_no LIKE ?`,
            [`${prefix}%`]
        );

        const sequence = (result[0].count + 1).toString().padStart(2, '0');
        return `${prefix}${sequence}`;
    }

    // Get project balance (previous balance)
    static async getProjectBalance(projectId, beforeDate) {
        const [result] = await pool.query(
            `SELECT 
                COALESCE(SUM(previous_balance), 0) as total_previous,
                COALESCE(SUM(today_expense), 0) as total_expense
             FROM daily_sheets
             WHERE project_id = ? AND sheet_date < ?`,
            [projectId, beforeDate]
        );

        const totalPrevious = parseFloat(result[0].total_previous) || 0;
        const totalExpense = parseFloat(result[0].total_expense) || 0;
        
        // Previous balance = All previous remaining balance
        return totalPrevious - totalExpense;
    }
}

// Add pool reference for stored procedure calls
DailySheetModel.pool = pool;

module.exports = DailySheetModel;
