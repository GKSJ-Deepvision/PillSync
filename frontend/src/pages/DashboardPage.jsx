import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common';
import { TrendingUp, Pill, Clock, ArrowUpRight, CalendarCheck2, HeartPulse } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Total Medications',
      value: '4',
      icon: Pill,
      color: 'bg-sky-100 text-sky-700',
      detail: '+1 this month',
    },
    {
      label: "Today's Reminders",
      value: '6',
      icon: Clock,
      color: 'bg-emerald-100 text-emerald-700',
      detail: '2 due soon',
    },
    {
      label: 'Adherence Rate',
      value: '87%',
      icon: TrendingUp,
      color: 'bg-violet-100 text-violet-700',
      detail: '+5.2% vs last week',
    },
  ];

  return (
    <Layout>
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 ring-1 ring-primary-100">
          <HeartPulse className="h-3.5 w-3.5" />
          Medication overview
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Welcome back, {user?.name || 'Patient'}
        </h1>
        <p className="text-base text-slate-600">
          Stay on top of your care plan, prescriptions, and daily health routine.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hoverable>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs font-medium text-emerald-600">{stat.detail}</p>
                  </div>
                  <div className={`${stat.color} metric-icon`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Daily care plan</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                On track
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                { label: 'Morning dose', time: '08:00 AM', med: 'Metformin', status: 'Taken' },
                {
                  label: 'Afternoon check-in',
                  time: '01:00 PM',
                  med: 'Hydration + vitamins',
                  status: 'Upcoming',
                },
                {
                  label: 'Evening reminder',
                  time: '08:30 PM',
                  med: 'Aspirin',
                  status: 'Scheduled',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">{item.med}</p>
                    <p className="text-sm text-slate-500">{item.time}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Taken' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Upcoming' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Button className="w-full justify-between" variant="primary">
              <span>Add medication</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button className="w-full justify-between" variant="secondary">
              <span>Review reminders</span>
              <CalendarCheck2 className="h-4 w-4" />
            </Button>
            <Button className="w-full justify-between" variant="outline">
              <span>Open adherence report</span>
              <TrendingUp className="h-4 w-4" />
            </Button>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
