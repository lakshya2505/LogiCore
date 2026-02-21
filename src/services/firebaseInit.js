import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile, batchSetDocuments } from '../services/firestoreService';
import { seedData } from '../data/seedData';

/**
 * Initialize Firebase with demo users and seed data
 * Call this once on first app load, or create a manual setup button
 */
export const initializeFirestoreWithDemoData = async () => {
  try {
    console.log('🚀 Starting Firebase initialization with demo data...');

    // 1. Create demo users if they don't exist
    const demoUsers = [
      {
        email: 'manager@logicore.io',
        password: 'manager123',
        profile: {
          name: 'Vikram Anand',
          role: 'Manager',
          avatar: 'VA'
        }
      },
      {
        email: 'dispatcher@logicore.io',
        password: 'dispatch123',
        profile: {
          name: 'Meera Pillai',
          role: 'Dispatcher',
          avatar: 'MP'
        }
      }
    ];

    for (const user of demoUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        await createUserProfile(userCredential.user.uid, user.profile);
        console.log(`✅ Created user: ${user.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`ℹ️  User already exists: ${user.email}`);
        } else {
          throw error;
        }
      }
    }

    // 2. Seed demo data to Firestore
    console.log('📦 Seeding demo data to Firestore...');

    // Seed vehicles
    const vehiclesWithIds = seedData.vehicles.map(v => ({ id: v.id, ...v }));
    await batchSetDocuments('vehicles', vehiclesWithIds);
    console.log(`✅ Seeded ${vehiclesWithIds.length} vehicles`);

    // Seed drivers
    const driversWithIds = seedData.drivers.map(d => ({ id: d.id, ...d }));
    await batchSetDocuments('drivers', driversWithIds);
    console.log(`✅ Seeded ${driversWithIds.length} drivers`);

    // Seed trips
    const tripsWithIds = seedData.trips.map(t => ({ id: t.id, ...t }));
    await batchSetDocuments('trips', tripsWithIds);
    console.log(`✅ Seeded ${tripsWithIds.length} trips`);

    // Seed maintenance logs
    const maintWithIds = seedData.maintenanceLogs.map(m => ({ id: m.id, ...m }));
    await batchSetDocuments('maintenanceLogs', maintWithIds);
    console.log(`✅ Seeded ${maintWithIds.length} maintenance logs`);

    // Seed expenses
    const expensesWithIds = seedData.expenses.map(e => ({ id: e.id, ...e }));
    await batchSetDocuments('expenses', expensesWithIds);
    console.log(`✅ Seeded ${expensesWithIds.length} expenses`);

    console.log('🎉 Firebase initialization complete!');
    console.log('\n📝 Demo credentials:');
    console.log('   Manager: manager@logicore.io / manager123');
    console.log('   Dispatcher: dispatcher@logicore.io / dispatch123');

    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};
