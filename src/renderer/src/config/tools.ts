import { FileOrganizer } from '../components/tools/FileOrganizer'
import { FolderMetadata } from '../components/tools/FolderMetadata'
import { ThresholdMerger } from '../components/tools/ThresholdMerger'
import { FileScraper } from '../components/tools/FileScraper'
import { EmptyFolderCleaner } from '../components/tools/EmptyFolderCleaner'
import { Tool, ToolCategory } from '../types/tool'

/**
 * Registry of all available tools in the application.
 */
export const TOOLS: Tool[] = [
  {
    id: 'file-organizer',
    titleKey: 'tool_file_organizer_title',
    descriptionKey: 'tool_file_organizer_desc',
    categories: ['file-management', 'media'],
    component: FileOrganizer,
    taskTypes: ['organize-files']
  },
  {
    id: 'folder-metadata',
    titleKey: 'tool_folder_metadata_title',
    descriptionKey: 'tool_folder_metadata_desc',
    categories: ['file-management', 'utility'],
    component: FolderMetadata,
    taskTypes: ['folder-metadata']
  },
  {
    id: 'threshold-merger',
    titleKey: 'tool_threshold_merger_title',
    descriptionKey: 'tool_threshold_merger_desc',
    categories: ['file-management', 'utility'],
    component: ThresholdMerger,
    taskTypes: ['thresholdMerger']
  },
  {
    id: 'file-scraper',
    titleKey: 'tool_file_scraper_title',
    descriptionKey: 'desc_file_scraper',
    categories: ['file-management', 'media'],
    component: FileScraper,
    taskTypes: ['fileScraper']
  },
  {
    id: 'empty-folder-cleaner',
    titleKey: 'tool_empty_folder_cleaner_title',
    descriptionKey: 'tool_empty_folder_cleaner_desc',
    categories: ['file-management', 'system'],
    component: EmptyFolderCleaner,
    taskTypes: ['findEmptyFolders', 'deleteFolders']
  }
]

/**
 * List of all available tool categories.
 */
export const ALL_CATEGORIES: ToolCategory[] = ['file-management', 'media', 'utility', 'system']
