import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <App />
      </>
    </AuthProvider>
  </React.StrictMode>
);
