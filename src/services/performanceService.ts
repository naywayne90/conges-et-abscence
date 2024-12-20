import { supabase } from '../lib/supabaseClient';

export interface ValidatorStats {
  validator_id: string;
  validator_name: string;
  validator_role: string;
  total_requests: number;
  approved_requests: number;
  rejected_requests: number;
  pending_requests: number;
  average_time_hours: number;
  approval_rate: number;
  delayed_requests: number;
}

export interface MonthlyStats {
  month_date: string;
  role: string;
  total_requests: number;
  average_time_hours: number;
  approval_rate: number;
}

export interface RequestTypeStats {
  request_type: string;
  total_requests: number;
  average_time_hours: number;
  approval_rate: number;
}

export const getValidatorStats = async (
  startDate?: string,
  endDate?: string
): Promise<ValidatorStats[]> => {
  try {
    const { data, error } = await supabase.rpc('get_validator_stats', {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

export const getMonthlyStats = async (
  monthsBack: number = 6
): Promise<MonthlyStats[]> => {
  try {
    const { data, error } = await supabase.rpc('get_monthly_stats', {
      months_back: monthsBack,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques mensuelles:', error);
    throw error;
  }
};

export const getRequestTypeStats = async (
  startDate?: string,
  endDate?: string
): Promise<RequestTypeStats[]> => {
  try {
    const { data, error } = await supabase.rpc('get_request_type_stats', {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par type:', error);
    throw error;
  }
};
