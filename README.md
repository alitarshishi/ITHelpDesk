# IT Help Desk

A lightweight React-based IT Help Desk application using Tailwind CSS and shadcn UI components.

## Features

- Ticket creation, assignment, and status updates
- Manager can update status and reassign in a single action
- IT agent escalation locks ticket interactions
- Role-based UI (Admin, Manager, IT Agent, Employee)
- Dark mode toggle (shadcn + Tailwind, powered by `next-themes`)
- Real-time notifications via SignalR

## Tech Stack

- React
- Tailwind CSS
- shadcn UI primitives
- SignalR for notifications
- `next-themes` for theme handling

## Quick Start

1. Install dependencies

```bash
cd d:/react/ITHelpDesk
npm install
```

2. Run the app

```bash
npm start
```

3. Build for production

```bash
npm run build
```

## Notable Files Changed

- `src/components/Header.jsx` — Notification bell hidden for Admin users
- `src/components/NotificationBell.jsx` — improved dark-mode contrast for unread items
- `src/components/TicketDetailModal.jsx` — Manager combined status + assignment update; escalation locks
- `src/pages/EmployeePage.jsx`, `src/pages/AdminPage.jsx` — unified filter UI
- `src/App.jsx`, `src/index.css` — theme provider and dark variables

## Contribution

- Please open issues or pull requests on the GitHub repo.
- Follow the existing style conventions (Tailwind + shadcn patterns).

## Notes

- Theme is implemented via `next-themes` with `attribute="class"`.
- If git push fails, ensure a remote is configured and you have permission to push.

