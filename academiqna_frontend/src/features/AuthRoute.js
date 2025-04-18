import React from "react";
import { Navigate } from "react-router-dom";

function AuthRoute({ children }) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    alert("Please login first.");
    return <Navigate to="/login" />;
  }

  return children;
}

export default AuthRoute;
