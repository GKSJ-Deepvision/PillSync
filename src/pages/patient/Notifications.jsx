import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import { Bell, Check, Trash2 } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="notifications-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Notifications</h1>
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

      {notifications.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="You have no notifications or alerts at this time."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((not) => (
            <Card
              key={not.id}
              className={`p-4 border-l-4 transition-all ${
                not.read ? 'border-l-slate-200' : 'border-l-brand-500 bg-brand-50/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg shrink-0 h-fit ${
                    not.read ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600'
                  }`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-xs font-bold ${not.read ? 'text-slate-700' : 'text-slate-850'}`}>
                      {not.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {not.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                      {not.time}
                    </span>
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
    </div>
  );
};

export default Notifications;
