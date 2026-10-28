import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

/**
 * ProtectedRoute Guard Component
 * Enforces authentication before accessing sensitive actions (Seat booking, Checkout, Favourites, My Bookings).
 * Preserves the return URL and route state so users can seamlessly resume after signing in.
 */
const ProtectedRoute = ({ children, message }) => {
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();
  const toastFired = useRef(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !toastFired.current) {
      toastFired.current = true;
      const isBookingPath =
        location.pathname.includes("/booking") ||
        location.pathname.includes("/movie/") ||
        (location.pathname.startsWith("/movies/") && location.pathname.split("/").length > 3);

      const defaultMsg = isBookingPath
        ? "Please sign in to select seats and complete your cinema ticket reservation."
        : location.pathname.includes("favourite")
        ? "Please sign in to view and manage your favourite movies."
        : "Please sign in to access your QuickShow account.";

      toast.error(message || defaultMsg, {
        id: "auth-guard-redirect",
        icon: "🔒",
        duration: 4000,
        style: {
          background: "#0f172a",
          color: "#f87171",
          border: "1px solid #e11d48",
        },
      });
    }
  }, [isLoaded, isSignedIn, location.pathname, message]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-semibold tracking-wide">
          Verifying QuickShow authentication...
        </p>
      </div>
    );
  }

  // If unauthenticated, redirect to sign-in with return URL and route state preserved
  if (!isSignedIn) {
    const returnPath = location.pathname + location.search + location.hash;
    return (
      <Navigate
        to={`/sign-in?redirect_url=${encodeURIComponent(returnPath)}`}
        state={{
          returnUrl: returnPath,
          from: location,
          ...(location.state || {}),
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
