import { useState, useEffect, useRef } from 'react';
import { Camera, FileText, Printer, Scan, Plus, Trash2, Save, Eye, Download, PenTool, Send, Bell } from 'lucide-react';
import Tesseract from 'tesseract.js';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';
import { dailySheetService, projectService, voucherService, expenseService, purchaseService, workflowService } from '../services';
import useAuthStore from '../store/authStore';
import SignatureWorkflow from '../components/SignatureWorkflow';
import PendingSignatures from '../components/PendingSignatures';
import SignatureTimeline from '../components/SignatureTimeline';
import logo from '../assets/logo.png';
import RoleSelector from '../components/RoleSelector';
import SignatureRequestPanel from '../components/SignatureRequestPanel';
import SheetPDFView from '../components/SheetPDFView';

const DailySheets = () => {
    const { user } = useAuthStore();
    const [sheets, setSheets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [viewSheet, setViewSheet] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        project_id: '',
        sheet_date: new Date().toISOString().split('T')[0],
        location: '',
        previous_balance: 0,
        items: [],
        ocr_text: ''
    });
    
    // Signatures state - 5 signature fields
    const [signatures, setSignatures] = useState({
        receiver: { name: '', signature: null, date: '' },
        payer: { name: '', signature: null, date: '' },
        prepared_by: { name: user?.name || '', signature: null, date: new Date().toISOString().split('T')[0] },
        checked_by: { name: '', signature: null, date: '' },
        approved_by: { name: '', signature: null, date: '' }
    });
    
    // Signature refs
    const sigRefs = {
        receiver: useRef(null),
        payer: useRef(null),
        prepared_by: useRef(null),
        checked_by: useRef(null),
        approved_by: useRef(null)
    };
    
    // OCR state
    const [scanning, setScanning] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [currentSigRole, setCurrentSigRole] = useState(null);

    useEffect(() => {
        loadProjects();
        loadSheets();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await projectService.getProjects({});
            setProjects(response.data || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    };

    const loadSheets = async () => {
        try {
            const response = await dailySheetService.getSheets({});
            setSheets(response.data || []);
        } catch (error) {
            toast.error('Failed to load sheets');
        }
    };

    // Send sheet for signature workflow
    const handleSendForSignature = async (sheetId) => {
        try {
            const response = await dailySheetService.sendForSignature(sheetId);
            toast.success('✅ Sheet sent for signature!');
            loadSheets();
            setViewSheet(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send for signature');
        }
    };

    // Download PDF
    const handleDownloadPDF = async (sheetId) => {
        try {
            // Get sheet details with signature requests
            const response = await dailySheetService.getSheetById(sheetId);
            const sheet = response.data;
            
            // Fetch signature requests to get actual signatures
            try {
                const sigResponse = await dailySheetService.getSignatureRequestStatus(sheetId);
                sheet.signature_requests = sigResponse.data || [];
            } catch (error) {
                console.error('Failed to load signatures:', error);
            }
            
            // Open print dialog which allows saving as PDF
            const printWindow = window.open('', '_blank');
            printWindow.document.write(generatePrintHTML(sheet));
            printWindow.document.close();
            
            // Show message
            toast.success('PDF ready! Use "Save as PDF" in print dialog');
        } catch (error) {
            toast.error('Failed to generate PDF');
            console.error('PDF error:', error);
        }
    };

    // OCR Scan receipt
    const handleScanReceipt = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        setUploadedImage(URL.createObjectURL(file));

        try {
            // Perform OCR
            const { data: { text } } = await Tesseract.recognize(file, 'eng+ben', {
                logger: m => console.log(m)
            });

            console.log('OCR Text:', text);
            
            // Parse extracted data
            const extractedItems = parseOCRText(text);
            const detectedProject = detectProject(text);

            // Auto-fill form
            setFormData(prev => ({
                ...prev,
                ocr_text: text,
                items: extractedItems.length > 0 ? extractedItems : prev.items,
                project_id: detectedProject || prev.project_id
            }));

            toast.success('Receipt scanned successfully!');
        } catch (error) {
            console.error('OCR Error:', error);
            toast.error('Failed to scan receipt');
        } finally {
            setScanning(false);
        }
    };

    // Parse OCR text - Enhanced parser matching backend logic
    const parseOCRText = (text) => {
        const items = [];
        const lines = text.split('\n');
        
        // Enhanced patterns for Bengali and English receipts
        const amountPattern = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:৳|TK|taka|টাকা|Tk|rs|Rs|RUPEES)/gi;
        const itemPattern = /^(\d+)[\.\)\s\-]+(.+?)(?:\s+(\d+(?:\.\d+)?)\s*(?:pcs|bag|kg|ltr|ft|pc|nos|piece|bundle|rod|carrying))?\s*[\.\s\-]+\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
        const qtyRatePattern = /(\d+(?:\.\d+)?)\s*[xX\*]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*=\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
        
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
            const qtyRateMatches = [...trimmed.matchAll(qtyRatePattern)];
            for (const match of qtyRateMatches) {
                items.push({
                    description: trimmed.substring(0, 40).trim(),
                    qty: parseFloat(match[1]),
                    rate: parseFloat(match[2].replace(/,/g, '')),
                    amount: parseFloat(match[3].replace(/,/g, ''))
                });
            }
            
            // Try to extract standalone amounts
            const amountMatches = [...trimmed.matchAll(amountPattern)];
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

    // Detect project from text
    const detectProject = (text) => {
        const lowerText = text.toLowerCase();
        
        const projectMap = [
            { keywords: ['bksc', 'খাজা'], projectId: null },
            { keywords: ['rupayan', 'রুপায়ন'], projectId: null },
            { keywords: ['metro', 'মেট্রো'], projectId: null }
        ];

        for (const proj of projects) {
            if (projectMap.some(p => p.keywords.some(k => lowerText.includes(k)))) {
                return proj.id;
            }
        }
        
        return null;
    };

    // Load expenses/vouchers for auto-fill
    const loadDayExpenses = async () => {
        if (!formData.project_id || !formData.sheet_date) {
            toast.error('Please select project and date first');
            return;
        }

        try {
            // Load expenses for the day
            const [expensesRes, vouchersRes] = await Promise.all([
                expenseService.getExpenses({
                    project_id: formData.project_id,
                    date: formData.sheet_date
                }),
                voucherService.getVouchers({
                    project_id: formData.project_id,
                    date: formData.sheet_date
                })
            ]);

            const items = [];
            
            // Add expenses
            (expensesRes.data || []).forEach(exp => {
                items.push({
                    description: `${exp.category} - ${exp.description || ''}`,
                    qty: 0,
                    rate: 0,
                    amount: parseFloat(exp.amount),
                    source: 'expense',
                    source_id: exp.id
                });
            });

            // Add vouchers
            (vouchersRes.data || []).forEach(vouch => {
                items.push({
                    description: `${vouch.voucher_type} - ${vouch.description || ''}`,
                    qty: 0,
                    rate: 0,
                    amount: parseFloat(vouch.amount),
                    source: 'voucher',
                    source_id: vouch.id
                });
            });

            setFormData(prev => ({ ...prev, items }));
            toast.success(`Loaded ${items.length} items from expenses & vouchers`);
        } catch (error) {
            toast.error('Failed to load expenses');
        }
    };

    // Add manual item
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                description: '',
                qty: 0,
                rate: 0,
                amount: 0
            }]
        }));
    };

    // Update item
    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        
        // Auto-calculate amount
        if (field === 'qty' || field === 'rate') {
            newItems[index].amount = parseFloat(newItems[index].qty) * parseFloat(newItems[index].rate);
        }
        
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    // Remove item
    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Calculate totals
    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    // Get project balance
    const loadProjectBalance = async () => {
        if (!formData.project_id || !formData.sheet_date) return;
        
        try {
            const response = await dailySheetService.getProjectBalance(
                formData.project_id,
                formData.sheet_date
            );
            
            setFormData(prev => ({
                ...prev,
                previous_balance: response.data.previous_balance || 0
            }));
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };

    // Handle signature
    const handleSignature = (role) => {
        setCurrentSigRole(role);
        setShowSignatureModal(role);
        
        // Auto-fill name and date
        setSignatures(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                name: user.name,
                date: new Date().toLocaleDateString('en-GB')
            }
        }));
    };

    // Save signature
    const saveSignature = () => {
        if (!currentSigRole) return;
        
        const sigCanvas = sigRefs[currentSigRole].current;
        if (sigCanvas && !sigCanvas.isEmpty()) {
            const signatureData = sigCanvas.toDataURL();
            
            setSignatures(prev => ({
                ...prev,
                [currentSigRole]: {
                    ...prev[currentSigRole],
                    signature: signatureData
                }
            }));
            
            toast.success('Signature saved!');
        } else {
            toast.error('Please draw your signature first');
            return;
        }
        
        setShowSignatureModal(null);
        setCurrentSigRole(null);
    };

    // Clear signature
    const clearSignature = () => {
        if (currentSigRole && sigRefs[currentSigRole].current) {
            sigRefs[currentSigRole].current.clear();
        }
    };

    // View sheet details
    const handleViewSheet = async (sheet) => {
        try {
            if (!sheet || !sheet.id) {
                toast.error('Invalid sheet data');
                return;
            }
            
            console.log('🔍 Viewing sheet ID:', sheet.id);
            setLoading(true);
            const response = await dailySheetService.getSheetById(sheet.id);
            
            if (!response.data) {
                toast.error('Sheet not found');
                return;
            }
            
            console.log('✅ Sheet data loaded:', response.data);
            console.log('📋 Items count:', response.data.items?.length);
            setViewSheet(response.data);
            console.log('📦 viewSheet state updated');
        } catch (error) {
            console.error('❌ Failed to load sheet:', error);
            toast.error('Failed to load sheet details');
        } finally {
            setLoading(false);
        }
    };

    // Refresh view sheet data (after signing)
    const refreshViewSheet = async () => {
        if (!viewSheet || !viewSheet.id) return;
        
        try {
            console.log('🔄 Refreshing view sheet data...');
            const response = await dailySheetService.getSheetById(viewSheet.id);
            if (response.data) {
                setViewSheet(response.data);
                console.log('✅ View sheet refreshed with latest signatures');
            }
        } catch (error) {
            console.error('Failed to refresh view:', error);
        }
    };

    // Save sheet
    const handleSave = async () => {
        if (!formData.project_id) {
            toast.error('Please select a project');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setLoading(true);
        try {
            const todayExpense = calculateTotal();
            const remainingBalance = formData.previous_balance - todayExpense;

            await dailySheetService.createSheet({
                ...formData,
                today_expense: todayExpense,
                remaining_balance: remainingBalance,
                signatures: signatures
            });

            toast.success('Daily sheet created successfully!');
            setShowForm(false);
            setFormData({
                project_id: '',
                sheet_date: new Date().toISOString().split('T')[0],
                location: '',
                previous_balance: 0,
                items: [],
                ocr_text: ''
            });
            setSignatures({
                receiver: { name: '', signature: null, date: '' },
                payer: { name: '', signature: null, date: '' },
                prepared_by: { name: '', signature: null, date: '' },
                checked_by: { name: '', signature: null, date: '' },
                approved_by: { name: '', signature: null, date: '' }
            });
            loadSheets();
        } catch (error) {
            console.error('Sheet creation error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create sheet';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Print sheet
    const handlePrint = async (sheet) => {
        try {
            // If sheet doesn't have items, fetch full data
            let fullSheet = sheet;
            if (!sheet.items || !sheet.items.length) {
                const response = await dailySheetService.getSheetById(sheet.id);
                fullSheet = response.data;
            }

            // Fetch signature requests to get actual signatures
            try {
                const sigResponse = await dailySheetService.getSignatureRequestStatus(fullSheet.id);
                fullSheet.signature_requests = sigResponse.data || [];
            } catch (error) {
                console.error('Failed to load signatures for print:', error);
            }

            const printWindow = window.open('', '_blank');
            printWindow.document.write(generatePrintHTML(fullSheet));
            printWindow.document.close();
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Failed to load sheet for printing');
        }
    };

    // Generate print HTML
    const generatePrintHTML = (sheet) => {
        const sigData = sheet.signatures || {};
        const sigRequests = sheet.signature_requests || [];
        
        console.log('🖨️ Generating print HTML...');
        console.log('Signature requests:', sigRequests.length);
        console.log('Signed requests:', sigRequests.filter(r => r.status === 'signed').length);
        
        // Build signature data from signature_requests
        const signatures = {
            receiver: null,
            payer: null,
            prepared_by: null,
            checked_by: null,
            approved_by: null
        };
        
        // Map signature_requests to signatures (use role_code directly)
        sigRequests.forEach(req => {
            console.log(`Processing: ${req.role_code} - Status: ${req.status}`);
            
            if (req.status === 'signed') {
                // Map role_code to signature key
                let roleKey = req.role_code;
                
                // Ensure correct mapping
                if (req.role_code === 'site_manager') roleKey = 'receiver';
                else if (req.role_code === 'site_engineer') roleKey = 'prepared_by';
                else if (req.role_code === 'engineer') roleKey = 'prepared_by';
                else if (req.role_code === 'head_office_accounts') roleKey = 'payer';
                else if (req.role_code === 'deputy_director') roleKey = 'checked_by';
                else if (req.role_code === 'project_director') roleKey = 'approved_by';
                else if (req.role_code === 'head_office_admin') roleKey = 'approved_by';
                
                signatures[roleKey] = {
                    name: req.signed_by_name || req.role_name,
                    signature: req.signature_data,
                    date: req.signed_at ? new Date(req.signed_at).toLocaleDateString('en-GB') : ''
                };
                
                console.log(`✅ Mapped ${req.role_code} -> ${roleKey} with signature`);
            }
        });
        
        console.log('Final signatures object:', signatures);
        
        // Fallback to old sigData if available
        if (sigData.receiver && !signatures.receiver) signatures.receiver = sigData.receiver;
        if (sigData.payer && !signatures.payer) signatures.payer = sigData.payer;
        if (sigData.prepared_by && !signatures.prepared_by) signatures.prepared_by = sigData.prepared_by;
        if (sigData.checked_by && !signatures.checked_by) signatures.checked_by = sigData.checked_by;
        if (sigData.approved_by && !signatures.approved_by) signatures.approved_by = sigData.approved_by;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>দৈনিক খরচের ভাউচার - ${sheet.sheet_no}</title>
    <style>
        @page { 
            size: A4; 
            margin: 15mm;
        }
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
        }
        body { 
            font-family: 'Kalpurush', 'SolaimanLipi', 'Nikosh', Arial, sans-serif; 
            padding: 15px; 
            font-size: 12px;
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
            font-size: 11px;
        }
        th { 
            background: #f0f0f0; 
            font-weight: bold;
            padding: 7px 5px;
            text-align: center;
            border: 1px solid #000;
        }
        td { 
            border: 1px solid #000; 
            padding: 6px 5px;
            height: 26px;
        }
        td:first-child {
            text-align: center;
            width: 35px;
        }
        td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6) {
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
        
        @media print { 
            body { 
                padding: 0;
                font-size: 11px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Company Header -->
    <div class="header-container">
        <div class="logo-space">
            <img src="${logo}" alt="KBR Logo" style="width: 100%; height: 100%; object-fit: contain;" />
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
    
    <!-- Items Table -->
    <table>
        <thead>
            <tr>
                <th>ক্রম</th>
                <th>বিবরণ</th>
                <th>পরিমাণ</th>
                <th>দর</th>
                <th>টাকা</th>
                <th>বাকি</th>
            </tr>
        </thead>
        <tbody>
            ${sheet.items.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td style="text-align: left; padding-left: 10px;">${item.description || ''}</td>
                    <td>${item.qty || ''}</td>
                    <td>${item.rate ? parseFloat(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                    <td>${parseFloat(item.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td></td>
                </tr>
            `).join('')}
            ${Array(20 - sheet.items.length).fill('').map((_, i) => `
                <tr>
                    <td>${sheet.items.length + i + 1}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <!-- Total Section -->
    <div class="total-section">
        সর্বমোট : <span class="total-line">৳ ${parseFloat(sheet.today_expense || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
    </div>
    
    <!-- Explanation -->
    <div class="explanation">
        <div class="explanation-label">ব্যাখ্যা :</div>
        <div class="explanation-line"></div>
        <div class="explanation-line"></div>
    </div>
    
    <!-- Signatures -->
    <div class="signatures">
        <div class="sig-box">
            <div class="sig-image">
                ${signatures.receiver?.signature ? `<img src="${signatures.receiver.signature}" />` : ''}
            </div>
            <div class="sig-label">প্রাপ্ত ব্যক্তির<br/>স্বাক্ষর</div>
            ${signatures.receiver?.name ? `<div class="sig-name">${signatures.receiver.name}</div>` : ''}
            ${signatures.receiver?.date ? `<div class="sig-date">${signatures.receiver.date}</div>` : ''}
        </div>
        
        <div class="sig-box">
            <div class="sig-image">
                ${signatures.prepared_by?.signature ? `<img src="${signatures.prepared_by.signature}" />` : ''}
            </div>
            <div class="sig-label">সহকারী প্রকৌশলী</div>
            ${signatures.prepared_by?.name ? `<div class="sig-name">${signatures.prepared_by.name}</div>` : ''}
            ${signatures.prepared_by?.date ? `<div class="sig-date">${signatures.prepared_by.date}</div>` : ''}
        </div>
        
        <div class="sig-box">
            <div class="sig-image">
                ${signatures.approved_by?.signature ? `<img src="${signatures.approved_by.signature}" />` : ''}
            </div>
            <div class="sig-label">প্রকল্প পরিচালক</div>
            ${signatures.approved_by?.name ? `<div class="sig-name">${signatures.approved_by.name}</div>` : ''}
            ${signatures.approved_by?.date ? `<div class="sig-date">${signatures.approved_by.date}</div>` : ''}
        </div>
        
        <div class="sig-box">
            <div class="sig-image">
                ${signatures.payer?.signature ? `<img src="${signatures.payer.signature}" />` : ''}
            </div>
            <div class="sig-label">হিসাব রক্ষক<br/>(হেড অফিস)</div>
            ${signatures.payer?.name ? `<div class="sig-name">${signatures.payer.name}</div>` : ''}
            ${signatures.payer?.date ? `<div class="sig-date">${signatures.payer.date}</div>` : ''}
        </div>
        
        <div class="sig-box">
            <div class="sig-image">
                ${signatures.checked_by?.signature ? `<img src="${signatures.checked_by.signature}" />` : ''}
            </div>
            <div class="sig-label">ডেপুটি ডিরেক্টর</div>
            ${signatures.checked_by?.name ? `<div class="sig-name">${signatures.checked_by.name}</div>` : ''}
            ${signatures.checked_by?.date ? `<div class="sig-date">${signatures.checked_by.date}</div>` : ''}
        </div>
    </div>
    
    <!-- Approval Status -->
    <div class="approval-status">
        অনুমোদন প্রদান করা হলো ${sheet.status === 'approved' ? '✅' : sheet.status === 'pending' ? '⏳' : '❌'}
    </div>
</body>
</html>`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Daily Expense Sheets</h1>
                    <p className="text-gray-600 mt-1">Scan, create & manage daily expense sheets</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    New Sheet
                </button>
            </div>

            {/* Pending Signatures Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Pending Signatures
                </h2>
                <PendingSignatures onSelectSheet={(sheet) => {
                    // Fetch full sheet details and open view modal
                    dailySheetService.getSheetById(sheet.sheet_id || sheet.id)
                        .then(response => {
                            setViewSheet(response.data);
                            console.log('✅ Opened sheet from pending signatures');
                        })
                        .catch(error => {
                            console.error('Failed to load sheet:', error);
                            toast.error('Failed to load sheet details');
                        });
                }} onSignatureComplete={async () => {
                    // Auto-refresh after signing
                    console.log('🔄 Signature completed from pending - refreshing...');
                    await loadSheets();
                    console.log('✅ Sheet list refreshed!');
                }} />
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Create Daily Sheet</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* OCR Scanner */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <Scan className="h-5 w-5" />
                                    Scan Receipt / Bill
                                </h3>
                                <div className="flex gap-4 items-center">
                                    <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                                        <Camera className="h-5 w-5" />
                                        {scanning ? 'Scanning...' : 'Upload & Scan'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleScanReceipt}
                                            className="hidden"
                                            disabled={scanning}
                                        />
                                    </label>
                                    {uploadedImage && (
                                        <img src={uploadedImage} alt="Receipt" className="h-20 rounded border" />
                                    )}
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Project *</label>
                                    <select
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.project_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Date *</label>
                                    <input
                                        type="date"
                                        value={formData.sheet_date}
                                        onChange={(e) => setFormData({ ...formData, sheet_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="label">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="input-field"
                                        placeholder="Site location"
                                    />
                                </div>
                                <div>
                                    <label className="label">Previous Balance (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.previous_balance}
                                        onChange={(e) => setFormData({ ...formData, previous_balance: parseFloat(e.target.value) || 0 })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Auto-load from expenses/vouchers */}
                            <button
                                onClick={loadDayExpenses}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <FileText className="h-5 w-5" />
                                Load from Expenses & Vouchers
                            </button>

                            {/* Items Table */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold">Items</h3>
                                    <button onClick={addItem} className="btn-primary text-sm">
                                        <Plus className="h-4 w-4 inline mr-1" /> Add Item
                                    </button>
                                </div>
                                
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left">No</th>
                                                <th className="px-3 py-2 text-left">Description</th>
                                                <th className="px-3 py-2 text-left">Qty</th>
                                                <th className="px-3 py-2 text-left">Rate</th>
                                                <th className="px-3 py-2 text-left">Amount</th>
                                                <th className="px-3 py-2 text-left">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="px-3 py-2">{index + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                            className="input-field text-sm"
                                                            placeholder="Item description"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                                                            className="input-field text-sm w-20"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                            className="input-field text-sm w-24"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 font-semibold">
                                                        ৳{parseFloat(item.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary */}
                                <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Previous Balance</p>
                                            <p className="text-xl font-bold">৳{formData.previous_balance.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Today's Expense</p>
                                            <p className="text-xl font-bold text-red-600">৳{calculateTotal().toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Remaining</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ৳{(formData.previous_balance - calculateTotal()).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Digital Signatures */}
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                    <PenTool className="h-5 w-5" />
                                    Digital Signatures
                                </h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {['receiver', 'payer', 'prepared_by', 'checked_by', 'approved_by'].map(role => (
                                        <div key={role} className="text-center">
                                            <button
                                                onClick={() => handleSignature(role)}
                                                className={`w-full p-3 rounded border-2 transition-all ${
                                                    signatures[role]?.signature 
                                                        ? 'border-green-500 bg-green-50' 
                                                        : 'border-gray-300 bg-white hover:border-purple-400'
                                                }`}
                                            >
                                                <div className="h-12 flex items-center justify-center mb-2">
                                                    {signatures[role]?.signature ? (
                                                        <img 
                                                            src={signatures[role].signature} 
                                                            alt={role}
                                                            className="max-h-10 max-w-full"
                                                        />
                                                    ) : (
                                                        <PenTool className="h-6 w-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold capitalize">
                                                    {role.replace('_', ' ')}
                                                </p>
                                                {signatures[role]?.name && (
                                                    <p className="text-xs text-gray-600 mt-1">{signatures[role].name}</p>
                                                )}
                                            </button>
                                        </div>
                                    ))}  
                                </div>
                                
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowForm(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handlePrint(null)}
                                    className="btn-secondary flex items-center gap-2"
                                    title="Print Sheet"
                                >
                                    <Printer className="h-5 w-5" />
                                    Print
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Save className="h-5 w-5" />
                                    {loading ? 'Saving...' : 'Save Sheet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold capitalize">
                                    {currentSigRole?.replace('_', ' ')} Signature
                                </h3>
                                <button 
                                    onClick={() => setShowSignatureModal(null)} 
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">Name</label>
                                    <input
                                        type="text"
                                        value={signatures[currentSigRole]?.name || ''}
                                        onChange={(e) => setSignatures(prev => ({
                                            ...prev,
                                            [currentSigRole]: { ...prev[currentSigRole], name: e.target.value }
                                        }))}
                                        className="input-field"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label className="label">Date</label>
                                    <input
                                        type="text"
                                        value={signatures[currentSigRole]?.date || ''}
                                        onChange={(e) => setSignatures(prev => ({
                                            ...prev,
                                            [currentSigRole]: { ...prev[currentSigRole], date: e.target.value }
                                        }))}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="label">Draw Signature</label>
                                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                        <SignatureCanvas
                                            ref={sigRefs[currentSigRole]}
                                            canvasProps={{
                                                className: 'w-full h-40 bg-gray-50'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={clearSignature}
                                        className="text-sm text-red-600 hover:text-red-800 mt-2"
                                    >
                                        Clear Signature
                                    </button>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowSignatureModal(null)}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveSignature}
                                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Save className="h-5 w-5" />
                                        Save Signature
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Sheet Modal - PDF Style with Auto-Update */}
            {viewSheet && (
                <SheetPDFView 
                    sheet={viewSheet}
                    onClose={() => setViewSheet(null)}
                    onPrint={handlePrint}
                    onDownloadPDF={handleDownloadPDF}
                    onSignatureComplete={async () => {
                        console.log('🔄 Signature completed - refreshing everything...');
                        
                        // Refresh sheet list
                        await loadSheets();
                        
                        // Refresh view modal
                        await refreshViewSheet();
                        
                        console.log('✅ All data refreshed!');
                    }}
                />
            )}

            {/* Signature Workflow Modal (separate, below) */}
            {viewSheet && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-40 max-h-[40vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Signature Workflow</h3>
                            <button 
                                onClick={() => setViewSheet(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                            >
                                ×
                            </button>
                        </div>
                        <SignatureWorkflow 
                            sheetId={viewSheet.id} 
                            onSignatureComplete={() => {
                                loadSheets();
                                refreshViewSheet(); // Auto-update view!
                            }} 
                        />
                    </div>
                </div>
            )}

            {/* Sheets List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sheet No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Expense</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sheets.map(sheet => {
                                // Status badge logic
                                const getStatusBadge = (status) => {
                                    switch(status) {
                                        case 'approved':
                                            return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-900">✓ Approved</span>;
                                        case 'pending':
                                            return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-900">⏳ Pending</span>;
                                        case 'rejected':
                                            return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900">✗ Rejected</span>;
                                        default:
                                            return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-900">📝 Draft</span>;
                                    }
                                };

                                return (
                                    <tr key={sheet.id} className="bg-white hover:bg-blue-50 transition-colors duration-150">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-blue-600">{sheet.sheet_no}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 font-medium">{sheet.project_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{new Date(sheet.sheet_date).toLocaleDateString('en-GB')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(sheet.status || 'draft')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-red-600">৳{parseFloat(sheet.today_expense || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-green-600">৳{parseFloat(sheet.remaining_balance || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewSheet(sheet)}
                                                    className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(sheet)}
                                                    className="inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                                    title="Print Sheet"
                                                >
                                                    <Printer className="h-4 w-4 mr-1" />
                                                    Print
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {sheets.length === 0 && (
                    <div className="text-center py-16 bg-gray-50">
                        <FileText className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 font-medium text-lg">No daily sheets found</p>
                        <p className="text-gray-500 text-sm mt-2">Click "New Sheet" to create your first sheet!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailySheets;
