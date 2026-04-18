import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vouchers from './pages/Vouchers';
import Expenses from './pages/Expenses';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import AdminPanel from './pages/AdminPanel';
import Projects from './pages/Projects';
import Purchases from './pages/Purchases';
import DailySheets from './pages/DailySheets';
import UnlimitIDManager from './pages/UnlimitIDManager';

// Layout
import Layout from './components/Layout';

// Protected Route Component with Role Check
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuthStore();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPanel />
                    </ProtectedRoute>
                } />
                <Route path="projects" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'engineer', 'site_manager', 'site_engineer', 'site_director', 'project_director', 'deputy_director', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office']}>
                        <Projects />
                    </ProtectedRoute>
                } />
                <Route path="purchases" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office']}>
                        <Purchases />
                    </ProtectedRoute>
                } />
                <Route path="employees" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Employees />
                    </ProtectedRoute>
                } />
                <Route path="vouchers" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'engineer', 'site_manager', 'site_engineer', 'site_director', 'project_director', 'deputy_director', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office', 'worker']}>
                        <Vouchers />
                    </ProtectedRoute>
                } />
                <Route path="expenses" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'engineer', 'site_manager', 'site_engineer', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office']}>
                        <Expenses />
                    </ProtectedRoute>
                } />
                <Route path="sheets" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'engineer', 'site_manager', 'site_engineer', 'site_director', 'project_director', 'deputy_director', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office']}>
                        <DailySheets />
                    </ProtectedRoute>
                } />
                <Route path="ledger" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office']}>
                        <Ledger />
                    </ProtectedRoute>
                } />
                <Route path="reports" element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'project_director', 'deputy_director', 'site_director', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office']}>
                        <Reports />
                    </ProtectedRoute>
                } />
                <Route path="admin/ids" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <UnlimitIDManager />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    );
}

export default App;
