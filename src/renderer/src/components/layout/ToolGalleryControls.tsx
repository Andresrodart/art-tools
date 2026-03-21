import React from 'react'
import { useTranslation } from 'react-i18next'
import { usePreferenceStore } from '../../store/preferenceStore'
import { ALL_CATEGORIES } from '../../config/tools'

export const ToolGalleryControls: React.FC = () => {
  const { t } = useTranslation()
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } =
    usePreferenceStore()

  const handleCategoryClick = (category: string | null): void => {
    if (selectedCategory === category) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
    }
  }

  const getCategoryLabel = (category: string | null): string => {
    if (category === null) return t('all_categories')
    if (category === 'favorites') return t('category_favorites')
    return t(`category_${category.replace('-', '_')}`)
  }

  return (
    <div
      className="gallery-controls brutalist-card"
      style={{ marginBottom: '2rem', padding: '1rem' }}
    >
      <div className="search-bar" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          className="brutalist-input w-full"
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div
        className="category-filters"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
      >
        <button
          className={`brutalist-button small ${selectedCategory === null ? 'primary' : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          {t('all_categories')}
        </button>
        <button
          className={`brutalist-button small ${selectedCategory === 'favorites' ? 'danger' : ''}`}
          onClick={() => handleCategoryClick('favorites')}
        >
          {t('category_favorites')}
        </button>
        {ALL_CATEGORIES.map((category) => (
          <button
            key={category}
            className={`brutalist-button small ${selectedCategory === category ? 'info' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>
    </div>
  )
}
