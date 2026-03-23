import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlertStore, AlertType } from '../../store/alertStore'

export const GlobalAlertModal: React.FC = () => {
  const { t } = useTranslation()
  const { isOpen, title, message, type, mode, closeAlert } = useAlertStore()
  const okButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen && okButtonRef.current) {
      okButtonRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget && mode === 'alert') {
      closeAlert(true) // Close on backdrop click for alerts
    } else if (e.target === e.currentTarget && mode === 'confirm') {
      closeAlert(false) // Cancel on backdrop click for confirms
    }
  }

  const getThemeVars = (type: AlertType): React.CSSProperties => {
    switch (type) {
      case 'error':
        return {
          '--alert-bg': '#ffe5e5',
          '--alert-border': '#ff0000',
          '--alert-text': '#ff0000',
          '--alert-icon': '🚨'
        } as React.CSSProperties
      case 'warning':
        return {
          '--alert-bg': '#fff3cd',
          '--alert-border': '#ffc107',
          '--alert-text': '#856404',
          '--alert-icon': '⚠️'
        } as React.CSSProperties
      case 'success':
        return {
          '--alert-bg': '#d4edda',
          '--alert-border': '#28a745',
          '--alert-text': '#155724',
          '--alert-icon': '✅'
        } as React.CSSProperties
      case 'info':
      default:
        return {
          '--alert-bg': '#e2e3e5',
          '--alert-border': '#383d41',
          '--alert-text': '#383d41',
          '--alert-icon': 'ℹ️'
        } as React.CSSProperties
    }
  }

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(2px)'
    },
    modal: {
      backgroundColor: 'var(--bg-color, white)',
      border: '4px solid var(--alert-border)',
      boxShadow: '8px 8px 0px var(--alert-border)',
      padding: '24px',
      maxWidth: '400px',
      width: '90%',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      ...getThemeVars(type)
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderBottom: '4px solid var(--alert-border)',
      paddingBottom: '12px',
      color: 'var(--alert-text)'
    },
    icon: {
      fontSize: '24px'
    },
    title: {
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px'
    },
    message: {
      fontSize: '1rem',
      lineHeight: '1.5',
      color: 'var(--text-color)',
      wordBreak: 'break-word' as const
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '8px'
    },
    button: {
      padding: '8px 24px',
      fontSize: '1rem',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      border: '3px solid',
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.1s'
    },
    okButton: {
      backgroundColor: 'var(--alert-bg)',
      color: 'var(--alert-text)',
      borderColor: 'var(--alert-border)',
      boxShadow: '3px 3px 0px var(--alert-border)'
    },
    cancelButton: {
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
      borderColor: 'var(--text-color)',
      boxShadow: '3px 3px 0px var(--text-color)'
    }
  }

  const getIcon = (type: AlertType): string => {
    switch (type) {
      case 'error':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  return (
    <div
      style={styles.overlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
    >
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.icon} aria-hidden="true">
            {getIcon(type)}
          </span>
          <h2 id="alert-dialog-title" style={styles.title}>
            {title || type.toUpperCase()}
          </h2>
        </div>
        <div style={styles.message}>{message}</div>
        <div style={styles.actions}>
          {mode === 'confirm' && (
            <button
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={() => closeAlert(false)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
          )}
          <button
            ref={okButtonRef}
            style={{ ...styles.button, ...styles.okButton }}
            onClick={() => closeAlert(true)}
          >
            {t('common.ok', 'OK')}
          </button>
        </div>
      </div>
    </div>
  )
}
