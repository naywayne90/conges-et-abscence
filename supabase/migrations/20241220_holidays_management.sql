-- Table des jours fériés
CREATE TABLE IF NOT EXISTS public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index pour améliorer les performances
CREATE UNIQUE INDEX idx_public_holidays_date ON public_holidays(date);
CREATE INDEX idx_public_holidays_created_by ON public_holidays(created_by);

-- Trigger pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_holiday_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_holidays_timestamp
    BEFORE UPDATE ON public_holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_holiday_timestamp();

-- Fonction pour vérifier les chevauchements
CREATE OR REPLACE FUNCTION check_holiday_overlap(
    check_date DATE,
    exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public_holidays
        WHERE date = check_date
        AND (exclude_id IS NULL OR id != exclude_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les jours fériés
CREATE OR REPLACE FUNCTION get_holidays(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by_name TEXT,
    updated_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.date,
        h.description,
        h.created_at,
        h.updated_at,
        c.name AS created_by_name,
        u.name AS updated_by_name
    FROM public_holidays h
    LEFT JOIN users c ON h.created_by = c.id
    LEFT JOIN users u ON h.updated_by = u.id
    WHERE (start_date IS NULL OR h.date >= start_date)
    AND (end_date IS NULL OR h.date <= end_date)
    ORDER BY h.date;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter un jour férié
CREATE OR REPLACE FUNCTION add_holiday(
    holiday_date DATE,
    holiday_description TEXT,
    user_id UUID
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    IF check_holiday_overlap(holiday_date) THEN
        RAISE EXCEPTION 'Un jour férié existe déjà à cette date';
    END IF;

    INSERT INTO public_holidays (
        date,
        description,
        created_by,
        updated_by
    ) VALUES (
        holiday_date,
        holiday_description,
        user_id,
        user_id
    ) RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour un jour férié
CREATE OR REPLACE FUNCTION update_holiday(
    holiday_id UUID,
    holiday_date DATE,
    holiday_description TEXT,
    user_id UUID
)
RETURNS void AS $$
BEGIN
    IF check_holiday_overlap(holiday_date, holiday_id) THEN
        RAISE EXCEPTION 'Un jour férié existe déjà à cette date';
    END IF;

    UPDATE public_holidays
    SET 
        date = holiday_date,
        description = holiday_description,
        updated_by = user_id
    WHERE id = holiday_id;
END;
$$ LANGUAGE plpgsql;

-- Politique de sécurité
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des jours fériés"
    ON public_holidays FOR SELECT
    USING (true);

CREATE POLICY "DGPEC peut modifier les jours fériés"
    ON public_holidays FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'dgpec'
        )
    );

-- Insérer les jours fériés ivoiriens pour 2024
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
ON CONFLICT (date) DO NOTHING;
