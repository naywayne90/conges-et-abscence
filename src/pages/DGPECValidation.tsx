import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FileViewer } from '../components/FileViewer';
import { AttachmentsViewer } from '../components/AttachmentsViewer';
import {
  getDGPECPendingRequests,
  getDGPECValidationHistory,
  validateRequestDGPEC,
  DGPECRequest,
  ValidationHistory,
} from '../services/dgpecService';
import { getAttachments, downloadAttachment } from '../services/attachmentService';
import { supabase } from '../lib/supabaseClient';

export const DGPECValidation: React.FC = () => {
  const [requests, setRequests] = useState<DGPECRequest[]>([]);
  const [history, setHistory] = useState<ValidationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DGPECRequest | null>(
    null
  );
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState<
    'validate' | 'reject' | null
  >(null);
  const [newDates, setNewDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [filters, setFilters] = useState({
    type: '',
    department: '',
    status: '',
  });
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    type: string;
  } | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    if (selectedRequest) {
      loadAttachments(selectedRequest.id);
    }
  }, [selectedRequest]);

  const loadAttachments = async (requestId: string) => {
    try {
      const data = await getAttachments(requestId);
      setAttachments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces jointes:', error);
      toast.error('Erreur lors du chargement des pièces jointes');
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      await downloadAttachment(attachment);
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, historyData] = await Promise.all([
        getDGPECPendingRequests(
          filters.type || null,
          filters.department || null,
          filters.status || null
        ),
        getDGPECValidationHistory(),
      ]);

      setRequests(requestsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    if (!selectedRequest || !validationType || !validationComment.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Utilisateur non connecté');

      await validateRequestDGPEC(
        selectedRequest.id,
        user.data.user.id,
        validationComment,
        validationType === 'validate'
          ? 'validée_par_dgpec'
          : 'rejetée_par_dgpec',
        newDates.start || undefined,
        newDates.end || undefined
      );

      toast.success(
        validationType === 'validate'
          ? 'Demande validée avec succès'
          : 'Demande rejetée'
      );
      setShowValidationModal(false);
      setValidationComment('');
      setNewDates({ start: null, end: null });
      loadData();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Validation DGPEC
          </h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type de congé
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Tous</option>
                <option value="Congé annuel">Congé annuel</option>
                <option value="Congé maladie">Congé maladie</option>
                <option value="Congé familial">Congé familial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Département
              </label>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, department: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Tous</option>
                {/* Liste des départements */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Tous</option>
                <option value="validée_par_direction">
                  Validée par Direction
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Justificatifs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune demande à traiter
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
                      <div className="text-sm text-gray-900">
                        {format(new Date(request.start_date), 'dd/MM/yyyy')} -{' '}
                        {format(new Date(request.end_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.total_days} jour(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.employee_department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {request.attachments?.map((attachment) => (
                          <button
                            key={attachment.id}
                            onClick={() => {
                              setSelectedFile({
                                url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${attachment.file_path}`,
                                type: attachment.file_type,
                              });
                              setShowFileViewer(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                              />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setValidationType('validate');
                          setShowValidationModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setValidationType('reject');
                          setShowValidationModal(true);
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

        {/* Historique des validations */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Historique des Validations
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valideur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commentaires
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((entry) => (
                  <tr key={`${entry.request_id}-${entry.created_at}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(entry.created_at), 'Pp', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.action === 'validation_dgpec'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {entry.action === 'validation_dgpec'
                          ? 'Validé'
                          : 'Rejeté'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.validator_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.comments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de validation */}
      <AnimatePresence>
        {showValidationModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-10 inset-0 overflow-y-auto"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowValidationModal(false)}
              ></div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6"
              >
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {validationType === 'validate'
                        ? 'Valider la demande'
                        : 'Rejeter la demande'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedRequest.employee_name} - {selectedRequest.type}
                      </p>
                    </div>
                  </div>

                  {validationType === 'validate' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ajuster les dates (optionnel)
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-4">
                        <div>
                          <DatePicker
                            selected={newDates.start}
                            onChange={(date) =>
                              setNewDates((prev) => ({ ...prev, start: date }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholderText="Date de début"
                            dateFormat="dd/MM/yyyy"
                            locale={fr}
                          />
                        </div>
                        <div>
                          <DatePicker
                            selected={newDates.end}
                            onChange={(date) =>
                              setNewDates((prev) => ({ ...prev, end: date }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholderText="Date de fin"
                            dateFormat="dd/MM/yyyy"
                            locale={fr}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label
                      htmlFor="comment"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Commentaire
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="comment"
                        rows={4}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={validationComment}
                        onChange={(e) => setValidationComment(e.target.value)}
                        placeholder="Ajoutez un commentaire..."
                      />
                    </div>
                  </div>

                  {/* Section des pièces jointes */}
                  {attachments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Pièces Justificatives
                      </h4>
                      <AttachmentsViewer
                        attachments={attachments}
                        onDownload={handleDownload}
                      />
                    </div>
                  )}
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${
                      validationType === 'validate'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    }`}
                    onClick={handleValidation}
                  >
                    {validationType === 'validate' ? 'Valider' : 'Rejeter'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowValidationModal(false)}
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualiseur de fichiers */}
      <AnimatePresence>
        {showFileViewer && selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-10 inset-0 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75"
                onClick={() => setShowFileViewer(false)}
              ></div>

              <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowFileViewer(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Fermer</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-4">
                  <FileViewer file={selectedFile} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
