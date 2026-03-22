"use client";

import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "./firebaseConfig";

export const ResetPassword = ({ authObject }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handlePasswordReset = async () => {
    const auth = getAuth(app);

    if (!authObject?.email) {
      setErrorMessage("Please enter your email first.");
      setSuccessMessage("");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, authObject.email);
      setSuccessMessage("Password reset email sent. Check your inbox.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Unable to send reset email.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="mt-4 text-center">
      <button
        onClick={handlePasswordReset}
        className="text-sm text-primary-600 hover:underline dark:text-primary-400"
        type="button"
      >
        Forgot your password?
      </button>
      {errorMessage && <p className="mt-2 text-sm text-red-500">{errorMessage}</p>}
      {successMessage && <p className="mt-2 text-sm text-green-500">{successMessage}</p>}
    </div>
  );
};
