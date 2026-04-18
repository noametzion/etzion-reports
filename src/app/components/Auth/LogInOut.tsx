"use client";

import {getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User} from "firebase/auth";
import styles from "@/app/components/Auth/LogInOut.module.css";
import {auth} from "@/app/config/firebase";
import React, {useState} from "react";
import { FaUserCircle } from "react-icons/fa";

export default function LogInOut() {

  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  React.useEffect(() => {
    const auth = getAuth();

    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
    });
  }, []);

  const handleSignOut = () => {
    const auth = getAuth();
    return signOut(auth);
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleGoogleSignIn = async () => {
    await handleGoogle();
    setIsOpen(false);
  };

  const handleUserSignOut = async () => {
    await handleSignOut();
    setIsOpen(false);
  };

  return (
    <div className={styles.loginWidget}>
      {isOpen && (
        <div className={styles.loginPanel}>
          {user ? (
            <>
              <div className={styles.userLabel}>Logged in as</div>
              <div className={styles.userName}>{user.displayName || user.email || "User"}</div>
              {user.email && <div className={styles.userEmail}>{user.email}</div>}
              <button onClick={handleUserSignOut} className={styles.loginButton}>Sign Out</button>
            </>
          ) : (
            <>
              <div className={styles.userLabel}>Account</div>
              <button onClick={handleGoogleSignIn} className={styles.loginButton}>Sign In with Google</button>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleToggle}
        className={styles.toggleButton}
        aria-label={isOpen ? "Close account panel" : "Open account panel"}
        aria-expanded={isOpen}
        type="button"
      >
        <FaUserCircle />
      </button>
    </div>
  );
};
