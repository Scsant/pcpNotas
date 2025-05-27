import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function SupabaseTeste() {
  const [fazendas, setFazendas] = useState([])

  useEffect(() => {
    async function carregarFazendas() {
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .order('criada_em', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar fazendas:', error.message);
        return;
      }

      setFazendas(data);
    }

    carregarFazendas();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">📦 Lista de Fazendas</h1>
      <ul className="space-y-2">
        {fazendas.map((fazenda) => (
          <li
            key={fazenda.id}
            className="bg-white/10 rounded p-3 border border-white/20"
          >
            <strong>{fazenda.nome}</strong> — {fazenda.estado}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SupabaseTeste
