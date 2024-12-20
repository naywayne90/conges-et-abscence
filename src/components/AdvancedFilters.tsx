import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterOptions {
  leaveType: string;
  department: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  options: FilterOptions;
  departments: string[];
  leaveTypes: string[];
  onChange: (options: FilterOptions) => void;
  onClose: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  options,
  departments,
  leaveTypes,
  onChange,
  onClose,
}) => {
  const handleChange = (key: keyof FilterOptions, value: any) => {
    onChange({ ...options, [key]: value });
  };

  const handleReset = () => {
    onChange({
      leaveType: '',
      department: '',
      status: '',
      startDate: null,
      endDate: null,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filtres Avancés</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
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
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type de congé */}
            <div>
              <label
                htmlFor="leaveType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Type de congé
              </label>
              <select
                id="leaveType"
                value={options.leaveType}
                onChange={(e) => handleChange('leaveType', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Tous les types</option>
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Département */}
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Département
              </label>
              <select
                id="department"
                value={options.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Tous les départements</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Statut
              </label>
              <select
                id="status"
                value={options.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="validee_par_direction">Validée</option>
                <option value="rejetee_par_direction">Rejetée</option>
              </select>
            </div>

            {/* Période - Date de début */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date de début
              </label>
              <DatePicker
                id="startDate"
                selected={options.startDate}
                onChange={(date) => handleChange('startDate', date)}
                selectsStart
                startDate={options.startDate}
                endDate={options.endDate}
                locale={fr}
                dateFormat="dd/MM/yyyy"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholderText="Sélectionner une date"
              />
            </div>

            {/* Période - Date de fin */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date de fin
              </label>
              <DatePicker
                id="endDate"
                selected={options.endDate}
                onChange={(date) => handleChange('endDate', date)}
                selectsEnd
                startDate={options.startDate}
                endDate={options.endDate}
                minDate={options.startDate}
                locale={fr}
                dateFormat="dd/MM/yyyy"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholderText="Sélectionner une date"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Réinitialiser
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
