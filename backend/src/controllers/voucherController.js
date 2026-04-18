const VoucherModel = require('../models/voucherModel');
const AuditService = require('../services/auditService');
const { body, query } = require('express-validator');

exports.createVoucher = async (req, res) => {
    try {
        const voucherData = {
            ...req.body,
            created_by: req.user.id
        };

        const voucherId = await VoucherModel.createVoucher(voucherData);

        // Audit log
        await AuditService.log({
            userId: req.user.id,
            action: 'create',
            entityType: 'voucher',
            entityId: voucherId,
            newValues: voucherData,
            req
        });

        res.status(201).json({
            success: true,
            message: 'Voucher created successfully',
            data: { id: voucherId }
        });
    } catch (error) {
        console.error('Create voucher error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create voucher',
            error: error.message
        });
    }
};

exports.getVouchers = async (req, res) => {
    try {
        const filters = {
            voucher_type: req.query.voucher_type,
            status: req.query.status,
            from_date: req.query.from_date,
            to_date: req.query.to_date,
            project_id: req.query.project_id,
            limit: req.query.limit,
            offset: req.query.offset
        };

        // Pass project filter from middleware
        const vouchers = await VoucherModel.getVouchers(filters, req.user, req.projectFilter);

        res.json({
            success: true,
            data: vouchers
        });
    } catch (error) {
        console.error('Get vouchers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vouchers'
        });
    }
};

exports.getVoucherById = async (req, res) => {
    try {
        const voucher = await VoucherModel.getVoucherById(req.params.id);

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        res.json({
            success: true,
            data: voucher
        });
    } catch (error) {
        console.error('Get voucher error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch voucher'
        });
    }
};

exports.updateVoucher = async (req, res) => {
    try {
        console.log('📝 Update voucher request:', req.params.id, req.body);
        
        // Get old voucher data before update
        const oldVoucher = await VoucherModel.getVoucherById(req.params.id);
        
        if (!oldVoucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        // Check if user has permission
        // Admin can update all, creator can update their own, accountant can approve all
        const canUpdateAll = ['admin', 'accountant'].includes(req.user.role);
        const isCreator = oldVoucher.created_by === req.user.id;
        const isApprovalAction = req.body.status && ['approved', 'rejected'].includes(req.body.status);
        
        // For approval actions, only admin and accountant can approve
        if (isApprovalAction && !canUpdateAll) {
            return res.status(403).json({
                success: false,
                message: 'Only admin or accountant can approve/reject vouchers.'
            });
        }
        
        // For non-approval updates, only creator or admin can update
        if (!isApprovalAction && !canUpdateAll && !isCreator) {
            return res.status(403).json({
                success: false,
                message: 'You can only update vouchers you created. Admin and accountant can update all.'
            });
        }
        
        const updated = await VoucherModel.updateVoucher(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found or not updated'
            });
        }

        // Audit log
        await AuditService.log({
            userId: req.user.id,
            action: req.body.status === 'approved' ? 'approve' : req.body.status === 'rejected' ? 'reject' : 'update',
            entityType: 'voucher',
            entityId: req.params.id,
            oldValues: oldVoucher,
            newValues: req.body,
            req
        });

        res.json({
            success: true,
            message: 'Voucher updated successfully'
        });
    } catch (error) {
        console.error('❌ Update voucher error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update voucher',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.deleteVoucher = async (req, res) => {
    try {
        // Get voucher data before deletion
        const oldVoucher = await VoucherModel.getVoucherById(req.params.id);
        
        const deleted = await VoucherModel.deleteVoucher(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        // Audit log
        await AuditService.log({
            userId: req.user.id,
            action: 'delete',
            entityType: 'voucher',
            entityId: req.params.id,
            oldValues: oldVoucher,
            req
        });

        res.json({
            success: true,
            message: 'Voucher deleted successfully'
        });
    } catch (error) {
        console.error('Delete voucher error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete voucher'
        });
    }
};
