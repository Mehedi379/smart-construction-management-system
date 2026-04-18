import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Building2, User, HardHat, ClipboardCheck } from 'lucide-react';
import { employeeService, authService, projectService } from '../services';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const login = useAuthStore((state) => state.login);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [regForm, setRegForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        designation: 'Engineer',
        category: 'Engineering',
        department: '',
        employee_id: '',
        daily_wage: 0,
        monthly_salary: 0,
        father_name: '',
        nid: '',
        address: '',
        work_role: '',
        assigned_project_id: '', // NEW: Project assignment
        requested_role: 'employee' // Auto-assigned based on category
    });
    const [projects, setProjects] = useState([]);

    const constructionSectors = [
        { id: 'civil', name: 'Civil Work', icon: '🏗️', roles: ['Raj Mistri', 'Helper/Labor', 'Brick Worker', 'Concrete Worker'] },
        { id: 'electrical', name: 'Electrical', icon: '⚡', roles: ['Electrician', 'Wireman', 'Electrical Helper'] },
        { id: 'plumbing', name: 'Plumbing', icon: '🚰', roles: ['Plumber', 'Pipe Fitter', 'Plumbing Helper'] },
        { id: 'steel', name: 'Steel/Rod', icon: '🔩', roles: ['Rod Mistri', 'Rod Helper'] },
        { id: 'carpentry', name: 'Carpentry', icon: '🪵', roles: ['Carpenter', 'Wood Helper'] },
        { id: 'painting', name: 'Painting', icon: '🎨', roles: ['Painter', 'Polish Worker'] },
        { id: 'tiles', name: 'Tile/Marble', icon: '🧱', roles: ['Tile Mistri', 'Marble Worker'] },
        { id: 'glass', name: 'Glass/Aluminum', icon: '🪟', roles: ['Glass Worker', 'Aluminum Technician'] },
        { id: 'interior', name: 'Interior', icon: '🏠', roles: ['Interior Designer', 'Gypsum Worker', 'Ceiling Worker'] },
        { id: 'machine', name: 'Machine', icon: '🚜', roles: ['Excavator Operator', 'Truck Driver', 'Machine Operator'] },
        { id: 'engineering', name: 'Engineering', icon: '👷', roles: ['Site Engineer', 'Civil Engineer', 'Project Engineer', 'Quality Engineer'] },
        { id: 'management', name: 'Management', icon: '👨‍💼', roles: ['Project Manager', 'Supervisor', 'Site Manager'] },
        { id: 'security', name: 'Security', icon: '🔐', roles: ['Security Guard', 'Cleaner'] }
    ];

    useEffect(() => {
        // Only show registration if user is logged in but not registered
        // Skip registration for admin and all signature roles
        if (user && !user.is_registered) {
            const requiresRegistration = !['admin', 'accountant', 'site_manager', 'site_engineer', 'site_director', 
                                           'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office'].includes(user.role);
            if (requiresRegistration) {
                setShowRegistration(true);
            } else {
                // Auto-redirect to dashboard for admin/signature roles
                navigate('/dashboard');
            }
        }
    }, [user]);

    // Fetch projects only once when component mounts
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            console.log('📡 Fetching projects from API...');
            // Use public endpoint that doesn't require authentication
            const response = await projectService.getActiveProjects();
            console.log('✅ Projects loaded:', response.data?.length || 0, 'projects');
            setProjects(response.data || []);
        } catch (error) {
            // Show detailed error for debugging
            console.error('❌ Could not load projects:', error.message);
            if (error.response) {
                console.error('Server responded with:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('❌ No response from server. Is backend running on port 5000?');
            }
        }
    };

    const handleNavigateToRegistration = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setShowRegistration(true);
            // Trigger reflow
            window.requestAnimationFrame(() => {
                setIsTransitioning(false);
            });
        }, 400);
    };

    const handleNavigateToLogin = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setShowRegistration(false);
            // Trigger reflow
            window.requestAnimationFrame(() => {
                setIsTransitioning(false);
            });
        }, 400);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await login(email, password);
            toast.success('Login successful!');
            
            // Get user data from the login response
            const userData = response.data.user;
            
            // Check if user needs to complete registration
            // Only require registration for employee/worker roles, not for admin/signature roles
            const requiresRegistration = !userData.is_registered && 
                !['admin', 'accountant', 'site_manager', 'site_engineer', 'site_director',
                  'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office'].includes(userData.role);
            
            if (requiresRegistration) {
                setShowRegistration(true);
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (regForm.password !== regForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        
        // Validate password length
        if (regForm.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        
        setLoading(true);
        try {
            // Auto-assign role based on category (matches dropdown onChange logic)
            let assignedRole = 'employee';
            
            switch(regForm.category) {
                case 'Site Manager':
                    assignedRole = 'site_manager';
                    break;
                case 'Site Engineer':
                    assignedRole = 'site_engineer';
                    break;
                case 'Site Director':
                    assignedRole = 'site_director';
                    break;
                case 'Accounts':
                    assignedRole = 'accountant';
                    break;
                case 'Engineering':
                    assignedRole = 'engineer';
                    break;
                case 'Employee':
                default:
                    assignedRole = 'employee';
                    break;
            }
            
            console.log('📝 Registration - Category:', regForm.category, '→ Role:', assignedRole);
            
            // Register user
            await authService.register({
                name: regForm.name,
                email: regForm.email,
                password: regForm.password,
                phone: regForm.phone,
                requested_role: assignedRole,
                category: regForm.category,
                designation: regForm.designation,
                department: regForm.department,
                assigned_project_id: regForm.assigned_project_id || null
            });
            
            toast.success('Registration successful! Please wait for admin approval. You will receive login access once admin approves your account.');
            setShowRegistration(false);
            setRegForm({
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                designation: 'Worker',
                category: 'Labor',
                department: '',
                employee_id: '',
                daily_wage: 0,
                monthly_salary: 0,
                father_name: '',
                nid: '',
                address: '',
                work_role: '',
                requested_role: 'employee'
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
                    backgroundSize: '50px 50px'
                }}></div>
            </div>
            
            {/* Floating Orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            
            {showRegistration ? (
                <div className={`relative z-10 transition-all duration-500 ease-in-out ${
                    isTransitioning 
                        ? 'opacity-0 translate-x-full scale-95' 
                        : 'opacity-100 translate-x-0 scale-100'
                }`}>
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 animate-scale-in">
                    {/* Header - Fixed */}
                    <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-5 rounded-t-2xl z-10 shadow-lg flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">Create New Account</h1>
                                    <p className="text-sm text-white/95 font-medium">Join Smart Construction Management System</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleNavigateToLogin}
                                className="text-white hover:bg-white/20 p-3 rounded-xl transition-all duration-300 hover:rotate-90"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Form Content - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        <form onSubmit={handleRegistrationSubmit} className="space-y-5">
                            {/* Personal Information */}
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200">
                                <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2 text-base">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label">Full Name *</label>
                                        <input 
                                            type="text" 
                                            value={regForm.name} 
                                            onChange={(e) => setRegForm({...regForm, name: e.target.value})} 
                                            className="input-field" 
                                            placeholder="Enter your full name"
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Email Address *</label>
                                        <input 
                                            type="email" 
                                            value={regForm.email} 
                                            onChange={(e) => setRegForm({...regForm, email: e.target.value})} 
                                            className="input-field" 
                                            placeholder="your.email@example.com"
                                            required 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Phone Number *</label>
                                            <input 
                                                type="tel" 
                                                value={regForm.phone} 
                                                onChange={(e) => setRegForm({...regForm, phone: e.target.value})} 
                                                className="input-field" 
                                                placeholder="01712345678"
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="label">NID Number</label>
                                            <input 
                                                type="text" 
                                                value={regForm.nid} 
                                                onChange={(e) => setRegForm({...regForm, nid: e.target.value})} 
                                                className="input-field" 
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Security */}
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Account Security
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label">Password *</label>
                                        <input 
                                            type="password" 
                                            value={regForm.password} 
                                            onChange={(e) => setRegForm({...regForm, password: e.target.value})} 
                                            className="input-field" 
                                            placeholder="Min 6 characters"
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Confirm Password *</label>
                                        <input 
                                            type="password" 
                                            value={regForm.confirmPassword} 
                                            onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})} 
                                            className="input-field" 
                                            placeholder="Re-enter password"
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Work Details */}
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Work Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="label">Category *</label>
                                        <select 
                                            value={regForm.category} 
                                            onChange={(e) => {
                                                const category = e.target.value;
                                                let assignedRole = 'employee';
                                                
                                                // Auto-assign role based on category (ONE-to-ONE mapping)
                                                switch(category) {
                                                    case 'Site Manager':
                                                        assignedRole = 'site_manager';
                                                        break;
                                                    case 'Site Engineer':
                                                        assignedRole = 'site_engineer';
                                                        break;
                                                    case 'Site Director':
                                                        assignedRole = 'site_director';
                                                        break;
                                                    case 'Accounts':
                                                        assignedRole = 'accountant';
                                                        break;
                                                    case 'Engineering':
                                                        assignedRole = 'engineer';
                                                        break;
                                                    case 'Employee':
                                                    default:
                                                        assignedRole = 'employee';
                                                        break;
                                                }
                                                
                                                setRegForm({...regForm, category, requested_role: assignedRole});
                                            }} 
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Select category</option>
                                            {/* Self-Registration Available Roles */}
                                            <option value="Site Manager">🟡 Site Manager</option>
                                            <option value="Site Engineer">🔵 Site Engineer</option>
                                            <option value="Site Director">🔴 Site Director</option>
                                            {/* Regular Employee Categories */}
                                            <option value="Accounts">💰 Accounts</option>
                                            <option value="Engineering">⚙️ Engineer</option>
                                            <option value="Employee">👤 Employee</option>
                                        </select>
                                        {regForm.category && (
                                            <p className="text-xs text-green-700 mt-1">
                                                ✓ Auto-assigned role: <strong>{regForm.requested_role}</strong>
                                            </p>
                                        )}
                                    </div>
                                
                                    {/* Project Assignment */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="label mb-0">Assign to Project *</label>
                                            <button
                                                type="button"
                                                onClick={fetchProjects}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                title="Refresh projects list"
                                            >
                                                🔄 Refresh
                                            </button>
                                        </div>
                                        <select 
                                            value={regForm.assigned_project_id} 
                                            onChange={(e) => setRegForm({...regForm, assigned_project_id: e.target.value})} 
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Select a project</option>
                                            {projects.map(project => (
                                                <option key={project.id} value={project.id}>
                                                    {project.project_name} ({project.project_code})
                                                </option>
                                            ))}
                                        </select>
                                        {projects.length === 0 ? (
                                            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                                <p className="text-xs text-orange-700 font-medium">
                                                    ⚠️ No projects detected
                                                </p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    💡 Make sure:
                                                </p>
                                                <ul className="text-xs text-orange-600 mt-1 ml-4 list-disc">
                                                    <li>Backend server is running (port 5000)</li>
                                                    <li>Admin has created at least one project</li>
                                                </ul>
                                                <button
                                                    type="button"
                                                    onClick={fetchProjects}
                                                    className="mt-2 text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                                                >
                                                    🔄 Try Again
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-green-600 mt-1">
                                                ✅ {projects.length} project(s) available
                                            </p>
                                        )}
                                    </div>
                                
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Designation</label>
                                            <input 
                                                type="text" 
                                                value={regForm.designation} 
                                                onChange={(e) => setRegForm({...regForm, designation: e.target.value})} 
                                                className="input-field" 
                                                placeholder="e.g., Engineer"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Department</label>
                                            <input 
                                                type="text" 
                                                value={regForm.department} 
                                                onChange={(e) => setRegForm({...regForm, department: e.target.value})} 
                                                className="input-field" 
                                                placeholder="e.g., General"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Daily Wage (৳)</label>
                                            <input 
                                                type="number" 
                                                value={regForm.daily_wage} 
                                                onChange={(e) => setRegForm({...regForm, daily_wage: e.target.value})} 
                                                className="input-field" 
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Monthly Salary (৳)</label>
                                            <input 
                                                type="number" 
                                                value={regForm.monthly_salary} 
                                                onChange={(e) => setRegForm({...regForm, monthly_salary: e.target.value})} 
                                                className="input-field" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div>
                                <label className="label">Father's Name</label>
                                <input 
                                    type="text" 
                                    value={regForm.father_name} 
                                    onChange={(e) => setRegForm({...regForm, father_name: e.target.value})} 
                                    className="input-field" 
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="label">Address</label>
                                <textarea 
                                    value={regForm.address} 
                                    onChange={(e) => setRegForm({...regForm, address: e.target.value})} 
                                    className="input-field" 
                                    placeholder="Your address"
                                    rows="2"
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-semibold mb-2">Important Information:</p>
                                        <ul className="space-y-1.5 text-xs">
                                            <li>✓ After registration, admin approval is required</li>
                                            <li>✓ You'll receive login access once admin approves</li>
                                            <li>• Accounts category → Accountant role</li>
                                            <li>• Engineering/Management category → Engineer role</li>
                                            <li>• Other categories → Employee role</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-3">
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="w-full btn-primary py-3.5 text-base font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating Account...
                                        </span>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleNavigateToLogin}
                                    className="w-full btn-secondary py-3 text-base font-semibold"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                        </svg>
                                        Back to Login
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                    </div>
                </div>
            ) : (
                <div className={`relative z-10 transition-all duration-500 ease-in-out ${
                    isTransitioning 
                        ? 'opacity-0 -translate-x-full scale-95' 
                        : 'opacity-100 translate-x-0 scale-100'
                }`}>
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20 animate-scale-in">
                    {/* Company Branding - Professional Icon */}
                    <div className="text-center mb-8">
                        <div className="inline-flex flex-col items-center">
                            {/* Icon Container */}
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-700 to-primary-500 rounded-2xl mb-4 shadow-2xl flex items-center justify-center transform hover:scale-110 hover:rotate-6 transition-all duration-300 border-4 border-white/30">
                                <Building2 className="h-12 w-12 text-white" />
                            </div>
                            
                            {/* Company Name */}
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent mb-2">
                                Smart Construction
                            </h1>
                            
                            {/* Subtitle */}
                            <p className="text-base text-gray-800 font-bold mb-3">M/S Khaza Bilkis Rabbi</p>
                            
                            {/* Decorative Line with Badge */}
                            <div className="flex items-center justify-center gap-3">
                                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-primary-500"></div>
                                <div className="px-3 py-1 bg-gradient-to-r from-primary-700 to-primary-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                                    Management System
                                </div>
                                <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-primary-500"></div>
                            </div>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label text-gray-900">Email Address</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="input-field font-medium" 
                                placeholder="admin@khazabilkis.com" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="label text-gray-900">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="input-field font-medium" 
                                placeholder="Enter your password" 
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full btn-primary py-4 text-base font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                    
                    {/* Registration Toggle - Enhanced */}
                    <div className="mt-6 space-y-4">
                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">or</span>
                            </div>
                        </div>
                        
                        {/* Create Account Button - Prominent */}
                        <button
                            type="button"
                            onClick={handleNavigateToRegistration}
                            className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <span className="flex items-center justify-center gap-3 relative z-10">
                                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <span className="text-lg">Create New Account</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                        
                        {/* Help Text */}
                        <p className="text-xs text-center text-gray-600">
                            Already have an account? <span className="font-semibold text-primary-600">Sign in below</span>
                        </p>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-center text-gray-600">
                            <span className="font-semibold">Demo Credentials:</span>
                            <br />
                            <span className="font-mono bg-white px-2 py-1 rounded mt-1 inline-block">admin@khazabilkis.com / admin123</span>
                        </p>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
