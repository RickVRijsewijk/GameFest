'use client';

import Link from 'next/link';
import { 
  Gamepad2, 
  LogOut, 
  Users, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Search, 
  Filter,
  UserSearch,
  BarChart3,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, logout, handleFirestoreError, OperationType } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  email: string;
  phone: string;
  status: 'paid' | 'unpaid';
  createdAt: any;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  price: number;
  createdAt: any;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'registrations' | 'events'>('registrations');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: 15
  });
  const router = useRouter();
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/admin/login');
      } else {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Registration[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Registration);
      });
      setRegistrations(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'registrations');
      setLoading(false);
    });

    const qEvents = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const data: Event[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(data);
      setLoadingEvents(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
      setLoadingEvents(false);
    });

    return () => {
      unsubscribe();
      unsubscribeEvents();
    };
  }, [isAuthReady]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'registrations', id), {
        status: currentStatus === 'paid' ? 'unpaid' : 'paid'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${id}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRegistrationToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!registrationToDelete) return;
    try {
      await deleteDoc(doc(db, 'registrations', registrationToDelete));
      setDeleteModalOpen(false);
      setRegistrationToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrations/${registrationToDelete}`);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setRegistrationToDelete(null);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEvent(true);
    try {
      const eventDateTime = new Date(`${eventFormData.date}T${eventFormData.time}`);
      await addDoc(collection(db, 'events'), {
        title: eventFormData.title,
        description: eventFormData.description,
        date: eventDateTime,
        location: eventFormData.location,
        price: Number(eventFormData.price),
        createdAt: serverTimestamp(),
      });
      setEventModalOpen(false);
      setEventFormData({ title: '', description: '', date: '', time: '', location: '', price: 15 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm('Weet je zeker dat je dit event wilt verwijderen? Alle bijbehorende aanmeldingen blijven bestaan, maar het event is niet meer zichtbaar.')) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
      }
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesFilter = filter === 'all' || reg.status === filter;
    const matchesSearch = reg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          reg.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE));
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalRegistrations = registrations.length;
  const paidRegistrations = registrations.filter(r => r.status === 'paid').length;
  const unpaidRegistrations = totalRegistrations - paidRegistrations;
  
  // Calculate total revenue based on the event price for each paid registration
  const totalRevenue = registrations
    .filter(r => r.status === 'paid')
    .reduce((total, reg) => {
      const event = events.find(e => e.id === reg.eventId);
      return total + (event ? event.price : 0);
    }, 0);
    
  const paymentPercentage = totalRegistrations > 0 ? Math.round((paidRegistrations / totalRegistrations) * 100) : 0;

  if (!isAuthReady) {
    return <div className="min-h-screen bg-[#0a0514] flex items-center justify-center text-white">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0514] text-white p-6">
      {/* Top Bar */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg tracking-tight text-white leading-none">ADMIN DASHBOARD</h1>
            <p className="text-[10px] text-purple-200/60 uppercase tracking-widest mt-1">GAMEFEST</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 text-xs font-medium text-purple-200 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          Uitloggen
        </button>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Totaal Aanmeldingen */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="font-heading font-bold text-4xl text-white mb-1">{totalRegistrations}</div>
            <div className="text-xs text-purple-200/60 font-medium">Totaal Aanmeldingen</div>
          </div>

          {/* Betaald */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="font-heading font-bold text-4xl text-white mb-1">{paidRegistrations}</div>
            <div className="text-xs text-emerald-200/60 font-medium">Betaald</div>
          </div>

          {/* Onbetaald */}
          <div className="bg-gradient-to-br from-rose-900/40 to-rose-900/10 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="font-heading font-bold text-4xl text-white mb-1">{unpaidRegistrations}</div>
            <div className="text-xs text-rose-200/60 font-medium">Onbetaald</div>
          </div>

          {/* Omzet */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div className="font-heading font-bold text-4xl text-white mb-1">€{totalRevenue}</div>
            <div className="text-xs text-blue-200/60 font-medium">Omzet</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-purple-500/20 pb-px">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'registrations' ? 'text-white' : 'text-purple-200/60 hover:text-purple-200'
            }`}
          >
            Aanmeldingen
            {activeTab === 'registrations' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'events' ? 'text-white' : 'text-purple-200/60 hover:text-purple-200'
            }`}
          >
            Events
            {activeTab === 'events' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === 'registrations' ? (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/40" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op naam of email..." 
                  className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-purple-200/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <button 
                  onClick={() => setFilter('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-purple-600 text-white' : 'border border-purple-500/20 text-purple-200/60 hover:bg-purple-500/10 hover:text-purple-200'}`}
                >
                  <Filter className="w-3 h-3" />
                  Alles
                </button>
                <button 
                  onClick={() => setFilter('paid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filter === 'paid' ? 'bg-emerald-600 text-white' : 'border border-purple-500/20 text-purple-200/60 hover:bg-purple-500/10 hover:text-purple-200'}`}
                >
                  <Filter className="w-3 h-3" />
                  Betaald
                </button>
                <button 
                  onClick={() => setFilter('unpaid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filter === 'unpaid' ? 'bg-rose-600 text-white' : 'border border-purple-500/20 text-purple-200/60 hover:bg-purple-500/10 hover:text-purple-200'}`}
                >
                  <Filter className="w-3 h-3" />
                  Onbetaald
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-bold text-lg text-white">Aanmeldingen</h2>
                  <p className="text-xs text-purple-200/40 mt-1">{filteredRegistrations.length} resultaten</p>
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                    <UserSearch className="w-8 h-8 text-purple-400/50" />
                  </div>
                  <p className="text-sm text-purple-200/40 font-medium">Geen aanmeldingen gevonden</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-purple-500/20 text-xs font-medium text-purple-200/60 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Naam</th>
                        <th className="pb-3">Event</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Telefoon</th>
                        <th className="pb-3">Datum</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-purple-500/10">
                      {paginatedRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-purple-500/5 transition-colors">
                          <td className="py-4 pl-2 font-medium text-white">{reg.name}</td>
                          <td className="py-4 text-purple-300 font-medium">{reg.eventName || 'Onbekend'}</td>
                          <td className="py-4 text-purple-200/80">{reg.email}</td>
                          <td className="py-4 text-purple-200/80">{reg.phone}</td>
                          <td className="py-4 text-purple-200/80">
                            {reg.createdAt?.toDate ? new Date(reg.createdAt.toDate()).toLocaleDateString('nl-NL') : 'Nieuw'}
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={() => toggleStatus(reg.id, reg.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-colors ${
                                reg.status === 'paid' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              {reg.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {reg.status === 'paid' ? 'Betaald' : 'Onbetaald'}
                            </button>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <button 
                              onClick={() => handleDeleteClick(reg.id)}
                              className="text-purple-200/40 hover:text-rose-400 transition-colors"
                            >
                              Verwijderen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {!loading && filteredRegistrations.length > 0 && (
                <div className="mt-6 flex items-center justify-between border-t border-purple-500/20 pt-4">
                  <div className="text-xs text-purple-200/60">
                    Weergeven van {((currentPage - 1) * ITEMS_PER_PAGE) + 1} tot {Math.min(currentPage * ITEMS_PER_PAGE, filteredRegistrations.length)} van {filteredRegistrations.length} resultaten
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-purple-500/20 text-purple-200/60 hover:bg-purple-500/10 hover:text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-medium text-purple-200">
                      Pagina {currentPage} van {totalPages}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-purple-500/20 text-purple-200/60 hover:bg-purple-500/10 hover:text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading font-bold text-lg text-white">Events Beheren</h2>
                <p className="text-xs text-purple-200/40 mt-1">{events.length} events gepland</p>
              </div>
              <button
                onClick={() => setEventModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nieuw Event
              </button>
            </div>

            {loadingEvents ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                  <Calendar className="w-8 h-8 text-purple-400/50" />
                </div>
                <p className="text-sm text-purple-200/40 font-medium">Geen events gevonden</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                  <div key={event.id} className="bg-[#0a0514]/50 border border-purple-500/20 rounded-xl p-5 relative group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white text-lg">{event.title}</h3>
                      <div className="bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-500/30">
                        €{event.price}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-purple-200/70">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        {event.date?.toDate ? new Date(event.date.toDate()).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }) : 'Onbekend'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-purple-200/70">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        {event.location}
                      </div>
                    </div>
                    <p className="text-xs text-purple-200/50 line-clamp-2 mb-4">{event.description}</p>
                    
                    <div className="pt-4 border-t border-purple-500/10 flex justify-between items-center">
                      <div className="text-xs text-purple-200/40">
                        {registrations.filter(r => r.eventId === event.id).length} aanmeldingen
                      </div>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="text-xs text-rose-400/70 hover:text-rose-400 transition-colors"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-xl text-white">{paymentPercentage}%</div>
              <div className="text-[10px] text-purple-200/50 uppercase tracking-wider">Betaalpercentage</div>
            </div>
          </div>
          
          <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-xl text-white">
                {registrations.length > 0 && registrations[0].createdAt?.toDate 
                  ? new Date(registrations[0].createdAt.toDate()).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) 
                  : 'N/A'}
              </div>
              <div className="text-[10px] text-purple-200/50 uppercase tracking-wider">Laatste aanmelding</div>
            </div>
          </div>

          <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-xl text-white">
                €{totalRevenue > 0 ? (totalRevenue / paidRegistrations).toFixed(2) : '0.00'}
              </div>
              <div className="text-[10px] text-emerald-200/50 uppercase tracking-wider">Gem. per aanmelding</div>
            </div>
          </div>
        </div>

      </main>

      {/* Create Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#110a24] border border-purple-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl my-8">
            <h3 className="text-xl font-heading font-bold text-white mb-6">Nieuw Event Aanmaken</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-purple-200/80 ml-1">Titel</label>
                <input 
                  type="text" 
                  required
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})}
                  className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="Bijv. Summer LAN Party 2026"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-purple-200/80 ml-1">Beschrijving</label>
                <textarea 
                  required
                  rows={3}
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
                  className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                  placeholder="Wat gaan we doen?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-purple-200/80 ml-1">Datum</label>
                  <input 
                    type="date" 
                    required
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
                    className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-purple-200/80 ml-1">Tijd</label>
                  <input 
                    type="time" 
                    required
                    value={eventFormData.time}
                    onChange={(e) => setEventFormData({...eventFormData, time: e.target.value})}
                    className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-purple-200/80 ml-1">Locatie</label>
                <input 
                  type="text" 
                  required
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                  className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="Bijv. Buurthuis De Schakel"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-purple-200/80 ml-1">Prijs (€)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  required
                  value={eventFormData.price}
                  onChange={(e) => setEventFormData({...eventFormData, price: Number(e.target.value)})}
                  className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-purple-500/20 mt-6">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-purple-200 hover:bg-purple-500/10 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-6 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmittingEvent ? 'Bezig...' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#110a24] border border-purple-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Aanmelding verwijderen</h3>
            <p className="text-sm text-purple-200/60 mb-6">
              Weet je zeker dat je deze aanmelding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium text-purple-200 hover:bg-purple-500/10 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
