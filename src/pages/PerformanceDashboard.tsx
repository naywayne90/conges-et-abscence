import React from 'react';
import { PerformanceTracking } from '../components/PerformanceTracking';

export const PerformanceDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Tableau de Bord des Performances
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="prose max-w-none mb-8">
            <p className="text-gray-500">
              Ce tableau de bord présente les statistiques de performance des
              valideurs, y compris les temps de traitement, les taux
              d'approbation et l'évolution dans le temps.
            </p>
          </div>

          <PerformanceTracking />
        </div>
      </main>
    </div>
  );
};
