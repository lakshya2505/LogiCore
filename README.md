# LogiCore — Setup Guide

## Quick Start (3 commands)

```bash
# 1. Create Vite project (run in your desired parent folder)
npm create vite@latest logicore -- --template react
cd logicore

# 2. Install all dependencies
npm install react-router-dom recharts jspdf jspdf-autotable papaparse lucide-react

# 3. Replace the generated files with the LogiCore files, then:
npm run dev
```

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
        └── DashboardPage.jsx         ← new
```

## Demo Credentials

| Role        | Email                       | Password     |
|-------------|-----------------------------|--------------|
| Manager     | manager@logicore.io         | manager123   |
| Dispatcher  | dispatcher@logicore.io      | dispatch123  |

**Manager** — full access to all 8 pages  
**Dispatcher** — access to Fleet, Trips, Drivers, Expenses only

## Adding Remaining Pages

In `src/App.jsx`, replace each `<PlaceholderPage name="X" />` with your component import:

```jsx
// Example:
import VehiclesPage from './pages/VehiclesPage';
// Then in routes:
<Route path="/vehicles" element={<VehiclesPage />} />
```

## Resetting Demo Data

Open browser console on any page and run:
```js
localStorage.removeItem('logicore_state'); location.reload();
```
Or call `resetData()` from the AppContext.

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
