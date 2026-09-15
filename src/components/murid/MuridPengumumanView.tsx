import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Pin,
  Calendar,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Tag,
  Search,
} from 'lucide-react';
import { LMSDatabase } from '../../services/dataStorage';
import { User, Pengumuman } from '../../types';

interface MuridPengumumanViewProps {
  db: LMSDatabase;
  currentUser: User;
}

export const MuridPengumumanView: React.FC<MuridPengumumanViewProps> = ({ db, currentUser }) => {
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const myKelasId = currentUser.kelasId || 'cls-xi-1';

  const myAnnouncements = useMemo(() => {
    const list = db.pengumuman || [];
    return list
      .filter((p) => {
        // Targeted to all or student's class
        const targets = p.targetKelasIds || ['all'];
        if (targets.includes('all') || targets.includes(myKelasId)) return true;
        return false;
      })
      .filter((p) => {
        if (selectedKategori !== 'ALL' && p.kategori !== selectedKategori) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.judul.toLowerCase().includes(q) ||
            p.konten.toLowerCase().includes(q) ||
            (p.guruNama && p.guruNama.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.disematkan && !b.disematkan) return -1;
        if (!a.disematkan && b.disematkan) return 1;
        return new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime();
      });
  }, [db.pengumuman, myKelasId, selectedKategori, searchQuery]);

  const getKategoriBadge = (kategori?: string) => {
    switch (kategori) {
      case 'Penting':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Tugas':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Kegiatan':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-2xs rounded-full text-xs font-black tracking-wider uppercase mb-2">
            <Megaphone className="w-3.5 h-3.5" /> Informasi & Pengumuman
          </div>
          <h2 className="text-2xl font-black tracking-tight">Papan Pengumuman PJOK</h2>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">
            Perhatikan instruksi seragam, tata tertib pengambilan nilai praktik, dan info penting dari guru mata pelajaran olahraga.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'Penting', 'Kegiatan', 'Tugas', 'Informasi'].map((kat) => (
            <button
              key={kat}
              type="button"
              onClick={() => setSelectedKategori(kat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedKategori === kat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {kat === 'ALL' ? 'Semua Kategori' : kat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* List */}
      {myAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Pengumuman</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Saat ini belum ada informasi atau pengumuman yang ditujukan untuk kelas Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myAnnouncements.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl sm:rounded-3xl p-5 border transition-all relative flex flex-col justify-between space-y-4 ${
                item.disematkan
                  ? 'border-amber-300 ring-2 ring-amber-100 shadow-sm'
                  : 'border-slate-200/80 shadow-2xs hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getKategoriBadge(
                        item.kategori
                      )}`}
                    >
                      {item.kategori || 'Informasi'}
                    </span>
                    {item.disematkan && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                        <Pin className="w-2.5 h-2.5 fill-current" /> Disematkan
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.dibuatPada).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-800 leading-snug">{item.judul}</h3>
                  <div className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {item.konten}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500">
                  Guru: {item.guruNama || 'Guru PJOK'}
                </span>
                <span className="font-medium text-emerald-600">Terbaca</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
