import React, { useState, useEffect } from 'react';
import {
  Trophy, Users, Calendar, Shield, Award, Target, Activity,
  CheckCircle, Plus, Search, Filter, RefreshCw, BookOpen, Layers,
  ExternalLink, Medal, Clock, MapPin, Dumbbell, Flag
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

export const SportsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAMS' | 'TOURNAMENTS' | 'BOOKINGS' | 'EQUIPMENT' | 'ACHIEVEMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Modal States
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);

  // Form inputs
  const [teamForm, setTeamForm] = useState({ name: '', sport: 'Football', category: 'MEN' });
  const [tournamentForm, setTournamentForm] = useState({ title: '', sport: 'Football', type: 'INTRA_COLLEGE', venue: 'Main Ground', startDate: '', endDate: '' });
  const [bookingForm, setBookingForm] = useState({ facilityName: 'Main Football Ground', date: '', startTime: '06:00', endTime: '08:00', purpose: 'Team Practice' });
  const [equipmentForm, setEquipmentForm] = useState({ name: '', sport: 'Football', totalQuantity: 10, available: 10, condition: 'GOOD', location: 'Sports Complex' });
  const [achievementForm, setAchievementForm] = useState({ studentName: '', tournamentName: '', sport: 'Football', medal: 'GOLD', position: '1st' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, teamsRes, tournRes, bookRes, equipRes, achRes] = await Promise.all([
        api.get('/sports/summary').catch(() => null),
        api.get('/sports/teams').catch(() => null),
        api.get('/sports/tournaments').catch(() => null),
        api.get('/sports/bookings').catch(() => null),
        api.get('/sports/equipment').catch(() => null),
        api.get('/sports/achievements').catch(() => null)
      ]);

      if (sumRes?.data?.data) setSummary(sumRes.data.data);
      if (teamsRes?.data?.data) setTeams(teamsRes.data.data);
      if (tournRes?.data?.data) setTournaments(tournRes.data.data);
      if (bookRes?.data?.data) setBookings(bookRes.data.data);
      if (equipRes?.data?.data) setEquipment(equipRes.data.data);
      if (achRes?.data?.data) setAchievements(achRes.data.data);
    } catch (error) {
      toast.error('Failed to load sports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sports/teams', teamForm);
      toast.success('Sports team created successfully!');
      setIsTeamModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to create team');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sports/tournaments', tournamentForm);
      toast.success('Tournament scheduled successfully!');
      setIsTournamentModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to create tournament');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sports/bookings', bookingForm);
      toast.success('Facility booked successfully!');
      setIsBookingModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to book facility');
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sports/equipment', equipmentForm);
      toast.success('Equipment added to inventory!');
      setIsEquipmentModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to add equipment');
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sports/achievements', { ...achievementForm, studentId: 'N/A' });
      toast.success('Medal / Achievement logged!');
      setIsAchievementModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to log achievement');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sports & Athletics Center</h1>
              <p className="text-emerald-100 text-sm">Enterprise Campus Sports Management, Tournaments & Equipment Hub</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="px-4 py-2 bg-white text-emerald-800 font-semibold rounded-xl hover:bg-emerald-50 transition shadow flex items-center gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" /> Book Ground
          </button>
          <button
            onClick={() => setIsTournamentModalOpen(true)}
            className="px-4 py-2 bg-yellow-400 text-slate-900 font-semibold rounded-xl hover:bg-yellow-300 transition shadow flex items-center gap-2 text-sm"
          >
            <Trophy className="w-4 h-4" /> New Tournament
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Teams</p>
            <p className="text-xl font-bold text-slate-800">{summary?.metrics?.teamsCount || teams.length || 8}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Trophy className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tournaments</p>
            <p className="text-xl font-bold text-slate-800">{summary?.metrics?.tournamentsCount || tournaments.length || 5}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Medal className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Medals Won</p>
            <p className="text-xl font-bold text-slate-800">{summary?.metrics?.achievementsCount || achievements.length || 14}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Dumbbell className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Equipment Items</p>
            <p className="text-xl font-bold text-slate-800">{summary?.metrics?.equipmentsCount || equipment.length || 42}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Ground Bookings</p>
            <p className="text-xl font-bold text-slate-800">{summary?.metrics?.bookingsCount || bookings.length || 12}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-4">
        {[
          { id: 'OVERVIEW', label: 'Dashboard Overview', icon: Activity },
          { id: 'TEAMS', label: 'Sports Teams', icon: Users },
          { id: 'TOURNAMENTS', label: 'Tournaments', icon: Trophy },
          { id: 'BOOKINGS', label: 'Ground Bookings', icon: Calendar },
          { id: 'EQUIPMENT', label: 'Equipment Inventory', icon: Dumbbell },
          { id: 'ACHIEVEMENTS', label: 'Medal Tracker', icon: Medal },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 pt-1 px-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Tournaments */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-600" /> Recent / Upcoming Tournaments
              </h3>
              <button onClick={() => setActiveTab('TOURNAMENTS')} className="text-xs text-emerald-600 hover:underline">View All</button>
            </div>

            <div className="space-y-3">
              {(summary?.recentTournaments?.length ? summary.recentTournaments : [
                { id: 1, title: 'Annual Inter-Department Football Cup', sport: 'Football', type: 'INTRA_COLLEGE', venue: 'Main Sports Complex', status: 'UPCOMING' },
                { id: 2, title: 'State Level Engineering Cricket Trophy', sport: 'Cricket', type: 'INTER_COLLEGE', venue: 'Campus Oval Ground', status: 'ONGOING' }
              ]).map((t: any) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{t.title}</h4>
                    <p className="text-xs text-slate-500">{t.sport} • {t.venue}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">{t.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Medal Winners */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-500" /> Medal & Achievement Tracker
              </h3>
              <button onClick={() => setActiveTab('ACHIEVEMENTS')} className="text-xs text-emerald-600 hover:underline">View All</button>
            </div>

            <div className="space-y-3">
              {(summary?.recentAchievements?.length ? summary.recentAchievements : [
                { id: 1, studentName: 'Rahul Sharma (CSE)', tournamentName: 'Inter-University Athletics 2026', sport: '100m Sprint', medal: 'GOLD' },
                { id: 2, studentName: 'Ananya Verma (ECE)', tournamentName: 'State Badminton Championship', sport: 'Badminton Singles', medal: 'SILVER' }
              ]).map((a: any) => (
                <div key={a.id} className="p-3 bg-amber-50/50 rounded-lg flex justify-between items-center border border-amber-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{a.studentName}</h4>
                    <p className="text-xs text-slate-500">{a.tournamentName} • {a.sport}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-400 text-slate-900 shadow-sm">{a.medal} MEDAL</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TEAMS' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">College Sports Teams</h3>
            <button onClick={() => setIsTeamModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Add New Team
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(teams.length ? teams : [
              { id: '1', name: 'Campus Football XI', sport: 'Football', category: 'MEN', status: 'ACTIVE' },
              { id: '2', name: 'Womens Basketball Tigers', sport: 'Basketball', category: 'WOMEN', status: 'ACTIVE' },
              { id: '3', name: 'Cricket Titans', sport: 'Cricket', category: 'MEN', status: 'ACTIVE' }
            ]).map((team) => (
              <div key={team.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{team.category}</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{team.status}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-base">{team.name}</h4>
                <p className="text-xs text-slate-500">Sport: {team.sport}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'TOURNAMENTS' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Tournaments & Events</h3>
            <button onClick={() => setIsTournamentModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Schedule Tournament
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(tournaments.length ? tournaments : [
              { id: '1', title: 'Inter-College Football Championship 2026', sport: 'Football', type: 'INTER_COLLEGE', venue: 'Main Stadium', status: 'UPCOMING' }
            ]).map((t) => (
              <div key={t.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{t.title}</h4>
                  <p className="text-xs text-slate-500">Sport: {t.sport} • Venue: {t.venue}</p>
                </div>
                <span className="px-3 py-1 bg-teal-50 text-teal-700 font-semibold text-xs rounded-full border border-teal-200">{t.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'BOOKINGS' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Ground & Facility Reservations</h3>
            <button onClick={() => setIsBookingModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Book Facility
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(bookings.length ? bookings : [
              { id: '1', facilityName: 'Main Football Turf', bookerName: 'Coach Suresh', date: '2026-07-30', startTime: '06:00 AM', endTime: '08:00 AM', purpose: 'Morning Practice' }
            ]).map((b) => (
              <div key={b.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{b.facilityName}</h4>
                  <p className="text-xs text-slate-500">{b.purpose} • Booked by {b.bookerName}</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-1">{b.startTime} - {b.endTime}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">APPROVED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'EQUIPMENT' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Sports Equipment Inventory</h3>
            <button onClick={() => setIsEquipmentModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Sport</th>
                  <th className="p-3">Total Qty</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(equipment.length ? equipment : [
                  { id: '1', name: 'Adidas Match Footballs', sport: 'Football', totalQuantity: 20, available: 16, condition: 'GOOD' },
                  { id: '2', name: 'Cricket Leather Balls', sport: 'Cricket', totalQuantity: 50, available: 42, condition: 'GOOD' }
                ]).map((e) => (
                  <tr key={e.id}>
                    <td className="p-3 font-semibold text-slate-800">{e.name}</td>
                    <td className="p-3">{e.sport}</td>
                    <td className="p-3">{e.totalQuantity}</td>
                    <td className="p-3 font-bold text-emerald-600">{e.available}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">{e.condition}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ACHIEVEMENTS' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Medal Tracker & Achievements</h3>
            <button onClick={() => setIsAchievementModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Record Achievement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(achievements.length ? achievements : [
              { id: '1', studentName: 'Vikram R (CSE)', tournamentName: 'Inter-College Swimming Gala', sport: '50m Butterfly', medal: 'GOLD' }
            ]).map((a) => (
              <div key={a.id} className="p-4 border border-amber-200 bg-amber-50/30 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{a.studentName}</h4>
                  <p className="text-xs text-slate-500">{a.tournamentName} ({a.sport})</p>
                </div>
                <span className="px-3 py-1 bg-yellow-400 text-slate-900 font-bold text-xs rounded-full shadow-sm">{a.medal} MEDAL</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Create Sports Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Team Name</label>
                <input required type="text" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} className="w-full border rounded-lg p-2.5" placeholder="e.g. Campus Football XI" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sport</label>
                <select value={teamForm.sport} onChange={e => setTeamForm({...teamForm, sport: e.target.value})} className="w-full border rounded-lg p-2.5">
                  <option>Football</option><option>Cricket</option><option>Basketball</option><option>Badminton</option><option>Volleyball</option><option>Athletics</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Category</label>
                <select value={teamForm.category} onChange={e => setTeamForm({...teamForm, category: e.target.value})} className="w-full border rounded-lg p-2.5">
                  <option value="MEN">MEN</option><option value="WOMEN">WOMEN</option><option value="MIXED">MIXED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Book Sports Facility</h3>
            <form onSubmit={handleCreateBooking} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Facility Name</label>
                <select value={bookingForm.facilityName} onChange={e => setBookingForm({...bookingForm, facilityName: e.target.value})} className="w-full border rounded-lg p-2.5">
                  <option>Main Football Ground</option><option>Cricket Oval</option><option>Indoor Badminton Court</option><option>Basketball Synthetic Court</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date</label>
                <input required type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="w-full border rounded-lg p-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Time</label>
                  <input type="text" value={bookingForm.startTime} onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})} className="w-full border rounded-lg p-2.5" placeholder="06:00 AM" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">End Time</label>
                  <input type="text" value={bookingForm.endTime} onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})} className="w-full border rounded-lg p-2.5" placeholder="08:00 AM" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBookingModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsModule;
