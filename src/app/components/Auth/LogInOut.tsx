"use client";

import {getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User} from "firebase/auth";
import styles from "@/app/components/Auth/LogInOut.module.css";
import {auth} from "@/app/config/firebase";
import React, {useState} from "react";

export default function LogInOut() {

  const [user, setUser] = useState<User | null>(null);
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

  return (<div className={styles.loginPanel}>
    {user
        ? <div>
            <span> Logged In as: {user.displayName} </span>
            <button onClick={handleSignOut} className={styles.loginButton}>Sign Out</button>
          </div>
        : <button onClick={handleGoogle} className={styles.loginButton}>Sign In with Google</button>
    }
  </div>);
};