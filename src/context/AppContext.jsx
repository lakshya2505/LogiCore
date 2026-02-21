import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { seedData } from '../data/seedData';
import { onAuthStateChanged, loginUser, logoutUser, registerUser } from '../services/authService';
import {
  getUserProfile,
  createUserProfile,
  getDocuments,
  subscribeToCollection,
  addDocument,
  updateDocument,
  deleteDocument,
} from '../services/firestoreService';

const AppContext = createContext(null);

function getInitialState() {
  return {
    vehicles: [],
    drivers: [],
    trips: [],
    maintenanceLogs: [],
    expenses: [],
    user: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    // Auth
    case 'LOGIN': return { ...state, user: action.payload };
    case 'LOGOUT': return { ...state, user: null };

    // Bulk set from Firestore (real-time listeners)
    case 'SET_VEHICLES': return { ...state, vehicles: action.payload };
    case 'SET_DRIVERS': return { ...state, drivers: action.payload };
    case 'SET_TRIPS': return { ...state, trips: action.payload };
    case 'SET_MAINTENANCE_LOGS': return { ...state, maintenanceLogs: action.payload };
    case 'SET_EXPENSES': return { ...state, expenses: action.payload };

    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const [loading, setLoading] = useState(true);
  const [unsubscribers, setUnsubscribers] = useState({});

  // Monitor auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);

          // Fallback logic for demo users if their profile wasn't created properly
          const fallbackRole = firebaseUser.email.includes('dispatch') ? 'Dispatcher' : 'Manager';

          dispatch({
            type: 'LOGIN',
            payload: {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              role: userProfile?.role || fallbackRole,
              ...userProfile
            }
          });

          // Subscribe to real-time data for this user
          const unsub = {};

          unsub.vehicles = subscribeToCollection('vehicles', (docs) => {
            dispatch({ type: 'SET_VEHICLES', payload: docs });
          });

          unsub.drivers = subscribeToCollection('drivers', (docs) => {
            dispatch({ type: 'SET_DRIVERS', payload: docs });
          });

          unsub.trips = subscribeToCollection('trips', (docs) => {
            dispatch({ type: 'SET_TRIPS', payload: docs });
          });

          unsub.maintenanceLogs = subscribeToCollection('maintenanceLogs', (docs) => {
            dispatch({ type: 'SET_MAINTENANCE_LOGS', payload: docs });
          });

          unsub.expenses = subscribeToCollection('expenses', (docs) => {
            dispatch({ type: 'SET_EXPENSES', payload: docs });
          });

          setUnsubscribers(unsub);
        } catch (error) {
          console.error('Auth error:', error);
          const fallbackRole = firebaseUser.email.includes('dispatch') ? 'Dispatcher' : 'Manager';
          dispatch({
            type: 'LOGIN',
            payload: {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              role: fallbackRole,
            }
          });
        } finally {
          setLoading(false);
        }
      } else {
        dispatch({ type: 'LOGOUT' });
        Object.values(unsubscribers).forEach(unsub => unsub?.());
        setUnsubscribers({});
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      Object.values(unsubscribers).forEach(unsub => unsub?.());
    };
  }, []);

  // Computed values
  const computed = {
    activeFleet: state.vehicles.filter(v => ['Available', 'On Trip'].includes(v.status)).length,
    maintenanceAlerts: state.vehicles.filter(v => v.status === 'In Shop').length,
    utilizationRate: state.vehicles.length > 0
      ? Math.round((state.vehicles.filter(v => v.status === 'On Trip').length / Math.max(state.vehicles.filter(v => v.status !== 'Retired').length, 1)) * 100)
      : 0,
    pendingCargo: state.trips.filter(t => t.status === 'Draft').length,
    totalRevenue: state.trips.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.revenue || 0), 0),
    totalExpenses: state.expenses.reduce((s, e) => s + (e.cost || 0), 0) + state.maintenanceLogs.reduce((s, m) => s + (m.cost || 0), 0),
  };

  // ─── FIRESTORE-BACKED CRUD ACTIONS ───
  // All writes go to Firestore; onSnapshot listeners auto-sync local state.

  // Vehicles
  const addVehicle = async (v) => {
    try {
      await addDocument('vehicles', v);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
      throw err;
    }
  };

  const updateVehicle = async (v) => {
    try {
      const { id, ...updates } = v;
      await updateDocument('vehicles', id, updates);
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      throw err;
    }
  };

  const deleteVehicle = async (id) => {
    try {
      await deleteDocument('vehicles', id);
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      throw err;
    }
  };

  // Drivers
  const addDriver = async (d) => {
    try {
      await addDocument('drivers', d);
    } catch (err) {
      console.error('Failed to add driver:', err);
      throw err;
    }
  };

  const updateDriver = async (d) => {
    try {
      const { id, ...updates } = d;
      await updateDocument('drivers', id, updates);
    } catch (err) {
      console.error('Failed to update driver:', err);
      throw err;
    }
  };

  const deleteDriver = async (id) => {
    try {
      await deleteDocument('drivers', id);
    } catch (err) {
      console.error('Failed to delete driver:', err);
      throw err;
    }
  };

  // Trips
  const addTrip = async (t) => {
    try {
      await addDocument('trips', t);
    } catch (err) {
      console.error('Failed to add trip:', err);
      throw err;
    }
  };

  const updateTrip = async (t) => {
    try {
      const { id, ...updates } = t;
      await updateDocument('trips', id, updates);
    } catch (err) {
      console.error('Failed to update trip:', err);
      throw err;
    }
  };

  const deleteTrip = async (id) => {
    try {
      await deleteDocument('trips', id);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      throw err;
    }
  };

  const dispatchTrip = async (tripId) => {
    try {
      const trip = state.trips.find(t => t.id === tripId);
      if (!trip) return;
      await updateDocument('trips', tripId, { status: 'Dispatched' });
      await updateDocument('vehicles', trip.vehicleId, { status: 'On Trip' });
      await updateDocument('drivers', trip.driverId, { status: 'On Duty' });
    } catch (err) {
      console.error('Failed to dispatch trip:', err);
      throw err;
    }
  };

  const completeTrip = async (tripId, finalOdometer) => {
    try {
      const trip = state.trips.find(t => t.id === tripId);
      if (!trip) return;
      await updateDocument('trips', tripId, { status: 'Completed', finalOdometer });
      await updateDocument('vehicles', trip.vehicleId, {
        status: 'Available',
        odometer: finalOdometer || undefined,
      });
      await updateDocument('drivers', trip.driverId, { status: 'On Duty' });
    } catch (err) {
      console.error('Failed to complete trip:', err);
      throw err;
    }
  };

  const cancelTrip = async (tripId) => {
    try {
      const trip = state.trips.find(t => t.id === tripId);
      if (!trip) return;
      await updateDocument('trips', tripId, { status: 'Cancelled' });
      if (trip.status === 'Dispatched') {
        await updateDocument('vehicles', trip.vehicleId, { status: 'Available' });
        await updateDocument('drivers', trip.driverId, { status: 'On Duty' });
      }
    } catch (err) {
      console.error('Failed to cancel trip:', err);
      throw err;
    }
  };

  // Expenses
  const addExpense = async (e) => {
    try {
      await addDocument('expenses', e);
    } catch (err) {
      console.error('Failed to add expense:', err);
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteDocument('expenses', id);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      throw err;
    }
  };

  // Maintenance
  const addMaintenance = async (m) => {
    try {
      await addDocument('maintenanceLogs', m);
      // Also set the vehicle to 'In Shop' if it's an active (not completed) log
      if (!m.completed && m.vehicleId) {
        await updateDocument('vehicles', m.vehicleId, { status: 'In Shop' });
      }
    } catch (err) {
      console.error('Failed to add maintenance log:', err);
      throw err;
    }
  };

  const completeMaintenance = async (logId) => {
    try {
      const log = state.maintenanceLogs.find(m => m.id === logId);
      await updateDocument('maintenanceLogs', logId, { completed: true });
      if (log?.vehicleId) {
        await updateDocument('vehicles', log.vehicleId, { status: 'Available' });
      }
    } catch (err) {
      console.error('Failed to complete maintenance:', err);
      throw err;
    }
  };

  const deleteMaintenance = async (id) => {
    try {
      await deleteDocument('maintenanceLogs', id);
    } catch (err) {
      console.error('Failed to delete maintenance log:', err);
      throw err;
    }
  };

  const value = {
    ...state,
    computed,
    loading,
    dispatch,
    // Auth
    login: async (email, password) => {
      try { await loginUser(email, password); } catch (error) { throw error; }
    },
    register: async (email, password, name, role) => {
      try {
        const user = await registerUser(email, password);
        await createUserProfile(user.uid, {
          email,
          name,
          role,
          avatar: name ? name.substring(0, 2).toUpperCase() : 'U'
        });
      } catch (error) {
        throw error;
      }
    },
    logout: async () => {
      try { await logoutUser(); } catch (error) { throw error; }
    },
    // Firestore-backed CRUD
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addDriver,
    updateDriver,
    deleteDriver,
    addTrip,
    updateTrip,
    deleteTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    addExpense,
    deleteExpense,
    addMaintenance,
    completeMaintenance,
    deleteMaintenance,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
