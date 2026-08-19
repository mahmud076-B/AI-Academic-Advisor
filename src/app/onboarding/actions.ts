'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProfile(formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Extract fields
  const full_name = formData.get('full_name') as string
  const student_id = formData.get('student_id') as string
  const department = formData.get('department') as string
  const batch = formData.get('batch') as string
  const section = formData.get('section') as string
  const current_semester = formData.get('current_semester') as string

  // Basic validation
  if (!full_name || !student_id || !department || !batch || !section || !current_semester) {
    redirect('/onboarding?error=Missing_Required_Fields')
  }

  // Insert profile row utilizing server-side authentication (RLS enforces student ownership)
  const { error } = await supabase.from('profiles').insert({
    id: user.id, // Must match auth.uid() per RLS
    full_name,
    student_id,
    department,
    batch,
    section,
    current_semester,
  })

  if (error) {
    // Handle specific PostgreSQL errors if possible (e.g., unique constraint on student_id)
    if (error.code === '23505') { // Unique violation
      redirect('/onboarding?error=Student_ID_Already_Exists')
    }
    console.error('Profile creation error:', error)
    redirect('/onboarding?error=Failed_To_Create_Profile')
  }

  // Success
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}
