import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDocs, limit, orderBy } from 'firebase/firestore';
import { UserProfile, WorkoutPlan, DietPlan, ProgressLog } from '../types';
import { Users, Plus, ChevronRight, Dumbbell, Utensils, TrendingUp, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  activeTab: string;
  profile: UserProfile | null;
}

export default function TrainerDashboard({ activeTab, profile }: Props) {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<'workout' | 'diet' | null>(null);
  const [latestWorkout, setLatestWorkout] = useState<WorkoutPlan | null>(null);
  const [latestDiet, setLatestDiet] = useState<DietPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'users'), where('trainerId', '==', profile.uid));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
    });
    return () => unsub();
  }, [profile]);

  useEffect(() => {
    if (!selectedClient) {
      setLatestWorkout(null);
      setLatestDiet(null);
      return;
    }

    const workoutQ = query(
      collection(db, 'users', selectedClient.uid, 'workoutPlans'),
      orderBy('assignedAt', 'desc'),
      limit(1)
    );
    const dietQ = query(
      collection(db, 'users', selectedClient.uid, 'dietPlans'),
      orderBy('assignedAt', 'desc'),
      limit(1)
    );

    const unsubWorkout = onSnapshot(workoutQ, (snap) => {
      if (!snap.empty) {
        setLatestWorkout({ id: snap.docs[0].id, ...snap.docs[0].data() } as WorkoutPlan);
      } else {
        setLatestWorkout(null);
      }
    });

    const unsubDiet = onSnapshot(dietQ, (snap) => {
      if (!snap.empty) {
        setLatestDiet({ id: snap.docs[0].id, ...snap.docs[0].data() } as DietPlan);
      } else {
        setLatestDiet(null);
      }
    });

    return () => {
      unsubWorkout();
      unsubDiet();
    };
  }, [selectedClient]);

  const filteredClients = clients.filter(client => 
    client.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-bold tracking-tight">Trainer Dashboard</h2>
          <p className="text-zinc-500 text-sm">Manage your athletes and their fitness journeys.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-zinc-400">
                <Users className="w-4 h-4 text-emerald-500" />
                Athletes ({clients.length})
              </h3>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              {filteredClients.map(client => (
                <button
                  key={client.uid}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedClient?.uid === client.uid 
                      ? 'bg-zinc-900 border-emerald-500/30' 
                      : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">{client.displayName}</p>
                    <p className="text-xs text-zinc-500">{client.email}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedClient?.uid === client.uid ? 'rotate-90' : ''}`} />
                </button>
              ))}
              {clients.length === 0 && (
                <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                  <p className="text-zinc-500 text-sm">No clients assigned yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedClient.displayName}</h3>
                      <p className="text-zinc-400">{selectedClient.fitnessGoal?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowPlanModal('workout')}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-emerald-500 transition-colors"
                        title="Assign Workout"
                      >
                        <Dumbbell className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setShowPlanModal('diet')}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-orange-500 transition-colors"
                        title="Assign Diet"
                      >
                        <Utensils className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Weight</p>
                    <p className="text-lg font-bold">{selectedClient.weight} kg</p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Target</p>
                    <p className="text-lg font-bold">{selectedClient.targetWeight} kg</p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Height</p>
                    <p className="text-lg font-bold">{selectedClient.height} cm</p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Daily Goal</p>
                    <p className="text-lg font-bold">{selectedClient.dailyCalorieGoal} kcal</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-[10px] text-zinc-500">
                      <Dumbbell className="w-3 h-3 text-emerald-500" />
                      Workout Plan
                    </h4>
                    {latestWorkout ? (
                      <div className="bg-zinc-950 rounded-xl border border-zinc-900 p-4 space-y-3">
                        <p className="font-bold text-emerald-500 text-sm">{latestWorkout.title}</p>
                        <div className="space-y-2">
                          {latestWorkout.exercises.map((ex, i) => (
                            <div key={i} className="text-sm border-b border-zinc-900 pb-2 last:border-0">
                              <div className="flex justify-between">
                                <span className="font-medium">{ex.name}</span>
                                <span className="text-zinc-500">{ex.sets} x {ex.reps}</span>
                              </div>
                              {ex.notes && <p className="text-xs text-zinc-600 mt-1 italic">{ex.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800 text-center">
                        <p className="text-xs text-zinc-500">No workout plan assigned.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      Current Diet Plan
                    </h4>
                    {latestDiet ? (
                      <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-orange-500">{latestDiet.title}</p>
                          <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">{latestDiet.totalCalories} kcal</span>
                        </div>
                        <div className="space-y-2">
                          {latestDiet.meals.map((meal, i) => (
                            <div key={i} className="text-sm border-b border-zinc-900 pb-2 last:border-0">
                              <div className="flex justify-between">
                                <span className="font-medium">{meal.name}</span>
                                <span className="text-zinc-500">{meal.calories} kcal</span>
                              </div>
                              {meal.description && <p className="text-xs text-zinc-600 mt-1 italic">{meal.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800 text-center">
                        <p className="text-xs text-zinc-500">No diet plan assigned.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-[10px] text-zinc-500">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    Recent Activity
                  </h4>
                  <RecentActivity clientId={selectedClient.uid} />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 p-12">
                <Search className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-500">Select a client to view details and manage plans.</p>
              </div>
            )}
          </div>
        </div>

        {showPlanModal && selectedClient && (
          <PlanModal 
            type={showPlanModal} 
            client={selectedClient} 
            onClose={() => setShowPlanModal(null)} 
          />
        )}
      </div>
    );
  }

  return null;
}

function RecentActivity({ clientId }: { clientId: string }) {
  const [logs, setLogs] = useState<ProgressLog[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users', clientId, 'progressLogs'), orderBy('date', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressLog)));
    });
    return () => unsub();
  }, [clientId]);

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
          <div>
            <p className="text-sm font-medium">{format(new Date(log.date), 'MMM dd, yyyy')}</p>
            <p className="text-xs text-zinc-500">{log.workoutCompleted ? 'Workout Completed' : 'No Workout'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{log.weight} kg</p>
            <p className="text-xs text-orange-500">{log.caloriesConsumed} kcal</p>
          </div>
        </div>
      ))}
      {logs.length === 0 && <p className="text-zinc-600 text-sm italic">No recent activity logged.</p>}
    </div>
  );
}

function PlanModal({ type, client, onClose }: { type: 'workout' | 'diet', client: UserProfile, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const addItem = () => {
    if (type === 'workout') {
      setItems([...items, { name: '', sets: 3, reps: '12', notes: '' }]);
    } else {
      setItems([...items, { name: '', calories: 500, description: '' }]);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectionName = type === 'workout' ? 'workoutPlans' : 'dietPlans';
    const data = type === 'workout' 
      ? { title, exercises: items, assignedAt: new Date().toISOString() }
      : { title, meals: items, totalCalories: items.reduce((acc, curr) => acc + Number(curr.calories), 0), assignedAt: new Date().toISOString() };

    try {
      await addDoc(collection(db, 'users', client.uid, collectionName), data);
      onClose();
    } catch (error) {
      console.error('Failed to assign plan:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-800 p-6 flex flex-col max-h-[90vh]">
        <h3 className="text-xl font-bold mb-6">Assign {type === 'workout' ? 'Workout' : 'Diet'} Plan to {client.displayName}</h3>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-2">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Plan Title</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monday Push Day"
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold">{type === 'workout' ? 'Exercises' : 'Meals'}</h4>
              <button 
                type="button"
                onClick={addItem}
                className="text-emerald-500 text-xs font-bold flex items-center gap-1 hover:text-emerald-400"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            {items.map((item, i) => (
              <div key={i} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500">Name</label>
                    <input 
                      value={item.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  {type === 'workout' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500">Sets</label>
                        <input 
                          type="number"
                          value={item.sets}
                          onChange={(e) => updateItem(i, 'sets', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500">Reps</label>
                        <input 
                          value={item.reps}
                          onChange={(e) => updateItem(i, 'reps', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500">Calories</label>
                      <input 
                        type="number"
                        value={item.calories}
                        onChange={(e) => updateItem(i, 'calories', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">{type === 'workout' ? 'Notes' : 'Description'}</label>
                  <input 
                    value={type === 'workout' ? item.notes : item.description}
                    onChange={(e) => updateItem(i, type === 'workout' ? 'notes' : 'description', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="flex gap-3 pt-6 border-t border-zinc-800 mt-6">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold text-sm transition-colors"
          >
            Assign Plan
          </button>
        </div>
      </div>
    </div>
  );
}
