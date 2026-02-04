// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { RouterProvider } from "react-router-dom";
import router from "./Routes/Routes";

import "aos/dist/aos.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import ThemeProvider from "./Provider/ThemeProvider";
import AuthProvider from "./Provider/AuthProvider";
import CartProvider from "./Provider/CartProvider";

// ✅ must be VITE_STRIPE_PUBLISHABLE_KEY in frontend .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {/* ✅ Elements MUST wrap the component tree that calls useStripe() */}
          <Elements stripe={stripePromise}>
            <RouterProvider router={router} />
            <ToastContainer position="top-right" autoClose={2500} />
          </Elements>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
