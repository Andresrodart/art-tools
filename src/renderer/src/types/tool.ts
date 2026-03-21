export type ToolCategory = 'file-management' | 'media' | 'utility' | 'system'

/**
 * Interface representing a tool in the gallery.
 */
export interface Tool {
  /** Unique identifier for the tool. */
  id: string
  /** i18n key for the tool's title. */
  titleKey: string
  /** i18n key for the tool's description. */
  descriptionKey: string
  /** Categories the tool belongs to. */
  categories: ToolCategory[]
  /** React component used for tool configuration/setup. */
  component: React.ComponentType<{ onBack: () => void }>
  /** List of task types associated with this tool. */
  taskTypes: string[]
}

/**
 * Props for the ToolCard component in the gallery.
 */
export interface ToolCardProps {
  /** Title of the tool. */
  title: string
  /** Description of the tool's functionality. */
  description: string
  /** Text to display on the action button. */
  actionText: string
  /** Callback triggered when the tool is opened. */
  onAction: () => void
  /** Indicates if the tool action is destructive/dangerous. */
  isDanger?: boolean
  /** Indicates if the tool is favorited by the user. */
  isFavorite: boolean
  /** Callback to toggle the favorite state. */
  onToggleFavorite: () => void
}
