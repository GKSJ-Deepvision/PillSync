import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="settings-page">
      <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-brand-600" />
        Settings
      </h1>

      <div className="space-y-4">
        {/* Account Settings Card */}
        <Card title="Account Settings" subtitle="Configure email preferences and sync controls">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Primary Language" placeholder="English" disabled />
            <Input label="Time Zone" placeholder="Pacific Time (PT)" disabled />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="secondary" disabled>Update Preferences</Button>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card title="Change Password" subtitle="Ensure your account remains safe and private">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Current Password" type="password" placeholder="••••••••" disabled />
            <Input label="New Password" type="password" placeholder="••••••••" disabled />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="secondary" disabled>Change Password</Button>
          </div>
        </Card>

        {/* Notification preferences checkbox logs */}
        <Card title="Notifications Preferences" subtitle="Decide how you receive alerts">
          <div className="mt-4 space-y-3">
            {[
              { id: 'not_email', label: 'Email Notifications', desc: 'Receive morning schedule outlines and refill flags.' },
              { id: 'not_push', label: 'Push Notifications', desc: 'Receive alarm alerts for scheduled dosages.' },
              { id: 'not_sms', label: 'WhatsApp / SMS Sync', desc: 'Synchronize medication tracking warnings.' }
            ].map((pref) => (
              <label key={pref.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/50 cursor-not-allowed">
                <input type="checkbox" defaultChecked disabled className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">{pref.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{pref.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Appearance preferences */}
        <Card title="Appearance" subtitle="Customize themes and layouts">
          <div className="mt-4 flex flex-wrap gap-3">
            {['Light Theme', 'Dark Theme (Milestone 2)', 'High Contrast'].map((theme, idx) => (
              <button
                key={theme}
                disabled
                className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-all ${
                  idx === 0
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
