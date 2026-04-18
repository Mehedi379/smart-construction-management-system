import { useState, useEffect } from 'react';
import { authService } from '../services';
import { 
    Users, UserCheck, UserX, Settings, Shield, 
    RefreshCw, AlertTriangle, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import UnlimitIDManager from './UnlimitIDManager';
import RoleManager from './RoleManager';

const AdminPanel = () => {
    const { user } = useAuthStore();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [projectStats, setProjectStats] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('approvals');

    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('Access denied. Admin only.');
            return;
        }
        fetchData();
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchData = async () => {
        try {
            const [pendingRes, allUsersRes] = await Promise.all([
                authService.getPendingApprovals(),
                authService.getAllUserStats()
            ]);

            if (pendingRes?.data) {
                setPendingUsers(pendingRes.data || []);
            }
            
            if (allUsersRes?.success) {
                // The API returns stats object with users array
                const statsData = allUsersRes.data;
                setAllUsers({
                    approved: statsData.approved || { total: 0, by_role: [] },
                    pending: statsData.pending || { total: 0, by_role: [] },
                    users: statsData.users || []
                });
                setProjectStats(statsData.projects || []);
            }

            // Generate notifications
            const notifs = [];
            if (pendingRes?.data && pendingRes.data.length > 0) {
                notifs.push({
                    type: 'warning',
                    message: `${pendingRes.data.length} user registration(s) pending approval`,
                    icon: '👤'
                });
            }
            setNotifications(notifs);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            if (error.response) {
                toast.error(error.response?.data?.message || 'Failed to load admin data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUserApprove = async (userId, userName, userRole) => {
        if (!window.confirm(`Approve user "${userName}" as ${userRole}?`)) return;
        try {
            await authService.approveUser(userId, userRole);
            toast.success(`User "${userName}" approved successfully!`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleUserReject = async (userId, userName) => {
        if (!window.confirm(`Reject and delete user "${userName}"? This action cannot be undone.`)) return;
        try {
            await authService.rejectUser(userId);
            toast.success(`User "${userName}" rejected and deleted`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject user');
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await fetchData();
            toast.success('Data refreshed');
        } catch (error) {
            toast.error('Failed to refresh');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;

    const tabs = [
        { id: 'approvals', name: 'User Approvals', icon: UserCheck },
        { id: 'users', name: 'All Users', icon: Users },
        { id: 'roles', name: 'Role Manager', icon: Shield },
        { id: 'ids', name: 'ID Verification', icon: Database },
        { id: 'settings', name: 'System Settings', icon: Settings },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        Admin Control Panel
                    </h1>
                    <p className="text-gray-600 mt-1">User management and system settings</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                            <h3 className="font-semibold text-yellow-900">System Alerts</h3>
                            <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                                {notifications.map((notif, idx) => (
                                    <li key={idx}>{notif.icon} {notif.message}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

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
                                        ? 'border-blue-500 text-blue-600'
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
                    {/* User Approvals Tab */}
                    {activeTab === 'approvals' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Pending User Approvals</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {pendingUsers.length} user(s) waiting for approval
                                    </p>
                                </div>
                            </div>

                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">No pending approvals</p>
                                    <p className="text-sm text-gray-500 mt-1">All user registrations have been processed</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pendingUsers.map((pendingUser) => (
                                        <div key={pendingUser.id} className="border-2 border-yellow-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-yellow-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{pendingUser.name}</h4>
                                                    <p className="text-sm text-gray-600">{pendingUser.email}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Requested: {pendingUser.requested_role || pendingUser.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUserApprove(pendingUser.id, pendingUser.name, pendingUser.requested_role || pendingUser.role)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleUserReject(pendingUser.id, pendingUser.name)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">All Registered Users</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {allUsers.approved?.total || 0} approved, {allUsers.pending?.total || 0} pending
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-900 mb-3">Approved Users by Role</h4>
                                    <div className="space-y-2">
                                        {allUsers.approved?.by_role?.map((stat) => (
                                            <div key={stat.role} className="flex justify-between items-center text-sm">
                                                <span className="text-green-900 capitalize">{stat.role.replace(/_/g, ' ')}</span>
                                                <span className="font-semibold text-green-900">{stat.count}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-green-300 pt-2 mt-2">
                                            <div className="flex justify-between items-center font-semibold">
                                                <span className="text-green-900">Total</span>
                                                <span className="text-green-900">{allUsers.approved?.total || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-3">Pending Users by Role</h4>
                                    <div className="space-y-2">
                                        {allUsers.pending?.by_role?.map((stat) => (
                                            <div key={stat.role} className="flex justify-between items-center text-sm">
                                                <span className="text-yellow-900 capitalize">{stat.role?.replace(/_/g, ' ') || 'N/A'}</span>
                                                <span className="font-semibold text-yellow-900">{stat.count}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-yellow-300 pt-2 mt-2">
                                            <div className="flex justify-between items-center font-semibold">
                                                <span className="text-yellow-900">Total</span>
                                                <span className="text-yellow-900">{allUsers.pending?.total || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Project-wise Statistics */}
                            {projectStats && projectStats.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        📊 Project-wise User Statistics
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {projectStats.map((project) => (
                                            <div key={project.project_id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 hover:shadow-lg transition-shadow">
                                                <div className="mb-3">
                                                    <h5 className="font-bold text-blue-900">{project.project_code}</h5>
                                                    <p className="text-sm text-blue-900">{project.project_name}</p>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-blue-700">Total Users:</span>
                                                        <span className="font-bold text-blue-900 text-lg">{project.total_users || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-green-700">Approved:</span>
                                                        <span className="font-semibold text-green-900">{project.approved_users || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-yellow-700">Pending:</span>
                                                        <span className="font-semibold text-yellow-900">{project.pending_users || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* User List */}
                            {allUsers.users && allUsers.users.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">All Users</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allUsers.users.map((u) => (
                                            <div key={u.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900">{u.name}</h4>
                                                        <p className="text-sm text-gray-600">{u.email}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        u.is_approved 
                                                            ? 'bg-green-100 text-green-900'
                                                            : 'bg-yellow-100 text-yellow-900'
                                                    }`}>
                                                        {u.is_approved ? 'Approved' : 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p><span className="font-medium">Role:</span> {u.role?.replace(/_/g, ' ')}</p>
                                                    {u.employee_id && <p><span className="font-medium">Employee ID:</span> {u.employee_id}</p>}
                                                    {u.project_code && (
                                                        <p><span className="font-medium">Project:</span> {u.project_code} - {u.project_name}</p>
                                                    )}
                                                    <p><span className="font-medium">Joined:</span> {new Date(u.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Role Manager Tab */}
                    {activeTab === 'roles' && <RoleManager />}

                    {/* ID Verification Tab */}
                    {activeTab === 'ids' && <UnlimitIDManager />}

                    {/* System Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
                                <p className="text-sm text-gray-600 mt-1">Configure system preferences</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border rounded-lg p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">System Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium">System:</span> Smart Construction Management</p>
                                        <p><span className="font-medium">Version:</span> 2.0.0</p>
                                        <p><span className="font-medium">Database:</span> MySQL</p>
                                        <p><span className="font-medium">Backend:</span> Node.js + Express</p>
                                        <p><span className="font-medium">Frontend:</span> React + Vite</p>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleRefresh}
                                            className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
                                        >
                                            Refresh Data
                                        </button>
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

export default AdminPanel;
