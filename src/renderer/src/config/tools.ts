export interface ToolDefinition {
  id: string
  nameKey: string
  descKey: string
  categories: string[]
  componentName: string
}

export const toolsRegistry: ToolDefinition[] = [
  {
    id: 'FileOrganizer',
    nameKey: 'tool_file_organizer_title',
    descKey: 'tool_file_organizer_desc',
    categories: ['File', 'Media'],
    componentName: 'FileOrganizer'
  },
  {
    id: 'FolderMetadata',
    nameKey: 'tool_folder_metadata_title',
    descKey: 'tool_folder_metadata_desc',
    categories: ['File'],
    componentName: 'FolderMetadata'
  },
  {
    id: 'ThresholdMerger',
    nameKey: 'tool_threshold_merger_title',
    descKey: 'tool_threshold_merger_desc',
    categories: ['File'],
    componentName: 'ThresholdMerger'
  },
  {
    id: 'FileScraper',
    nameKey: 'tool_file_scraper_title',
    descKey: 'desc_file_scraper',
    categories: ['File'],
    componentName: 'FileScraper'
  },
  {
    id: 'EmptyFolderCleaner',
    nameKey: 'tool_empty_folder_cleaner_title',
    descKey: 'tool_empty_folder_cleaner_desc',
    categories: ['File'],
    componentName: 'EmptyFolderCleaner'
  }
]

export function getCategories(): string[] {
  const categories = new Set<string>()
  toolsRegistry.forEach((tool) => {
    tool.categories.forEach((cat) => categories.add(cat))
  })
  return Array.from(categories).sort()
}
