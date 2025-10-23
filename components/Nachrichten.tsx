import React, { useState, useEffect, useRef } from 'react';
import type { User, Conversation, Message } from '../types';
import { UserRole } from '../types';
import Button from './Button';
import Card from './Card';
import Modal from './Modal';
import { conversationsAPI, messagesAPI, usersAPI } from '../lib/client';

interface ConversationWithMessages extends Omit<Conversation, 'messages'> {
  messages: Message[];
}

interface BackendUser {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
}

const Nachrichten: React.FC<{ user: User }> = ({ user }) => {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For Admin Composer Modal
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [composerRecipient, setComposerRecipient] = useState<string>('all');
  const [composerContent, setComposerContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const getUserById = (id: number): BackendUser | undefined => {
    return users.find(u => u.id === id);
  };

  const parentUsers = users.filter(u => u.role === UserRole.PARENT);

  useEffect(() => {
    loadConversationsAndMessages();
  }, [user.id, user.role]);

  useEffect(() => {
    loadUsers();
  }, [user.role]);

  useEffect(() => {
    // Auto-select conversation
    if (user.role === UserRole.PARENT) {
      const parentConvo = conversations.find(c => c.participantIds.includes(user.id));
      if (parentConvo) {
        setSelectedConversationId(parentConvo.id);
      }
    } else if (conversations.length > 0 && window.innerWidth >= 768) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [user.id, user.role, conversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, conversations]);

  const loadUsers = async () => {
    try {
      // Admin loads all users, parents load only staff
      const fetchedUsers = user.role === UserRole.ADMIN 
        ? await usersAPI.getAll() 
        : await usersAPI.getStaff();
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Fehler beim Laden der Benutzer:', err);
    }
  };

  const loadConversationsAndMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedConversations = await conversationsAPI.getAll();
      
      const conversationsWithMessages: ConversationWithMessages[] = await Promise.all(
        fetchedConversations.map(async (conv: any) => {
          try {
            const participantIds = typeof conv.participantIds === 'string' 
              ? JSON.parse(conv.participantIds) 
              : conv.participantIds;
            
            const messages = await messagesAPI.getByConversationId(conv.id);
            
            const sortedMessages = messages.sort((a: any, b: any) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            return {
              id: conv.id,
              participantIds,
              messages: sortedMessages
            };
          } catch (err) {
            console.error(`Fehler beim Laden der Nachrichten für Konversation ${conv.id}:`, err);
            const participantIds = typeof conv.participantIds === 'string' 
              ? JSON.parse(conv.participantIds) 
              : conv.participantIds;
            return {
              id: conv.id,
              participantIds,
              messages: []
            };
          }
        })
      );

      setConversations(conversationsWithMessages);
    } catch (err: any) {
      console.error('Fehler beim Laden der Konversationen:', err);
      setError('Fehler beim Laden der Nachrichten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Konversation löschen möchten? Alle Nachrichten werden unwiderruflich gelöscht.')) {
      return;
    }

    try {
      await conversationsAPI.delete(conversationId);
      
      // Wenn die gelöschte Konversation ausgewählt war, Auswahl zurücksetzen
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      
      // Konversationen neu laden
      await loadConversationsAndMessages();
      
      alert('Konversation erfolgreich gelöscht');
    } catch (err: any) {
      console.error('Fehler beim Löschen der Konversation:', err);
      alert('Fehler beim Löschen der Konversation');
    }
  };

  const handleSendMessage = async () => {
    if (!replyContent.trim() || !selectedConversationId) return;

    try {
      setSendingMessage(true);

      const newMessage = await messagesAPI.create({
        conversationId: selectedConversationId,
        content: replyContent
      });

      setConversations(currentConversations =>
        currentConversations.map(c =>
          c.id === selectedConversationId
            ? { ...c, messages: [...c.messages, newMessage] }
            : c
        )
      );

      setReplyContent('');
    } catch (err: any) {
      console.error('Fehler beim Senden der Nachricht:', err);
      alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleSendFromComposer = async () => {
    if (!composerContent.trim()) {
      alert("Bitte geben Sie eine Nachricht ein.");
      return;
    }

    try {
      setSendingMessage(true);

      if (composerRecipient === 'all') {
        await Promise.all(
          parentUsers.map(async (parent) => {
            let existingConvo = conversations.find(c => 
              c.participantIds.includes(parent.id) && c.participantIds.includes(user.id)
            );

            if (existingConvo) {
              const newMessage = await messagesAPI.create({
                conversationId: existingConvo.id,
                content: composerContent
              });

              setConversations(currentConversations =>
                currentConversations.map(c =>
                  c.id === existingConvo!.id
                    ? { ...c, messages: [...c.messages, newMessage] }
                    : c
                )
              );
            } else {
              const newConversation = await conversationsAPI.create([parent.id, user.id]);
              
              const participantIds = typeof newConversation.participantIds === 'string'
                ? JSON.parse(newConversation.participantIds)
                : newConversation.participantIds;

              const newMessage = await messagesAPI.create({
                conversationId: newConversation.id,
                content: composerContent
              });

              setConversations(currentConversations => [
                ...currentConversations,
                {
                  id: newConversation.id,
                  participantIds,
                  messages: [newMessage]
                }
              ]);
            }
          })
        );
      } else {
        const recipientId = parseInt(composerRecipient, 10);
        let existingConvo = conversations.find(c => 
          c.participantIds.includes(recipientId) && c.participantIds.includes(user.id)
        );

        if (existingConvo) {
          const newMessage = await messagesAPI.create({
            conversationId: existingConvo.id,
            content: composerContent
          });

          setConversations(currentConversations =>
            currentConversations.map(c =>
              c.id === existingConvo!.id
                ? { ...c, messages: [...c.messages, newMessage] }
                : c
            )
          );
        } else {
          const newConversation = await conversationsAPI.create([recipientId, user.id]);
          
          const participantIds = typeof newConversation.participantIds === 'string'
            ? JSON.parse(newConversation.participantIds)
            : newConversation.participantIds;

          const newMessage = await messagesAPI.create({
            conversationId: newConversation.id,
            content: composerContent
          });

          setConversations(currentConversations => [
            ...currentConversations,
            {
              id: newConversation.id,
              participantIds,
              messages: [newMessage]
            }
          ]);
        }
      }
      
      setComposerContent('');
      setComposerRecipient('all');
      setComposerOpen(false);
    } catch (err: any) {
      console.error('Fehler beim Senden der Nachricht:', err);
      alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setSendingMessage(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const myConversations = conversations.filter(c => c.participantIds.includes(user.id));

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Nachrichten</h1>
        <Card className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Nachrichten...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Nachrichten</h1>
        <Card className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadConversationsAndMessages}>Erneut versuchen</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Nachrichten</h1>
        <Card className="flex flex-col md:flex-row h-[70vh]">
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex-col ${selectedConversationId && 'hidden md:flex'}`}>
                {user.role === UserRole.ADMIN && (
                    <div className="p-4 border-b">
                        <Button onClick={() => setComposerOpen(true)} className="w-full">
                            + Neue Nachricht
                        </Button>
                    </div>
                )}
                <div className="overflow-y-auto">
                    {myConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            Keine Konversationen vorhanden
                        </div>
                    ) : (
                        myConversations.map(convo => {
                            const otherParticipantId = convo.participantIds.find(id => id !== user.id);
                            const otherUser = otherParticipantId ? getUserById(otherParticipantId) : null;
                            const lastMessage = convo.messages[convo.messages.length - 1];

                            return (
                                <div
                                    key={convo.id}
                                    className={`p-4 hover:bg-gray-100 ${selectedConversationId === convo.id ? 'bg-cyan-50' : ''} relative group`}
                                >
                                    <div 
                                        className="cursor-pointer"
                                        onClick={() => setSelectedConversationId(convo.id)}
                                    >
                                        <p className="font-semibold text-gray-800">
                                            {user.role === UserRole.ADMIN 
                                                ? (otherUser?.name || 'Unbekannter Benutzer') 
                                                : 'Kita Leitung'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {lastMessage?.content || 'Keine Nachrichten'}
                                        </p>
                                    </div>
                                    {user.role === UserRole.ADMIN && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteConversation(convo.id);
                                            }}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                                            title="Konversation löschen"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className={`w-full md:w-2/3 flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center">
                            <button onClick={() => setSelectedConversationId(null)} className="md:hidden mr-4 text-gray-600 hover:text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                             <h2 className="text-lg font-bold text-gray-800">
                                {user.role === UserRole.ADMIN 
                                    ? (() => {
                                        const otherParticipantId = selectedConversation.participantIds.find(id => id !== user.id);
                                        const otherUser = otherParticipantId ? getUserById(otherParticipantId) : null;
                                        return otherUser?.name || 'Unbekannter Benutzer';
                                      })()
                                    : 'Kita Leitung'}
                             </h2>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {selectedConversation.messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                    Noch keine Nachrichten in dieser Konversation
                                </div>
                            ) : (
                                selectedConversation.messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} mb-4`}>
                                        <div className={`max-w-md p-3 rounded-lg ${msg.senderId === user.id ? 'bg-cyan-500 text-white' : 'bg-white shadow'}`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-cyan-100' : 'text-gray-400'} text-right`}>
                                                {new Date(msg.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white">
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                                    placeholder="Nachricht schreiben..."
                                    disabled={sendingMessage}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100"
                                />
                                <Button 
                                    onClick={handleSendMessage} 
                                    className="ml-3"
                                    disabled={sendingMessage || !replyContent.trim()}
                                >
                                    {sendingMessage ? 'Senden...' : 'Senden'}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex items-center justify-center h-full text-gray-500">
                        Wählen Sie eine Konversation aus oder starten Sie eine neue.
                    </div>
                )}
            </div>
        </Card>

         <Modal isOpen={isComposerOpen} onClose={() => setComposerOpen(false)} title="Neue Nachricht erstellen">
            <div className="space-y-4">
                <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">Empfänger</label>
                    <select 
                        id="recipient" 
                        value={composerRecipient}
                        onChange={e => setComposerRecipient(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={sendingMessage}
                    >
                        <option value="all">Alle Eltern</option>
                        {parentUsers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="composerContent" className="block text-sm font-medium text-gray-700">Nachricht</label>
                    <textarea 
                        id="composerContent" 
                        rows={5} 
                        value={composerContent}
                        onChange={e => setComposerContent(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={sendingMessage}
                    ></textarea>
                </div>
                <div className="flex justify-end pt-4">
                    <Button 
                        onClick={handleSendFromComposer}
                        disabled={sendingMessage || !composerContent.trim()}
                    >
                        {sendingMessage ? 'Senden...' : 'Senden'}
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default Nachrichten;