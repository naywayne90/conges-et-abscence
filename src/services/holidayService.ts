import { supabase } from '../lib/supabaseClient';

export interface Holiday {
  id: string;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  updated_by_name: string;
}

export const getHolidays = async (
  startDate?: string,
  endDate?: string
): Promise<Holiday[]> => {
  try {
    const { data, error } = await supabase.rpc('get_holidays', {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des jours fériés:', error);
    throw error;
  }
};

export const addHoliday = async (
  date: string,
  description: string
): Promise<string> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase.rpc('add_holiday', {
      holiday_date: date,
      holiday_description: description,
      user_id: user.data.user.id,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du jour férié:', error);
    throw error;
  }
};

export const updateHoliday = async (
  id: string,
  date: string,
  description: string
): Promise<void> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Utilisateur non connecté');

    const { error } = await supabase.rpc('update_holiday', {
      holiday_id: id,
      holiday_date: date,
      holiday_description: description,
      user_id: user.data.user.id,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du jour férié:', error);
    throw error;
  }
};

export const deleteHoliday = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('public_holidays')
      .delete()
      .match({ id });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du jour férié:', error);
    throw error;
  }
};
