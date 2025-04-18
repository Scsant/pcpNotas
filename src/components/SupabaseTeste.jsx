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
  


}

export default SupabaseTeste
