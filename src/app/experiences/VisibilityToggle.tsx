'use client'

import { useState } from 'react'
import { updateExperienceVisibility } from './actions'

export default function VisibilityToggle({ 
  experienceId, 
  initialVisibility 
}: { 
  experienceId: string, 
  initialVisibility: 'private' | 'shared' 
}) {
  const [visibility, setVisibility] = useState(initialVisibility)
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async () => {
    const newVis = visibility === 'private' ? 'shared' : 'private'
    setIsPending(true)
    const result = await updateExperienceVisibility(experienceId, newVis)
    setIsPending(false)
    
    if (!result.error) {
      setVisibility(newVis)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        visibility === 'shared' 
          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      } disabled:opacity-50`}
    >
      {isPending ? 'Updating...' : visibility === 'shared' ? '🌎 Shared' : '🔒 Private'}
    </button>
  )
}
