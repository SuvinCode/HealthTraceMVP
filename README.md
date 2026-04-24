# HealthTrace MVP

HealthTrace is a role-based healthcare tracking app for patients and doctors.

## Local Startup

### Prerequisites

1. Node.js 18+ and npm
2. Python 3.10+

### Install and Run

1. Clone the repo and move into it.
2. Install dependencies:

```bash
npm install
```

3. Install backend Python packages:

```bash
python -m venv .venv
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate

pip install -r backend/requirements.txt
```

4. Start both frontend and backend together:

```bash
npm run dev
```

This runs:

```bash
npm start           # Vite frontend
npm run start:backend  # Flask backend on 127.0.0.1:5001 (cross-platform .venv path)
```

5. Open the local URL shown by Vite in the terminal.

### Run Servers Separately (Optional)

1. Frontend only:

```bash
npm start
```

2. Backend only:

```bash
npm run start:backend
```

This command is cross-platform and auto-uses `.venv` on both Windows and Linux.

### Other Useful Commands

```bash
npm run build      # production build
npm run preview    # preview production build locally
npm run lint       # lint
npm run lint:fix   # lint + auto-fix
```

## Implemented Features

### Authentication and User Flow

1. Authenticated app shell with auth check, loading state, and login redirect.
2. First-time onboarding flow with role selection (`patient` or `doctor`).
3. Role-aware landing routes and navigation.

### Patient Features

1. Find doctors by name/specialization and send connection requests.
2. Track request status (`pending`, `accepted`, `rejected`).
3. Fill dynamic health forms assigned by connected doctors.
4. View health form submission history.
5. Book appointments with connected doctors.
6. See available time slots based on existing bookings.
7. View upcoming/past/cancelled appointments.
8. Cancel upcoming appointments (with a >24h constraint and emergency warning).
9. Medication diary calendar with day-based completion tracking.

### Doctor Features

1. Dashboard with patient/upcoming/completed stats.
2. Month calendar + day timeline view for appointment management.
3. Mark appointments as completed or cancelled.
4. Receive and handle patient connection requests.
5. Patient log directory with search.
6. Patient profile view with submissions, medications, and appointments.
7. Assign medication plans (type, dosage, date range, frequency).
8. Create custom health forms with multiple question types.

### UX and Architecture

1. Responsive app layout (desktop and mobile nav variants).
2. Toast notifications for key success/error actions.
3. React Query for server state fetching/caching/invalidation.
4. Route-based app structure with protected/auth-aware flows.
