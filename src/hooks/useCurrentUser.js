import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../Provider/AuthProvider";

const API_BASE =  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const useCurrentUser = () => {
  const { user } = useContext(AuthContext);
  const [dbUser, setDbUser] = useState(null);
  const [loadingDbUser, setLoadingDbUser] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.email) {
      setLoadingDbUser(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingDbUser(true);
      setError("");

      try {
        const token = await user.getIdToken();

        const res = await fetch(`${API_BASE}/users/${user.email}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load user profile.");

        const data = await res.json();
        if (!cancelled) setDbUser(data);
      } catch (err) {
        console.error("useCurrentUser error:", err);
        if (!cancelled) setError(err.message || "Failed to load user.");
      } finally {
        if (!cancelled) setLoadingDbUser(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return { dbUser, loadingDbUser, error };
};

export default useCurrentUser;
