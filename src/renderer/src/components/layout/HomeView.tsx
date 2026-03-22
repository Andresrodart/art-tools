import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaskStore, TaskTab } from '../../store/taskStore'
import { usePreferenceStore } from '../../store/preferenceStore'
import { ToolCard } from './ToolCard'
import { toolsRegistry } from '../../config/tools'

export function HomeView(): React.JSX.Element {
  const { t } = useTranslation()
  const { addTab } = useTaskStore()
  const { searchQuery, activeCategory, favorites, toggleFavorite } = usePreferenceStore()

  const openTool = useCallback(
    (toolName: string, title: string): void => {
      const tab: TaskTab = {
        id: `tool-${toolName.toLowerCase()}-${Date.now()}`,
        title: title,
        type: 'tool_task',
        toolName: toolName
      }
      addTab(tab)
    },
    [addTab]
  )

  const filteredTools = toolsRegistry.filter((tool) => {
    // 1. Filter by Category
    if (activeCategory === 'Favorites') {
      if (!favorites.includes(tool.id)) return false
    } else if (activeCategory !== 'All') {
      if (!tool.categories.includes(activeCategory)) return false
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const title = t(tool.nameKey).toLowerCase()
      const desc = t(tool.descKey).toLowerCase()
      if (!title.includes(q) && !desc.includes(q)) return false
    }

    return true
  })

  return (
    <>
      <div className="gallery-grid" style={{ marginTop: '1rem' }}>
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={t(tool.nameKey)}
              description={t(tool.descKey)}
              actionText={t('open_tool')}
              onAction={() => openTool(tool.id, t(tool.nameKey))}
              isFavorite={favorites.includes(tool.id)}
              onToggleFavorite={(e) => {
                e.stopPropagation()
                toggleFavorite(tool.id)
              }}
            />
          ))
        ) : (
          <p>{t('no_tools_found', 'No tools found.')}</p>
        )}
      </div>
    </>
  )
}
