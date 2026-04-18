import { Printer, Download, X, Send, Bell, CheckCircle, Clock, PenTool } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dailySheetService } from '../services';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';

const SheetPDFView = ({ sheet, onClose, onPrint, onDownloadPDF, onSignatureComplete }) => {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [signature, setSignature] = useState(null);
    const [comments, setComments] = useState('');
    const [signing, setSigning] = useState(false);

    // Load signature requests
    useEffect(() => {
        if (sheet?.id) {
            loadRequests();
        }
    }, [sheet?.id]);

    const loadRequests = async () => {
        try {
            const response = await dailySheetService.getSignatureRequestStatus(sheet.id);
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to load signature requests:', error);
        }
    };

    // Check if current user is the sheet creator
    const isCreator = user?.id === sheet?.created_by;

    // Check if current user has a pending signature request
    const getMyPendingRequest = () => {
        return requests.find(req => 
            req.status === 'requested' && 
            req.role_code === user?.role
        );
    };

    const myPendingRequest = getMyPendingRequest();
    const canSign = !!myPendingRequest;
    const canSendRequest = isCreator;

    const handleSendRequest = async (roleCode) => {
        try {
            setLoading(true);
            await dailySheetService.sendSignatureRequest(sheet.id, roleCode);
            toast.success('✅ Signature request sent!');
            loadRequests();
            onSignatureComplete?.();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        if (!signature) {
            toast.error('Please provide your signature');
            return;
        }

        try {
            setSigning(true);
            await dailySheetService.signWithRequest(
                sheet.id,
                selectedRole.role_code,
                signature,
                comments
            );

            toast.success('✅ Sheet signed successfully! Auto-updating...');
            
            // Close signature modal
            setShowSignatureModal(false);
            setSignature(null);
            setComments('');
            setSelectedRole(null);
            
            // Refresh everything
            await loadRequests();
            await onSignatureComplete?.();
            
            toast.success('✅ Sheet list updated!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to sign sheet');
        } finally {
            setSigning(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'not_requested':
                return { color: 'gray', bg: 'bg-gray-100', border: 'border-gray-300', icon: Clock, label: 'Not Requested' };
            case 'requested':
                return { color: 'blue', bg: 'bg-blue-100', border: 'border-blue-500', icon: Bell, label: 'Request Sent' };
            case 'signed':
                return { color: 'green', bg: 'bg-green-100', border: 'border-green-500', icon: CheckCircle, label: 'Signed ✓' };
            default:
                return { color: 'gray', bg: 'bg-gray-100', border: 'border-gray-300', icon: Clock, label: status };
        }
    };
    
    const sigData = sheet.signatures || {};
    const items = sheet.items || [];
    
    // Build signatures from requests data
    const signatures = {
        receiver: null,
        payer: null,
        prepared_by: null,
        checked_by: null,
        approved_by: null
    };
    
    // Map signature_requests to signatures
    requests.forEach(req => {
        if (req.status === 'signed') {
            let roleKey = req.role_code;
            
            // Map role_code to signature key
            if (req.role_code === 'site_manager') roleKey = 'receiver';
            else if (req.role_code === 'site_engineer') roleKey = 'prepared_by';
            else if (req.role_code === 'engineer') roleKey = 'prepared_by';
            else if (req.role_code === 'head_office_accounts') roleKey = 'payer';
            else if (req.role_code === 'deputy_director') roleKey = 'checked_by';
            else if (req.role_code === 'project_director') roleKey = 'approved_by';
            else if (req.role_code === 'head_office_admin') roleKey = 'approved_by';
            
            signatures[roleKey] = {
                name: req.signed_by_name || req.role_name,
                signature_data: req.signature_data,
                date: req.signed_at ? new Date(req.signed_at).toLocaleDateString('en-GB') : (req.signed_date || '')
            };
        }
    });
    
    // Fallback to old sigData
    if (sigData.receiver && !signatures.receiver) signatures.receiver = sigData.receiver;
    if (sigData.payer && !signatures.payer) signatures.payer = sigData.payer;
    if (sigData.prepared_by && !signatures.prepared_by) signatures.prepared_by = sigData.prepared_by;
    if (sigData.checked_by && !signatures.checked_by) signatures.checked_by = sigData.checked_by;
    if (sigData.approved_by && !signatures.approved_by) signatures.approved_by = sigData.approved_by;
    
    // Check if any signatures exist
    const hasSignatures = requests.some(req => req.status === 'signed');
    
    // Debug: Log signature data
    console.log('🔍 Signature Debug:', {
        hasSignatures,
        requests: requests.filter(r => r.status === 'signed').map(r => ({
            role_code: r.role_code,
            signed_by_name: r.signed_by_name,
            signature_data: r.signature_data ? 'EXISTS' : 'NULL'
        })),
        signatures: {
            receiver: signatures.receiver ? 'EXISTS' : 'NULL',
            prepared_by: signatures.prepared_by ? 'EXISTS' : 'NULL',
            payer: signatures.payer ? 'EXISTS' : 'NULL',
            checked_by: signatures.checked_by ? 'EXISTS' : 'NULL',
            approved_by: signatures.approved_by ? 'EXISTS' : 'NULL'
        }
    });
    
    // Signature display component
    const SignatureBox = ({ label, sig }) => {
        // Format date safely
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return ''; // Invalid date
            return date.toLocaleDateString('en-GB');
        };

        return (
            <div className="text-center">
                <div className="h-16 border-b-2 border-gray-800 mb-2 flex items-center justify-center">
                    {sig?.signature_data || sig?.signature ? (
                        <img 
                            src={sig.signature_data || sig.signature} 
                            alt={`${label} signature`}
                            className="max-h-14 max-w-full"
                        />
                    ) : (
                        <span className="text-gray-400 text-xs">Not signed</span>
                    )}
                </div>
                <p className="font-bold text-xs">{sig?.name || label}</p>
                <p className="text-xs text-gray-500">
                    {sig?.date ? formatDate(sig.date) : (sig?.signed_at ? formatDate(sig.signed_at) : '')}
                </p>
            </div>
        );
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Sheet Preview - {sheet.sheet_no}</h2>
                        <p className="text-sm text-gray-600 mt-1">{sheet.project_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onDownloadPDF(sheet.id)} 
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                        <button 
                            onClick={() => onPrint(sheet)} 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button 
                            onClick={onClose} 
                            className="ml-2 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>
    
                {/* PDF Content */}
                <div className="p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Lock Warning Banner */}
                    {hasSignatures && (
                        <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-400 rounded-lg">
                            <div className="flex items-start gap-2">
                                <svg className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-orange-800">
                                        ⚠️ Sheet has been signed - Editing Restricted
                                    </p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        • Sheet items cannot be modified (only admin can edit)
                                    </p>
                                    <p className="text-xs text-green-700 mt-1 font-semibold">
                                        ✅ Signature workflow is still active - You can still sign!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Header - Enhanced */}
                    <div className="text-center mb-6 pb-4 border-b-4 border-primary-700">
                        <h1 className="text-3xl font-bold mb-2 text-primary-700">M/S KHAZA BILKIS RABBI</h1>
                        <p className="text-lg font-semibold text-gray-700">Smart Construction Management System</p>
                        <p className="text-base font-medium text-gray-600 mt-1">Daily Expense Sheet</p>
                    </div>
                    
                    {/* Sheet Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <p className="mb-1"><strong>Project:</strong> {sheet.project_name || '-'}</p>
                            <p className="mb-1"><strong>Date:</strong> {new Date(sheet.sheet_date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div>
                            <p className="mb-1"><strong>Location:</strong> {sheet.location || '-'}</p>
                            <p className="mb-1"><strong>Sheet No:</strong> {sheet.sheet_no}</p>
                        </div>
                    </div>
                    
                    {/* Items Table */}
                    <table className="w-full mb-6 border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-black px-3 py-2 text-left font-bold" style={{ width: '50px' }}>No</th>
                                <th className="border border-black px-3 py-2 text-left font-bold">Description</th>
                                <th className="border border-black px-3 py-2 text-center font-bold" style={{ width: '60px' }}>Qty</th>
                                <th className="border border-black px-3 py-2 text-right font-bold" style={{ width: '90px' }}>Rate</th>
                                <th className="border border-black px-3 py-2 text-right font-bold" style={{ width: '110px' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i}>
                                    <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                                    <td className="border border-black px-3 py-2">{item.description}</td>
                                    <td className="border border-black px-3 py-2 text-center">{item.qty || '-'}</td>
                                    <td className="border border-black px-3 py-2 text-right">
                                        {item.rate ? parseFloat(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2}) : '-'}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-right">
                                        {parseFloat(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="border border-black px-3 py-4 text-center text-gray-500">
                                        No items
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    {/* Summary */}
                    <div className="bg-gray-100 p-4 mb-8 border border-gray-300">
                        <p className="mb-2 text-sm">
                            <strong>Previous Balance:</strong> ৳{parseFloat(sheet.previous_balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </p>
                        <p className="mb-2 text-sm">
                            <strong>Today's Expense:</strong> ৳{parseFloat(sheet.today_expense || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </p>
                        <p className="text-base font-bold">
                            <strong>Remaining Balance:</strong> ৳{parseFloat(sheet.remaining_balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </p>
                    </div>
                    
                    {/* Signatures */}
                    <div className="mt-12">
                        <h3 className="text-center text-sm font-semibold text-gray-700 mb-4">Signatures</h3>
                        <div className="grid grid-cols-5 gap-4">
                            <SignatureBox label="Receiver" sig={signatures.receiver} />
                            <SignatureBox label="Payer" sig={signatures.payer} />
                            <SignatureBox label="Prepared By" sig={signatures.prepared_by} />
                            <SignatureBox label="Checked By" sig={signatures.checked_by} />
                            <SignatureBox label="Approved By" sig={signatures.approved_by} />
                        </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="mt-8 pt-4 border-t">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                            sheet.status === 'approved' ? 'bg-green-100 text-green-800' :
                            sheet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            Status: {sheet.status || 'draft'}
                        </span>
                    </div>

                    {/* Signature Request Actions Panel */}
                    <div className="mt-8 pt-6 border-t-2 border-gray-300">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-600" />
                            Signature Requests
                        </h3>
                        {canSendRequest && (
                            <p className="text-sm text-gray-600 mb-4">Click "Send Request" to send signature request to each role</p>
                        )}
                        {canSign && (
                            <p className="text-sm text-blue-600 mb-4 font-semibold">⏳ You have a pending signature request</p>
                        )}
                        {!canSendRequest && !canSign && (
                            <p className="text-sm text-gray-600 mb-4">👁️ View-only: You can see signature status</p>
                        )}
                        
                        <div className="grid grid-cols-1 gap-3">
                            {requests.map((request) => {
                                const statusConfig = getStatusConfig(request.status);
                                const StatusIcon = statusConfig.icon;
                                const isMyRequest = canSign && request.role_code === user?.role && request.status === 'requested';
                                
                                return (
                                    <div
                                        key={request.id}
                                        className={`border-2 ${statusConfig.border} rounded-lg p-4 ${statusConfig.bg} transition-all`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full bg-${statusConfig.color}-500 flex items-center justify-center`}>
                                                    <StatusIcon className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {request.role_name}
                                                    </h4>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${statusConfig.color}-200 text-${statusConfig.color}-800`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Send Request Button - ONLY for creator */}
                                                {request.status === 'not_requested' && canSendRequest && (
                                                    <button
                                                        onClick={() => handleSendRequest(request.role_code)}
                                                        disabled={loading}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                        Send Request
                                                    </button>
                                                )}

                                                {/* Sign Now Button - ONLY for user with pending request */}
                                                {isMyRequest && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRole(request);
                                                            setShowSignatureModal(true);
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                                                    >
                                                        <PenTool className="h-4 w-4" />
                                                        Sign Now
                                                    </button>
                                                )}

                                                {/* Requested status - Show for everyone except the recipient */}
                                                {request.status === 'requested' && !isMyRequest && (
                                                    <span className="text-blue-600 text-sm font-medium">Awaiting signature...</span>
                                                )}

                                                {/* Signed Info - Show for everyone */}
                                                {request.status === 'signed' && request.signed_by_name && (
                                                    <div className="text-sm text-gray-600">
                                                        <p className="font-medium">✓ {request.signed_by_name}</p>
                                                        <p className="text-xs">
                                                            {new Date(request.signed_at).toLocaleDateString('en-GB')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Request Info */}
                                        {request.requested_by_name && (
                                            <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                                                Requested by: <strong>{request.requested_by_name}</strong>
                                                {request.requested_at && (
                                                    <> • {new Date(request.requested_at).toLocaleString('en-GB')}</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Signature Modal */}
                {showSignatureModal && selectedRole && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-4">
                                Sign as {selectedRole.role_name}
                            </h3>

                            {/* Signature Canvas */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Signature *
                                </label>
                                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                                    <canvas
                                        ref={(el) => {
                                            if (el) {
                                                el.width = el.offsetWidth;
                                                el.height = 150;
                                                const ctx = el.getContext('2d');
                                                ctx.strokeStyle = '#000';
                                                ctx.lineWidth = 2;

                                                let drawing = false;

                                                el.onmousedown = (e) => {
                                                    drawing = true;
                                                    ctx.beginPath();
                                                    ctx.moveTo(e.offsetX, e.offsetY);
                                                };

                                                el.onmousemove = (e) => {
                                                    if (!drawing) return;
                                                    ctx.lineTo(e.offsetX, e.offsetY);
                                                    ctx.stroke();
                                                };

                                                el.onmouseup = () => {
                                                    drawing = false;
                                                    setSignature(el.toDataURL());
                                                };
                                            }
                                        }}
                                        className="w-full h-[150px] cursor-crosshair"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const canvas = document.querySelector('canvas');
                                        if (canvas) {
                                            const ctx = canvas.getContext('2d');
                                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                                            setSignature(null);
                                        }
                                    }}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Clear Signature
                                </button>
                            </div>

                            {/* Comments */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comments (optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Add any comments..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowSignatureModal(false);
                                        setSignature(null);
                                        setComments('');
                                        setSelectedRole(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSign}
                                    disabled={signing || !signature}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {signing ? 'Signing...' : 'Sign Sheet'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SheetPDFView;
