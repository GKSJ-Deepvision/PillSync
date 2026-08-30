import { useEffect, useState } from 'react';
import { adherenceApi } from '../../../api/adherence';
import { Layout } from '../../../components/layout';
import { Card, CardBody, CardHeader } from '../../../components/common/Card';
import { Badge, CardSkeleton, Alert } from '../../../components/common';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export function AdherencePage() {
  const [summary, setSummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdherenceData();
  }, []);

  const fetchAdherenceData = async () => {
    try {
      setLoading(true);
      const [summaryData, weekly, monthly, history] = await Promise.all([
        adherenceApi.getSummary(),
        adherenceApi.getWeeklyAdherence(),
        adherenceApi.getMonthlyAdherence(),
        adherenceApi.getMedicationHistory(),
      ]);

      setSummary(summaryData);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setMedicationHistory(history);
    } catch (err) {
      setError('Failed to fetch adherence data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <CardSkeleton count={4} />
      </Layout>
    );
  }

  const adherenceData = [
    { name: 'Taken', value: summary?.takenDoses || 0, color: '#10b981' },
    { name: 'Missed', value: summary?.missedDoses || 0, color: '#ef4444' },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Adherence Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Track your medication adherence and consistency
        </p>
      </div>

      {error && (
        <Alert
          type="danger"
          message={error}
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardBody>
              <p className="text-gray-600 text-sm">Overall Adherence</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-bold text-primary-600">
                  {summary.overallAdherence}%
                </p>
                <p className="text-gray-600 text-sm mb-1">
                  <TrendingUp className="h-4 w-4 inline text-green-600" />
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-gray-600 text-sm">Doses Taken</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {summary.takenDoses}
              </p>
              <p className="text-xs text-gray-500 mt-1">out of {summary.totalDoses}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-gray-600 text-sm">Doses Missed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {summary.missedDoses}
              </p>
              <p className="text-xs text-gray-500 mt-1">out of {summary.totalDoses}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-gray-600 text-sm">Consecutive Days</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {summary.streak}
              </p>
              <p className="text-xs text-gray-500 mt-1">Current streak</p>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Weekly Adherence
              </h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="adherence" fill="#0ea5e9" name="Adherence %" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Pie Chart */}
        {adherenceData && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Doses Overview
              </h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={adherenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {adherenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {adherenceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Adherence Trend
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  name="Adherence %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Medication History Table */}
      {medicationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Adherence by Medication
            </h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Medication
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Taken
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Missed
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Adherence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicationHistory.map((med) => (
                    <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {med.medicationName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <Badge variant="success">{med.taken}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <Badge variant="danger">{med.missed}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{
                                width: `${med.adherence}%`,
                              }}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-900">
                            {med.adherence}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </Layout>
  );
}
