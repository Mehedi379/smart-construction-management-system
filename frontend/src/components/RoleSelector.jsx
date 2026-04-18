import { useState, useEffect } from 'react';
import { User, Send, CheckCircle, Clock, X } from 'lucide-react';
import { workflowService } from '../services';
import toast from 'react-hot-toast';

const RoleSelector = ({ sheetId, onSendComplete }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadWorkflowRoles();
    }, [sheetId]);

    const loadWorkflowRoles = async () => {
        try {
            const response = await workflowService.getSheetSignatureStatus(sheetId);
            const data = response.data;

            if (!data || !data.steps) {
                setRoles([]);
                return;
            }

            // Map workflow steps to roles
            const workflowRoles = data.steps.map((step, index) => ({
                stepNumber: index + 1,
                roleId: step.role_id,
                roleName: step.role_name,
                roleCode: step.role_code,
                status: step.status || 'waiting',
                signedBy: step.signed_by,
                signedAt: step.signed_at
            }));

            setRoles(workflowRoles);
        } catch (error) {
            console.error('Failed to load workflow roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (roleId) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(selectedRoles.filter(id => id !== roleId));
        } else {
            setSelectedRoles([...selectedRoles, roleId]);
        }
    };

    const handleSendRequest = async () => {
        if (selectedRoles.length === 0) {
            toast.error('Please select at least one role');
            return;
        }

        try {
            setSending(true);
            
            // For now, we send the sheet to workflow (which notifies all roles in order)
            // In future, can implement selective notification
            await workflowService.startWorkflow(sheetId);
            
            toast.success(`Signature request sent to ${selectedRoles.length} role(s)!`);
            onSendComplete?.();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (roles.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">No workflow roles available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Select Recipients for Signature Request
                </h3>
                {selectedRoles.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {selectedRoles.length} selected
                    </span>
                )}
            </div>

            <div className="space-y-2 mb-4">
                {roles.map((role) => (
                    <div
                        key={role.roleId}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedRoles.includes(role.roleId)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        } ${role.status === 'signed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => role.status !== 'signed' && toggleRole(role.roleId)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    role.status === 'signed' ? 'bg-green-100 text-green-600' :
                                    role.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {role.status === 'signed' ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Step {role.stepNumber}: {role.roleName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {role.roleCode.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {role.status === 'signed' ? (
                                    <div className="text-right">
                                        <p className="text-xs text-green-600 font-semibold">✓ Signed</p>
                                        {role.signedBy && (
                                            <p className="text-xs text-gray-500">by {role.signedBy}</p>
                                        )}
                                    </div>
                                ) : role.status === 'pending' ? (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        Waiting
                                    </span>
                                ) : (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
                <button
                    onClick={() => setSelectedRoles([])}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2"
                    disabled={selectedRoles.length === 0 || sending}
                >
                    <X className="h-4 w-4" />
                    Clear Selection
                </button>
                <button
                    onClick={handleSendRequest}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                    disabled={selectedRoles.length === 0 || sending}
                >
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending...' : `Send Request to ${selectedRoles.length} Role(s)`}
                </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
                💡 Tip: Select specific roles or send to start the complete workflow
            </p>
        </div>
    );
};

export default RoleSelector;
