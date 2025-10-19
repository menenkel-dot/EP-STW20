# Kinderhaus St. Wolfgang Elternportal

## Overview

This is a parent portal web application for Kinderhaus St. Wolfgang, a German childcare center. The application provides a centralized platform for parents to access information about their children, view documents, manage absences, check events, and communicate with staff.

**Current Status:** Fully functional with mock data. Ready for development and deployment.

**Tech Stack:**
- React 19.2.0
- TypeScript
- Vite 6.2.0
- Tailwind CSS (via CDN)

## Recent Changes

### October 19, 2025 - Replit Environment Setup
- Configured project to run in Replit environment
- Updated Vite dev server to use port 5000 (required for Replit)
- Added `allowedHosts: true` to Vite config to support Replit's proxy domains
- Removed security vulnerability: API key exposure from vite.config.ts
- Configured deployment settings for production (autoscale)
- Set up Frontend workflow for development server

## Project Architecture

### Application Structure

```
/
├── components/          # React components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Login.tsx       # Authentication screen
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header with notifications
│   └── [Feature components...]
├── hooks/
│   └── useAuth.tsx     # Authentication context and hook
├── App.tsx             # Root application component
├── constants.ts        # Mock data and constants
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration
```

### Key Features

1. **Authentication System**: Mock authentication with predefined users
2. **Multi-child Support**: Parents can switch between multiple children
3. **Dashboard**: Overview of upcoming events and important information
4. **Document Management**: Access to forms and documents
5. **Absence Reporting**: Submit absence notifications
6. **Event Calendar**: View upcoming events and activities
7. **Messages**: Parent-teacher communication
8. **Notifications**: Bell icon with unread notification count

### Mock Users

The application comes with pre-configured mock users for testing:
- See `constants.ts` for user credentials and test data

## Development

### Running Locally

The development server is configured to run on port 5000:

```bash
npm run dev
```

The server will start at `http://localhost:5000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

The project is configured for Replit's autoscale deployment:
- Build command: `npm run build`
- Run command: `npx vite preview --host 0.0.0.0 --port`
- Deployment type: Autoscale (suitable for stateless web applications)

## Configuration Notes

### Vite Configuration

The Vite config (`vite.config.ts`) includes:
- Port 5000 for compatibility with Replit
- Host binding to `0.0.0.0` for external access
- HMR configured for Replit's proxy environment
- Path aliases (`@/` maps to project root)

### Tailwind CSS

Currently uses Tailwind via CDN (see `index.html`). For production, consider installing Tailwind as a PostCSS plugin for better performance.

## Future Enhancements

Potential areas for improvement:
- Replace mock data with real backend API
- Add proper authentication system
- Install Tailwind CSS as PostCSS plugin instead of CDN
- Add form validation
- Implement real-time notifications
- Add file upload functionality for documents
- Create admin interface for staff

## Notes

- The original GitHub import referenced a GEMINI_API_KEY but this was not actually used in the application code. The reference has been removed for security.
- All data is currently stored in memory using mock constants. A backend database would be needed for production use.
