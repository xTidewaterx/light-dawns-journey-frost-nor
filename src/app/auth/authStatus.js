'use client'

import { useEffect } from "react";
import { useAuth } from "./authContext";

const AuthStatus = () => {
  const { user, handleSignOut } = useAuth();










  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.email}! </p> <p> Welcome {user.displayName}!</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </>
      ) : (
        <p>No user signed in</p>
      )}
    </div>
  );
};

export default AuthStatus;

