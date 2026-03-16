import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { UserProfile, Message } from '../types';
import { Send, User, Search, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  profile: UserProfile | null;
}

export default function Messages({ profile }: Props) {
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;

    // Load contacts
    const loadContacts = async () => {
      if (profile.role === 'trainer') {
        const q = query(collection(db, 'users'), where('trainerId', '==', profile.uid));
        const snap = await getDocs(q);
        setContacts(snap.docs.map(d => d.data() as UserProfile));
      } else if (profile.trainerId) {
        const q = query(collection(db, 'users'), where('uid', '==', profile.trainerId));
        const snap = await getDocs(q);
        setContacts(snap.docs.map(d => d.data() as UserProfile));
      }
    };

    loadContacts();
  }, [profile]);

  useEffect(() => {
    if (!profile || !selectedContact) return;

    const chatId = [profile.uid, selectedContact.uid].sort().join('_');
    const q = query(collection(db, 'messages', chatId, 'chats'), orderBy('timestamp', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });

    return () => unsub();
  }, [profile, selectedContact]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedContact || !newMessage.trim()) return;

    const chatId = [profile.uid, selectedContact.uid].sort().join('_');
    try {
      await addDoc(collection(db, 'messages', chatId, 'chats'), {
        senderId: profile.uid,
        text: newMessage,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Contact List */}
      <div className="w-full lg:w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-bold text-lg mb-4">Messages</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              placeholder="Search contacts..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.map(contact => (
            <button
              key={contact.uid}
              onClick={() => setSelectedContact(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedContact?.uid === contact.uid 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold truncate">{contact.displayName}</p>
                <p className="text-xs opacity-60 truncate capitalize">{contact.role}</p>
              </div>
            </button>
          ))}
          {contacts.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm italic">
              No contacts found.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden lg:flex flex-1 flex-col bg-zinc-950/50">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <User className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold">{selectedContact.displayName}</p>
                <p className="text-xs text-zinc-500">Online</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === profile?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                      isMe 
                        ? 'bg-emerald-500 text-zinc-950 rounded-tr-none' 
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-zinc-900/60' : 'text-zinc-500'}`}>
                        {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800">
              <div className="flex gap-2">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
