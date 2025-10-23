# Kinderhaus St. Wolfgang Elternportal

## Overview

This project is a production-ready parent portal web application for Kinderhaus St. Wolfgang, a German childcare center. It provides a secure, centralized platform for parents to access information about their children, view documents, manage absences, check events, and communicate with staff. The application is designed to be a comprehensive digital interface, enhancing communication and administrative efficiency for the childcare center.

## User Preferences

- I prefer simple language.
- I want an iterative development approach.
- Ask before making major changes.
- I prefer detailed explanations for complex implementations.
- Do not make changes to the folder `node_modules`.
- Do not modify the `package-lock.json` file.
- Ensure all new features are thoroughly tested before integration.

## System Architecture

The application features a dual-server architecture with a React-based frontend and a Node.js/Express.js backend, communicating via RESTful APIs.

### UI/UX Decisions
The frontend is built with React and TypeScript, styled using Tailwind CSS for a modern and responsive user interface. Key UI components include a dashboard, navigation sidebar, and distinct views for events, posts, absences, and messaging.

**Avatar Display:**
- Parent users display initials (2 letters, e.g., "FM" for "Familie Meier") instead of avatar images
- Admin users keep their avatar images
- Login page features animated space-themed background

### Technical Implementations
- **Frontend:** React 19.2.0, TypeScript, Vite 6.2.0, Tailwind CSS (CDN). Utilizes Axios for API communication with JWT interceptors, and a custom `useAuth` hook for authentication context.
- **Backend:** Node.js, Express.js, TypeScript. Implements a RESTful API with middleware for authentication and role-based authorization.
- **Authentication:** Secure JWT-based authentication with `bcrypt` for password hashing and refresh tokens for persistent login. Registration is admin-only.
- **Database:** PostgreSQL, managed with Drizzle ORM. The schema includes tables for users, children, groups, events, posts, holiday periods, bookings, conversations, messages, contacts, and documents.
- **State Management:** Data is loaded from the backend, replacing all mock data. Components manage their loading states and error handling.
- **Proxy Configuration:** Vite is configured to proxy `/api` requests to the backend server.

### Feature Specifications
1.  **Secure Authentication System:** JWT tokens with bcrypt hashing, refresh tokens, and role-based access control (Admin/Parent).
2.  **Multi-child Support:** Parents can manage data for multiple children.
3.  **Dashboard:** Provides an overview of upcoming events and important posts.
4.  **Document Management:** Allows access to relevant forms and documents.
5.  **Absence Reporting:** Parents can submit and manage absence notifications. Admins have overview of all absences from all children.
6.  **Event Calendar:** Displays upcoming events and activities.
7.  **Messages:** Enables secure parent-teacher communication with conversation threads.
8.  **Notifications:** Bell icon with unread notification count, database-backed with 30-second polling. Automatic notifications created when:
    - Parents report absences (admins notified)
    - Messages are sent (conversation participants notified)
    - Local optimistic notifications for immediate user feedback
9.  **Role-based Access Control:** Differentiates permissions between Admin and Parent roles, with granular control over data access (e.g., child ownership validation for parents).
10. **Admin User Management:** Admins can delete users from the system (Verwaltung section), with proper cascade deletion of all related data.

### System Design Choices
- **Full-Stack Integration:** All frontend components are fully integrated with the backend APIs, removing all mock data dependencies.
- **Database-driven:** All dynamic content and user data are persisted in the PostgreSQL database.
- **Scalability:** Designed for Replit autoscale deployment with stateless web application principles.
- **Security:** Emphasizes strong password hashing, JWT security, child ownership validation, and admin-only user registration.

## External Dependencies

-   **PostgreSQL:** Relational database for all application data (hosted via Neon on Replit).
-   **Vite:** Frontend build tool.
-   **React:** Frontend library.
-   **Tailwind CSS:** Utility-first CSS framework (used via CDN).
-   **Node.js/Express.js:** Backend runtime and web framework.
-   **Drizzle ORM:** TypeScript ORM for PostgreSQL interaction.
-   **bcrypt:** Library for password hashing.
-   **jsonwebtoken (JWT):** Library for secure user authentication.
-   **Axios:** Promise-based HTTP client for frontend API requests.