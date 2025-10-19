import React, { useState, useEffect, useRef } from 'react';
import type { User, Conversation, Message } from '../types';
import { UserRole } from '../types';
import { MOCK_CONVERSATIONS, MOCK_USERS } from '../constants';
import Button from './Button';
import Card from './Card';
import Modal from './Modal';
import { useAuth } from '../hooks/useAuth';

const ADMIN_ID = 99;

const getUserById = (id: number): User | undefined => MOCK_USERS.find(u => u.id === id);

const Nachrichten: React.FC<{ user: User }> = ({ user }) => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // For Admin Composer Modal
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [composerRecipient, setComposerRecipient] = useState<string>('all');
  const [composerSubject, setComposerSubject] = useState(''); // For broadcasts
  const [composerContent, setComposerContent] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const parentUsers = MOCK_USERS.filter(u => u.role === UserRole.PARENT);

  useEffect(() => {
    // Auto-select conversation
    if (user.role === UserRole.PARENT) {
      const parentConvo = conversations.find(c => c.participantIds.includes(user.id));
      if (parentConvo) {
        setSelectedConversationId(parentConvo.id);
      }
    } else if (conversations.length > 0 && window.innerWidth >= 768) { // Only auto-select on desktop for admin
      setSelectedConversationId(conversations[0].id);
    }
  }, [user.id, user.role, conversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, conversations]);

  const handleSendMessage = () => {
    if (!replyContent.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      senderId: user.id,
      content: replyContent,
      timestamp: new Date().toISOString(),
    };

    setConversations(currentConversations =>
      currentConversations.map(c =>
        c.id === selectedConversationId
          ? { ...c, messages: [...c.messages, newMessage] }
          : c
      )
    );
    setReplyContent('');
  };
  
  const handleSendFromComposer = () => {
    if (!composerContent.trim()) {
        alert("Bitte geben Sie eine Nachricht ein.");
        return;
    }

    const newMessage: Message = {
        id: Date.now(),
        senderId: ADMIN_ID,
        content: composerContent,
        timestamp: new Date().toISOString(),
    };

    if (composerRecipient === 'all') {
        // Send to all parents
        setConversations(currentConversations => {
            const updatedConversations = [...currentConversations];
            parentUsers.forEach(parent => {
                let convo = updatedConversations.find(c => c.participantIds.includes(parent.id));
                if (convo) {
                    convo.messages.push(newMessage);
                } else {
                    // Create new conversation if none exists
                    updatedConversations.push({
                        id: Date.now() + parent.id,
                        participantIds: [parent.id, ADMIN_ID],
                        messages: [newMessage]
                    });
                }
            });
            return updatedConversations;
        });
    } else {
        // Send to a single user
        const recipientId = parseInt(composerRecipient, 10);
        let convoFound = false;

        const updatedConversations = conversations.map(c => {
            if (c.participantIds.includes(recipientId)) {
                convoFound = true;
                return { ...c, messages: [...c.messages, newMessage] };
            }
            return c;
        });

        if (!convoFound) {
            updatedConversations.push({
                id: Date.now(),
                participantIds: [recipientId, ADMIN_ID],
                messages: [newMessage]
            });
        }
        setConversations(updatedConversations);
    }
    
    // Reset and close modal
    setComposerContent('');
    setComposerSubject('');
    setComposerRecipient('all');
    setComposerOpen(false);
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const myConversations = conversations.filter(c => c.participantIds.includes(user.id));

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Nachrichten</h1>
        <Card className="flex flex-col md:flex-row h-[70vh]">
            {/* Left Column: Conversation List */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex-col ${selectedConversationId && 'hidden md:flex'}`}>
                {user.role === UserRole.ADMIN && (
                    <div className="p-4 border-b">
                        <Button onClick={() => setComposerOpen(true)} className="w-full">
                            + Neue Nachricht
                        </Button>
                    </div>
                )}
                <div className="overflow-y-auto">
                    {myConversations.map(convo => {
                        const otherParticipantId = convo.participantIds.find(id => id !== user.id);
                        const otherUser = otherParticipantId ? getUserById(otherParticipantId) : { name: 'Unbekannt' };
                        const lastMessage = convo.messages[convo.messages.length - 1];

                        return (
                            <div
                                key={convo.id}
                                className={`p-4 cursor-pointer hover:bg-gray-100 ${selectedConversationId === convo.id ? 'bg-cyan-50' : ''}`}
                                onClick={() => setSelectedConversationId(convo.id)}
                            >
                                <p className="font-semibold text-gray-800">{user.role === UserRole.ADMIN ? otherUser?.name : 'Kita Leitung'}</p>
                                <p className="text-sm text-gray-500 truncate">{lastMessage?.content || 'Keine Nachrichten'}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Column: Chat Window */}
            <div className={`w-full md:w-2/3 flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center">
                            <button onClick={() => setSelectedConversationId(null)} className="md:hidden mr-4 text-gray-600 hover:text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                             <h2 className="text-lg font-bold text-gray-800">
                                {user.role === UserRole.ADMIN 
                                    ? getUserById(selectedConversation.participantIds.find(id => id !== user.id)!)?.name
                                    : 'Kita Leitung'}
                             </h2>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {selectedConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`max-w-md p-3 rounded-lg ${msg.senderId === user.id ? 'bg-cyan-500 text-white' : 'bg-white shadow'}`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-cyan-100' : 'text-gray-400'} text-right`}>
                                            {new Date(msg.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white">
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Nachricht schreiben..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                />
                                <Button onClick={handleSendMessage} className="ml-3">Senden</Button>
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

         {/* Admin: New Message Modal */}
        <Modal isOpen={isComposerOpen} onClose={() => setComposerOpen(false)} title="Neue Nachricht erstellen">
            <div className="space-y-4">
                <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">Empfänger</label>
                    <select 
                        id="recipient" 
                        value={composerRecipient}
                        onChange={e => setComposerRecipient(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
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
                    ></textarea>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSendFromComposer}>Senden</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default Nachrichten;