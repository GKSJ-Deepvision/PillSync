import { useMemo, useState } from 'react';
import { Layout } from '../../../components/layout';
import { Bell, CheckCircle2, AlertTriangle, Clock3, Filter, Mail, Sparkles } from 'lucide-react';
import './NotificationsPage.css';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'alert',
    title: 'Missed dose alert',
    message:
      'Lisinopril 10mg was not logged before 8:00 AM. A reminder has been sent to the patient.',
    time: '8 minutes ago',
    unread: true,
    priority: 'high',
  },
  {
    id: 2,
    type: 'message',
    title: 'Caregiver message',
    message: 'Dr. Oliver Mitchell requested a quick medication review for Sarah Connor.',
    time: '1 hour ago',
    unread: true,
    priority: 'normal',
  },
  {
    id: 3,
    type: 'refill',
    title: 'Refill reminder',
    message: 'Metformin 500mg is projected to run out in 5 days. Refill recommendation is ready.',
    time: '3 hours ago',
    unread: false,
    priority: 'medium',
  },
  {
    id: 4,
    type: 'alert',
    title: 'Blood pressure check needed',
    message: 'The patient has not logged a morning blood pressure reading in 2 days.',
    time: 'Yesterday',
    unread: false,
    priority: 'medium',
  },
  {
    id: 5,
    type: 'message',
    title: 'System summary',
    message: 'This week’s adherence trend improved by 7.2% compared with last week.',
    time: '2 days ago',
    unread: false,
    priority: 'normal',
  },
];

const FILTERS = ['all', 'alert', 'message', 'refill'];

export function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  const unreadCount = items.filter((item) => item.unread).length;
  const urgentCount = items.filter((item) => item.priority === 'high').length;

  const markAsRead = (id) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  return (
    <Layout>
      <div className="notifications-page">
        <div className="notifications-header">
          <div>
            <div className="notificationseyebrow">
              <Bell className="h-4 w-4" />
              Patient Alerts & Updates
            </div>
            <h1>Notifications Center</h1>
            <p>Medication alerts, patient messages, refill alerts, and clinical status updates.</p>
          </div>

          <div className="notifications-summary">
            <div>
              <span className="label">Unread</span>
              <strong>{unreadCount}</strong>
            </div>
            <div>
              <span className="label">Urgent</span>
              <strong>{urgentCount}</strong>
            </div>
          </div>
        </div>

        <div className="notifications-filters">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? 'active' : ''}
              onClick={() => setFilter(item)}
            >
              {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1) + 's'}
            </button>
          ))}
        </div>

        <div className="notifications-grid">
          <div className="notifications-list">
            {filteredItems.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.unread ? 'unread' : ''}`}
              >
                <div className="notification-icon">
                  {notification.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                  {notification.type === 'message' && <Mail className="h-4 w-4" />}
                  {notification.type === 'refill' && <Sparkles className="h-4 w-4" />}
                </div>

                <div className="notification-body">
                  <div className="notification-header-row">
                    <h3>{notification.title}</h3>
                    {notification.unread && <span className="unread-dot">New</span>}
                  </div>
                  <p>{notification.message}</p>
                  <div className="notification-meta">
                    <span className="time">
                      <Clock3 className="h-3.5 w-3.5" />
                      {notification.time}
                    </span>
                    <span className={`priority priority-${notification.priority}`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>

                {notification.unread && (
                  <button
                    type="button"
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>

          <aside className="notifications-sidepanel">
            <div className="panel-card">
              <div className="panel-title-row">
                <Filter className="h-4 w-4" />
                <span>Priority summary</span>
              </div>
              <ul>
                <li>
                  <span>Critical alerts</span>
                  <strong>{urgentCount}</strong>
                </li>
                <li>
                  <span>Unread messages</span>
                  <strong>{unreadCount}</strong>
                </li>
                <li>
                  <span>Refill notices</span>
                  <strong>{items.filter((i) => i.type === 'refill').length}</strong>
                </li>
              </ul>
            </div>

            <div className="panel-card panel-alert">
              <h4>Care team status</h4>
              <p>
                All active medication workflows are synchronized. No systemwide outages detected.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
