import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { seedData } from '../data/seedData';
import { onAuthStateChanged, loginUser, logoutUser } from '../services/authService';
import { getUserProfile, createUserProfile, getDocuments, subscribeToCollection } from '../services/firestoreService';

const AppContext = createContext(null);

function getInitialState() {
  return {
    vehicles: [],
    drivers: [],
    trips: [],
    maintenanceLogs: [],
    expenses: [],
    user: null,
    loading: true,
  };
}

function reducer(state, action) {
  switch (action.type) {
    // Auth
    case 'LOGIN':   return { ...state, user: action.payload };
    case 'LOGOUT':  return { ...state, user: null };

    // Bulk set from Firestore
    case 'SET_VEHICLES':       return { ...state, vehicles: action.payload };
    case 'SET_DRIVERS':        return { ...state, drivers: action.payload };
    case 'SET_TRIPS':          return { ...state, trips: action.payload };
    case 'SET_MAINTENANCE_LOGS': return { ...state, maintenanceLogs: action.payload };
    case 'SET_EXPENSES':       return { ...state, expenses: action.payload };

    // Vehicles
    case 'ADD_VEHICLE':    return { ...state, vehicles: [...state.vehicles, action.payload] };
    case 'UPDATE_VEHICLE': return { ...state, vehicles: state.vehicles.map(v => v.id === action.payload.id ? { ...v, ...action.payload } : v) };
    case 'DELETE_VEHICLE': return { ...state, vehicles: state.vehicles.filter(v => v.id !== action.payload) };

    // Drivers
    case 'ADD_DRIVER':    return { ...state, drivers: [...state.drivers, action.payload] };
    case 'UPDATE_DRIVER': return { ...state, drivers: state.drivers.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };
    case 'DELETE_DRIVER': return { ...state, drivers: state.drivers.filter(d => d.id !== action.payload) };

    // Trips
    case 'ADD_TRIP': return { ...state, trips: [...state.trips, action.payload] };
    case 'UPDATE_TRIP': return { ...state, trips: state.trips.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'DELETE_TRIP': return { ...state, trips: state.trips.filter(t => t.id !== action.payload) };

    // Dispatch a trip: set vehicle + driver to On Trip
    case 'DISPATCH_TRIP': {
      const trip = state.trips.find(t => t.id === action.payload);
      if (!trip) return state;
      return {
        ...state,
        trips: state.trips.map(t => t.id === action.payload ? { ...t, status: 'Dispatched' } : t),
        vehicles: state.vehicles.map(v => v.id === trip.vehicleId ? { ...v, status: 'On Trip' } : v),
        drivers: state.drivers.map(d => d.id === trip.driverId ? { ...d, status: 'On Duty' } : d),
      };
    }

    // Complete a trip
    case 'COMPLETE_TRIP': {
      const { tripId, finalOdometer } = action.payload;
      const trip = state.trips.find(t => t.id === tripId);
      if (!trip) return state;
      return {
        ...state,
        trips: state.trips.map(t => t.id === tripId ? { ...t, status: 'Completed', finalOdometer } : t),
        vehicles: state.vehicles.map(v => v.id === trip.vehicleId
          ? { ...v, status: 'Available', odometer: finalOdometer || v.odometer }
          : v
        ),
        drivers: state.drivers.map(d => d.id === trip.driverId ? { ...d, status: 'On Duty' } : d),
      };
    }

    // Cancel a trip
    case 'CANCEL_TRIP': {
      const trip = state.trips.find(t => t.id === action.payload);
      if (!trip) return state;
      const wasDispatched = trip.status === 'Dispatched';
      return {
        ...state,
        trips: state.trips.map(t => t.id === action.payload ? { ...t, status: 'Cancelled' } : t),
        vehicles: wasDispatched ? state.vehicles.map(v => v.id === trip.vehicleId ? { ...v, status: 'Available' } : v) : state.vehicles,
        drivers: wasDispatched ? state.drivers.map(d => d.id === trip.driverId ? { ...d, status: 'On Duty' } : d) : state.drivers,
      };
    }

    // Maintenance
    case 'ADD_MAINTENANCE': {
      return {
        ...state,
        maintenanceLogs: [...state.maintenanceLogs, action.payload],
        vehicles: state.vehicles.map(v => v.id === action.payload.vehicleId && !action.payload.completed
          ? { ...v, status: 'In Shop' }
          : v
        ),
      };
    }
    case 'COMPLETE_MAINTENANCE': {
      const log = state.maintenanceLogs.find(m => m.id === action.payload);
      return {
        ...state,
        maintenanceLogs: state.maintenanceLogs.map(m => m.id === action.payload ? { ...m, completed: true } : m),
        vehicles: log ? state.vehicles.map(v => v.id === log.vehicleId ? { ...v, status: 'Available' } : v) : state.vehicles,
      };
    }
    case 'DELETE_MAINTENANCE': return { ...state, maintenanceLogs: state.maintenanceLogs.filter(m => m.id !== action.payload) };

    // Expenses
    case 'ADD_EXPENSE':    return { ...state, expenses: [...state.expenses, action.payload] };
    case 'DELETE_EXPENSE': return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

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
        // User is logged in - fetch their profile and data
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            dispatch({
              type: 'LOGIN',
              payload: {
                id: firebaseUser.uid,
                email: firebaseUser.email,
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
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      } else {
        // User logged out
        dispatch({ type: 'LOGOUT' });
        // Cleanup subscriptions
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

  // Helper: generate ID
  const genId = (prefix) => `${prefix}${Date.now()}`;

  // Computed values
  const computed = {
    activeFleet: state.vehicles.filter(v => ['Available', 'On Trip'].includes(v.status)).length,
    maintenanceAlerts: state.vehicles.filter(v => v.status === 'In Shop').length,
    utilizationRate: state.vehicles.length > 0
      ? Math.round((state.vehicles.filter(v => v.status === 'On Trip').length / state.vehicles.filter(v => v.status !== 'Retired').length) * 100)
      : 0,
    pendingCargo: state.trips.filter(t => t.status === 'Draft').length,
    totalRevenue: state.trips.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.revenue || 0), 0),
    totalExpenses: state.expenses.reduce((s, e) => s + (e.cost || 0), 0) + state.maintenanceLogs.reduce((s, m) => s + (m.cost || 0), 0),
  };

  const value = {
    ...state,
    computed,
    loading,
    dispatch,
    // Convenience actions
    login: async (email, password) => {
      try {
        await loginUser(email, password);
      } catch (error) {
        throw error;
      }
    },
    logout: async () => {
      try {
        await logoutUser();
      } catch (error) {
        throw error;
      }
    },
    addVehicle: (v) => dispatch({ type: 'ADD_VEHICLE', payload: { ...v, id: genId('v') } }),
    updateVehicle: (v) => dispatch({ type: 'UPDATE_VEHICLE', payload: v }),
    deleteVehicle: (id) => dispatch({ type: 'DELETE_VEHICLE', payload: id }),
    addDriver: (d) => dispatch({ type: 'ADD_DRIVER', payload: { ...d, id: genId('d') } }),
    updateDriver: (d) => dispatch({ type: 'UPDATE_DRIVER', payload: d }),
    deleteDriver: (id) => dispatch({ type: 'DELETE_DRIVER', payload: id }),
    addTrip: (t) => dispatch({ type: 'ADD_TRIP', payload: { ...t, id: genId('t') } }),
    updateTrip: (t) => dispatch({ type: 'UPDATE_TRIP', payload: t }),
    dispatchTrip: (id) => dispatch({ type: 'DISPATCH_TRIP', payload: id }),
    completeTrip: (tripId, finalOdometer) => dispatch({ type: 'COMPLETE_TRIP', payload: { tripId, finalOdometer } }),
    cancelTrip: (id) => dispatch({ type: 'CANCEL_TRIP', payload: id }),
    addMaintenance: (m) => dispatch({ type: 'ADD_MAINTENANCE', payload: { ...m, id: genId('m') } }),
    completeMaintenance: (id) => dispatch({ type: 'COMPLETE_MAINTENANCE', payload: id }),
    deleteMaintenance: (id) => dispatch({ type: 'DELETE_MAINTENANCE', payload: id }),
    addExpense: (e) => dispatch({ type: 'ADD_EXPENSE', payload: { ...e, id: genId('e') } }),
    deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', payload: id }),
    deleteTrip: (id) => dispatch({ type: 'DELETE_TRIP', payload: id }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
