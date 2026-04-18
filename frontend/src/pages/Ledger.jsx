import { useState, useEffect } from 'react';
import { ledgerService } from '../services';
import { Plus, BookOpen, Trash2, Building2, Wallet, Users, FolderOpen, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const Ledger = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountFormData, setAccountFormData] = useState({
        account_code: '',
        account_name: '',
        account_type: 'cash',
        opening_balance: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await ledgerService.getAccounts();
            setAccounts(response.data);
        } catch (error) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const fetchLedger = async (accountId) => {
        try {
            const response = await ledgerService.getLedger(accountId);
            setSelectedAccount(response.data.account);
            setLedgerEntries(response.data.entries);
        } catch (error) {
            toast.error('Failed to load ledger');
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        try {
            await ledgerService.createAccount(accountFormData);
            toast.success('Account created successfully');
            setShowAccountForm(false);
            setAccountFormData({
                account_code: '',
                account_name: '',
                account_type: 'cash',
                opening_balance: ''
            });
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to create account');
        }
    };

    const handleDeleteAccount = async (id, accountName) => {
        if (!window.confirm(`Are you sure you want to delete account "${accountName}"? This action cannot be undone!`)) return;
        try {
            await ledgerService.deleteAccount(id);
            toast.success('Account deleted successfully');
            if (selectedAccount?.id === id) {
                setSelectedAccount(null);
                setLedgerEntries([]);
            }
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    const accountTypeIcons = {
        bank: Building2,
        cash: Wallet,
        employee: Users,
        client: Users,
        supplier: Users,
        project: FolderOpen,
        expense: TrendingDown,
        income: TrendingUp
    };

    const accountTypeColors = {
        bank: 'bg-blue-100 text-blue-900 border-blue-300',
        cash: 'bg-green-100 text-green-900 border-green-300',
        employee: 'bg-purple-100 text-purple-900 border-purple-300',
        client: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        supplier: 'bg-orange-100 text-orange-900 border-orange-300',
        project: 'bg-cyan-100 text-cyan-900 border-cyan-300',
        expense: 'bg-red-100 text-red-900 border-red-300',
        income: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    };

    const accountTypeLabels = {
        bank: 'Bank Account',
        cash: 'Cash Account',
        employee: 'Employee Ledger',
        client: 'Client Ledger',
        supplier: 'Supplier Ledger',
        project: 'Project Ledger',
        expense: 'Expense Account',
        income: 'Income Account'
    };

    const getAccountTypeInfo = (type) => {
        const Icon = accountTypeIcons[type] || CreditCard;
        const colorClass = accountTypeColors[type] || 'bg-gray-100 text-gray-900 border-gray-300';
        const label = accountTypeLabels[type] || type;
        return { Icon, colorClass, label };
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;

    // Group accounts by type
    const accountsByType = accounts.reduce((acc, account) => {
        const type = account.account_type || 'other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(account);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Ledger Book</h1>
                    <p className="text-gray-600 mt-1">Complete accounting ledger system</p>
                </div>
                <button onClick={() => setShowAccountForm(!showAccountForm)} className="btn-primary flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    New Account
                </button>
            </div>

            {showAccountForm && (
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Create New Ledger Account</h2>
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Account Code</label>
                                <input
                                    type="text"
                                    value={accountFormData.account_code}
                                    onChange={(e) => setAccountFormData({...accountFormData, account_code: e.target.value})}
                                    className="input-field"
                                    placeholder="ACC-001"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Account Name</label>
                                <input
                                    type="text"
                                    value={accountFormData.account_name}
                                    onChange={(e) => setAccountFormData({...accountFormData, account_name: e.target.value})}
                                    className="input-field"
                                    placeholder="Account name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Account Type</label>
                                <select
                                    value={accountFormData.account_type}
                                    onChange={(e) => setAccountFormData({...accountFormData, account_type: e.target.value})}
                                    className="input-field"
                                    required
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank</option>
                                    <option value="employee">Employee</option>
                                    <option value="client">Client</option>
                                    <option value="supplier">Supplier</option>
                                    <option value="project">Project</option>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Opening Balance (৳)</label>
                                <input
                                    type="number"
                                    value={accountFormData.opening_balance}
                                    onChange={(e) => setAccountFormData({...accountFormData, opening_balance: e.target.value})}
                                    className="input-field"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary">Create Account</button>
                            <button type="button" onClick={() => setShowAccountForm(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Accounts List */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Accounts</h2>
                    
                    {/* Account Type Summary */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.entries(accountsByType).map(([type, typeAccounts]) => {
                            const { Icon, colorClass, label } = getAccountTypeInfo(type);
                            const totalBalance = typeAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
                            return (
                                <div key={type} className={`p-3 rounded-lg border ${colorClass}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className="h-4 w-4" />
                                        <span className="text-xs font-semibold capitalize">{label}</span>
                                    </div>
                                    <p className="text-xs opacity-75">{typeAccounts.length} accounts</p>
                                    <p className="text-sm font-bold">৳{totalBalance.toLocaleString()}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {accounts.length > 0 ? accounts.map((account) => {
                            const { Icon, colorClass, label } = getAccountTypeInfo(account.account_type);
                            return (
                                <button
                                    key={account.id}
                                    onClick={() => fetchLedger(account.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-all relative ${
                                        selectedAccount?.id === account.id
                                            ? 'bg-primary-50 border-2 border-primary-500 shadow-sm'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${colorClass} mt-1`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{account.account_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500">{account.account_code}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
                                                    {label}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-primary-600">
                                            ৳{parseFloat(account.current_balance).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAccount(account.id, account.account_name);
                                        }}
                                        className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded opacity-0 hover:opacity-100 transition-opacity"
                                        title="Delete account"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </button>
                            );
                        }) : (
                            <p className="text-gray-600 text-center py-8">No accounts found</p>
                        )}
                    </div>
                </div>

                {/* Ledger Entries */}
                <div className="lg:col-span-2 card">
                    {selectedAccount ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        {(() => {
                                            const { Icon, colorClass, label } = getAccountTypeInfo(selectedAccount.account_type);
                                            return (
                                                <>
                                                    <div className={`p-2 rounded-lg ${colorClass}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-semibold">{selectedAccount.account_name}</h2>
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${colorClass}`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Account Code: <span className="font-mono text-xs">{selectedAccount.account_code}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Current Balance</p>
                                    <p className="text-2xl font-bold text-primary-600">৳{parseFloat(selectedAccount.current_balance).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Date</th>
                                            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Description</th>
                                            <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">Debit</th>
                                            <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">Credit</th>
                                            <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerEntries.length > 0 ? ledgerEntries.map((entry) => (
                                            <tr key={entry.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-2 text-sm">{entry.entry_date}</td>
                                                <td className="py-3 px-2 text-sm text-gray-600">{entry.description || '-'}</td>
                                                <td className="py-3 px-2 text-sm text-right text-red-600">
                                                    {entry.debit_amount > 0 ? `৳${parseFloat(entry.debit_amount).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="py-3 px-2 text-sm text-right text-green-600">
                                                    {entry.credit_amount > 0 ? `৳${parseFloat(entry.credit_amount).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="py-3 px-2 text-sm text-right font-semibold">
                                                    ৳{parseFloat(entry.running_balance || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-gray-600">No entries found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-96 text-gray-600">
                            <div className="text-center">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p>Select an account to view ledger</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Ledger;
