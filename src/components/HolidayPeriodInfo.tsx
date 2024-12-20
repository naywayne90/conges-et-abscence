import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Holiday {
  date: string;
  description: string;
  is_weekend: boolean;
}

interface HolidayPeriodInfoProps {
  startDate: string;
  endDate: string;
}

export const HolidayPeriodInfo: React.FC<HolidayPeriodInfoProps> = ({
  startDate,
  endDate,
}) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolidays();
  }, [startDate, endDate]);

  const loadHolidays = async () => {
    try {
      const { data, error } = await supabase.rpc('get_holidays_in_period', {
        start_date: startDate,
        end_date: endDate,
      });

      if (error) throw error;

      setHolidays(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des jours fériés:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (holidays.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Jours fériés pendant la période
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              Les jours suivants ne seront pas comptabilisés comme jours de congé :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {holidays.map((holiday, index) => (
                <li key={index}>
                  {format(parseISO(holiday.date), 'EEEE d MMMM yyyy', {
                    locale: fr,
                  })}{' '}
                  - {holiday.description}
                  {holiday.is_weekend && (
                    <span className="text-gray-500 italic">
                      {' '}
                      (weekend)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
