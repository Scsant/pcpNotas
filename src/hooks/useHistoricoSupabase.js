// src/hooks/useHistoricoSupabase.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function useHistoricoSupabase() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('registros').select('*');
      if (error) console.error("Erro ao buscar histórico:", error);
      setRegistros(data || []);
      setLoading(false);
    };

    fetch();
  }, []);

  return { registros, loading };
}
