import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    FileText, 
    Wallet, 
    BookOpen, 
    BarChart3,
    Users,
    LogOut,
    Menu,
    X,
    Shield,
    Building2,
    ShoppingCart,
    ClipboardList,
    Database
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import NotificationBell from './NotificationBell';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    // Role-based navigation - Clean & structured
    const getNavigation = () => {
        const role = user?.role;
        const designation = user?.designation;

        // Admin - System-wide control
        if (role === 'admin') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Admin Panel', href: '/admin', icon: Shield },
                { name: 'ID Manager', href: '/admin/ids', icon: Database },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Employees', href: '/employees', icon: Users },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
                { name: 'Ledger', href: '/ledger', icon: BookOpen },
                { name: 'Reports', href: '/reports', icon: BarChart3 },
            ];
        }

        // Accountant - Financial operations only
        if (role === 'accountant' || designation === 'Accountant') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
                { name: 'Ledger', href: '/ledger', icon: BookOpen },
                { name: 'Reports', href: '/reports', icon: BarChart3 },
            ];
        }

        // Head Office Accounts & Deputy Head Office - Full financial access (GLOBAL)
        if (role === 'head_office_accounts_1' || role === 'head_office_accounts_2' || role === 'deputy_head_office') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
                { name: 'Ledger', href: '/ledger', icon: BookOpen },
                { name: 'Reports', href: '/reports', icon: BarChart3 },
            ];
        }

        // Site Manager - Project operations
        if (role === 'site_manager' || designation === 'Site Manager') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
            ];
        }

        // Project Director / Deputy Director - Oversight
        if (role === 'project_director' || designation === 'Project Director' || 
            role === 'deputy_director' || designation === 'Deputy Director') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Reports', href: '/reports', icon: BarChart3 },
            ];
        }

        // Site Director - Full project oversight (NEW)
        if (role === 'site_director' || designation === 'Site Director') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Reports', href: '/reports', icon: BarChart3 },
            ];
        }

        // Site Engineer - Technical work (NEW)
        if (role === 'site_engineer' || designation === 'Site Engineer') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
            ];
        }

        // Site Engineer - Technical work
        if (role === 'engineer' || designation === 'Engineer' || designation === 'Site Engineer') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: Building2 },
                { name: 'Daily Sheets', href: '/sheets', icon: ClipboardList },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
            ];
        }

        // Supervisor - Expense entry
        if (designation === 'Supervisor') {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Expenses', href: '/expenses', icon: Wallet },
                { name: 'Vouchers', href: '/vouchers', icon: FileText },
            ];
        }

        // Worker - Personal data only
        return [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'My Vouchers', href: '/vouchers', icon: FileText },
        ];
    };

    const navigation = getNavigation();

    const handleLogout = async () => {
        try {
            console.log('Logging out...');
            await logout();
            console.log('Logout successful, navigating to login');
            navigate('/login');
        } catch (error) {
            console.error('Logout error in Layout:', error);
            // Force navigation to login even if logout fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Premium Design */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 sidebar transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex flex-col h-full">
                    {/* Logo Section - Premium Brand Design */}
                    <div className="px-5 py-4 shadow-lg" style={{background: 'linear-gradient(135deg, #5B7E3C 0%, #A2CB8B 50%, #5B7E3C 100%)'}}>
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 hover:shadow-xl hover:scale-105 transition-all duration-300" style={{borderColor: '#E8F5BD'}}>
                                <Building2 className="h-6 w-6" style={{color: '#5B7E3C'}} />
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h1 className="text-base font-bold text-white leading-tight tracking-tight drop-shadow-sm">
                                    Smart Construction
                                </h1>
                                <div className="w-10 h-0.5 rounded-full my-1.5" style={{backgroundColor: '#E8F5BD'}}></div>
                                <p className="text-xs font-semibold tracking-wide" style={{color: '#E8F5BD'}}>
                                    M/S Khaza Bilkis Rabbi
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSidebarOpen(false)} 
                            className="lg:hidden absolute top-3 right-3 text-white/90 hover:bg-white/20 p-1 rounded transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    
                    {/* User Info - Premium Badge Enhanced */}
                    {user && (
                        <div className="px-4 py-4 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className={`w-11 h-11 bg-gradient-to-br rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/10 ${
                                        user.role === 'admin' ? 'from-[#C44545] to-red-700' :
                                        user.role === 'accountant' ? 'from-[#5B7E3C] to-[#A2CB8B]' :
                                        user.role === 'engineer' ? 'from-[#5B7E3C] to-[#A2CB8B]' :
                                        user.role === 'site_manager' ? 'from-[#C44545] to-red-700' :
                                        user.role === 'project_director' ? 'from-[#C44545] to-red-700' :
                                        'from-[#A2CB8B] to-[#5B7E3C]'
                                    }`}>
                                        <span className="text-white font-bold text-base">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    {/* Status indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 shadow-sm" style={{backgroundColor: '#A2CB8B'}}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-white truncate leading-tight mb-1.5">{user.name}</p>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide shadow-sm ${
                                            user.role === 'admin' ? 'text-white' :
                                            user.role === 'accountant' ? 'text-white' :
                                            user.role === 'engineer' ? 'text-white' :
                                            user.role === 'site_manager' ? 'text-white' :
                                            user.role === 'project_director' ? 'text-white' :
                                            'text-white'
                                        }`} style={{
                                            background: user.role === 'admin' || user.role === 'site_manager' || user.role === 'project_director' 
                                                ? 'linear-gradient(90deg, #C44545 0%, #d45555 100%)'
                                                : 'linear-gradient(90deg, #5B7E3C 0%, #A2CB8B 100%)',
                                            boxShadow: user.role === 'admin' || user.role === 'site_manager' || user.role === 'project_director'
                                                ? '0 4px 6px rgba(196, 69, 69, 0.3)'
                                                : '0 4px 6px rgba(91, 126, 60, 0.3)'
                                        }}>
                                            {user.role.replace(/_/g, ' ')}
                                        </span>
                                        {user.designation && user.designation !== user.role && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border" style={{backgroundColor: 'rgba(51, 65, 85, 0.6)', color: '#E8F5BD', borderColor: '#4B5563'}}>
                                                {user.designation}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation - Premium Brand Colors */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                                        isActive
                                            ? 'text-white shadow-md' : 'text-slate-300 hover:text-white'
                                    }`}
                                    style={isActive ? {
                                        background: 'linear-gradient(90deg, #5B7E3C 0%, #A2CB8B 100%)',
                                        boxShadow: '0 4px 6px rgba(91, 126, 60, 0.3)'
                                    } : {}}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'rgba(162, 203, 139, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <item.icon className={`nav-icon ${
                                        isActive ? 'nav-icon-active' : ''
                                    }`} />
                                    <span className="font-medium">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{backgroundColor: '#E8F5BD'}}></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button - Brand Red */}
                    <div className="px-4 py-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-t border-slate-700">
                        <button 
                            onClick={handleLogout} 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border shadow-sm transition-all duration-300 group text-white font-semibold"
                            style={{
                                background: 'linear-gradient(90deg, rgba(196, 69, 69, 0.1) 0%, rgba(196, 69, 69, 0.15) 100%)',
                                borderColor: 'rgba(196, 69, 69, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, #C44545 0%, #d45555 100%)';
                                e.currentTarget.style.borderColor = '#C44545';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(196, 69, 69, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, rgba(196, 69, 69, 0.1) 0%, rgba(196, 69, 69, 0.15) 100%)';
                                e.currentTarget.style.borderColor = 'rgba(196, 69, 69, 0.3)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            }}
                        >
                            <LogOut className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
                            <span className="font-semibold">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
                {/* Top Bar */}
                <header className="bg-white shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-700">
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex-1"></div>
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="text-sm text-gray-600">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
