// components/PageContainer.jsx
import FazendaForm from './FazendaForm'
import Historico from './Historico'




function PageContainer() {
  return (
    <main className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-6xl mx-auto space-y-10 text-gray-800">

      <h2 className="text-2xl font-semibold flex items-center gap-2">
        📦 <span>Emissão de Notas</span>
      </h2>

      <FazendaForm />

      <hr className="border-gray-300" />

      <Historico />
    </main>
  )
}

export default PageContainer
