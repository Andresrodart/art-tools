import { promises as fs } from 'fs'
import path from 'path'
import { XMLParser } from 'fast-xml-parser'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')
import { DateTime } from 'luxon'
import { getNBPRateForDate } from './nbpApi'
import { extractFinancialDataWithGemini, ExtractedTaxData } from './gemini'

export interface TaxEntry {
  date: string // YYYY-MM-DD
  country: string // 'Mexico' | 'Poland'
  category: string // 'Salary' | 'Dividends' | 'Sold_Shares' | 'GSU' | 'Other'
  sourceName: string // Issuer / Employer Name
  amountOriginal: number // Raw amount extracted
  currency: string // 'MXN', 'PLN', 'USD'
  exchangeRate: number // 1.0 if base currency, or actual rate
  amountBase: number // amountOriginal * exchangeRate (Base currency usually PLN or MXN)
  fileReference: string // Filename or UUID
  uuid?: string // MXN CFDI UUID
  // Specific polish fields
  grossSalary?: number
  netSalary?: number
  zus?: number
  podatek?: number
}

export interface ProcessingError {
  filePath: string
  errorMessage: string
}

export interface ScanResult {
  entries: TaxEntry[]
  errors: ProcessingError[]
}

const CATEGORIES = ['Salary', 'Dividends', 'Sold_Shares', 'GSU', 'Other']
const COUNTRIES = ['Mexico_Tax', 'Poland_Tax']

/**
 * Initializes the target base directory with the required country and category subfolders.
 */
export async function initTaxDirectories(basePath: string): Promise<void> {
  const currentYear = DateTime.now().year.toString()

  for (const country of COUNTRIES) {
    const countryIncomePath = path.join(basePath, country, 'Income')
    for (const category of CATEGORIES) {
      const targetDir = path.join(countryIncomePath, category, currentYear)
      try {
        await fs.mkdir(targetDir, { recursive: true })
      } catch (err) {
        if (err instanceof Error) {
          console.error(`Failed to create directory ${targetDir}:`, err.message)
        }
      }
    }
  }
}

/**
 * Scans directories recursively for files.
 */
async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = []
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const subFiles = await walkDir(fullPath)
        files.push(...subFiles)
      } else {
        files.push(fullPath)
      }
    }
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (err instanceof Error && (err as any).code !== 'ENOENT') {
      console.warn(`Could not read directory ${dir}:`, err.message)
    }
  }
  return files
}

/**
 * Main scanner function. Scrapes both Mexico and Poland tax directories.
 */
export async function scanTaxDirectories(
  basePath: string,
  geminiApiKey: string,
  onProgress: (msg: string) => void
): Promise<ScanResult> {
  const result: ScanResult = { entries: [], errors: [] }

  // Track already processed UUIDs to prevent duplicates in current run
  const processedUUIDs = new Set<string>()
  const processedFiles = new Set<string>()

  // Helper to extract category from path e.g. /Mexico_Tax/Income/Salary/2024/...
  const getCategoryFromPath = (filePath: string): string => {
    const parts = filePath.split(path.sep)
    const incomeIndex = parts.indexOf('Income')
    if (incomeIndex !== -1 && parts.length > incomeIndex + 1) {
      return parts[incomeIndex + 1]
    }
    return 'Other'
  }

  onProgress('Scanning Mexico directories...')
  const mexicoDir = path.join(basePath, 'Mexico_Tax', 'Income')
  const mexicoFiles = await walkDir(mexicoDir)
  const xmlFiles = mexicoFiles.filter((f) => f.toLowerCase().endsWith('.xml'))

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

  for (const file of xmlFiles) {
    try {
      if (processedFiles.has(file)) continue
      const content = await fs.readFile(file, 'utf-8')
      const xmlObj = parser.parse(content)
      const comprobante = xmlObj['cfdi:Comprobante']

      if (!comprobante) {
        throw new Error('Invalid CFDI XML format')
      }

      const dateStr = comprobante['@_Fecha']?.split('T')[0] || ''
      const total = parseFloat(comprobante['@_Total']) || 0
      const currency = comprobante['@_Moneda'] || 'MXN'
      const exchangeRate = parseFloat(comprobante['@_TipoCambio']) || 1.0

      const emisor = comprobante['cfdi:Emisor']?.['@_Nombre'] || 'Unknown Issuer'
      let uuid = 'Unknown_UUID'

      const complemento = comprobante['cfdi:Complemento']
      if (complemento && complemento['tfd:TimbreFiscalDigital']) {
        uuid = complemento['tfd:TimbreFiscalDigital']['@_UUID']
      }

      if (processedUUIDs.has(uuid)) {
        continue
      }

      const category = getCategoryFromPath(file)

      // If MXN CFDI is in USD and exchange rate missing, fetch historical rate
      if (currency === 'USD' && exchangeRate === 1.0) {
        // MXN specific historical rates are not implemented via NBP,
        // would require Banxico API. For now, we fallback to 1.0 or user manually inputs.
        // We'll leave it as 1.0 if missing.
      }

      result.entries.push({
        date: dateStr,
        country: 'Mexico',
        category,
        sourceName: emisor,
        amountOriginal: total,
        currency,
        exchangeRate,
        amountBase: total * exchangeRate,
        fileReference: path.basename(file),
        uuid
      })

      processedUUIDs.add(uuid)
      processedFiles.add(file)
    } catch (err) {
      if (err instanceof Error) {
        result.errors.push({ filePath: file, errorMessage: err.message })
      } else {
        result.errors.push({ filePath: file, errorMessage: 'Unknown error' })
      }
    }
  }

  onProgress('Scanning Poland directories...')
  const polandDir = path.join(basePath, 'Poland_Tax', 'Income')
  const polandFiles = await walkDir(polandDir)
  const pdfFiles = polandFiles.filter((f) => f.toLowerCase().endsWith('.pdf'))

  for (const file of pdfFiles) {
    if (processedFiles.has(file)) continue

    try {
      const buffer = await fs.readFile(file)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any | null = null
      try {
        data = await pdfParse(buffer)
      } catch (e) {
        if (e instanceof Error) {
          throw new Error('Failed to parse PDF: ' + e.message)
        }
        throw new Error('Failed to parse PDF')
      }

      const text = data.text
      const category = getCategoryFromPath(file)

      let extractedData: ExtractedTaxData | null = null

      // Basic Regex attempts for typical fields
      let grossSalary = 0
      const grossMatch = text.match(/Wynagrodzenie brutto\s*[:-]\s*([\d\s,.]+)/i)
      if (grossMatch) grossSalary = parseFloat(grossMatch[1].replace(/\s/g, '').replace(',', '.'))

      let netSalary = 0
      const netMatch = text.match(/Netto\s*[:-]\s*([\d\s,.]+)/i)
      if (netMatch) netSalary = parseFloat(netMatch[1].replace(/\s/g, '').replace(',', '.'))

      const dateMatch =
        text.match(/Data wypłaty\s*[:-]\s*(\d{4}-\d{2}-\d{2})/i) ||
        text.match(/(\d{4}-\d{2}-\d{2})/)
      let dateStr = dateMatch ? dateMatch[1] : ''

      // If text extraction seems sparse, or it's a complex doc like PIT-11, use Gemini fallback
      if (!grossSalary || !dateStr) {
        extractedData = await extractFinancialDataWithGemini(text, geminiApiKey, 'Poland')
        if (extractedData) {
          dateStr = extractedData.date || dateStr
          grossSalary = extractedData.grossSalary || grossSalary
          netSalary = extractedData.netSalary || netSalary
        } else {
          throw new Error('Insufficient data extracted and Gemini fallback failed or unavailable.')
        }
      }

      // Handle GSU Exchange rate logic (fetch NBP rate for day BEFORE vesting date)
      let exchangeRate = 1.0
      let currency = 'PLN'
      if (category === 'GSU') {
        currency = 'USD' // Assuming GSU are mostly US based RSUs
        // Find vesting date
        const vestingDateStr = extractedData?.vestingDate || dateStr
        if (vestingDateStr) {
          const vestingDate = DateTime.fromISO(vestingDateStr)
          if (vestingDate.isValid) {
            const dayBefore = vestingDate.minus({ days: 1 }).toFormat('yyyy-MM-dd')
            const nbpRate = await getNBPRateForDate('USD', dayBefore)
            if (nbpRate) {
              exchangeRate = nbpRate
            } else {
              throw new Error(`Could not fetch NBP exchange rate for USD on ${dayBefore}`)
            }
          }
        }
      }

      const amountOriginal = grossSalary > 0 ? grossSalary : extractedData?.vestingValue || 0

      result.entries.push({
        date: dateStr,
        country: 'Poland',
        category,
        sourceName: 'Employer/Broker', // Often hard to reliably regex the employer name from payslip
        amountOriginal,
        currency: extractedData?.currency || currency,
        exchangeRate,
        amountBase: amountOriginal * exchangeRate,
        fileReference: path.basename(file),
        grossSalary,
        netSalary,
        zus: extractedData?.zus || 0,
        podatek: extractedData?.podatek || 0
      })

      processedFiles.add(file)
    } catch (err) {
      if (err instanceof Error) {
        result.errors.push({ filePath: file, errorMessage: err.message })
      } else {
        result.errors.push({ filePath: file, errorMessage: 'Unknown error' })
      }
    }
  }

  onProgress('Scanning complete.')
  return result
}
