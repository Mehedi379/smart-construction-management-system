const pool = require('../config/database');
const NotificationService = require('./notificationService');

class SignatureWorkflowService {
    /**
     * Start workflow for a sheet
     */
    static async startWorkflow(sheetId, projectId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            // Get sheet workflow template
            const [workflows] = await conn.query(
                'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
            );
            
            if (workflows.length === 0) {
                throw new Error('No workflow template found');
            }
            
            const workflowTemplateId = workflows[0].id;
            
            // Check if workflow already exists
            const [existingWorkflow] = await conn.query(
                'SELECT id FROM sheet_workflows WHERE sheet_id = ?',
                [sheetId]
            );
            
            if (existingWorkflow.length > 0) {
                throw new Error('Workflow already exists for this sheet');
            }
            
            // Create sheet_workflow record
            const [result] = await conn.query(
                'INSERT INTO sheet_workflows (sheet_id, workflow_id, current_step, status) VALUES (?, ?, 1, "pending")',
                [sheetId, workflowTemplateId]
            );
            
            // Update sheet status
            await conn.query(
                'UPDATE daily_sheets SET status = "pending" WHERE id = ?',
                [sheetId]
            );
            
            // Notify first role - ONLY users from SAME PROJECT
            const [firstStep] = await conn.query(
                `SELECT ws.role_id, r.role_name, r.role_code
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ? AND ws.step_number = 1`,
                [workflowTemplateId]
            );
            
            if (firstStep.length > 0) {
                // Find users with this role AND same project
                const [users] = await conn.query(
                    `SELECT u.id, u.email, u.name, u.role
                     FROM users u
                     INNER JOIN employees e ON u.id = e.user_id
                     WHERE u.role = ? 
                     AND u.is_active = TRUE
                     AND e.assigned_project_id = ?`,
                    [firstStep[0].role_code, projectId]
                );
                
                // Send notifications
                for (const userData of users) {
                    await conn.query(
                        `INSERT INTO notifications (user_id, notification_type, entity_type, entity_id, title, message)
                         VALUES (?, 'signature_request', 'sheet', ?, 'Sheet Signature Required', ?)`,
                        [userData.id, sheetId, `Daily sheet requires your signature as ${firstStep[0].role_name}`]
                    );
                }
            }
            
            await conn.commit();
            
            return {
                success: true,
                workflowId: result.insertId,
                message: 'Workflow started successfully'
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    /**
     * Sign a sheet with role-based validation
     */
    static async signSheet(sheetId, userId, signatureData, comments = '') {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Get sheet workflow
            const [workflows] = await conn.query(
                'SELECT * FROM sheet_workflows WHERE sheet_id = ? AND status IN ("pending", "in_review")',
                [sheetId]
            );

            if (workflows.length === 0) {
                throw new Error('No active workflow found for this sheet');
            }

            const workflow = workflows[0];

            // Get current step
            const [steps] = await conn.query(
                `SELECT ws.*, r.role_code, r.role_name
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ? AND ws.step_number = ?`,
                [workflow.workflow_id, workflow.current_step]
            );

            if (steps.length === 0) {
                throw new Error('No workflow step found');
            }

            const currentStep = steps[0];

            // Check if user has the required role
            const [user] = await conn.query(
                'SELECT role FROM users WHERE id = ?',
                [userId]
            );

            if (user.length === 0 || user[0].role !== currentStep.role_code) {
                throw new Error(`You do not have the required role (${currentStep.role_name}) to sign at this step. Your role: ${user[0]?.role || 'none'}`);
            }

            // Check if already signed
            const [existingSig] = await conn.query(
                'SELECT id FROM universal_signatures WHERE entity_type = "sheet" AND entity_id = ? AND step_number = ? AND user_id = ?',
                [sheetId, currentStep.step_number, userId]
            );

            if (existingSig.length > 0) {
                throw new Error('You have already signed this sheet');
            }

            // Add signature
            await conn.query(
                `INSERT INTO universal_signatures 
                (entity_type, entity_id, workflow_id, step_number, user_id, role_id, action, signature_data, comments, ip_address)
                VALUES ('sheet', ?, ?, ?, ?, ?, 'signed', ?, ?, ?)`,
                [sheetId, workflow.workflow_id, currentStep.step_number, userId, currentStep.role_id, signatureData, comments, '127.0.0.1']
            );

            // Update workflow to next step
            const nextStep = currentStep.step_number + 1;
            
            // Check if this was the last step
            const [totalSteps] = await conn.query(
                'SELECT COUNT(*) as count FROM workflow_steps WHERE workflow_id = ?',
                [workflow.workflow_id]
            );

            if (nextStep > totalSteps[0].count) {
                // All steps completed - finalize sheet
                await conn.query(
                    'UPDATE sheet_workflows SET status = "completed", completed_at = NOW() WHERE id = ?',
                    [workflow.id]
                );
                await conn.query(
                    'UPDATE daily_sheets SET status = "approved", approved_at = NOW() WHERE id = ?',
                    [sheetId]
                );
                
                console.log(`✅ Sheet ${sheetId} fully approved and locked!`);
            } else {
                // Move to next step
                await conn.query(
                    'UPDATE sheet_workflows SET current_step = ? WHERE id = ?',
                    [nextStep, workflow.id]
                );

                // Notify next role
                await NotificationService.notifyNextRole(sheetId, workflow.workflow_id, nextStep);
            }

            await conn.commit();
            return { success: true, message: 'Signature added successfully' };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    /**
     * Reject a sheet with reason
     */
    static async rejectSheet(sheetId, userId, reason) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Get sheet workflow
            const [workflows] = await conn.query(
                'SELECT * FROM sheet_workflows WHERE sheet_id = ? AND status IN ("pending", "in_review")',
                [sheetId]
            );

            if (workflows.length === 0) {
                throw new Error('No active workflow found for this sheet');
            }

            const workflow = workflows[0];

            // Get current step
            const [steps] = await conn.query(
                `SELECT ws.*, r.role_code, r.role_name
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ? AND ws.step_number = ?`,
                [workflow.workflow_id, workflow.current_step]
            );

            if (steps.length === 0) {
                throw new Error('No workflow step found');
            }

            const currentStep = steps[0];

            // Check if user has the required role
            const [user] = await conn.query(
                'SELECT role FROM users WHERE id = ?',
                [userId]
            );

            if (user.length === 0 || user[0].role !== currentStep.role_code) {
                throw new Error(`You do not have the required role to reject at this step`);
            }

            // Record rejection
            await conn.query(
                `INSERT INTO universal_signatures 
                (entity_type, entity_id, workflow_id, step_number, user_id, role_id, action, comments, ip_address)
                VALUES ('sheet', ?, ?, ?, ?, ?, 'rejected', ?, ?)`,
                [sheetId, workflow.workflow_id, currentStep.step_number, userId, currentStep.role_id, reason, '127.0.0.1']
            );

            // Update sheet status to rejected
            await conn.query(
                'UPDATE sheet_workflows SET status = "rejected", completed_at = NOW() WHERE id = ?',
                [workflow.id]
            );
            await conn.query(
                'UPDATE daily_sheets SET status = "rejected", rejected_at = NOW(), rejected_by = ?, rejection_reason = ? WHERE id = ?',
                [userId, reason, sheetId]
            );

            console.log(`❌ Sheet ${sheetId} rejected by user ${userId}`);

            await conn.commit();
            return { 
                success: true, 
                message: 'Sheet rejected',
                rejected_by: userId,
                reason: reason
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    /**
     * Restart workflow from Step 1 (Re-Request)
     */
    static async restartWorkflow(sheetId, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Get sheet and project
            const [sheetData] = await pool.query(
                'SELECT id, project_id, status FROM daily_sheets WHERE id = ?',
                [sheetId]
            );

            if (sheetData.length === 0) {
                throw new Error('Sheet not found');
            }

            const sheet = sheetData[0];

            // Can only restart rejected sheets
            if (sheet.status !== 'rejected') {
                throw new Error('Can only restart rejected workflows');
            }

            // Get workflow
            const [workflows] = await pool.query(
                'SELECT * FROM sheet_workflows WHERE sheet_id = ? AND status = "rejected"',
                [sheetId]
            );

            if (workflows.length === 0) {
                throw new Error('No rejected workflow found');
            }

            const workflow = workflows[0];

            // Reset workflow to step 1
            await conn.query(
                'UPDATE sheet_workflows SET current_step = 1, status = "pending", completed_at = NULL WHERE id = ?',
                [workflow.id]
            );

            // Update sheet status
            await conn.query(
                'UPDATE daily_sheets SET status = "pending", rejected_at = NULL, rejected_by = NULL, rejection_reason = NULL WHERE id = ?',
                [sheetId]
            );

            // Optionally clear previous signatures (commented out to keep history)
            // await conn.query('DELETE FROM universal_signatures WHERE entity_type = "sheet" AND entity_id = ?', [sheetId]);

            // Get first step role
            const [firstStep] = await conn.query(
                `SELECT ws.role_id, r.role_code, r.role_name 
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ? AND ws.step_number = 1`,
                [workflow.workflow_id]
            );

            if (firstStep.length > 0) {
                // Find users with this role AND same project
                const [users] = await conn.query(
                    `SELECT u.id, u.email, u.name 
                     FROM users u
                     INNER JOIN employees e ON u.id = e.user_id
                     WHERE u.role = ? 
                     AND u.is_active = TRUE
                     AND e.assigned_project_id = ?`,
                    [firstStep[0].role_code, sheet.project_id]
                );

                // Send re-request notifications
                for (const userData of users) {
                    await conn.query(
                        `INSERT INTO notifications (user_id, notification_type, entity_type, entity_id, title, message)
                         VALUES (?, 'signature_request', 'sheet', ?, 'Sheet Re-Request - Signature Required', ?)`,
                        [userData.id, sheetId, `Daily sheet has been re-requested and requires your signature as ${firstStep[0].role_name}`]
                    );
                }

                console.log(`🔄 Sheet ${sheetId} re-requested. Notifications sent to ${users.length} user(s)`);
            }

            await conn.commit();
            return { 
                success: true, 
                message: 'Workflow restarted from Step 1',
                sheet_id: sheetId
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    /**
     * Get signature status for a sheet
     */
    static async getSheetSignatureStatus(sheetId) {
        // Get workflow
        const [workflows] = await pool.query(
            'SELECT * FROM sheet_workflows WHERE sheet_id = ?',
            [sheetId]
        );

        if (workflows.length === 0) {
            return { status: 'no_workflow' };
        }

        const workflow = workflows[0];

        // Get all workflow steps
        const [steps] = await pool.query(
            `SELECT ws.*, r.role_name, r.role_code
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = ?
             ORDER BY ws.step_number`,
            [workflow.workflow_id]
        );

        // Get signatures from sheet_signatures table
        const [signatures] = await pool.query(
            `SELECT ss.*, u.name as signer_name
             FROM sheet_signatures ss
             INNER JOIN users u ON ss.user_id = u.id
             WHERE ss.sheet_id = ?
             ORDER BY ss.step_number`,
            [sheetId]
        );

        // Build signature status
        const signatureStatus = steps.map(step => {
            const signature = signatures.find(sig => sig.step_number === step.step_number);
            return {
                step_number: step.step_number,
                role_name: step.role_name,
                role_code: step.role_code,
                status: signature ? signature.action : 'waiting',
                signer_name: signature?.signer_name || null,
                signed_at: signature?.signed_at || null,
                signature_data: signature?.signature_data || null,
                comments: signature?.comments || null,
                signed_by: signature?.signer_name || null
            };
        });

        return {
            workflow_status: workflow.status,
            current_step: workflow.current_step,
            completed_at: workflow.completed_at,
            signatures: signatureStatus
        };
    }

    /**
     * Get pending signatures for a user
     */
    static async getMyPendingSignatures(userId) {
        // Get user's role code
        const [user] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return [];
        }

        const userRoleCode = user[0].role;

        // Get pending signature requests from signature_requests table
        const [pending] = await pool.query(
            `SELECT 
                sr.id as request_id,
                ds.id as sheet_id,
                ds.sheet_no,
                ds.sheet_date,
                ds.project_id,
                p.project_name,
                ds.total_amount,
                sr.role_code as required_role_code,
                sr.role_name as required_role,
                sr.status as request_status,
                sr.requested_at,
                'sheet' as entity_type
            FROM signature_requests sr
            INNER JOIN daily_sheets ds ON sr.sheet_id = ds.id
            INNER JOIN projects p ON ds.project_id = p.id
            WHERE sr.role_code = ?
            AND sr.status = 'requested'
            ORDER BY sr.requested_at DESC`,
            [userRoleCode]
        );

        return pending;
    }
}

module.exports = SignatureWorkflowService;
