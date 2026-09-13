import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Mail,
  Sparkles,
  Phone,
  Send,
  MessageSquare,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react';
import './NotificationsPage.css';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'patient_message',
    title: 'Patient Inquiry · Sarah Connor',
    patient: 'Sarah Connor',
    patientAge: 48,
    patientAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    message:
      'Good morning Dr. Oliver. I felt slight dizziness after taking my morning Lisinopril 20mg dose. Should I take it with food or reduce to 10mg?',
    time: '12 minutes ago',
    unread: true,
    priority: 'high',
    replies: [],
  },
  {
    id: 2,
    type: 'alert',
    title: 'Critical Missed Dose · Sarah Connor',
    patient: 'Sarah Connor',
    patientAge: 48,
    patientAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    message:
      'Lisinopril 20mg morning dose (08:00 AM) was not logged. Overdue by 3 hours. Automated SMS reminder sent.',
    time: '45 minutes ago',
    unread: true,
    priority: 'high',
    replies: [],
  },
  {
    id: 3,
    type: 'patient_message',
    title: 'Vitals Update · Ibrahim Kadri',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    message:
      'Dr. Oliver, my fasting blood glucose this morning was 114 mg/dL and BP was 122/78 mmHg. Both morning doses taken with oatmeal.',
    time: '2 hours ago',
    unread: true,
    priority: 'normal',
    replies: [],
  },
  {
    id: 4,
    type: 'refill',
    title: 'Refill Authorization Needed · Michael Chang',
    patient: 'Michael Chang',
    patientAge: 62,
    patientAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    message:
      'Levothyroxine 50mcg is down to 4 days supply remaining. Michael Chang requested a 30-day prescription renewal.',
    time: '3 hours ago',
    unread: false,
    priority: 'medium',
    replies: [],
  },
  {
    id: 5,
    type: 'patient_message',
    title: 'Care Question · Michael Chang',
    patient: 'Michael Chang',
    patientAge: 62,
    patientAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    message:
      'Can I take my Levothyroxine 30 minutes before breakfast or does it strictly need a full 60 minutes gap?',
    time: 'Yesterday',
    unread: false,
    priority: 'normal',
    replies: [
      {
        id: 'r1',
        sender: 'Dr. Oliver Mitchell',
        text: 'Hello Michael! A 30 to 45-minute window with a full glass of water is completely fine.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 6,
    type: 'alert',
    title: 'Adherence Milestone Reached',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    message:
      'Ibrahim Kadri achieved a 7-day 96% adherence score across all 4 prescribed medications.',
    time: '2 days ago',
    unread: false,
    priority: 'normal',
    replies: [],
  },
];

const PATIENT_VIEW_NOTIFICATIONS = [
  {
    id: 101,
    type: 'doctor_message',
    title: 'Message from Dr. Oliver Mitchell',
    doctor: 'Dr. Oliver Mitchell',
    doctorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    message:
      'Good morning Ibrahim! Your fasting glucose reading of 114 mg/dL looks great. Continue your current Metformin 500mg dose after breakfast.',
    time: '15 minutes ago',
    unread: true,
    priority: 'high',
    replies: [],
  },
  {
    id: 102,
    type: 'refill',
    title: 'Prescription Refill Reminder',
    message:
      'Metformin 500mg has 4 days remaining. Your pharmacy at City Health has prepared your 30-day refill pack.',
    time: '2 hours ago',
    unread: true,
    priority: 'medium',
    replies: [],
  },
  {
    id: 103,
    type: 'alert',
    title: 'Dose Schedule Reminder',
    message: 'Your Vitamin D3 2000 IU dose is scheduled for 01:00 PM with lunch today.',
    time: '4 hours ago',
    unread: false,
    priority: 'normal',
    replies: [],
  },
];

export function NotificationsPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'patient';
  const isCaregiver = userRole === 'caregiver' || userRole === 'admin';

  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState(
    isCaregiver ? INITIAL_NOTIFICATIONS : PATIENT_VIEW_NOTIFICATIONS
  );
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'patient_messages')
      return items.filter(
        (item) => item.type === 'patient_message' || item.type === 'doctor_message'
      );
    if (filter === 'alerts') return items.filter((item) => item.type === 'alert');
    if (filter === 'refills') return items.filter((item) => item.type === 'refill');
    return items;
  }, [filter, items]);

  const unreadCount = items.filter((item) => item.unread).length;
  const urgentCount = items.filter((item) => item.priority === 'high').length;
  const messagesCount = items.filter(
    (item) => item.type === 'patient_message' || item.type === 'doctor_message'
  ).length;

  const markAsRead = (id) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const handleSendReply = (id) => {
    if (!replyText.trim()) return;

    setItems((current) =>
      current.map((item) => {
        if (item.id === id) {
          const newReply = {
            id: Date.now(),
            sender: isCaregiver ? 'Dr. Oliver Mitchell' : user?.name || 'Patient',
            text: replyText,
            time: 'Just now',
          };
          return {
            ...item,
            unread: false,
            replies: [...(item.replies || []), newReply],
          };
        }
        return item;
      })
    );

    setReplyText('');
    setReplyingId(null);
  };

  return (
    <Layout>
      <div className="notifications-page">
        {/* Header */}
        <div className="notifications-header">
          <div>
            <div className="notificationseyebrow">
              <Bell className="h-4 w-4" />
              {isCaregiver ? 'Caregiver Cohort Inquiries & Alerts' : 'Patient Updates & Messages'}
            </div>
            <h1>Notifications Center</h1>
            <p>
              {isCaregiver
                ? 'Incoming messages sent by your monitored patients, missed dose alerts, and refill requests.'
                : 'Direct instructions from your care team, medication reminders, and prescription refill updates.'}
            </p>
          </div>

          <div className="notifications-summary">
            <div>
              <span className="label">Unread</span>
              <strong className="text-indigo-600">{unreadCount}</strong>
            </div>
            <div>
              <span className="label">Urgent</span>
              <strong className="text-rose-600">{urgentCount}</strong>
            </div>
            {isCaregiver && (
              <div>
                <span className="label">Messages</span>
                <strong className="text-emerald-600">{messagesCount}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="notifications-filters">
          {[
            { id: 'all', label: `All Notifications (${items.length})` },
            {
              id: 'patient_messages',
              label: isCaregiver
                ? `Patient Messages (${messagesCount})`
                : `Doctor Messages (${messagesCount})`,
            },
            {
              id: 'alerts',
              label: `Dose Alerts (${items.filter((i) => i.type === 'alert').length})`,
            },
            {
              id: 'refills',
              label: `Refill Requests (${items.filter((i) => i.type === 'refill').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={filter === tab.id ? 'active' : ''}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Main Grid */}
        <div className="notifications-grid">
          <div className="notifications-list">
            {filteredItems.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.unread ? 'unread' : ''}`}
              >
                {/* Icon Column */}
                <div className="notification-icon">
                  {notification.type === 'alert' && (
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                  )}
                  {(notification.type === 'patient_message' ||
                    notification.type === 'doctor_message') && (
                    <Mail className="h-5 w-5 text-indigo-600" />
                  )}
                  {notification.type === 'refill' && (
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  )}
                </div>

                {/* Body Content */}
                <div className="notification-body">
                  {/* Patient Banner for Caregiver view */}
                  {notification.patient && isCaregiver && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <img
                          src={notification.patientAvatar}
                          alt={notification.patient}
                          className="h-6 w-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          {notification.patient}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({notification.patientAge}y)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Patient Message
                      </span>
                    </div>
                  )}

                  {/* Doctor Banner for Patient view */}
                  {notification.doctor && !isCaregiver && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <img
                          src={notification.doctorAvatar}
                          alt={notification.doctor}
                          className="h-6 w-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          {notification.doctor}
                        </span>
                      </div>
                      <Badge variant="success" size="xs">
                        Attending Physician
                      </Badge>
                    </div>
                  )}

                  <div className="notification-header-row">
                    <h3>{notification.title}</h3>
                    {notification.unread && <span className="unread-dot">New Message</span>}
                  </div>

                  <p className="notification-text">{notification.message}</p>

                  {/* Thread Replies */}
                  {notification.replies && notification.replies.length > 0 && (
                    <div className="space-y-2 mt-3 pt-2 border-t border-slate-100">
                      {notification.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span className="flex items-center gap-1.5 text-indigo-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {reply.sender} (Reply)
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {reply.time}
                            </span>
                          </div>
                          <p className="text-slate-700 m-0 text-xs leading-relaxed">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Reply Form */}
                  {replyingId === notification.id ? (
                    <div className="mt-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40">
                      <p className="text-[11px] font-bold text-indigo-900 mb-1.5 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Reply to {notification.patient || 'Sender'}:
                      </p>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type clinical advice or response..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setReplyingId(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(notification.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-2xs"
                        >
                          <Send className="h-3 w-3" />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Metadata & Actions */}
                  <div className="notification-meta mt-3">
                    <span className="time">
                      <Clock3 className="h-3.5 w-3.5" />
                      {notification.time}
                    </span>
                    <span className={`priority priority-${notification.priority}`}>
                      {notification.priority}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      {(notification.type === 'patient_message' ||
                        notification.type === 'doctor_message') &&
                        replyingId !== notification.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(notification.id);
                              setReplyText('');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Reply
                          </button>
                        )}

                      {notification.patient && (
                        <button
                          type="button"
                          onClick={() => alert(`Calling ${notification.patient}...`)}
                          className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {notification.type === 'refill' && isCaregiver && (
                        <button
                          type="button"
                          onClick={() =>
                            alert(`30-day refill authorized for ${notification.patient}!`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                        >
                          <Check className="h-3 w-3" />
                          Authorize Refill
                        </button>
                      )}

                      {notification.unread && (
                        <button
                          type="button"
                          className="mark-read-btn cursor-pointer"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Side Panel Summary */}
          <aside className="notifications-sidepanel">
            <div className="panel-card">
              <div className="panel-title-row">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Cohort Communication Hub</span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Messages sent by patients via their mobile portal or web app are routed directly to
                this caregiver inbox with instant push telemetry.
              </p>
              <ul>
                <li>
                  <span>Urgent alerts</span>
                  <strong className="text-rose-600">{urgentCount}</strong>
                </li>
                <li>
                  <span>Unread messages</span>
                  <strong className="text-indigo-600">{unreadCount}</strong>
                </li>
                <li>
                  <span>Active patients</span>
                  <strong>3 Patients</strong>
                </li>
              </ul>
            </div>

            <div className="panel-card panel-alert">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Users className="h-4 w-4 text-emerald-700" />
                Live Care Team Status
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Lead Clinician Dr. Oliver Mitchell is currently online. Automated escalations are
                active for doses delayed over 30 minutes.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
