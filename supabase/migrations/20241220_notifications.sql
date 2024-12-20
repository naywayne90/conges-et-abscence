-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES employees(id) NOT NULL,
    leave_request_id UUID REFERENCES leave_requests(id),
    message TEXT NOT NULL,
    type VARCHAR NOT NULL, -- 'info', 'success', 'warning', 'error'
    status VARCHAR NOT NULL DEFAULT 'unread',
    action_type VARCHAR, -- 'submission', 'validation', 'rejection'
    action_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create function to automatically create notifications
CREATE OR REPLACE FUNCTION create_leave_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification pour nouvelle demande
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (user_id, leave_request_id, message, type, action_type, action_by)
        VALUES (
            NEW.employee_id,
            NEW.id,
            'Nouvelle demande de congé créée',
            'info',
            'submission',
            NEW.employee_id
        );
    -- Notification pour mise à jour de statut
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO notifications (user_id, leave_request_id, message, type, action_type, action_by)
        VALUES (
            NEW.employee_id,
            NEW.id,
            CASE 
                WHEN NEW.status = 'validee_par_direction' THEN 'Votre demande de congé a été validée par la direction'
                WHEN NEW.status = 'rejetee_par_direction' THEN 'Votre demande de congé a été rejetée par la direction'
                ELSE 'Le statut de votre demande de congé a été mis à jour'
            END,
            CASE 
                WHEN NEW.status = 'validee_par_direction' THEN 'success'
                WHEN NEW.status = 'rejetee_par_direction' THEN 'error'
                ELSE 'info'
            END,
            CASE 
                WHEN NEW.status = 'validee_par_direction' THEN 'validation'
                WHEN NEW.status = 'rejetee_par_direction' THEN 'rejection'
                ELSE 'update'
            END,
            current_user
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leave request notifications
CREATE TRIGGER leave_request_notification_trigger
    AFTER INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_leave_request_notification();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET status = 'read'
    WHERE user_id = p_user_id AND status = 'unread';
END;
$$ LANGUAGE plpgsql;
