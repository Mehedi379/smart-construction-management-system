const reportModel = require('../models/reportModel');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

exports.getProfitLoss = async (req, res) => {
    try {
        console.log('=== PROFIT/LOSS API CALLED ===');
        console.log('Query params:', req.query);
        
        const filters = {
            from_date: req.query.from_date,
            to_date: req.query.to_date
        };

        const report = await reportModel.getProfitLoss(filters);

        console.log('Report generated successfully');
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('❌ Get P&L error:', error);
        console.error('Error stack:', error.stack);
        console.error('SQL error details:', error.sql);
        
        res.status(500).json({
            success: false,
            message: 'Failed to generate profit/loss report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getDailyReport = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const report = await reportModel.getDailyReport(date);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Get daily report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate daily report'
        });
    }
};

exports.getMonthlyReport = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const report = await reportModel.getMonthlyReport(year, month);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Get monthly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate monthly report'
        });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await reportModel.getDashboardStats(req.user, req.projectFilter);
        console.log('Dashboard stats response:', JSON.stringify(stats, null, 2));

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Get dashboard stats error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.exportToExcel = async (req, res) => {
    try {
        const { type, from_date, to_date } = req.query;
        
        let data = [];
        let filename = 'export';

        if (type === 'expenses') {
            const [expenses] = await require('../config/database').query(`
                SELECT * FROM expenses 
                WHERE expense_date BETWEEN ? AND ?
                ORDER BY expense_date DESC
            `, [from_date, to_date]);
            data = expenses;
            filename = `expenses_${from_date}_${to_date}`;
        } else if (type === 'vouchers') {
            const [vouchers] = await require('../config/database').query(`
                SELECT * FROM vouchers 
                WHERE date BETWEEN ? AND ?
                ORDER BY date DESC
            `, [from_date, to_date]);
            data = vouchers;
            filename = `vouchers_${from_date}_${to_date}`;
        } else if (type === 'ledger') {
            const [entries] = await require('../config/database').query(`
                SELECT le.*, la.account_name 
                FROM ledger_entries le
                LEFT JOIN ledger_accounts la ON le.account_id = la.id
                WHERE le.entry_date BETWEEN ? AND ?
                ORDER BY le.entry_date DESC
            `, [from_date, to_date]);
            data = entries;
            filename = `ledger_${from_date}_${to_date}`;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
    } catch (error) {
        console.error('Export to Excel error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export to Excel'
        });
    }
};

exports.exportToPDF = async (req, res) => {
    try {
        const { type, from_date, to_date } = req.query;
        
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Smart Construction Management System', 14, 20);
        doc.setFontSize(12);
        doc.text(`Report: ${type.toUpperCase()}`, 14, 30);
        doc.text(`Period: ${from_date} to ${to_date}`, 14, 38);

        let headers = [];
        let data = [];

        if (type === 'expenses') {
            headers = [['Date', 'Category', 'Amount', 'Description']];
            const [expenses] = await require('../config/database').query(`
                SELECT expense_date, category, amount, description 
                FROM expenses 
                WHERE expense_date BETWEEN ? AND ?
                ORDER BY expense_date DESC
            `, [from_date, to_date]);
            data = expenses.map(e => [e.expense_date, e.category, e.amount.toString(), e.description || '']);
        } else if (type === 'vouchers') {
            headers = [['Voucher No', 'Type', 'Date', 'Amount', 'Status']];
            const [vouchers] = await require('../config/database').query(`
                SELECT voucher_no, voucher_type, date, amount, status 
                FROM vouchers 
                WHERE date BETWEEN ? AND ?
                ORDER BY date DESC
            `, [from_date, to_date]);
            data = vouchers.map(v => [v.voucher_no, v.voucher_type, v.date, v.amount.toString(), v.status]);
        }

        doc.autoTable({
            head: headers,
            body: data,
            startY: 45,
            theme: 'grid'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.pdf`);
        
        const buffer = doc.output('arraybuffer');
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('Export to PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export to PDF'
        });
    }
};
