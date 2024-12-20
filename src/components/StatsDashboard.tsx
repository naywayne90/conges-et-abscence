import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-lg shadow p-6 ${color}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-opacity-10">{icon}</div>
    </div>
  </motion.div>
);

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
];

export const StatsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    validatedRequests: 0,
    rejectedRequests: 0,
    averageDays: 0,
  });
  const [leaveTypeData, setLeaveTypeData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  const loadStats = async () => {
    try {
      // Requête pour les statistiques globales
      const { data: requests, error: requestsError } = await supabase
        .from('leave_requests')
        .select('status, total_days');

      if (requestsError) throw requestsError;

      // Calcul des statistiques
      const totalRequests = requests.length;
      const validatedRequests = requests.filter(
        (r) => r.status === 'validee_par_direction'
      ).length;
      const rejectedRequests = requests.filter(
        (r) => r.status === 'rejetee_par_direction'
      ).length;
      const averageDays =
        requests.reduce((acc, curr) => acc + (curr.total_days || 0), 0) /
        totalRequests;

      setStats({
        totalRequests,
        validatedRequests,
        rejectedRequests,
        averageDays: Math.round(averageDays * 10) / 10,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadChartData = async () => {
    try {
      // Données pour le graphique des types de congés
      const { data: leaveTypes, error: leaveTypesError } = await supabase
        .from('leave_requests')
        .select('type, status');

      if (leaveTypesError) throw leaveTypesError;

      const typeStats = leaveTypes.reduce((acc: any, curr: any) => {
        if (!acc[curr.type]) {
          acc[curr.type] = 0;
        }
        acc[curr.type]++;
        return acc;
      }, {});

      setLeaveTypeData(
        Object.entries(typeStats).map(([name, value]) => ({
          name,
          value,
        }))
      );

      // Données pour le graphique des départements
      const { data: departments, error: departmentsError } = await supabase
        .from('leave_requests')
        .select(`
          total_days,
          employee:employees (
            department
          )
        `);

      if (departmentsError) throw departmentsError;

      const deptStats = departments.reduce((acc: any, curr: any) => {
        const dept = curr.employee.department;
        if (!acc[dept]) {
          acc[dept] = 0;
        }
        acc[dept] += curr.total_days;
        return acc;
      }, {});

      setDepartmentData(
        Object.entries(deptStats).map(([name, days]) => ({
          name,
          days,
        }))
      );
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total des Demandes"
          value={stats.totalRequests}
          icon={
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          color="bg-blue-50"
        />
        <StatsCard
          title="Demandes Validées"
          value={stats.validatedRequests}
          icon={
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
          color="bg-green-50"
        />
        <StatsCard
          title="Demandes Rejetées"
          value={stats.rejectedRequests}
          icon={
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
          color="bg-red-50"
        />
        <StatsCard
          title="Moyenne Jours/Employé"
          value={`${stats.averageDays} jours`}
          icon={
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          color="bg-purple-50"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Répartition des types de congés */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-medium mb-4">
            Répartition des Types de Congés
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    name,
                  }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    );
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Utilisation par département */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-medium mb-4">
            Jours de Congés par Département
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="days"
                  name="Jours de congés"
                  fill="#8884d8"
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
