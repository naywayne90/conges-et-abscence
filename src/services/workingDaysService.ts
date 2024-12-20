import { supabase } from '../lib/supabaseClient';

export interface WorkingDaysCalculation {
  total_days: number;
  working_days: number;
  weekend_days: number;
  holiday_days: number;
  holidays: Array<{
    date: string;
    description: string;
  }>;
}

export const calculateWorkingDays = async (
  startDate: string,
  endDate: string
): Promise<WorkingDaysCalculation> => {
  try {
    const { data, error } = await supabase.rpc('calculate_working_days', {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;

    return {
      total_days: data.total_days,
      working_days: data.working_days,
      weekend_days: data.weekend_days,
      holiday_days: data.holiday_days,
      holidays: data.holidays || [],
    };
  } catch (error) {
    console.error('Erreur lors du calcul des jours ouvrables:', error);
    throw error;
  }
};

export const formatWorkingDaysMessage = (calculation: WorkingDaysCalculation): string => {
  const { total_days, working_days, weekend_days, holiday_days, holidays } = calculation;
  
  let message = `Période de ${total_days} jour(s) :\n`;
  message += `- ${working_days} jour(s) ouvrable(s)\n`;
  message += `- ${weekend_days} jour(s) de week-end\n`;
  
  if (holiday_days > 0) {
    message += `- ${holiday_days} jour(s) férié(s) :\n`;
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      message += `  • ${date.toLocaleDateString('fr-FR')} : ${holiday.description}\n`;
    });
  }
  
  return message;
};

export const getHolidayWarningMessage = (holidays: Array<{ date: string; description: string }>): string => {
  if (holidays.length === 0) return '';

  let message = 'Cette période inclut les jours fériés suivants qui ne seront pas décomptés :\n';
  holidays.forEach(holiday => {
    const date = new Date(holiday.date);
    message += `- ${date.toLocaleDateString('fr-FR')} : ${holiday.description}\n`;
  });

  return message;
};
