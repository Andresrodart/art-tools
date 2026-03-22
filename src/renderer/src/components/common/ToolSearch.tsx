import React from 'react'
import { useTranslation } from 'react-i18next'
import { usePreferenceStore } from '../../store/preferenceStore'
import { getCategories } from '../../config/tools'
import styles from './ToolSearch.module.scss'

export function ToolSearch(): React.JSX.Element {
  const { t } = useTranslation()
  const { searchQuery, activeCategory, setSearchQuery, setActiveCategory } = usePreferenceStore()

  const categories = ['All', 'Favorites', ...getCategories()]

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={t('search_placeholder', 'Search tools...')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className={styles.categoryFilters}>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.categoryButton} ${
              activeCategory === category ? styles.active : ''
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category === 'All'
              ? t('category_all', 'All')
              : category === 'Favorites'
                ? t('category_favorites', 'Favorites')
                : category}
          </button>
        ))}
      </div>
    </div>
  )
}
