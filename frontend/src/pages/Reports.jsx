import { useState, useEffect } from 'react';
import { reportService } from '../services';
import { Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
    const [profitLoss, setProfitLoss] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchProfitLoss();
    }, [filters]);

    const fetchProfitLoss = async () => {
        setLoading(true);
        try {
            console.log('=== Fetching Profit/Loss Report ===');
            console.log('Filters:', filters);
            
            const response = await reportService.getProfitLoss(filters);
            
            console.log('Profit/Loss Response:', response);
            setProfitLoss(response.data);
            
            console.log('Report loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load report:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url
            });
            
            // Show more specific error message
            if (error.response?.status === 404) {
                toast.error('Reports API not found. Please check backend server.');
            } else if (error.response?.status === 500) {
                const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Server error occurred';
                toast.error('Failed to generate report: ' + errorMsg);
            } else {
                toast.error(error.response?.data?.message || 'Failed to load report');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async (type) => {
        try {
            const blob = await reportService.exportToExcel(type, filters.from_date, filters.to_date);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type}_${filters.from_date}_${filters.to_date}.xlsx`;
            link.click();
            toast.success('Excel exported successfully');
        } catch (error) {
            toast.error('Failed to export Excel');
        }
    };

    const handleExportPDF = async (type) => {
        try {
            const blob = await reportService.exportToPDF(type, filters.from_date, filters.to_date);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type}_report.pdf`;
            link.click();
            toast.success('PDF exported successfully');
        } catch (error) {
            toast.error('Failed to export PDF');
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600 mt-1">Financial reports and analytics</p>
            </div>

            {/* Date Filter */}
            <div className="card">
                <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">From Date</label>
                            <input
                                type="date"
                                value={filters.from_date}
                                onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="label">To Date</label>
                            <input
                                type="date"
                                value={filters.to_date}
                                onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Profit & Loss */}
            <div className="card">
                <h2 className="text-xl font-semibold mb-4">Profit & Loss Statement</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Total Income</p>
                                <p className="text-3xl font-bold text-green-700 mt-2">
                                    ৳{profitLoss?.total_income.toLocaleString() || 0}
                                </p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-red-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                                <p className="text-3xl font-bold text-red-700 mt-2">
                                    ৳{profitLoss?.total_expense.toLocaleString() || 0}
                                </p>
                            </div>
                            <TrendingDown className="h-12 w-12 text-red-500" />
                        </div>
                    </div>

                    <div className={`${profitLoss?.is_profit ? 'bg-blue-50' : 'bg-orange-50'} p-6 rounded-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${profitLoss?.is_profit ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {profitLoss?.is_profit ? 'Net Profit' : 'Net Loss'}
                                </p>
                                <p className={`text-3xl font-bold mt-2 ${profitLoss?.is_profit ? 'text-blue-700' : 'text-orange-700'}`}>
                                    ৳{Math.abs(profitLoss?.profit_loss || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className={`h-12 w-12 rounded-full ${profitLoss?.is_profit ? 'bg-blue-500' : 'bg-orange-500'} flex items-center justify-center`}>
                                <span className="text-white text-xl font-bold">{profitLoss?.is_profit ? 'P' : 'L'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="card">
                <h2 className="text-xl font-semibold mb-4">Export Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="font-medium">Expenses Report</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleExportExcel('expenses')} className="btn-primary flex items-center">
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </button>
                            <button onClick={() => handleExportPDF('expenses')} className="btn-secondary flex items-center">
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="font-medium">Vouchers Report</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleExportExcel('vouchers')} className="btn-primary flex items-center">
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </button>
                            <button onClick={() => handleExportPDF('vouchers')} className="btn-secondary flex items-center">
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
