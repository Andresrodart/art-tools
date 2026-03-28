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
  },
  {
    id: 'SatProfileManager',
    nameKey: 'tool_sat_profile_manager_title',
    descKey: 'tool_sat_profile_manager_desc',
    categories: ['Tax'],
    componentName: 'SatProfileManager'
  },
  {
    id: 'FacturaOrganizer',
    nameKey: 'tool_factura_organizer_title',
    descKey: 'tool_factura_organizer_desc',
    categories: ['Tax'],
    componentName: 'FacturaOrganizer'
  },
  {
    id: 'FrequentContactsManager',
    nameKey: 'tool_frequent_contacts_title',
    descKey: 'tool_frequent_contacts_desc',
    categories: ['Tax'],
    componentName: 'FrequentContactsManager'
  },
  {
    id: 'TaxDashboard',
    nameKey: 'tool_tax_dashboard_title',
    descKey: 'tool_tax_dashboard_desc',
    categories: ['Tax'],
    componentName: 'TaxDashboard'
  },
  {
    id: 'GPGViewer',
    nameKey: 'tool_gpg_viewer_title',
    descKey: 'tool_gpg_viewer_desc',
    categories: ['File', 'Security'],
    componentName: 'GPGViewer'
  },
  {
    id: 'TaxScanner',
    nameKey: 'tool_tax_scanner_title',
    descKey: 'tool_tax_scanner_desc',
    categories: ['Tax', 'Finance'],
    componentName: 'TaxScanner'
  }
]

export function getCategories(): string[] {
  const categories = new Set<string>()
  toolsRegistry.forEach((tool) => {
    tool.categories.forEach((cat) => categories.add(cat))
  })
  return Array.from(categories).sort()
}
