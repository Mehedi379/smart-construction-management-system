import { useState, useEffect } from 'react';
import { expenseService, projectService } from '../services';
import { Plus, Trash2, BarChart3, Filter, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [filters, setFilters] = useState({
        project_id: '',
        category: '',
        date_from: '',
        date_to: ''
    });
    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        project_id: '',
        category: '',
        subcategory: '',
        amount: '',
        paid_to: '',
        payment_method: 'cash',
        description: ''
    });

    const categories = ['Rickshaw Fare', 'Restaurant', 'Material Cost', 'Labor', 'Equipment', 'Transport', 'Other'];

    useEffect(() => {
        fetchExpenses();
        fetchSummary();
        fetchProjects();
    }, []);

    const fetchExpenses = async () => {
        try {
            const params = {};
            if (filters.project_id) params.project_id = filters.project_id;
            if (filters.category) params.category = filters.category;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            
            const response = await expenseService.getExpenses(params);
            setExpenses(response.data);
        } catch (error) {
            toast.error('Failed to load expenses');
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

    const fetchSummary = async () => {
        try {
            const response = await expenseService.getExpenseSummary();
            setSummary(response.data);
        } catch (error) {
            console.error('Failed to load summary');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await expenseService.createExpense(formData);
            toast.success('Expense added successfully');
            setShowForm(false);
            setFormData({
                expense_date: new Date().toISOString().split('T')[0],
                category: '',
                subcategory: '',
                amount: '',
                paid_to: '',
                payment_method: 'cash',
                description: ''
            });
            fetchExpenses();
            fetchSummary();
        } catch (error) {
            toast.error('Failed to add expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await expenseService.deleteExpense(id);
            toast.success('Expense deleted successfully');
            fetchExpenses();
            fetchSummary();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-600 mt-1">Track daily construction expenses</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSummary(!showSummary)} className="btn-secondary flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Summary
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center">
                        <Plus className="h-5 w-5 mr-2" />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                        <label className="label text-sm">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({...filters, category: e.target.value})}
                            className="input-field text-sm"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label text-sm">From Date</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                            className="input-field text-sm"
                        />
                    </div>
                    <div>
                        <label className="label text-sm">To Date</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                            className="input-field text-sm"
                        />
                    </div>
                </div>
                <div className="mt-3 flex gap-2">
                    <button 
                        onClick={fetchExpenses}
                        className="btn-primary text-sm px-4 py-2"
                    >
                        Apply Filters
                    </button>
                    <button 
                        onClick={() => {
                            setFilters({ project_id: '', category: '', date_from: '', date_to: '' });
                            fetchExpenses();
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
                        <h2 className="text-xl font-semibold">Add New Expense</h2>
                        <div className="bg-orange-50 px-3 py-1 rounded text-sm text-orange-800">
                            💡 Tip: Select project for better tracking
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="label">Project</label>
                                <select
                                    value={formData.project_id}
                                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                    className="input-field"
                                >
                                    <option value="">Select Project (Optional)</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.project_code} - {project.project_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="date"
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
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
                                    placeholder="Recipient"
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
                        </div>
                        <div>
                            <label className="label">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="input-field"
                                rows="3"
                                placeholder="Expense details..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary">Add Expense</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showSummary && summary.length > 0 && (
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Expense Summary by Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {summary.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">{item.category}</p>
                                <p className="text-2xl font-bold text-primary-600 mt-1">৳{parseFloat(item.total_amount).toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.count} transactions</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Project</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Paid To</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Method</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? expenses.map((expense) => (
                                <tr key={expense.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm">{expense.expense_date}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {expense.project_name ? (
                                            <span className="text-blue-600 font-medium">{expense.project_name}</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-medium">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm font-semibold">৳{expense.amount.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-sm">{expense.paid_to || '-'}</td>
                                    <td className="py-3 px-4 text-sm capitalize">{expense.payment_method}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{expense.description || '-'}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-600">No expenses found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
