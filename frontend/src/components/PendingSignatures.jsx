import { useState, useEffect } from 'react';
import { workflowService } from '../services';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingSignatures = ({ onSelectSheet, onSignatureComplete }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const response = await workflowService.getMyPendingSignatures();
      setPending(response.data || []);
    } catch (error) {
      console.error('Failed to load pending signatures:', error);
      toast.error('Failed to load pending signatures');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
        <p className="text-gray-500">No pending signatures</p>
        <p className="text-sm text-gray-400 mt-1">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map(sheet => (
        <div 
          key={sheet.sheet_id} 
          className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
          onClick={() => {
            onSelectSheet(sheet);
            // Pass the onSignatureComplete callback to the sheet view
            if (onSignatureComplete) {
              console.log('✅ onSignatureComplete callback registered');
            }
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900">{sheet.sheet_no}</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">{sheet.project_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-orange-500" />
                <p className="text-xs text-gray-500">
                  Step {sheet.step_number}: {sheet.required_role}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">৳{sheet.total_amount?.toLocaleString()}</p>
              <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Awaiting your signature
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingSignatures;
