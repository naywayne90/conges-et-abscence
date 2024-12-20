import { supabase } from '../lib/supabaseClient';

export interface Attachment {
  id: string;
  filename: string;
  type: string;
  category: string;
  url: string;
  created_at: string;
  leave_request_id: string;
}

const BUCKET_NAME = 'leave-attachments';

export const getAttachments = async (
  leaveRequestId: string
): Promise<Attachment[]> => {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('leave_request_id', leaveRequestId);

    if (error) throw error;

    // Générer les URLs signées pour chaque pièce jointe
    const attachmentsWithUrls = await Promise.all(
      (attachments || []).map(async (attachment) => {
        const { data: urlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(`${attachment.leave_request_id}/${attachment.filename}`, 3600);

        return {
          ...attachment,
          url: urlData?.signedUrl || '',
        };
      })
    );

    return attachmentsWithUrls;
  } catch (error) {
    console.error('Erreur lors de la récupération des pièces jointes:', error);
    throw error;
  }
};

export const downloadAttachment = async (attachment: Attachment): Promise<void> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`${attachment.leave_request_id}/${attachment.filename}`);

    if (error) throw error;

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', attachment.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    throw error;
  }
};

export const uploadAttachment = async (
  file: File,
  leaveRequestId: string,
  category: string
): Promise<void> => {
  try {
    // Upload du fichier dans le storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${leaveRequestId}/${file.name}`, file);

    if (uploadError) throw uploadError;

    // Création de l'entrée dans la table attachments
    const { error: dbError } = await supabase.from('attachments').insert({
      filename: file.name,
      type: file.type,
      category,
      leave_request_id: leaveRequestId,
    });

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Erreur lors de l'upload du fichier:', error);
    throw error;
  }
};
