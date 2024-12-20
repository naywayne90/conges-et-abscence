import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  getValidatorStats,
  getMonthlyStats,
  getRequestTypeStats,
  ValidatorStats,
  MonthlyStats,
  RequestTypeStats,
} from '../services/performanceService';

export const PerformanceTracking: React.FC = () => {
  const [validatorStats, setValidatorStats] = useState<ValidatorStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [requestTypeStats, setRequestTypeStats] = useState<RequestTypeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date(),
  });

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [validators, monthly, types] = await Promise.all([
        getValidatorStats(
          dateRange.start.toISOString(),
          dateRange.end.toISOString()
        ),
        getMonthlyStats(6),
        getRequestTypeStats(
          dateRange.start.toISOString(),
          dateRange.end.toISOString()
        ),
      ]);

      setValidatorStats(validators);
      setMonthlyStats(monthly);
      setRequestTypeStats(types);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)} heures`;
    }
    const days = Math.round(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-8">
      {/* Filtres de date */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Période d'analyse</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date de début
            </label>
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  start: new Date(e.target.value),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date de fin
            </label>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  end: new Date(e.target.value),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Tableau des performances */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">
                Performance des Valideurs
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valideur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Demandes Traitées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temps Moyen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taux d'Approbation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      En Retard
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validatorStats.map((stat) => (
                    <tr key={stat.validator_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.validator_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {stat.validator_role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.total_requests}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stat.approved_requests} approuvées ·{' '}
                          {stat.rejected_requests} rejetées
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDuration(stat.average_time_hours)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            stat.approval_rate >= 70
                              ? 'text-green-600'
                              : stat.approval_rate >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.approval_rate}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stat.delayed_requests > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {stat.delayed_requests}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Évolution mensuelle */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">
                Évolution des Performances
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month_date"
                      tickFormatter={(date) =>
                        format(new Date(date), 'MMM yyyy', { locale: fr })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'average_time_hours'
                          ? formatDuration(value)
                          : `${value}${name === 'approval_rate' ? '%' : ''}`,
                        name === 'average_time_hours'
                          ? 'Temps moyen'
                          : name === 'approval_rate'
                          ? "Taux d'approbation"
                          : 'Demandes',
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_requests"
                      name="Demandes"
                      stroke="#6366F1"
                    />
                    <Line
                      type="monotone"
                      dataKey="approval_rate"
                      name="Taux d'approbation"
                      stroke="#10B981"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Statistiques par type */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">
                Performance par Type de Demande
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={requestTypeStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="request_type" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'average_time_hours'
                          ? formatDuration(value)
                          : `${value}${name === 'approval_rate' ? '%' : ''}`,
                        name === 'average_time_hours'
                          ? 'Temps moyen'
                          : name === 'approval_rate'
                          ? "Taux d'approbation"
                          : 'Total',
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="total_requests"
                      name="Total"
                      fill="#6366F1"
                    />
                    <Bar
                      dataKey="approval_rate"
                      name="Taux d'approbation"
                      fill="#10B981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
