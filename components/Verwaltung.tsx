import React, { useState, useEffect } from 'react';
import type { User, Child, Group } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../src/integrations/supabase/client';

const Verwaltung: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isChildModalOpen, setChildModalOpen] = useState(false);
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [isGroupEditModalOpen, setGroupEditModalOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [childToAddId, setChildToAddId] = useState<string>('');

    // Load users and groups on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*, children(*)');

            if (profilesError) throw profilesError;

            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*');

            if (groupsError) throw groupsError;

            const formattedUsers = profilesData.map((p: any) => ({
                id: p.id,
                name: p.name,
                username: p.username,
                role: p.role,
                avatarUrl: p.avatar_url,
                assignedGroupId: p.assigned_group_id,
                children: p.children.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    groupId: c.group_id,
                    avatarUrl: c.avatar_url
                }))
            }));

            setUsers(formattedUsers);
            setGroups(groupsData);
        } catch (err: any) {
            console.error('Fehler beim Laden der Daten:', err);
            setError(err.message || 'Fehler beim Laden der Daten');
        } finally {
            setIsLoading(false);
        }
    };

    // Form state for new/edit user
    const [formUserName, setFormUserName] = useState('');
    const [formUserEmail, setFormUserEmail] = useState('');
    const [formUserPassword, setFormUserPassword] = useState('');
    const [formUserRole, setFormUserRole] = useState<UserRole>(UserRole.PARENT);
    const [formUserAssignedGroupId, setFormUserAssignedGroupId] = useState<number | null>(null);

    // Form state for new child
    const [newChildName, setNewChildName] = useState('');
    const [newChildGroupId, setNewChildGroupId] = useState<number | undefined>(undefined);

    // Form state for new group
    const [newGroupName, setNewGroupName] = useState('');

    const getGroupName = (groupId: number): string => {
        if (!groupId) return 'Ohne Gruppe';
        return groups.find(g => g.id === groupId)?.name || 'N/A';
    };

    const handleOpenUserModal = (user: User | null) => {
      if (user) {
        setEditingUser(user);
        setFormUserName(user.name);
        setFormUserEmail(user.username); // username is email
        setFormUserRole(user.role);
        setFormUserPassword('');
        setFormUserAssignedGroupId(user.assignedGroupId || null);
      } else {
        setEditingUser(null);
        setFormUserName('');
        setFormUserEmail('');
        setFormUserPassword('');
        setFormUserRole(UserRole.PARENT);
        setFormUserAssignedGroupId(null);
      }
      setUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setUserModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async () => {
        if (!formUserName || !formUserEmail) {
            alert('Bitte Name und E-Mail ausfüllen.');
            return;
        }

        if (editingUser) {
            const { data, error } = await supabase
                .from('profiles')
                .update({ 
                    name: formUserName,
                    role: formUserRole,
                    assigned_group_id: formUserRole === UserRole.GRUPPENLEITUNG ? formUserAssignedGroupId : null
                })
                .eq('id', editingUser.id);

            if (error) {
                alert('Fehler beim Aktualisieren des Benutzers: ' + error.message);
            } else {
                await loadData();
                handleCloseUserModal();
            }
        } else {
            if (!formUserPassword) {
                alert('Bitte ein initiales Passwort festlegen.');
                return;
            }
            if (formUserRole === UserRole.GRUPPENLEITUNG && !formUserAssignedGroupId) {
                alert('Bitte wählen Sie eine Gruppe für die Gruppenleitung aus.');
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: formUserEmail,
                password: formUserPassword,
                options: {
                    data: {
                        name: formUserName,
                    }
                }
            });

            if (error) {
                alert('Fehler beim Erstellen des Benutzers: ' + error.message);
            } else if (data.user) {
                // Now update the profile with role and assigned group
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        role: formUserRole,
                        assigned_group_id: formUserRole === UserRole.GRUPPENLEITUNG ? formUserAssignedGroupId : null
                    })
                    .eq('id', data.user.id);
                
                if (profileError) {
                    alert('Benutzer erstellt, aber Rolle konnte nicht gesetzt werden: ' + profileError.message);
                } else {
                    alert(`Benutzer ${formUserName} erfolgreich erstellt!`);
                }
                await loadData();
                handleCloseUserModal();
            }
        }
    };

    const handleDeleteUser = async (userToDelete: User) => {
        if (userToDelete.id === currentUser?.id) {
            alert("Sie können sich nicht selbst löschen.");
            return;
        }
        if (!window.confirm(`Sind Sie sicher, dass Sie den Benutzer ${userToDelete.name} löschen möchten? Dies kann nicht rückgängig gemacht werden.`)) {
            return;
        }
        
        const { error } = await supabase.functions.invoke('delete-user', {
            body: { user_id: userToDelete.id },
        });

        if (error) {
            alert('Fehler beim Löschen des Benutzers: ' + error.message);
        } else {
            setUsers(users.filter(u => u.id !== userToDelete.id));
            alert(`Benutzer ${userToDelete.name} erfolgreich gelöscht!`);
        }
    };

    const handleOpenChildModal = (user: User) => {
        setSelectedUser(user);
        setNewChildGroupId(groups[0]?.id);
        setChildModalOpen(true);
    };

    const handleOpenGroupEditModal = (group: Group) => {
        setSelectedGroup(group);
        setGroupEditModalOpen(true);
    }

    const handleAddChild = async () => {
        if (!newChildName || !selectedUser || !newChildGroupId) {
            alert('Bitte Namen des Kindes und Gruppe angeben.');
            return;
        }

        const { error } = await supabase.from('children').insert({
            name: newChildName,
            parent_id: selectedUser.id,
            group_id: newChildGroupId,
        });

        if (error) {
            alert('Fehler beim Hinzufügen des Kindes: ' + error.message);
        } else {
            await loadData();
            setChildModalOpen(false);
            setNewChildName('');
            setSelectedUser(null);
            alert(`Kind ${newChildName} wurde erfolgreich hinzugefügt!`);
        }
    };

    const handleRemoveChildFromUser = async (childId: number) => {
        if (window.confirm("Sind Sie sicher, dass Sie dieses Kind löschen möchten? Dies kann nicht rückgängig gemacht werden.")) {
            const { error } = await supabase.from('children').delete().eq('id', childId);
            if (error) {
                alert('Fehler beim Löschen des Kindes: ' + error.message);
            } else {
                await loadData();
                alert('Kind wurde erfolgreich gelöscht!');
            }
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName) {
            alert('Bitte einen Gruppennamen eingeben.');
            return;
        }
        const { error } = await supabase.from('groups').insert({ name: newGroupName });
        if (error) {
            alert('Fehler beim Erstellen der Gruppe: ' + error.message);
        } else {
            await loadData();
            setGroupModalOpen(false);
            setNewGroupName('');
        }
    };

    const handleDeleteGroup = async (groupId: number) => {
        const isGroupInUse = users.some(user => user.children?.some(child => child.groupId === groupId));
        if (isGroupInUse) {
            alert('Diese Gruppe kann nicht gelöscht werden, da ihr noch Kinder zugewiesen sind.');
            return;
        }
        if (window.confirm('Sind Sie sicher, dass Sie diese Gruppe löschen möchten?')) {
            const { error } = await supabase.from('groups').delete().eq('id', groupId);
            if (error) {
                alert('Fehler beim Löschen der Gruppe: ' + error.message);
            } else {
                await loadData();
            }
        }
    }

    const handleAddChildToGroup = async () => {
        if (!childToAddId || !selectedGroup) return;
        
        const { error } = await supabase
            .from('children')
            .update({ group_id: selectedGroup.id })
            .eq('id', Number(childToAddId));

        if (error) {
            alert('Fehler beim Zuweisen des Kindes: ' + error.message);
        } else {
            await loadData();
            setChildToAddId('');
        }
    };
    
    const handleRemoveChildFromGroup = async (childId: number) => {
        const { error } = await supabase
            .from('children')
            .update({ group_id: null })
            .eq('id', childId);
        
        if (error) {
            alert('Fehler beim Entfernen des Kindes aus der Gruppe: ' + error.message);
        } else {
            await loadData();
        }
    };

    const allChildren = users.flatMap(u => u.children || []);
    const childrenInSelectedGroup = allChildren.filter(c => c.groupId === selectedGroup?.id);
    const availableChildren = allChildren.filter(c => c.groupId !== selectedGroup?.id);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">Lade Verwaltung...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
    }

    return (
        <div>
            {/* User Management Section */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Benutzerverwaltung</h1>
                <Button onClick={() => handleOpenUserModal(null)}>+ Neuer Benutzer</Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kinder</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aktionen</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                                        user.role === UserRole.GRUPPENLEITUNG ? 'bg-blue-100 text-blue-800' : 
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.children && user.children.length > 0 ? (
                                        <ul className="space-y-1">
                                            {user.children.map(child => (
                                                <li key={child.id} className="flex items-center justify-between">
                                                    <span>{child.name} ({getGroupName(child.groupId)})</span>
                                                    <button onClick={() => handleRemoveChildFromUser(child.id)} className="text-red-500 hover:text-red-700 ml-2" title="Kind entfernen">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    {user.role === UserRole.PARENT && (
                                        <button onClick={() => handleOpenChildModal(user)} className="text-cyan-600 hover:text-cyan-900">
                                            + Kind
                                        </button>
                                    )}
                                     {currentUser?.id !== user.id && (
                                        <>
                                            <button onClick={() => handleOpenUserModal(user)} className="text-indigo-600 hover:text-indigo-900">
                                                Bearbeiten
                                            </button>
                                            <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900">
                                                Löschen
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

            {/* Group Management Section */}
            <div className="flex justify-between items-center mt-12 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gruppenverwaltung</h1>
                <Button onClick={() => setGroupModalOpen(true)}>+ Neue Gruppe</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => {
                    const groupChildren = users.flatMap(u => u.children || []).filter(c => c.groupId === group.id);
                    return (
                        <Card key={group.id}>
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-xl font-bold text-gray-800">{group.name}</h2>
                                    <button onClick={() => handleDeleteGroup(group.id)} className="text-gray-400 hover:text-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-gray-600">Kinder in dieser Gruppe:</h3>
                                    {groupChildren.length > 0 ? (
                                        <ul className="mt-2 list-disc list-inside text-gray-700">
                                            {groupChildren.map(child => <li key={child.id}>{child.name}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-500 italic">Keine Kinder zugewiesen.</p>
                                    )}
                                </div>
                                <div className="mt-4 text-right">
                                    <button onClick={() => handleOpenGroupEditModal(group)} className="text-sm font-semibold text-cyan-600 hover:text-cyan-800">
                                        Bearbeiten
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modal for creating/editing a user */}
            <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" value={formUserName} onChange={e => setFormUserName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                        <input type="email" value={formUserEmail} onChange={e => setFormUserEmail(e.target.value)} disabled={!!editingUser} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Rolle</label>
                        <select value={formUserRole} onChange={e => setFormUserRole(e.target.value as UserRole)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                            <option value={UserRole.PARENT}>Eltern</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.GRUPPENLEITUNG}>Gruppenleitung</option>
                        </select>
                    </div>
                    {formUserRole === UserRole.GRUPPENLEITUNG && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Zugewiesene Gruppe</label>
                            <select 
                                value={formUserAssignedGroupId || ''} 
                                onChange={e => setFormUserAssignedGroupId(e.target.value ? parseInt(e.target.value) : null)} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            >
                                <option value="">Bitte Gruppe auswählen</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {!editingUser && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Initiales Passwort</label>
                            <input type="password" value={formUserPassword} onChange={e => setFormUserPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveUser}>{editingUser ? 'Änderungen speichern' : 'Benutzer erstellen'}</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal for adding a new child */}
            <Modal isOpen={isChildModalOpen} onClose={() => setChildModalOpen(false)} title={`Kind für ${selectedUser?.name} hinzufügen`}>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name des Kindes</label>
                        <input type="text" value={newChildName} onChange={e => setNewChildName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gruppe</label>
                        <select value={newChildGroupId} onChange={e => setNewChildGroupId(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleAddChild}>Kind hinzufügen</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal for creating a new group */}
            <Modal isOpen={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} title="Neue Gruppe erstellen">
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name der Gruppe</label>
                        <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleCreateGroup}>Gruppe erstellen</Button>
                    </div>
                </div>
            </Modal>

             {/* Modal for editing a group */}
            <Modal isOpen={isGroupEditModalOpen} onClose={() => setGroupEditModalOpen(false)} title={`Gruppe "${selectedGroup?.name}" bearbeiten`}>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-gray-800">Kinder in dieser Gruppe</h4>
                        {childrenInSelectedGroup.length > 0 ? (
                            <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                {childrenInSelectedGroup.map(child => (
                                    <li key={child.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                        <span className="text-gray-700">{child.name}</span>
                                        <button onClick={() => handleRemoveChildFromGroup(child.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Entfernen</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                           <p className="mt-2 text-sm text-gray-500 italic">Dieser Gruppe sind keine Kinder zugewiesen.</p> 
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-800">Kind hinzufügen</h4>
                        {availableChildren.length > 0 ? (
                            <div className="mt-2 flex items-center space-x-2">
                                <select 
                                    value={childToAddId} 
                                    onChange={e => setChildToAddId(e.target.value)} 
                                    className="flex-grow block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="" disabled>Kind auswählen...</option>
                                    {availableChildren.map(child => (
                                        <option key={child.id} value={child.id}>{child.name} ({getGroupName(child.groupId)})</option>
                                    ))}
                                </select>
                                <Button onClick={handleAddChildToGroup} className="flex-shrink-0">+ Hinzufügen</Button>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-gray-500 italic">Alle Kinder sind bereits einer Gruppe zugewiesen.</p>
                        )}
                    </div>
                    <div className="flex justify-end pt-4">
                       <Button onClick={() => setGroupEditModalOpen(false)} variant="secondary">Schließen</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Verwaltung;