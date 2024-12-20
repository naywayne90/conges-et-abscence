import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { QuotaAdjustmentModal } from '../components/QuotaAdjustmentModal';
import toast, { Toaster } from 'react-hot-toast';

interface QuotaData {
  id: string;
  employee_id: string;
  employee_name: string;
  total_days: number;
  used_days: number;
  department: string;
}

export const QuotaManagement: React.FC = () => {
  const [quotas, setQuotas] = useState<QuotaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuota, setSelectedQuota] = useState<QuotaData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof QuotaData;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    loadQuotas();
  }, []);

  const loadQuotas = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_quotas')
        .select(`
          id,
          employee_id,
          total_days,
          used_days,
          employees (
            name,
            department
          )
        `);

      if (error) throw error;

      const formattedData = data.map((quota) => ({
        id: quota.id,
        employee_id: quota.employee_id,
        employee_name: quota.employees.name,
        department: quota.employees.department,
        total_days: quota.total_days,
        used_days: quota.used_days,
      }));

      setQuotas(formattedData);
    } catch (error) {
      console.error('Erreur lors du chargement des quotas:', error);
      toast.error('Erreur lors du chargement des quotas');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof QuotaData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedQuotas = React.useMemo(() => {
    let sortableQuotas = [...quotas];
    if (searchTerm) {
      sortableQuotas = sortableQuotas.filter(
        (quota) =>
          quota.employee_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          quota.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortConfig !== null) {
      sortableQuotas.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableQuotas;
  }, [quotas, searchTerm, sortConfig]);

  const handleAdjustQuota = (quota: QuotaData) => {
    setSelectedQuota(quota);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Quotas de Congés
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les quotas de congés pour chaque employé
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="max-w-md">
            <label htmlFor="search" className="sr-only">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Rechercher par nom ou département..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tableau des quotas */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('employee_name')}
                  >
                    Employé
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('department')}
                  >
                    Département
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('total_days')}
                  >
                    Quota Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('used_days')}
                  >
                    Jours Utilisés
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Jours Restants
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : sortedQuotas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucun quota trouvé
                    </td>
                  </tr>
                ) : (
                  sortedQuotas.map((quota) => (
                    <motion.tr
                      key={quota.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {quota.employee_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quota.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quota.total_days} jours
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quota.used_days} jours
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quota.total_days - quota.used_days} jours
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleAdjustQuota(quota)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Modifier
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modale d'ajustement */}
      {selectedQuota && (
        <QuotaAdjustmentModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedQuota(null);
          }}
          quota={{
            id: selectedQuota.id,
            employeeId: selectedQuota.employee_id,
            employeeName: selectedQuota.employee_name,
            totalDays: selectedQuota.total_days,
          }}
          onQuotaUpdated={loadQuotas}
        />
      )}
    </div>
  );
};
