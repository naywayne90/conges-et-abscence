import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuotaHistory as QuotaHistoryType } from '../services/quotaService';

interface QuotaHistoryProps {
  history: QuotaHistoryType[];
  isLoading: boolean;
}

export const QuotaHistory: React.FC<QuotaHistoryProps> = ({
  history,
  isLoading,
}) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Historique des Ajustements
        </h3>
      </div>
      <div className="border-t border-gray-200">
        {isLoading ? (
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
            Aucun ajustement trouvé
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {history.map((item) => (
              <li key={item.id} className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        Ajusté par {item.adjuster_name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {format(parseISO(item.created_at), 'Pp', {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Quota Total:{' '}
                          <span
                            className={`ml-1 font-medium ${
                              item.new_total > item.previous_total
                                ? 'text-green-600'
                                : item.new_total < item.previous_total
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.previous_total} → {item.new_total} jours
                          </span>
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Quota Utilisé:{' '}
                          <span
                            className={`ml-1 font-medium ${
                              item.new_used > item.previous_used
                                ? 'text-red-600'
                                : item.new_used < item.previous_used
                                ? 'text-green-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.previous_used} → {item.new_used} jours
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{item.comment}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
