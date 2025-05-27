import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import PageContainer from "./components/PageContainer";
import Login from "./pages/Login";
import PainelNFs from "./components/PainelNFs";
import SelecaoTransportadora from "./pages/SelecaoTransportadora";
import ProtectedRoute from "./components/ProtectedRoute";
import PainelNepomuceno from "./pages/PainelNepomuceno";
import UploadNotas from "./pages/UploadNotas";
import VisualizarNotas from "./pages/VisualizarNotas";
import PainelNotas from "./pages/PainelNotas"; // 👈 AQUI adiciona certinho!
import PainelCargoPolo from "./pages/PainelCargoPolo";
import NotasCanceladas from "./pages/NotasCanceladas";
import PainelGarbuio from "./pages/PainelGarbuio";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-[#0070C0] to-[#00B050] p-6">
        <Header />

        <Routes>
          {/* Login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Pós-login */}
          <Route path="/selecao" element={
            <ProtectedRoute>
              <SelecaoTransportadora />
            </ProtectedRoute>
          } />

          {/* Painel admin */}
          <Route path="/painel" element={
            <ProtectedRoute role="admin">
              <PainelNFs />
            </ProtectedRoute>
          } />

          {/* Página genérica */}
          <Route path="/home" element={
            <ProtectedRoute>
              <PageContainer />
            </ProtectedRoute>
          } />

          {/* Upload de notas */}
          <Route path="/upload-notas" element={
            <ProtectedRoute role="admin">
              <UploadNotas />
            </ProtectedRoute>
          } />

          {/* Visualizar notas */}
          <Route path="/visualizar-notas" element={
            <ProtectedRoute>
              <VisualizarNotas />
            </ProtectedRoute>
          } />

          {/* PAINEL NOTAS (NOVO) */}
          <Route path="/painel-notas" element={
            <ProtectedRoute>
              <PainelNotas />
            </ProtectedRoute>
          } />

           {/* Painel Transportadora Cargo Polo */}
          <Route path="/painel-transportadora/1" element={
            <ProtectedRoute role="transportadora">
              <PainelCargoPolo />
            </ProtectedRoute>
          } />

          {/* Painel Transportadora Garbuio */}
          <Route path="/painel-transportadora/2" element={
            <ProtectedRoute role="transportadora">
              <PainelGarbuio />
            </ProtectedRoute>
          } />

          {/* Painel Transportadora Nepomuceno */}
          <Route path="/painel-transportadora/3" element={
            <ProtectedRoute role="transportadora">
              <PainelNepomuceno />
            </ProtectedRoute>
          } />
          
          <Route
            path="/notas-canceladas"
            element={
              <ProtectedRoute>
                <NotasCanceladas />
              </ProtectedRoute>
          } />


        </Routes>
      </div>
    </Router>
  );
}

export default App;


