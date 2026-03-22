import React from 'react'
import styles from './ToolCard.module.scss'

export interface ToolCardProps {
  title: string
  description: string
  actionText: string
  onAction: () => void
  isDanger?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (e: React.MouseEvent) => void
}

export function ToolCard({
  title,
  description,
  actionText,
  onAction,
  isDanger,
  isFavorite,
  onToggleFavorite
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
      onClick={(e) => {
        // Only trigger onAction if the click didn't come from the favorite button
        if (!(e.target as HTMLElement).closest(`.${styles.favoriteButton}`)) {
          onAction()
        }
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={styles.flipCardInner}>
        <div className={styles.flipCardFront}>
          <h2>{title}</h2>
        </div>
        <div className={styles.flipCardBack}>
          {onToggleFavorite && (
            <button
              className={`${styles.favoriteButton} ${isFavorite ? styles.isFavorite : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(e)
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              ♥
            </button>
          )}
          <p>{description}</p>
          <span className={`brutalist-button ${isDanger ? 'danger' : 'primary'}`}>
            {actionText}
          </span>
        </div>
      </div>
    </div>
  )
}
