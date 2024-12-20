-- Function to mark an action as read for a specific user
CREATE OR REPLACE FUNCTION mark_action_as_read(p_action_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE action_logs
    SET read_by = CASE
        WHEN read_by ? p_user_id::text THEN read_by
        ELSE read_by || jsonb_build_array(p_user_id)
    END
    WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread action count for a user
CREATE OR REPLACE FUNCTION get_unread_action_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM action_logs
        WHERE NOT (read_by ? p_user_id::text)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
