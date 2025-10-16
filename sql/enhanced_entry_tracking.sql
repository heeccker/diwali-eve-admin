-- Enhanced entry status table to track individual group member entries
-- This script updates the entry_status table to support individual member tracking

-- Add a new column to store individual member entry data
ALTER TABLE entry_status 
ADD COLUMN IF NOT EXISTS member_entries JSONB DEFAULT '[]'::jsonb;

-- Add an index for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_entry_status_member_entries ON entry_status USING GIN (member_entries);

-- Update the table comment
COMMENT ON COLUMN entry_status.member_entries IS 'JSON array storing individual entry data for group members: [{name, email, phone, entered, entry_time, security_officer}]';

-- Create a function to automatically initialize member entries when registration is created
CREATE OR REPLACE FUNCTION initialize_member_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a group registration, initialize member_entries array
    IF NEW.registration_type = 'GROUP' AND NEW.group_members IS NOT NULL THEN
        -- Create entry_status with pre-populated member_entries
        INSERT INTO entry_status (ticket_id, member_entries)
        VALUES (
            NEW.ticket_id,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'name', member->>'name',
                        'email', member->>'email',
                        'phone', member->>'phone',
                        'date_of_birth', member->>'date_of_birth',
                        'entered', false,
                        'entry_time', null,
                        'security_officer', null
                    )
                )
                FROM jsonb_array_elements(NEW.group_members) AS member
            )
        )
        ON CONFLICT (ticket_id) DO NOTHING;
    ELSE
        -- For single registration, just create the entry_status record
        INSERT INTO entry_status (ticket_id, member_entries)
        VALUES (NEW.ticket_id, '[]'::jsonb)
        ON CONFLICT (ticket_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists and create the new one
DROP TRIGGER IF EXISTS create_entry_status_trigger ON registrations;
CREATE TRIGGER create_entry_status_trigger
    AFTER INSERT ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION initialize_member_entries();

-- Make ticket_id unique in entry_status if not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'entry_status_ticket_id_unique'
        AND conrelid = 'entry_status'::regclass
    ) THEN
        ALTER TABLE entry_status 
        ADD CONSTRAINT entry_status_ticket_id_unique UNIQUE (ticket_id);
    END IF;
END $$;

-- Create an updated view that includes member entry information
DROP VIEW IF EXISTS registration_summary;

CREATE VIEW registration_summary AS
SELECT 
    r.id,
    r.ticket_id,
    r.name,
    r.email,
    r.phone,
    r.date_of_birth,
    r.parent_husband_mobile,
    r.registration_type,
    r.group_members,
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
    COALESCE(pv.verified, false) as payment_verified,
    pv.payment_screenshot_url,
    pv.upi_reference,
    r.created_at as registration_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.date_of_birth)) as calculated_age,
    es.entry_status,
    es.entry_time,
    es.security_officer,
    es.member_entries,
    -- Calculate how many group members have entered (separate from main registrant)
    CASE 
        WHEN r.registration_type = 'GROUP' AND es.member_entries IS NOT NULL THEN
            (SELECT COUNT(*) FROM jsonb_array_elements(es.member_entries) AS member WHERE (member->>'entered')::boolean = true)
        ELSE 0
    END as members_entered_count
FROM registrations r
LEFT JOIN payment_verifications pv ON r.ticket_id = pv.ticket_id
LEFT JOIN entry_status es ON r.ticket_id = es.ticket_id
ORDER BY r.created_at DESC;

-- Grant permissions
GRANT SELECT ON registration_summary TO authenticated, anon;

-- Function to update individual member entry (INDEPENDENT - doesn't affect group status)
CREATE OR REPLACE FUNCTION update_member_entry(
    p_ticket_id VARCHAR(20),
    p_member_email VARCHAR(255),
    p_entered BOOLEAN,
    p_security_officer VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Update the specific member's entry status ONLY
    UPDATE entry_status
    SET 
        member_entries = (
            SELECT jsonb_agg(
                CASE 
                    WHEN member->>'email' = p_member_email THEN
                        jsonb_build_object(
                            'name', member->>'name',
                            'email', member->>'email',
                            'phone', member->>'phone',
                            'date_of_birth', member->>'date_of_birth',
                            'entered', p_entered,
                            'entry_time', CASE WHEN p_entered THEN NOW() ELSE NULL END,
                            'security_officer', CASE WHEN p_entered THEN COALESCE(p_security_officer, member->>'security_officer') ELSE NULL END
                        )
                    ELSE member
                END
            )
            FROM jsonb_array_elements(member_entries) AS member
        ),
        updated_at = NOW()
    WHERE ticket_id = p_ticket_id
    RETURNING member_entries INTO v_result;

    -- DO NOT update the main entry_status - keep them independent
    -- Security can mark the main registrant separately using the regular entry-status endpoint

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_member_entry TO authenticated, anon;

-- Migrate existing data: populate member_entries for existing group registrations
DO $$
DECLARE
    reg RECORD;
BEGIN
    -- Loop through all existing group registrations
    FOR reg IN 
        SELECT r.ticket_id, r.registration_type, r.group_members, es.id as entry_status_id
        FROM registrations r
        LEFT JOIN entry_status es ON r.ticket_id = es.ticket_id
        WHERE r.registration_type = 'GROUP' 
        AND r.group_members IS NOT NULL
        AND r.group_members != '[]'::jsonb
    LOOP
        -- Update or insert entry_status with member_entries
        IF reg.entry_status_id IS NOT NULL THEN
            -- Update existing entry_status
            UPDATE entry_status
            SET member_entries = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'name', member->>'name',
                        'email', member->>'email',
                        'phone', member->>'phone',
                        'date_of_birth', member->>'date_of_birth',
                        'entered', false,
                        'entry_time', null,
                        'security_officer', null
                    )
                )
                FROM jsonb_array_elements(reg.group_members) AS member
            )
            WHERE ticket_id = reg.ticket_id
            AND (member_entries IS NULL OR member_entries = '[]'::jsonb);
        ELSE
            -- Insert new entry_status if it doesn't exist
            INSERT INTO entry_status (ticket_id, member_entries)
            VALUES (
                reg.ticket_id,
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'name', member->>'name',
                            'email', member->>'email',
                            'phone', member->>'phone',
                            'date_of_birth', member->>'date_of_birth',
                            'entered', false,
                            'entry_time', null,
                            'security_officer', null
                        )
                    )
                    FROM jsonb_array_elements(reg.group_members) AS member
                )
            )
            ON CONFLICT (ticket_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Ensure all single registrations have entry_status records
INSERT INTO entry_status (ticket_id, member_entries)
SELECT r.ticket_id, '[]'::jsonb
FROM registrations r
LEFT JOIN entry_status es ON r.ticket_id = es.ticket_id
WHERE r.registration_type = 'SINGLE'
AND es.id IS NULL
ON CONFLICT (ticket_id) DO NOTHING;

COMMIT;