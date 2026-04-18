import { create } from 'zustand';
import { reportService, voucherService, expenseService, employeeService, projectService } from '../services';

/**
 * Centralized Dashboard Store
 * Prevents duplicate API calls across components
 * Shared state for dashboard data
 */
const useDashboardStore = create((set, get) => ({
  // State
  stats: null,
  projects: [],
  employees: [],
  vouchers: [],
  expenses: [],
  pendingVouchers: [],
  recentTransactions: [],
  loading: false,
  lastFetched: null,

  // Fetch all dashboard data (centralized)
  fetchDashboardData: async (forceRefresh = false) => {
    const { lastFetched } = get();
    
    // Cache for 30 seconds unless force refresh
    if (!forceRefresh && lastFetched && (Date.now() - lastFetched < 30000)) {
      return;
    }

    set({ loading: true });
    
    try {
      // Fetch all data in parallel
      const [statsResponse, projectsResponse, vouchersResponse] = await Promise.all([
        reportService.getDashboardStats(),
        projectService.getProjects({}),
        voucherService.getVouchers({ status: 'pending' })
      ]);

      // Debug log
      console.log('=== DASHBOARD DATA FETCHED ===');
      console.log('Stats:', statsResponse);
      console.log('Projects:', projectsResponse);
      console.log('Projects data:', projectsResponse.data);
      console.log('Projects array:', projectsResponse.data?.projects || projectsResponse.data);

      const projectsArray = projectsResponse.data?.projects || projectsResponse.data || [];

      set({
        stats: statsResponse.data,
        projects: projectsArray,
        pendingVouchers: vouchersResponse.data || [],
        recentTransactions: statsResponse.data?.recent_transactions || [],
        lastFetched: Date.now(),
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      set({ loading: false });
    }
  },

  // Fetch chart data (separate to avoid blocking main dashboard)
  fetchChartData: async () => {
    try {
      const [employeesResponse, expensesResponse, expenseSummaryResponse] = await Promise.all([
        employeeService.getEmployees({ status: 'active' }),
        expenseService.getExpenses(),
        expenseService.getExpenseSummary()
      ]);

      set({
        employees: employeesResponse.data || [],
        expenses: expensesResponse.data || [],
        categoryData: expenseSummaryResponse.data || []
      });
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  },

  // Refresh specific data
  refreshVouchers: async () => {
    try {
      const response = await voucherService.getVouchers({ status: 'pending' });
      set({ pendingVouchers: response.data || [] });
    } catch (error) {
      console.error('Failed to refresh vouchers:', error);
    }
  },

  refreshProjects: async () => {
    try {
      const response = await projectService.getProjects({});
      set({ projects: response.data || [] });
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  },

  // Clear cache
  clearCache: () => {
    set({ 
      stats: null, 
      projects: [], 
      pendingVouchers: [],
      recentTransactions: [],
      lastFetched: null 
    });
  }
}));

export default useDashboardStore;
