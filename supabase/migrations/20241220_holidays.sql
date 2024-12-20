-- Création de la table des jours fériés
CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des recherches par date
CREATE INDEX idx_public_holidays_date ON public_holidays(date);

-- Contrainte d'unicité sur la date
ALTER TABLE public_holidays ADD CONSTRAINT unique_holiday_date UNIQUE (date);

-- Fonction pour calculer les jours ouvrables en excluant les jours fériés
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    weekend_days INTEGER;
    holiday_days INTEGER;
BEGIN
    -- Calculer le nombre total de jours
    total_days := end_date - start_date + 1;
    
    -- Calculer le nombre de jours de weekend
    weekend_days := (
        SELECT COUNT(*)
        FROM generate_series(start_date, end_date, '1 day') AS date
        WHERE EXTRACT(DOW FROM date) IN (0, 6) -- 0 = Dimanche, 6 = Samedi
    );
    
    -- Calculer le nombre de jours fériés (excluant les weekends)
    holiday_days := (
        SELECT COUNT(DISTINCT h.date)
        FROM public_holidays h
        WHERE h.date BETWEEN start_date AND end_date
        AND EXTRACT(DOW FROM h.date) NOT IN (0, 6)
    );
    
    -- Retourner le nombre de jours ouvrables
    RETURN total_days - weekend_days - holiday_days;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les jours fériés dans une période
CREATE OR REPLACE FUNCTION get_holidays_in_period(start_date DATE, end_date DATE)
RETURNS TABLE (
    date DATE,
    description TEXT,
    is_weekend BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.date,
        h.description,
        EXTRACT(DOW FROM h.date) IN (0, 6) AS is_weekend
    FROM public_holidays h
    WHERE h.date BETWEEN start_date AND end_date
    ORDER BY h.date;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le nombre de jours dans les demandes
CREATE OR REPLACE FUNCTION update_leave_request_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_days := calculate_working_days(NEW.start_date, NEW.end_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_leave_days
    BEFORE INSERT OR UPDATE OF start_date, end_date ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_request_days();

-- Insertion des jours fériés ivoiriens pour 2024
INSERT INTO public_holidays (date, description) VALUES
    ('2024-01-01', 'Jour de l''An'),
    ('2024-04-01', 'Lundi de Pâques'),
    ('2024-05-01', 'Fête du Travail'),
    ('2024-05-09', 'Lendemain de la Korité'),
    ('2024-05-20', 'Lundi de Pentecôte'),
    ('2024-06-16', 'Lendemain de la Tabaski'),
    ('2024-08-07', 'Fête de l''Indépendance'),
    ('2024-08-15', 'Assomption'),
    ('2024-09-27', 'Maouloud'),
    ('2024-11-01', 'Toussaint'),
    ('2024-11-15', 'Journée Nationale de la Paix'),
    ('2024-12-25', 'Noël')
ON CONFLICT (date) DO UPDATE 
SET description = EXCLUDED.description;
