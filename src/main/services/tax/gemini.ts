import { GoogleGenAI } from '@google/genai'

export interface ExtractedTaxData {
  date: string
  grossSalary?: number
  netSalary?: number
  zus?: number
  podatek?: number
  vestingDate?: string
  vestingValue?: number
  currency?: string
  uuid?: string
  issuer?: string
  description?: string
  subtotal?: number
  total?: number
  exchangeRate?: number
}

/**
 * Fallback to extract data from raw text using Gemini if standard regex/parsing fails.
 */
export async function extractFinancialDataWithGemini(
  text: string,
  apiKey: string,
  countryContext: 'Poland' | 'Mexico'
): Promise<ExtractedTaxData | null> {
  if (!apiKey || !text) return null

  try {
    const ai = new GoogleGenAI({ apiKey })

    const polandPrompt = `
      Extract the following financial data from the given Polish tax/payslip document text.
      Return the data strictly as a JSON object with the following keys, and use null if a field is not found:
      - date (YYYY-MM-DD format, look for "Data wypłaty" or payment date)
      - grossSalary (number)
      - netSalary (number)
      - zus (number, total social security/insurance deductions)
      - podatek (number, tax deductions)
      - vestingDate (YYYY-MM-DD format, if this is a GSU/RSU report)
      - vestingValue (number, total value of vested shares, if applicable)
      - currency (3 letter string, e.g., 'PLN', 'USD')

      Document text:
      ${text}
    `

    const mexicoPrompt = `
      Extract the following financial data from the given Mexican CFDI/Invoice document text.
      Return the data strictly as a JSON object with the following keys, and use null if a field is not found:
      - date (YYYY-MM-DD format, look for "Fecha" or emission date)
      - uuid (Folio Fiscal string)
      - issuer (string, Emisor/Company name)
      - description (string, Concepto/Description)
      - subtotal (number)
      - total (number)
      - currency (3 letter string, e.g., 'MXN', 'USD')
      - exchangeRate (number, TipoCambio if present)

      Document text:
      ${text}
    `

    const prompt = countryContext === 'Poland' ? polandPrompt : mexicoPrompt

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    })

    const outputText = response.text
    if (outputText) {
      const parsedData = JSON.parse(outputText)
      return parsedData as ExtractedTaxData
    }

    return null
  } catch (err) {
    console.error('Gemini extraction failed:', err)
    return null
  }
}
