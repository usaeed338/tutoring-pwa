import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Student {
  id: string
  student_name: string
  parent_name: string | null
  phone: string | null
  email: string | null
  grade: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  subject_name: string
  default_fee: number
  created_at: string
}

export interface StudentSubject {
  id: string
  student_id: string
  subject_id: string
  custom_fee: number | null
  created_at: string
}

export interface Attendance {
  id: string
  student_id: string
  subject_id: string
  date: string
  status: 'Present' | 'Absent'
  created_at: string
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  payment_method: string | null
  date: string
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  student_id: string
  start_date: string
  end_date: string
  total_amount: number
  paid_amount: number
  balance: number
  status: string
  created_at: string
}
