// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [perfil, setPerfil] = useState(() => {
    const storedPerfil = localStorage.getItem("perfil");
    return storedPerfil ? JSON.parse(storedPerfil) : null;
  });

  const login = (userData, perfilData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("perfil", JSON.stringify(perfilData));
    setUser(userData);
    setPerfil(perfilData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setPerfil(null);
  };

  return (
    <AuthContext.Provider value={{ user, perfil, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
