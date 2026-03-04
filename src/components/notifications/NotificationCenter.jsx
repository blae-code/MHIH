import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Check, Trash2, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose, user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread'); // all, unread, critical, high

  useEffect(() => {
    if (!isOpen || !user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [isOpen, user]);

  const loadNotifications = async () => {
    try {
      const query = user ? { recipient_email: user.email } : {};
      const data = await base44.entities.Notification.list('-created_date', 50);
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, {
        read: true,
        read_at: new Date().toISOString()
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n =>
          base44.entities.Notification.update(n.id, {
            read: true,
            read_at: new Date().toISOString()
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (filter === 'unread') filtered = filtered.filter(n => !n.read);
    else if (filter === 'critical') filtered = filtered.filter(n => n.severity === 'critical');
    else if (filter === 'high') filtered = filtered.filter(n => ['critical', 'high'].includes(n.severity));
    return filtered;
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#f85149';
      case 'high': return '#ffab40';
      case 'medium': return '#ffd700';
      case 'low': return '#40c4ff';
      default: return '#00e676';
    }
  };

  const filtered = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md rounded-l-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRight: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {unreadCount} unread
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  background: 'rgba(254,221,0,0.1)',
                  color: 'var(--mnbc-yellow)',
                  border: '1px solid rgba(254,221,0,0.2)'
                }}
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="activity-icon" style={{ width: 24, height: 24 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 px-4 py-2 shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {['unread', 'all', 'critical', 'high'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-2 py-1 rounded whitespace-nowrap transition-colors"
              style={{
                background: filter === f ? 'rgba(254,221,0,0.15)' : 'var(--bg-overlay)',
                color: filter === f ? 'var(--mnbc-yellow)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'rgba(254,221,0,0.3)' : 'var(--border-subtle)'}`
              }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
              <CheckCircle2 size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {filtered.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 hover:transition-colors"
                  style={{
                    background: notification.read ? 'transparent' : 'rgba(254,221,0,0.03)',
                    borderLeft: `3px solid ${getSeverityColor(notification.severity)}`
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
                  onMouseOut={e => e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(254,221,0,0.03)'}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(notification.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {notification.title}
                          </p>
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {notification.message}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 rounded hover:opacity-100"
                          style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="text-xs mt-2 inline-block px-2 py-1 rounded"
                          style={{
                            background: 'rgba(254,221,0,0.1)',
                            color: 'var(--mnbc-yellow)',
                            textDecoration: 'none'
                          }}
                        >
                          View Details →
                        </a>
                      )}
                      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                        {new Date(notification.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs mt-2 px-2 py-1 rounded transition-colors"
                      style={{
                        background: 'rgba(254,221,0,0.1)',
                        color: 'var(--mnbc-yellow)',
                        border: '1px solid rgba(254,221,0,0.2)'
                      }}
                    >
                      <Check size={11} className="inline mr-1" />
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}