import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { FileViewer } from './FileViewer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: string;
  comments: string;
  uploader_name: string;
  validator_name: string;
  created_at: string;
  updated_at: string;
}

interface AttachmentManagerProps {
  requestId: string;
  canValidate: boolean;
  onUpdate?: () => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  requestId,
  canValidate,
  onUpdate,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(
    null
  );

  useEffect(() => {
    loadAttachments();
  }, [requestId]);

  const loadAttachments = async () => {
    try {
      const { data, error } = await supabase.rpc('get_request_attachments', {
        request_id_param: requestId,
      });

      if (error) throw error;

      setAttachments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des justificatifs:', error);
      toast.error('Erreur lors du chargement des justificatifs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(0);
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `justificatifs/${requestId}/${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, selectedFile, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (uploadError) throw uploadError;

      // Create attachment record
      const { error: dbError } = await supabase.from('attachments').insert({
        request_id: requestId,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (dbError) throw dbError;

      toast.success('Fichier téléversé avec succès');
      setSelectedFile(null);
      loadAttachments();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploadProgress(0);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const zip = require('jszip')();
      const promises = attachments.map(async (attachment) => {
        const { data, error } = await supabase.storage
          .from('attachments')
          .download(attachment.file_path);

        if (error) throw error;

        zip.file(attachment.file_name, data);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `justificatifs_${requestId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleValidation = async (
    attachmentId: string,
    status: string,
    comments: string
  ) => {
    try {
      const { error } = await supabase.rpc('update_attachment_status', {
        attachment_id: attachmentId,
        new_status: status,
        validator_id: (await supabase.auth.getUser()).data.user?.id,
        comment_text: comments,
      });

      if (error) throw error;

      toast.success('Statut mis à jour');
      loadAttachments();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valide':
        return 'bg-green-100 text-green-800';
      case 'rejete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Section de téléversement */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Justificatifs
        </h3>

        <div className="flex items-center space-x-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Téléverser
          </button>
          {attachments.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tout télécharger
            </button>
          )}
        </div>

        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des justificatifs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
            </li>
          ) : attachments.length === 0 ? (
            <li className="p-4 text-center text-gray-500">
              Aucun justificatif
            </li>
          ) : (
            attachments.map((attachment) => (
              <motion.li
                key={attachment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icône selon le type de fichier */}
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Informations du fichier */}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {attachment.file_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(attachment.file_size)} •{' '}
                        {format(new Date(attachment.created_at), 'Pp', {
                          locale: fr,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Statut */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        attachment.status
                      )}`}
                    >
                      {attachment.status === 'valide'
                        ? 'Validé'
                        : attachment.status === 'rejete'
                        ? 'Rejeté'
                        : 'En attente'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAttachment(attachment);
                          setViewerOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Voir
                      </button>
                      {canValidate && attachment.status === 'en_attente' && (
                        <>
                          <button
                            onClick={() =>
                              handleValidation(attachment.id, 'valide', '')
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() =>
                              handleValidation(attachment.id, 'rejete', '')
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Commentaires */}
                {attachment.comments && (
                  <div className="mt-2 text-sm text-gray-500">
                    {attachment.comments}
                  </div>
                )}
              </motion.li>
            ))
          )}
        </ul>
      </div>

      {/* Visualiseur de fichier */}
      <AnimatePresence>
        {viewerOpen && selectedAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {selectedAttachment.file_name}
                </h3>
                <button
                  onClick={() => {
                    setViewerOpen(false);
                    setSelectedAttachment(null);
                  }}
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
              <div className="p-4 h-[calc(90vh-8rem)] overflow-auto">
                <FileViewer
                  file={{
                    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${selectedAttachment.file_path}`,
                    type: selectedAttachment.file_type,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
