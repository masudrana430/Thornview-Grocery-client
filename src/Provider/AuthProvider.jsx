// src/Provider/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth } from "../firebase/firebase.config";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { apiPost, clearToken } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";


export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ loading true until session is ready (cookies + token)
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const lastUidRef = useRef(null);

  const createUser = async (email, password) => {
    setLoading(true);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email, password) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const updateUser = async (updatedData) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, updatedData);
    setUser({ ...auth.currentUser });
  };

  const logOut = async () => {
    setLoading(true);
    try {
      try {
        await apiPost("/api/auth/logout", {});
      } catch (_) {}
      await signOut(auth);
    } finally {
      setUser(null);
      setSessionReady(false);
      lastUidRef.current = null;
      clearToken(); // ✅ remove local accessToken
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setSessionReady(false);

      if (!currentUser) {
        lastUidRef.current = null;
        clearToken(); // ✅ no user => no token
        setLoading(false);
        return;
      }

      setLoading(true);

      if (lastUidRef.current === currentUser.uid) {
        setSessionReady(true);
        setLoading(false);
        return;
      }
      lastUidRef.current = currentUser.uid;

      try {
        const firebaseIdToken = await currentUser.getIdToken(); // ok
        const loginRes = await apiPost("/api/auth/login", { firebaseIdToken });

        // ✅ VERY IMPORTANT: store accessToken returned by backend
        const accessToken = loginRes?.data?.accessToken;
        if (accessToken) localStorage.setItem("accessToken", accessToken);

        setSessionReady(true);
      } catch (err) {
        console.error("Backend session bootstrap failed:", err);
        setSessionReady(false);
        clearToken();
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);
  

  // ✅ manage socket connection based on sessionReady
  useEffect(() => {
  if (!sessionReady) {
    disconnectSocket();
    return;
  }

  // ✅ sessionReady means token is stored in localStorage
  connectSocket();

  return () => disconnectSocket();
}, [sessionReady]);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionReady,
        createUser,
        signIn,
        logOut,
        setUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
