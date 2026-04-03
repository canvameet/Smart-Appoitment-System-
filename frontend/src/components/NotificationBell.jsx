import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaBell, FaExclamationTriangle, FaClock, FaInfoCircle, FaCheck } from 'react-icons/fa';

/**
 * NotificationBell Component
 * Displays a bell icon with unread count badge and dropdown notification list.
 * Polls the backend every 15 seconds for new notifications.
 * 
 * Props:
 *   - userId: string (user identifier for fetching notifications)
 */
const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications from backend (fetch all — role-based filtering can be added later)
  const fetchNotifications = async () => {
    try {
      const resp = await axios.get(`http://localhost:5000/notifications/all?limit=50`);
      if (resp.data.success) {
        setNotifications(resp.data.notifications);
        // Count unread
        const unread = resp.data.notifications.filter(n => n.status !== 'read').length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Silently fail - notifications are non-critical
      console.log('[NotificationBell] Fetch error (non-critical):', err.message);
    }
  };

  // Poll every 15 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = async (notifId) => {
    try {
      await axios.post(`http://localhost:5000/notifications/mark-read/${notifId}`);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Get icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'emergency':
        return <FaExclamationTriangle className="text-red-500 flex-shrink-0" />;
      case 'reminder':
        return <FaClock className="text-blue-500 flex-shrink-0" />;
      default:
        return <FaInfoCircle className="text-gray-500 flex-shrink-0" />;
    }
  };

  // Get background color based on type and read status
  const getBgClass = (notif) => {
    if (notif.status === 'read') return 'bg-white';
    switch (notif.type) {
      case 'emergency':
        return 'bg-red-50 border-l-4 border-l-red-500';
      case 'reminder':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      default:
        return 'bg-gray-50 border-l-4 border-l-gray-400';
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
        title="Notifications"
      >
        <FaBell className="h-5 w-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <FaBell className="h-4 w-4" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <FaBell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${getBgClass(notif)}`}
                  onClick={() => {
                    if (notif.status !== 'read') markAsRead(notif.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.status === 'read' ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {formatTime(notif.timestamp)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${notif.type === 'emergency' ? 'bg-red-100 text-red-700' :
                            notif.type === 'reminder' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                          {notif.type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          via {notif.sent_via}
                        </span>
                      </div>
                    </div>
                    {notif.status === 'read' && (
                      <FaCheck className="text-green-400 text-xs flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
