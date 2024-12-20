-- Create enum for action types
CREATE TYPE action_type AS ENUM ('submission', 'validation', 'rejection', 'modification');

-- Create action_logs table
CREATE TABLE action_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    leave_request_id UUID REFERENCES leave_requests(id) NOT NULL,
    user_id UUID REFERENCES employees(id) NOT NULL,
    role VARCHAR NOT NULL,
    action action_type NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_by JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_action_logs_leave_request ON action_logs(leave_request_id);
CREATE INDEX idx_action_logs_user ON action_logs(user_id);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at);

-- Create function to automatically create action logs
CREATE OR REPLACE FUNCTION create_action_log()
RETURNS TRIGGER AS $$
DECLARE
    v_action action_type;
    v_comment TEXT;
    v_role TEXT;
BEGIN
    -- Determine action type and role
    IF TG_OP = 'INSERT' THEN
        v_action := 'submission'::action_type;
        v_role := 'Demandeur';
        v_comment := 'Nouvelle demande de congé créée';
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'validee_par_direction' THEN
            v_action := 'validation'::action_type;
            v_role := 'Direction';
        ELSIF NEW.status = 'rejetee_par_direction' THEN
            v_action := 'rejection'::action_type;
            v_role := 'Direction';
        ELSE
            v_action := 'modification'::action_type;
            v_role := TG_ARGV[0];
        END IF;
        -- Get the latest comment
        v_comment := (SELECT text FROM jsonb_array_elements(NEW.comments) WITH ORDINALITY 
                     ORDER BY ordinality DESC LIMIT 1);
    END IF;

    -- Insert action log
    INSERT INTO action_logs (
        leave_request_id,
        user_id,
        role,
        action,
        comment,
        created_at
    ) VALUES (
        NEW.id,
        NEW.employee_id,
        v_role,
        v_action,
        v_comment,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for leave_requests
CREATE TRIGGER leave_request_action_log_insert
    AFTER INSERT ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_action_log();

CREATE TRIGGER leave_request_action_log_update
    AFTER UPDATE ON leave_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_action_log();
