import type { LucideIcon } from 'lucide-react'

type PageHeaderProps = {
  title: string
  description: string
  icon?: LucideIcon
  eyebrow?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, icon: Icon, eyebrow, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <div className="page-title-row">
          {Icon && (
            <span className="page-title-icon" aria-hidden="true">
              <Icon className="icon-feature" />
            </span>
          )}
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-description">{description}</p>
          </div>
        </div>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  )
}