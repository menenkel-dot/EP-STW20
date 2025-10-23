import React, { useState, useEffect } from 'react';
import type { User, Child, Group, Absence } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { useAuth } from '../hooks/useAuth';
import { authAPI, usersAPI, groupsAPI, absencesAPI } from '../lib/client';

const Verwaltung: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isLoadingAbsences, setIsLoadingAbsences] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isChildModalOpen, setChildModalOpen] = useState(false);
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [isGroupEditModalOpen, setGroupEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [userForPasswordReset, setUserForPasswordReset] = useState<User | null>(null);

    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [childToAddId, setChildToAddId] = useState<string>('');

    // Load users, groups, and absences on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoadingUsers(true);
                setIsLoadingGroups(true);
                setIsLoadingAbsences(true);
                setError(null);

                const [usersData, groupsData, absencesData] = await Promise.all([
                    usersAPI.getAll(),
                    groupsAPI.getAll(),
                    absencesAPI.getAll()
                ]);

                setUsers(usersData);
                setGroups(groupsData);
                setAbsences(absencesData);
            } catch (err: any) {
                console.error('Fehler beim Laden der Daten:', err);
                setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
            } finally {
                setIsLoadingUsers(false);
                setIsLoadingGroups(false);
                setIsLoadingAbsences(false);
            }
        };

        loadData();
    }, []);

    // Form state for new/edit user
    const [formUserName, setFormUserName] = useState('');
    const [formUserUsername, setFormUserUsername] = useState('');
    const [formUserPassword, setFormUserPassword] = useState('');
    const [formUserRole, setFormUserRole] = useState<UserRole>(UserRole.PARENT);

    // Form state for new child
    const [newChildName, setNewChildName] = useState('');
    const [newChildGroupId, setNewChildGroupId] = useState(1);

    // Form state for new group
    const [newGroupName, setNewGroupName] = useState('');
    
    // Form state for password reset
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const getGroupName = (groupId: number): string => {
        if (groupId === 0) return 'Ohne Gruppe';
        return groups.find(g => g.id === groupId)?.name || 'N/A';
    };

    const handleOpenUserModal = (user: User | null) => {
      if (user) {
        setEditingUser(user);
        setFormUserName(user.name);
        setFormUserUsername(user.username);
        setFormUserRole(user.role);
        setFormUserPassword('');
      } else {
        setEditingUser(null);
        setFormUserName('');
        setFormUserUsername('');
        setFormUserPassword('');
        setFormUserRole(UserRole.PARENT);
      }
      setUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setUserModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async () => {
        if (!formUserName || !formUserUsername) {
            alert('Bitte Name und Benutzername ausfüllen.');
            return;
        }

        if (editingUser) {
            // TODO: Implementieren Sie die Update-Funktion
            setUsers(users.map(u => 
                u.id === editingUser.id 
                ? { ...u, name: formUserName, username: formUserUsername } 
                : u
            ));
            handleCloseUserModal();
        } else {
            if (!formUserPassword) {
                alert('Bitte ein initiales Passwort festlegen.');
                return;
            }

            try {
                setError(null);
                
                // Benutzer über API erstellen
                const response = await authAPI.register({
                    username: formUserUsername,
                    password: formUserPassword,
                    name: formUserName,
                    role: formUserRole
                });

                // Benutzer zur Liste hinzufügen
                const newUser: User = {
                    id: response.user.id,
                    name: response.user.name,
                    username: response.user.username,
                    password: '', // Passwort nicht im Frontend speichern
                    role: response.user.role as UserRole,
                    children: [],
                    avatarUrl: response.user.avatarUrl || `https://i.pravatar.cc/150?u=${formUserUsername}`
                };
                
                setUsers([...users, newUser]);
                handleCloseUserModal();
                alert(`Benutzer ${formUserName} erfolgreich erstellt!`);
            } catch (err: any) {
                console.error('Fehler beim Erstellen des Benutzers:', err);
                const errorMessage = err.response?.data?.error || 'Fehler beim Erstellen des Benutzers';
                alert(errorMessage);
                setError(errorMessage);
            }
        }
    };

    const handleDeleteUser = async (userToDelete: User) => {
        if (userToDelete.id === currentUser?.id) {
            alert("Sie können sich nicht selbst löschen.");
            return;
        }
        if (userToDelete.children && userToDelete.children.length > 0) {
             if (!window.confirm("Dieser Benutzer hat zugeordnete Kinder. Sind Sie sicher, dass Sie diesen Benutzer und alle zugehörigen Kinder löschen möchten?")) {
                return;
             }
        } else {
            if (!window.confirm("Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?")) {
                return;
            }
        }
        
        try {
            await usersAPI.delete(userToDelete.id);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            alert(`Benutzer ${userToDelete.name} erfolgreich gelöscht!`);
        } catch (err: any) {
            console.error('Fehler beim Löschen des Benutzers:', err);
            const errorMessage = err.response?.data?.error || 'Fehler beim Löschen des Benutzers';
            alert(errorMessage);
        }
    };

    const handleOpenChildModal = (user: User) => {
        setSelectedUser(user);
        setChildModalOpen(true);
    };

    const handleOpenGroupEditModal = (group: Group) => {
        setSelectedGroup(group);
        setGroupEditModalOpen(true);
    }
    
    const handleOpenPasswordModal = (user: User) => {
        setUserForPasswordReset(user);
        setPasswordModalOpen(true);
    };

    const handleClosePasswordModal = () => {
        setPasswordModalOpen(false);
        setUserForPasswordReset(null);
        setNewPassword('');
        setConfirmPassword('');
    };
    
    const handleResetPassword = () => {
        if (!newPassword || !confirmPassword) {
            alert('Bitte füllen Sie beide Passwortfelder aus.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Die Passwörter stimmen nicht überein.');
            return;
        }
        if (!userForPasswordReset) return;

        setUsers(users.map(u =>
            u.id === userForPasswordReset.id
            ? { ...u, password: newPassword }
            : u
        ));
        
        alert(`Das Passwort für ${userForPasswordReset.name} wurde erfolgreich zurückgesetzt.`);
        handleClosePasswordModal();
    };


    const handleAddChild = () => {
        if (!newChildName || !selectedUser) {
            alert('Bitte Namen des Kindes angeben.');
            return;
        }
        const newChild: Child = {
            id: Date.now(),
            name: newChildName,
            groupId: newChildGroupId,
            avatarUrl: `https://picsum.photos/seed/${newChildName.toLowerCase().replace(' ', '')}/100/100`
        };

        setUsers(users.map(u => 
            u.id === selectedUser.id 
            ? { ...u, children: [...(u.children || []), newChild] } 
            : u
        ));

        setChildModalOpen(false);
        setNewChildName('');
        setNewChildGroupId(groups[0]?.id || 1);
        setSelectedUser(null);
    };

    const handleRemoveChildFromUser = (userId: number, childId: number) => {
        if (window.confirm("Sind Sie sicher, dass Sie dieses Kind vom Benutzer entfernen möchten?")) {
            setUsers(currentUsers =>
                currentUsers.map(user => {
                    if (user.id === userId) {
                        return {
                            ...user,
                            children: user.children.filter(child => child.id !== childId)
                        };
                    }
                    return user;
                })
            );
        }
    };

    const handleCreateGroup = () => {
        if (!newGroupName) {
            alert('Bitte einen Gruppennamen eingeben.');
            return;
        }
        const newGroup: Group = {
            id: Date.now(),
            name: newGroupName,
        };
        setGroups([...groups, newGroup]);
        setGroupModalOpen(false);
        setNewGroupName('');
    };

    const handleDeleteGroup = (groupId: number) => {
        const isGroupInUse = users.some(user => user.children?.some(child => child.groupId === groupId));
        if (isGroupInUse) {
            alert('Diese Gruppe kann nicht gelöscht werden, da ihr noch Kinder zugewiesen sind.');
            return;
        }
        if (window.confirm('Sind Sie sicher, dass Sie diese Gruppe löschen möchten?')) {
            setGroups(groups.filter(g => g.id !== groupId));
        }
    }

    const handleAddChildToGroup = () => {
        if (!childToAddId || !selectedGroup) return;
        const updatedUsers = users.map(user => ({
            ...user,
            children: user.children?.map(child =>
                child.id === Number(childToAddId) ? { ...child, groupId: selectedGroup.id } : child
            )
        }));
        setUsers(updatedUsers);
        setChildToAddId('');
    };
    
    const handleRemoveChildFromGroup = (childId: number) => {
        const updatedUsers = users.map(user => ({
            ...user,
            children: user.children?.map(child => 
                child.id === childId ? { ...child, groupId: 0 } : child // 0 for "unassigned"
            )
        }));
        setUsers(updatedUsers);
    };

    const allChildren = users.flatMap(u => u.children || []);
    const childrenInSelectedGroup = allChildren.filter(c => c.groupId === selectedGroup?.id);
    const availableChildren = allChildren.filter(c => c.groupId !== selectedGroup?.id);


    return (
        <div>
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* User Management Section */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Benutzerverwaltung</h1>
                <Button onClick={() => handleOpenUserModal(null)}>+ Neuer Benutzer</Button>
            </div>
            
            {isLoadingUsers ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <p className="text-gray-500">Lade Benutzer...</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzername</th>
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
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.role === UserRole.ADMIN ? 'Admin' : 'Eltern'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.children && user.children.length > 0 ? (
                                            <ul className="space-y-1">
                                                {user.children.map(child => (
                                                    <li key={child.id} className="flex items-center justify-between">
                                                        <span>{child.name} ({getGroupName(child.groupId)})</span>
                                                        <button onClick={() => handleRemoveChildFromUser(user.id, child.id)} className="text-red-500 hover:text-red-700 ml-2" title="Kind entfernen">
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
                                                {user.role === UserRole.PARENT && (
                                                    <button onClick={() => handleOpenPasswordModal(user)} className="text-amber-600 hover:text-amber-900">
                                                        Passwort
                                                    </button>
                                                )}
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
            )}

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

            {/* Absences Management Section */}
            <div className="flex justify-between items-center mt-12 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Abwesenheits-Übersicht</h1>
            </div>

            {isLoadingAbsences ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <p className="text-gray-500">Lade Abwesenheiten...</p>
                </div>
            ) : absences.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <p className="text-gray-500">Keine Abwesenheiten gemeldet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eltern</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Von</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bis</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grund</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptome</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {absences.map(absence => {
                                    const child = users.flatMap(u => u.children || []).find(c => c.id === absence.childId);
                                    const parent = users.find(u => u.children?.some(c => c.id === absence.childId));
                                    return (
                                        <tr key={absence.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {child?.name || 'Unbekannt'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {parent?.name || 'Unbekannt'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {absence.startDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {absence.endDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    absence.reason === 'krank' ? 'bg-red-100 text-red-800' :
                                                    absence.reason === 'urlaub' ? 'bg-blue-100 text-blue-800' :
                                                    absence.reason === 'termin' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {absence.reason === 'krank' ? 'Krank' :
                                                     absence.reason === 'urlaub' ? 'Urlaub' :
                                                     absence.reason === 'termin' ? 'Termin' :
                                                     absence.reason}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {absence.symptoms || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for creating/editing a user */}
            <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="name" value={formUserName} onChange={e => setFormUserName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Benutzername</label>
                        <input type="text" id="username" value={formUserUsername} onChange={e => setFormUserUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    {!editingUser && (
                      <>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rolle</label>
                            <select id="role" value={formUserRole} onChange={e => setFormUserRole(e.target.value as UserRole)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                                <option value={UserRole.PARENT}>Eltern</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Initiales Passwort</label>
                            <input type="password" id="password" value={formUserPassword} onChange={e => setFormUserPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                        </div>
                      </>
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
                        <label htmlFor="childName" className="block text-sm font-medium text-gray-700">Name des Kindes</label>
                        <input type="text" id="childName" value={newChildName} onChange={e => setNewChildName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label htmlFor="childGroup" className="block text-sm font-medium text-gray-700">Gruppe</label>
                        <select id="childGroup" value={newChildGroupId} onChange={e => setNewChildGroupId(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
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
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Name der Gruppe</label>
                        <input type="text" id="groupName" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleCreateGroup}>Gruppe erstellen</Button>
                    </div>
                </div>
            </Modal>

             {/* Modal for editing a group */}
            <Modal isOpen={isGroupEditModalOpen} onClose={() => setGroupEditModalOpen(false)} title={`Gruppe "${selectedGroup?.name}" bearbeiten`}>
                <div className="space-y-6">
                    {/* Section to remove children */}
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

                    {/* Section to add children */}
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

            {/* Modal for resetting a password */}
            <Modal isOpen={isPasswordModalOpen} onClose={handleClosePasswordModal} title={`Passwort für ${userForPasswordReset?.name} zurücksetzen`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="newPassword"  className="block text-sm font-medium text-gray-700">Neues Passwort</label>
                        <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700">Passwort bestätigen</label>
                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleResetPassword}>Passwort speichern</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Verwaltung;