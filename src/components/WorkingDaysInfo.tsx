import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WorkingDaysCalculation } from '../services/workingDaysService';

interface WorkingDaysInfoProps {
  calculation: WorkingDaysCalculation;
  className?: string;
}

export const WorkingDaysInfo: React.FC<WorkingDaysInfoProps> = ({
  calculation,
  className = '',
}) => {
  const {
    total_days,
    working_days,
    weekend_days,
    holiday_days,
    holidays,
  } = calculation;

  return (
    <div className={`rounded-lg bg-gray-50 p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Détail des jours
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total :</span>
          <span className="font-medium text-gray-900">{total_days} jour(s)</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Jours ouvrables :</span>
          <span className="font-medium text-gray-900">
            {working_days} jour(s)
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Week-ends :</span>
          <span className="font-medium text-gray-900">
            {weekend_days} jour(s)
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Jours fériés :</span>
          <span className="font-medium text-gray-900">
            {holiday_days} jour(s)
          </span>
        </div>

        {holiday_days > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Jours fériés exclus :
            </h4>
            <ul className="space-y-1">
              {holidays.map((holiday) => (
                <li
                  key={holiday.date}
                  className="text-sm text-gray-600 flex justify-between"
                >
                  <span>
                    {format(new Date(holiday.date), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </span>
                  <span className="text-gray-500">{holiday.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {holiday_days > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
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
                <h3 className="text-sm font-medium text-yellow-800">
                  Information importante
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Les jours fériés listés ci-dessus ne seront pas décomptés de
                    vos congés.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
