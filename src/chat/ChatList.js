import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';

export default function ChatList({ onUserSelect }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef));
      const userList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== auth.currentUser?.uid); // don’t show yourself
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  return (
    <div className="chat-list">
      <h3>Start a Chat</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <button onClick={() => onUserSelect(user.id)}>
              {user.name || user.email}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}