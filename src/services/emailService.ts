import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface EmailData {
  to: string;
  subject: string;
  content: string;
}

export interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (params: EmailParams) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

export const sendLeaveRequestNotification = async (
  employeeEmail: string,
  employeeName: string,
  status: 'validee_par_direction' | 'rejetee_par_direction',
  startDate: string,
  endDate: string,
  comment: string
) => {
  const subject =
    status === 'validee_par_direction'
      ? 'Votre demande de congé a été validée'
      : 'Votre demande de congé a été rejetée';

  const content = `
    Bonjour ${employeeName},

    ${
      status === 'validee_par_direction'
        ? 'Votre demande de congé a été validée par la direction.'
        : 'Votre demande de congé a été rejetée par la direction.'
    }

    Détails de la demande :
    - Période : du ${format(new Date(startDate), 'dd MMMM yyyy', {
      locale: fr,
    })} au ${format(new Date(endDate), 'dd MMMM yyyy', { locale: fr })}
    ${
      status === 'validee_par_direction'
        ? `- Nombre de jours : ${calculateBusinessDays(
            new Date(startDate),
            new Date(endDate)
          )}`
        : ''
    }
    
    Commentaire de la direction :
    ${comment}

    ${
      status === 'validee_par_direction'
        ? 'Nous vous souhaitons de bons congés.'
        : 'Pour plus d\'informations, veuillez contacter votre supérieur hiérarchique.'
    }

    Cordialement,
    L'équipe RH
  `;

  return sendEmail({
    to: employeeEmail,
    subject,
    text: content,
  });
};

export const sendReminderEmail = async (params: EmailParams) => {
  // Ajouter un style spécifique pour les emails de relance
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #991B1B; margin: 0 0 8px 0;">Relance : Action Requise</h2>
        <p style="color: #7F1D1D; margin: 0;">Une demande nécessite votre attention</p>
      </div>
      
      <div style="padding: 16px;">
        ${params.text.split('\n').map(line => `<p style="margin: 8px 0;">${line}</p>`).join('')}
      </div>
      
      <div style="background-color: #F3F4F6; padding: 16px; margin-top: 24px; border-radius: 4px;">
        <p style="color: #374151; margin: 0; font-size: 14px;">
          Cet email est envoyé automatiquement par le système de gestion des congés.
          Merci de ne pas y répondre directement.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    ...params,
    html: htmlContent,
  });
};

// Fonction utilitaire pour calculer les jours ouvrés
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}
