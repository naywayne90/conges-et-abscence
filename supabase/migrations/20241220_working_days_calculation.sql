-- Fonction pour vérifier si une date est un jour de week-end
CREATE OR REPLACE FUNCTION is_weekend(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXTRACT(DOW FROM check_date) IN (0, 6); -- 0 = Dimanche, 6 = Samedi
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une date est un jour férié
CREATE OR REPLACE FUNCTION is_holiday(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public_holidays
        WHERE date = check_date
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les jours fériés dans une période
CREATE OR REPLACE FUNCTION get_holidays_in_period(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    date DATE,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.date,
        h.description
    FROM public_holidays h
    WHERE h.date BETWEEN start_date AND end_date
    ORDER BY h.date;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les jours ouvrables
CREATE OR REPLACE FUNCTION calculate_working_days(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    total_days INTEGER,
    working_days INTEGER,
    weekend_days INTEGER,
    holiday_days INTEGER,
    holidays JSON
) AS $$
DECLARE
    current_date DATE;
    total INTEGER := 0;
    working INTEGER := 0;
    weekends INTEGER := 0;
    holidays INTEGER := 0;
    holiday_list JSON;
BEGIN
    -- Calcul des jours fériés
    SELECT json_agg(json_build_object(
        'date', h.date,
        'description', h.description
    ))
    INTO holiday_list
    FROM get_holidays_in_period(start_date, end_date) h;

    -- Calcul jour par jour
    current_date := start_date;
    WHILE current_date <= end_date LOOP
        total := total + 1;
        
        IF is_weekend(current_date) THEN
            weekends := weekends + 1;
        ELSIF is_holiday(current_date) THEN
            holidays := holidays + 1;
        ELSE
            working := working + 1;
        END IF;
        
        current_date := current_date + 1;
    END LOOP;

    RETURN QUERY SELECT 
        total,
        working,
        weekends,
        holidays,
        COALESCE(holiday_list, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le nombre de jours de congé d'une demande
CREATE OR REPLACE FUNCTION update_total_days(request_id_param UUID)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    working_days INTEGER;
BEGIN
    -- Récupérer les dates de la demande
    SELECT 
        DATE(start_date),
        DATE(end_date)
    INTO 
        start_date,
        end_date
    FROM leave_requests
    WHERE id = request_id_param;

    -- Calculer les jours ouvrables
    SELECT wd.working_days
    INTO working_days
    FROM calculate_working_days(start_date, end_date) wd;

    -- Mettre à jour la demande
    UPDATE leave_requests
    SET 
        total_days = working_days,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = request_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le total des jours
CREATE OR REPLACE FUNCTION update_leave_request_days()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND 
        (OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date))
    THEN
        PERFORM update_total_days(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_request_days_update ON leave_requests;
CREATE TRIGGER leave_request_days_update
    AFTER INSERT OR UPDATE OF start_date, end_date
    ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_request_days();
