'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Users, Trophy, Zap, Calendar, MapPin, ArrowRight, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';

interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  price: number;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Event[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0514]">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl tracking-tight text-white leading-none">GAMEFEST</h1>
            <p className="text-[10px] text-purple-200/60 uppercase tracking-widest mt-1">Voor jou en je vrienden</p>
          </div>
        </div>
        <Link 
          href="/admin/login" 
          className="px-5 py-2.5 rounded-full border border-purple-500/30 text-sm font-medium text-purple-200 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-300"
        >
          Admin Login
        </Link>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-12 pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column */}
          <div className="space-y-10 sticky top-12">
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium tracking-wide">
                NIEUWE EVENTS BESCHIKBAAR
              </div>
              <h2 className="font-heading text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
                <span className="bg-fuchsia-500 text-white px-4 py-2 rounded-2xl inline-block mb-4 shadow-lg shadow-fuchsia-500/20">GAME MET</span>
                <br />
                <span className="text-white">JE CREW</span>
              </h2>
              <p className="text-lg text-purple-100/60 max-w-lg leading-relaxed">
                Meld je aan voor onze gaming events en ontmoet andere gamers uit je netwerk. Breng je vrienden mee of maak nieuwe connecties tijdens onze sessions.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#130b29]/50 backdrop-blur-sm border border-purple-500/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#1a0f38]/50 transition-colors">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <div className="font-heading font-bold text-2xl text-white">500+</div>
                <div className="text-xs text-purple-200/50 mt-1">Deelnemers</div>
              </div>
              <div className="bg-[#130b29]/50 backdrop-blur-sm border border-purple-500/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#1a0f38]/50 transition-colors">
                <Trophy className="w-8 h-8 text-fuchsia-400 mb-3" />
                <div className="font-heading font-bold text-2xl text-white">Events</div>
                <div className="text-xs text-purple-200/50 mt-1">Maandelijks</div>
              </div>
              <div className="bg-[#130b29]/50 backdrop-blur-sm border border-purple-500/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#1a0f38]/50 transition-colors">
                <Zap className="w-8 h-8 text-blue-400 mb-3" />
                <div className="font-heading font-bold text-2xl text-white">Social</div>
                <div className="text-xs text-purple-200/50 mt-1">Gaming</div>
              </div>
            </div>
          </div>

          {/* Right Column - Events List */}
          <div className="relative">
            <div className="space-y-2 mb-8">
              <h3 className="font-heading text-3xl font-bold text-white">Komende Events</h3>
              <p className="text-sm text-purple-200/60">Kies een event om je aan te melden</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-[2rem] p-10 text-center">
                <Gamepad2 className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                <h4 className="text-white font-medium mb-2">Geen events gepland</h4>
                <p className="text-sm text-purple-200/60">Houd deze pagina in de gaten voor nieuwe events!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Link 
                    key={event.id} 
                    href={`/event/${event.id}`}
                    className="block bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-heading font-bold text-xl text-white group-hover:text-purple-300 transition-colors">{event.title}</h4>
                      <div className="bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/20">
                        €{event.price}
                      </div>
                    </div>
                    <p className="text-sm text-purple-200/60 mb-6 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-purple-200/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        {event.date?.toDate ? new Date(event.date.toDate()).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Datum onbekend'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        {event.location}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                      Bekijk details en meld je aan
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Previous Events Gallery */}
      <section className="container mx-auto px-6 pb-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium tracking-wide">
              <Camera className="w-3.5 h-3.5" />
              TERUGBLIK
            </div>
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-white">Eerdere Edities</h3>
            <p className="text-purple-200/60 max-w-2xl">
              Een sfeerimpressie van onze vorige LAN parties en gaming events. Zien we jou de volgende keer ook?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group">
            <Image 
              src="https://lh3.googleusercontent.com/gg-dl/AOI_d_-EM4Wp18NnNiPqKSHBZVQlV7R-nsubWn-r5dAS9HtUwqZMdv07l8WoqZKit2Ljt5eP_zXPzoMJWs_aLK1ssTGdsIJPal4TV6OAvEFYtxAHD4-Se09D1ekJ-RfMgub4b-R8zScGxmIM2T_ntgzx4Sif5UrRtsEGwsuxwTxcLG2tXwTf=s1600-rj"
              alt="Gamers at a LAN party"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0514] via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 p-6">
              <h4 className="text-white font-bold text-lg">Winter Brawl 2025</h4>
              <p className="text-purple-200/80 text-sm">120 deelnemers</p>
            </div>
          </div>
          
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group lg:col-span-2">
            <Image 
              src="https://picsum.photos/seed/esports/1200/600"
              alt="Large LAN party hall"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0514] via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 p-6">
              <h4 className="text-white font-bold text-lg">Summer GameFest 2025</h4>
              <p className="text-purple-200/80 text-sm">Onze grootste editie tot nu toe</p>
            </div>
          </div>

          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group">
            <Image 
              src="https://picsum.photos/seed/gamingpc/800/600"
              alt="High-end gaming setup"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0514] via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 p-6">
              <h4 className="text-white font-bold text-lg">Pro Setups</h4>
              <p className="text-purple-200/80 text-sm">Top-tier hardware</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
