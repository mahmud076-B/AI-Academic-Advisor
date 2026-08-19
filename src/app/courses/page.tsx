import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { enrollCourse, dropCourse } from './actions'
import { BookOpen, CheckCircle2, GraduationCap, X, Plus } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Ensure user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_semester')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Fetch all available courses (read-only)
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('code', { ascending: true })

  // Fetch student's active enrollments for the current semester
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', user.id)
    .eq('academic_period', profile.current_semester)
    .eq('status', 'active')

  const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])
  const totalEnrolledCredits = enrollments?.reduce((sum, e) => sum + ((e.courses as any)?.credit_hours || 0), 0) || 0

  return (
    <div className="page-container flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600">
               <BookOpen className="w-[22px] h-[22px]" />
             </div>
             <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
               Course Management
             </h1>
          </div>
          <p className="text-slate-500 text-lg">
            Manage your academic journey for Semester <span className="font-semibold text-slate-900">{profile.current_semester}</span>.
          </p>
        </div>
        
        {/* Credits Badge */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 text-indigo-600">
             <GraduationCap className="w-[22px] h-[22px]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Enrolled Credits</p>
            <p className="text-2xl font-bold text-slate-900">{totalEnrolledCredits}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Current Enrollments (Left/Top) */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Your Enrollments
            <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full ml-2">
              {enrollments?.length || 0}
            </span>
          </h2>

          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map((enrollment) => {
                const course = enrollment.courses as any
                return (
                  <div key={enrollment.id} className="group relative bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 overflow-hidden">
                    {/* Status Indicator */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-3xl"></div>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg text-slate-900">{course?.code}</h3>
                          <span className="text-xs font-medium bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-100">{course?.credit_hours} Credits</span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">{course?.name}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex justify-end">
                        <form action={dropCourse}>
                          <input type="hidden" name="enrollment_id" value={enrollment.id} />
                          <button className="flex items-center gap-2 text-xs px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full font-medium transition-colors">
                            <X className="w-3.5 h-3.5" />
                            Drop Course
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 border-dashed text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">No Active Enrollments</h3>
              <p className="text-sm text-slate-500">You are not enrolled in any courses for Semester {profile.current_semester}. Select courses from the catalog.</p>
            </div>
          )}
        </div>

        {/* Course Catalog (Right/Bottom) */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Course Catalog</h2>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {courses && courses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                return (
                  <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{course.code}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">{course.credit_hours} Credits</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{course.name}</p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isEnrolled ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Enrolled
                        </div>
                      ) : (
                        <form action={enrollCourse}>
                          <input type="hidden" name="course_id" value={course.id} />
                          <input type="hidden" name="academic_period" value={profile.current_semester} />
                          <button className="flex items-center gap-1.5 px-6 py-2 bg-slate-900 text-white hover:bg-indigo-600 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
                            <Plus className="w-4 h-4" />
                            Enroll
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })}
              {(!courses || courses.length === 0) && (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-500">No courses available in the catalog.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
