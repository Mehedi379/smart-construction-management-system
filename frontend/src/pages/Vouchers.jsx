import { useState, useEffect } from 'react';
import { voucherService, employeeService, projectService } from '../services';
import { Plus, Edit, Trash2, Filter, User, FileText, DollarSign, Building2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Vouchers = () => {
    const { user } = useAuthStore();
    const [vouchers, setVouchers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [filters, setFilters] = useState({
        project_id: '',
        status: '',
        voucher_type: ''
    });
    const [formData, setFormData] = useState({
        voucher_type: 'expense',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        employee_id: '',
        project_id: '',
        paid_to: '',
        payment_method: 'cash',
        category: 'Food',
        description: ''
    });

    const expenseCategories = [
        'Food',
        'Transport',
        'Materials',
        'Equipment',
        'Medical',
        'Mobile/Communication',
        'Office Supplies',
        'Utilities',
        'Miscellaneous'
    ];

    useEffect(() => {
        fetchVouchers();
        fetchEmployees();
        fetchProjects();
    }, []);

    const fetchVouchers = async () => {
        try {
            const params = {};
            if (filters.project_id) params.project_id = filters.project_id;
            if (filters.status) params.status = filters.status;
            if (filters.voucher_type) params.voucher_type = filters.voucher_type;
            
            const response = await voucherService.getVouchers(params);
            setVouchers(response.data);
        } catch (error) {
            toast.error('Failed to load vouchers');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await projectService.getProjects();
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to load projects');
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await employeeService.getEmployees({ status: 'active' });
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to load employees');
        }
    };

    const handleEdit = (voucher) => {
        setEditingVoucher(voucher);
        setFormData({
            voucher_type: voucher.voucher_type || 'expense',
            date: voucher.date || new Date().toISOString().split('T')[0],
            amount: voucher.amount || '',
            employee_id: voucher.employee_id || '',
            project_id: voucher.project_id || '',
            paid_to: voucher.paid_to || '',
            payment_method: voucher.payment_method || 'cash',
            category: voucher.category || 'Food',
            description: voucher.description || ''
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Enforce project selection
        if (!formData.project_id) {
            toast.error('Please select a project for this voucher');
            return;
        }
        
        try {
            if (editingVoucher) {
                await voucherService.updateVoucher(editingVoucher.id, formData);
                toast.success('Voucher updated successfully');
            } else {
                await voucherService.createVoucher(formData);
                toast.success('Voucher created successfully');
            }
            setShowForm(false);
            setEditingVoucher(null);
            setFormData({
                voucher_type: 'expense',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                employee_id: '',
                project_id: '',
                paid_to: '',
                payment_method: 'cash',
                category: 'Food',
                description: ''
            });
            fetchVouchers();
        } catch (error) {
            toast.error(editingVoucher ? 'Failed to update voucher' : 'Failed to create voucher');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this voucher?')) return;
        try {
            await voucherService.deleteVoucher(id);
            toast.success('Voucher deleted successfully');
            fetchVouchers();
        } catch (error) {
            toast.error('Failed to delete voucher');
        }
    };

    const handleApprove = async (id) => {
        try {
            console.log('Approving voucher:', id);
            const response = await voucherService.updateVoucher(id, { status: 'approved' });
            console.log('Approval response:', response);
            toast.success('✅ Voucher approved! Daily sheet auto-created.');
            fetchVouchers();
        } catch (error) {
            console.error('Approval error:', error);
            console.error('Error response:', error.response);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to approve voucher';
            toast.error(errorMsg);
        }
    };

    const handleReject = async (id) => {
        try {
            await voucherService.updateVoucher(id, { status: 'rejected' });
            toast.error('❌ Voucher rejected');
            fetchVouchers();
        } catch (error) {
            toast.error('Failed to reject voucher');
        }
    };

    const resetForm = () => {
        setFormData({
            voucher_type: 'expense',
            date: new Date().toISOString().split('T')[0],
            amount: '',
            employee_id: '',
            project_id: '',
            paid_to: '',
            payment_method: 'cash',
            category: 'Food',
            description: ''
        });
        setEditingVoucher(null);
        setShowForm(false);
    };

    // Apply filters when filter values change
    useEffect(() => {
        if (!loading) {
            fetchVouchers();
        }
    }, [filters]);

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
                    <p className="text-gray-600 mt-1">Manage payment and expense vouchers</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    New Voucher
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="label text-sm">Project</label>
                        <select
                            value={filters.project_id}
                            onChange={(e) => setFilters({...filters, project_id: e.target.value})}
                            className="input-field text-sm"
                        >
                            <option value="">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.project_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label text-sm">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="input-field text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="label text-sm">Voucher Type</label>
                        <select
                            value={filters.voucher_type}
                            onChange={(e) => setFilters({...filters, voucher_type: e.target.value})}
                            className="input-field text-sm"
                        >
                            <option value="">All Types</option>
                            <option value="payment">Payment</option>
                            <option value="expense">Expense</option>
                            <option value="receipt">Receipt</option>
                        </select>
                    </div>
                </div>
                <div className="mt-3 flex gap-2">
                    <button 
                        onClick={fetchVouchers}
                        className="btn-primary text-sm px-4 py-2"
                    >
                        Apply Filters
                    </button>
                    <button 
                        onClick={() => {
                            setFilters({ project_id: '', status: '', voucher_type: '' });
                            fetchVouchers();
                        }}
                        className="btn-secondary text-sm px-4 py-2"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="card border-2 border-primary-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">
                            {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
                        </h2>
                        <div className="bg-orange-50 px-3 py-1 rounded text-sm text-orange-800">
                            ⚠️ Project selection is required
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Project *</label>
                                <select
                                    value={formData.project_id}
                                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select Project *</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.project_code} - {project.project_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Voucher Type</label>
                                <select
                                    value={formData.voucher_type}
                                    onChange={(e) => setFormData({...formData, voucher_type: e.target.value})}
                                    className="input-field"
                                    required
                                >
                                    <option value="payment">Payment</option>
                                    <option value="expense">Expense</option>
                                    <option value="receipt">Receipt</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Employee</label>
                                <select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    className="input-field"
                                >
                                    <option value="">Select Employee (Optional)</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Amount (৳)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="input-field"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Paid To</label>
                                <input
                                    type="text"
                                    value={formData.paid_to}
                                    onChange={(e) => setFormData({...formData, paid_to: e.target.value})}
                                    className="input-field"
                                    placeholder="Recipient name"
                                />
                            </div>
                            <div>
                                <label className="label">Payment Method</label>
                                <select
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                    className="input-field"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank</option>
                                    <option value="mobile_banking">Mobile Banking</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Expense Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="input-field"
                                rows="3"
                                placeholder="Enter description..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary">
                                {editingVoucher ? 'Update' : 'Create'} Voucher
                            </button>
                            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Voucher No</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Project</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Paid To</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.length > 0 ? vouchers.map((voucher) => (
                                <tr key={voucher.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium">{voucher.voucher_no}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {voucher.project_name ? (
                                            <span className="text-blue-600 font-medium">{voucher.project_name}</span>
                                        ) : (
                                            <span className="text-red-500 text-xs">No Project</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm capitalize">{voucher.voucher_type}</td>
                                    <td className="py-3 px-4 text-sm">{voucher.date}</td>
                                    <td className="py-3 px-4 text-sm font-semibold">৳{voucher.amount.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-sm">{voucher.paid_to || '-'}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            voucher.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            voucher.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {voucher.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <div className="flex gap-2">
                                            {voucher.status === 'pending' && (user?.role === 'admin' || user?.role === 'director' || user?.role === 'manager') && (
                                                <>
                                                    <button 
                                                        onClick={() => handleApprove(voucher.id)}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Approve voucher"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(voucher.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Reject voucher"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleEdit(voucher)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit voucher"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(voucher.id)} 
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete voucher"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-600">No vouchers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Vouchers;
