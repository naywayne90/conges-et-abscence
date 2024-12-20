import { supabase } from '../lib/supabaseClient';
import { sendEmail } from './emailService';

interface DelayedRequest {
  id: string;
  employee_name: string;
  employee_email: string;
  start_date: string;
  type: string;
  days_delayed: number;
  validator_id: string;
  validator_email: string;
}

export const checkDelayedRequests = async () => {
  try {
    const { data: delayedRequests, error } = await supabase.rpc(
      'get_delayed_requests'
    );

    if (error) throw error;

    // Envoyer les relances pour chaque demande en retard
    const reminderPromises = delayedRequests.map((request: DelayedRequest) =>
      sendReminder(request)
    );

    await Promise.all(reminderPromises);

    return delayedRequests;
  } catch (error) {
    console.error('Erreur lors de la vérification des demandes en retard:', error);
    throw error;
  }
};

export const sendReminder = async (request: DelayedRequest) => {
  try {
    // Préparer le message de relance
    const message = `
      Bonjour,
      
      La demande de ${request.type} de ${request.employee_name} n'a pas été traitée depuis ${request.days_delayed} jours ouvrables.
      
      Détails de la demande :
      - Type : ${request.type}
      - Date de début : ${new Date(request.start_date).toLocaleDateString('fr-FR')}
      - Employé : ${request.employee_name}
      
      Merci de prendre une décision rapidement.
      
      Cordialement,
      Le système de gestion des congés
    `;

    // Envoyer l'email
    await sendEmail({
      to: request.validator_email,
      subject: `Relance : Demande de ${request.type} en attente`,
      text: message,
    });

    // Enregistrer la relance
    await supabase.rpc('log_reminder', {
      p_request_id: request.id,
      p_sent_to: request.validator_id,
      p_reminder_type: 'email',
      p_message: message,
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la relance:', error);
    throw error;
  }
};

export const getDelayedRequestsCount = async () => {
  try {
    const { data: delayedRequests, error } = await supabase.rpc(
      'get_delayed_requests'
    );

    if (error) throw error;

    return delayedRequests.length;
  } catch (error) {
    console.error('Erreur lors du comptage des demandes en retard:', error);
    return 0;
  }
};
