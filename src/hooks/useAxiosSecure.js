import axios from "axios";
import { useContext, useEffect } from "react";
import { AuthContext } from "../Provider/AuthProvider";

const axiosSecure = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
});

const useAxiosSecure = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    const interceptor = axiosSecure.interceptors.request.use(
      async (config) => {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosSecure.interceptors.request.eject(interceptor);
    };
  }, [user]);

  return axiosSecure;
};

export default useAxiosSecure;
