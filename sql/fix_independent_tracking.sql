-- ========================================
-- FIX: Make Member Entry Tracking Independent
-- Run this to fix the automatic group status update issue
-- ========================================

-- Drop and recreate the function WITHOUT automatic group status updates
DROP FUNCTION IF EXISTS update_member_entry(VARCHAR, VARCHAR, BOOLEAN, VARCHAR);

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
    -- Update ONLY the specific member's entry status
    -- Does NOT affect the main registrant's entry_status
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

    -- IMPORTANT: We removed the automatic update of entry_status
    -- Main registrant and group members are now completely independent
    -- Security must mark the main registrant separately using the regular "Mark Entered" button

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_member_entry TO authenticated, anon;

-- Add comment explaining the independence
COMMENT ON FUNCTION update_member_entry IS 'Updates individual group member entry status. Main registrant entry_status remains independent and must be updated separately via entry-status endpoint.';

COMMIT;

-- ========================================
-- VERIFICATION QUERY
-- Run this after to verify the fix worked:
-- ========================================
-- SELECT routine_name, routine_definition 
-- FROM information_schema.routines 
-- WHERE routine_name = 'update_member_entry';
-- ========================================