-- Create absences table
CREATE TABLE IF NOT EXISTS absences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    total_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create function to calculate total days
CREATE OR REPLACE FUNCTION calculate_absence_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_days := (NEW.end_date - NEW.start_date + 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate total days
CREATE TRIGGER set_absence_total_days
    BEFORE INSERT OR UPDATE ON absences
    FOR EACH ROW
    EXECUTE FUNCTION calculate_absence_days();

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON absences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
