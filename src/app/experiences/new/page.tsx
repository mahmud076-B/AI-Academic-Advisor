import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createExperience } from '../actions'
import { ArrowLeft, Globe, Lock, Share2, Brain } from 'lucide-react'

export default async function NewExperiencePage(props: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const searchParams = await props.searchParams
  const error = searchParams.error

  return (
    <div className="page-container flex max-w-4xl flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <header className="mb-10">
        <Link href="/experiences" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Campus Brain
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <Brain className="w-[22px] h-[22px]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Share Campus Knowledge
          </h1>
        </div>
        <p className="text-slate-500 text-lg">
          Contribute useful insights that help other students and power Campus Brain.
        </p>
      </header>

      {error && (
        <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-center">
          {error.replace(/_/g, ' ')}
        </div>
      )}

      <form action={createExperience} className="space-y-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-slate-900">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="form-control"
            placeholder="e.g., Best quiet study spot in the Central Library"
          />
          <p className="form-helper">5-150 characters. Be clear and concise.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-semibold text-slate-900">
            Details
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            className="form-control h-auto resize-y"
            placeholder="Describe your observation, tip, or discovery. Be specific so the AI can retrieve this when someone asks a relevant question..."
          />
          <p className="form-helper">15-3000 characters. More detail helps the AI.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-900">
            Who Should See This?
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Private Option */}
            <label className="relative flex flex-col p-5 cursor-pointer rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all [&:has(input:checked)]:border-indigo-600 [&:has(input:checked)]:bg-indigo-50/50 [&:has(input:checked)]:ring-1 [&:has(input:checked)]:ring-indigo-600">
              <input type="radio" name="visibility" value="private" className="sr-only" defaultChecked />
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-900">Private</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Only you can see this. It acts as a personal note.
              </p>
            </label>

            {/* Shared Option */}
            <label className="relative flex flex-col p-5 cursor-pointer rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all [&:has(input:checked)]:border-indigo-600 [&:has(input:checked)]:bg-indigo-50/50 [&:has(input:checked)]:ring-1 [&:has(input:checked)]:ring-indigo-600">
              <input type="radio" name="visibility" value="shared" className="sr-only" />
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-slate-900">Shared</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Available to all students and the AI Advisor. Helps others.
              </p>
            </label>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="button-primary w-full sm:w-auto"
          >
            <Share2 className="w-[18px] h-[18px]" />
            Share with Campus Brain
          </button>
        </div>
      </form>
    </div>
  )
}
