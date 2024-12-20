-- Ajout des nouveaux statuts pour la DG
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'validée_finale';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'rejetée_finale';

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    request_id UUID REFERENCES leave_requests(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonction pour obtenir les demandes en attente de validation DG
CREATE OR REPLACE FUNCTION get_dg_pending_requests()
RETURNS TABLE (
    id UUID,
    employee_id UUID,
    employee_name TEXT,
    employee_department TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    type TEXT,
    status TEXT,
    reason TEXT,
    total_days INTEGER,
    direction_validation JSON,
    dgpec_validation JSON,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id,
        lr.employee_id,
        u.name AS employee_name,
        d.name AS employee_department,
        lr.start_date,
        lr.end_date,
        lr.type,
        lr.status,
        lr.reason,
        lr.total_days,
        (
            SELECT json_build_object(
                'validator', v1.name,
                'date', al1.created_at,
                'comments', al1.comments
            )
            FROM action_logs al1
            JOIN users v1 ON al1.user_id = v1.id
            WHERE al1.request_id = lr.id
            AND al1.action = 'validation_direction'
            ORDER BY al1.created_at DESC
            LIMIT 1
        ) AS direction_validation,
        (
            SELECT json_build_object(
                'validator', v2.name,
                'date', al2.created_at,
                'comments', al2.comments
            )
            FROM action_logs al2
            JOIN users v2 ON al2.user_id = v2.id
            WHERE al2.request_id = lr.id
            AND al2.action = 'validation_dgpec'
            ORDER BY al2.created_at DESC
            LIMIT 1
        ) AS dgpec_validation,
        lr.created_at
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN departments d ON u.department_id = d.id
    WHERE lr.status = 'validée_par_dgpec'
    ORDER BY lr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider une demande par la DG
CREATE OR REPLACE FUNCTION validate_request_dg(
    request_id_param UUID,
    validator_id_param UUID,
    comments_param TEXT,
    approved BOOLEAN
)
RETURNS void AS $$
DECLARE
    employee_id UUID;
    employee_name TEXT;
    request_type TEXT;
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Récupérer les informations de la demande
    SELECT 
        lr.employee_id,
        u.name,
        lr.type,
        lr.start_date,
        lr.end_date
    INTO 
        employee_id,
        employee_name,
        request_type,
        start_date,
        end_date
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    WHERE lr.id = request_id_param;

    -- Mettre à jour le statut
    UPDATE leave_requests
    SET 
        status = CASE WHEN approved THEN 'validée_finale' ELSE 'rejetée_finale' END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = request_id_param;

    -- Enregistrer l'action
    INSERT INTO action_logs (
        request_id,
        user_id,
        action,
        comments,
        created_at
    ) VALUES (
        request_id_param,
        validator_id_param,
        CASE WHEN approved THEN 'validation_finale' ELSE 'rejet_final' END,
        comments_param,
        CURRENT_TIMESTAMP
    );

    -- Créer une notification pour l'employé
    INSERT INTO notifications (
        user_id,
        request_id,
        title,
        message
    ) VALUES (
        employee_id,
        request_id_param,
        CASE 
            WHEN approved THEN 'Demande de congé approuvée'
            ELSE 'Demande de congé rejetée'
        END,
        CASE 
            WHEN approved THEN 
                format(
                    'Votre demande de %s du %s au %s a été approuvée par la Direction Générale.%sCommentaire : %s',
                    request_type,
                    to_char(start_date, 'DD/MM/YYYY'),
                    to_char(end_date, 'DD/MM/YYYY'),
                    E'\n\n',
                    comments_param
                )
            ELSE 
                format(
                    'Votre demande de %s du %s au %s a été rejetée par la Direction Générale.%sMotif : %s',
                    request_type,
                    to_char(start_date, 'DD/MM/YYYY'),
                    to_char(end_date, 'DD/MM/YYYY'),
                    E'\n\n',
                    comments_param
                )
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Politique de sécurité pour les notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_request_id ON notifications(request_id);
CREATE INDEX idx_notifications_read ON notifications(read);
