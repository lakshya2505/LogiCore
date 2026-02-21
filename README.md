# LogiCore — Fleet & Logistics Management System

**Live Demo:** [https://logicoree77.web.app](https://logicoree77.web.app)

## Tech Stack
- Frontend: React (Vite), React Router
- Styles: Custom Vanilla CSS (Apple-inspired Glassmorphism)
- Database & Auth: Firebase (Firestore, Authentication)
- Hosting: Firebase Hosting
- UI Components: Recharts, Lucide React

## Setup Details
This project has already been initialized with a fully configured Firebase backend. The database automatically synchronizes real-time updates and includes pre-seeded demo data for 17 vehicles, 21 trips, 17 drivers, and assorted maintenance/expenses records.

## File Structure to Drop In

Replace/create these files inside your Vite project:

```
logicore/
├── index.html                         ← replace
├── package.json                       ← replace (or just install deps above)
├── vite.config.js                     ← keep as-is
└── src/
    ├── main.jsx                       ← replace
    ├── App.jsx                        ← replace
    ├── index.css                      ← replace
    ├── context/
    │   └── AppContext.jsx             ← new
    ├── data/
    │   └── seedData.js               ← new
    ├── components/
    │   ├── Sidebar.jsx               ← new
    │   ├── TopBar.jsx                ← new
    │   ├── KPICard.jsx               ← new
    │   ├── StatusPill.jsx            ← new
    │   ├── DataTable.jsx             ← new
    │   └── Modal.jsx                 ← new
    └── pages/
        ├── LoginPage.jsx             ← new
        └── DashboardPage.jsx
        └── setupPage.jsx
        └── Driverspage.jsx
        └── expensespage.jsx
        └── analyticspage.jsx
        └── maintanencepage.jsx   
        └── tripspage.jsx 
        └── vechilesPage.jsx ← new
```    

## Demo Credentials

| Role        | Email                       | Password     |
|-------------|-----------------------------|--------------|
| Manager     | manager@logicore.io         | manager123   |
| Dispatcher  | dispatcher@logicore.io      | dispatch123  |

**Manager** — full access to all 8 pages  
**Dispatcher** — access to Fleet, Trips, Drivers, Expenses only

## Key Patterns

### Reading state
```jsx
import { useApp } from '../context/AppContext';
const { vehicles, drivers, trips } = useApp();
```

### Updating state
```jsx
const { addVehicle, updateVehicle, deleteVehicle } = useApp();
addVehicle({ name: 'New Truck', plate: 'XX-00-AA-0000', ... });
```

### Showing a status pill
```jsx
import StatusPill from '../components/StatusPill';
<StatusPill status="Available" />  // Available, On Trip, In Shop, Retired, etc.
```

### Using DataTable
```jsx
import DataTable from '../components/DataTable';
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', render: (v) => <StatusPill status={v} /> },
  ]}
  data={vehicles}
  searchKeys={['name', 'plate']}
  onRowClick={(row) => setSelected(row)}
/>
```
