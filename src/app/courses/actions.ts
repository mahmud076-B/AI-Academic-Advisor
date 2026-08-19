'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function enrollCourse(formData: FormData) {
  const supabase = await createClient()

  // Authenticate user securely on the server
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const course_id = formData.get('course_id') as string
  const academic_period = formData.get('academic_period') as string

  if (!course_id || !academic_period) {
    redirect('/courses?error=Missing_Course_Data')
  }

  // Insert enrollment with the authenticated user ID as student_id
  const { error } = await supabase.from('enrollments').insert({
    student_id: user.id, // Never trust client-submitted student_id
    course_id,
    academic_period,
    status: 'active'
  })

  if (error) {
    if (error.code === '23505') { // UNIQUE constraint violation
      // It's possible the user dropped it and is re-enrolling, in which case we should update
      // Let's check if there's an existing dropped row to update instead
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('student_id', user.id)
        .eq('course_id', course_id)
        .eq('academic_period', academic_period)
        .single()
        
      if (existing && existing.status === 'dropped') {
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .eq('student_id', user.id) // Enforce RLS
          
        if (updateError) {
          redirect('/courses?error=Failed_To_Reenroll')
        }
      } else {
        redirect('/courses?error=Already_Enrolled')
      }
    } else {
      console.error('Enrollment error:', error)
      redirect('/courses?error=Failed_To_Enroll')
    }
  }

  revalidatePath('/courses')
  redirect('/courses?success=Enrolled')
}

export async function dropCourse(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const enrollment_id = formData.get('enrollment_id') as string

  if (!enrollment_id) {
    redirect('/courses?error=Missing_Enrollment_ID')
  }

  // Update enrollment to 'dropped' following the database design
  const { error } = await supabase
    .from('enrollments')
    .update({ 
      status: 'dropped',
      updated_at: new Date().toISOString()
    })
    .eq('id', enrollment_id)
    .eq('student_id', user.id) // Ensure student only drops their own course

  if (error) {
    console.error('Drop error:', error)
    redirect('/courses?error=Failed_To_Drop')
  }

  revalidatePath('/courses')
  redirect('/courses?success=Course_Dropped')
}
