const DailySheetModel = require('../models/dailySheetModel');
const SheetAnalyticsService = require('../services/sheetAnalyticsService');
const SignatureWorkflowService = require('../services/signatureWorkflowService');
const SignatureRequestService = require('../services/signatureRequestService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const pool = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/sheets';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Voucher receipt upload storage
const voucherStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/vouchers';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `voucher-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const voucherUpload = multer({
    storage: voucherStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Smart OCR text parser for vouchers
const parseOCRText = (text) => {
    const items = [];
    const lines = text.split('\n');
    
    // Enhanced patterns for Bengali and English receipts
    const amountPattern = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:৳|TK|taka|টাকা|Tk|rs|Rs|RUPEES)/gi;
    const itemPattern = /^(\d+)[\.\)\s\-]+(.+?)(?:\s+(\d+(?:\.\d+)?)\s*(?:pcs|bag|kg|ltr|ft|pc|nos|piece|bundle|rod|carrying))?\s*[\.\s\-]+\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
    const qtyRatePattern = /(\d+(?:\.\d+)?)\s*[xX\*]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*=\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
    
    let itemNo = 1;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines or header/footer lines
        if (!trimmed || trimmed.length < 3) continue;
        if (/^(invoice|bill|receipt|date|time|total|subtotal)/i.test(trimmed)) continue;
        
        // Try to extract item with qty, rate, amount (most common format)
        const itemMatch = trimmed.match(itemPattern);
        if (itemMatch) {
            const qty = itemMatch[3] ? parseFloat(itemMatch[3].replace(/,/g, '')) : 0;
            const rate = parseFloat(itemMatch[4].replace(/,/g, '')) || 0;
            const amount = qty > 0 ? qty * rate : rate;
            
            items.push({
                description: itemMatch[2].trim(),
                qty: qty,
                rate: rate,
                amount: amount
            });
            continue;
        }
        
        // Try to extract multiplication format: 5 x 100 = 500
        const qtyRateMatches = trimmed.matchAll(qtyRatePattern);
        for (const match of qtyRateMatches) {
            items.push({
                description: trimmed.substring(0, 40).trim(),
                qty: parseFloat(match[1]),
                rate: parseFloat(match[2].replace(/,/g, '')),
                amount: parseFloat(match[3].replace(/,/g, ''))
            });
        }
        
        // Try to extract standalone amounts
        const amountMatches = trimmed.matchAll(amountPattern);
        for (const match of amountMatches) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            if (amount > 0 && amount < 1000000) { // Reasonable amount limit
                items.push({
                    description: trimmed.substring(0, 50).trim(),
                    qty: 0,
                    rate: 0,
                    amount: amount
                });
            }
        }
    }
    
    // Remove duplicates and clean up
    const uniqueItems = [];
    const seen = new Set();
    
    for (const item of items) {
        const key = `${item.description}-${item.amount}`;
        if (!seen.has(key) && item.amount > 0) {
            seen.add(key);
            uniqueItems.push(item);
        }
    }
    
    return uniqueItems;
};

// Detect project from OCR text
const detectProject = (text) => {
    const projectKeywords = {
        'BKSC Project': ['বি.কে.এস.সি', 'bksc', 'খাজা বিলকিস'],
        'Rupayan Housing': ['রুপায়ন', 'rupayan', 'housing'],
        'City Center': ['সিটি সেন্টার', 'city center', 'shopping mall'],
        'Green Valley': ['গ্রীন ভ্যালি', 'green valley', 'resort'],
        'Metro Rail': ['মেট্রো রেল', 'metro rail', 'station']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [project, keywords] of Object.entries(projectKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
            return project;
        }
    }
    
    return null;
};

class DailySheetController {
    // Create daily sheet with optional OCR
    async createSheet(req, res) {
        try {
            const {
                project_id, sheet_date, location, previous_balance,
                items = [], signatures, ocr_text
            } = req.body;

            // Validate required fields
            if (!project_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Project ID is required'
                });
            }

            if (!sheet_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Sheet date is required'
                });
            }

            // Generate sheet number
            const sheet_no = await DailySheetModel.generateSheetNo();

            // Calculate today's expense
            const today_expense = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            const remaining_balance = parseFloat(previous_balance || 0) - today_expense;

            // Create sheet
            const sheetId = await DailySheetModel.create({
                sheet_no,
                project_id,
                sheet_date,
                location,
                previous_balance: previous_balance || 0,
                today_expense,
                remaining_balance,
                ocr_text: ocr_text || null,
                created_by: req.user.id
            });

            // Add items
            if (items && items.length > 0) {
                await DailySheetModel.addItems(sheetId, items);
            }

            // Add signatures if provided
            if (signatures) {
                await DailySheetModel.saveSignatures(sheetId, {
                    ...signatures,
                    prepared_by_signature: signatures.prepared_by_signature || null,
                    prepared_by_name: req.user.name,
                    prepared_by_date: new Date().toISOString().split('T')[0]
                });
            }

            // AUTO-CREATE: Sheet workflow entry
            try {
                // Get active workflow template
                const [templates] = await pool.query(
                    'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
                );
                
                if (templates.length > 0) {
                    await pool.query(
                        'INSERT INTO sheet_workflows (sheet_id, workflow_id, current_step, status) VALUES (?, ?, 1, "pending")',
                        [sheetId, templates[0].id]
                    );
                    console.log('✅ Sheet workflow created for sheet:', sheetId);
                    
                    // Send notifications to first role
                    const [firstStep] = await pool.query(
                        `SELECT ws.role_id, r.role_name, r.role_code
                         FROM workflow_steps ws
                         INNER JOIN roles r ON ws.role_id = r.id
                         WHERE ws.workflow_id = ? AND ws.step_number = 1`,
                        [templates[0].id]
                    );
                    
                    if (firstStep.length > 0) {
                        // Get sheet project_id
                        const [sheetProject] = await pool.query(
                            'SELECT project_id FROM daily_sheets WHERE id = ?',
                            [sheetId]
                        );
                        
                        if (sheetProject.length > 0) {
                            const projectId = sheetProject[0].project_id;
                            
                            // Find users with this role AND same project
                            const [users] = await pool.query(
                                `SELECT u.id, u.email, u.name 
                                 FROM users u
                                 INNER JOIN employees e ON u.id = e.user_id
                                 WHERE u.role = ? 
                                 AND u.is_active = TRUE
                                 AND e.assigned_project_id = ?`,
                                [firstStep[0].role_code, projectId]
                            );
                            
                            // Send notifications
                            for (const userData of users) {
                                await pool.query(
                                    `INSERT INTO notifications (user_id, notification_type, entity_type, entity_id, title, message)
                                     VALUES (?, 'signature_request', 'sheet', ?, 'Sheet Signature Required', ?)`,
                                    [userData.id, sheetId, `Daily sheet requires your signature as ${firstStep[0].role_name}`]
                                );
                            }
                            
                            console.log(`📧 Notifications sent to ${users.length} user(s)`);
                        }
                    }
                } else {
                    console.log('⚠️  No workflow template found, skipping workflow creation');
                }
            } catch (error) {
                console.error('Failed to create sheet workflow:', error);
                // Don't fail the whole request if workflow creation fails
            }

            // Initialize signature requests for all 6 roles (optional - for backward compatibility)
            try {
                // First, delete any existing signature requests for this sheet (in case of retry)
                await pool.query('DELETE FROM signature_requests WHERE sheet_id = ?', [sheetId]);
                
                // Now initialize fresh
                await SignatureRequestService.initializeRequests(sheetId, req.user.id);
                console.log('✅ Signature requests initialized for sheet:', sheetId);
            } catch (error) {
                console.error('⚠️ Failed to initialize signature requests (non-critical):', error.message);
                // Don't fail the whole request if this fails - it's optional
            }

            // Get complete sheet
            const sheet = await DailySheetModel.findById(sheetId);

            res.status(201).json({
                success: true,
                message: 'Daily sheet created successfully',
                data: sheet
            });
        } catch (error) {
            console.error('Create sheet error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create daily sheet',
                error: error.message
            });
        }
    }

    // OCR processing endpoint
    async processOCR(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            // Note: OCR processing will be done on frontend with tesseract.js
            // This endpoint just stores the image
            const imagePath = `/uploads/sheets/${req.file.filename}`;

            res.json({
                success: true,
                message: 'Image uploaded successfully',
                data: {
                    image_path: imagePath,
                    filename: req.file.filename
                }
            });
        } catch (error) {
            console.error('OCR upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process image',
                error: error.message
            });
        }
    }

    // Get all daily sheets
    async getSheets(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            
            const filters = {
                project_id: req.query.project_id,
                date: req.query.date,
                from_date: req.query.from_date,
                to_date: req.query.to_date,
                status: req.query.status
            };

            let sheets;

            // ADMIN can see ALL sheets
            if (userRole === 'admin' || userRole === 'head_office_admin') {
                sheets = await DailySheetModel.findAll(filters);
            } else {
                // For non-admin users, get sheets based on permissions
                
                // 1. Get sheets created by this user
                const [createdSheets] = await pool.query(
                    `SELECT ds.* FROM daily_sheets ds 
                     WHERE ds.created_by = ?`,
                    [userId]
                );

                // 2. Get sheets where user has signature requests (any status)
                const [signatureSheets] = await pool.query(
                    `SELECT DISTINCT ds.* 
                     FROM daily_sheets ds
                     INNER JOIN signature_requests sr ON ds.id = sr.sheet_id
                     WHERE sr.role_code = ?`,
                    [userRole]
                );

                // 3. Merge and remove duplicates
                const sheetMap = new Map();
                
                [...createdSheets, ...signatureSheets].forEach(sheet => {
                    sheetMap.set(sheet.id, sheet);
                });

                sheets = Array.from(sheetMap.values());

                // Apply additional filters if provided
                if (filters.project_id) {
                    sheets = sheets.filter(s => s.project_id == filters.project_id);
                }
                if (filters.status) {
                    sheets = sheets.filter(s => s.status === filters.status);
                }
                if (filters.date) {
                    sheets = sheets.filter(s => {
                        const sheetDate = new Date(s.sheet_date).toISOString().split('T')[0];
                        return sheetDate === filters.date;
                    });
                }
            }

            res.json({
                success: true,
                data: sheets
            });
        } catch (error) {
            console.error('Get sheets error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get daily sheets',
                error: error.message
            });
        }
    }

    // Get single sheet
    async getSheetById(req, res) {
        try {
            const { id } = req.params;
            const sheet = await DailySheetModel.findById(id);

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'Daily sheet not found'
                });
            }

            res.json({
                success: true,
                data: sheet
            });
        } catch (error) {
            console.error('Get sheet error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get daily sheet',
                error: error.message
            });
        }
    }

    // Update sheet
    async updateSheet(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;
            const updateData = req.body;

            // Check if sheet exists
            const [sheet] = await pool.query(
                'SELECT created_by, status FROM daily_sheets WHERE id = ?',
                [id]
            );

            if (sheet.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Sheet not found'
                });
            }

            // CRITICAL CHECK: If ANY signature exists, only admin can edit
            const [signatures] = await pool.query(
                `SELECT COUNT(*) as sig_count 
                 FROM signature_requests 
                 WHERE sheet_id = ? AND status = 'signed'`,
                [id]
            );

            const hasSignatures = signatures[0].sig_count > 0;

            // If signatures exist, only admin can edit
            if (hasSignatures && userRole !== 'admin' && userRole !== 'head_office_admin') {
                return res.status(403).json({
                    success: false,
                    message: '⚠️ Cannot edit: This sheet has already been signed. Only admin can edit signed sheets.'
                });
            }

            // If no signatures, only creator or admin can update
            if (!hasSignatures && sheet[0].created_by !== userId && userRole !== 'admin' && userRole !== 'head_office_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this sheet. Only the creator can update.'
                });
            }

            // Recalculate if items changed
            if (updateData.items) {
                updateData.today_expense = updateData.items.reduce(
                    (sum, item) => sum + parseFloat(item.amount || 0), 0
                );
                updateData.remaining_balance = parseFloat(updateData.previous_balance || 0) - updateData.today_expense;
            }

            await DailySheetModel.update(id, updateData);

            const updatedSheet = await DailySheetModel.findById(id);

            res.json({
                success: true,
                message: 'Daily sheet updated successfully',
                data: updatedSheet
            });
        } catch (error) {
            console.error('Update sheet error:', error);
            
            // Check if it's a locked sheet error
            if (error.message.includes('locked')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update daily sheet',
                error: error.message
            });
        }
    }

    // Add signature
    async addSignature(req, res) {
        try {
            const { id } = req.params;
            const { role, signature_data } = req.body;

            // Check if sheet is already locked
            const isLocked = await DailySheetModel.isLocked(id);
            if (isLocked) {
                return res.status(403).json({
                    success: false,
                    message: 'Sheet is locked. All 5 signatures are complete. Cannot modify.'
                });
            }

            const signatureFieldMap = {
                'receiver': { signature: 'receiver_signature', name: 'receiver_name', date: 'receiver_date' },
                'payer': { signature: 'payer_signature', name: 'payer_name', date: 'payer_date' },
                'prepared_by': { signature: 'prepared_by_signature', name: 'prepared_by_name', date: 'prepared_by_date' },
                'checked_by': { signature: 'checked_by_signature', name: 'checked_by_name', date: 'checked_by_date' },
                'approved_by': { signature: 'approved_by_signature', name: 'approved_by_name', date: 'approved_by_date' }
            };

            const fields = signatureFieldMap[role];
            if (!fields) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid signature role'
                });
            }

            const signatureData = {
                [fields.signature]: signature_data.signature || null,
                [fields.name]: signature_data.name || req.user.name,
                [fields.date]: signature_data.date || new Date().toISOString().split('T')[0]
            };

            await DailySheetModel.saveSignatures(id, signatureData);

            // Check if sheet is now locked
            const nowLocked = await DailySheetModel.isLocked(id);

            res.json({
                success: true,
                message: nowLocked 
                    ? 'Signature added. Sheet is now LOCKED (all 5 signatures complete)!' 
                    : 'Signature added successfully',
                data: {
                    is_locked: nowLocked
                }
            });
        } catch (error) {
            console.error('Add signature error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add signature',
                error: error.message
            });
        }
    }

    // Delete sheet
    async deleteSheet(req, res) {
        try {
            const { id } = req.params;
            await DailySheetModel.delete(id);

            res.json({
                success: true,
                message: 'Daily sheet deleted successfully'
            });
        } catch (error) {
            console.error('Delete sheet error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete daily sheet',
                error: error.message
            });
        }
    }

    // Get project balance for auto-fill
    async getProjectBalance(req, res) {
        try {
            const { project_id, date } = req.query;

            if (!project_id || !date) {
                return res.status(400).json({
                    success: false,
                    message: 'Project ID and date are required'
                });
            }

            const balance = await DailySheetModel.getProjectBalance(project_id, date);

            res.json({
                success: true,
                data: {
                    previous_balance: balance,
                    project_id,
                    date
                }
            });
        } catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get project balance',
                error: error.message
            });
        }
    }

    // Scan voucher receipt with OCR
    async scanVoucher(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No voucher image uploaded'
                });
            }

            const imagePath = req.file.path;
            const fileName = req.file.filename;

            console.log('🔍 Scanning voucher image:', fileName);

            // Perform OCR on the voucher image
            const { data } = await Tesseract.recognize(imagePath, 'eng+ben', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
                    }
                }
            });

            const extractedText = data.text;
            console.log('📝 Extracted text length:', extractedText.length);

            // Parse items from OCR text
            const items = parseOCRText(extractedText);

            // Calculate total expense
            const totalExpense = items.reduce((sum, item) => sum + item.amount, 0);

            console.log(`✅ Found ${items.length} items, Total: ৳${totalExpense.toFixed(2)}`);

            res.json({
                success: true,
                message: `Voucher scanned successfully! Found ${items.length} items.`,
                data: {
                    items: items,
                    total_expense: totalExpense,
                    ocr_text: extractedText,
                    image_path: `/uploads/vouchers/${fileName}`,
                    item_count: items.length
                }
            });

            // Optional: Clean up uploaded file after processing
            // fs.unlinkSync(imagePath);

        } catch (error) {
            console.error('Scan voucher error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to scan voucher',
                error: error.message
            });
        }
    }

    /**
     * Get category-wise breakdown for a sheet
     */
    async getSheetBreakdown(req, res) {
        try {
            const { id } = req.params;
            const breakdown = await SheetAnalyticsService.getSheetBreakdown(id);

            res.json({
                success: true,
                data: breakdown
            });
        } catch (error) {
            console.error('Get sheet breakdown error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get sheet breakdown',
                error: error.message
            });
        }
    }

    /**
     * Get project expense statistics
     */
    async getProjectExpenseStats(req, res) {
        try {
            const { project_id } = req.query;

            if (!project_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Project ID is required'
                });
            }

            const stats = await SheetAnalyticsService.getProjectExpenseStats(project_id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get project expense stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get project expense stats',
                error: error.message
            });
        }
    }

    /**
     * Get project summary (daily/weekly/monthly)
     */
    async getProjectSummary(req, res) {
        try {
            const { project_id, period, start_date, end_date } = req.query;

            if (!project_id || !period || !start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Project ID, period, start_date, and end_date are required'
                });
            }

            const summary = await SheetAnalyticsService.getProjectSummary(
                project_id,
                period,
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Get project summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get project summary',
                error: error.message
            });
        }
    }

    /**
     * Get recent activity for a project
     */
    async getRecentActivity(req, res) {
        try {
            const { project_id, limit } = req.query;

            if (!project_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Project ID is required'
                });
            }

            const activities = await SheetAnalyticsService.getRecentActivity(
                project_id,
                limit || 10
            );

            res.json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('Get recent activity error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recent activity',
                error: error.message
            });
        }
    }

    /**
     * Get sheet PDF data (complete sheet with vouchers, categories, signatures)
     */
    async getSheetPDF(req, res) {
        try {
            const { id } = req.params;

            // Call stored procedure to get complete PDF data
            const [result] = await DailySheetModel.pool.query(
                'CALL generate_sheet_pdf_data(?)',
                [id]
            );

            // Result contains 4 result sets
            const sheet = result[0][0];
            const vouchers = result[1];
            const categories = result[2];
            const signatures = result[3];

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'Sheet not found'
                });
            }

            res.json({
                success: true,
                data: {
                    sheet,
                    vouchers,
                    categories,
                    signatures
                }
            });
        } catch (error) {
            console.error('Get PDF data error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate PDF data',
                error: error.message
            });
        }
    }

    /**
     * Sign sheet with digital signature (uses stored procedure)
     */
    async signSheet(req, res) {
        try {
            const { id: sheet_id } = req.params;
            const { signature_data, comments = '' } = req.body;
            const role_code = req.user.role;
            const user_id = req.user.id;

            // Call stored procedure
            await DailySheetModel.pool.query(
                'CALL add_signature_to_sheet(?, ?, ?, ?, ?, @success, @message)',
                [sheet_id, role_code, user_id, signature_data, comments]
            );

            // Get output parameters
            const [[{ success, message }]] = await DailySheetModel.pool.query(
                'SELECT @success as success, @message as message'
            );

            res.json({
                success: success === 1,
                message
            });
        } catch (error) {
            console.error('Sign sheet error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to sign sheet',
                error: error.message
            });
        }
    }

    /**
     * Reject sheet (sends back to previous stage)
     */
    async rejectSheet(req, res) {
        try {
            const { id: sheetId } = req.params;
            const { reason } = req.body;
            const userId = req.user.id;

            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            // Use SignatureWorkflowService to reject
            const result = await SignatureWorkflowService.rejectSheet(sheetId, userId, reason);

            res.json({
                success: true,
                message: result.message,
                data: {
                    rejected_by: result.rejected_by,
                    reason: result.reason
                }
            });
        } catch (error) {
            console.error('Reject sheet error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to reject sheet'
            });
        }
    }

    /**
     * Restart workflow (Re-Request)
     */
    async restartWorkflow(req, res) {
        try {
            const { id: sheetId } = req.params;
            const userId = req.user.id;

            // Use SignatureWorkflowService to restart
            const result = await SignatureWorkflowService.restartWorkflow(sheetId, userId);

            res.json({
                success: true,
                message: result.message,
                data: {
                    sheet_id: result.sheet_id
                }
            });
        } catch (error) {
            console.error('Restart workflow error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to restart workflow'
            });
        }
    }

    /**
     * Send sheet for signature workflow
     */
    async sendForSignature(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const { id: sheetId } = req.params;
            const userId = req.user.id;
            
            // Get sheet
            const [sheets] = await conn.query(
                'SELECT * FROM daily_sheets WHERE id = ? AND created_by = ?',
                [sheetId, userId]
            );
            
            if (sheets.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Sheet not found or unauthorized'
                });
            }
            
            const sheet = sheets[0];
            
            // Check if workflow already exists
            const [existingWorkflow] = await conn.query(
                'SELECT id FROM sheet_workflows WHERE sheet_id = ?',
                [sheetId]
            );
            
            if (existingWorkflow.length > 0) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Sheet already sent for signature or in workflow'
                });
            }
            
            // Start workflow
            const result = await SignatureWorkflowService.startWorkflow(sheetId, sheet.project_id);
            
            // Update sheet status to pending
            await conn.query(
                'UPDATE daily_sheets SET status = "pending" WHERE id = ?',
                [sheetId]
            );
            
            await conn.commit();
            
            res.json({
                success: true,
                message: 'Sheet sent for signature successfully',
                data: result
            });
        } catch (error) {
            await conn.rollback();
            console.error('Send for signature error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to send sheet for signature'
            });
        } finally {
            conn.release();
        }
    }

    // Signature Request System Controllers

    // POST /api/sheets/:id/signature-requests/send
    async sendSignatureRequest(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id: sheetId } = req.params;
            const { roleCode } = req.body;
            const userId = req.user.id;

            if (!roleCode) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Role code is required'
                });
            }

            // Check if sheet exists
            const [sheets] = await conn.query(
                'SELECT id, created_by FROM daily_sheets WHERE id = ?',
                [sheetId]
            );

            if (sheets.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Sheet not found'
                });
            }

            const sheet = sheets[0];

            // Check if user is creator or admin
            if (sheet.created_by !== userId && req.user.role !== 'admin') {
                await conn.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Only sheet creator or admin can send signature requests'
                });
            }

            // Send request
            const result = await SignatureRequestService.sendRequest(sheetId, roleCode, userId);

            await conn.commit();

            res.json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            await conn.rollback();
            console.error('Send signature request error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to send signature request'
            });
        } finally {
            conn.release();
        }
    }

    // POST /api/sheets/:id/signature-requests/sign
    async signWithRequest(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id: sheetId } = req.params;
            const { roleCode, signatureData, comments } = req.body;
            const userId = req.user.id;

            if (!roleCode || !signatureData) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Role code and signature data are required'
                });
            }

            // Sign sheet
            const result = await SignatureRequestService.signSheet(
                sheetId,
                roleCode,
                userId,
                signatureData,
                comments
            );

            await conn.commit();

            res.json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            await conn.rollback();
            console.error('Sign with request error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to sign sheet'
            });
        } finally {
            conn.release();
        }
    }

    // GET /api/sheets/:id/signature-requests/status
    async getSignatureRequestStatus(req, res) {
        try {
            const { id: sheetId } = req.params;
            const status = await SignatureRequestService.getSheetStatus(sheetId);

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Get signature request status error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get signature request status'
            });
        }
    }

    // GET /api/sheets/my-signature-requests
    async getMySignatureRequests(req, res) {
        try {
            const userId = req.user.id;
            const requests = await SignatureRequestService.getMyRequests(userId);

            res.json({
                success: true,
                data: requests
            });
        } catch (error) {
            console.error('Get my signature requests error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get signature requests'
            });
        }
    }
}

module.exports = {
    DailySheetController: new DailySheetController(),
    upload,
    voucherUpload
};
