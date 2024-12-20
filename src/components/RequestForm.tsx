import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  calculateWorkingDays,
  WorkingDaysCalculation,
} from '../services/workingDaysService';
import { WorkingDaysInfo } from './WorkingDaysInfo';

interface RequestFormProps {
  onSubmit: (data: {
    startDate: Date;
    endDate: Date;
    type: string;
    reason: string;
    totalDays: number;
  }) => Promise<void>;
  initialData?: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    reason?: string;
  };
}

export const RequestForm: React.FC<RequestFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    type: initialData?.type || 'Congé annuel',
    reason: initialData?.reason || '',
  });

  const [workingDays, setWorkingDays] = useState<WorkingDaysCalculation | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateDays();
  }, [formData.startDate, formData.endDate]);

  const calculateDays = async () => {
    try {
      const startDate = format(formData.startDate, 'yyyy-MM-dd');
      const endDate = format(formData.endDate, 'yyyy-MM-dd');
      
      const calculation = await calculateWorkingDays(startDate, endDate);
      setWorkingDays(calculation);
    } catch (error) {
      console.error('Erreur lors du calcul des jours:', error);
      toast.error('Erreur lors du calcul des jours');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workingDays) return;

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        totalDays: workingDays.working_days,
      });
      toast.success('Demande soumise avec succès');
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast.error('Erreur lors de la soumission de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Date de début
          </label>
          <DatePicker
            selected={formData.startDate}
            onChange={(date) =>
              setFormData((prev) => ({
                ...prev,
                startDate: date || new Date(),
              }))
            }
            selectsStart
            startDate={formData.startDate}
            endDate={formData.endDate}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            dateFormat="dd/MM/yyyy"
            locale={fr}
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            Date de fin
          </label>
          <DatePicker
            selected={formData.endDate}
            onChange={(date) =>
              setFormData((prev) => ({
                ...prev,
                endDate: date || new Date(),
              }))
            }
            selectsEnd
            startDate={formData.startDate}
            endDate={formData.endDate}
            minDate={formData.startDate}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            dateFormat="dd/MM/yyyy"
            locale={fr}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700"
        >
          Type de congé
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, type: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="Congé annuel">Congé annuel</option>
          <option value="Congé maladie">Congé maladie</option>
          <option value="Congé familial">Congé familial</option>
          <option value="Congé exceptionnel">Congé exceptionnel</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700"
        >
          Motif
        </label>
        <textarea
          id="reason"
          value={formData.reason}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, reason: e.target.value }))
          }
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Veuillez préciser le motif de votre demande..."
          required
        />
      </div>

      {workingDays && <WorkingDaysInfo calculation={workingDays} />}

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Soumission en cours...
            </>
          ) : (
            'Soumettre la demande'
          )}
        </motion.button>
      </div>
    </form>
  );
};
