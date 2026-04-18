const pool = require('../config/database');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFService {
    /**
     * Generate PDF for a fully approved sheet
     */
    static async generateSheetPDF(sheetId) {
        try {
            // Get sheet data with project info
            const [sheets] = await pool.query(
                `SELECT ds.*, p.project_name, p.project_code, u.name as created_by_name
                 FROM daily_sheets ds
                 INNER JOIN projects p ON ds.project_id = p.id
                 INNER JOIN users u ON ds.created_by = u.id
                 WHERE ds.id = ?`,
                [sheetId]
            );

            if (sheets.length === 0) throw new Error('Sheet not found');
            const sheet = sheets[0];

            // Get vouchers
            const [vouchers] = await pool.query(
                `SELECT v.* FROM vouchers v
                 INNER JOIN sheet_vouchers sv ON v.id = sv.voucher_id
                 WHERE sv.sheet_id = ?
                 ORDER BY v.date`,
                [sheetId]
            );

            // Get signatures
            const [signatures] = await pool.query(
                `SELECT us.*, u.name as signer_name, r.role_name
                 FROM universal_signatures us
                 INNER JOIN users u ON us.user_id = u.id
                 INNER JOIN roles r ON us.role_id = r.id
                 WHERE us.entity_type = 'sheet' AND us.entity_id = ?
                 ORDER BY us.step_number`,
                [sheetId]
            );

            // Generate HTML
            const html = this.generateHTML(sheet, vouchers, signatures);

            // Launch puppeteer
            const browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Create PDF directory if not exists
            const pdfDir = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            // Generate PDF
            const pdfPath = path.join(pdfDir, `sheet-${sheetId}.pdf`);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            await browser.close();

            // Update sheet with PDF path
            await pool.query(
                'UPDATE daily_sheets SET pdf_path = ?, pdf_generated_at = NOW() WHERE id = ?',
                [`/uploads/pdfs/sheet-${sheetId}.pdf`, sheetId]
            );

            console.log(`✅ PDF generated for sheet ${sheetId}: ${pdfPath}`);
            return pdfPath;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    /**
     * Generate HTML content for PDF
     */
    static generateHTML(sheet, vouchers, signatures) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Kalpurush', 'SolaimanLipi', 'Nikosh', Arial, sans-serif; 
            padding: 15px; 
            font-size: 12px;
            color: #333;
            line-height: 1.4;
        }
        
        /* Header Section */
        .header-container {
            border: 2px solid #000;
            padding: 12px 15px;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo-space {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo-space img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .company-info {
            flex: 1;
            text-align: center;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 0.3px;
        }
        .company-subtitle {
            font-size: 12px;
            margin: 2px 0;
            color: #333;
            line-height: 1.5;
        }
        .company-address {
            font-size: 11px;
            margin-top: 4px;
            color: #444;
        }
        
        /* Info Fields */
        .info-section {
            margin: 18px 0;
            font-size: 13px;
        }
        .info-row {
            margin: 14px 0;
            display: flex;
            align-items: baseline;
        }
        .info-label {
            font-weight: bold;
            min-width: 150px;
            flex-shrink: 0;
        }
        .info-line {
            flex: 1;
            border-bottom: 1px solid #000;
            margin-left: 10px;
            min-height: 18px;
            padding-left: 8px;
        }
        .info-inline {
            display: inline-block;
            margin-right: 40px;
        }
        
        /* Title */
        .sheet-title {
            text-align: center;
            font-size: 17px;
            font-weight: bold;
            margin: 22px 0;
            padding: 7px;
            border: 1px solid #000;
            background: #f5f5f5;
            letter-spacing: 0.5px;
        }
        
        /* Table */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 18px 0;
        }
        th { 
            background: #f0f0f0; 
            font-weight: bold;
            padding: 7px 5px;
            text-align: center;
            border: 1px solid #000;
            font-size: 11px;
        }
        td { 
            border: 1px solid #000; 
            padding: 6px 5px;
            height: 26px;
            font-size: 11px;
        }
        td:first-child {
            text-align: center;
            width: 35px;
        }
        td:nth-child(3), td:nth-child(4), td:nth-child(5) {
            text-align: center;
            width: 70px;
        }
        
        /* Total Section */
        .total-section {
            margin: 18px 0;
            text-align: right;
            font-size: 13px;
            font-weight: bold;
        }
        .total-line {
            display: inline-block;
            border-bottom: 2px solid #000;
            min-width: 180px;
            padding: 4px 10px;
            margin-left: 10px;
        }
        
        /* Explanation */
        .explanation {
            margin: 18px 0;
            font-size: 12px;
        }
        .explanation-label {
            font-weight: bold;
            margin-bottom: 6px;
        }
        .explanation-line {
            border-bottom: 1px solid #000;
            min-height: 22px;
            margin: 6px 0;
        }
        
        /* Signatures */
        .signatures { 
            margin-top: 35px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            page-break-inside: avoid;
        }
        .sig-box { 
            text-align: center; 
            width: 18%;
            border: 1px solid #000;
            min-height: 90px;
            padding: 8px 5px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .sig-image { 
            height: 50px; 
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            background: #fafafa;
        }
        .sig-image img { 
            max-height: 45px; 
            max-width: 100%; 
        }
        .sig-label { 
            font-size: 9.5px;
            font-weight: bold;
            margin-top: 4px;
            line-height: 1.3;
        }
        .sig-name {
            font-size: 9px;
            margin-top: 2px;
            color: #333;
        }
        .sig-date {
            font-size: 8px;
            color: #666;
            margin-top: 2px;
        }
        
        /* Approval Status */
        .approval-status {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #999;
        }
        
        @media print { 
            @page { 
                size: A4;
                margin: 15mm; 
            }
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Company Header -->
    <div class="header-container">
        <div class="logo-space">
            [LOGO]
        </div>
        <div class="company-name">মেসার্স খাজা বিলকিস রাবিয়া</div>
        <div class="company-subtitle">১ম শ্রেণীর ঠিকাদার, আমদানিকারক ও সরবরাহকারী</div>
        <div class="company-subtitle">(ARMY, NAVY, AIR FORCE)</div>
        <div class="company-address">হেড অফিস: মিরপুর, ঢাকা-১২১৬</div>
    </div>
    
    <!-- Information Fields -->
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">প্রকল্পের নাম :</span>
            <span class="info-line">${sheet.project_name || ''}</span>
        </div>
        <div class="info-row">
            <span class="info-label">জমা টাকার পরিমাণ :</span>
            <span class="info-line">৳ ${parseFloat(sheet.previous_balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div class="info-row">
            <span class="info-inline">
                <span class="info-label">মাস :</span>
                <span class="info-line" style="display: inline-block; min-width: 150px;">${new Date(sheet.sheet_date).toLocaleDateString('bn-BD', {month: 'long', year: 'numeric'})}</span>
            </span>
            <span class="info-inline">
                <span class="info-label">তারিখ :</span>
                <span class="info-line" style="display: inline-block; min-width: 120px;">${new Date(sheet.sheet_date).toLocaleDateString('en-GB')}</span>
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">নং :</span>
            <span class="info-line">${sheet.sheet_no || ''}</span>
        </div>
    </div>
    
    <!-- Title -->
    <div class="sheet-title">
        দৈনিক খরচের ভাউচার
    </div>
    
    <!-- Vouchers Table -->
    <table>
        <thead>
            <tr>
                <th>ক্রম</th>
                <th>ভাউচার নং</th>
                <th>তারিখ</th>
                <th>বিবরণ</th>
                <th>টাকা (৳)</th>
            </tr>
        </thead>
        <tbody>
            ${vouchers.map((v, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${v.voucher_no}</td>
                    <td>${new Date(v.date).toLocaleDateString('en-GB')}</td>
                    <td>${v.description || '-'}</td>
                    <td style="text-align: right; font-weight: 600;">৳${parseFloat(v.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <!-- Total Section -->
    <div class="total-section">
        সর্বমোট : <span class="total-line">৳${parseFloat(sheet.total_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
    </div>
    
    <!-- Explanation -->
    <div class="explanation">
        <div class="explanation-label">ব্যাখ্যা :</div>
        <div class="explanation-line"></div>
        <div class="explanation-line"></div>
    </div>
    
    <!-- Signatures -->
    <div class="signatures">
        ${signatures.map(sig => `
            <div class="sig-box">
                <div class="sig-image">
                    ${sig.signature_data ? `<img src="${sig.signature_data}" alt="Signature" />` : ''}
                </div>
                <div class="sig-label">${sig.role_name}</div>
                <div class="sig-name">${sig.signer_name}</div>
                <div class="sig-date">${new Date(sig.action_timestamp).toLocaleDateString('en-GB')}</div>
            </div>
        `).join('')}
    </div>
    
    <!-- Approval Status -->
    <div class="approval-status">
        অনুমোদন প্রদান করা হলো ✅
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <p>This is a computer-generated document and does not require physical signature.</p>
        <p>Generated on ${new Date().toLocaleString('en-GB')} | Smart Construction Management System v2.0</p>
    </div>
</body>
</html>`;
    }
}

module.exports = PDFService;
