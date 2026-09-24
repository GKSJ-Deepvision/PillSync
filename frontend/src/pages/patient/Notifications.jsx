import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import { Bell, Check, Clock3, Eye, Pill, Trash2 } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'refill', label: 'Refill' },
  { id: 'general', label: 'General' },
];

const getUrgency = (daysRemaining) => {
  if (!Number.isFinite(daysRemaining)) return 'low';
  if (daysRemaining <= 2) return 'critical';
  if (daysRemaining <= 5) return 'high';
  if (daysRemaining <= 10) return 'medium';
  return 'low';
};

const getStockPercentage = (currentStock, totalStock) => {
  if (!Number.isFinite(currentStock) || !Number.isFinite(totalStock) || totalStock <= 0) return 0;
  return Math.min(100, Math.max(0, (currentStock / totalStock) * 100));
};

const urgencyStyles = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-emerald-50 text-emerald-700',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setFeedback('All notifications marked as read.');
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedNotification?.id === id) setSelectedNotification(null);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setSelectedNotification(null);
  };

  const handleOpenNotification = (notification) => {
    setNotifications((prev) => prev.map((item) => (
      item.id === notification.id ? { ...item, read: true } : item
    )));
    if (notification.type === 'refill') setSelectedNotification(notification);
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, read: !notification.read } : notification
    )));
  };

  const handleRemindLater = (id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, snoozed: true, read: true } : notification
    )));
    setFeedback('Reminder postponed locally. This notification was kept in your list.');
  };

  const handleRefillNow = (id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, refillRequested: true, read: true } : notification
    )));
    setFeedback('Demo only: refill action initiated. No order was placed.');
    setSelectedNotification(null);
  };

  const visibleNotifications = notifications.filter((notification) => {
    if (activeFilter === 'unread') return !notification.read;
    if (activeFilter === 'refill') return notification.type === 'refill';
    if (activeFilter === 'general') return notification.type !== 'refill';
    return true;
  });
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="notifications-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Notifications {unreadCount > 0 && <span className="text-sm font-bold text-brand-600">({unreadCount} unread)</span>}</h1>
          <p className="text-xs text-slate-450 mt-0.5 font-medium">Review alerts, updates, and system messages.</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMarkAllRead} className="!py-1.5 !px-3 text-xs">
              <Check className="h-4 w-4 mr-1.5" />
              Mark all read
            </Button>
            <Button variant="secondary" onClick={handleClearAll} className="!py-1.5 !px-3 text-xs !text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {feedback && (
        <div role="status" className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Notification filters">
        {FILTERS.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? 'primary' : 'outline'}
            onClick={() => setActiveFilter(filter.id)}
            className="!py-1.5 !px-3 text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="You have no notifications or alerts at this time."
        />
      ) : visibleNotifications.length === 0 ? (
        <EmptyState
          title="No Matching Notifications"
          description="Try another filter to view your notification history."
        />
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((not) => (
            <Card
              key={not.id}
              data-testid={not.type === 'refill' ? 'refill-notification' : 'notification'}
              className={`p-4 border-l-4 transition-all ${
                not.read ? 'border-l-slate-200' : 'border-l-brand-500 bg-brand-50/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg shrink-0 h-fit ${
                    not.read ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600'
                  }`}>
                    {not.type === 'refill' ? <Pill className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="space-y-2 min-w-0">
                    <h3 className={`text-xs font-bold ${not.read ? 'text-slate-700' : 'text-slate-850'}`}>
                      {not.title}
                    </h3>
                    {not.type === 'refill' && (
                      <div className="space-y-2" data-testid="refill-details-summary">
                        <p className="text-sm font-bold text-slate-800">{not.medicineName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span>{Number.isFinite(not.daysRemaining) ? `${not.daysRemaining} days remaining` : 'Stock estimate unavailable'}</span>
                          <span className={`rounded-full px-2 py-0.5 capitalize ${urgencyStyles[getUrgency(not.daysRemaining)]}`}>
                            {getUrgency(not.daysRemaining)} urgency
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>Stock remaining</span>
                            <span>{Number.isFinite(not.currentStock) ? `${not.currentStock}/${not.totalStock ?? '?'}` : 'Unavailable'}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${not.medicineName} stock remaining`} aria-valuenow={getStockPercentage(not.currentStock, not.totalStock)} aria-valuemin="0" aria-valuemax="100">
                            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${getStockPercentage(not.currentStock, not.totalStock)}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {not.message}
                    </p>
                    {not.snoozed && <p className="text-[11px] font-semibold text-amber-600">Reminder postponed</p>}
                    {not.refillRequested && <p className="text-[11px] font-semibold text-brand-600">Demo refill action initiated</p>}
                    <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                      {not.time}
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {not.type === 'refill' && (
                        <>
                          <Button variant="outline" onClick={() => handleOpenNotification(not)} className="!py-1.5 !px-2.5 text-[11px]">
                            <Eye className="mr-1 h-3.5 w-3.5" /> View Details
                          </Button>
                          <Button variant="primary" onClick={() => handleRefillNow(not.id)} className="!py-1.5 !px-2.5 text-[11px]" disabled={not.refillRequested}>
                            Refill Now
                          </Button>
                          <Button variant="secondary" onClick={() => handleRemindLater(not.id)} className="!py-1.5 !px-2.5 text-[11px]" disabled={not.snoozed}>
                            <Clock3 className="mr-1 h-3.5 w-3.5" /> {not.snoozed ? 'Reminded Later' : 'Remind Me Later'}
                          </Button>
                        </>
                      )}
                      <Button variant="outline" onClick={() => handleToggleRead(not.id)} className="!py-1.5 !px-2.5 text-[11px]">
                        {not.read ? 'Mark as unread' : 'Mark as read'}
                      </Button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(not.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-50 focus:outline-none"
                  title="Delete Alert"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        title="Refill Details"
        footer={selectedNotification && (
          <>
            <Button variant="secondary" onClick={() => setSelectedNotification(null)}>Close</Button>
            <Button variant="primary" onClick={() => handleRefillNow(selectedNotification.id)} disabled={selectedNotification.refillRequested}>Refill Now</Button>
          </>
        )}
      >
        {selectedNotification && (
          <div className="space-y-3">
            <div>
              <p className="text-base font-bold text-slate-800">{selectedNotification.medicineName}</p>
              <p className="text-xs text-slate-500 mt-1">{selectedNotification.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-400">Current stock</span><strong className="text-slate-700">{selectedNotification.currentStock ?? 'Unavailable'} tablets</strong></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-400">Estimated remaining</span><strong className="text-slate-700">{selectedNotification.daysRemaining ?? 'Unavailable'} days</strong></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-400">Total stock</span><strong className="text-slate-700">{selectedNotification.totalStock ?? 'Unavailable'} tablets</strong></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-400">Urgency</span><strong className="capitalize text-slate-700">{getUrgency(selectedNotification.daysRemaining)}</strong></div>
            </div>
            <p className="text-xs text-slate-600">Recommendation: plan a refill soon to avoid missing a scheduled dose.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Notifications;
