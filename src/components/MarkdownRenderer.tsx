'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  
  if (!inline) {
    const codeString = String(children).replace(/\n$/, '')
    const language = match ? match[1] : 'text'
    
    const handleCopy = () => {
      navigator.clipboard.writeText(codeString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div className="relative my-6 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-800">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{language}</span>
          <button 
            type="button"
            onClick={handleCopy} 
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? <span className="text-emerald-400">Copied!</span> : <span>Copy</span>}
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <pre className="text-[13px] leading-relaxed text-slate-50 font-mono" {...props}>
            <code className={className}>{children}</code>
          </pre>
        </div>
      </div>
    )
  }
  
  return (
    <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[13px] font-medium" {...props}>
      {children}
    </code>
  )
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-slate-800 w-full break-words max-w-full">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4 text-slate-900 tracking-tight" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900 tracking-tight" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-6 mb-3 text-slate-900 tracking-tight" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-base font-semibold mt-5 mb-2 text-slate-900" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 marker:text-slate-400" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 marker:text-slate-400 marker:font-medium" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
          em: ({node, ...props}) => <em className="italic text-slate-700" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-200 bg-indigo-50/50 px-4 py-3 rounded-r-xl my-4 text-slate-700 italic" {...props} />,
          a: ({node, ...props}) => <a className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 decoration-indigo-200 hover:decoration-indigo-600 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
          code: CodeBlock as any,
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left border-collapse" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-700 text-xs uppercase" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 font-semibold whitespace-nowrap" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
