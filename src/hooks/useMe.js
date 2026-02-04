import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await apiGet("/api/users/me");
        if (!alive) return;
        setMe(res?.data?.user || null);
      } catch {
        if (!alive) return;
        setMe(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { me, loading };
}
