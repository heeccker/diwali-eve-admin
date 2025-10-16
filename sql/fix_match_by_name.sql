-- ========================================
-- FIX: Match by NAME instead of EMAIL
-- Use this since group members have duplicate emails
-- ========================================

-- Drop and recreate the function to match by NAME
DROP FUNCTION IF EXISTS update_member_entry(VARCHAR, VARCHAR, BOOLEAN, VARCHAR);

-- New function with name-based matching
CREATE OR REPLACE FUNCTION update_member_entry(
    p_ticket_id VARCHAR(20),
    p_member_name VARCHAR(255),  -- Changed from email to name
    p_entered BOOLEAN,
    p_security_officer VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Update ONLY the specific member's entry status by matching NAME
    UPDATE entry_status
    SET 
        member_entries = (
            SELECT jsonb_agg(
                CASE 
                    WHEN member->>'name' = p_member_name THEN  -- Match by NAME
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

    -- Main registrant and group members remain independent
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_member_entry TO authenticated, anon;

-- Update comment
COMMENT ON FUNCTION update_member_entry IS 'Updates individual group member entry status by matching NAME (not email, since group members often share emails). Main registrant entry_status remains independent.';

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================
-- After running, test with:
-- SELECT update_member_entry('DW2025TEST01', 'Swastik Kukreti', true, 'Security Officer');
-- ========================================