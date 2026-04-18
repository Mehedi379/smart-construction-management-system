const SignatureWorkflowService = require('../services/signatureWorkflowService');
const NotificationService = require('../services/notificationService');
const PDFService = require('../services/pdfService');
const pool = require('../config/database');

class WorkflowController {
    /**
     * Sign a sheet
     */
    async signSheet(req, res) {
        try {
            const { id: sheetId } = req.params;
            const { signature_data, comments } = req.body;
            const userId = req.user.id;

            const result = await SignatureWorkflowService.signSheet(sheetId, userId, signature_data, comments);

            res.json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            console.error('Sign sheet error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get signature status for a sheet
     */
    async getSheetSignatureStatus(req, res) {
        try {
            const { id: sheetId } = req.params;
            const status = await SignatureWorkflowService.getSheetSignatureStatus(sheetId);

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Get signature status error:', error);
            // Return no_workflow status instead of error
            res.json({
                success: true,
                data: { 
                    status: 'no_workflow',
                    message: 'No workflow found for this sheet'
                }
            });
        }
    }

    /**
     * Get my notifications
     */
    async getMyNotifications(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                is_read: req.query.is_read,
                notification_type: req.query.notification_type,
                limit: req.query.limit || 50
            };

            const notifications = await NotificationService.getMyNotifications(userId, filters);

            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications'
            });
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(req, res) {
        try {
            const { id } = req.params;
            await NotificationService.markAsRead(id);

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Mark notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification'
            });
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead(req, res) {
        try {
            const userId = req.user.id;
            await NotificationService.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Mark all notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications'
            });
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await NotificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count'
            });
        }
    }

    /**
     * Get my pending signatures
     */
    async getMyPendingSignatures(req, res) {
        try {
            const userId = req.user.id;
            const pending = await SignatureWorkflowService.getMyPendingSignatures(userId);

            res.json({
                success: true,
                data: pending
            });
        } catch (error) {
            console.error('Get pending signatures error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pending signatures'
            });
        }
    }

    /**
     * Generate PDF for a sheet
     */
    async generateSheetPDF(req, res) {
        try {
            const { id: sheetId } = req.params;
            const pdfPath = await PDFService.generateSheetPDF(sheetId);

            res.json({
                success: true,
                message: 'PDF generated successfully',
                data: { 
                    pdf_path: pdfPath,
                    download_url: `http://localhost:${process.env.PORT || 9000}${pdfPath}`
                }
            });
        } catch (error) {
            console.error('Generate PDF error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate PDF',
                error: error.message
            });
        }
    }

    /**
     * Reject a sheet (send back to previous step)
     */
    async rejectSheet(req, res) {
        const conn = await pool.getConnection();
        try {
            const { id: sheetId } = req.params;
            const { reason, comments } = req.body;
            const userId = req.user.id;

            await conn.beginTransaction();

            // Get current workflow
            const [workflows] = await conn.query(
                'SELECT * FROM sheet_workflows WHERE sheet_id = ? AND status IN ("pending", "in_review")',
                [sheetId]
            );

            if (workflows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active workflow found for this sheet'
                });
            }

            const workflow = workflows[0];

            // Get current step
            const [steps] = await conn.query(
                `SELECT ws.*, r.role_name
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ? AND ws.step_number = ?`,
                [workflow.workflow_id, workflow.current_step]
            );

            if (steps.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Current step not found'
                });
            }

            const currentStep = steps[0];

            // Check if user has the required role
            const [userRoles] = await conn.query(
                'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ? AND is_active = TRUE',
                [userId, currentStep.role_id]
            );

            if (userRoles.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to reject at this step'
                });
            }

            // Record rejection in signatures table
            await conn.query(
                `INSERT INTO universal_signatures 
                (entity_type, entity_id, workflow_id, step_number, user_id, role_id, action, comments)
                VALUES ('sheet', ?, ?, ?, ?, ?, 'rejected', ?)`,
                [sheetId, workflow.workflow_id, currentStep.step_number, userId, currentStep.role_id, comments || reason]
            );

            // Move back to previous step or mark as draft
            if (workflow.current_step > 1) {
                // Go back to previous step
                const previousStep = workflow.current_step - 1;
                await conn.query(
                    'UPDATE sheet_workflows SET current_step = ?, status = "in_review" WHERE id = ?',
                    [previousStep, workflow.id]
                );

                // Notify previous role
                await NotificationService.notifyNextRole(sheetId, workflow.workflow_id, previousStep);

                await conn.commit();

                res.json({
                    success: true,
                    message: `Sheet rejected and sent back to step ${previousStep}`,
                    data: {
                        previous_step: previousStep
                    }
                });
            } else {
                // First step - send back to draft
                await conn.query(
                    'UPDATE sheet_workflows SET status = "rejected", completed_at = NOW() WHERE id = ?',
                    [workflow.id]
                );
                await conn.query(
                    'UPDATE daily_sheets SET status = "draft" WHERE id = ?',
                    [sheetId]
                );

                // Notify sheet creator
                const [sheets] = await conn.query(
                    'SELECT created_by FROM daily_sheets WHERE id = ?',
                    [sheetId]
                );

                if (sheets.length > 0) {
                    await NotificationService.createNotification(
                        sheets[0].created_by,
                        'sheet_rejected',
                        'sheet',
                        sheetId,
                        'Sheet Rejected',
                        `Your sheet has been rejected. Reason: ${reason}`,
                        `/sheets/${sheetId}`
                    );
                }

                await conn.commit();

                res.json({
                    success: true,
                    message: 'Sheet rejected and sent back to draft',
                    data: {
                        status: 'draft'
                    }
                });
            }
        } catch (error) {
            await conn.rollback();
            console.error('Reject sheet error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject sheet',
                error: error.message
            });
        } finally {
            conn.release();
        }
    }

    /**
     * Get user notifications
     */
    async getMyNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { is_read, limit = 20 } = req.query;
            
            const notifications = await NotificationService.getMyNotifications(userId, {
                is_read: is_read === 'false' ? false : (is_read === 'true' ? true : undefined),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications'
            });
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await NotificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count'
            });
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(req, res) {
        try {
            const { id: notificationId } = req.params;

            await NotificationService.markAsRead(notificationId);

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Mark notification read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read'
            });
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead(req, res) {
        try {
            const userId = req.user.id;
            await NotificationService.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Mark all notifications read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read'
            });
        }
    }
}

module.exports = new WorkflowController();
