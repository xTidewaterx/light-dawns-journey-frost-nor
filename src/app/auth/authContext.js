'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc
} from 'firebase/firestore';

import { app } from '../../firebase/firebaseConfig'; // ✅ Make sure this path is correct

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const auth = typeof window !== 'undefined' ? getAuth(app) : null;
  const db = typeof window !== 'undefined' ? getFirestore(app) : null;

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 🔍 Attempt to fetch Firestore profile document
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);

          const profileData = profileSnap.exists() ? profileSnap.data() : {};

          // 🧩 Combine Firebase Auth + Firestore profile
          const combinedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...profileData
          };

          setUser(combinedUser);
          sessionStorage.setItem('currentUser', JSON.stringify(combinedUser));

        } catch (error) {
          console.error('🚨 Error fetching Firestore profile:', error.message);
          // Fallback to using auth-only data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
        }
      } else {
        // 🔐 User signed out
        setUser(null);
        sessionStorage.removeItem('currentUser');
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  console.log('✅ user from authContext.js:', user);

  return (
    <AuthContext.Provider value={{ user, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);