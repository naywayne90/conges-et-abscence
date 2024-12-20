import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  Holiday,
} from '../services/holidayService';

export const HolidaysManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    date: new Date(),
    description: '',
  });
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadHolidays();
  }, [year]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const data = await getHolidays(startDate, endDate);
      setHolidays(data);
    } catch (error) {
      console.error('Erreur lors du chargement des jours fériés:', error);
      toast.error('Erreur lors du chargement des jours fériés');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedDate = format(formData.date, 'yyyy-MM-dd');

      if (selectedHoliday) {
        await updateHoliday(
          selectedHoliday.id,
          formattedDate,
          formData.description
        );
        toast.success('Jour férié mis à jour avec succès');
      } else {
        await addHoliday(formattedDate, formData.description);
        toast.success('Jour férié ajouté avec succès');
      }

      setShowModal(false);
      setSelectedHoliday(null);
      setFormData({ date: new Date(), description: '' });
      loadHolidays();
    } catch (error: any) {
      toast.error(
        error.message || 'Une erreur est survenue lors de l\'enregistrement'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm('Êtes-vous sûr de vouloir supprimer ce jour férié ?')
    ) {
      try {
        await deleteHoliday(id);
        toast.success('Jour férié supprimé avec succès');
        loadHolidays();
      } catch (error) {
        toast.error('Erreur lors de la suppression du jour férié');
      }
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      date: parseISO(holiday.date),
      description: holiday.description,
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Jours Fériés
          </h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contrôles */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Année :
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => year + i - 2).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  )
                )}
              </select>
            </div>
            <button
              onClick={() => {
                setSelectedHoliday(null);
                setFormData({ date: new Date(), description: '' });
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajouter un jour férié
            </button>
          </div>
        </div>

        {/* Liste des jours fériés */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière modification
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aucun jour férié pour cette année
                  </td>
                </tr>
              ) : (
                holidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(holiday.date), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {holiday.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {holiday.created_by_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(parseISO(holiday.updated_at), 'Pp', {
                        locale: fr,
                      })}
                      <br />
                      <span className="text-xs">
                        par {holiday.updated_by_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(holiday)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal d'ajout/modification */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-10 inset-0 overflow-y-auto"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowModal(false)}
              ></div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              >
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedHoliday
                        ? 'Modifier le jour férié'
                        : 'Ajouter un jour férié'}
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date
                        </label>
                        <DatePicker
                          selected={formData.date}
                          onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              date: date || new Date(),
                            }))
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          dateFormat="dd/MM/yyyy"
                          locale={fr}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <input
                          type="text"
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                      >
                        {selectedHoliday ? 'Modifier' : 'Ajouter'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={() => setShowModal(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
