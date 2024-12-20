import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { AdvancedFilters } from '../components/AdvancedFilters';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    department: string;
  };
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  total_days: number;
  created_at: string;
}

interface FilterOptions {
  leaveType: string;
  department: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

export const RequestList: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    leaveType: '',
    department: '',
    status: '',
    startDate: null,
    endDate: null,
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LeaveRequest | 'employee.name' | 'employee.department';
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    loadRequests();
    loadMetadata();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          type,
          start_date,
          end_date,
          status,
          total_days,
          created_at,
          employee:employees (
            id,
            name,
            department
          )
        `);

      if (error) throw error;

      setRequests(data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      // Charger les départements uniques
      const { data: deptData, error: deptError } = await supabase
        .from('employees')
        .select('department')
        .distinct();

      if (deptError) throw deptError;

      setDepartments(deptData.map((d) => d.department).sort());

      // Charger les types de congés uniques
      const { data: typeData, error: typeError } = await supabase
        .from('leave_requests')
        .select('type')
        .distinct();

      if (typeError) throw typeError;

      setLeaveTypes(typeData.map((t) => t.type).sort());
    } catch (error) {
      console.error('Erreur lors du chargement des métadonnées:', error);
    }
  };

  const handleSort = (key: keyof LeaveRequest | 'employee.name' | 'employee.department') => {
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

  const filteredAndSortedRequests = React.useMemo(() => {
    let filtered = [...requests];

    // Appliquer les filtres
    if (filterOptions.leaveType) {
      filtered = filtered.filter(
        (request) => request.type === filterOptions.leaveType
      );
    }

    if (filterOptions.department) {
      filtered = filtered.filter(
        (request) =>
          request.employee.department === filterOptions.department
      );
    }

    if (filterOptions.status) {
      filtered = filtered.filter(
        (request) => request.status === filterOptions.status
      );
    }

    if (filterOptions.startDate) {
      filtered = filtered.filter(
        (request) =>
          new Date(request.start_date) >= filterOptions.startDate
      );
    }

    if (filterOptions.endDate) {
      filtered = filtered.filter(
        (request) =>
          new Date(request.end_date) <= filterOptions.endDate
      );
    }

    // Appliquer le tri
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof LeaveRequest];
        let bValue: any = b[sortConfig.key as keyof LeaveRequest];

        // Gérer les propriétés imbriquées
        if (sortConfig.key === 'employee.name') {
          aValue = a.employee.name;
          bValue = b.employee.name;
        } else if (sortConfig.key === 'employee.department') {
          aValue = a.employee.department;
          bValue = b.employee.department;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [requests, filterOptions, sortConfig]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'validee_par_direction':
        return 'bg-green-100 text-green-800';
      case 'rejetee_par_direction':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'En attente';
      case 'validee_par_direction':
        return 'Validée';
      case 'rejetee_par_direction':
        return 'Rejetée';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Liste des Demandes
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                {filteredAndSortedRequests.length} demande
                {filteredAndSortedRequests.length > 1 ? 's' : ''} trouvée
                {filteredAndSortedRequests.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtres avancés
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        <AdvancedFilters
          isOpen={showFilters}
          options={filterOptions}
          departments={departments}
          leaveTypes={leaveTypes}
          onChange={setFilterOptions}
          onClose={() => setShowFilters(false)}
        />

        {/* Liste des demandes */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('employee.name')}
                  >
                    Employé
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('employee.department')}
                  >
                    Département
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('start_date')}
                  >
                    Période
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('total_days')}
                  >
                    Durée
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.employee.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.employee.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(request.start_date), 'dd/MM/yyyy', {
                            locale: fr,
                          })}{' '}
                          -{' '}
                          {format(new Date(request.end_date), 'dd/MM/yyyy', {
                            locale: fr,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.total_days} jour
                          {request.total_days > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/requests/${request.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Voir détails
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
