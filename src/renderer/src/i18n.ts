import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      app_title: 'Tool Gallery',
      welcome: 'Welcome to the Tool Gallery',
      execute_btn: 'Execute',
      read_btn: 'Read File',
      write_btn: 'Write File',
      theme_toggle: 'Toggle Theme',
      lang_toggle: 'Español',
      send_ipc: 'Send IPC',
      docs: 'Documentation',
      tool_file_organizer_title: 'File Organizer by Date Tree',
      tool_file_organizer_desc:
        'Sort messy directories into Year/Month/Day sub-folders instantly. Supports dry runs and specific file extensions.',
      tool_folder_metadata_title: 'Folder Metadata Appender',
      tool_folder_metadata_desc:
        'Recursively append total folder size and element counts to folder names. Easy clean up for huge directories.',
      tool_threshold_merger_title: 'Threshold Merger',
      tool_threshold_merger_desc:
        'Recursively group and merge sparse folders until they reach a target item capacity.',
      open_tool: 'Open Tool',

      target_folder: 'Target Folder:',
      target_root_folder: 'Target Root Folder:',
      no_folder_selected: 'No folder selected...',
      browse: 'Browse...',
      dry_run: 'Dry Run (Simulate Changes)',

      append_size: 'Append Dynamic Size Log',
      append_size_help:
        'Adds the total recursive size in dynamic units (e.g. "_1.45GB", "_500MB", "_12KB").',
      append_elements: 'Append Element Count',
      append_elements_help:
        'Adds the total recursive number of elements (files and subfolders) to the folder name (e.g. "_50").',
      dry_run_help_meta:
        'Preview the projected name changes below before actually renaming anything on your hard drive.',
      btn_sim_meta: 'Simulate Metadata Append',
      btn_exec_meta: 'Execute Rename Operations',
      desc_meta:
        'Recursively calculate the dynamic total size (GB, MB, KB) and element count of all folders inside a target directory, and append these metrics directly to the folder names.',
      merge_elements: 'Merge elements under (X)',
      merge_elements_help: 'Find folders with fewer items than this number to merge.',
      max_elements: 'Max items in merged group (Y)',
      max_elements_help: 'Stop merging folders when the combined count reaches this capacity.',
      btn_sim_merger: 'Simulate Output',
      btn_exec_merger: 'Merge Folders Destructively',
      tool_file_scraper: 'File Scraper Appender',
      tool_file_scraper_title: 'File Scraper',
      desc_file_scraper:
        'Extract specific files recursively from a targeted directory and flatten them entirely into a destination.',
      tool_empty_folder_cleaner_title: 'Empty Folder Cleaner',
      tool_empty_folder_cleaner_desc:
        'Identify and remove folders that are empty or contain only other empty subfolders. Supports selective deletion and dry runs.',
      desc_empty_folder_cleaner:
        'Scan your directory tree for empty folders. Review the list of found folders and choose which ones to remove safely.',
      btn_scan_empty: 'Scan for Empty Folders',
      btn_delete_empty: 'Delete Selected Folders',
      btn_sim_delete_empty: 'Simulate Folder Deletion',
      empty_folders_found: 'Empty folders found:',
      no_empty_folders: 'No empty folders found in the selected directory.',
      source_folder: 'Source Directory',
      source_folder_help: 'Select the main root folder to scan internally for files.',
      destination_folder: 'Destination Directory',
      destination_folder_help:
        'Select the empty output folder where all matched files will be transferred.',
      file_types: 'File Domains',
      btn_sim_scraper: 'Simulate File Scrape',
      btn_exec_scraper: 'Extract & Flatten Files',
      dry_run_help_scraper:
        'Review matches and naming collisions in the log before physically relocating files.',
      merge_under_x: 'Merge Elements Under (X):',
      merge_under_x_help_1: 'Folders with fewer than ',
      merge_under_x_help_2: ' elements will be merged with their siblings.',
      max_elements_y: 'Max Elements in Merged Group (Y):',
      max_elements_y_help_1: 'Stop grouping when the combined folder reaches ',
      max_elements_y_help_2: ' items.',
      dry_run_help_merge:
        'Preview the projected merges below before actually moving any files on your hard drive.',
      btn_sim_merge: 'Simulate Output',
      btn_exec_merge: 'Merge Folders Destructively',
      desc_merge:
        'Recursively merge small sibling folders into combined parent folders. Great for cleaning up directories fragmented by tons of tiny subfolders.',

      file_extensions: 'File Extensions:',
      all_files: 'All Files (*)',
      type_ext_placeholder: 'Type extension (e.g. .jpg) or select...',
      btn_add: 'Add',
      dry_run_help_org:
        'We strongly recommend running a dry run first to preview where files will be moved.',
      btn_sim_org: 'Simulate Organization',
      btn_exec_org: 'Execute Move Command',
      desc_org:
        'Organize files in a directory into Year/Month/Day folder structure based on their creation dates. Supports EXIF metadata, filename patterns, and file-system timestamps.',
      open_folder: 'Open Folder',

      input: 'Input',
      progress: 'Progress',
      output: 'Output',
      close_tasks: 'Close Tasks',
      tasks: 'Tasks',
      background_tasks: 'Background Tasks',
      no_active_tasks: 'No active tasks',
      cancel: 'Cancel',
      dry_run_completed: 'Dry Run Completed. Pending UI review.',
      completed_success: 'Completed successfully.',
      failed_status: 'Failed',
      cancelled_by_user: 'Cancelled by user',

      search_placeholder: 'Search tools...',
      all_categories: 'All Categories',
      category_favorites: 'Favorites ❤️',
      category_file_management: 'File Management',
      category_media: 'Media',
      category_utility: 'Utility',
      category_system: 'System'
    }
  },
  es: {
    translation: {
      app_title: 'Galería de Herramientas',
      welcome: 'Bienvenido a la Galería de Herramientas',
      execute_btn: 'Ejecutar',
      read_btn: 'Leer Archivo',
      write_btn: 'Escribir Archivo',
      theme_toggle: 'Cambiar Tema',
      lang_toggle: 'English',
      send_ipc: 'Enviar IPC',
      docs: 'Documentación',
      tool_file_organizer_title: 'Organizador de Archivos por Fecha',
      tool_file_organizer_desc:
        'Ordena directorios desordenados en subcarpetas de Año/Mes/Día al instante. Soporta simulaciones y extensiones de archivos específicas.',
      tool_folder_metadata_title: 'Anexador de Metadatos de Carpetas',
      tool_folder_metadata_desc:
        'Anexa recursivamente el tamaño total de la carpeta y el número de elementos a los nombres de las carpetas. Fácil limpieza para directorios enormes.',
      tool_threshold_merger_title: 'Fusionador por Umbral',
      tool_threshold_merger_desc:
        'Agrupa y fusiona recursivamente carpetas escasas hasta que alcanzan una capacidad objetivo.',
      open_tool: 'Abrir Herramienta',

      target_folder: 'Carpeta de Destino:',
      target_root_folder: 'Carpeta Raíz de Destino:',
      no_folder_selected: 'Sin carpeta seleccionada...',
      browse: 'Explorar...',
      dry_run: 'Simulacro (Simular Cambios)',

      append_size: 'Agregar Registro de Tamaño Dinámico',
      append_size_help:
        'Agrega el tamaño total recursivo en unidades dinámicas (ej. "_1.45GB", "_500MB", "_12KB").',
      append_elements: 'Agregar Conteo de Elementos',
      append_elements_help:
        'Agrega el número total recursivo de elementos (archivos y subcarpetas) al nombre de la carpeta (ej. "_50").',
      dry_run_help_meta:
        'Previsualice los cambios de nombre proyectados antes de renombrar cualquier cosa en su disco duro.',
      btn_sim_meta: 'Simular Agregado de Metadatos',
      btn_exec_meta: 'Ejecutar Operaciones de Renombrado',
      desc_meta:
        'Calcula de forma recursiva el tamaño dinámico total (GB, MB, KB) y el número de elementos de todas las carpetas dentro de un directorio de destino, y anexa estas métricas directamente a los nombres de las carpetas.',
      merge_elements: 'Fusionar elementos debajo de (X)',
      merge_elements_help:
        'Encuentra carpetas con menos elementos que este número para fusionarlas.',
      max_elements: 'Máximo en grupo fusionado (Y)',
      max_elements_help: 'Detiene la fusión al alcanzar esta capacidad.',
      btn_sim_merger: 'Simular Fusión',
      btn_exec_merger: 'Fusionar y Eliminar Carpetas Originales',
      tool_file_scraper: 'Extractor de Archivos',
      tool_file_scraper_title: 'Extractor y Aplanador',
      desc_file_scraper:
        'Extrae archivos específicos recursivamente desde un directorio y muévelos aplanados a un destino.',
      tool_empty_folder_cleaner_title: 'Limpiador de Carpetas Vacías',
      tool_empty_folder_cleaner_desc:
        'Identifica y elimina carpetas que están vacías o que solo contienen otras subcarpetas vacías. Permite la eliminación selectiva y simulacros.',
      desc_empty_folder_cleaner:
        'Escanea tu árbol de directorios en busca de carpetas vacías. Revisa la lista de carpetas encontradas y elige cuáles eliminar de forma segura.',
      btn_scan_empty: 'Buscar Carpetas Vacías',
      btn_delete_empty: 'Eliminar Carpetas Seleccionadas',
      btn_sim_delete_empty: 'Simular Eliminación de Carpetas',
      empty_folders_found: 'Carpetas vacías encontradas:',
      no_empty_folders: 'No se encontraron carpetas vacías en el directorio seleccionado.',
      source_folder: 'Directorio Origen',
      source_folder_help: 'Seleccione la carpeta raíz para escanear internamente los archivos.',
      destination_folder: 'Directorio Destino',
      destination_folder_help:
        'Seleccione la carpeta donde se transferirán los archivos encontrados.',
      file_types: 'Dominios de Archivo',
      btn_sim_scraper: 'Simular Extracción',
      btn_exec_scraper: 'Extraer y Aplanar Archivos',
      dry_run_help_scraper:
        'Revisa coincidencias y conflictos de nombre en el registro antes de alterar el disco.',
      merge_under_x: 'Fusionar Elementos Menores a (X):',
      merge_under_x_help_1: 'Las carpetas con menos de ',
      merge_under_x_help_2: ' elementos se fusionarán con sus hermanos.',
      max_elements_y: 'Máximo de Elementos en Grupo Fusionado (Y):',
      max_elements_y_help_1: 'Detener la agrupación cuando la carpeta combinada alcance ',
      max_elements_y_help_2: ' elementos.',
      dry_run_help_merge:
        'Previsualice las fusiones proyectadas a continuación antes de mover cualquier archivo.',
      btn_sim_merge: 'Simular Salida',
      btn_exec_merge: 'Fusionar Carpetas Destructivamente',
      desc_merge:
        'Fusiona recursivamente pequeñas carpetas hermanas en carpetas principales combinadas. Ideal para limpiar directorios fragmentados por toneladas de pequeñas subcarpetas.',

      file_extensions: 'Extensiones de Archivo:',
      all_files: 'Todos los Archivos (*)',
      type_ext_placeholder: 'Escriba la extensión (ej. .jpg) o seleccione...',
      btn_add: 'Agregar',
      dry_run_help_org:
        'Recomendamos encarecidamente realizar un simulacro primero para previsualizar dónde se moverán los archivos.',
      btn_sim_org: 'Simular Organización',
      btn_exec_org: 'Ejecutar Comando de Movimiento',
      desc_org:
        'Organice los archivos de un directorio en una estructura de carpetas de Año/Mes/Día según sus fechas de creación. Soporta metadatos EXIF, patrones de nombre de archivo y marcas de tiempo del sistema de archivos.',
      open_folder: 'Abrir Carpeta',

      input: 'Entrada',
      progress: 'Progreso',
      output: 'Salida',
      close_tasks: 'Cerrar Tareas',
      tasks: 'Tareas',
      background_tasks: 'Tareas en Segundo Plano',
      no_active_tasks: 'No hay tareas activas',
      cancel: 'Cancelar',
      dry_run_completed: 'Simulacro completo. Pendiente de revisión.',
      completed_success: 'Completado con éxito.',
      failed_status: 'Falló',
      cancelled_by_user: 'Cancelado por el usuario',

      search_placeholder: 'Buscar herramientas...',
      all_categories: 'Todas las categorías',
      category_favorites: 'Favoritos ❤️',
      category_file_management: 'Gestión de Archivos',
      category_media: 'Multimedia',
      category_utility: 'Utilidades',
      category_system: 'Sistema'
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false // not needed for React as it escapes by default
  }
})

export default i18n
