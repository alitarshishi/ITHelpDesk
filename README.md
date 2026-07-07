# IT Help Desk

A lightweight, role-based IT Help Desk single-page application built with React, Tailwind CSS, and shadcn UI primitives. The app provides ticket management workflows (create, assign, escalate, resolve), real-time notifications, and a dark-mode theme.

## Goals and Summary

- Provide a simple, fast interface for employees to create tickets and for IT teams and managers to triage and resolve them.
- Support role-based capabilities: Admin, Manager, IT Agent, and Employee each see different UI and actions.
- Real-time updates through SignalR so notifications and ticket changes propagate immediately.

## Key Features

- Create and manage tickets with title, description, priority, category, and attachments.
- Manager combined action: update ticket status and (re)assign an agent in a single operation.
- IT escalation: when an IT Agent escalates a ticket, the ticket becomes read-only for that agent.
- Role-aware UI: conditional rendering and permissions for Admin, Manager, IT Agent, and Employee.
- Unified filter tabs across Admin, Manager, and Employee pages (status, priority, category, search).
- Dark mode toggle implemented using `next-themes` and Tailwind `dark` class.
- Real-time notifications via SignalR and a BroadcastChannel for cross-tab updates.

## Architecture & Directory Overview

Top-level structure (important files/folders):

- `src/App.jsx` — app entry, routing, and global providers (ThemeProvider).
- `src/index.css` — Tailwind imports and CSS variable overrides (light/dark palettes).
- `src/components/` — shared UI components and higher-level widgets (Header, NotificationBell, TicketDetailModal, dialogs, forms).
	- `src/components/ui/` — shadcn-style primitives (button, input, dialog, etc.).
- `src/pages/` — page-level views: `AdminPage.jsx`, `ManagerPage.jsx`, `ITAgentPage.jsx`, `EmployeePage.jsx`, `ResetPasswordPage.jsx`.
- `src/hooks/` — custom hooks (e.g., `useSpeechToText`, `useDashboardStats`).
- `src/services/` — API and real-time services (e.g., `authService.js`, `notificationHub.js`).
- `src/lib/` and `src/utils/` — utility and export helpers.

## Roles & Permissions (high-level)

- Admin: user management and high-level oversight. UI elements like the notification bell are hidden for Admin by default.
- Manager: can change ticket status and assign/reassign agents in a single save action.
- IT Agent: handles tickets, can escalate which locks interaction for that agent.
- Employee: create tickets and view own tickets; filtering experience matches Manager/Admin pages.

## Development

1. Install dependencies

```bash
cd d:/react/ITHelpDesk
npm install
```

2. Run the development server

```bash
npm start
```

3. Build for production

```bash
npm run build
```

4. Useful commands

```bash
npm run lint    # if configured
npm test        # if tests exist
```

## Notable Implementation Details

- Theme: implemented with `next-themes` (`ThemeProvider attribute="class"`) and styled via Tailwind with `darkMode: ['class']` in `tailwind.config.js`.
- UI kit: shadcn-style primitives are located under `src/components/ui` and used across pages for consistent styling.
- Notifications: SignalR hub in `src/services/notificationHub.js` with unread handling in `src/components/NotificationBell.jsx` (contrast fixes for dark mode applied).
- Manager flow: `src/components/TicketDetailModal.jsx` implements a single PATCH to update both `status` and `assignedTo` for manager saves.

## Contributing

- Open an issue or PR on GitHub. Keep changes focused and follow existing patterns (Tailwind + shadcn).
- Run linters and tests before submitting PRs.

## Known Issues & TODOs

- Persisting explicit theme preference beyond `next-themes` defaults may be desired for edge cases.
- Some visual QA across all components in dark mode is recommended.
- `NotificationBell` visibility and behavior can be further customized per-role via a config flag.

## License

This repository does not include a license file. Add a `LICENSE` if you wish to make the project open source.

---

If you want, I can also add a short `CONTRIBUTING.md`, CODE_OF_CONDUCT, or a sample `LICENSE` file and push them.
