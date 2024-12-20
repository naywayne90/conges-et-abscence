-- Table pour stocker les informations des justificatifs
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    status TEXT DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'valide', 'rejete')),
    comments TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    validated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_attachments_request ON attachments(request_id);
CREATE INDEX idx_attachments_status ON attachments(status);

-- Fonction pour mettre à jour le statut d'un justificatif
CREATE OR REPLACE FUNCTION update_attachment_status(
    attachment_id UUID,
    new_status TEXT,
    validator_id UUID,
    comment_text TEXT
)
RETURNS void AS $$
BEGIN
    UPDATE attachments
    SET status = new_status,
        validated_by = validator_id,
        comments = comment_text,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = attachment_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_attachment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attachments_timestamp
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_attachment_timestamp();

-- Politique de sécurité pour les justificatifs
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employés peuvent voir leurs propres justificatifs"
    ON attachments FOR SELECT
    USING (
        auth.uid() IN (
            SELECT uploaded_by FROM attachments WHERE id = attachments.id
            UNION
            SELECT employee_id FROM leave_requests WHERE id = attachments.request_id
        )
    );

CREATE POLICY "Direction et DGPEC peuvent tout voir"
    ON attachments FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('direction', 'dgpec')
        )
    );

-- Fonction pour obtenir tous les justificatifs d'une demande
CREATE OR REPLACE FUNCTION get_request_attachments(request_id_param UUID)
RETURNS TABLE (
    id UUID,
    file_name TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size INTEGER,
    status TEXT,
    comments TEXT,
    uploader_name TEXT,
    validator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.file_name,
        a.file_path,
        a.file_type,
        a.file_size,
        a.status,
        a.comments,
        u1.name AS uploader_name,
        u2.name AS validator_name,
        a.created_at,
        a.updated_at
    FROM attachments a
    LEFT JOIN users u1 ON a.uploaded_by = u1.id
    LEFT JOIN users u2 ON a.validated_by = u2.id
    WHERE a.request_id = request_id_param
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
