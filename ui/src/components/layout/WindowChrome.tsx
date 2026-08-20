import type { ReactNode } from 'react'

interface WindowChromeProps {
  readonly name: string
  readonly children: ReactNode
}


export function WindowChrome({ name, children }: WindowChromeProps) {
  return (
    <div className="chrome">
      <div className="chrome__bar">
        <div className="chrome__dots" aria-hidden="true">
          <span className="chrome__dot" />
          <span className="chrome__dot" />
          <span className="chrome__dot" />
        </div>
        <span className="chrome__name">{name}</span>
      </div>
      <div className="chrome__body">{children}</div>
    </div>
  )
}
