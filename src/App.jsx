import FazendaForm from './components/FazendaForm';
import Historico from './components/Historico';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0070C0] to-[#00B050] p-6">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <img
            src="/imagens/bracell_logo_FA.png"
            alt="Bracell"
            className="h-14 w-auto drop-shadow-md"
          />

        </div>
      </header>

      {/* Container branco */}
      <main className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-6xl mx-auto space-y-10 text-gray-800">
        
        {/* Título da seção */}
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          📦 <span>Emissão de Notas - <strong>Múltiplas Fazendas</strong></span>
        </h2>

        {/* Formulário */}
        <FazendaForm />

        {/* Separador */}
        <hr className="border-gray-300" />

        {/* Histórico */}
        <Historico />
      </main>
    </div>
  );
}

export default App;
