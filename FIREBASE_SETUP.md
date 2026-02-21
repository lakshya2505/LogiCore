# 🚀 Firebase Integration Guide for LogiCore

## Overview

LogiCore now uses Firebase for:
- **Authentication**: Email/Password login via Firebase Auth
- **Database**: Firestore for real-time data storage and sync
- **Real-time Sync**: Automatic updates across all connected users

---

## 📋 Setup Steps

### Step 1: Firebase Project Already Created ✅
Your Firebase project is ready:
- **Project**: `logicoree77`
- **Auth**: Email/Password enabled
- **Firestore**: Database created

### Step 2: Initialize Demo Data
1. Start the app: `npm run dev`
2. Go to `http://localhost:5173/setup`
3. Click **"Initialize Firebase"**
4. Wait for setup to complete (check browser console for logs)
5. You'll be redirected to login

### Step 3: Apply Firestore Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `logicoree77`
3. Go to **Firestore Database** → **Rules** tab
4. Replace all content with rules from: `src/config/firestore.rules`
5. Click **Publish**

---

## 🔐 Demo Credentials

After initialization, use these to login:

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@logicore.io` | `manager123` |
| Dispatcher | `dispatcher@logicore.io` | `dispatch123` |

---

## 📁 Firestore Collections Structure

```
logicoree77 (Database)
├── users/
│   ├── {uid1}/
│   │   ├── name: "Vikram Anand"
│   │   ├── role: "Manager"
│   │   ├── avatar: "VA"
│   │   └── createdAt: timestamp
│   └── {uid2}/
│       ├── name: "Meera Pillai"
│       ├── role: "Dispatcher"
│       ├── avatar: "MP"
│       └── createdAt: timestamp
│
├── vehicles/ (8+ demo vehicles)
├── drivers/ (6+ demo drivers)
├── trips/ (12+ demo trips)
├── expenses/ (20+ demo expenses)
└── maintenanceLogs/ (15+ demo logs)
```

---

## 🔒 Security Rules Summary

### Managers
- Full access to all collections
- Can create, read, update, delete any resource

### Dispatchers
- Read access to all collections
- Can create/update trips, expenses, vehicles status
- Cannot delete resources
- Cannot access maintenance logs (read-only)

---

## 🛠️ Key Services

### `src/services/authService.js`
```javascript
loginUser(email, password)        // Login with Firebase
logoutUser()                      // Logout
registerUser(email, password)     // Create new account
onAuthStateChanged(callback)      // Listen to auth state
```

### `src/services/firestoreService.js`
```javascript
// CRUD Operations
addDocument(collection, data)
updateDocument(collection, docId, updates)
deleteDocument(collection, docId)
getDocuments(collection)

// Real-time Listeners
subscribeToCollection(collection, callback)

// User Profile
createUserProfile(userId, userData)
getUserProfile(userId)
```

### `src/services/firebaseInit.js`
```javascript
initializeFirestoreWithDemoData()  // One-time setup
```

---

## 🔄 How It Works

1. **Login**: User enters email/password → Firebase Auth validates
2. **Session**: Firebase maintains session in localStorage automatically
3. **Profile Load**: Get user profile from Firestore `users` collection
4. **Real-time Sync**: Setup listeners for vehicles, drivers, trips, etc.
5. **CRUD Operations**: All changes auto-sync to Firestore
6. **Logout**: Firebase clears session, unsubscribe from listeners

---

## 📊 AppContext Integration

The updated `AppContext`:
- ✅ Manages Firebase auth state
- ✅ Stores app data (vehicles, drivers, trips, etc.)
- ✅ Real-time listeners for data sync
- ✅ Convenience actions for CRUD ops
- ✅ Computed values (KPIs, metrics)
- ✅ Loading state during initialization

---

## 🐛 Troubleshooting

### "Users not created" 
- Check Firebase Console > Authentication > Users tab
- Ensure Email/Password auth is enabled
- Check browser console for error details

### "Data not loading after login"
- Check Firestore collections exist with demo data
- Verify Firestore Rules are not blocking reads
- Check network tab in browser dev tools

### "Can't modify data as Dispatcher"
- Verify security rules are published correctly
- Check user role in Firestore users collection
- Rules may prevent certain operations (by design)

### "App stuck on loading"
- Run setup page again: `http://localhost:5173/setup`
- Check browser console for errors
- Clear browser localStorage: `localStorage.clear()`

---

## 🚀 Production Deployment

Before deploying to production:

1. **Change Credentials**: Don't use demo credentials
2. **Update Rules**: Adjust security rules for your use case
3. **Enable HTTPS**: Firebase requires secure context
4. **Backup Data**: Export Firestore data regularly
5. **Monitor Costs**: Watch Firestore usage limits
6. **Enable MFA**: Add multi-factor authentication in Firebase

---

## 📚 Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

## ✅ Next Steps

After setup:
1. ✅ Test login with both demo accounts
2. ✅ Verify data loads on dashboard
3. ✅ Test CRUD operations (add vehicle, create trip, etc.)
4. ✅ Verify Dispatcher restrictions work
5. ✅ Check real-time sync (open in 2 tabs)

---

**Setup complete! LogiCore is now powered by Firebase. 🔥**
