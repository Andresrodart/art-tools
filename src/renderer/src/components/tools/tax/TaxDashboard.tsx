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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase text-text-main">
          {t('tool_tax_dashboard_title')}
        </h2>
      </div>

      <p className="text-text-main/80 border-l-4 border-bg-main-accent pl-4">
        {t('tool_tax_dashboard_desc')}
      </p>

      {isLoading ? (
        <div className="p-4 border-2 border-blue-500 bg-blue-100/50 text-blue-900 font-bold flex gap-2 items-center w-full">
          <span>ℹ️</span> Loading profile data...
        </div>
      ) : profile && profile.taxRegime ? (
        <div className="neo-brutal-box flex flex-col gap-4 bg-white">
          <div className="flex justify-between border-b-2 border-black pb-2 items-end">
            <h3 className="text-xl font-bold">Quick Links</h3>
            <span className="bg-bg-main-accent text-white px-3 py-1 text-sm font-bold border-2 border-black">
              Regime: {profile.taxRegime}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getLinksForRegime(profile.taxRegime).map((link, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 p-4 border-2 border-black bg-bg-main/20 hover:bg-bg-main/40 transition-colors cursor-pointer group"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg leading-tight group-hover:text-bg-main-accent transition-colors">
                    {link.label}
                  </h4>
                  <svg
                    className="w-5 h-5 ml-2 flex-shrink-0 mt-1"
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
                <p className="text-sm text-text-main/70">{link.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 border-2 border-yellow-500 bg-yellow-100/50 text-yellow-900 font-bold flex gap-2 items-center w-full">
          <span>⚠️</span> No tax regime found. Please configure your profile in the SAT Profile
          Manager to see tailored links.
        </div>
      )}
    </div>
  )
}
