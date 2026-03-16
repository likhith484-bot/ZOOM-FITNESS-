import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { UserProfile, ProgressLog, WorkoutPlan, DietPlan } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plus, CheckCircle2, Circle, Scale, Flame, Target, Calculator, Dumbbell, Utensils } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  activeTab: string;
  profile: UserProfile | null;
}

export default function ClientDashboard({ activeTab, profile }: Props) {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    if (profile && (!profile.height || !profile.weight)) {
      setShowProfileSetup(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    const logsQuery = query(collection(db, 'users', profile.uid, 'progressLogs'), orderBy('date', 'desc'));
    const workoutsQuery = query(collection(db, 'users', profile.uid, 'workoutPlans'), orderBy('assignedAt', 'desc'));
    const dietsQuery = query(collection(db, 'users', profile.uid, 'dietPlans'), orderBy('assignedAt', 'desc'));

    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressLog)));
    });
    const unsubWorkouts = onSnapshot(workoutsQuery, (snap) => {
      setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutPlan)));
    });
    const unsubDiets = onSnapshot(dietsQuery, (snap) => {
      setDiets(snap.docs.map(d => ({ id: d.id, ...d.data() } as DietPlan)));
    });

    return () => {
      unsubLogs();
      unsubWorkouts();
      unsubDiets();
    };
  }, [profile]);

  const calculateBMI = () => {
    if (!profile?.height || !profile?.weight) return 0;
    const heightInMeters = profile.height / 100;
    return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getFitnessScore = () => {
    if (logs.length === 0) return 0;
    const completedWorkouts = logs.filter(l => l.workoutCompleted).length;
    return Math.min(100, Math.round((completedWorkouts / logs.length) * 100));
  };

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, <span className="text-emerald-500">{profile?.displayName}</span></h2>
            <p className="text-zinc-500 text-sm">Your performance metrics for today.</p>
          </div>
          <button 
            onClick={() => setShowLogModal(true)}
            className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            Log Progress
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Scale className="text-blue-400" />}
            label="Current Weight"
            value={`${profile?.weight || '--'} kg`}
            subValue={`Target: ${profile?.targetWeight || '--'} kg`}
          />
          <StatCard 
            icon={<Flame className="text-orange-400" />}
            label="Daily Calories"
            value={`${logs[0]?.caloriesConsumed || 0}`}
            subValue={`Goal: ${profile?.dailyCalorieGoal || '--'}`}
          />
          <StatCard 
            icon={<Calculator className="text-purple-400" />}
            label="BMI"
            value={calculateBMI()}
            subValue="Normal: 18.5 - 24.9"
          />
          <StatCard 
            icon={<Target className="text-emerald-500" />}
            label="Fitness Score"
            value={`${getFitnessScore()}%`}
            subValue="Based on consistency"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-6">Weight Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...logs].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-6">Calorie Intake</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...logs].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Bar dataKey="caloriesConsumed" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {showLogModal && (
          <LogModal 
            onClose={() => setShowLogModal(false)} 
            uid={profile?.uid || ''} 
            currentWeight={profile?.weight || 0}
          />
        )}

        {showProfileSetup && (
          <ProfileSetupModal 
            onClose={() => setShowProfileSetup(false)} 
            profile={profile!} 
          />
        )}
      </div>
    );
  }

  if (activeTab === 'workouts') {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Your Workout Plans</h2>
        {workouts.length === 0 ? (
          <div className="bg-zinc-900 p-12 rounded-2xl border border-zinc-800 text-center">
            <Dumbbell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No workout plans assigned yet. Contact your trainer!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workouts.map(plan => (
              <div key={plan.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">{plan.title}</h3>
                <div className="space-y-4">
                  {plan.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div>
                        <p className="font-medium">{ex.name}</p>
                        <p className="text-sm text-zinc-500">{ex.notes}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-500 font-bold text-sm">{ex.sets} x {ex.reps}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'diet') {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Your Diet Plans</h2>
        {diets.length === 0 ? (
          <div className="bg-zinc-900 p-12 rounded-2xl border border-zinc-800 text-center">
            <Utensils className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No diet plans assigned yet. Contact your trainer!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {diets.map(plan => (
              <div key={plan.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{plan.title}</h3>
                  <span className="text-orange-500 font-bold">{plan.totalCalories} kcal</span>
                </div>
                <div className="space-y-4">
                  {plan.meals.map((meal, i) => (
                    <div key={i} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="flex justify-between mb-1">
                        <p className="font-medium">{meal.name}</p>
                        <p className="text-zinc-400 text-sm">{meal.calories} kcal</p>
                      </div>
                      <p className="text-sm text-zinc-500">{meal.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue: string }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
          {icon}
        </div>
        <span className="text-sm text-zinc-400 font-medium">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-zinc-500">{subValue}</p>
      </div>
    </div>
  );
}

function LogModal({ onClose, uid, currentWeight }: { onClose: () => void, uid: string, currentWeight: number }) {
  const [weight, setWeight] = useState(currentWeight);
  const [calories, setCalories] = useState(2000);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users', uid, 'progressLogs'), {
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: Number(weight),
        caloriesConsumed: Number(calories),
        workoutCompleted: completed,
        timestamp: new Date().toISOString()
      });
      // Update current weight in profile too
      await updateDoc(doc(db, 'users', uid), { weight: Number(weight) });
      onClose();
    } catch (error) {
      console.error('Failed to log progress:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 w-full max-md rounded-2xl border border-zinc-800 p-6 space-y-6">
        <h3 className="text-xl font-bold">Log Daily Progress</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Weight (kg)</label>
            <input 
              type="number" 
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Calories Consumed</label>
            <input 
              type="number" 
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-xl border border-zinc-900 cursor-pointer" onClick={() => setCompleted(!completed)}>
            {completed ? <CheckCircle2 className="text-emerald-500 w-5 h-5" /> : <Circle className="text-zinc-800 w-5 h-5" />}
            <span className="text-sm font-medium text-zinc-300">Workout Completed Today?</span>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-bold text-sm transition-colors text-zinc-400"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold text-sm transition-colors"
            >
              Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileSetupModal({ onClose, profile }: { onClose: () => void, profile: UserProfile }) {
  const [formData, setFormData] = useState({
    age: profile.age || 25,
    height: profile.height || 170,
    weight: profile.weight || 70,
    targetWeight: profile.targetWeight || 65,
    dailyCalorieGoal: profile.dailyCalorieGoal || 2000,
    fitnessGoal: profile.fitnessGoal || 'weight_loss'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', profile.uid), formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-800 p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Complete Your Profile</h3>
          <p className="text-sm text-zinc-500">We need a few details to personalize your experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Age</label>
              <input 
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Height (cm)</label>
              <input 
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Current Weight (kg)</label>
              <input 
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Target Weight (kg)</label>
              <input 
                type="number"
                value={formData.targetWeight}
                onChange={(e) => setFormData({...formData, targetWeight: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-bold">Daily Calorie Goal</label>
            <input 
              type="number"
              value={formData.dailyCalorieGoal}
              onChange={(e) => setFormData({...formData, dailyCalorieGoal: Number(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-bold">Fitness Goal</label>
            <select 
              value={formData.fitnessGoal}
              onChange={(e) => setFormData({...formData, fitnessGoal: e.target.value as any})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2"
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button 
            type="submit"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold uppercase tracking-wide transition-all mt-4 shadow-lg shadow-emerald-500/10"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
