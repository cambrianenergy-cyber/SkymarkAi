"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserRoleContextType {
  role: string;
  workspaceRole: string;
  loading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType>({ role: '', workspaceRole: '', loading: true });

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState('');
  const [workspaceRole, setWorkspaceRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      const userId = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : '';
      const workspaceId = 'V7kzoES7soCvRCWa74Kg';
      if (!userId) return setLoading(false);
      const res = await fetch(`/api/user/role?userId=${userId}&workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role || '');
        setWorkspaceRole(data.workspaceRole || '');
      }
      setLoading(false);
    }
    fetchRoles();
  }, []);

  return (
    <UserRoleContext.Provider value={{ role, workspaceRole, loading }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  return useContext(UserRoleContext);
}
