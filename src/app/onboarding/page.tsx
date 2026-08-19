import { createProfile } from './actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { User, ShieldCheck, Building, Users, BookOpen, ArrowRight, Sparkles } from 'lucide-react'

export default async function OnboardingPage(props: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if profile already exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) {
    // Student already has a profile, skip onboarding
    redirect('/dashboard')
  }

  // Next 15+ searchParams are a Promise
  const searchParams = await props.searchParams
  const errorMsg = searchParams?.error?.replaceAll('_', ' ')

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--color-surface-1)]">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-100/40 to-purple-100/40 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-100/40 to-emerald-100/40 blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out z-10 flex flex-col justify-center">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100 text-indigo-600 mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Complete your profile
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
            Welcome to AI Academic Advisor. Tell us about your academic status to personalize your experience.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-center">
            {errorMsg}
          </div>
        )}

        <form action={createProfile} className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="field-icon" />
                </div>
                <input name="full_name" type="text" required placeholder="John Doe" className="form-control pl-11" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Student ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="field-icon" />
                </div>
                <input name="student_id" type="text" required placeholder="21-XXXXX-1" className="form-control pl-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Department</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="field-icon" />
                </div>
                <input name="department" type="text" required placeholder="e.g. CSE" className="form-control pl-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Batch</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="field-icon" />
                </div>
                <input name="batch" type="text" required placeholder="e.g. Fall 2023" className="form-control pl-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Section</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="field-icon" />
                </div>
                <input name="section" type="text" required placeholder="e.g. A" className="form-control pl-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Current Semester</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <BookOpen className="field-icon" />
                </div>
                <input name="current_semester" type="text" required placeholder="e.g. 5th" className="form-control pl-11" />
              </div>
            </div>

          </div>

          <div className="pt-8 mt-8 border-t border-slate-100">
            <button type="submit" className="button-primary group w-full text-lg">
              Complete Setup
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
