-- Ajout des champs de relance dans la table leave_requests
ALTER TABLE leave_requests 
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN last_reminder_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reminder_count INTEGER DEFAULT 0;

-- Table pour l'historique des relances
CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    sent_to UUID NOT NULL REFERENCES auth.users(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reminder_type TEXT NOT NULL,
    message TEXT NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX idx_reminder_logs_request ON reminder_logs(request_id);
CREATE INDEX idx_reminder_logs_sent_to ON reminder_logs(sent_to);
CREATE INDEX idx_leave_requests_reminder ON leave_requests(reminder_sent, status);

-- Fonction pour calculer si une demande est en retard
CREATE OR REPLACE FUNCTION is_request_delayed(
    start_date TIMESTAMP WITH TIME ZONE,
    current_status TEXT,
    last_reminder TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    working_days INTEGER;
BEGIN
    IF current_status != 'en_attente' THEN
        RETURN FALSE;
    END IF;

    -- Calculer le nombre de jours ouvrables depuis la création
    working_days := (
        SELECT COUNT(*)
        FROM generate_series(
            DATE(start_date),
            CURRENT_DATE,
            '1 day'::interval
        ) AS date
        WHERE EXTRACT(DOW FROM date) NOT IN (0, 6) -- Exclure weekends
        AND date NOT IN (
            SELECT date
            FROM public_holidays
            WHERE date BETWEEN DATE(start_date) AND CURRENT_DATE
        )
    );

    -- Retourner vrai si plus de 5 jours ouvrables et pas de relance depuis 2 jours
    RETURN working_days >= 5 AND (
        last_reminder IS NULL OR
        CURRENT_TIMESTAMP - last_reminder > INTERVAL '2 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les demandes en retard
CREATE OR REPLACE FUNCTION get_delayed_requests()
RETURNS TABLE (
    id UUID,
    employee_name TEXT,
    employee_email TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    type TEXT,
    days_delayed INTEGER,
    validator_id UUID,
    validator_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id,
        e.name AS employee_name,
        e.email AS employee_email,
        lr.start_date,
        lr.type,
        (
            SELECT COUNT(*)
            FROM generate_series(
                DATE(lr.start_date),
                CURRENT_DATE,
                '1 day'::interval
            ) AS date
            WHERE EXTRACT(DOW FROM date) NOT IN (0, 6)
            AND date NOT IN (
                SELECT date
                FROM public_holidays
                WHERE date BETWEEN DATE(lr.start_date) AND CURRENT_DATE
            )
        ) AS days_delayed,
        v.id AS validator_id,
        v.email AS validator_email
    FROM leave_requests lr
    JOIN users e ON lr.employee_id = e.id
    LEFT JOIN users v ON (
        CASE 
            WHEN lr.type = 'Congé annuel' THEN 
                v.role = 'direction'
            ELSE 
                v.role = 'dgpec'
        END
    )
    WHERE lr.status = 'en_attente'
    AND is_request_delayed(lr.start_date, lr.status, lr.last_reminder_at);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour enregistrer une relance
CREATE OR REPLACE FUNCTION log_reminder(
    p_request_id UUID,
    p_sent_to UUID,
    p_reminder_type TEXT,
    p_message TEXT
)
RETURNS void AS $$
BEGIN
    -- Enregistrer la relance
    INSERT INTO reminder_logs (
        request_id,
        sent_to,
        reminder_type,
        message
    ) VALUES (
        p_request_id,
        p_sent_to,
        p_reminder_type,
        p_message
    );

    -- Mettre à jour la demande
    UPDATE leave_requests
    SET reminder_sent = TRUE,
        last_reminder_at = CURRENT_TIMESTAMP,
        reminder_count = reminder_count + 1
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql;
