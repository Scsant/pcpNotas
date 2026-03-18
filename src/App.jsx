import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import PageContainer from "./components/PageContainer";
import Login from "./pages/Login";
import PainelNFs from "./components/PainelNFs";
import SelecaoTransportadora from "./pages/SelecaoTransportadora";
import ProtectedRoute from "./components/ProtectedRoute";
import PainelNepomuceno from "./pages/PainelNepomuceno";
import UploadNotas from "./pages/UploadNotas";
import VisualizarNotas from "./pages/VisualizarNotas";
import PainelNotas from "./pages/PainelNotas";
import PainelCargoPolo from "./pages/PainelCargoPolo";
import NotasCanceladas from "./pages/NotasCanceladas";
import PainelGarbuio from "./pages/PainelGarbuio";
import PainelVDA from "./pages/PainelVDA";
import PainelJSL from "./pages/PainelJSL";
import PainelTransOlsen from "./pages/PainelTransOlsen";
import PainelPlacidos from "./pages/PainelPlacidos";
import PainelSerranalog from "./pages/PainelSerranalog";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <div className="app-content px-4 py-5 md:px-6 md:py-6">
          <Header />

          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/selecao"
              element={
                <ProtectedRoute>
                  <SelecaoTransportadora />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel"
              element={
                <ProtectedRoute role="admin">
                  <PainelNFs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <PageContainer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/upload-notas"
              element={
                <ProtectedRoute role="admin">
                  <UploadNotas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/visualizar-notas"
              element={
                <ProtectedRoute>
                  <VisualizarNotas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-notas"
              element={
                <ProtectedRoute>
                  <PainelNotas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/1"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelCargoPolo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/2"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelGarbuio />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/3"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelNepomuceno />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/8"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelVDA />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/5"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelJSL />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/4"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelTransOlsen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/6"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelPlacidos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-transportadora/7"
              element={
                <ProtectedRoute role="transportadora">
                  <PainelSerranalog />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notas-canceladas"
              element={
                <ProtectedRoute>
                  <NotasCanceladas />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
