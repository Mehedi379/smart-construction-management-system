import { useState, useEffect } from 'react';
import useDashboardStore from '../store/dashboardStore';
import { TrendingUp, DollarSign, FileText, AlertCircle, Users, Building2, RefreshCw, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
    const { user } = useAuthStore();
    const { 
        stats, 
        projects, 
        pendingVouchers, 
        recentTransactions,
        loading, 
        fetchDashboardData 
    } = useDashboardStore();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = async () => {
        try {
            await fetchDashboardData(true);
            toast.success('Dashboard refreshed');
        } catch (error) {
            toast.error('Failed to refresh dashboard');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show empty state if stats is null
    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Unable to load dashboard data</p>
                    <button 
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="inline h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    // Role-based stat cards
    const getStatCards = () => {
        const role = user?.role;

        // Admin - System overview
        if (role === 'admin') {
            return [
                {
                    title: 'Total Projects',
                    value: stats?.total_projects || projects?.length || 0,
                    icon: Building2,
                    color: 'from-purple-500 to-purple-600',
                    isNumber: true
                },
                {
                    title: 'Total Accounts',
                    value: (stats?.role_breakdown?.find(r => r.role === 'accountant')?.count || 0) +
                           (stats?.role_breakdown?.find(r => r.role === 'accounts')?.count || 0),
                    icon: Users,
                    color: 'from-yellow-500 to-yellow-600',
                    isNumber: true
                },
                {
                    title: 'Total Engineering',
                    value: (stats?.role_breakdown?.find(r => r.role === 'engineer')?.count || 0) +
                           (stats?.role_breakdown?.find(r => r.role === 'site_engineer')?.count || 0),
                    icon: Users,
                    color: 'from-blue-500 to-blue-600',
                    isNumber: true
                },
                {
                    title: 'Total Manager',
                    value: (stats?.role_breakdown?.find(r => r.role === 'site_manager')?.count || 0) +
                           (stats?.role_breakdown?.find(r => r.role === 'manager')?.count || 0),
                    icon: Users,
                    color: 'from-indigo-500 to-indigo-600',
                    isNumber: true
                },
                {
                    title: 'Total Project Director',
                    value: (stats?.role_breakdown?.find(r => r.role === 'site_director')?.count || 0) +
                           (stats?.role_breakdown?.find(r => r.role === 'director')?.count || 0) +
                           (stats?.role_breakdown?.find(r => r.role === 'project_director')?.count || 0),
                    icon: Users,
                    color: 'from-red-500 to-red-600',
                    isNumber: true
                },
                {
                    title: 'Total Deputy Director',
                    value: (stats?.role_breakdown?.find(r => r.role === 'deputy_director')?.count || 0) +
                           (stats?.role_breakdown?.find(r => r.role === 'deputy_head_office')?.count || 0),
                    icon: Users,
                    color: 'from-purple-500 to-purple-600',
                    isNumber: true
                },
                {
                    title: 'Total Employee',
                    value: stats?.role_breakdown?.find(r => r.role === 'employee')?.count || 0,
                    icon: Users,
                    color: 'from-gray-500 to-gray-600',
                    isNumber: true
                },
                {
                    title: 'Total Viewer',
                    value: stats?.role_breakdown?.find(r => r.role === 'viewer')?.count || 0,
                    icon: Users,
                    color: 'from-teal-500 to-teal-600',
                    isNumber: true
                }
            ];
        }

        // Accountant - Financial focus
        if (role === 'accountant') {
            return [
                {
                    title: 'Total Income',
                    value: stats?.monthly_income || 0,
                    icon: TrendingUp,
                    color: 'from-emerald-500 to-emerald-600'
                },
                {
                    title: 'Total Expenses',
                    value: stats?.total_expenses || 0,
                    icon: DollarSign,
                    color: 'from-red-500 to-red-600'
                },
                {
                    title: 'Net Profit',
                    value: stats?.monthly_profit || 0,
                    icon: TrendingUp,
                    color: 'from-blue-500 to-blue-600'
                },
                {
                    title: 'Pending Vouchers',
                    value: stats?.pending_vouchers || 0,
                    icon: FileText,
                    color: 'from-orange-500 to-orange-600',
                    isNumber: true
                },
            ];
        }

        // Engineer/Manager - Project focus
        if (role === 'engineer' || role === 'site_engineer' || role === 'site_manager') {
            return [
                {
                    title: 'My Projects',
                    value: projects.length || 0,
                    icon: Building2,
                    color: 'from-purple-500 to-purple-600',
                    isNumber: true
                },
                {
                    title: 'My Vouchers',
                    value: stats?.my_vouchers || 0,
                    icon: FileText,
                    color: 'from-blue-500 to-blue-600',
                    isNumber: true
                },
                {
                    title: 'Pending Approval',
                    value: stats?.my_pending || 0,
                    icon: AlertCircle,
                    color: 'from-orange-500 to-orange-600',
                    isNumber: true
                },
                {
                    title: 'Today\'s Expenses',
                    value: stats?.today_expenses || 0,
                    icon: DollarSign,
                    color: 'from-red-500 to-red-600'
                },
            ];
        }

        // Worker - Personal view
        return [
            {
                title: 'My Vouchers',
                value: stats?.my_vouchers || 0,
                icon: FileText,
                color: 'from-blue-500 to-blue-600',
                isNumber: true
            },
            {
                title: 'Pending Approval',
                value: stats?.my_pending || 0,
                icon: AlertCircle,
                color: 'from-orange-500 to-orange-600',
                isNumber: true
            },
        ];
    };

    const statCards = getStatCards();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1 font-medium">
                        {user?.role === 'admin' && 'System overview and control center'}
                        {user?.role === 'accountant' && 'Financial management dashboard'}
                        {(user?.role === 'engineer' || user?.role === 'site_manager') && 'Project operations dashboard'}
                        {user?.role === 'worker' && 'Personal dashboard'}
                        {!['admin', 'accountant', 'engineer', 'site_manager', 'worker'].includes(user?.role) && 'Welcome to your dashboard'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Refresh dashboard data"
                    >
                        <RefreshCw className="h-5 w-5" />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Welcome back,</p>
                        <p className="text-lg font-bold text-gray-900">{user?.name}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                                <p className={`text-3xl font-bold mt-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                    {stat.prefix ? `${stat.prefix}${stat.value.toLocaleString()}` : stat.isNumber ? stat.value : `৳${stat.value.toLocaleString()}`}
                                </p>
                            </div>
                            <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl shadow-lg transition-shadow duration-300 group-hover:shadow-xl`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center text-sm text-gray-500">
                                <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                                <span>Updated just now</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions - Role-based */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {user?.role === 'admin' && (
                        <>
                            <a href="/admin" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center">
                                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                            </a>
                            <a href="/projects" className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center">
                                <Building2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                <p className="text-sm font-medium text-gray-900">View Projects</p>
                            </a>
                            <a href="/vouchers" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-gray-900">Approve Vouchers</p>
                            </a>
                            <a href="/reports" className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-center">
                                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                <p className="text-sm font-medium text-gray-900">View Reports</p>
                            </a>
                        </>
                    )}
                    {user?.role === 'accountant' && (
                        <>
                            <a href="/vouchers" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-gray-900">Create Voucher</p>
                            </a>
                            <a href="/expenses" className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-center">
                                <DollarSign className="h-8 w-8 mx-auto mb-2 text-red-600" />
                                <p className="text-sm font-medium text-gray-900">Add Expense</p>
                            </a>
                            <a href="/ledger" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center">
                                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-medium text-gray-900">View Ledger</p>
                            </a>
                            <a href="/reports" className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-center">
                                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                <p className="text-sm font-medium text-gray-900">Financial Reports</p>
                            </a>
                        </>
                    )}
                    {(user?.role === 'engineer' || user?.role === 'site_manager') && (
                        <>
                            <a href="/sheets" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-medium text-gray-900">Create Sheet</p>
                            </a>
                            <a href="/vouchers" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-medium text-gray-900">Submit Voucher</p>
                            </a>
                            <a href="/expenses" className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-center">
                                <DollarSign className="h-8 w-8 mx-auto mb-2 text-red-600" />
                                <p className="text-sm font-medium text-gray-900">Add Expense</p>
                            </a>
                            <a href="/projects" className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center">
                                <Building2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                <p className="text-sm font-medium text-gray-900">View Projects</p>
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Pending Approvals - For Admin/Managers */}
            {(user?.role === 'admin' || user?.role === 'accountant') && pendingVouchers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center text-orange-600">
                                <AlertCircle className="h-5 w-5 mr-1" />
                                <span className="font-semibold">{pendingVouchers.length}</span>
                            </div>
                            <a href="/vouchers" className="text-sm text-blue-600 hover:underline">
                                View All →
                            </a>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        You have {pendingVouchers.length} voucher(s) waiting for approval. 
                        Go to Vouchers page to review and approve.
                    </p>
                </div>
            )}

            {/* Recent Activity */}
            {recentTransactions.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentTransactions.slice(0, 5).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        transaction.transaction_type === 'income' ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {transaction.description || transaction.transaction_type}
                                        </p>
                                        <p className="text-xs text-gray-500">{transaction.transaction_date}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-semibold ${
                                    transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    ৳{transaction.amount.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
