const ledgerModel = require('../models/ledgerModel');

exports.createAccount = async (req, res) => {
    try {
        const accountId = await ledgerModel.createAccount(req.body);

        res.status(201).json({
            success: true,
            message: 'Ledger account created successfully',
            data: { id: accountId }
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ledger account'
        });
    }
};

exports.getAccounts = async (req, res) => {
    try {
        const filters = {
            account_type: req.query.account_type,
            status: req.query.status
        };

        const accounts = await ledgerModel.getAccounts(filters);

        res.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ledger accounts'
        });
    }
};

exports.getLedger = async (req, res) => {
    try {
        const filters = {
            from_date: req.query.from_date,
            to_date: req.query.to_date
        };

        const entries = await ledgerModel.getLedgerEntries(req.params.accountId, filters);
        const account = await ledgerModel.getAccountById(req.params.accountId);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.json({
            success: true,
            data: {
                account,
                entries
            }
        });
    } catch (error) {
        console.error('Get ledger error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ledger'
        });
    }
};

exports.createEntry = async (req, res) => {
    try {
        const entryData = {
            ...req.body,
            created_by: req.user.id
        };

        const entryId = await ledgerModel.createEntry(entryData);

        res.status(201).json({
            success: true,
            message: 'Ledger entry created successfully',
            data: { id: entryId }
        });
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ledger entry'
        });
    }
};

exports.getBalanceSummary = async (req, res) => {
    try {
        const summary = await ledgerModel.getBalanceSummary();

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get balance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance summary'
        });
    }
};
