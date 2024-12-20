import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { AbsenceStats } from '../components/AbsenceStats';
import toast, { Toaster } from 'react-hot-toast';

interface Absence {
  id: string;
  employee: {
    id: string;
    name: string;
    department: string;
  };
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  total_days: number;
}

interface DepartmentStats {
  department: string;
  totalAbsences: number;
  averagePerEmployee: number;
  employeeCount: number;
}

export const AbsenceTracking: React.FC = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Absence | 'employee.name' | 'employee.department';
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    loadAbsences();
    loadDepartmentStats();
  }, []);

  const loadAbsences = async () => {
    try {
      const { data, error } = await supabase
        .from('absences')
        .select(`
          id,
          start_date,
          end_date,
          reason,
          status,
          total_days,
          employee:employees (
            id,
            name,
            department
          )
        `);

      if (error) throw error;

      setAbsences(data);
    } catch (error) {
      console.error('Erreur lors du chargement des absences:', error);
      toast.error('Erreur lors du chargement des absences');
    }
  };

  const loadDepartmentStats = async () => {
    try {
      // Récupérer les statistiques par département
      const { data: absenceData, error: absenceError } = await supabase
        .from('absences')
        .select(`
          total_days,
          employee:employees (
            department
          )
        `);

      if (absenceError) throw absenceError;

      // Récupérer le nombre d'employés par département
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('department');

      if (employeeError) throw employeeError;

      // Calculer les statistiques
      const departmentCounts = employeeData.reduce((acc: any, curr) => {
        acc[curr.department] = (acc[curr.department] || 0) + 1;
        return acc;
      }, {});

      const absencesByDepartment = absenceData.reduce((acc: any, curr) => {
        const dept = curr.employee.department;
        if (!acc[dept]) {
          acc[dept] = {
            totalAbsences: 0,
            totalDays: 0,
          };
        }
        acc[dept].totalAbsences++;
        acc[dept].totalDays += curr.total_days;
        return acc;
      }, {});

      const stats = Object.entries(departmentCounts).map(
        ([department, count]) => ({
          department,
          totalAbsences: absencesByDepartment[department]?.totalAbsences || 0,
          averagePerEmployee:
            (absencesByDepartment[department]?.totalDays || 0) / Number(count),
          employeeCount: Number(count),
        })
      );

      setDepartmentStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Absence | 'employee.name' | 'employee.department') => {
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

  const filteredAndSortedAbsences = React.useMemo(() => {
    let filtered = [...absences];

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (absence) =>
          absence.employee.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          absence.employee.department
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          absence.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (absence) => absence.status === filterStatus
      );
    }

    // Trier
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Absence];
        let bValue: any = b[sortConfig.key as keyof Absence];

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
  }, [absences, searchTerm, filterStatus, sortConfig]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Suivi des Absences
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez et analysez les absences des employés
          </p>
        </div>

        {/* Statistiques */}
        <div className="mb-8">
          <AbsenceStats
            departmentStats={departmentStats}
            loading={loading}
          />
        </div>

        {/* Filtres */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
                placeholder="Rechercher par nom, département ou motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="validee">Validée</option>
              <option value="rejetee">Rejetée</option>
            </select>
          </div>
        </div>

        {/* Tableau des absences */}
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
                    onClick={() => handleSort('reason')}
                  >
                    Motif
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Statut
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
                ) : filteredAndSortedAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucune absence trouvée
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedAbsences.map((absence) => (
                    <motion.tr
                      key={absence.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {absence.employee.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {absence.employee.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(absence.start_date), 'dd/MM/yyyy', {
                            locale: fr,
                          })}{' '}
                          -{' '}
                          {format(new Date(absence.end_date), 'dd/MM/yyyy', {
                            locale: fr,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {absence.total_days} jour
                          {absence.total_days > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {absence.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            absence.status === 'en_attente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : absence.status === 'validee'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {absence.status === 'en_attente'
                            ? 'En attente'
                            : absence.status === 'validee'
                            ? 'Validée'
                            : 'Rejetée'}
                        </span>
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
