import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface EmailTemplate {
  subject: string;
  content: string;
}

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
}

export const createNotification = async (data: NotificationData) => {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        status: 'unread',
        action_url: data.actionUrl,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

export const sendLeaveRequestEmail = async (
  employeeEmail: string,
  employeeName: string,
  status: 'validee_par_direction' | 'rejetee_par_direction',
  startDate: string,
  endDate: string,
  comment: string
) => {
  const template = getEmailTemplate(
    employeeName,
    status,
    startDate,
    endDate,
    comment
  );

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: employeeEmail,
        subject: template.subject,
        content: template.content,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

const getEmailTemplate = (
  employeeName: string,
  status: string,
  startDate: string,
  endDate: string,
  comment: string
): EmailTemplate => {
  const isValidated = status === 'validee_par_direction';
  const formattedStartDate = format(new Date(startDate), 'dd MMMM yyyy', {
    locale: fr,
  });
  const formattedEndDate = format(new Date(endDate), 'dd MMMM yyyy', {
    locale: fr,
  });

  return {
    subject: isValidated
      ? '✅ Votre demande de congé a été validée'
      : '❌ Votre demande de congé a été rejetée',
    content: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: ${isValidated ? '#4CAF50' : '#f44336'};
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 0 0 5px 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${
                isValidated
                  ? 'Demande de congé validée'
                  : 'Demande de congé rejetée'
              }</h1>
            </div>
            <div class="content">
              <p>Bonjour ${employeeName},</p>
              
              <p>${
                isValidated
                  ? 'Votre demande de congé a été validée par la direction.'
                  : 'Votre demande de congé a été rejetée par la direction.'
              }</p>

              <h3>Détails de la demande :</h3>
              <ul>
                <li>Période : du ${formattedStartDate} au ${formattedEndDate}</li>
                ${
                  isValidated
                    ? `<li>Nombre de jours : ${calculateBusinessDays(
                        new Date(startDate),
                        new Date(endDate)
                      )}</li>`
                    : ''
                }
              </ul>

              <h3>Commentaire de la direction :</h3>
              <p style="background-color: #fff; padding: 15px; border-radius: 5px;">
                ${comment}
              </p>

              <p>${
                isValidated
                  ? 'Nous vous souhaitons de bons congés.'
                  : 'Pour plus d\'informations, veuillez contacter votre supérieur hiérarchique.'
              }</p>

              <p>Cordialement,<br>L'équipe RH</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
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
