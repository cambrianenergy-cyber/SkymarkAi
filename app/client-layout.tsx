"use client";

import React from "react";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "../components/Sidebar";
import { UserRoleProvider } from "../components/UserRoleContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserRoleProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 220 }}>
          {children}
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </div>
      </div>
    </UserRoleProvider>
  );
}
