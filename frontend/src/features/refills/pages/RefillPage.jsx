import { Layout } from '../../../components/layout';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  TrendingDown,
  PackageCheck,
} from 'lucide-react';
import './RefillPage.css';

const REFILL_DATA = [
  {
    id: 1,
    name: 'Metformin 500mg',
    remaining: 12,
    refillIn: 5,
    risk: 'Medium',
    status: 'Watch',
    progress: 58,
  },
  {
    id: 2,
    name: 'Lisinopril 10mg',
    remaining: 8,
    refillIn: 3,
    risk: 'High',
    status: 'Urgent',
    progress: 72,
  },
  {
    id: 3,
    name: 'Vitamin D3 2000 IU',
    remaining: 21,
    refillIn: 12,
    risk: 'Low',
    status: 'Healthy',
    progress: 32,
  },
];

export function RefillPage() {
  const urgentCount = REFILL_DATA.filter((item) => item.risk === 'High').length;
  const avgDays = Math.round(
    REFILL_DATA.reduce((sum, item) => sum + item.refillIn, 0) / REFILL_DATA.length
  );

  return (
    <Layout>
      <div className="refill-page">
        <div className="refill-header">
          <div>
            <div className="refill-eyebrow">
              <CalendarClock className="h-4 w-4" />
              Refill Intelligence
            </div>
            <h1>Medication Refill Prediction</h1>
            <p>AI-assisted prediction of refill timing, supply risks, and prescribing follow-up.</p>
          </div>
        </div>

        <div className="refill-kpis">
          <div className="refill-kpi-card">
            <span>Total predicted refills</span>
            <strong>{REFILL_DATA.length}</strong>
            <small>Across active prescriptions</small>
          </div>
          <div className="refill-kpi-card warning">
            <span>Urgent follow-up</span>
            <strong>{urgentCount}</strong>
            <small>High-risk refill window</small>
          </div>
          <div className="refill-kpi-card success">
            <span>Average refill window</span>
            <strong>{avgDays} days</strong>
            <small>Before supply runs out</small>
          </div>
        </div>

        <div className="refill-list">
          {REFILL_DATA.map((item) => (
            <div key={item.id} className="refill-card">
              <div className="refill-card-top">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.remaining} pills remaining</p>
                </div>
                <span className={`risk-badge risk-${item.risk.toLowerCase()}`}>{item.risk}</span>
              </div>

              <div className="refill-progress-wrap">
                <div className="refill-progress-row">
                  <span>Supply utilization</span>
                  <strong>{item.progress}%</strong>
                </div>
                <div className="refill-track">
                  <div className="refill-fill" style={{ width: `${item.progress}%` }} />
                </div>
              </div>

              <div className="refill-footer">
                <div className="status-pill">
                  {item.status === 'Urgent' ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {item.status}
                </div>
                <div className="refill-days">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Refill in {item.refillIn} days
                </div>
              </div>

              <div className="refill-actions">
                <button type="button" className="primary-btn">
                  <PackageCheck className="h-3.5 w-3.5" />
                  Order refill
                </button>
                <button type="button" className="secondary-btn">
                  View history
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
