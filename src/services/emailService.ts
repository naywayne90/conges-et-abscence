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

export const sendEmail = async (emailData: EmailData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: JSON.stringify(emailData),
    });

    if (error) throw error;
    return data;
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
    content,
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
