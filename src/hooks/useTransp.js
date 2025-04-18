import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useTransportadorasSupabase() {
  const [transportadoras, setTransportadoras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('transportadoras').select('*');
      if (error) console.error('Erro ao carregar transportadoras:', error);
      setTransportadoras(data || []);
      setLoading(false);
    };

    fetch();
  }, []);

  return { transportadoras, loading };
}