import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface PriorityBadgeProps {
  priority: string;
  requestId: string;
  canEdit: boolean;
  onUpdate?: () => void;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  requestId,
  canEdit,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Normale':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Faible':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const { error } = await supabase.rpc('update_request_priority', {
        request_id: requestId,
        new_priority: newPriority,
      });

      if (error) throw error;

      toast.success('Priorité mise à jour');
      onUpdate?.();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la priorité:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={canEdit ? { scale: 1.05 } : {}}
        onClick={() => canEdit && setIsEditing(true)}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
          priority
        )} ${canEdit ? 'cursor-pointer' : ''}`}
      >
        <span className="relative flex h-2 w-2 mr-1">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              priority === 'Urgente' ? 'bg-red-400' : ''
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              priority === 'Urgente'
                ? 'bg-red-500'
                : priority === 'Normale'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
          ></span>
        </span>
        {priority}
      </motion.div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
          >
            <div className="py-1" role="menu">
              {['Urgente', 'Normale', 'Faible'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    p === priority
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  role="menuitem"
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
