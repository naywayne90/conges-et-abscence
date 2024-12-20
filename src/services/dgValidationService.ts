import { supabase } from '../lib/supabaseClient';

export interface ValidationStep {
  validator: string;
  date: string;
  comments: string;
}

export interface DGPendingRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_department: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  reason: string;
  total_days: number;
  direction_validation: ValidationStep;
  dgpec_validation: ValidationStep;
  created_at: string;
}

export const getDGPendingRequests = async (): Promise<DGPendingRequest[]> => {
  try {
    const { data, error } = await supabase.rpc('get_dg_pending_requests');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    throw error;
  }
};

export const validateRequestDG = async (
  requestId: string,
  comments: string,
  approved: boolean
): Promise<void> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Utilisateur non connecté');

    const { error } = await supabase.rpc('validate_request_dg', {
      request_id_param: requestId,
      validator_id_param: user.data.user.id,
      comments_param: comments,
      approved,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    throw error;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    throw error;
  }
};
