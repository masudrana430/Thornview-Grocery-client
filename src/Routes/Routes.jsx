import { createBrowserRouter } from "react-router-dom";
// import App from "../App";
// import Home from "../Pages/Home";

import MainLayout from "../Layouts/MainLayout";
import ErrorPage from "../Pages/ErrorPage";

import LoadingSpinnerCopy from "../Components/LoadingSpinnercopy";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import AuthLayout from "../Layouts/AuthLayout";
import Profile from "../Pages/Profile";
import PrivatRoute from "../Provider/PrivatRoute";

import ForgotPassword from "../Pages/ForgotPassword";
import Home from "../Pages/Home/Home";
import ShopResults from "../Pages/Shop/ShopResults";
import ProductDetails from "../Pages/Product/ProductDetails";
import CartPage from "../Pages/Cart/CartPage";
import CheckoutPage from "../Pages/Checkout/CheckoutPage";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import OrderDetailsPage from "../Pages/Orders/OrderDetailsPage";
import MyOrdersPage from "../Pages/Account/MyOrdersPage";
import AdminRoute from "./AdminRoute";
import AdminLayout from "../Pages/Admin/AdminLayout";
import AdminDashboard from "../Pages/Admin/AdminDashboardPage";
import AdminOrdersPage from "../Pages/Admin/AdminOrdersPage";
import AdminProductsPage from "../Pages/Admin/AdminProductsPage";
import AdminUsersPage from "../Pages/Admin/AdminUsersPage";
import LiveChat from "../Pages/Admin/LiveChat";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: (
      <div>
        {" "}
        <LoadingSpinnerCopy />{" "}
      </div>
    ),
    children: [
      {
        index: true,
        element: <Home />,

        errorElement: <ErrorPage />,
      },
      {
        path: "/shop",
        element: <ShopResults />,
      },
      {
        path: "/product/:idOrSlug",
        element: <ProductDetails />,
      },
      {
        path: "/cart",
        element: <CartPage />,
      },
      {
        path: "/checkout",
        element: (
          <PrivatRoute>
            <Elements stripe={stripePromise}>
              <CheckoutPage />
            </Elements>
          </PrivatRoute>
        ),
      },
      { path: "/orders/:orderId", element:  <PrivatRoute><OrderDetailsPage /></PrivatRoute> },
      { path: "/account/orders", element:  <PrivatRoute><MyOrdersPage /></PrivatRoute> },

      {
        path: "/*",
        element: <ErrorPage />,
      },
      {
        path: "/my-profile",
        element: <Profile />,
      },

      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          {
            path: "/auth/login",
            element: <Login />,
          },
          {
            path: "/auth/register",
            element: <Register />,
          },
          {
            path: "/auth/forgot",
            element: <ForgotPassword />,
          },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "products", element: <AdminProductsPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "live-chat", element: <LiveChat /> },
    ],
  },
]);

// console.log(router);

export default router;
