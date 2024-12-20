-- Ajout des nouveaux statuts pour la DGPEC
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'validée_par_dgpec';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'rejetée_par_dgpec';

-- Fonction pour obtenir les demandes à valider par la DGPEC
CREATE OR REPLACE FUNCTION get_dgpec_pending_requests(
    filter_type TEXT DEFAULT NULL,
    filter_department TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL
)
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
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    attachments JSON,
    direction_validator TEXT,
    direction_comments TEXT,
    direction_validated_at TIMESTAMP WITH TIME ZONE
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
        lr.created_at,
        lr.updated_at,
        (
            SELECT json_agg(json_build_object(
                'id', a.id,
                'file_name', a.file_name,
                'file_path', a.file_path,
                'file_type', a.file_type,
                'status', a.status,
                'comments', a.comments
            ))
            FROM attachments a
            WHERE a.request_id = lr.id
        ) AS attachments,
        v.name AS direction_validator,
        al.comments AS direction_comments,
        al.created_at AS direction_validated_at
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN departments d ON u.department_id = d.id
    LEFT JOIN action_logs al ON lr.id = al.request_id 
        AND al.action = 'validation_direction'
    LEFT JOIN users v ON al.user_id = v.id
    WHERE lr.status = 'validée_par_direction'
    AND (filter_type IS NULL OR lr.type = filter_type)
    AND (filter_department IS NULL OR d.name = filter_department)
    AND (filter_status IS NULL OR lr.status = filter_status)
    ORDER BY lr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'historique des validations DGPEC
CREATE OR REPLACE FUNCTION get_dgpec_validation_history()
RETURNS TABLE (
    request_id UUID,
    employee_name TEXT,
    type TEXT,
    action TEXT,
    validator_name TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id AS request_id,
        e.name AS employee_name,
        lr.type,
        al.action,
        v.name AS validator_name,
        al.comments,
        al.created_at
    FROM action_logs al
    JOIN leave_requests lr ON al.request_id = lr.id
    JOIN users e ON lr.employee_id = e.id
    JOIN users v ON al.user_id = v.id
    WHERE al.action IN ('validation_dgpec', 'rejet_dgpec')
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider une demande par la DGPEC
CREATE OR REPLACE FUNCTION validate_request_dgpec(
    request_id_param UUID,
    validator_id_param UUID,
    comments_param TEXT,
    new_status_param TEXT,
    new_start_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    new_end_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    action_type TEXT;
BEGIN
    -- Déterminer le type d'action
    action_type := CASE 
        WHEN new_status_param = 'validée_par_dgpec' THEN 'validation_dgpec'
        ELSE 'rejet_dgpec'
    END;

    -- Mettre à jour la demande
    UPDATE leave_requests
    SET 
        status = new_status_param,
        start_date = COALESCE(new_start_date_param, start_date),
        end_date = COALESCE(new_end_date_param, end_date),
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
        action_type,
        comments_param,
        CURRENT_TIMESTAMP
    );

    -- Recalculer les jours si les dates ont changé
    IF new_start_date_param IS NOT NULL OR new_end_date_param IS NOT NULL THEN
        PERFORM update_total_days(request_id_param);
    END IF;
END;
$$ LANGUAGE plpgsql;
