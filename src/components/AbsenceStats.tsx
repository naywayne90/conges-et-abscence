import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface DepartmentStats {
  department: string;
  totalAbsences: number;
  averagePerEmployee: number;
  employeeCount: number;
}

interface AbsenceStatsProps {
  departmentStats: DepartmentStats[];
  loading: boolean;
}

export const AbsenceStats: React.FC<AbsenceStatsProps> = ({
  departmentStats,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Statistiques par département */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-medium mb-4">Absences par Département</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="totalAbsences"
                name="Total des absences"
                fill="#8884d8"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Moyenne par employé */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-medium mb-4">
          Moyenne des Absences par Employé
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="averagePerEmployee"
                name="Moyenne par employé"
                fill="#82ca9d"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Résumé des statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {departmentStats.map((stat) => (
          <div
            key={stat.department}
            className="bg-white rounded-lg shadow p-4"
          >
            <h4 className="text-sm font-medium text-gray-500">
              {stat.department}
            </h4>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-semibold">{stat.totalAbsences}</p>
                <p className="text-sm text-gray-500">Total absences</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stat.averagePerEmployee.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">Moyenne/employé</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
