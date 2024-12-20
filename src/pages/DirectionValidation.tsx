import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LeaveRequest, LeaveStatus, LeaveType } from '../types/leave';
import { AttachmentPreview } from '../components/AttachmentPreview';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DirectionValidation: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    url: string;
    type: string;
  } | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'validate' | 'reject' | null>(null);
  const [filters, setFilters] = useState({
    type: '' as LeaveType | '',
    status: '' as LeaveStatus | '',
    search: '',
    dateRange: {
      start: '',
      end: '',
    },
  });

  const itemsPerPage = 20;

  // Chargement initial des données
  useEffect(() => {
    loadLeaveRequests();
  }, []);

  // Filtrage des demandes
  useEffect(() => {
    let filtered = [...requests];

    if (filters.type) {
      filtered = filtered.filter((req) => req.leaveType === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter((req) => req.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.employee.name.toLowerCase().includes(search) ||
          req.employee.email.toLowerCase().includes(search)
      );
    }
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(
        (req) =>
          req.startDate >= filters.dateRange.start &&
          req.endDate <= filters.dateRange.end
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [filters, requests]);

  const loadLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, employee:employees(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data);
      setFilteredRequests(data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      // Ajouter une notification d'erreur ici
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: LeaveStatus) => {
    if (!comment.trim()) {
      alert('Le commentaire est obligatoire');
      return;
    }

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: newStatus,
          comments: supabase.sql`array_append(comments, ${JSON.stringify({
            text: comment,
            author: 'Direction', // À remplacer par l'utilisateur actuel
            createdAt: new Date().toISOString(),
          })})`,
        })
        .eq('id', requestId);

      if (error) throw error;

      await loadLeaveRequests();
      setCommentDialogOpen(false);
      setComment('');
      setSelectedRequest(null);
      setAction(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      // Ajouter une notification d'erreur ici
    }
  };

  const openCommentDialog = (request: LeaveRequest, action: 'validate' | 'reject') => {
    setSelectedRequest(request);
    setAction(action);
    setCommentDialogOpen(true);
  };

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Validation des Demandes de Congés</h1>

      {/* Filtres */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow-md md:grid-cols-4">
        <select
          className="rounded border p-2"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as LeaveType })}
        >
          <option value="">Tous les types</option>
          <option value="Annuel">Congé Annuel</option>
          <option value="Maladie">Congé Maladie</option>
          <option value="Décès">Congé Décès</option>
          <option value="Maternité">Congé Maternité</option>
          <option value="Spécial">Congé Spécial</option>
        </select>

        <select
          className="rounded border p-2"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as LeaveStatus })}
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee_par_direction">Validée</option>
          <option value="rejetee_par_direction">Rejetée</option>
        </select>

        <input
          type="text"
          placeholder="Rechercher un employé..."
          className="rounded border p-2"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <div className="flex gap-2">
          <input
            type="date"
            className="rounded border p-2"
            value={filters.dateRange.start}
            onChange={(e) =>
              setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, start: e.target.value },
              })
            }
          />
          <input
            type="date"
            className="rounded border p-2"
            value={filters.dateRange.end}
            onChange={(e) =>
              setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, end: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Tableau des demandes */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Employé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Justificatifs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {currentRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="font-medium text-gray-900">{request.employee.name}</div>
                  <div className="text-sm text-gray-500">{request.employee.email}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">{request.leaveType}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    {format(new Date(request.startDate), 'dd/MM/yyyy', { locale: fr })} -{' '}
                    {format(new Date(request.endDate), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.totalDays} jour(s)
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      request.status === 'en_attente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'validee_par_direction'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {request.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {request.attachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        onClick={() => setSelectedAttachment(attachment)}
                        className="rounded bg-gray-100 p-2 hover:bg-gray-200"
                      >
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {request.status === 'en_attente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCommentDialog(request, 'validate')}
                        className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => openCommentDialog(request, 'reject')}
                        className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="px-3 py-1">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {selectedAttachment && (
        <AttachmentPreview
          attachment={selectedAttachment}
          isOpen={!!selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}

      {/* Dialog de commentaire */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
              {action === 'validate' ? 'Valider' : 'Rejeter'} la demande
            </Dialog.Title>
            <div className="mt-4">
              <textarea
                className="w-full rounded border p-2"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Commentaire obligatoire..."
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded bg-gray-200 px-3 py-1"
                onClick={() => setCommentDialogOpen(false)}
              >
                Annuler
              </button>
              <button
                className={`rounded px-3 py-1 text-white ${
                  action === 'validate' ? 'bg-green-500' : 'bg-red-500'
                }`}
                onClick={() =>
                  selectedRequest &&
                  handleStatusChange(
                    selectedRequest.id,
                    action === 'validate'
                      ? 'validee_par_direction'
                      : 'rejetee_par_direction'
                  )
                }
              >
                Confirmer
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};
