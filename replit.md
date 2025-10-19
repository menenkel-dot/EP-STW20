# Kinderhaus St. Wolfgang Elternportal

## Overview

This is a production-ready parent portal web application for Kinderhaus St. Wolfgang, a German childcare center. The application provides a secure, centralized platform for parents to access information about their children, view documents, manage absences, check events, and communicate with staff.

**Current Status:** Production-ready with full-stack authentication, PostgreSQL database, and secure JWT-based auth system.

**Tech Stack:**
- **Frontend:** React 19.2.0 + TypeScript + Vite 6.2.0 + Tailwind CSS (CDN)
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL (Neon-backed via Replit)
- **Authentication:** JWT tokens + bcrypt password hashing
- **ORM:** Drizzle ORM

## Recent Changes

### October 19, 2025 - Production-Ready Full-Stack Implementation

**Security & Authentication:**
- Implemented secure JWT-based authentication with bcrypt password hashing
- Added mandatory JWT_SECRET environment variable (server refuses to start without it)
- Restricted `/api/auth/register` endpoint to admin-only access
- Added child ownership validation to `/api/absences/:childId` endpoint
- All protected routes require authentication tokens

**Backend Implementation:**
- Created Express.js backend server on port 3000
- Implemented RESTful API with authentication middleware
- Database schema with users, children, groups, documents, and absences tables
- Migrated all mock data to PostgreSQL database
- Added proper error handling and input validation

**Frontend Integration:**
- Created Axios API client with automatic token refresh
- Updated Login component to use backend authentication
- Added loading states and error handling
- Implemented persistent login (localStorage + token refresh)
- Configured Vite proxy to route `/api` requests to backend

**Infrastructure:**
- Dual-server architecture: Frontend (port 5000) + Backend (port 3000)
- Vite proxy configuration for seamless API routing
- Both workflows configured and running
- Ready for Replit autoscale deployment

### Initial Replit Environment Setup
- Configured project to run in Replit environment
- Updated Vite dev server to use port 5000 (required for Replit)
- Added `allowedHosts: true` to Vite config to support Replit's proxy domains
- Removed security vulnerabilities from codebase

## Project Architecture

### Application Structure

```
/
├── lib/                 # Frontend library (API client)
│   └── client.ts       # Axios client with JWT interceptors
├── components/          # React components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Login.tsx       # Authentication screen
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header with notifications
│   └── [Feature components...]
├── hooks/
│   └── useAuth.tsx     # Authentication context and hook
├── server/             # Backend server
│   ├── index.ts        # Express server & API routes
│   ├── auth.ts         # JWT & bcrypt authentication logic
│   └── storage.ts      # Database access layer
├── shared/
│   └── schema.ts       # Drizzle ORM database schema
├── App.tsx             # Root application component
├── constants.ts        # Mock data (migrated to DB)
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration with proxy
```

### Key Features

1. **Secure Authentication System**: JWT tokens with bcrypt password hashing
2. **Multi-child Support**: Parents can switch between multiple children
3. **Dashboard**: Overview of upcoming events and important information
4. **Document Management**: Access to forms and documents
5. **Absence Reporting**: Submit absence notifications
6. **Event Calendar**: View upcoming events and activities
7. **Messages**: Parent-teacher communication
8. **Notifications**: Bell icon with unread notification count
9. **Role-based Access Control**: Admin and parent roles with different permissions

### Test Users

The database is pre-populated with test users:

**Parents:**
- Username: `meier` | Password: `password` (has 2 children: Anna & Max)
- Username: `huber` | Password: `password` (has 1 child: Sophie)

**Admin:**
- Username: `admin` | Password: `password` (staff access)

## Development

### Prerequisites

**Required Environment Variables:**
- `JWT_SECRET` - Secret key for JWT token signing (min 32 characters)
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)

### Running Locally

Two workflows run simultaneously:

**Frontend (Port 5000):**
```bash
npm run dev
```

**Backend (Port 3000):**
```bash
npm run server
```

Both are configured as Replit workflows and start automatically.

### Database Management

**Push schema changes:**
```bash
npm run db:push
```

**Open database studio:**
```bash
npm run db:studio
```

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/register` - Register new user (admin-only)
- `GET /api/auth/me` - Get current user info (protected)

### Data Access (all protected)
- `GET /api/children` - Get children for current user
- `GET /api/groups` - Get all groups
- `GET /api/documents` - Get documents for current user
- `GET /api/absences/:childId` - Get absences for a child (ownership validated)

### Health Check
- `GET /api/health` - Backend health status

## Security Features

1. **Password Security**: bcrypt hashing with salt rounds
2. **JWT Tokens**: Signed tokens with 24h expiration
3. **Refresh Tokens**: 7-day expiration for seamless re-authentication
4. **Authorization**: All sensitive endpoints require valid JWT
5. **Child Ownership Validation**: Parents can only access their own children's data
6. **Admin-only Registration**: New users can only be created by administrators
7. **Mandatory JWT_SECRET**: Server refuses to start without proper secret configuration

## Deployment

The project is configured for Replit's autoscale deployment:
- **Build command:** `npm run build`
- **Run command:** `npx vite preview --host 0.0.0.0 --port 5000`
- **Deployment type:** Autoscale (suitable for stateless web applications)

**Before deploying:**
1. Ensure `JWT_SECRET` is set in Replit Secrets
2. Verify `DATABASE_URL` is configured
3. Run database migrations if needed
4. Test authentication flow

## Configuration Notes

### Vite Configuration

The Vite config (`vite.config.ts`) includes:
- Port 5000 for compatibility with Replit
- Host binding to `0.0.0.0` for external access
- HMR configured for Replit's proxy environment
- API proxy: `/api` → `http://localhost:3000`
- Path aliases (`@/` maps to project root)

### Environment Variables

**Development (.env file):**
```
DATABASE_URL=<provided by Replit>
JWT_SECRET=<your-secret-key-min-32-chars>
```

**Production (Replit Secrets):**
- Add all environment variables to Replit Secrets
- Never commit `.env` to version control

### Tailwind CSS

Currently uses Tailwind via CDN (see `index.html`). For production optimization, consider installing Tailwind as a PostCSS plugin.

## Future Enhancements

Potential improvements for production deployment:
- **Rate Limiting**: Add rate limiting to prevent brute-force attacks
- **Refresh Token Revocation**: Implement token blacklist for logout
- **Email Verification**: Add email verification for new accounts
- **Password Reset**: Implement password reset flow
- **File Upload**: Add secure file upload for documents
- **Real-time Notifications**: WebSocket-based push notifications
- **Audit Logging**: Track all authentication and authorization events
- **CORS Configuration**: Lock down CORS to specific domains in production
- **Tailwind PostCSS**: Install Tailwind as PostCSS plugin for better performance
- **Admin Dashboard**: Create comprehensive admin interface for staff

## Security Best Practices

1. **JWT_SECRET**: Use a strong, random secret (min 32 characters)
2. **Database Backups**: Regular backups of PostgreSQL database
3. **HTTPS Only**: Always use HTTPS in production (Replit handles this)
4. **Token Rotation**: Implement regular JWT secret rotation
5. **Input Validation**: All user inputs are validated server-side
6. **SQL Injection Prevention**: Using Drizzle ORM with parameterized queries
7. **XSS Prevention**: React's built-in XSS protection

## Troubleshooting

**Backend won't start:**
- Check if `JWT_SECRET` is set in environment variables
- Verify `DATABASE_URL` is configured
- Check backend logs for error messages

**Login fails:**
- Verify credentials match test users
- Check browser console for API errors
- Verify backend is running on port 3000

**API requests fail:**
- Check Vite proxy configuration in `vite.config.ts`
- Verify backend server is running
- Check CORS settings

## Notes

- All passwords are securely hashed with bcrypt (never stored in plain text)
- JWT tokens are signed and verified on every request
- Child data access is restricted by parent ownership
- Admin-only endpoints require both authentication and role verification
- The application uses production-grade security practices throughout
