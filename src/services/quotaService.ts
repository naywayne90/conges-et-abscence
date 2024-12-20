import { supabase } from '../lib/supabaseClient';

export interface QuotaInfo {
  id: string;
  user_id: string;
  employee_name: string;
  department: string;
  category: string;
  quota_total: number;
  quota_used: number;
  quota_remaining: number;
  updated_at: string;
  last_adjustment?: {
    adjuster_name: string;
    date: string;
    comment: string;
  };
}

export interface QuotaAdjustment {
  user_id: string;
  quota_total?: number;
  quota_used?: number;
  comment: string;
}

export interface QuotaHistory {
  id: string;
  user_id: string;
  employee_name: string;
  adjuster_name: string;
  previous_total: number;
  new_total: number;
  previous_used: number;
  new_used: number;
  comment: string;
  created_at: string;
}

export const getQuotas = async (
  department?: string,
  category?: string
): Promise<QuotaInfo[]> => {
  try {
    let query = supabase
      .from('quotas')
      .select(
        `
        id,
        user_id,
        quota_total,
        quota_used,
        updated_at,
        users!quotas_user_id_fkey (
          name,
          department,
          category
        ),
        quota_adjustments (
          adjuster:users!quota_adjustments_adjuster_id_fkey(name),
          created_at,
          comment
        )
      `
      )
      .order('updated_at', { ascending: false });

    if (department) {
      query = query.eq('users.department', department);
    }

    if (category) {
      query = query.eq('users.category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((quota: any) => ({
      id: quota.id,
      user_id: quota.user_id,
      employee_name: quota.users.name,
      department: quota.users.department,
      category: quota.users.category,
      quota_total: quota.quota_total,
      quota_used: quota.quota_used,
      quota_remaining: quota.quota_total - quota.quota_used,
      updated_at: quota.updated_at,
      last_adjustment: quota.quota_adjustments[0]
        ? {
            adjuster_name: quota.quota_adjustments[0].adjuster.name,
            date: quota.quota_adjustments[0].created_at,
            comment: quota.quota_adjustments[0].comment,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des quotas:', error);
    throw error;
  }
};

export const adjustQuota = async (
  adjustment: QuotaAdjustment
): Promise<void> => {
  try {
    const { data: currentQuota, error: fetchError } = await supabase
      .from('quotas')
      .select('quota_total, quota_used')
      .eq('user_id', adjustment.user_id)
      .single();

    if (fetchError) throw fetchError;

    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Utilisateur non connecté');

    // Commencer une transaction
    const { error: updateError } = await supabase.rpc('adjust_quota', {
      p_user_id: adjustment.user_id,
      p_adjuster_id: user.data.user.id,
      p_new_total: adjustment.quota_total ?? currentQuota.quota_total,
      p_new_used: adjustment.quota_used ?? currentQuota.quota_used,
      p_comment: adjustment.comment,
    });

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Erreur lors de l\'ajustement du quota:', error);
    throw error;
  }
};

export const getQuotaHistory = async (
  userId: string
): Promise<QuotaHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('quota_adjustments')
      .select(
        `
        id,
        user_id,
        employee:users!quota_adjustments_user_id_fkey(name),
        adjuster:users!quota_adjustments_adjuster_id_fkey(name),
        previous_total,
        new_total,
        previous_used,
        new_used,
        comment,
        created_at
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((history: any) => ({
      id: history.id,
      user_id: history.user_id,
      employee_name: history.employee.name,
      adjuster_name: history.adjuster.name,
      previous_total: history.previous_total,
      new_total: history.new_total,
      previous_used: history.previous_used,
      new_used: history.new_used,
      comment: history.comment,
      created_at: history.created_at,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
};
