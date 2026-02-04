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
import Header from "../Components/Header/Header";
import TopUtilityBar from "../Components/Header/TopUtilityBar";
import FloatingChatWidget from "../Components/Chat/FloatingChatWidget";

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
    <div className="flex  flex-col bg-base-100 text-base-content">
      <ScrollToTop />

      {/* ✅ Global Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-base-200 bg-base-100/85 backdrop-blur">
        
          
          <Header />
          <TopUtilityBar />
        
      </header>

      {/* ✅ Main Content */}
      <main id="main" className="flex-1">
        {loading ? <LoadingSpinnerCopy /> : <Outlet />}
      </main>

      <FloatingChatWidget />   {/* ✅ global floating chat */}

      {/* ✅ Footer */}
      <Footer />

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
