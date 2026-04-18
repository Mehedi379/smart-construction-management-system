import { useState, useEffect, useRef } from 'react';
import { PenTool, CheckCircle, Clock, Download } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { workflowService } from '../services';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SignatureWorkflow = ({ sheetId }) => {
    const { user } = useAuthStore();
    const [signatureStatus, setSignatureStatus] = useState(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(null);
    const [comments, setComments] = useState('');
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const sigCanvas = useRef(null);

    useEffect(() => {
        loadSignatureStatus();
    }, [sheetId]);

    const loadSignatureStatus = async () => {
        try {
            const response = await workflowService.getSheetSignatureStatus(sheetId);
            setSignatureStatus(response.data);
        } catch (error) {
            console.error('Failed to load signature status:', error);
            // Don't show error toast, just set to no_workflow
            setSignatureStatus({ status: 'no_workflow' });
        }
    };

    const handleSign = (step) => {
        setCurrentStep(step);
        setShowSignModal(true);
        setComments('');
    };

    const saveSignature = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            toast.error('Please draw your signature');
            return;
        }

        try {
            const signatureData = sigCanvas.current.toDataURL();
            await workflowService.signSheet(sheetId, signatureData, comments);
            toast.success('Signature added successfully!');
            setShowSignModal(false);
            setCurrentStep(null);
            setComments('');
            loadSignatureStatus();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add signature');
        }
    };

    const handleGeneratePDF = async () => {
        try {
            setGeneratingPDF(true);
            const response = await workflowService.generateSheetPDF(sheetId);
            toast.success('PDF generated successfully!');
            
            // Open PDF in new tab
            if (response.data?.download_url) {
                window.open(response.data.download_url, '_blank');
            }
        } catch (error) {
            toast.error('Failed to generate PDF');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const clearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    if (!signatureStatus || signatureStatus.status === 'no_workflow') {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">No workflow found for this sheet</p>
            </div>
        );
    }

    const isFullyApproved = signatureStatus.workflow_status === 'completed';

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Signature Workflow</h3>
                        <p className="text-sm text-blue-100">
                            Status: <span className="font-semibold capitalize">{signatureStatus.workflow_status}</span>
                        </p>
                    </div>
                    {isFullyApproved && (
                        <button
                            onClick={handleGeneratePDF}
                            disabled={generatingPDF}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {generatingPDF ? 'Generating...' : 'Download PDF'}
                        </button>
                    )}
                </div>
            </div>

            {/* Signature Steps */}
            <div className="p-6">
                <div className="space-y-4">
                    {signatureStatus.signatures.map((sig, index) => {
                        const isCurrentStep = signatureStatus.current_step === sig.step_number;
                        const isSigned = sig.status === 'signed';
                        const isPending = !isSigned;

                        return (
                            <div
                                key={sig.step_number}
                                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                                    isSigned
                                        ? 'border-green-500 bg-green-50'
                                        : isCurrentStep
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0">
                                        {isSigned ? (
                                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                                <CheckCircle className="h-6 w-6 text-white" />
                                            </div>
                                        ) : isCurrentStep ? (
                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                                                <PenTool className="h-6 w-6 text-white" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <Clock className="h-6 w-6 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">
                                            Step {sig.step_number}: {sig.role_name}
                                        </p>
                                        {isSigned ? (
                                            <p className="text-sm text-green-700 mt-1">
                                                ✅ Signed by <strong>{sig.signer_name}</strong> on{' '}
                                                {new Date(sig.signed_at).toLocaleDateString('en-GB')}
                                            </p>
                                        ) : isCurrentStep ? (
                                            <p className="text-sm text-blue-700 mt-1 font-semibold">
                                                ⏳ Awaiting your signature
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Pending
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Button */}
                                {isPending && isCurrentStep && (
                                    <button
                                        onClick={() => handleSign(sig)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg"
                                    >
                                        <PenTool className="h-4 w-4" />
                                        SIGN
                                    </button>
                                )}

                                {isSigned && (
                                    <span className="text-green-600 font-bold text-lg">SIGNED ✓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Signature Modal */}
            {showSignModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold">
                                        Sign as {currentStep?.role_name}
                                    </h3>
                                    <p className="text-sm text-blue-100 mt-1">
                                        Step {currentStep?.step_number} of {signatureStatus.signatures.length}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSignModal(false)}
                                    className="text-white hover:text-gray-200 text-3xl font-light"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Draw Your Signature *
                                </label>
                                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        canvasProps={{
                                            className: 'w-full h-48'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={clearSignature}
                                    className="text-sm text-red-600 hover:text-red-800 mt-2 font-medium"
                                >
                                    Clear Signature
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Add any comments or notes..."
                                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                                    rows="3"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowSignModal(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveSignature}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Save Signature
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignatureWorkflow;
