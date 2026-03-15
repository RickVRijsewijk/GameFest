'use client';

import Link from 'next/link';
import { Gamepad2, Calendar, MapPin, ArrowLeft, Users, Trophy, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { useParams } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  price: number;
}

export default function EventDetail() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ naam: '', email: '', telefoon: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() } as Event);
        } else {
          setError('Event niet gevonden.');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `events/${eventId}`);
        setError('Kon event niet laden.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await addDoc(collection(db, 'registrations'), {
        eventId: event.id,
        eventName: event.title,
        name: formData.naam,
        email: formData.email,
        phone: formData.telefoon,
        status: 'unpaid',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setFormData({ naam: '', email: '', telefoon: '' });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'registrations');
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0514] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Event niet gevonden</h1>
        <Link href="/" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Terug naar home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0514]">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl tracking-tight text-white leading-none">GAMEFEST</h1>
            <p className="text-[10px] text-purple-200/60 uppercase tracking-widest mt-1">Terug naar overzicht</p>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-12 pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column - Event Details */}
          <div className="space-y-10">
            <Link href="/" className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Alle events
            </Link>
            
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium tracking-wide">
                EVENT DETAILS
              </div>
              <h2 className="font-heading text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-white">
                {event.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-200">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span>{event.date?.toDate ? new Date(event.date.toDate()).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Datum onbekend'}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-200">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-200 font-bold">
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                    €{event.price}
                  </span>
                </div>
              </div>
              
              <div className="prose prose-invert prose-purple max-w-none">
                <p className="text-lg text-purple-100/80 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="relative">
            {/* Form Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent rounded-[2rem] blur-xl" />
            
            <div className="relative bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-[2rem] p-8 md:p-10 shadow-2xl">
              <div className="space-y-2 mb-8">
                <h3 className="font-heading text-3xl font-bold text-white">Aanmelden</h3>
                <p className="text-sm text-purple-200/60">Meld je aan voor {event.title}</p>
              </div>

              {success ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Aanmelding geslaagd!</h4>
                  <p className="text-sm text-purple-200/60">We hebben je aanmelding voor {event.title} ontvangen. Tot snel!</p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-6 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Nog iemand aanmelden?
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="naam" className="text-xs font-medium text-purple-200/80 ml-1">Naam</label>
                    <input 
                      type="text" 
                      id="naam" 
                      required
                      value={formData.naam}
                      onChange={(e) => setFormData({...formData, naam: e.target.value})}
                      placeholder="Je volledige naam" 
                      className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-purple-200/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-purple-200/80 ml-1">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="je@email.com" 
                      className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-purple-200/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="telefoon" className="text-xs font-medium text-purple-200/80 ml-1">Telefoonnummer</label>
                    <input 
                      type="tel" 
                      id="telefoon" 
                      required
                      value={formData.telefoon}
                      onChange={(e) => setFormData({...formData, telefoon: e.target.value})}
                      placeholder="+31 6 12345678" 
                      className="w-full bg-[#0a0514]/50 border border-purple-500/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-purple-200/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-medium rounded-xl px-4 py-4 shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'BEZIG...' : 'MELD JE AAN'}
                    {!isSubmitting && (
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-purple-200/40 mt-4">
                    Door je aan te melden ga je akkoord met onze voorwaarden
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
