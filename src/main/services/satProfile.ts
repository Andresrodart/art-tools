import { app, safeStorage } from 'electron'
import * as fs from 'fs'
import { join } from 'path'

export interface SatProfile {
  name: string
  rfc: string
  taxRegime: string
  ciecPasswordEncrypted?: string
  efirmaPath?: string
  efirmaPasswordEncrypted?: string
}

function getSatProfilePath(): string {
  return join(app.getPath('userData'), 'sat_profile.json')
}

export function getSatProfile(): SatProfile | null {
  try {
    const profilePath = getSatProfilePath()
    if (fs.existsSync(profilePath)) {
      const data = fs.readFileSync(profilePath, 'utf8')
      const profile = JSON.parse(data) as SatProfile

      // Decrypt sensitive fields
      if (profile.ciecPasswordEncrypted && safeStorage.isEncryptionAvailable()) {
        try {
          const buffer = Buffer.from(profile.ciecPasswordEncrypted, 'base64')
          profile.ciecPasswordEncrypted = safeStorage.decryptString(buffer)
        } catch (e) {
          console.error('Failed to decrypt CIEC password', e)
        }
      }

      if (profile.efirmaPasswordEncrypted && safeStorage.isEncryptionAvailable()) {
        try {
          const buffer = Buffer.from(profile.efirmaPasswordEncrypted, 'base64')
          profile.efirmaPasswordEncrypted = safeStorage.decryptString(buffer)
        } catch (e) {
          console.error('Failed to decrypt e.firma password', e)
        }
      }

      return profile
    }
  } catch (err) {
    console.error('Failed to read SAT profile:', err)
  }
  return null
}

export function saveSatProfile(profile: SatProfile): boolean {
  try {
    const profilePath = getSatProfilePath()

    // Create a copy to manipulate
    const profileToSave = { ...profile }

    if (safeStorage.isEncryptionAvailable()) {
      if (profileToSave.ciecPasswordEncrypted) {
        const buffer = safeStorage.encryptString(profileToSave.ciecPasswordEncrypted)
        profileToSave.ciecPasswordEncrypted = buffer.toString('base64')
      }
      if (profileToSave.efirmaPasswordEncrypted) {
        const buffer = safeStorage.encryptString(profileToSave.efirmaPasswordEncrypted)
        profileToSave.efirmaPasswordEncrypted = buffer.toString('base64')
      }
    } else {
      console.warn('safeStorage is not available. Passwords will be saved in plain text.')
    }

    fs.writeFileSync(profilePath, JSON.stringify(profileToSave, null, 2), 'utf8')
    return true
  } catch (err) {
    console.error('Failed to save SAT profile:', err)
    return false
  }
}
