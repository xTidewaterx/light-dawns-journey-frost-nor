import { getFirestore, doc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import {app} from "../../firebase/firebaseConfig"
const db = getFirestore(app);

export async function saveFavourite(productId, user) {
  try {
    // 1️⃣ Guard: user must be logged in
    if (!user || !user.uid) {
      console.log('❌ User not logged in, cannot save favourite');
      // Show popup alert
      alert('To favourite items, you must be signed in. Please log in to your account.');
      return false;
    }

    if (!productId) {
      console.log('❌ Missing productId');
      return false;
    }

    // 2️⃣ Reference: users/{uid}/favourites
    const userDocRef = doc(db, 'users', user.uid);
    const favouritesRef = collection(userDocRef, 'favourites');

    // 2.5️⃣ Check if already favorited
    const q = query(favouritesRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // If already favorited, remove it
      snapshot.docs.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
      console.log('💔 Favourite removed:', {
        productId,
        userId: user.uid,
      });
      return true; // return true to indicate unfavoriting
    }

    // 3️⃣ Save favourite
    await addDoc(favouritesRef, {
      productId,
      createdAt: serverTimestamp(),
    });

    console.log('❤️ Favourite saved:', {
      productId,
      userId: user.uid,
    });
    return true; // return true to indicate success
  } catch (error) {
    console.error('🚨 Error saving favourite:', error);
    return false;
  }
}

// Helper function to check if a product is favorited
export async function isFavourited(productId, user) {
  try {
    if (!user || !user.uid) return false;
    
    const userDocRef = doc(db, 'users', user.uid);
    const favouritesRef = collection(userDocRef, 'favourites');
    const q = query(favouritesRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('🚨 Error checking favourite:', error);
    return false;
  }
}
