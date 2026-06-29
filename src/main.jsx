// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import "./index.css";
import "aos/dist/aos.css";
import "react-toastify/dist/ReactToastify.css";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import router from "./Routes/Routes";

import ThemeProvider from "./Provider/ThemeProvider";
import AuthProvider from "./Provider/AuthProvider";
import CartProvider from "./Provider/CartProvider";
import AOSInitializer from "./Components/AOSInitializer";

const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error(
    "Missing VITE_STRIPE_PUBLISHABLE_KEY in the frontend environment variables."
  );
}

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Elements stripe={stripePromise}>
            <AOSInitializer />

            <RouterProvider router={router} />

            <ToastContainer
              position="top-right"
              autoClose={2500}
            />
          </Elements>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);