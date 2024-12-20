-- Ajout du champ priorité
ALTER TABLE leave_requests ADD COLUMN priority text DEFAULT 'Normale' CHECK (priority IN ('Urgente', 'Normale', 'Faible'));

-- Fonction pour calculer la priorité automatique
CREATE OR REPLACE FUNCTION calculate_priority()
RETURNS TRIGGER AS $$
DECLARE
    working_days INTEGER;
    current_date DATE;
BEGIN
    current_date := CURRENT_DATE;
    
    -- Calculer les jours ouvrables entre aujourd'hui et la date de début
    working_days := (
        SELECT COUNT(*)
        FROM generate_series(current_date, NEW.start_date, '1 day') AS date
        WHERE EXTRACT(DOW FROM date) NOT IN (0, 6) -- Exclure samedi (6) et dimanche (0)
    );

    -- Si moins de 3 jours ouvrables et la priorité n'a pas été modifiée manuellement
    IF working_days <= 3 AND (OLD IS NULL OR OLD.priority = NEW.priority) THEN
        NEW.priority := 'Urgente';
    ELSIF OLD IS NULL OR OLD.priority = NEW.priority THEN
        NEW.priority := 'Normale';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la priorité automatiquement
CREATE TRIGGER update_priority
    BEFORE INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION calculate_priority();

-- Index pour améliorer les performances des requêtes de filtrage
CREATE INDEX idx_leave_requests_priority ON leave_requests(priority);

-- Fonction pour mettre à jour manuellement la priorité
CREATE OR REPLACE FUNCTION update_request_priority(request_id UUID, new_priority text)
RETURNS void AS $$
BEGIN
    UPDATE leave_requests
    SET priority = new_priority,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;
