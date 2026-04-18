const pool = require('../config/database');
const NotificationService = require('./notificationService');

class SignatureRequestService {
    
    // Initialize signature requests for a sheet (6 roles - UPDATED TO MATCH WORKFLOW)
    static async initializeRequests(sheetId, userId) {
        // Updated role codes to match the 6-step workflow
        const roles = [
            { code: 'site_manager', name: 'Site Manager Verification' },
            { code: 'site_engineer', name: 'Site Engineer Approval' },
            { code: 'project_director', name: 'Project Director Approval' },
            { code: 'deputy_director', name: 'Deputy Director Review' },
            { code: 'head_office_accounts', name: 'Head Office Accounts Approval' },
            { code: 'head_office_admin', name: 'Head Office Admin Final Approval' }
        ];

        for (const role of roles) {
            await pool.query(
                `INSERT INTO signature_requests 
                (sheet_id, role_code, role_name, requested_by, status)
                VALUES (?, ?, ?, ?, 'not_requested')`,
                [sheetId, role.code, role.name, userId]
            );
        }

        return { message: 'Signature requests initialized', roles };
    }

    // Send request to a specific role
    static async sendRequest(sheetId, roleCode, requestedBy) {
        // Get user's role to authorize
        const [user] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [requestedBy]
        );

        if (user.length === 0) {
            throw new Error('User not found');
        }

        // Get request
        const [requests] = await pool.query(
            'SELECT * FROM signature_requests WHERE sheet_id = ? AND role_code = ?',
            [sheetId, roleCode]
        );

        if (requests.length === 0) {
            throw new Error('Signature role not found');
        }

        const request = requests[0];

        if (request.status !== 'not_requested') {
            throw new Error(`Request already ${request.status}`);
        }

        // Update request status
        await pool.query(
            'UPDATE signature_requests SET status = "requested", requested_by = ? WHERE id = ?',
            [requestedBy, request.id]
        );

        // Get users with this role
        const [roleUsers] = await pool.query(
            'SELECT id, name, email FROM users WHERE role = ?',
            [roleCode]
        );

        // Send notifications
        for (const roleUser of roleUsers) {
            await NotificationService.createNotification(
                roleUser.id,
                'signature_request',
                'sheet',
                sheetId,
                'Signature Request',
                `You have a new signature request for sheet.`
            );
        }

        return {
            message: `Request sent to ${roleUsers.length} user(s)`,
            sent_to: roleUsers.map(u => u.name)
        };
    }

    // Sign a sheet (when request is received)
    static async signSheet(sheetId, roleCode, userId, signatureData, comments = '') {
        // Get user's role
        const [user] = await pool.query(
            'SELECT role, name FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0 || user[0].role !== roleCode) {
            throw new Error(`You do not have the ${roleCode} role`);
        }

        // Get request
        const [requests] = await pool.query(
            'SELECT * FROM signature_requests WHERE sheet_id = ? AND role_code = ?',
            [sheetId, roleCode]
        );

        if (requests.length === 0) {
            throw new Error('Request not found');
        }

        const request = requests[0];

        if (request.status !== 'requested') {
            throw new Error(`Cannot sign. Status: ${request.status}`);
        }

        // Update request with signature
        await pool.query(
            `UPDATE signature_requests 
            SET status = 'signed', signed_by = ?, signed_at = NOW(), 
                signature_data = ?, comments = ?
            WHERE id = ?`,
            [userId, signatureData, comments, request.id]
        );

        // Note: Removed INSERT into sheet_signatures as it has different schema
        // Use sheet_signatures table with proper columns if needed for backward compatibility

        // Check if all signatures are complete
        const [allRequests] = await pool.query(
            'SELECT * FROM signature_requests WHERE sheet_id = ?',
            [sheetId]
        );

        const allSigned = allRequests.every(r => r.status === 'signed');

        if (allSigned) {
            // Update sheet status to approved
            await pool.query(
                'UPDATE daily_sheets SET status = "approved" WHERE id = ?',
                [sheetId]
            );
        }

        return {
            message: 'Sheet signed successfully',
            all_signed: allSigned
        };
    }

    // Get signature request status for a sheet
    static async getSheetStatus(sheetId) {
        const [requests] = await pool.query(
            `SELECT sr.*, 
                    u1.name as requested_by_name,
                    u2.name as signed_by_name
             FROM signature_requests sr
             LEFT JOIN users u1 ON sr.requested_by = u1.id
             LEFT JOIN users u2 ON sr.signed_by = u2.id
             WHERE sr.sheet_id = ?
             ORDER BY FIELD(sr.role_code, 'site_manager', 'site_engineer', 'project_director', 'deputy_director', 'head_office_accounts', 'head_office_admin')`,
            [sheetId]
        );

        return requests;
    }

    // Get my pending requests (for a specific user)
    static async getMyRequests(userId) {
        // Get user's role
        const [user] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return [];
        }

        const [requests] = await pool.query(
            `SELECT sr.*, ds.sheet_no, ds.sheet_date, ds.project_id, p.project_name
             FROM signature_requests sr
             INNER JOIN daily_sheets ds ON sr.sheet_id = ds.id
             INNER JOIN projects p ON ds.project_id = p.id
             WHERE sr.role_code = ? AND sr.status = 'requested'
             ORDER BY sr.requested_at DESC`,
            [user[0].role]
        );

        return requests;
    }
}

module.exports = SignatureRequestService;
