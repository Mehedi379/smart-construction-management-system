import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { workflowService } from '../services';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const NotificationBell = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await workflowService.getMyNotifications({ is_read: false, limit: 10 });
            setNotifications(response.data || []);
            setUnreadCount(response.data?.length || 0);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            await workflowService.markNotificationAsRead(notification.id);
            setShowDropdown(false);
            // Navigate to the sheet or voucher
            if (notification.action_url) {
                navigate(notification.action_url);
            }
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await workflowService.markAllNotificationsAsRead();
            setNotifications([]);
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                title="Notifications"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDropdown(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] overflow-hidden">
                        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead} 
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                >
                                    <CheckCheck className="h-4 w-4" /> 
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500">No new notifications</p>
                                    <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-l-blue-500"
                                    >
                                        <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
