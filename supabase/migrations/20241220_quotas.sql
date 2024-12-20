-- Create leave_quotas table
CREATE TABLE IF NOT EXISTS leave_quotas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    total_days INTEGER NOT NULL DEFAULT 30,
    used_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create quota_adjustments table for tracking changes
CREATE TABLE IF NOT EXISTS quota_adjustments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quota_id UUID REFERENCES leave_quotas(id) ON DELETE CASCADE,
    previous_total INTEGER NOT NULL,
    new_total INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to update used_days
CREATE OR REPLACE FUNCTION update_used_days()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leave_quotas
    SET used_days = (
        SELECT COALESCE(SUM(total_days), 0)
        FROM leave_requests
        WHERE employee_id = NEW.employee_id
        AND status = 'validee_par_direction'
        AND type = 'Annuel'
    )
    WHERE employee_id = NEW.employee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update used_days when leave_requests changes
CREATE TRIGGER update_leave_quota_used_days
AFTER INSERT OR UPDATE OR DELETE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_used_days();

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON leave_quotas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
