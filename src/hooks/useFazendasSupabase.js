import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useFazendasSupabase() {
  const [fazendas, setFazendas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("fazendas").select("*")
      if (error) console.error("Erro no Supabase:", error)
      setFazendas(data || [])
      setLoading(false)
    }

    fetch()
  }, [])

  return { fazendas, loading }
}
