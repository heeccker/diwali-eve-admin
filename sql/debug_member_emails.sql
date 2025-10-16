-- ========================================
-- DEBUG: Check if members have unique emails
-- ========================================

-- Check member_entries data to see if emails are unique
SELECT 
    ticket_id,
    registration_type,
    jsonb_array_length(member_entries) as member_count,
    member_entries
FROM entry_status es
JOIN registrations r ON r.ticket_id = es.ticket_id
WHERE registration_type = 'GROUP'
AND member_entries IS NOT NULL
AND member_entries != '[]'::jsonb
LIMIT 5;

-- ========================================
-- If emails are NOT unique (all same), this is the problem!
-- Let's check:
-- ========================================

SELECT 
    r.ticket_id,
    r.name as main_registrant,
    member->>'email' as member_email,
    COUNT(*) as email_count
FROM registrations r
JOIN entry_status es ON r.ticket_id = es.ticket_id
CROSS JOIN jsonb_array_elements(es.member_entries) as member
WHERE r.registration_type = 'GROUP'
GROUP BY r.ticket_id, r.name, member->>'email'
HAVING COUNT(*) > 1;  -- This will show duplicate emails

-- ========================================
-- EXPECTED: Each member should have unique email
-- If query above returns rows, emails are duplicated!
-- ========================================