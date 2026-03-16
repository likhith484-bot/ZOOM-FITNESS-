import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Shield, UserPlus, UserCheck, Search } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const allUsers = snap.docs.map(d => d.data() as UserProfile);
      setUsers(allUsers.filter(u => u.role === 'client'));
      setTrainers(allUsers.filter(u => u.role === 'trainer'));
    });
    return () => unsub();
  }, []);

  const assignTrainer = async (clientId: string, trainerId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), { trainerId });
    } catch (error) {
      console.error('Failed to assign trainer:', error);
    }
  };

  const toggleRole = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'client' ? 'trainer' : 'client';
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      console.error('Failed to toggle role:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="text-emerald-500 w-6 h-6" />
          Admin Center
        </h2>
        <p className="text-zinc-500 text-sm">Oversee Zoom Fitness operations.</p>
      </header>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Current Role</th>
                <th className="px-6 py-4 font-bold">Assigned Trainer</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold">{user.displayName}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs capitalize">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.trainerId || ''}
                      onChange={(e) => assignTrainer(user.uid, e.target.value)}
                      className="bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">No Trainer</option>
                      {trainers.map(t => (
                        <option key={t.uid} value={t.uid}>{t.displayName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleRole(user.uid, user.role)}
                      className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <UserPlus className="w-3 h-3" />
                      Make {user.role === 'client' ? 'Trainer' : 'Client'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
