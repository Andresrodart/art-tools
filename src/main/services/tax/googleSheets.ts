import { google, sheets_v4 } from 'googleapis'
import { ScanResult, TaxEntry } from './taxScanner'

/**
 * Creates an OAuth2 client for Google APIs.
 */
export function getGoogleOAuthClient(
  clientId: string,
  clientSecret: string,
  redirectUri: string = 'urn:ietf:wg:oauth:2.0:oob'
): InstanceType<typeof google.auth.OAuth2> {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * Generates the Auth URL to prompt the user.
 */
export function getGoogleAuthUrl(oauth2Client: InstanceType<typeof google.auth.OAuth2>): string {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets']

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  })
}

/**
 * Sets the credentials from the token.
 */
export function setGoogleCredentials(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens: any
): void {
  oauth2Client.setCredentials(tokens)
}

/**
 * Ensures a specific sheet/tab exists in the spreadsheet.
 */
async function ensureSheetExists(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetTitle: string,
  headers: string[]
): Promise<void> {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId
  })

  const existingSheets = spreadsheet.data.sheets || []
  const sheetExists = existingSheets.some((s) => s.properties?.title === sheetTitle)

  if (!sheetExists) {
    // Create the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle
              }
            }
          }
        ]
      }
    })

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers]
      }
    })
  }
}

/**
 * Updates the Google Sheet with the scanned tax data.
 */
export async function updateGoogleSheet(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  spreadsheetId: string,
  scanResult: ScanResult
): Promise<void> {
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  // Group entries by year
  const entriesByYear: Record<string, TaxEntry[]> = {}
  for (const entry of scanResult.entries) {
    const year = entry.date.split('-')[0]
    if (year) {
      if (!entriesByYear[year]) entriesByYear[year] = []
      entriesByYear[year].push(entry)
    }
  }

  const dataHeaders = [
    'Date',
    'Country',
    'Category',
    'Source Name',
    'Amount (Original)',
    'Currency',
    'Exchange Rate',
    'Amount (Base)',
    'File Reference',
    'UUID',
    'Gross Salary (PLN)',
    'Net Salary (PLN)',
    'ZUS (PLN)',
    'Podatek (PLN)'
  ]

  // For each year, ensure sheet exists and append data
  for (const [year, entries] of Object.entries(entriesByYear)) {
    const sheetTitle = `Income_${year}`
    await ensureSheetExists(sheets, spreadsheetId, sheetTitle, dataHeaders)

    // Sort entries by date ascending
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const values = entries.map((entry) => [
      entry.date,
      entry.country,
      entry.category,
      entry.sourceName,
      entry.amountOriginal,
      entry.currency,
      entry.exchangeRate,
      entry.amountBase,
      entry.fileReference,
      entry.uuid || '',
      entry.grossSalary || '',
      entry.netSalary || '',
      entry.zus || '',
      entry.podatek || ''
    ])

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:N`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values
      }
    })
  }

  // Handle Errors Tab
  if (scanResult.errors.length > 0) {
    const errorSheetTitle = 'Errors'
    await ensureSheetExists(sheets, spreadsheetId, errorSheetTitle, ['File Path', 'Error Message'])

    const errorValues = scanResult.errors.map((err) => [err.filePath, err.errorMessage])

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${errorSheetTitle}!A:B`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: errorValues
      }
    })
  }
}
