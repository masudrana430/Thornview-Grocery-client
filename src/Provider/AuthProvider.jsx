import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "../firebase/firebase.config";
import { AuthContext } from "../context/AuthContext";
import { apiPost, clearToken } from "../services/api";
import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  // Prevents duplicate backend session creation for the same Firebase user.
  const lastUidRef = useRef(null);

  const createUser = async (email, password) => {
    setLoading(true);

    try {
      return await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);

    try {
      return await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateUser = async (updatedData) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }

    await updateProfile(auth.currentUser, updatedData);

    // Firebase mutates currentUser, so copy it to trigger a React update.
    setUser({ ...auth.currentUser });
  };

  const logOut = async () => {
    setLoading(true);

    try {
      try {
        await apiPost("/api/auth/logout", {});
      } catch (error) {
        console.error("Backend logout failed:", error);
      }

      await signOut(auth);
    } catch (error) {
      console.error("Firebase logout failed:", error);
      throw error;
    } finally {
      setUser(null);
      setSessionReady(false);
      lastUidRef.current = null;
      clearToken();
      disconnectSocket();
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setSessionReady(false);

        if (!currentUser) {
          lastUidRef.current = null;
          clearToken();
          setLoading(false);
          return;
        }

        setLoading(true);

        // Avoid creating the same backend session multiple times.
        if (lastUidRef.current === currentUser.uid) {
          setSessionReady(true);
          setLoading(false);
          return;
        }

        lastUidRef.current = currentUser.uid;

        try {
          const firebaseIdToken =
            await currentUser.getIdToken();

          const loginResponse = await apiPost(
            "/api/auth/login",
            {
              firebaseIdToken,
            }
          );

          const accessToken =
            loginResponse?.data?.accessToken;

          if (!accessToken) {
            throw new Error(
              "Backend login did not return an access token"
            );
          }

          localStorage.setItem(
            "accessToken",
            accessToken
          );

          setSessionReady(true);
        } catch (error) {
          console.error(
            "Backend session bootstrap failed:",
            error
          );

          lastUidRef.current = null;
          setSessionReady(false);
          clearToken();
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      disconnectSocket();
      return undefined;
    }

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [sessionReady]);

  const authValue = {
    user,
    loading,
    sessionReady,
    createUser,
    signIn,
    logOut,
    setUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}