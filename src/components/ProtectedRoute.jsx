import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role = null }) => {
  const { user: contextUser, perfil: contextPerfil } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let user = contextUser;
        let perfil = contextPerfil;

        if (!user) {
          const { data } = await supabase.auth.getUser();
          user = data?.user || null;
        }

        if (!perfil) {
          perfil = JSON.parse(localStorage.getItem("perfil") || "null");
        }

        if (!user && perfil?.user_id) {
          user = { id: perfil.user_id, user_metadata: { role: perfil.role } };
        }

        if (!user) {
          setAuthorized(false);
          return;
        }

        if (!perfil && user.id) {
          const { data: perfilData } = await supabase
            .from("perfis")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (perfilData) {
            perfil = perfilData;
            localStorage.setItem("perfil", JSON.stringify(perfilData));
          }
        }

        const resolvedRole = user.user_metadata?.role || perfil?.role || null;

        if (!role) {
          setAuthorized(true);
          return;
        }

        if (role === "transportadora") {
          setAuthorized(resolvedRole === "transportadora" || resolvedRole === "admin");
          return;
        }

        setAuthorized(resolvedRole === role);
      } catch (err) {
        console.error("Erro checando autenticação:", err);
        setAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [contextPerfil, contextUser, role]);

  if (isLoading) {
    return <div className="p-4 text-slate-700">Carregando autenticação...</div>;
  }

  if (!authorized) {
    const perfil = JSON.parse(localStorage.getItem("perfil") || "null");
    if (perfil) {
      return <Navigate to="/selecao" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
