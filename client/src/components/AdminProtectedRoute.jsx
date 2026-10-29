import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem("admin_token");
  const toastFired = useRef(false);

  useEffect(() => {
    if (!adminToken && !toastFired.current) {
      toastFired.current = true;
      toast.error("Cinema Administrator credentials required to access the Admin Dashboard.", {
        id: "admin-guard-redirect",
        icon: "🛡️",
        duration: 4000,
        style: {
          background: "#0f172a",
          color: "#fca5a5",
          border: "1px solid #f43f5e",
        },
      });
    }
  }, [adminToken]);

  if (!adminToken) {
    const returnPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/sign-in?role=admin&redirect_url=${encodeURIComponent(returnPath)}`}
        state={{ returnUrl: returnPath, from: location }}
        replace
      />
    );
  }

  return children;
};

export default AdminProtectedRoute;
