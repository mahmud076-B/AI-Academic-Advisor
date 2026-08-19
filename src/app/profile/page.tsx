import { updateProfile } from './actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, ShieldCheck, Mail, ArrowLeft, Save, Building, Users, BookOpen } from 'lucide-react'

export default async function ProfilePage(props: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const searchParams = await props.searchParams
  const errorMsg = searchParams?.error?.replaceAll('_', ' ')
  const successMsg = searchParams?.success?.replaceAll('_', ' ')

  return (
    <div className="page-container flex max-w-5xl flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <header className="mb-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          Academic Profile
        </h1>
        <p className="text-slate-500 text-lg">
          Manage your personal information and cohort details.
        </p>
      </header>

      {errorMsg && (
        <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-center">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="mb-8 bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 flex items-center">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Account Info Card (Left Col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{profile.full_name}</h2>
            <p className="text-sm text-slate-500 font-medium mb-4">{profile.student_id}</p>
            
            <div className="w-full pt-4 border-t border-slate-100 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="field-icon" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck className="field-icon text-emerald-500" />
                <span>Verified Student</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form (Right Col) */}
        <div className="lg:col-span-2">
          <form action={updateProfile} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-50">Profile Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="field-icon" />
                  </div>
                  <input name="full_name" type="text" defaultValue={profile.full_name} required className="form-control pl-11" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Student ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="field-icon" />
                  </div>
                  <input name="student_id" type="text" defaultValue={profile.student_id} required className="form-control pl-11" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building className="field-icon" />
                  </div>
                  <input name="department" type="text" defaultValue={profile.department} required className="form-control pl-11" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Batch</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="field-icon" />
                  </div>
                  <input name="batch" type="text" defaultValue={profile.batch} required className="form-control pl-11" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Section</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="field-icon" />
                  </div>
                  <input name="section" type="text" defaultValue={profile.section} required className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Current Semester</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BookOpen className="field-icon" />
                  </div>
                  <input name="current_semester" type="text" defaultValue={profile.current_semester} required className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900" />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-8 border-t border-slate-100 flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-full font-medium hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
