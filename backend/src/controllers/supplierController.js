const supplierModel = require('../models/supplierModel');

// Supplier Controllers
exports.createSupplier = async (req, res) => {
    try {
        const result = await supplierModel.createSupplier(req.body);
        res.status(201).json({
            success: true,
            message: 'Supplier created successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create supplier',
            error: error.message
        });
    }
};

exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await supplierModel.getSuppliers(req.query);
        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suppliers',
            error: error.message
        });
    }
};

exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await supplierModel.getSupplierById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        const stats = await supplierModel.getSupplierStats(supplier.id);
        
        res.json({
            success: true,
            data: { ...supplier, ...stats }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier',
            error: error.message
        });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const result = await supplierModel.updateSupplier(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Supplier updated successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update supplier',
            error: error.message
        });
    }
};

// Purchase Controllers
exports.createPurchase = async (req, res) => {
    try {
        const result = await supplierModel.createPurchase({
            ...req.body,
            created_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Purchase created successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create purchase',
            error: error.message
        });
    }
};

exports.getPurchases = async (req, res) => {
    try {
        const purchases = await supplierModel.getPurchases(req.query);
        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchases',
            error: error.message
        });
    }
};

exports.getPurchaseById = async (req, res) => {
    try {
        const purchase = await supplierModel.getPurchaseById(req.params.id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            data: purchase
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase',
            error: error.message
        });
    }
};

exports.addPayment = async (req, res) => {
    try {
        const result = await supplierModel.addPayment({
            ...req.body,
            created_by: req.user.id
        });

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to record payment',
            error: error.message
        });
    }
};

exports.getPurchaseSummary = async (req, res) => {
    try {
        const summary = await supplierModel.getPurchaseSummary(req.query);
        
        const totals = summary.reduce((acc, item) => ({
            total_purchases: acc.total_purchases + item.count,
            total_amount: acc.total_amount + parseFloat(item.total_amount),
            total_paid: acc.total_paid + parseFloat(item.total_paid),
            total_due: acc.total_due + parseFloat(item.total_due)
        }), {
            total_purchases: 0,
            total_amount: 0,
            total_paid: 0,
            total_due: 0
        });

        res.json({
            success: true,
            data: {
                by_category: summary,
                totals
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase summary',
            error: error.message
        });
    }
};
