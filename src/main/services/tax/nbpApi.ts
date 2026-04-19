import axios from 'axios'
import { DateTime } from 'luxon'

/**
 * Fetches the historical exchange rate from the NBP API for a given currency and date.
 * If the exact date doesn't have a rate (e.g., weekend/holiday), it fetches the last available working day.
 *
 * @param currencyCode The 3-letter currency code (e.g., 'USD', 'EUR').
 * @param date The date to fetch the rate for (YYYY-MM-DD). If it's for vesting, you should pass the day before vesting.
 * @returns The exchange rate to PLN, or null if it fails.
 */
export async function getNBPRateForDate(
  currencyCode: string,
  date: string
): Promise<number | null> {
  try {
    // The NBP API format for a specific date:
    // http://api.nbp.pl/api/exchangerates/rates/a/{currencyCode}/{date}/?format=json
    let targetDate = DateTime.fromISO(date)

    // NBP only publishes rates on working days. We might need to step back.
    for (let i = 0; i < 5; i++) {
      const dateStr = targetDate.toFormat('yyyy-MM-dd')
      try {
        const url = `http://api.nbp.pl/api/exchangerates/rates/a/${currencyCode.toLowerCase()}/${dateStr}/?format=json`
        const response = await axios.get(url, { timeout: 5000 })
        if (response.data && response.data.rates && response.data.rates.length > 0) {
          return response.data.rates[0].mid
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
          // 404 means no rate published on this day (weekend/holiday). Step back one day and retry.
          targetDate = targetDate.minus({ days: 1 })
        } else {
          // Other network error
          console.error(
            `Error fetching NBP rate for ${currencyCode} on ${dateStr}:`,
            err instanceof Error ? err.message : String(err)
          )
          return null
        }
      }
    }
    return null // If we couldn't find a rate in 5 days, something is wrong.
  } catch (err: unknown) {
    console.error(
      'Error calculating NBP date:',
      err instanceof Error ? err.message : String(err)
    )
    return null
  }
}
