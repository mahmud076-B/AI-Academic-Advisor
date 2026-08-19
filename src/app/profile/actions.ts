'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
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
    redirect('/profile?error=Missing_Required_Fields')
  }

  // Update profile row utilizing server-side authentication (RLS enforces student ownership)
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      student_id,
      department,
      batch,
      section,
      current_semester,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') { // Unique violation
      redirect('/profile?error=Student_ID_Already_Exists')
    }
    console.error('Profile update error:', error)
    redirect('/profile?error=Failed_To_Update_Profile')
  }

  // Success
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/profile', 'layout')
  redirect('/profile?success=Profile_Updated')
}
