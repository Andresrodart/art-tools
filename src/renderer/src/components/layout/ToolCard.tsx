import React from 'react'
import styles from './ToolCard.module.scss'

export interface ToolCardProps {
  title: string
  description: string
  actionText: string
  onAction: () => void
  isDanger?: boolean
}

export function ToolCard({
  title,
  description,
  actionText,
  onAction,
  isDanger
}: ToolCardProps): React.JSX.Element {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onAction()
    }
  }

  return (
    <div
      className={styles.flipCard}
      onClick={onAction}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={styles.flipCardInner}>
        <div className={styles.flipCardFront}>
          <h2>{title}</h2>
        </div>
        <div className={styles.flipCardBack}>
          <p>{description}</p>
          <span className={`brutalist-button ${isDanger ? 'danger' : 'primary'}`}>
            {actionText}
          </span>
        </div>
      </div>
    </div>
  )
}
