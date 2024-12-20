import { supabase } from '../lib/supabaseClient';

export interface DGStats {
  total_requests: number;
  approved_requests: number;
  rejected_requests: number;
  pending_requests: number;
  average_processing_time_hours: number;
  approval_rate: number;
  rejection_rate: number;
}

export interface MonthlyStats {
  month: number;
  total_requests: number;
  approved_requests: number;
  rejected_requests: number;
  average_processing_time_hours: number;
}

export const getDGStats = async (
  startDate?: string,
  endDate?: string
): Promise<DGStats> => {
  try {
    const { data, error } = await supabase.rpc('get_dg_stats', {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

export const getDGMonthlyStats = async (
  year: number = new Date().getFullYear()
): Promise<MonthlyStats[]> => {
  try {
    const { data, error } = await supabase.rpc('get_dg_monthly_stats', {
      year,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques mensuelles:', error);
    throw error;
  }
};
