import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prbmfjfgzjoqhfeefgxp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYm1mamZnempvcWhmZWVmZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NzEzMDgsImV4cCI6MjA2MDI0NzMwOH0.GfJKGk1xZ9e9XjJNfpZ-IZLs1WlYCDIygBtjFzsGmMM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

