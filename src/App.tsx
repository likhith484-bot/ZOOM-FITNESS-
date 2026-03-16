/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';
import { Gem, LogOut, User, Dumbbell, Utensils, TrendingUp, MessageSquare, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClientDashboard from './components/ClientDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import Messages from './components/Messages';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showGenderSelection, setShowGenderSelection] = useState(false);

  useEffect(() => {
    // Handle redirect result for mobile/android
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          // Check if user should be admin
          if (user.email === "likhithmuniraju484@gmail.com" && data.role !== 'admin') {
            const updatedProfile = { ...data, role: 'admin' as const };
            await updateDoc(docRef, { role: 'admin' });
            setProfile(updatedProfile);
          } else {
            setProfile(data);
            if (!data.gender && data.role === 'client') {
              setShowGenderSelection(true);
            }
          }
        } else {
          // New user setup
          const role: UserRole = user.email === "likhithmuniraju484@gmail.com" ? 'admin' : 'client';
          const newProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            role,
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
          if (role === 'client') {
            setShowGenderSelection(true);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGenderSelect = async (gender: 'male' | 'female' | 'other') => {
    if (!profile) return;
    const docRef = doc(db, 'users', profile.uid);
    await updateDoc(docRef, { gender });
    setProfile({ ...profile, gender });
    setShowGenderSelection(false);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    // Use redirect for mobile/android, popup for desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8 relative z-10"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/10 transition-transform duration-500">
              <Gem className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Zoom <span className="text-emerald-500">Fitness</span>
            </h1>
            <p className="text-zinc-400 text-base">Elite Performance & Personal Training.</p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">
              <span>Precision</span>
              <span>•</span>
              <span>Power</span>
              <span>•</span>
              <span>Results</span>
            </div>
          </div>
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-base rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 uppercase tracking-wide"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Sign In with Google
            </button>
            <p className="text-zinc-600 text-xs">Join the next generation of athletes.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showGenderSelection) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8 shadow-2xl"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Welcome to Zoom Fitness</h2>
            <p className="text-zinc-400 text-sm">Personalize your training experience.</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] text-center">Select Gender</p>
            <div className="grid grid-cols-1 gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderSelect(g)}
                  className="w-full py-3.5 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold rounded-xl transition-all flex items-center justify-between px-6 group"
                >
                  <span className="capitalize text-base">{g}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <nav className="w-full lg:w-64 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-900 p-4 flex flex-col">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 mb-8 px-2 hover:opacity-80 transition-opacity text-left"
        >
          <Gem className="w-6 h-6 text-emerald-500" />
          <span className="text-lg font-bold tracking-tight">Zoom <span className="text-emerald-500">Fitness</span></span>
        </button>

        <div className="flex-1 space-y-1">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === 'workouts'} 
            onClick={() => setActiveTab('workouts')}
            icon={<Dumbbell className="w-5 h-5" />}
            label="Workouts"
          />
          <NavButton 
            active={activeTab === 'diet'} 
            onClick={() => setActiveTab('diet')}
            icon={<Utensils className="w-5 h-5" />}
            label="Diet Plan"
          />
          <NavButton 
            active={activeTab === 'messages'} 
            onClick={() => setActiveTab('messages')}
            icon={<MessageSquare className="w-5 h-5" />}
            label="Messages"
          />
          {profile?.role === 'admin' && (
            <NavButton 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')}
              icon={<Shield className="w-5 h-5" />}
              label="Admin"
            />
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-zinc-200">{profile?.displayName}</p>
              <p className="text-[10px] text-zinc-500 truncate capitalize font-medium">{profile?.role} • {profile?.gender}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'messages' ? (
              <Messages profile={profile} />
            ) : activeTab === 'admin' && profile?.role === 'admin' ? (
              <AdminDashboard />
            ) : profile?.role === 'trainer' ? (
              <TrainerDashboard activeTab={activeTab} profile={profile} />
            ) : (
              <ClientDashboard activeTab={activeTab} profile={profile} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-zinc-900 text-emerald-500 border border-zinc-800' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
      }`}
    >
      {icon}
      <span className="font-bold uppercase tracking-wide text-[11px]">{label}</span>
    </button>
  );
}
