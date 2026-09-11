import React from 'react';
import {
  Users,
  School,
  BookMarked,
  ClipboardList,
  FileSpreadsheet,
  UserPlus,
  ArrowUpRight,
  Download,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import { LMSDatabase } from '../../services/dataStorage';

interface AdminDashboardProps {
  db: LMSDatabase;
  onNavigate: (menuId: string) => void;
  onOpenSheets?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ db, onNavigate, onOpenSheets }) => {
  const totalMurid = db.users.filter((u) => u.role === 'MURID').length;
  const totalGuru = db.users.filter((u) => u.role === 'GURU').length;
  const totalKelas = db.kelas.length;
  const totalMateri = db.materi.length;
  const totalTugasDanQuiz = db.tugas.length + db.quiz.length;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ringkasan Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Selamat datang kembali di Pusat Kendali LMS PJOK Nusantara.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              window.print();
            }}
            className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-slate-700 rounded-lg shadow-2xs hover:bg-gray-50 flex items-center transition-colors"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Cetak / PDF
          </button>
          <button
            onClick={() => onNavigate('data-murid')}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-2xs hover:bg-emerald-700 flex items-center transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Data Murid
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 shrink-0">
        {/* Total Murid */}
        <div
          onClick={() => onNavigate('data-murid')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center cursor-pointer hover:border-gray-200 transition-all group"
        >
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Data Murid</p>
            <h3 className="text-xl font-black text-slate-900">{totalMurid > 0 ? totalMurid.toLocaleString() : '0'}</h3>
            <p className="text-[10px] text-emerald-500 font-bold">Fase E & F</p>
          </div>
        </div>

        {/* Total Guru */}
        <div
          onClick={() => onNavigate('data-guru')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center cursor-pointer hover:border-gray-200 transition-all group"
        >
          <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Data Guru</p>
            <h3 className="text-xl font-black text-slate-900">{totalGuru > 0 ? totalGuru : '0'}</h3>
            <p className="text-[10px] text-sky-500 font-bold">Pengampu PJOK</p>
          </div>
        </div>

        {/* Total Kelas */}
        <div
          onClick={() => onNavigate('kelas')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center cursor-pointer hover:border-gray-200 transition-all group"
        >
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Total Kelas</p>
            <h3 className="text-xl font-black text-slate-900">{totalKelas > 0 ? totalKelas : '0'}</h3>
            <p className="text-[10px] text-slate-400 font-bold">Rombel Aktif</p>
          </div>
        </div>

        {/* Materi Aktif */}
        <div
          onClick={() => onNavigate('materi')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center cursor-pointer hover:border-gray-200 transition-all group"
        >
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
            <BookMarked className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Materi Aktif</p>
            <h3 className="text-xl font-black text-slate-900">{totalMateri > 0 ? totalMateri : '0'}</h3>
            <p className="text-[10px] text-amber-500 font-bold">Kurikulum Merdeka</p>
          </div>
        </div>

        {/* Tugas & Quiz */}
        <div
          onClick={() => onNavigate('tugas')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center cursor-pointer hover:border-gray-200 transition-all group"
        >
          <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Tugas & Quiz</p>
            <h3 className="text-xl font-black text-slate-900">{totalTugasDanQuiz > 0 ? totalTugasDanQuiz : '0'}</h3>
            <p className="text-[10px] text-slate-400 font-bold">Asesmen Aktif</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Aktivitas Terbaru (2 cols) & Statistik Presensi (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aktivitas Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-slate-900">Aktivitas Terbaru</h2>
            <button
              onClick={() => onNavigate('laporan')}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wider font-bold text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Pengguna</th>
                  <th className="px-6 py-3">Aktivitas</th>
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="text-sm hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 mr-3 overflow-hidden text-[10px] flex items-center justify-center font-bold text-slate-700 shrink-0">
                      BS
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs">Budi Santoso, M.Pd.</p>
                      <p className="text-[11px] text-slate-400">Guru PJOK</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    Menambahkan materi{' '}
                    <span className="font-semibold text-blue-600 underline">
                      Bola Voli - Teknik Smash & Passing
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">12 Menit Lalu</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">
                      Berhasil
                    </span>
                  </td>
                </tr>

                <tr className="text-sm hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 mr-3 overflow-hidden text-[10px] flex items-center justify-center font-bold text-slate-700 shrink-0">
                      AP
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs">Andi Pratama</p>
                      <p className="text-[11px] text-slate-400">Siswa XI 1</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    Mengumpulkan tugas{' '}
                    <span className="font-semibold text-slate-800">
                      Analisis Video Gerak Passing Bawah
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">45 Menit Lalu</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">
                      Diproses
                    </span>
                  </td>
                </tr>

                <tr className="text-sm hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 mr-3 overflow-hidden text-[10px] flex items-center justify-center font-bold text-slate-700 shrink-0">
                      RW
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs">Rina Wijaya, S.Pd.</p>
                      <p className="text-[11px] text-slate-400">Guru PJOK</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    Membuat kuis baru{' '}
                    <span className="font-semibold text-slate-800">
                      Asesmen Kebugaran Jasmani Mandiri
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">1 Jam Lalu</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">
                      Berhasil
                    </span>
                  </td>
                </tr>

                <tr className="text-sm hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 mr-3 overflow-hidden text-[10px] flex items-center justify-center font-bold text-slate-700 shrink-0">
                      DR
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs">Dedi Rusmanto</p>
                      <p className="text-[11px] text-slate-400">Siswa XI 2</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    Menyelesaikan quiz{' '}
                    <span className="font-semibold text-slate-800">
                      Pola Hidup Sehat & Gizi Olahraga
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">2 Jam Lalu</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">
                      Berhasil
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistik Presensi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Statistik Presensi</h2>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Rata-rata 94%
            </span>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Hadir (94%)</span>
                  <span className="text-emerald-600 font-extrabold">329 Murid</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Izin / Sakit (4%)</span>
                  <span className="text-blue-600 font-extrabold">14 Murid</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Alpa / Tanpa Keterangan (2%)</span>
                  <span className="text-rose-600 font-extrabold">7 Murid</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '2%' }} />
                </div>
              </div>
            </div>

            {/* Tahun Pelajaran Berjalan card */}
            <div className="mt-auto p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-800 mb-1.5">Tahun Pelajaran Berjalan</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-blue-950">
                  {db.settings?.tahunPelajaran || '2026/2027'}
                </span>
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-2xs">
                  {db.settings?.semester || 'Ganjil'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
