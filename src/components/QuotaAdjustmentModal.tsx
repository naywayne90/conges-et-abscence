import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface QuotaAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quota: {
    id: string;
    employeeId: string;
    employeeName: string;
    totalDays: number;
  };
  onQuotaUpdated: () => void;
}

export const QuotaAdjustmentModal: React.FC<QuotaAdjustmentModalProps> = ({
  isOpen,
  onClose,
  quota,
  onQuotaUpdated,
}) => {
  const [newQuota, setNewQuota] = useState(quota.totalDays.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Le motif d\'ajustement est obligatoire');
      return;
    }

    const newQuotaNumber = parseInt(newQuota);
    if (isNaN(newQuotaNumber) || newQuotaNumber < 0) {
      toast.error('Le quota doit être un nombre positif');
      return;
    }

    setLoading(true);
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Créer l'ajustement
      const { error: adjustmentError } = await supabase
        .from('quota_adjustments')
        .insert({
          quota_id: quota.id,
          previous_total: quota.totalDays,
          new_total: newQuotaNumber,
          reason,
          adjusted_by: user.id,
        });

      if (adjustmentError) throw adjustmentError;

      // Mettre à jour le quota
      const { error: updateError } = await supabase
        .from('leave_quotas')
        .update({ total_days: newQuotaNumber })
        .eq('id', quota.id);

      if (updateError) throw updateError;

      toast.success('Quota mis à jour avec succès');
      onQuotaUpdated();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du quota:', error);
      toast.error('Erreur lors de la mise à jour du quota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Ajuster le quota de {quota.employeeName}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="newQuota"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nouveau quota (jours)
                  </label>
                  <input
                    type="number"
                    id="newQuota"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Motif d'ajustement
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Mise à jour...' : 'Valider'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
