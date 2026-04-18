import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Send, PenTool, AlertCircle } from 'lucide-react';
import { dailySheetService } from '../services';
import toast from 'react-hot-toast';

const SignatureRequestPanel = ({ sheetId, onSignComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [signing, setSigning] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [signature, setSignature] = useState(null);
    const [comments, setComments] = useState('');

    useEffect(() => {
        loadRequests();
    }, [sheetId]);

    const loadRequests = async () => {
        try {
            const response = await dailySheetService.getSignatureRequestStatus(sheetId);
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to load signature requests:', error);
        }
    };

    const handleSendRequest = async (roleCode) => {
        try {
            setLoading(true);
            await dailySheetService.sendSignatureRequest(sheetId, roleCode);
            toast.success(`Signature request sent!`);
            loadRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSignature = (role) => {
        setSelectedRole(role);
        setShowSignatureModal(true);
    };

    const handleSign = async () => {
        if (!signature) {
            toast.error('Please provide your signature');
            return;
        }

        try {
            setSigning(true);
            await dailySheetService.signWithRequest(
                sheetId,
                selectedRole.role_code,
                signature,
                comments
            );

            toast.success('Sheet signed successfully!');
            setShowSignatureModal(false);
            setSignature(null);
            setComments('');
            setSelectedRole(null);
            loadRequests();
            onSignComplete?.();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to sign sheet');
        } finally {
            setSigning(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'not_requested':
                return {
                    color: 'gray',
                    bg: 'bg-gray-100',
                    border: 'border-gray-300',
                    icon: Clock,
                    label: 'Not Requested'
                };
            case 'requested':
                return {
                    color: 'blue',
                    bg: 'bg-blue-100',
                    border: 'border-blue-500',
                    icon: Bell,
                    label: 'Request Sent'
                };
            case 'signed':
                return {
                    color: 'green',
                    bg: 'bg-green-100',
                    border: 'border-green-500',
                    icon: CheckCircle,
                    label: 'Signed ✓'
                };
            case 'rejected':
                return {
                    color: 'red',
                    bg: 'bg-red-100',
                    border: 'border-red-500',
                    icon: AlertCircle,
                    label: 'Rejected'
                };
            default:
                return {
                    color: 'gray',
                    bg: 'bg-gray-100',
                    border: 'border-gray-300',
                    icon: Clock,
                    label: status
                };
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-t-lg">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Signature Requests
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                    Send requests and track signatures
                </p>
            </div>

            {/* Signature Roles */}
            <div className="p-4 space-y-3">
                {requests.map((request, index) => {
                    const statusConfig = getStatusConfig(request.status);
                    const StatusIcon = statusConfig.icon;

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
                                    {/* Send Request Button */}
                                    {request.status === 'not_requested' && (
                                        <button
                                            onClick={() => handleSendRequest(request.role_code)}
                                            disabled={loading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-4 w-4" />
                                            Send Request
                                        </button>
                                    )}

                                    {/* Sign Now Button */}
                                    {request.status === 'requested' && (
                                        <button
                                            onClick={() => handleOpenSignature(request)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                                        >
                                            <PenTool className="h-4 w-4" />
                                            Sign Now
                                        </button>
                                    )}

                                    {/* Signed Info */}
                                    {request.status === 'signed' && request.signed_by_name && (
                                        <div className="text-sm text-gray-600">
                                            <p className="font-medium">{request.signed_by_name}</p>
                                            <p className="text-xs">
                                                {new Date(request.signed_at).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Request Info */}
                            {request.status !== 'not_requested' && request.requested_by_name && (
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

            {/* Signature Modal */}
            {showSignatureModal && selectedRole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            Sign as {selectedRole.role_name}
                        </h3>

                        {/* Signature Canvas */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Signature *
                            </label>
                            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
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
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
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
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSign}
                                disabled={signing || !signature}
                                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {signing ? 'Signing...' : 'Sign Sheet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignatureRequestPanel;
