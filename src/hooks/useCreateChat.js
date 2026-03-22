import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Creates a new chat between two users or fetches an existing one.
 * @param {string} uid1 - Current user ID
 * @param {string} uid2 - Other user ID
 * @returns {Promise<string>} chatId
 */
export const createOrFetchChat = async (uid1, uid2) => {
  const chatsRef = collection(db, 'chats');

  // Sort UIDs to ensure consistent chatId for both users
  const sortedUIDs = [uid1, uid2].sort();

  // Check if chat already exists
  const q = query(chatsRef, where('participants', '==', sortedUIDs));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Return existing chatId
    return snapshot.docs[0].id;
  }

  // Create new chat document
  const newChatDoc = await addDoc(chatsRef, {
    participants: sortedUIDs,
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastSender: ''
  });

  return newChatDoc.id;
};