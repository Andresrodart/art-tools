import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import React from 'react'

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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase text-text-main">
          {t('tool_frequent_contacts_title')}
        </h2>
      </div>

      <p className="text-text-main/80 border-l-4 border-bg-main-accent pl-4">
        {t('tool_frequent_contacts_desc')}
      </p>

      <form onSubmit={handleAddContact} className="neo-brutal-box flex flex-col gap-4 bg-white">
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-text-main">Name / Razón Social</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="neo-brutal-input w-full"
              placeholder="Empresa SA de CV"
              required
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-text-main">RFC</label>
            <input
              type="text"
              name="rfc"
              value={formData.rfc}
              onChange={handleChange}
              className="neo-brutal-input w-full uppercase"
              placeholder="EMP123456XXX"
              required
              maxLength={13}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-text-main">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="neo-brutal-input w-full"
              required
            >
              <option value="client">Client</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="neo-brutal-btn mt-4 w-full bg-text-main text-white hover:bg-black/90"
        >
          Add Contact
        </button>
      </form>

      <div className="neo-brutal-box flex flex-col gap-4 bg-white mt-4">
        <h3 className="text-xl font-bold border-b-2 border-black pb-2">Saved Contacts</h3>
        {contacts.length === 0 ? (
          <p className="text-text-main/60 italic">No contacts saved yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex justify-between items-center p-3 border-2 border-black bg-bg-main/20 rounded-md"
              >
                <div>
                  <p className="font-bold text-lg">{contact.name}</p>
                  <p className="text-sm font-mono bg-white inline-block px-1 border border-black">
                    {contact.rfc}
                  </p>
                  <span
                    className={`ml-2 text-xs font-bold px-2 py-1 uppercase border-2 border-black ${contact.type === 'client' ? 'bg-green-300' : 'bg-blue-300'}`}
                  >
                    {contact.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="neo-brutal-btn bg-red-400 text-black hover:bg-red-500 py-1 px-3 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
