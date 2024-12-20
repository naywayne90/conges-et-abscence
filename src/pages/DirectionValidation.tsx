import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LeaveRequest, LeaveStatus, LeaveType } from '../types/leave';
import { AttachmentPreview } from '../components/AttachmentPreview';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaveTimeline } from '../components/LeaveTimeline';
import { NotificationBell } from '../components/NotificationBell';
import { sendLeaveRequestNotification } from '../services/emailService';
import { ActionTimeline } from '../components/ActionTimeline';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedTimelineEvents, setSelectedTimelineEvents] = useState<TimelineEvent[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedActionLogs, setSelectedActionLogs] = useState<ActionLog[]>([]);
  const [showActionLogs, setShowActionLogs] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const itemsPerPage = 20;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (employee) {
          setCurrentUserId(employee.id);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

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
      const { data: request, error: requestError } = await supabase
        .from('leave_requests')
        .select('*, employee:employees(*)')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: newStatus,
          comments: supabase.sql`array_append(comments, ${JSON.stringify({
            text: comment,
            author: 'Direction',
            createdAt: new Date().toISOString(),
          })})`,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Envoi de l'email de notification
      await sendLeaveRequestNotification(
        request.employee.email,
        request.employee.name,
        newStatus,
        request.start_date,
        request.end_date,
        comment
      );

      await loadLeaveRequests();
      setCommentDialogOpen(false);
      setComment('');
      setSelectedRequest(null);
      setAction(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const openCommentDialog = (request: LeaveRequest, action: 'validate' | 'reject') => {
    setSelectedRequest(request);
    setAction(action);
    setCommentDialogOpen(true);
  };

  const loadLeaveHistory = async (leaveId: string) => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('leave_request_id', leaveId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const events = notifications.map((notification) => ({
        id: notification.id,
        date: notification.created_at,
        type: notification.action_type,
        user: {
          name: notification.action_by_name,
          role: notification.action_by_role,
        },
        comment: notification.message,
      }));

      setSelectedTimelineEvents(events);
      setShowTimeline(true);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const loadActionLogs = async (leaveId: string) => {
    try {
      const { data: logs, error } = await supabase
        .from('action_logs')
        .select(`
          *,
          user:user_id (
            name
          )
        `)
        .eq('leave_request_id', leaveId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLogs = logs.map(log => ({
        id: log.id,
        role: log.role,
        userName: log.user.name,
        action: log.action,
        comment: log.comment,
        created_at: log.created_at,
        read_by: log.read_by || []
      }));

      setSelectedActionLogs(formattedLogs);
      setShowActionLogs(true);
    } catch (error) {
      console.error('Erreur lors du chargement des actions:', error);
    }
  };

  const handleMarkAsRead = async (actionId: string) => {
    try {
      const { error } = await supabase.rpc('mark_action_as_read', {
        p_action_id: actionId,
        p_user_id: currentUserId
      });

      if (error) throw error;

      setSelectedActionLogs(current =>
        current.map(log =>
          log.id === actionId
            ? { ...log, read_by: [...log.read_by, currentUserId] }
            : log
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Validation des Demandes de Congés</h1>
        <NotificationBell />
      </div>

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
                  <button
                    onClick={() => loadLeaveHistory(request.id)}
                    className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                  >
                    Historique
                  </button>
                  <button
                    onClick={() => loadActionLogs(request.id)}
                    className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                  >
                    Actions
                  </button>
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

      {/* Timeline Dialog */}
      <Dialog
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl rounded-lg bg-white p-6">
            <Dialog.Title className="mb-4 text-lg font-medium">
              Historique de la demande
            </Dialog.Title>
            <LeaveTimeline events={selectedTimelineEvents} />
            <div className="mt-4 flex justify-end">
              <button
                className="rounded bg-gray-200 px-4 py-2"
                onClick={() => setShowTimeline(false)}
              >
                Fermer
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Action Logs Dialog */}
      <AnimatePresence>
        {showActionLogs && (
          <Dialog
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            open={showActionLogs}
            onClose={() => setShowActionLogs(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel
                as={motion.div}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-xl"
              >
                <Dialog.Title className="mb-4 text-lg font-medium">
                  Historique des Actions
                </Dialog.Title>
                <div className="max-h-[60vh] overflow-y-auto">
                  <ActionTimeline
                    actions={selectedActionLogs}
                    currentUserId={currentUserId}
                    onMarkAsRead={handleMarkAsRead}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                    onClick={() => setShowActionLogs(false)}
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

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
