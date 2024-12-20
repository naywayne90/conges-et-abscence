import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActionLog {
  id: string;
  role: string;
  userName: string;
  action: 'submission' | 'validation' | 'rejection' | 'modification';
  comment?: string;
  created_at: string;
  read_by: string[];
}

interface ActionTimelineProps {
  actions: ActionLog[];
  currentUserId: string;
  onMarkAsRead: (actionId: string) => void;
}

export const ActionTimeline: React.FC<ActionTimelineProps> = ({
  actions,
  currentUserId,
  onMarkAsRead,
}) => {
  const getActionIcon = (action: ActionLog['action']) => {
    switch (action) {
      case 'submission':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'validation':
        return (
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejection':
        return (
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
    }
  };

  const getActionColor = (action: ActionLog['action']) => {
    switch (action) {
      case 'submission':
        return 'bg-blue-100 border-blue-500';
      case 'validation':
        return 'bg-green-100 border-green-500';
      case 'rejection':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  const getActionText = (action: ActionLog['action']) => {
    switch (action) {
      case 'submission':
        return 'a soumis une demande';
      case 'validation':
        return 'a validé la demande';
      case 'rejection':
        return 'a rejeté la demande';
      default:
        return 'a modifié la demande';
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        <AnimatePresence>
          {actions.map((action, actionIdx) => (
            <motion.li
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: actionIdx * 0.1 }}
            >
              <div className="relative pb-8">
                {actionIdx !== actions.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ${getActionColor(
                      action.action
                    )} ring-8 ring-white`}
                  >
                    {getActionIcon(action.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                          {action.userName}
                        </span>{' '}
                        ({action.role}) {getActionText(action.action)}
                      </p>
                      <div className="ml-4 flex items-center space-x-2">
                        <time
                          dateTime={action.created_at}
                          className="text-sm text-gray-500"
                        >
                          {format(new Date(action.created_at), 'dd MMM yyyy à HH:mm', {
                            locale: fr,
                          })}
                        </time>
                        {!action.read_by.includes(currentUserId) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onMarkAsRead(action.id)}
                            className="flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                          >
                            Marquer comme lu
                          </motion.button>
                        )}
                      </div>
                    </div>
                    {action.comment && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-sm text-gray-700"
                      >
                        {action.comment}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};
