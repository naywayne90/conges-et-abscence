import { supabase } from '../lib/supabaseClient';

export interface DGPECRequest {
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
  created_at: string;
  updated_at: string;
  attachments: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    status: string;
    comments: string;
  }>;
  direction_validator: string;
  direction_comments: string;
  direction_validated_at: string;
}

export interface ValidationHistory {
  request_id: string;
  employee_name: string;
  type: string;
  action: string;
  validator_name: string;
  comments: string;
  created_at: string;
}

export const getDGPECPendingRequests = async (
  filterType?: string,
  filterDepartment?: string,
  filterStatus?: string
): Promise<DGPECRequest[]> => {
  try {
    const { data, error } = await supabase.rpc('get_dgpec_pending_requests', {
      filter_type: filterType,
      filter_department: filterDepartment,
      filter_status: filterStatus,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    throw error;
  }
};

export const getDGPECValidationHistory = async (): Promise<ValidationHistory[]> => {
  try {
    const { data, error } = await supabase.rpc('get_dgpec_validation_history');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
};

export const validateRequestDGPEC = async (
  requestId: string,
  validatorId: string,
  comments: string,
  status: 'validée_par_dgpec' | 'rejetée_par_dgpec',
  newStartDate?: Date,
  newEndDate?: Date
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('validate_request_dgpec', {
      request_id_param: requestId,
      validator_id_param: validatorId,
      comments_param: comments,
      new_status_param: status,
      new_start_date_param: newStartDate?.toISOString(),
      new_end_date_param: newEndDate?.toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    throw error;
  }
};
