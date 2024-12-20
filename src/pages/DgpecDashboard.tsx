import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HolidayManager } from '../components/HolidayManager';
import toast, { Toaster } from 'react-hot-toast';

export const DgpecDashboard: React.FC = () => {
  const [showHolidayManager, setShowHolidayManager] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de Bord DGPEC
          </h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Carte pour la gestion des jours fériés */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Jours Fériés
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-semibold text-gray-900">
                        Gérer les jours fériés
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button
                  onClick={() => setShowHolidayManager(true)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ouvrir le gestionnaire &rarr;
                </button>
              </div>
            </div>
          </motion.div>

          {/* Autres cartes pour les fonctionnalités DGPEC */}
          {/* ... */}
        </div>
      </main>

      {/* Modal du gestionnaire de jours fériés */}
      <HolidayManager
        isOpen={showHolidayManager}
        onClose={() => setShowHolidayManager(false)}
      />
    </div>
  );
};
