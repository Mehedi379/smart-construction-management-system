import { useState, useEffect } from 'react';
import api from '../services/api';
import { projectService } from '../services';
import { 
    Plus, Search, Filter, Eye, Edit, Trash2, Camera, Upload, 
    ShoppingCart, Store, DollarSign, Calendar, Image, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Purchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [viewPurchase, setViewPurchase] = useState(null);
    const [activeTab, setActiveTab] = useState('purchases');
    
    const [filters, setFilters] = useState({
        category: 'all',
        payment_status: 'all',
        project_id: '',
        from_date: '',
        to_date: ''
    });

    const [purchaseData, setPurchaseData] = useState({
        purchase_date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        project_id: '',
        category: 'Material',
        items: [{ item_name: '', quantity: 1, unit: 'piece', unit_price: 0, total_price: 0 }],
        discount: 0,
        paid_amount: 0,
        payment_method: 'cash',
        slip_image: null,
        notes: ''
    });

    const [supplierData, setSupplierData] = useState({
        shop_name: '',
        owner_name: '',
        phone: '',
        category: 'Hardware'
    });

    const categories = ['Material', 'Transport', 'Food', 'Labor', 'Equipment', 'Other'];
    const paymentMethods = ['cash', 'bkash', 'nagad', 'rocket', 'bank', 'cheque'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log('=== Loading Purchases Data ===');
            
            const [purchasesRes, suppliersRes, projectsRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/purchases/suppliers'),
                projectService.getProjects()
            ]);
            
            console.log('Purchases Response:', purchasesRes.data);
            console.log('Suppliers Response:', suppliersRes.data);
            console.log('Projects Response:', projectsRes);
            
            setPurchases(purchasesRes.data.data || []);
            setSuppliers(suppliersRes.data.data || []);
            setProjects(projectsRes.data || []);
            
            console.log('Data loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load purchase data:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url
            });
            
            // Show more specific error message
            if (error.response?.status === 404) {
                toast.error('Purchases API not found. Please check backend server.');
            } else if (error.response?.status === 500) {
                toast.error('Server error: ' + (error.response?.data?.message || 'Please try again'));
            } else {
                toast.error(error.response?.data?.message || 'Failed to load data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseChange = (e) => {
        setPurchaseData({ ...purchaseData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...purchaseData.items];
        newItems[index][field] = value;
        
        if (field === 'quantity' || field === 'unit_price') {
            newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
        }
        
        setPurchaseData({ ...purchaseData, items: newItems });
    };

    const addItem = () => {
        setPurchaseData({
            ...purchaseData,
            items: [...purchaseData.items, { item_name: '', quantity: 1, unit: 'piece', unit_price: 0, total_price: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = purchaseData.items.filter((_, i) => i !== index);
        setPurchaseData({ ...purchaseData, items: newItems });
    };

    const calculateSubtotal = () => {
        return purchaseData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() - (purchaseData.discount || 0);
    };

    const handleSubmitPurchase = async (e) => {
        e.preventDefault();
        try {
            const totalAmount = calculateTotal();
            const data = {
                ...purchaseData,
                subtotal: calculateSubtotal(),
                total_amount: totalAmount
            };

            await api.post('/purchases/purchases', data);
            toast.success('Purchase created successfully');
            setShowForm(false);
            resetPurchaseForm();
            loadData();
        } catch (error) {
            toast.error('Failed to create purchase');
        }
    };

    const handleSubmitSupplier = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchases/suppliers', supplierData);
            toast.success('Supplier added successfully');
            setShowSupplierForm(false);
            setSupplierData({ shop_name: '', owner_name: '', phone: '', category: 'Hardware' });
            loadData();
        } catch (error) {
            toast.error('Failed to add supplier');
        }
    };

    const handleDeletePurchase = async (id) => {
        if (!window.confirm('Are you sure you want to delete this purchase?')) return;
        try {
            await api.delete(`/purchases/purchases/${id}`);
            toast.success('Purchase deleted successfully');
            loadData();
        } catch (error) {
            toast.error('Failed to delete purchase');
        }
    };

    const handleEditPurchase = (purchase) => {
        toast.info('Edit purchase feature coming soon!');
        // TODO: Implement edit purchase functionality
    };

    const resetPurchaseForm = () => {
        setPurchaseData({
            purchase_date: new Date().toISOString().split('T')[0],
            supplier_id: '',
            project_id: '',
            category: 'Material',
            items: [{ item_name: '', quantity: 1, unit: 'piece', unit_price: 0, total_price: 0 }],
            discount: 0,
            paid_amount: 0,
            payment_method: 'cash',
            slip_image: null,
            notes: ''
        });
    };

    const filteredPurchases = purchases.filter(p => {
        if (filters.category !== 'all' && p.category !== filters.category) return false;
        if (filters.payment_status !== 'all' && p.payment_status !== filters.payment_status) return false;
        if (filters.project_id && p.project_id != filters.project_id) return false;
        return true;
    });

    const formatCurrency = (amount) => {
        return `৳${parseFloat(amount || 0).toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">🧾 External Purchases</h1>
                    <p className="text-gray-600 mt-1">Track all external purchases & payment slips</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSupplierForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Store className="h-5 w-5" />
                        Add Supplier
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        <Plus className="h-5 w-5" />
                        New Purchase
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow border">
                <div className="border-b px-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('purchases')}
                            className={`py-4 px-1 border-b-2 font-medium ${
                                activeTab === 'purchases'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500'
                            }`}
                        >
                            🛒 Purchases
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`py-4 px-1 border-b-2 font-medium ${
                                activeTab === 'suppliers'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500'
                            }`}
                        >
                            🏪 Suppliers
                        </button>
                    </nav>
                </div>

                {/* Purchases Tab */}
                {activeTab === 'purchases' && (
                    <div className="p-6">
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="px-3 py-2 border rounded-lg"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>

                            <select
                                value={filters.payment_status}
                                onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                                className="px-3 py-2 border rounded-lg"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="due">Due</option>
                            </select>

                            <select
                                value={filters.project_id}
                                onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
                                className="px-3 py-2 border rounded-lg"
                            >
                                <option value="">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                            </select>

                            <button
                                onClick={() => setFilters({ category: 'all', payment_status: 'all', project_id: '' })}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Reset Filters
                            </button>
                        </div>

                        {/* Purchases List */}
                        <div className="space-y-4">
                            {filteredPurchases.map((purchase) => (
                                <div key={purchase.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{purchase.purchase_no}</h3>
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {purchase.payment_status.toUpperCase()}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Date:</span>
                                                    <p className="font-medium">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                                                </div>
                                                {purchase.supplier_name && (
                                                    <div>
                                                        <span className="text-gray-600">Supplier:</span>
                                                        <p className="font-medium">{purchase.supplier_name}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-gray-600">Category:</span>
                                                    <p className="font-medium">{purchase.category}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Payment:</span>
                                                    <p className="font-medium capitalize">{purchase.payment_method}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right ml-4">
                                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(purchase.total_amount)}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Paid: {formatCurrency(purchase.paid_amount)}
                                                {purchase.due_amount > 0 && (
                                                    <span className="text-red-600 ml-2">
                                                        Due: {formatCurrency(purchase.due_amount)}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => setViewPurchase(purchase)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                    title="View details"
                                                >
                                                    View →
                                                </button>
                                                <button
                                                    onClick={() => handleEditPurchase(purchase)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Edit purchase"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePurchase(purchase.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete purchase"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suppliers Tab */}
                {activeTab === 'suppliers' && (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {suppliers.map((supplier) => (
                                <div key={supplier.id} className="border rounded-lg p-4 hover:shadow-md">
                                    <h3 className="font-semibold text-lg mb-2">{supplier.shop_name}</h3>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {supplier.owner_name && <p>Owner: {supplier.owner_name}</p>}
                                        {supplier.phone && <p>Phone: {supplier.phone}</p>}
                                        {supplier.category && <p>Category: {supplier.category}</p>}
                                    </div>
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total:</span>
                                            <span className="font-semibold">{formatCurrency(supplier.total_purchase)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Paid:</span>
                                            <span className="font-semibold text-green-600">{formatCurrency(supplier.total_paid)}</span>
                                        </div>
                                        {supplier.due_amount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Due:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(supplier.due_amount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* New Purchase Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-4xl w-full my-8">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">🛒 New Purchase Entry</h2>
                            <button onClick={() => { setShowForm(false); resetPurchaseForm(); }}>
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitPurchase} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                                    <input
                                        type="date"
                                        name="purchase_date"
                                        value={purchaseData.purchase_date}
                                        onChange={handlePurchaseChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category *</label>
                                    <select
                                        name="category"
                                        value={purchaseData.category}
                                        onChange={handlePurchaseChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Supplier</label>
                                    <select
                                        name="supplier_id"
                                        value={purchaseData.supplier_id}
                                        onChange={handlePurchaseChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Project</label>
                                    <select
                                        name="project_id"
                                        value={purchaseData.project_id}
                                        onChange={handlePurchaseChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium">Items *</label>
                                    <button type="button" onClick={addItem} className="text-primary-600 hover:underline text-sm">
                                        + Add Item
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {purchaseData.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                                            <div className="col-span-4">
                                                <input
                                                    type="text"
                                                    placeholder="Item name"
                                                    value={item.item_name}
                                                    onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                    required
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                >
                                                    <option value="piece">Piece</option>
                                                    <option value="kg">KG</option>
                                                    <option value="bag">Bag</option>
                                                    <option value="liter">Liter</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                <span className="font-semibold">{formatCurrency(item.total_price)}</span>
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                {purchaseData.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(index)} className="text-red-600">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Discount (৳)</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        value={purchaseData.discount}
                                        onChange={handlePurchaseChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Paid Amount (৳)</label>
                                    <input
                                        type="number"
                                        name="paid_amount"
                                        value={purchaseData.paid_amount}
                                        onChange={handlePurchaseChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Method</label>
                                <select
                                    name="payment_method"
                                    value={purchaseData.payment_method}
                                    onChange={handlePurchaseChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    {paymentMethods.map(method => <option key={method} value={method}>{method.toUpperCase()}</option>)}
                                </select>
                            </div>

                            {/* Total */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount:</span>
                                    <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                    Create Purchase
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); resetPurchaseForm(); }} className="px-4 py-2 bg-gray-200 rounded-lg">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Supplier Modal */}
            {showSupplierForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">🏪 Add New Supplier</h2>
                            <button onClick={() => setShowSupplierForm(false)}>
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitSupplier} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Shop Name *</label>
                                <input
                                    type="text"
                                    value={supplierData.shop_name}
                                    onChange={(e) => setSupplierData({ ...supplierData, shop_name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g. Rahim Hardware Store"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Owner Name</label>
                                <input
                                    type="text"
                                    value={supplierData.owner_name}
                                    onChange={(e) => setSupplierData({ ...supplierData, owner_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g. Rahim Uddin"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={supplierData.phone}
                                    onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="017XXXXXXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={supplierData.category}
                                    onChange={(e) => setSupplierData({ ...supplierData, category: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="Hardware">Hardware</option>
                                    <option value="Construction Material">Construction Material</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Food">Food</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    Add Supplier
                                </button>
                                <button type="button" onClick={() => setShowSupplierForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
