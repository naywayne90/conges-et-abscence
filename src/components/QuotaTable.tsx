import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuotaInfo, QuotaHistory } from '../services/quotaService';

interface QuotaTableProps {
  quotas: QuotaInfo[];
  onAdjust: (quota: QuotaInfo) => void;
  isLoading: boolean;
  departments: string[];
  categories: string[];
  selectedDepartment: string;
  selectedCategory: string;
  onDepartmentChange: (department: string) => void;
  onCategoryChange: (category: string) => void;
}

export const QuotaTable: React.FC<QuotaTableProps> = ({
  quotas,
  onAdjust,
  isLoading,
  departments,
  categories,
  selectedDepartment,
  selectedCategory,
  onDepartmentChange,
  onCategoryChange,
}) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Filtres */}
      <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-700"
            >
              Département
            </label>
            <select
              id="department"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
            >
              <option value="">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Catégorie
            </label>
            <select
              id="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Employé
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Département
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Catégorie
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Quota Total
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Utilisé
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Restant
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Dernier Ajustement
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
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                  </div>
                </td>
              </tr>
            ) : quotas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Aucun quota trouvé
                </td>
              </tr>
            ) : (
              quotas.map((quota) => (
                <motion.tr
                  key={quota.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {quota.employee_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {quota.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{quota.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {quota.quota_total} jours
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {quota.quota_used} jours
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-medium ${
                        quota.quota_remaining <= 5
                          ? 'text-red-600'
                          : quota.quota_remaining <= 10
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {quota.quota_remaining} jours
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {quota.last_adjustment ? (
                      <div className="text-sm text-gray-500">
                        <div>
                          Par {quota.last_adjustment.adjuster_name}
                        </div>
                        <div>
                          {format(
                            parseISO(quota.last_adjustment.date),
                            'Pp',
                            { locale: fr }
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onAdjust(quota)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Ajuster
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
