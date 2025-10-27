# Quick Start Guide - Admin Dashboard

## 🚀 Your Admin Dashboard is Ready!

### 1. **Database Setup Required**
Before using the dashboard, you MUST run this SQL script in your Supabase database:

```sql
-- Copy the contents from: /sql/entry_status_table.sql
-- and run it in your Supabase SQL editor
```

### 2. **Environment Variables**
Update your `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. **Access the Dashboard**
- **URL**: http://localhost:3000/admin
- **Password**: `Disha@69`

### 4. **Dashboard Features**

#### 📊 **Analytics Section**
- Total Registrations
- Payment Verified Count
- Attendees Entered
- Total Attendees (including group members)

#### 📋 **Registration Management Table**
For each registration, you can:
- View complete details (name, email, phone, age, DOB)
- See registration type (SINGLE/GROUP) and amount
- Check payment verification status
- View payment screenshots (if uploaded)
- Track entry status with timestamps

#### 🔧 **Admin Actions**
- **Mark Entered/Not Entered**: For security to track who has arrived
- **Verify/Reject Payment**: Approve payment screenshots
 - **Security Officer Tracking**: Record who verified entry

### 5. **Security Features**
- Password-protected admin access
- Entry timestamps for security
- Payment verification workflow
- Real-time status updates

### 6. **For Security Personnel**
1. Enter your name in the "Security Officer Name" field (top right)
2. Use "Mark Entered" button when someone arrives at the venue
3. Check payment verification status before allowing entry

---

## ⚠️ Important Notes

1. **Run the SQL script first** - The entry status table is required
2. **Use Service Role Key** - Regular anon key won't work for admin operations
3. **Password is case-sensitive**: `Disha@69`
4. **Refresh browser** if you encounter any issues

## 🛠️ Troubleshooting

- **Login fails**: Check if password is exactly `Disha@69`
- **No data shows**: Verify Supabase credentials and SQL scripts
- **Can't update status**: Ensure service role key is set correctly

Your dashboard is now ready for the Diwali Night 2025 event! 🎉
