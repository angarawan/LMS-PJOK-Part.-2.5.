import React from 'react';
import {
  BookOpen,
  ClipboardList,
  CheckCircle,
  Award,
  Calendar,
  Bell,
  ArrowUpRight,
  Sparkles,
  Play,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { LMSDatabase } from '../../services/dataStorage';
import { User } from '../../types';

interface MuridDashboardProps {
  db: LMSDatabase;
  currentUser: User;
  onNavigate: (menuId: string, param?: string) => void;
}

export const MuridDashboard: React.FC<MuridDashboardProps> = ({ db, currentUser, onNavigate }) => {
  const myKelasId = currentUser.kelasId || 'cls-xi-1';
  const kelasObj = (db.kelas || []).find((k) => k.id === myKelasId);

  // Filter student's materials
  const materiAktif = (db.materi || []).filter((m) => m.status === 'Publish');
  const tugasList = (db.tugas || []).filter((t) => t.status === 'Publish');
  const pengumpulanSaya = (db.pengumpulanTugas || []).filter((p) => p.muridId === currentUser.id);

  // Unfinished tasks
  const tugasBelum = tugasList.filter(
    (t) => !pengumpulanSaya.some((p) => p.tugasId === t.id)
  );

  // Active quiz
  const quizAktif = db.quiz || [];

  // Active reflections from teachers
  const myRefleksiList = (db.refleksi || []).filter((r) => {
    if (r.status === 'Draft' || r.statusPublikasi === 'Draft') return false;
    const studentKelas = (currentUser.kelasId || '').toLowerCase().trim();
    const studentKelasObj = (db.kelas || []).find((k) => k.id === currentUser.kelasId);
    const studentKelasNama = (studentKelasObj?.nama || '').toLowerCase().trim();
    const targetK = (r.kelasId || r.targetKelasId || 'ALL').toLowerCase().trim();
    if (targetK === 'all') return true;
    return targetK === studentKelas || (studentKelasNama && targetK === studentKelasNama);
  });
  const myAnsweredRefleksiIds = new Set(
    (db.jawabanRefleksi || [])
      .filter((j) => j.muridId === currentUser.id)
      .map((j) => j.refleksiId)
  );
  const refleksiBelumIsi = myRefleksiList.filter((r) => !myAnsweredRefleksiIds.has(r.id));

  // Student grades
  const nilaiSaya = (db.nilai || []).find((n) => n.muridId === currentUser.id) || {
    tugas: 85,
    quiz: 80,
    praktik: 88,
    pengetahuan: 83,
    keterampilan: 88,
    sikap: 90,
    nilaiAkhir: 86,
    predikat: 'B',
  };

  // Student attendance
  const presensiSaya = db.presensi.filter((p) => p.muridId === currentUser.id);
  const hadirCount = presensiSaya.filter((p) => p.status === 'H').length;
  const totalPresensi = presensiSaya.length || 1;
  const attendancePercent = Math.round((hadirCount / totalPresensi) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-teal-800 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md text-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fase F • Kelas {kelasObj?.nama || 'XI 1'} • TP {db.settings?.tahunPelajaran || '2026/2027'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Semangat Pagi, {currentUser.name}!
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            Selamat datang di portal pembelajaran PJOK. Pelajari materi teknik olahraga, kumpulkan
            tugas video gerak tepat waktu, dan tingkatkan kebugaran jasmani Anda.
          </p>

          <div className="pt-3 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('materi-saya')}
              className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Buka Materi PJOK
            </button>
            <button
              onClick={() => onNavigate('tugas-saya')}
              className="px-4 py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              Lihat Tugas ({tugasBelum.length} Belum Kumpul)
            </button>
            <button
              onClick={() => onNavigate('refleksi-saya')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-900" />
              Isi Refleksi Belajar {refleksiBelumIsi.length > 0 && `(${refleksiBelumIsi.length} Baru)`}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Tugas Pending */}
        <div
          onClick={() => onNavigate('tugas-saya')}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white rounded-xl shadow-2xs">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-40" />
          </div>
          <div>
            <div className="text-2xl font-black">{tugasBelum.length} Tugas</div>
            <p className="text-xs font-bold mt-0.5">Tugas Menunggu</p>
            <p className="text-[10px] opacity-75">Kumpulkan video/laporan</p>
          </div>
        </div>

        {/* Quiz Aktif */}
        <div
          onClick={() => onNavigate('quiz-saya')}
          className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white rounded-xl shadow-2xs">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-40" />
          </div>
          <div>
            <div className="text-2xl font-black">{quizAktif.length} Quiz</div>
            <p className="text-xs font-bold mt-0.5">Quiz Asesmen</p>
            <p className="text-[10px] opacity-75">AKM & HOTS PJOK</p>
          </div>
        </div>

        {/* Nilai Akhir */}
        <div
          onClick={() => onNavigate('nilai-saya')}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white rounded-xl shadow-2xs">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
              Predikat {nilaiSaya.predikat}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black">{nilaiSaya.nilaiAkhir}</div>
            <p className="text-xs font-bold mt-0.5">Nilai Rata-rata</p>
            <p className="text-[10px] opacity-75">Praktik: {nilaiSaya.praktik}</p>
          </div>
        </div>

        {/* Kehadiran */}
        <div
          onClick={() => onNavigate('presensi-saya')}
          className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-sky-900 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-white rounded-xl shadow-2xs">
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-40" />
          </div>
          <div>
            <div className="text-2xl font-black">{attendancePercent}%</div>
            <p className="text-xs font-bold mt-0.5">Presensi Kehadiran</p>
            <p className="text-[10px] opacity-75">{hadirCount} Pertemuan Hadir</p>
          </div>
        </div>
      </div>

      {/* Two columns: Active Materials & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Materi Berjalan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Materi yang Sedang Dipelajari</h3>
              <p className="text-xs text-slate-400">Modul ajar kurikulum merdeka semester ini</p>
            </div>
            <button
              onClick={() => onNavigate('materi-saya')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Lihat Semua Materi →
            </button>
          </div>

          <div className="space-y-3">
            {materiAktif.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => onNavigate('materi-saya', m.id)}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-black text-xs">
                    PJOK
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      {m.kategori}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 truncate">{m.judul}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{m.deskripsi}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Pengumuman Guru */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Pengumuman Guru PJOK</h3>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Bell className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100/80 space-y-1 text-amber-900">
              <span className="font-bold block">Praktek Lapangan Hari Selasa:</span>
              <p className="text-[11px] leading-relaxed">
                Seluruh siswa XI wajib mengenakan seragam olahraga lengkap dan sepatu kets untuk pengambilan nilai praktik bola voli.
              </p>
              <span className="text-[10px] text-amber-700 block pt-1">Oleh: Pak Haryono, S.Pd.Jas</span>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100/80 space-y-1 text-sky-900">
              <span className="font-bold block">Batas Pengumpulan Video:</span>
              <p className="text-[11px] leading-relaxed">
                Video rekaman passing bawah berpasangan paling lambat dikumpulkan via link Google Drive/YouTube sebelum 30 September.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
