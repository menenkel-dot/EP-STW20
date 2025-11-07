# AI Development Rules for Kinderhaus St. Wolfgang Elternportal

This document outlines the technical stack and development conventions for the AI assistant working on this project. Adhering to these rules ensures consistency, maintainability, and stability.

## Tech Stack Overview

*   **Frontend Framework**: React 19 with TypeScript, built using Vite.
*   **Backend Framework**: Node.js with Express.js and TypeScript for creating a RESTful API.
*   **Database**: PostgreSQL, managed via Neon.
*   **ORM**: Drizzle ORM for all database interactions on the backend.
*   **Styling**: Tailwind CSS is used exclusively for styling, loaded via a CDN.
*   **Authentication**: Secure JWT-based authentication using `jsonwebtoken` for tokens and `bcryptjs` for password hashing.
*   **API Communication**: `axios` is used on the frontend for all API requests, configured with interceptors for auth token management.
*   **Component Architecture**: A mix of custom-built React components and the `shadcn/ui` component library.

## Library and Convention Rules

### 1. UI and Components

*   **Component Library**: Prioritize using pre-built `shadcn/ui` components for common UI patterns (e.g., dropdowns, dialogs, inputs).
*   **Custom Components**: For simpler, reusable elements, use the existing custom components in `src/components` (e.g., `Card.tsx`, `Button.tsx`, `Modal.tsx`). Create new custom components for any unique UI needs.
*   **Styling**: All styling **must** be done using Tailwind CSS utility classes. Do not write custom CSS files or use inline `style` attributes.

### 2. State Management

*   **Global State**: The user's authentication status and active child are managed globally via the `AuthContext` and `useAuth` hook. Use this for any auth-related state.
*   **Local State**: For all other state management within components (e.g., form inputs, loading states, UI toggles), use React's built-in hooks like `useState`, `useEffect`, and `useMemo`. Do not introduce external state management libraries like Redux or Zustand.

### 3. Data Fetching & API Interaction

*   **Client-Side**: All API calls from the frontend **must** use the pre-configured `axios` client from `lib/client.ts`. This ensures proper authentication handling.
*   **API Structure**: New API endpoints should be added to the relevant object within `lib/client.ts` (e.g., `usersAPI`, `postsAPI`).
*   **Backend-Side**: All database logic **must** be implemented within the `server/storage.ts` file. Route handlers in `server/index.ts` should call methods from `storage.ts` and not interact with the database directly.

### 4. Database

*   **ORM**: All database queries **must** be written using the Drizzle ORM. Do not write raw SQL strings.
*   **Schema**: Any changes to the database structure must be defined in the schema file at `shared/schema.ts`.

### 5. Icons

*   **Icon Library**: Use icons from the `lucide-react` package for all iconography needs. This provides a consistent and high-quality set of icons.

### 6. Routing

*   **Navigation**: The application is a Single Page App (SPA) that uses a state variable in `Layout.tsx` to switch between views. This pattern **must** be maintained. Do not install or use `react-router-dom`.