import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Clock, MapPin, SearchX } from 'lucide-react'
import { formatTime } from '@/lib/date-time'

// Define the correct sort order for days
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default async function RoutinePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Ensure user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, batch, section, current_semester')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Fetch routine entries
  // RLS automatically filters this query down to exactly what matches the student's profile cohort
  const { data: routineEntries } = await supabase
    .from('class_routine_entries')
    .select('*, courses(*)')
    .order('start_time', { ascending: true })

  // Group by day of week
  const routineByDay: Record<string, any[]> = {}
  
  if (routineEntries) {
    for (const entry of routineEntries) {
      if (!routineByDay[entry.day_of_week]) {
        routineByDay[entry.day_of_week] = []
      }
      routineByDay[entry.day_of_week].push(entry)
    }
  }

  // Filter DAYS_ORDER to only include days with classes
  const activeDays = DAYS_ORDER.filter(day => routineByDay[day] && routineByDay[day].length > 0)

  return (
    <div className="page-container flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600">
               <Calendar className="w-[22px] h-[22px]" />
             </div>
             <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
               Class Routine
             </h1>
          </div>
          <p className="text-slate-500 text-lg">
            Weekly schedule for {profile.department} • Batch {profile.batch} • Section {profile.section}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {activeDays.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {activeDays.map(day => (
              <div key={day} className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{day}</h2>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">{routineByDay[day].length} Classes</span>
                </div>
                
                <div className="divide-y divide-slate-50 flex-1">
                  {routineByDay[day].map((entry, idx) => {
                    const course = entry.courses as any
                    const courseName = entry.course_name_override || course?.name || 'Unknown Course'
                    const isLast = idx === routineByDay[day].length - 1
                    
                    return (
                      <div key={entry.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 relative group">
                        
                        {/* Timeline visual (Desktop only) */}
                        <div className="hidden sm:flex flex-col items-center mr-4 w-6 relative">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-50 z-10 mt-1"></div>
                          {!isLast && <div className="absolute top-4 bottom-[-24px] w-0.5 bg-slate-100"></div>}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-slate-900 text-lg">{courseName}</h3>
                            {course?.code && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                {course.code}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-3">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </div>
                            
                            {entry.room && (
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                Room {entry.room}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 mb-6">
              <SearchX className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Classes Scheduled</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              There are no class routine entries found for your specific cohort ({profile.department}, Batch {profile.batch}, Section {profile.section}, {profile.current_semester}).
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
