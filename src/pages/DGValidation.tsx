import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getDGPendingRequests,
  validateRequestDG,
  DGPendingRequest,
} from '../services/dgValidationService';
import { WorkingDaysInfo } from '../components/WorkingDaysInfo';
import { calculateWorkingDays } from '../services/workingDaysService';

export const DGValidation: React.FC = () => {
  const [requests, setRequests] = useState<DGPendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DGPendingRequest | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState('');
  const [validationType, setValidationType] = useState<'approve' | 'reject' | null>(
    null
  );
  const [workingDaysInfo, setWorkingDaysInfo] = useState<any>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      calculateDays(selectedRequest);
    }
  }, [selectedRequest]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getDGPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = async (request: DGPendingRequest) => {
    try {
      const startDate = format(parseISO(request.start_date), 'yyyy-MM-dd');
      const endDate = format(parseISO(request.end_date), 'yyyy-MM-dd');
      
      const calculation = await calculateWorkingDays(startDate, endDate);
      setWorkingDaysInfo(calculation);
    } catch (error) {
      console.error('Erreur lors du calcul des jours:', error);
    }
  };

  const handleValidation = async () => {
    if (!selectedRequest || !validationType || !comments.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      await validateRequestDG(
        selectedRequest.id,
        comments,
        validationType === 'approve'
      );
      
      toast.success(
        validationType === 'approve'
          ? 'Demande approuvée avec succès'
          : 'Demande rejetée'
      );
      
      setShowModal(false);
      setSelectedRequest(null);
      setComments('');
      setValidationType(null);
      loadRequests();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Validation Direction Générale
          </h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validations
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aucune demande en attente de validation
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.employee_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {request.employee_department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(request.start_date), 'dd/MM/yyyy')} -{' '}
                        {format(parseISO(request.end_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.total_days} jour(s)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="mb-2">
                          <span className="font-medium">Direction :</span>
                          <br />
                          {request.direction_validation.validator} -{' '}
                          {format(
                            parseISO(request.direction_validation.date),
                            'Pp',
                            { locale: fr }
                          )}
                        </div>
                        <div>
                          <span className="font-medium">DGPEC :</span>
                          <br />
                          {request.dgpec_validation.validator} -{' '}
                          {format(
                            parseISO(request.dgpec_validation.date),
                            'Pp',
                            { locale: fr }
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setValidationType('approve');
                          setShowModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setValidationType('reject');
                          setShowModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Rejeter
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal de validation */}
      <AnimatePresence>
        {showModal && selectedRequest && (
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
                      {validationType === 'approve'
                        ? 'Valider la demande'
                        : 'Rejeter la demande'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedRequest.employee_name} - {selectedRequest.type}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Historique des validations
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Direction :</span>{' '}
                            {selectedRequest.direction_validation.comments}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">DGPEC :</span>{' '}
                            {selectedRequest.dgpec_validation.comments}
                          </p>
                        </div>
                      </div>
                    </div>

                    {workingDaysInfo && (
                      <WorkingDaysInfo
                        calculation={workingDaysInfo}
                        className="mb-4"
                      />
                    )}

                    <label
                      htmlFor="comments"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Commentaire
                    </label>
                    <textarea
                      id="comments"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Ajoutez un commentaire..."
                      required
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleValidation}
                    disabled={loading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${
                      validationType === 'approve'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Traitement...
                      </>
                    ) : validationType === 'approve' ? (
                      'Valider'
                    ) : (
                      'Rejeter'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
