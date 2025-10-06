-- Create the entry_status table for tracking attendee check-ins
CREATE TABLE entry_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL REFERENCES registrations(ticket_id) ON DELETE CASCADE,
    entry_status VARCHAR(20) DEFAULT 'NOT_ENTERED' CHECK (entry_status IN ('NOT_ENTERED', 'ENTERED')),
    entry_time TIMESTAMP WITH TIME ZONE,
    security_officer VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_entry_status_ticket_id ON entry_status(ticket_id);
CREATE INDEX idx_entry_status_entry_status ON entry_status(entry_status);
CREATE INDEX idx_entry_status_entry_time ON entry_status(entry_time);

-- Enable RLS on entry_status table
ALTER TABLE entry_status ENABLE ROW LEVEL SECURITY;

-- Entry status table policies
-- Allow SELECT for all users
CREATE POLICY "Allow public select on entry_status" ON entry_status
    FOR SELECT USING (true);

-- -- Only admin can insert and update entry status
-- CREATE POLICY "Allow admin insert on entry_status" ON entry_status
--     FOR INSERT WITH CHECK (
--         auth.jwt() ->> 'role' = 'admin' OR 
--         auth.jwt() ->> 'email' IN ('shreegarden.roorkee@gmail.com', 'admin@shreegarden.com')
--     );

-- CREATE POLICY "Allow admin update on entry_status" ON entry_status
--     FOR UPDATE USING (
--         auth.jwt() ->> 'role' = 'admin' OR 
--         auth.jwt() ->> 'email' IN ('shreegarden.roorkee@gmail.com', 'admin@shreegarden.com')
--     );

-- Prevent delete operations
CREATE POLICY "Deny delete on entry_status" ON entry_status
    FOR DELETE USING (false);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_entry_status_updated_at
    BEFORE UPDATE ON entry_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create entry_status record when registration is created
CREATE OR REPLACE FUNCTION create_entry_status_for_registration()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO entry_status (ticket_id)
    VALUES (NEW.ticket_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create entry status when registration is created
CREATE TRIGGER create_entry_status_trigger
    AFTER INSERT ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION create_entry_status_for_registration();

-- Update the registration_summary view to include entry status
DROP VIEW IF EXISTS registration_summary;

CREATE VIEW registration_summary AS
SELECT 
    r.ticket_id,
    r.name,
    r.email,
    r.phone,
    r.date_of_birth,
    r.registration_type,
    CASE 
        WHEN r.registration_type = 'SINGLE' THEN 1
        WHEN r.registration_type = 'GROUP' THEN 4
        ELSE 1
    END as total_attendees,
    CASE 
        WHEN r.registration_type = 'SINGLE' THEN 500
        WHEN r.registration_type = 'GROUP' THEN 1600
        ELSE 500
    END as amount_due,
    pv.verified as payment_verified,
    pv.payment_screenshot_url,
    r.created_at as registration_date,
    -- Calculate age from date_of_birth for reference
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.date_of_birth)) as calculated_age,
    -- Entry status information
    es.entry_status,
    es.entry_time,
    es.security_officer
FROM registrations r
LEFT JOIN payment_verifications pv ON r.ticket_id = pv.ticket_id
LEFT JOIN entry_status es ON r.ticket_id = es.ticket_id
ORDER BY r.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON entry_status TO authenticated, anon;
GRANT INSERT, UPDATE ON entry_status TO authenticated, anon;
GRANT SELECT ON registration_summary TO authenticated, anon;

-- Add comments
COMMENT ON TABLE entry_status IS 'Tracks entry status of attendees at the event venue';
COMMENT ON COLUMN entry_status.entry_status IS 'Current entry status: NOT_ENTERED or ENTERED';
COMMENT ON COLUMN entry_status.entry_time IS 'Timestamp when attendee entered the venue';
COMMENT ON COLUMN entry_status.security_officer IS 'Name/ID of security officer who verified entry';

COMMIT;