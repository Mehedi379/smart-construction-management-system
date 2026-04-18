import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Shield, Users, CheckCircle, AlertTriangle, 
    XCircle, Database, RefreshCw, Globe, Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const RoleManager = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [roleData, setRoleData] = useState(null);
    const [healthReport, setHealthReport] = useState(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('Access denied. Admin only.');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadRoleVerification(),
                loadHealthReport()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load role data');
        } finally {
            setLoading(false);
        }
    };

    const loadRoleVerification = async () => {
        try {
            const response = await api.get('/admin/ids/role-verification');
            if (response.data.success) {
                setRoleData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load role verification:', error);
        }
    };

    const loadHealthReport = async () => {
        try {
            const response = await api.get('/admin/ids/health-report');
            if (response.data.success) {
                setHealthReport(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load health report:', error);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const response = await api.get('/admin/ids/auto-verify');
            if (response.data.success) {
                toast.success('Verification completed');
                await loadData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            'admin': 'bg-red-100 text-red-900 border-red-300',
            'project_director': 'bg-purple-100 text-purple-900 border-purple-300',
            'head_office_accounts_1': 'bg-blue-100 text-blue-900 border-blue-300',
            'head_office_accounts_2': 'bg-blue-100 text-blue-900 border-blue-300',
            'deputy_head_office': 'bg-indigo-100 text-indigo-900 border-indigo-300',
            'site_director': 'bg-purple-100 text-purple-900 border-purple-300',
            'deputy_director': 'bg-purple-100 text-purple-900 border-purple-300',
            'site_manager': 'bg-green-100 text-green-900 border-green-300',
            'accountant': 'bg-yellow-100 text-yellow-900 border-yellow-300',
            'site_engineer': 'bg-teal-100 text-teal-900 border-teal-300',
            'engineer': 'bg-teal-100 text-teal-900 border-teal-300',
            'employee': 'bg-gray-100 text-gray-800 border-gray-300'
        };
        return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getAccessIcon = (accessType) => {
        return accessType === 'GLOBAL' ? (
            <Globe className="w-4 h-4" />
        ) : (
            <Building className="w-4 h-4" />
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-blue-600" />
                                Role & ID Management
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage roles, verify ID assignments, and ensure proper project isolation
                            </p>
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={verifying}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={`w-5 h-5 ${verifying ? 'animate-spin' : ''}`} />
                            {verifying ? 'Verifying...' : 'Run Verification'}
                        </button>
                    </div>
                </div>

                {/* Health Score */}
                {healthReport && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Health Score</p>
                                    <p className={`text-3xl font-bold ${
                                        healthReport.summary.health_score >= 90 ? 'text-green-600' :
                                        healthReport.summary.health_score >= 70 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        {healthReport.summary.health_score}%
                                    </p>
                                </div>
                                <Database className="w-12 h-12 text-blue-600 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {healthReport.summary.total_users}
                                    </p>
                                </div>
                                <Users className="w-12 h-12 text-blue-600 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Projects</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {healthReport.summary.total_projects}
                                    </p>
                                </div>
                                <Building className="w-12 h-12 text-blue-600 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Roles Defined</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {roleData?.roles_defined || 0}
                                    </p>
                                </div>
                                <Shield className="w-12 h-12 text-blue-600 opacity-20" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Role Distribution */}
                {roleData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Users by Role */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                Users by Role
                            </h2>
                            <div className="space-y-3">
                                {roleData.roles.map(role => {
                                    const usersInRole = roleData.users.filter(u => u.role === role.role);
                                    return (
                                        <div key={role.role} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role.role)}`}>
                                                    {role.display_name}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {usersInRole.length} user{usersInRole.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">{role.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                {getAccessIcon(role.access_type)}
                                                <span>{role.access_type} ACCESS</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-6 h-6" />
                                All Users & Assignments
                            </h2>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {roleData.users.map(u => (
                                    <div key={u.user_id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{u.name}</p>
                                                <p className="text-sm text-gray-600">{u.email}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                                                {u.role.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                                            <div>
                                                <span className="text-gray-500">Status:</span>
                                                <span className="ml-2">
                                                    {u.is_approved ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600 inline" />
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Access:</span>
                                                <span className="ml-2 font-medium">{u.access_level}</span>
                                            </div>
                                            {u.assigned_project_id && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">Project:</span>
                                                    <span className="ml-2 font-medium">
                                                        {u.project_code} - {u.project_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Results */}
                {healthReport?.verification && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Verification Results</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-900">Passed</span>
                                </div>
                                <p className="text-2xl font-bold text-green-700 mt-2">
                                    {healthReport.verification.checks.filter(c => c.status === 'PASS').length}
                                </p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    <span className="font-semibold text-yellow-900">Warnings</span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-700 mt-2">
                                    {healthReport.verification.checks.filter(c => c.status === 'WARNING').length}
                                </p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold text-red-900">Errors</span>
                                </div>
                                <p className="text-2xl font-bold text-red-700 mt-2">
                                    {healthReport.verification.checks.filter(c => c.status === 'FAIL').length}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManager;
