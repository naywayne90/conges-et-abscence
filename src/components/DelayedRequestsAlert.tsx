import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDelayedRequestsCount } from '../services/reminderService';

export const DelayedRequestsAlert: React.FC = () => {
  const [delayedCount, setDelayedCount] = useState(0);

  useEffect(() => {
    const loadDelayedCount = async () => {
      const count = await getDelayedRequestsCount();
      setDelayedCount(count);
    };

    loadDelayedCount();

    // Rafraîchir toutes les 30 minutes
    const interval = setInterval(loadDelayedCount, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (delayedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {delayedCount} demande{delayedCount > 1 ? 's' : ''} en attente
                depuis plus de 5 jours
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
