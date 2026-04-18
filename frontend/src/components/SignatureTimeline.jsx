import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, User, Send, AlertCircle } from 'lucide-react';
import { workflowService } from '../services';

const SignatureTimeline = ({ sheetId }) => {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimeline();
    }, [sheetId]);

    const loadTimeline = async () => {
        try {
            const response = await workflowService.getSheetSignatureStatus(sheetId);
            const data = response.data;

            if (!data || data.status === 'no_workflow' || !data.steps) {
                setTimeline([]);
                setLoading(false);
                return;
            }

            // Build timeline from signature steps
            const timelineItems = data.steps.map((step, index) => {
                let status = 'waiting';
                let icon = Clock;
                let color = 'gray';

                if (step.status === 'signed') {
                    status = 'completed';
                    icon = CheckCircle;
                    color = 'green';
                } else if (step.status === 'pending' && index === data.current_step - 1) {
                    status = 'current';
                    icon = Bell;
                    color = 'blue';
                } else if (step.status === 'rejected') {
                    status = 'rejected';
                    icon = AlertCircle;
                    color = 'red';
                }

                return {
                    stepNumber: index + 1,
                    roleName: step.role_name,
                    roleCode: step.role_code,
                    signedBy: step.signed_by,
                    signedAt: step.signed_at,
                    comments: step.comments,
                    status,
                    icon,
                    color
                };
            });

            setTimeline(timelineItems);
        } catch (error) {
            console.error('Failed to load timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">No signature history available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Signature Request Timeline
            </h3>

            <div className="space-y-4">
                {timeline.map((item, index) => (
                    <div key={item.stepNumber} className="flex gap-4">
                        {/* Icon */}
                        <div className="flex flex-col items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                item.color === 'green' ? 'bg-green-100 text-green-600' :
                                item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                item.color === 'red' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-400'
                            }`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            {index < timeline.length - 1 && (
                                <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">
                                        Step {item.stepNumber}: {item.roleName}
                                    </p>
                                    {item.status === 'current' && (
                                        <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Waiting for signature
                                        </p>
                                    )}
                                    {item.status === 'completed' && (
                                        <p className="text-sm text-green-600 mt-1">
                                            ✓ Signed by {item.signedBy || 'User'}
                                            {item.signedAt && ` on ${new Date(item.signedAt).toLocaleDateString()}`}
                                        </p>
                                    )}
                                    {item.status === 'rejected' && (
                                        <p className="text-sm text-red-600 mt-1">
                                            ✗ Rejected
                                            {item.comments && `: ${item.comments}`}
                                        </p>
                                    )}
                                    {item.status === 'waiting' && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Waiting for previous approvals
                                        </p>
                                    )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    item.color === 'green' ? 'bg-green-100 text-green-800' :
                                    item.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                    item.color === 'red' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {item.status === 'completed' ? 'Signed' :
                                     item.status === 'current' ? 'In Progress' :
                                     item.status === 'rejected' ? 'Rejected' :
                                     'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary at bottom */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>
                        Completed: {timeline.filter(t => t.status === 'completed').length} / {timeline.length}
                    </span>
                    <span>
                        Current: {timeline.findIndex(t => t.status === 'current') >= 0 ? 
                            `Step ${timeline.findIndex(t => t.status === 'current') + 1}` : 
                            'Not started'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SignatureTimeline;
