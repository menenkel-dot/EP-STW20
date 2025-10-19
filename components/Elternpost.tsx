import React, { useState, useRef, useEffect } from 'react';
import type { Post, Group } from '../types';
import { UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { postsAPI, groupsAPI } from '../lib/client';


interface ElternpostProps {
  addNotification: (message: string) => void;
}

const Elternpost: React.FC<ElternpostProps> = ({ addNotification }) => {
  const { user, activeChild } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [postsData, groupsData] = await Promise.all([
          postsAPI.getAll(),
          groupsAPI.getAll()
        ]);
        const parsedPosts = postsData.map((post: any) => ({
          ...post,
          groupIds: typeof post.groupIds === 'string' ? JSON.parse(post.groupIds) : post.groupIds
        }));
        setPosts(parsedPosts);
        setGroups(groupsData);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenModal = (post: Post | null = null) => {
    if (post) {
      setEditingPost(post);
      setTitle(post.title);
      setContent(post.content);
      setImageUrl(post.imageUrl || '');
      setSelectedGroupIds(post.groupIds || []);
    } else {
      setEditingPost(null);
      setTitle('');
      setContent('');
      setImageUrl('');
      setSelectedGroupIds([]);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSavePost = async () => {
    if (!title || !content) {
      alert("Bitte Titel und Inhalt ausfüllen.");
      return;
    }

    setIsLoading(true);
    try {
      if (editingPost) {
        const updated = await postsAPI.update(editingPost.id, { 
          title, 
          content, 
          imageUrl, 
          groupIds: selectedGroupIds 
        });
        const parsedPost = {
          ...updated,
          groupIds: typeof updated.groupIds === 'string' ? JSON.parse(updated.groupIds) : updated.groupIds
        };
        setPosts(posts.map(p => p.id === editingPost.id ? parsedPost : p));
      } else {
        const newPost = await postsAPI.create({
          title,
          content,
          imageUrl,
          groupIds: selectedGroupIds,
          author: user?.name || 'Admin',
          date: new Date().toLocaleDateString('de-DE'),
        });
        const parsedPost = {
          ...newPost,
          groupIds: typeof newPost.groupIds === 'string' ? JSON.parse(newPost.groupIds) : newPost.groupIds
        };
        setPosts([parsedPost, ...posts]);
        addNotification(`Neue Elternpost: ${title}`);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Fehler beim Speichern der Elternpost:', error);
      alert('Fehler beim Speichern der Elternpost. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm("Sind Sie sicher, dass Sie diesen Beitrag löschen möchten?")) {
      setIsLoading(true);
      try {
        await postsAPI.delete(postId);
        setPosts(posts.filter(p => p.id !== postId));
      } catch (error) {
        console.error('Fehler beim Löschen der Elternpost:', error);
        alert('Fehler beim Löschen der Elternpost. Bitte versuchen Sie es erneut.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectAllGroups = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedGroupIds(groups.map(g => g.id));
    } else {
      setSelectedGroupIds([]);
    }
  };

  const handleGroupCheckboxChange = (groupId: number) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const visiblePosts = user?.role === UserRole.ADMIN 
    ? posts 
    : posts.filter(post => 
        !post.groupIds || post.groupIds.length === 0 || (activeChild && post.groupIds.includes(activeChild.groupId))
    );

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Elternpost</h1>
          {user?.role === UserRole.ADMIN && (
            <Button onClick={() => handleOpenModal()}>+ Neue Elternpost</Button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
          {visiblePosts.map((post) => (
            <Card key={post.id}>
              {post.imageUrl && <img className="w-full h-56 object-cover" src={post.imageUrl} alt={post.title} />}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <span>Veröffentlicht von {post.author} am {post.date}</span>
                  {post.groupIds && post.groupIds.length > 0 && (
                    <span className="flex items-center bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                      {post.groupIds.map(id => groups.find(g=>g.id === id)?.name).join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mt-4 whitespace-pre-wrap">{post.content}</p>
                {user?.role === UserRole.ADMIN && (
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                    <Button onClick={() => handleOpenModal(post)} variant="secondary">Bearbeiten</Button>
                    <Button onClick={() => handleDeletePost(post.id)} variant="danger">Löschen</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPost ? 'Elternpost bearbeiten' : 'Neue Elternpost erstellen'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titel</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Inhalt</label>
            <textarea id="content" rows={6} value={content} onChange={e => setContent(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Bild (Optional)</label>
            <div className="mt-2 flex items-center space-x-6">
                <div className="flex-shrink-0">
                    {imageUrl ? (
                        <img className="h-24 w-24 object-cover rounded-md" src={imageUrl} alt="Vorschau" />
                    ) : (
                        <div className="h-24 w-24 bg-gray-100 rounded-md flex items-center justify-center">
                            <svg className="h-12 w-12 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()} 
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                        {imageUrl ? 'Bild ändern' : 'Bild hochladen'}
                    </button>
                    {imageUrl && (
                         <button 
                            type="button"
                            onClick={() => setImageUrl('')} 
                            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md shadow-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Entfernen
                        </button>
                    )}
                </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sichtbar für Gruppen (leer lassen für alle)</label>
            <div className="mt-2 space-y-2 border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center">
                <input
                  id="all-groups"
                  type="checkbox"
                  checked={selectedGroupIds.length === groups.length}
                  onChange={handleSelectAllGroups}
                  className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="all-groups" className="ml-3 block text-sm font-medium text-gray-900">
                  Alle Gruppen
                </label>
              </div>
              <hr className="my-2" />
              {groups.map(group => (
                <div key={group.id} className="flex items-center">
                  <input
                    id={`group-${group.id}`}
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.id)}
                    onChange={() => handleGroupCheckboxChange(group.id)}
                    className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor={`group-${group.id}`} className="ml-3 block text-sm text-gray-700">
                    {group.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSavePost}>Speichern</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Elternpost;