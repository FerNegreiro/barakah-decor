import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { isAuthenticated } from "./utils/auth";
import { isAdmin } from "./utils/currentUser";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Entradas from "./pages/Entradas";
import Saidas from "./pages/Saidas";
import Fornecedores from "./pages/Fornecedores";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import Categorias from "./pages/Categorias";
import Compras from "./pages/Compras";
import Alertas from "./pages/Alertas";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";

function ProtectedRoute({ children }) {
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());

  useEffect(() => {
    function syncLoginState() {
      setLoggedIn(isAuthenticated());
    }

    window.addEventListener("storage", syncLoginState);
    return () => window.removeEventListener("storage", syncLoginState);
  }, []);

  return loggedIn ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  return isAdmin() ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
      <Route path="/entradas" element={<ProtectedRoute><Entradas /></ProtectedRoute>} />
      <Route path="/saidas" element={<ProtectedRoute><Saidas /></ProtectedRoute>} />
      <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
      <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
      <Route path="/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
      <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><AdminRoute><Usuarios /></AdminRoute></ProtectedRoute>} />
      <Route path="/usuario" element={<Navigate to="/usuarios" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
