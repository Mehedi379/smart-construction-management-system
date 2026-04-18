import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Search, RefreshCw, AlertTriangle, CheckCircle, 
    XCircle, Database, Activity, FileText, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const UnlimitIDManager = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [detecting, setDetecting] = useState(false);
    const [fixing, setFixing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [idData, setIdData] = useState(null);
    const [report, setReport] = useState(null);
    const [healthScore, setHealthScore] = useState(null);
    const [fixAction, setFixAction] = useState('nullify');
    const [activeTab, setActiveTab] = useState('detect');

    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('Access denied. Admin only.');
            return;
        }
        loadInitialData();
    }, [user]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadHealthScore(),
                loadReport()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHealthScore = async () => {
        try {
            const response = await api.get('/admin/ids/health');
            if (response.data.success) {
                setHealthScore(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load health score:', error);
        }
    };

    const loadReport = async () => {
        try {
            const response = await api.get('/admin/ids/report');
            if (response.data.success) {
                setReport(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load report:', error);
        }
    };

    const handleDetectAllIDs = async () => {
        setDetecting(true);
        try {
            const response = await api.get('/admin/ids/detect');
            if (response.data.success) {
                setIdData(response.data);
                toast.success(`Detected ${response.data.summary.total_issues} ID issues`);
                await loadHealthScore();
                await loadReport();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to detect IDs');
        } finally {
            setDetecting(false);
        }
    };

    const handleAutoFix = async () => {
        if (!window.confirm(`This will auto-fix all ID issues using "${fixAction}" action. Continue?`)) {
            return;
        }

        setFixing(true);
        try {
            const response = await api.post('/admin/ids/auto-fix', { action: fixAction });
            if (response.data.success) {
                toast.success(`Fixed ${response.data.summary.fixed_count} issues`);
                await loadHealthScore();
                await loadReport();
                await handleDetectAllIDs();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to auto-fix IDs');
        } finally {
            setFixing(false);
        }
    };

    const handleSyncAutoIncrement = async () => {
        if (!window.confirm('This will sync all auto-increment IDs. Continue?')) {
            return;
        }

        setSyncing(true);
        try {
            const response = await api.post('/admin/ids/sync-auto-increment');
            if (response.data.success) {
                toast.success('Auto-increment IDs synced successfully');
                await loadHealthScore();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to sync auto-increment IDs');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    const tabs = [
        { id: 'detect', name: 'Detect IDs', icon: Search },
        { id: 'issues', name: 'Issues', icon: AlertTriangle },
        { id: 'report', name: 'Report', icon: FileText },
        { id: 'health', name: 'Health', icon: Activity },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                        Unlimited ID Detection & Auto-Update
                    </h1>
                    <p className="text-gray-600 mt-1">Structure-wise ID detection and automatic synchronization</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={loadInitialData}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Health Score Card */}
            {healthScore && (
                <div className={`border-2 rounded-lg p-6 ${
                    healthScore.status === 'EXCELLENT' ? 'border-green-500 bg-green-50' :
                    healthScore.status === 'GOOD' ? 'border-blue-500 bg-blue-50' :
                    healthScore.status === 'FAIR' ? 'border-yellow-500 bg-yellow-50' :
                    'border-red-500 bg-red-50'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Activity className={`h-12 w-12 ${
                                healthScore.status === 'EXCELLENT' ? 'text-green-600' :
                                healthScore.status === 'GOOD' ? 'text-blue-600' :
                                healthScore.status === 'FAIR' ? 'text-yellow-600' :
                                'text-red-600'
                            }`} />
                            <div>
                                <h3 className="text-2xl font-bold">Database Health: {healthScore.health_score}%</h3>
                                <p className="text-sm mt-1">Status: <strong>{healthScore.status}</strong></p>
                                <p className="text-xs mt-1">
                                    {healthScore.total_records} total records | {healthScore.total_issues} issues found
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-5xl font-bold ${
                                healthScore.status === 'EXCELLENT' ? 'text-green-600' :
                                healthScore.status === 'GOOD' ? 'text-blue-600' :
                                healthScore.status === 'FAIR' ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                                {healthScore.health_score}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={handleDetectAllIDs}
                        disabled={detecting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Search className="h-5 w-5" />
                        {detecting ? 'Detecting...' : 'Detect All IDs'}
                    </button>

                    <div className="flex gap-2">
                        <select
                            value={fixAction}
                            onChange={(e) => setFixAction(e.target.value)}
                            className="px-3 py-3 border rounded-lg"
                        >
                            <option value="nullify">Nullify</option>
                            <option value="reassign">Reassign</option>
                            <option value="delete">Delete</option>
                        </select>
                        <button
                            onClick={handleAutoFix}
                            disabled={fixing}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle className="h-5 w-5" />
                            {fixing ? 'Fixing...' : 'Auto-Fix All'}
                        </button>
                    </div>

                    <button
                        onClick={handleSyncAutoIncrement}
                        disabled={syncing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        <Database className="h-5 w-5" />
                        {syncing ? 'Syncing...' : 'Sync Auto-Increment'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Detect Tab */}
                    {activeTab === 'detect' && idData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-700">Users</p>
                                    <p className="text-2xl font-bold text-blue-800">{idData.summary.total_users}</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-700">Employees</p>
                                    <p className="text-2xl font-bold text-green-800">{idData.summary.total_employees}</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <p className="text-sm text-purple-700">Projects</p>
                                    <p className="text-2xl font-bold text-purple-800">{idData.summary.total_projects}</p>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p className="text-sm text-orange-700">Expenses</p>
                                    <p className="text-2xl font-bold text-orange-800">{idData.summary.total_expenses}</p>
                                </div>
                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                    <p className="text-sm text-pink-700">Vouchers</p>
                                    <p className="text-2xl font-bold text-pink-800">{idData.summary.total_vouchers}</p>
                                </div>
                            </div>

                            {idData.summary.total_issues > 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-700">Issues Found</p>
                                    <p className="text-2xl font-bold text-yellow-800">{idData.summary.total_issues}</p>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-700">✅ No Issues Found</p>
                                    <p className="text-xs text-green-600 mt-1">All IDs are properly linked</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Issues Tab */}
                    {activeTab === 'issues' && idData && (
                        <div className="space-y-4">
                            {idData.data.relationships.length === 0 ? (
                                <div className="text-center py-12 bg-green-50 rounded-lg">
                                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">No ID issues found!</p>
                                    <p className="text-sm text-gray-500 mt-1">All database relationships are healthy</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {idData.data.relationships.map((issue, idx) => (
                                        <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-semibold text-red-900">
                                                            {issue.table}.{issue.field}
                                                        </h4>
                                                        <p className="text-sm text-red-700 mt-1">{issue.issue}</p>
                                                        <p className="text-xs text-red-600 mt-1">
                                                            Record ID: {issue.id} | Invalid Value: {issue.value}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                                                    {issue.type}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Report Tab */}
                    {activeTab === 'report' && report && (
                        <div className="space-y-6">
                            <div className="border rounded-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">System Overview</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Users</p>
                                        <p className="text-xl font-bold">{report.summary.total_users}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Employees</p>
                                        <p className="text-xl font-bold">{report.summary.total_employees}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Projects</p>
                                        <p className="text-xl font-bold">{report.summary.total_projects}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Expenses</p>
                                        <p className="text-xl font-bold">{report.summary.total_expenses}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Vouchers</p>
                                        <p className="text-xl font-bold">{report.summary.total_vouchers}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Daily Sheets</p>
                                        <p className="text-xl font-bold">{report.summary.total_sheets}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Database Health</h4>
                                <div className="flex items-center gap-4">
                                    <div className={`text-4xl font-bold ${
                                        report.health_score >= 90 ? 'text-green-600' :
                                        report.health_score >= 70 ? 'text-blue-600' :
                                        report.health_score >= 50 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        {report.health_score}%
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Health Score</p>
                                        <p className="text-sm text-gray-700">
                                            {report.summary.total_issues} issues detected
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500">
                                Report generated: {new Date(report.timestamp).toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Health Tab */}
                    {activeTab === 'health' && healthScore && (
                        <div className="space-y-6">
                            <div className="text-center py-8">
                                <div className={`inline-block text-7xl font-bold mb-4 ${
                                    healthScore.status === 'EXCELLENT' ? 'text-green-600' :
                                    healthScore.status === 'GOOD' ? 'text-blue-600' :
                                    healthScore.status === 'FAIR' ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {healthScore.health_score}%
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Database Health: {healthScore.status}
                                </h3>
                                <p className="text-gray-600 mt-2">
                                    {healthScore.total_records} total records | {healthScore.total_issues} issues
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="font-semibold mb-4">Health Score Guide</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                                        <span><strong>90-100%:</strong> Excellent - Database is healthy</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                                        <span><strong>70-89%:</strong> Good - Minor issues detected</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                                        <span><strong>50-69%:</strong> Fair - Some issues need attention</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                                        <span><strong>0-49%:</strong> Poor - Critical issues found</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnlimitIDManager;
