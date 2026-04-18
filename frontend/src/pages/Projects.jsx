import { useState, useEffect } from 'react';
import { projectService, dailySheetService } from '../services';
import useAuthStore from '../store/authStore';
import { 
    Plus, Eye, Edit, Trash2, Search, Filter, 
    Building2, MapPin, Calendar, DollarSign,
    Users, TrendingUp, TrendingDown, X, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const Projects = () => {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectSheets, setProjectSheets] = useState([]);
    const [sheetsLoading, setSheetsLoading] = useState(false);
    const [categoryStats, setCategoryStats] = useState({});
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Check if user is admin (only admin can create/edit/delete projects)
    const isAdmin = user?.role === 'admin';

    const [formData, setFormData] = useState({
        project_code: 'PRJ001',
        project_name: '',
        client_name: '',
        location: '',
        start_date: '',
        end_date: '',
        estimated_budget: '',
        description: '',
        status: 'planning'
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await projectService.getProjects();
            if (response.success) {
                setProjects(response.data);
            }
        } catch (error) {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Double-check: Only admin can create/update projects
        if (!isAdmin) {
            toast.error('You do not have permission to create or edit projects');
            return;
        }
        
        try {
            if (editingProject) {
                await projectService.updateProject(editingProject.id, formData);
                toast.success('Project updated successfully');
            } else {
                await projectService.createProject(formData);
                toast.success('Project created successfully');
            }
            setShowModal(false);
            resetForm();
            loadProjects();
        } catch (error) {
            toast.error(editingProject ? 'Failed to update project' : 'Failed to create project');
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            project_code: project.project_code || '',
            project_name: project.project_name || '',
            client_name: project.client_name || '',
            location: project.location || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            estimated_budget: project.estimated_budget || '',
            description: project.description || '',
            status: project.status || 'planning'
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await projectService.deleteProject(id);
            toast.success('Project deleted successfully');
            loadProjects();
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const handleViewDetails = async (project) => {
        try {
            const response = await projectService.getProjectById(project.id);
            if (response.success) {
                setSelectedProject(response.data);
                
                // Load sheets for this project
                setSheetsLoading(true);
                try {
                    const sheetsResponse = await dailySheetService.getSheets({ project_id: project.id });
                    setProjectSheets(sheetsResponse.data || []);
                } catch (error) {
                    console.error('Failed to load sheets:', error);
                    setProjectSheets([]);
                } finally {
                    setSheetsLoading(false);
                }
                
                // Load category-wise employee stats
                try {
                    console.log('🔵 Loading category stats for project:', project.id);
                    const statsResponse = await projectService.getProjectCategoryStats(project.id);
                    console.log('📊 Category Stats Response:', statsResponse);
                    console.log('📊 Category Stats Data:', statsResponse.data);
                    setCategoryStats(statsResponse.data || {});
                } catch (error) {
                    console.error('❌ Failed to load category stats:', error);
                    setCategoryStats({});
                }
                
                setShowDetails(true);
            }
        } catch (error) {
            toast.error('Failed to load project details');
        }
    };

    const resetForm = () => {
        // Auto-generate project code
        const nextCode = generateProjectCode();
        setFormData({
            project_code: nextCode,
            project_name: '',
            client_name: '',
            location: '',
            start_date: '',
            end_date: '',
            estimated_budget: '',
            description: '',
            status: 'planning'
        });
        setEditingProject(null);
    };

    const generateProjectCode = () => {
        // Generate code like PRJ001, PRJ002, etc.
        // Find the highest existing project number and add 1
        let maxNumber = 0;
        
        projects.forEach(project => {
            if (project.project_code) {
                // Extract number from codes like PRJ001, PRJ002, etc.
                const match = project.project_code.match(/PRJ(\d+)/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        });
        
        const nextNumber = maxNumber + 1;
        return `PRJ${String(nextNumber).padStart(3, '0')}`;
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.project_code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Calculate total workers across all projects
    const totalWorkers = projects.reduce((sum, p) => sum + (p.worker_count || 0), 0);

    const getStatusColor = (status) => {
        const colors = {
            planning: 'bg-blue-100 text-blue-900',
            ongoing: 'bg-green-100 text-green-900',
            completed: 'bg-purple-100 text-purple-900',
            on_hold: 'bg-yellow-100 text-yellow-900',
            cancelled: 'bg-red-100 text-red-900'
        };
        return colors[status] || 'bg-gray-100 text-gray-900';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">🏗️ Projects</h1>
                    <p className="text-gray-600 mt-1">Manage all construction projects</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <Plus className="h-5 w-5" />
                    New Project
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white hover:border-gray-400 transition-all duration-200"
                        >
                            <option value="all">All Status</option>
                            <option value="planning">Planning</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{project.project_name}</h3>
                                    <p className="text-sm text-gray-500">{project.project_code}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                                    {project.status?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {project.client_name && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Building2 className="h-4 w-4" />
                                        <span>{project.client_name}</span>
                                    </div>
                                )}
                                {project.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        <span>{project.location}</span>
                                    </div>
                                )}
                                {project.start_date && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(project.start_date)}</span>
                                    </div>
                                )}
                                {project.worker_count > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                        <Users className="h-4 w-4" />
                                        <span>{project.worker_count} Employee{project.worker_count > 1 ? 's' : ''} Working</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Budget:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(project.estimated_budget)}</span>
                                </div>
                                {project.total_expense !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Spent:</span>
                                        <span className="font-semibold text-red-600">{formatCurrency(project.total_expense)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleViewDetails(project)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    title="View Details"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleEdit(project)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                                        title="Edit"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
                    {isAdmin ? (
                        <>
                            <p className="text-gray-600 mb-4">Get started by creating your first project</p>
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Create Project
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-500">You don't have permission to create projects. Contact admin.</p>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {editingProject ? 'Edit Project' : 'Create New Project'}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Code *</label>
                                    <input
                                        type="text"
                                        name="project_code"
                                        value={formData.project_code}
                                        onChange={handleInputChange}
                                        required
                                        readOnly={!editingProject}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                                            !editingProject ? 'bg-gray-50 cursor-not-allowed' : ''
                                        }`}
                                        placeholder="Auto-generated"
                                    />
                                    {!editingProject && (
                                        <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                                    <input
                                        type="text"
                                        name="project_name"
                                        value={formData.project_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Building Construction"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    name="client_name"
                                    value={formData.client_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="ABC Corporation"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Dhaka, Bangladesh"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget (৳)</label>
                                    <input
                                        type="number"
                                        name="estimated_budget"
                                        value={formData.estimated_budget}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="5000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="planning">Planning</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Project details..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    {editingProject ? 'Update Project' : 'Create Project'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetails && selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Project Details</h2>
                            <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Project Header */}
                            <div className="border-b pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{selectedProject.project_name}</h3>
                                        <p className="text-lg text-gray-500 mt-1">{selectedProject.project_code}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                        selectedProject.status === 'ongoing' ? 'bg-green-100 text-green-900' :
                                        selectedProject.status === 'completed' ? 'bg-blue-100 text-blue-900' :
                                        selectedProject.status === 'planning' ? 'bg-yellow-100 text-yellow-900' :
                                        'bg-gray-100 text-gray-900'
                                    }`}>
                                        {selectedProject.status}
                                    </span>
                                </div>
                            </div>

                            {/* Project Info */}
                            <div className="grid grid-cols-2 gap-4">
                                {selectedProject.location && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">📍 Location</label>
                                        <p className="font-semibold mt-1">{selectedProject.location}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-gray-600">📅 Start Date</label>
                                    <p className="font-semibold mt-1">{selectedProject.start_date ? formatDate(selectedProject.start_date) : 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">📅 End Date</label>
                                    <p className="font-semibold mt-1">{selectedProject.end_date ? formatDate(selectedProject.end_date) : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Financial Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                                        <label className="text-sm text-gray-600 flex items-center gap-2">💰 Budget</label>
                                        <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(selectedProject.estimated_budget)}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
                                        <label className="text-sm text-gray-600 flex items-center gap-2">📊 Total Spent (Approved)</label>
                                        <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(selectedProject.total_sheet_cost || 0)}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Approved Sheets: {formatCurrency(selectedProject.total_sheet_cost || 0)}
                                        </p>
                                        {(selectedProject.total_sheet_cost_all || 0) > (selectedProject.total_sheet_cost || 0) && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                ⏳ Pending Sheets: {formatCurrency((selectedProject.total_sheet_cost_all || 0) - (selectedProject.total_sheet_cost || 0))}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                                        <label className="text-sm text-gray-600 flex items-center gap-2">💵 Remaining Balance</label>
                                        <p className={`text-2xl font-bold mt-1 ${(selectedProject.remaining_balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {formatCurrency(selectedProject.remaining_balance || selectedProject.estimated_budget)}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                                        <label className="text-sm text-gray-600 flex items-center gap-2">📈 Profit/Loss</label>
                                        <p className={`text-2xl font-bold mt-1 ${(selectedProject.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(selectedProject.profit_loss || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Team & Activity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <Users className="h-6 w-6 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium">Employees Working</p>
                                        <p className="text-2xl font-bold text-blue-800">{selectedProject.worker_count || 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                    <div>
                                        <p className="text-xs text-purple-600 font-medium">Total Vouchers</p>
                                        <p className="text-2xl font-bold text-purple-800">{selectedProject.voucher_count || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Category-Wise Employee Count */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Category-Wise Employees
                                </h4>
                                {console.log('🎨 Rendering categoryStats:', categoryStats)}
                                {console.log('🎨 Management value:', categoryStats['Management'])}
                                {console.log('🎨 Engineering value:', categoryStats['Engineering'])}
                                {console.log('🎨 Head Office Accounts value:', categoryStats['Head Office Accounts'])}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {/* Site Manager */}
                                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">🟡</p>
                                                <p className="text-sm font-semibold text-yellow-900">Site Manager</p>
                                            </div>
                                            <p className="text-3xl font-bold text-yellow-700">
                                                {(categoryStats['Site Manager'] || 0) + (categoryStats['site_manager'] || 0) + (categoryStats['site manager'] || 0) + (categoryStats['Management'] || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Site Engineer */}
                                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">🔵</p>
                                                <p className="text-sm font-semibold text-cyan-900">Site Engineer</p>
                                            </div>
                                            <p className="text-3xl font-bold text-cyan-700">
                                                {(categoryStats['Site Engineer'] || 0) + (categoryStats['site_engineer'] || 0) + (categoryStats['site engineer'] || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Site Director */}
                                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">🔴</p>
                                                <p className="text-sm font-semibold text-red-900">Site Director</p>
                                            </div>
                                            <p className="text-3xl font-bold text-red-700">
                                                {(categoryStats['Site Director'] || 0) + (categoryStats['site_director'] || 0) + (categoryStats['site director'] || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Accounts */}
                                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">💰</p>
                                                <p className="text-sm font-semibold text-teal-900">Accounts</p>
                                            </div>
                                            <p className="text-3xl font-bold text-teal-700">
                                                {(categoryStats['Accounts'] || 0) + (categoryStats['accounts'] || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Engineering */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">🔵</p>
                                                <p className="text-sm font-semibold text-blue-900">Engineering</p>
                                            </div>
                                            <p className="text-3xl font-bold text-blue-700">
                                                {(categoryStats['Engineering'] || 0) + (categoryStats['engineering'] || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Employee */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">👤</p>
                                                <p className="text-sm font-semibold text-gray-900">Employee</p>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-700">
                                                {(categoryStats['Employee'] || 0) + (categoryStats['employee'] || 0) + (categoryStats['Labor'] || 0) + (categoryStats['labor'] || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Total Employees */}
                                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-4 hover:shadow-lg transition-shadow col-span-2 md:col-span-3 lg:col-span-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl mb-1">👥</p>
                                                <p className="text-lg font-bold text-gray-900">Total Employees</p>
                                            </div>
                                            <p className="text-4xl font-bold text-gray-700">
                                                {selectedProject.worker_count || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedProject.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">📝 Description</label>
                                    <p className="mt-2 text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedProject.description}</p>
                                </div>
                            )}

                            {/* Daily Sheets Section */}
                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Daily Sheets ({projectSheets.length})
                                    </h4>
                                </div>

                                {sheetsLoading ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">Loading sheets...</p>
                                    </div>
                                ) : projectSheets.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                        <p className="text-gray-600 font-medium">No daily sheets created yet</p>
                                        <p className="text-sm text-gray-500 mt-1">Sheets will appear here when created</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {projectSheets.map((sheet) => (
                                            <div key={sheet.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-bold text-blue-600">{sheet.sheet_no}</span>
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                                sheet.status === 'approved' ? 'bg-green-100 text-green-900' :
                                                                sheet.status === 'completed' ? 'bg-blue-100 text-blue-900' :
                                                                'bg-gray-100 text-gray-900'
                                                            }`}>
                                                                {sheet.status}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-gray-600">📅 Date:</span>
                                                                <span className="ml-2 font-medium">{formatDate(sheet.sheet_date)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">👤 Created By:</span>
                                                                <span className="ml-2 font-medium text-blue-700">{sheet.created_by_name || 'Unknown'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">💰 Amount:</span>
                                                                <span className="ml-2 font-bold text-red-600">৳{parseFloat(sheet.today_expense || 0).toLocaleString()}</span>
                                                            </div>
                                                            {sheet.location && (
                                                                <div>
                                                                    <span className="text-gray-600">📍 Location:</span>
                                                                    <span className="ml-2 font-medium">{sheet.location}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
