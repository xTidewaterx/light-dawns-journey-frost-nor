"use client";

import { useState } from "react";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig"; // your working config file

export default function SyncUsersButton() {
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);

      if (usersSnap.empty) {
        setMessage("No users found to sync.");
        return;
      }

      const batch = writeBatch(db);

      usersSnap.forEach((userDoc) => {
        const data = userDoc.data();

        // Only copy safe fields, provide defaults if needed
        const safeData = {};
        if (data.username) safeData.username = data.username;
        if (data.displayName) safeData.displayName = data.displayName || "";
        if (data.profilePic) safeData.profilePic = data.profilePic || null;
        // add any other safe fields here, e.g. bio, tag, etc.
        if (data.tag) safeData.tag = data.tag;

        const publicDocRef = doc(db, "publicUsers", userDoc.id);
        batch.set(publicDocRef, safeData);
      });

      await batch.commit();
      setMessage("Users synced successfully!");
    } catch (err) {
      console.error("Failed to sync users", err);
      setMessage("Failed to sync users. Check console for details.");
    }
  };

  return (
    <div>
      <button onClick={handleSync} className="px-4 py-2 bg-blue-600 text-white rounded">
        Sync Users
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
