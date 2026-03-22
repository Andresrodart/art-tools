import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaxProfileStore } from '../../../store/taxProfileStore'
import React from 'react'

interface DashboardLink {
  label: string
  url: string
  description: string
}

export const TaxDashboard = (): React.JSX.Element => {
  const { t } = useTranslation()
  const { profile, fetchProfile, isLoading } = useTaxProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const getLinksForRegime = (regime: string): DashboardLink[] => {
    const defaultLinks: DashboardLink[] = [
      {
        label: 'Constancia de Situación Fiscal',
        url: 'https://www.sat.gob.mx/aplicacion/53027/genera-tu-constancia-de-situacion-fiscal',
        description: 'Generar o descargar tu constancia actualizada'
      },
      {
        label: 'Facturación Electrónica',
        url: 'https://www.sat.gob.mx/personas/factura-electronica',
        description: 'Generar, cancelar o consultar tus facturas (CFDIs)'
      }
    ]

    switch (regime) {
      case '626': // RESICO
        return [
          ...defaultLinks,
          {
            label: 'Declaración Mensual (RESICO)',
            url: 'https://www.sat.gob.mx/declaracion/25447/presenta-tu-declaracion-mensual-del-regimen-simplificado-de-confianza',
            description: 'Presenta tu declaración mensual del Régimen Simplificado de Confianza.'
          }
        ]
      case '605': // Sueldos y Salarios
        return [
          ...defaultLinks,
          {
            label: 'Visor de Nómina para el Trabajador',
            url: 'https://www.sat.gob.mx/declaracion/97720/consulta-el-visor-de-comprobantes-de-nomina-para-el-trabajador',
            description: 'Revisa tus recibos de nómina emitidos por tus empleadores.'
          },
          {
            label: 'Declaración Anual',
            url: 'https://www.sat.gob.mx/declaracion/23891/presenta-tu-declaracion-anual-de-personas-fisicas',
            description: 'Presenta tu declaración anual para el ejercicio fiscal.'
          }
        ]
      case '612': // PFAE
        return [
          ...defaultLinks,
          {
            label: 'Declaración Provisional',
            url: 'https://www.sat.gob.mx/declaracion/01309/presenta-tus-pagos-provisionales-o-definitivos-de-personas-fisicas',
            description: 'Presenta tus pagos provisionales o definitivos.'
          }
        ]
      default:
        return defaultLinks
    }
  }

  const handleLinkClick = (url: string): void => {
    window.open(url, '_blank')
  }

  return (
    <div className="tool-view">
      <div className="tool-view-description">
        <h2>{t('tool_tax_dashboard_title')}</h2>
        <p>{t('tool_tax_dashboard_desc')}</p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '1rem' }}>
          ℹ️ Loading profile data...
        </div>
      ) : profile && profile.taxRegime ? (
        <div className="tool-view-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderBottom: '2px solid var(--border-color)',
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <h3
              className="tool-view-section-title"
              style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}
            >
              Quick Links
            </h3>
            <span
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                border: '2px solid var(--border-color)'
              }}
            >
              Regime: {profile.taxRegime}
            </span>
          </div>
          <div className="tool-view-section-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}
            >
              {getLinksForRegime(profile.taxRegime).map((link, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    border: '2px solid var(--border-color)',
                    background: 'var(--bg-tertiary-light, #f8f9fa)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, transform 0.1s ease',
                    boxShadow: '4px 4px 0px var(--border-color)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)'
                    e.currentTarget.style.boxShadow = '6px 6px 0px var(--border-color)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '4px 4px 0px var(--border-color)'
                  }}
                  onClick={() => handleLinkClick(link.url)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        margin: 0,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {link.label}
                    </h4>
                    <svg
                      style={{
                        width: '20px',
                        height: '20px',
                        marginLeft: '0.5rem',
                        flexShrink: 0,
                        marginTop: '4px',
                        color: 'var(--text-primary)'
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {link.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--bg-tertiary)', fontWeight: 'bold', marginBottom: '1rem' }}>
          ⚠️ No tax regime found. Please configure your profile in the SAT Profile Manager to see
          tailored links.
        </div>
      )}
    </div>
  )
}
