import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { MOCK_MENU_URL } from '../constants';
import type { Contact } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { contactsAPI } from '../lib/client';

const WeitereInfos: React.FC = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [menuUrl, setMenuUrl] = useState<string>(MOCK_MENU_URL);

    // Modal and form state
    const [isContactModalOpen, setContactModalOpen] = useState(false);
    const [isMenuModalOpen, setMenuModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const [formName, setFormName] = useState('');
    const [formRole, setFormRole] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formMenuUrl, setFormMenuUrl] = useState(menuUrl);

    useEffect(() => {
        const loadContacts = async () => {
            setIsLoading(true);
            try {
                const data = await contactsAPI.getAll();
                setContacts(data);
            } catch (error) {
                console.error('Fehler beim Laden der Kontakte:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadContacts();
    }, []);

    const handleOpenContactModal = (contact: Contact | null = null) => {
        if (contact) {
            setEditingContact(contact);
            setFormName(contact.name);
            setFormRole(contact.role);
            setFormPhone(contact.phone);
            setFormEmail(contact.email);
        } else {
            setEditingContact(null);
            setFormName('');
            setFormRole('');
            setFormPhone('');
            setFormEmail('');
        }
        setContactModalOpen(true);
    };
    
    const handleCloseContactModal = () => {
        setContactModalOpen(false);
        setEditingContact(null);
    };
    
    const handleSaveContact = async () => {
        if (!formName || !formRole) {
            alert('Bitte Name und Rolle ausfüllen.');
            return;
        }

        setIsLoading(true);
        try {
            if (editingContact) {
                const updated = await contactsAPI.update(editingContact.id, {
                    name: formName,
                    role: formRole,
                    phone: formPhone,
                    email: formEmail
                });
                setContacts(contacts.map(c => c.id === editingContact.id ? updated : c));
            } else {
                const newContact = await contactsAPI.create({
                    name: formName,
                    role: formRole,
                    phone: formPhone,
                    email: formEmail
                });
                setContacts([...contacts, newContact]);
            }
            handleCloseContactModal();
        } catch (error) {
            console.error('Fehler beim Speichern des Kontakts:', error);
            alert('Fehler beim Speichern des Kontakts. Bitte versuchen Sie es erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteContact = async (contactId: number) => {
        if (window.confirm("Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?")) {
            setIsLoading(true);
            try {
                await contactsAPI.delete(contactId);
                setContacts(contacts.filter(c => c.id !== contactId));
            } catch (error) {
                console.error('Fehler beim Löschen des Kontakts:', error);
                alert('Fehler beim Löschen des Kontakts. Bitte versuchen Sie es erneut.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSaveMenuUrl = () => {
        setMenuUrl(formMenuUrl);
        setMenuModalOpen(false);
    };

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Weitere Infos</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contacts Card */}
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Ansprechpartner</h2>
                            {user?.role === UserRole.ADMIN && (
                                <Button onClick={() => handleOpenContactModal()}>+ Hinzufügen</Button>
                            )}
                        </div>
                        <div className="mt-4 space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                                </div>
                            ) : contacts.length > 0 ? (
                                contacts.map(contact => (
                                <div key={contact.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-900">{contact.name}</p>
                                        <p className="text-sm text-gray-600">{contact.role}</p>
                                        <div className="flex items-center space-x-4 mt-2">
                                            {contact.phone && (
                                                <a href={`tel:${contact.phone}`} className="flex items-center text-sm text-gray-500 hover:text-cyan-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                    {contact.phone}
                                                </a>
                                            )}
                                            {contact.email && (
                                                <a href={`mailto:${contact.email}`} className="flex items-center text-sm text-gray-500 hover:text-cyan-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                                    {contact.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {user?.role === UserRole.ADMIN && (
                                        <div className="flex-shrink-0 flex items-center space-x-2">
                                            <button onClick={() => handleOpenContactModal(contact)} className="text-indigo-600 hover:text-indigo-800" title="Bearbeiten">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="text-red-600 hover:text-red-800" title="Löschen">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Keine Kontakte vorhanden.</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Menu Plan Card */}
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Speiseplan</h2>
                            {user?.role === UserRole.ADMIN && (
                                <Button onClick={() => setMenuModalOpen(true)} variant="secondary">Link bearbeiten</Button>
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-600 mb-4">Hier finden Sie den aktuellen Speiseplan unseres Catering-Anbieters.</p>
                            <a 
                                href={menuUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-200"
                            >
                                Zum Speiseplan
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                            </a>
                        </div>
                    </div>
                </Card>
                </div>
            </div>
            
            {/* Contact Modal */}
            <Modal isOpen={isContactModalOpen} onClose={handleCloseContactModal} title={editingContact ? 'Kontakt bearbeiten' : 'Neuen Kontakt erstellen'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Rolle</label>
                        <input type="text" value={formRole} onChange={e => setFormRole(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Telefonnummer</label>
                        <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">E-Mail Adresse</label>
                        <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveContact}>{editingContact ? 'Speichern' : 'Erstellen'}</Button>
                    </div>
                </div>
            </Modal>
            
            {/* Menu URL Modal */}
            <Modal isOpen={isMenuModalOpen} onClose={() => setMenuModalOpen(false)} title="Speiseplan-Link bearbeiten">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL zum Speiseplan</label>
                        <input type="url" value={formMenuUrl} onChange={e => setFormMenuUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveMenuUrl}>Speichern</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default WeitereInfos;
