import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tzkaudfldjyqebfiwbhd.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6a2F1ZGZsZGp5cWViZml3YmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDk1MzksImV4cCI6MjEwOTc4NTUzOX0.Eb8nSWQFDh77YbLLSJIWDoc-0PJUr4p0kXvrSfria6g'

/** 客户端只带 anon key（公开、只读），写操作走登录后的 RLS。 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
