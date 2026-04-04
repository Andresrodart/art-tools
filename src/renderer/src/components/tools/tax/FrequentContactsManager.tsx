import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import React from 'react'
import { TaxProfileCheck } from './TaxProfileCheck'

interface Contact {
  id: string
  name: string
  rfc: string
  type: 'client' | 'supplier'
}

export const FrequentContactsManager = (): React.JSX.Element => {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('sat_frequent_contacts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse contacts from local storage:', e)
      }
    }
    return []
  })

  const [formData, setFormData] = useState<Omit<Contact, 'id'>>({
    name: '',
    rfc: '',
    type: 'client'
  })

  const saveContacts = (newContacts: Contact[]): void => {
    setContacts(newContacts)
    localStorage.setItem('sat_frequent_contacts', JSON.stringify(newContacts))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddContact = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!formData.name || !formData.rfc) return

    const newContact: Contact = {
      ...formData,
      id: crypto.randomUUID()
    }

    saveContacts([...contacts, newContact])
    setFormData({ name: '', rfc: '', type: 'client' }) // reset
  }

  const handleDeleteContact = (id: string): void => {
    saveContacts(contacts.filter((c) => c.id !== id))
  }

  return (
    <div className="tool-view">
      <div className="tool-view-description">
        <h2>{t('tool_frequent_contacts_title')}</h2>
        <p>{t('tool_frequent_contacts_desc')}</p>
      </div>

      <TaxProfileCheck />

      <form onSubmit={handleAddContact} className="tool-view-section">
        <h3 className="tool-view-section-title">Add New Contact</h3>
        <div className="tool-view-section-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="control-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Name / Razón Social</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="brutalist-input"
                placeholder="Empresa SA de CV"
                required
              />
            </div>
            <div className="control-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>RFC</label>
              <input
                type="text"
                name="rfc"
                value={formData.rfc}
                onChange={handleChange}
                className="brutalist-input uppercase"
                placeholder="EMP123456XXX"
                required
                maxLength={13}
              />
            </div>
            <div className="control-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="brutalist-input"
                required
              >
                <option value="client">Client</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          </div>

          <div className="action-row" style={{ marginTop: '1rem' }}>
            <button type="submit" className="brutalist-button primary">
              Add Contact
            </button>
          </div>
        </div>
      </form>

      <div className="tool-view-section">
        <h3 className="tool-view-section-title">Saved Contacts</h3>
        <div className="tool-view-section-body">
          {contacts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No contacts saved yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    border: '2px solid var(--border-color)',
                    background: 'var(--bg-tertiary-light, #f8f9fa)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {contact.name}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: '#ffffff',
                          padding: '2px 6px',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {contact.rfc}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          textTransform: 'uppercase',
                          border: '2px solid var(--border-color)',
                          background:
                            contact.type === 'client' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {contact.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="brutalist-button danger"
                    style={{ padding: '4px 12px', fontSize: '0.9rem' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
