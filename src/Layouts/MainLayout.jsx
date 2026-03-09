import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../Components/Footer";
import Container from "../Components/Container";
import useApps from "../hooks/useApps";
import LoadingSpinnerCopy from "../Components/LoadingSpinnercopy";
import AOS from "aos";
import { ToastContainer } from "react-toastify";
import "aos/dist/aos.css";
import ScrollToTop from "../Components/ScrollToTop";

// ✅ Use your new global header component
// If you named it Navbar, replace this line with: import Navbar from "../Components/Navbar";
import Header from "../Components/Header/HeaderWalmart";
import TopUtilityBar from "../Components/Header/TopUtilityBar";
import FloatingChatWidget from "../Components/Chat/FloatingChatWidget";
import HeaderWalmart from "../Components/Header/HeaderWalmart";

const MainLayout = () => {
  const { loading } = useApps();
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-base-100 text-base-content ">
      <ScrollToTop />
      {/* ✅ Global Sticky Header */}
      <div className="sticky top-0 z-[99990]">
        <HeaderWalmart />
        <TopUtilityBar />
      </div>
      {/* ✅ Main Content */}
      <div className="flex-1 overflow-x-hidden">
        <main id="main" className="flex-1">
          {loading ? <LoadingSpinnerCopy /> : <Outlet />}
        </main>
        <FloatingChatWidget /> {/* ✅ global floating chat */}
        {/* ✅ Footer */}
        <Footer />
      </div>
      {/* ✅ Toasts live here, once for the whole app */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{ zIndex: 999999 }}
      />
    </div>
  );
};

export default MainLayout;
