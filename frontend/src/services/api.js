import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle different error status codes
        if (error.response?.status === 401) {
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        } else if (error.response?.status === 403) {
            console.error('Access forbidden:', error.response.data?.message);
        } else if (error.response?.status === 404) {
            console.error('Resource not found:', error.response.data?.message);
        } else if (error.response?.status >= 500) {
            console.error('Server error:', error.response.data?.message);
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network error: Unable to connect to server');
        }
        
        return Promise.reject(error);
    }
);

export default api;
