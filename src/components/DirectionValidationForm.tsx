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

interface DirectionValidationFormProps {
  request: {
    id: string;
    startDate: Date;
    endDate: Date;
    type: string;
    reason: string;
    employeeName: string;
  };
  onValidate: (data: {
    requestId: string;
    startDate: Date;
    endDate: Date;
    comments: string;
    totalDays: number;
    approved: boolean;
  }) => Promise<void>;
}

export const DirectionValidationForm: React.FC<DirectionValidationFormProps> = ({
  request,
  onValidate,
}) => {
  const [formData, setFormData] = useState({
    startDate: request.startDate,
    endDate: request.endDate,
    comments: '',
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

  const handleValidation = async (approved: boolean) => {
    if (!workingDays) return;

    try {
      setLoading(true);
      await onValidate({
        requestId: request.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        comments: formData.comments,
        totalDays: workingDays.working_days,
        approved,
      });
      toast.success(
        approved ? 'Demande validée avec succès' : 'Demande rejetée'
      );
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Demande de {request.employeeName}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>{request.type}</p>
            <p className="mt-1">{request.reason}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
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
          <label className="block text-sm font-medium text-gray-700">
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
          htmlFor="comments"
          className="block text-sm font-medium text-gray-700"
        >
          Commentaires
        </label>
        <textarea
          id="comments"
          value={formData.comments}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, comments: e.target.value }))
          }
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Ajoutez vos commentaires..."
          required
        />
      </div>

      {workingDays && <WorkingDaysInfo calculation={workingDays} />}

      <div className="flex justify-end space-x-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={loading}
          onClick={() => handleValidation(false)}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Rejeter
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={loading}
          onClick={() => handleValidation(true)}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
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
              Validation en cours...
            </>
          ) : (
            'Valider'
          )}
        </motion.button>
      </div>
    </div>
  );
};
