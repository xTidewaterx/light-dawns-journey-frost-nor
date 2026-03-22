import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

//heart of operation, here we have onsnapshotg and snapshot.docs.maps doc
//we have sendMessage async return async text

//await addDoc msgRef sender currentUserId



import { db } from '../firebase/firebaseConfig';

export function useChat(chatId, currentUserId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    }, (error) => {
      console.error("Snapshot listener error in useChat:", error.message);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || !chatId || !currentUserId) return;

    const msgRef = collection(db, 'chats', chatId, 'messages');

    try {
      await addDoc(msgRef, {
        text: trimmed,
        sender: currentUserId,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };

  return { messages, sendMessage };
}