import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileViewer } from '../components/FileViewer';
import { supabase } from '../lib/supabaseClient';
import { createNotification, sendLeaveRequestEmail } from '../services/notificationService';

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  comments: Array<{
    text: string;
    author: string;
    createdAt: string;
  }>;
  attachments: Array<{
    url: string;
    type: string;
    name: string;
  }>;
  total_days: number;
}

export const RequestDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees (
            id,
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setRequest(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la demande:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'validate' | 'reject') => {
    if (!comment.trim()) {
      alert('Le commentaire est obligatoire');
      return;
    }

    if (!request) return;

    setProcessing(true);
    try {
      const newStatus =
        action === 'validate'
          ? 'validee_par_direction'
          : 'rejetee_par_direction';

      // Mise à jour de la demande
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: newStatus,
          comments: [
            ...request.comments,
            {
              text: comment,
              author: 'Direction',
              createdAt: new Date().toISOString(),
            },
          ],
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Envoi de l'email
      await sendLeaveRequestEmail(
        request.employee.email,
        request.employee.name,
        newStatus,
        request.start_date,
        request.end_date,
        comment
      );

      // Création de la notification
      await createNotification({
        userId: request.employee.id,
        title: `Demande de congé ${
          action === 'validate' ? 'validée' : 'rejetée'
        }`,
        message: `Votre demande de congé du ${format(
          new Date(request.start_date),
          'dd/MM/yyyy',
          { locale: fr }
        )} au ${format(new Date(request.end_date), 'dd/MM/yyyy', {
          locale: fr,
        })} a été ${action === 'validate' ? 'validée' : 'rejetée'}.`,
        type: action === 'validate' ? 'success' : 'error',
      });

      router.push('/direction-validation');
    } catch (error) {
      console.error('Erreur lors du traitement de la demande:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Demande non trouvée</h1>
        <button
          onClick={() => router.push('/direction-validation')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de la Demande
          </h1>
          <button
            onClick={() => router.push('/direction-validation')}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* En-tête */}
          <div className="px-6 py-4 border-b">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {request.employee.name}
                </h2>
                <p className="text-gray-600">{request.type}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'en_attente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'validee_par_direction'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {request.status === 'en_attente'
                    ? 'En attente'
                    : request.status === 'validee_par_direction'
                    ? 'Validée'
                    : 'Rejetée'}
                </span>
              </div>
            </div>
          </div>

          {/* Informations principales */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Période</h3>
                <div className="bg-gray-50 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Du</span>
                    <span className="font-medium">
                      {format(new Date(request.start_date), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Au</span>
                    <span className="font-medium">
                      {format(new Date(request.end_date), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nombre de jours</span>
                    <span className="font-medium">{request.total_days}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Justificatifs</h3>
                <div className="bg-gray-50 rounded p-4">
                  {request.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {request.attachments.map((file, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <span className="truncate flex-1">{file.name}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedFile(file)}
                              className="text-indigo-600 hover:text-indigo-800"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <a
                              href={file.url}
                              download={file.name}
                              className="text-indigo-600 hover:text-indigo-800"
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">
                      Aucun justificatif fourni
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Historique des commentaires */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Commentaires</h3>
              <div className="space-y-4">
                {request.comments.map((comment, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{comment.author}</span>
                        <p className="mt-1 text-gray-600">{comment.text}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(
                          new Date(comment.createdAt),
                          'dd/MM/yyyy HH:mm',
                          { locale: fr }
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {request.status === 'en_attente' && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Action</h3>
                <div className="bg-gray-50 rounded p-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ajoutez un commentaire..."
                    className="w-full p-2 border rounded mb-4"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction('reject')}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Rejeter
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction('validate')}
                      disabled={processing}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Valider
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualiseur de fichiers */}
      <AnimatePresence>
        {selectedFile && (
          <FileViewer
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
