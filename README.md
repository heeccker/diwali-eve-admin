# Event Dashboard - Diwali Night 2025

This is an admin dashboard for managing event registrations for the Diwali Night 2025 event.

## Features

- **Admin Authentication**: Secure password-protected access
- **Registration Management**: View all registrations in a tabular format
- **Payment Verification**: Approve/reject payment screenshots
- **Entry Status Tracking**: Mark attendees as entered/not entered for security
- **Real-time Analytics**: Dashboard with key metrics

## Setup Instructions

### 1. Database Setup

First, run the SQL scripts in your Supabase database:

1. **Initial Setup**: Run the main registration tables script (the one you already ran)
2. **Entry Status Table**: Run the script in `sql/entry_status_table.sql`

### 2. Environment Configuration

Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Configuration (optional - for production use hashed password)
ADMIN_PASSWORD_HASH=$2b$10$xZKqH.kMKqY7z4.nZ8mTRO6QzFZ5X5qY7q8mTRO6QzFZ5X5qY7q8mT
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

### 5. Access Admin Dashboard

Navigate to `http://localhost:3000/admin` and login with:
- **Password**: `Disha@69`

## Admin Dashboard Features

### Main Dashboard
- **Total Registrations**: Shows count of all registrations
- **Payment Verified**: Count of payments verified by admin
- **Attendees Entered**: Count of people who have entered the venue
- **Total Attendees**: Sum of all attendees (including group members)

### Registration Table
Each row shows:
- Ticket ID
- Name, email, phone, age, date of birth
- Registration type (SINGLE/GROUP)
- Payment status with screenshot link
- Entry status with timestamp
- Action buttons for:
  - Mark Entered/Not Entered
  - Verify/Reject Payment

### Security Features
- Entry status tracking with security officer name
- Payment screenshot verification
- Timestamp tracking for all actions

## Database Tables

### Main Tables
1. **registrations** - Stores all event registrations
2. **payment_verifications** - Stores payment screenshots and verification status
3. **entry_status** - Tracks who has entered the venue (NEW)

### Views
- **registration_summary** - Combined view with all relevant data

## API Endpoints

- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/registrations` - Fetch all registrations
- `POST /api/admin/entry-status` - Update entry status
- `POST /api/admin/verify-payment` - Update payment verification

## Security

- Admin access protected by password authentication
- Service role key used for database operations
- Row Level Security (RLS) enabled on all tables
- HTTP-only cookies for session management

## Production Deployment

1. Update environment variables with production values
2. Consider using proper JWT tokens for authentication
3. Use hashed passwords in environment variables
4. Enable HTTPS for secure cookie transmission

## Support

For technical issues or questions about the dashboard, please contact the development team.
