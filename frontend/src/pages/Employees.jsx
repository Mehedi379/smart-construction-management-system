import { useState, useEffect } from 'react';
import { employeeService, expenseService } from '../services';
import { Users, Plus, Edit2, Trash2, DollarSign, TrendingUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Employees = () => {
    const { user } = useAuthStore();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const isAdmin = user?.role === 'admin';

    const [formData, setFormData] = useState({
        name: '',
        father_name: '',
        phone: '',
        email: '',
        nid: '',
        designation: 'Worker',
        category: 'Labor',
        department: 'General',
        daily_wage: 0,
        monthly_salary: 0,
        joining_date: new Date().toISOString().split('T')[0],
        address: ''
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await employeeService.getEmployees();
            setEmployees(response.data);
        } catch (error) {
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await employeeService.updateEmployee(editingEmployee.id, formData);
                toast.success('Employee updated successfully');
            } else {
                await employeeService.registerEmployee(formData);
                toast.success('Employee registered successfully');
            }
            fetchEmployees();
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save employee');
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            name: employee.name || '',
            father_name: employee.father_name || '',
            phone: employee.phone || '',
            email: employee.email || '',
            nid: employee.nid || '',
            designation: employee.designation || 'Worker',
            category: employee.category || 'Labor',
            department: employee.department || 'General',
            daily_wage: employee.daily_wage || 0,
            monthly_salary: employee.monthly_salary || 0,
            joining_date: employee.joining_date || new Date().toISOString().split('T')[0],
            address: employee.address || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
        try {
            await employeeService.deleteEmployee(id);
            toast.success('Employee deactivated');
            fetchEmployees();
        } catch (error) {
            toast.error('Failed to delete employee');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            father_name: '',
            phone: '',
            email: '',
            nid: '',
            designation: 'Worker',
            category: 'Labor',
            department: 'General',
            daily_wage: 0,
            monthly_salary: 0,
            joining_date: new Date().toISOString().split('T')[0],
            address: ''
        });
        setEditingEmployee(null);
        setShowForm(false);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)
    );

    // Calculate total dues (for now, show 0 as we need payment tracking logic)
    const totalExpense = 0; // Will be calculated when we add payment tracking

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
                    <p className="text-gray-600 mt-1">Manage your team members</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add Employee
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Employees</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{employees.length}</p>
                        </div>
                        <div className="bg-blue-500 p-3 rounded-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Employees</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                {employees.filter(e => e.status === 'active').length}
                            </p>
                        </div>
                        <div className="bg-green-500 p-3 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Dues</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                ৳{totalExpense.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-orange-500 p-3 rounded-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Form Modal */}
            {showForm && isAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">
                                {editingEmployee ? 'Edit Employee' : 'Register New Employee'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-2xl">
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Full name"
                                    />
                                </div>

                                <div>
                                    <label className="label">Father's Name</label>
                                    <input
                                        type="text"
                                        value={formData.father_name}
                                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                        className="input-field"
                                        placeholder="Father's name"
                                    />
                                </div>

                                <div>
                                    <label className="label">Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="017XXXXXXXX"
                                    />
                                </div>

                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="label">NID Number</label>
                                    <input
                                        type="text"
                                        value={formData.nid}
                                        onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                                        className="input-field"
                                        placeholder="NID number"
                                    />
                                </div>

                                <div>
                                    <label className="label">Designation</label>
                                    <select
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Worker">Worker</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Engineer">Engineer</option>
                                        <option value="Helper">Helper</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Labor">Labor</option>
                                        <option value="Skilled Worker">Skilled Worker</option>
                                        <option value="Technical">Technical</option>
                                        <option value="Administrative">Administrative</option>
                                        <option value="Management">Management</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="General">General</option>
                                        <option value="Construction">Construction</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Painting">Painting</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Daily Wage (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.daily_wage}
                                        onChange={(e) => setFormData({ ...formData, daily_wage: parseFloat(e.target.value) })}
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="label">Monthly Salary (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.monthly_salary}
                                        onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) })}
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="label">Joining Date</label>
                                    <input
                                        type="date"
                                        value={formData.joining_date}
                                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-field"
                                    rows="2"
                                    placeholder="Full address"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-primary flex-1">
                                    {editingEmployee ? 'Update' : 'Register'} Employee
                                </button>
                                <button type="button" onClick={resetForm} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="card">
                <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field flex-1 border-0"
                    />
                </div>
            </div>

            {/* Employees Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phone</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Designation</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Daily Wage</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                {isAdmin && (
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium">{employee.employee_id}</td>
                                    <td className="py-3 px-4 text-sm">{employee.name}</td>
                                    <td className="py-3 px-4 text-sm">{employee.phone}</td>
                                    <td className="py-3 px-4 text-sm">{employee.designation}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                            {employee.category}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">৳{employee.daily_wage || 0}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            employee.status === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="py-3 px-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(employee)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Employees;
