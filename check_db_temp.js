import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://enjouiokasdunkqcmddc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuam91aW9rYXNkdW5rcWNtZGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NzM0ODMsImV4cCI6MjA5ODA0OTQ4M30.C5TO6ThuPC53XIqciJyj_DoKk_Z2yZpY17PIjmMPtRI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  console.log('Querying table structure...')
  try {
    const { data, error } = await supabase.from('form_analyses').select('*').limit(1)
    if (error) {
      console.error('Error selecting from table:', error)
    } else {
      console.log('Table exists. Single row sample data:', data)
    }
  } catch (err) {
    console.error('Catch error:', err)
  }
}

main()
