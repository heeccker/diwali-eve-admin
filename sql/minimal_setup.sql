-- Simplified SQL script that creates only the basic tables needed
-- Run this in your Supabase SQL editor if you haven't run the full scripts yet

-- First, let's check if the tables exist and create them if they don't

-- Create registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    parent_husband_mobile VARCHAR(20) NOT NULL,
    registration_type VARCHAR(10) NOT NULL CHECK (registration_type IN ('SINGLE', 'GROUP')),
    group_members JSONB,
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL REFERENCES registrations(ticket_id) ON DELETE CASCADE,
    payment_screenshot_url TEXT NOT NULL,
    upi_reference VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create entry_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS entry_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL REFERENCES registrations(ticket_id) ON DELETE CASCADE,
    entry_status VARCHAR(20) DEFAULT 'NOT_ENTERED' CHECK (entry_status IN ('NOT_ENTERED', 'ENTERED')),
    entry_time TIMESTAMP WITH TIME ZONE,
    security_officer VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_status ENABLE ROW LEVEL SECURITY;

-- Create basic policies to allow reading data
DO $$
BEGIN
    -- Check if policies exist before creating them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'registrations' 
        AND policyname = 'Allow public select on registrations'
    ) THEN
        CREATE POLICY "Allow public select on registrations" ON registrations
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_verifications' 
        AND policyname = 'Allow public select on payment_verifications'
    ) THEN
        CREATE POLICY "Allow public select on payment_verifications" ON payment_verifications
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'entry_status' 
        AND policyname = 'Allow public select on entry_status'
    ) THEN
        CREATE POLICY "Allow public select on entry_status" ON entry_status
            FOR SELECT USING (true);
    END IF;

    -- Allow inserts and updates for admin operations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'entry_status' 
        AND policyname = 'Allow admin update on entry_status'
    ) THEN
        CREATE POLICY "Allow admin update on entry_status" ON entry_status
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_verifications' 
        AND policyname = 'Allow admin update on payment_verifications'
    ) THEN
        CREATE POLICY "Allow admin update on payment_verifications" ON payment_verifications
            FOR UPDATE USING (true);
    END IF;
END
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON registrations TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON payment_verifications TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON entry_status TO authenticated, anon;

-- Create some sample data if tables are empty
INSERT INTO registrations (name, email, phone, date_of_birth, parent_husband_mobile, registration_type, ticket_id)
SELECT 'Test User', 'test@example.com', '9876543210', '1995-01-01', '9876543211', 'SINGLE', 'DW2025TEST01'
WHERE NOT EXISTS (SELECT 1 FROM registrations WHERE ticket_id = 'DW2025TEST01');

-- Create entry status for the test user
INSERT INTO entry_status (ticket_id)
SELECT 'DW2025TEST01'
WHERE NOT EXISTS (SELECT 1 FROM entry_status WHERE ticket_id = 'DW2025TEST01');

COMMIT;