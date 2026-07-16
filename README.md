# IT Help Desk

IT Help Desk is a role-based support portal built with React, Tailwind CSS, and shadcn-style UI components. It helps employees, managers, IT agents, and admins manage tickets, communicate updates, and monitor activity from a single dashboard.

## What’s included

- Ticket creation, assignment, status updates, escalation, and resolution workflows
- Role-aware dashboards for employees, managers, IT agents, and admins
- Real-time notifications using SignalR plus cross-tab updates
- Profile management with username, email, password, and avatar support
- An in-app help chat experience for guided support
- Dark mode and responsive UI styling

## Main areas

- App shell and routing live in src/App.jsx
- Shared UI and modal components are in src/components/
- Page-level experiences are organized under src/pages/
- Custom hooks and API integrations live in src/hooks/ and src/services/

## Getting started

1. Install dependencies

```bash
cd d:/react/ITHelpDesk
npm install
```

2. Start the development server

```bash
npm start
```

3. Build for production

```bash
npm run build
```

## Tech stack

- React 18
- Tailwind CSS
- shadcn-style UI primitives
- React Query
- SignalR
- React Hook Form
- Recharts and jspdf for dashboards and exports

## Notes

This project is actively evolving and continues to add workflow improvements around ticket handling, profile management, and user experience.
