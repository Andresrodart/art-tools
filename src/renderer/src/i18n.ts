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
      docs: 'Documentation'
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
      docs: 'Documentación'
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
