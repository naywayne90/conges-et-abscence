import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import DatePicker from 'react-datepicker';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Holiday {
  id: string;
  date: string;
  description: string;
}

interface HolidayManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HolidayManager: React.FC<HolidayManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHoliday, setNewHoliday] = useState<{
    date: Date | null;
    description: string;
  }>({
    date: null,
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadHolidays();
    }
  }, [isOpen]);

  const loadHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('public_holidays')
        .select('*')
        .order('date');

      if (error) throw error;

      setHolidays(data);
    } catch (error) {
      console.error('Erreur lors du chargement des jours fériés:', error);
      toast.error('Erreur lors du chargement des jours fériés');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { error } = await supabase.from('public_holidays').upsert({
        date: format(newHoliday.date, 'yyyy-MM-dd'),
        description: newHoliday.description.trim(),
      });

      if (error) throw error;

      toast.success('Jour férié ajouté avec succès');
      setNewHoliday({ date: null, description: '' });
      loadHolidays();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du jour férié:', error);
      toast.error('Erreur lors de l\'ajout du jour férié');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const { error } = await supabase
        .from('public_holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Jour férié supprimé');
      loadHolidays();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        >
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Gestion des Jours Fériés</h3>
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

            {/* Formulaire d'ajout */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Ajouter un jour férié
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <DatePicker
                    selected={newHoliday.date}
                    onChange={(date) =>
                      setNewHoliday({ ...newHoliday, date })
                    }
                    locale={fr}
                    dateFormat="dd/MM/yyyy"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholderText="Sélectionner une date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newHoliday.description}
                    onChange={(e) =>
                      setNewHoliday({
                        ...newHoliday,
                        description: e.target.value,
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: Fête de l'Indépendance"
                  />
                </div>
              </div>
              <button
                onClick={handleAddHoliday}
                className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ajouter
              </button>
            </div>

            {/* Liste des jours fériés */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
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
                      <td colSpan={3} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : holidays.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Aucun jour férié enregistré
                      </td>
                    </tr>
                  ) : (
                    holidays.map((holiday) => (
                      <motion.tr
                        key={holiday.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(parseISO(holiday.date), 'dd/MM/yyyy', {
                            locale: fr,
                          })}
                        </td>
                        <td className="px-6 py-4">{holiday.description}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
