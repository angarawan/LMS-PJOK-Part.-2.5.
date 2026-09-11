import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  School,
  Award,
  CalendarCheck,
  User,
  X,
  Activity,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';
import { UploadDataModal } from '../shared/UploadDataModal';

interface GuruDataMuridProps {
  db: LMSDatabase;
  onNavigatePraktik: (muridId: string) => void;
}

export const GuruDataMurid: React.FC<GuruDataMuridProps> = ({ db, onNavigatePraktik }) => {
  const [selectedKelasId, setSelectedKelasId] = useState<string>('cls-xi-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMuridDetail, setActiveMuridDetail] = useState<UserType | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const handleImportMurid = (importedUsers: UserType[]) => {
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      users: [...prev.users, ...importedUsers],
    }));
    alert(`Berhasil menambahkan ${importedUsers.length} data murid baru ke database!`);
  };

  const muridInKelas = db.users.filter((u) => u.role === 'MURID' && u.kelasId === selectedKelasId);

  const filteredMurid = muridInKelas.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.nis && m.nis.includes(searchQuery))
  );

  const selectedKelasObj = (db.kelas || []).find((k) => k.id === selectedKelasId);

  // Student details data
  const getMuridScore = (muridId: string) => {
    return (db.nilai || []).find((n) => n.muridId === muridId);
  };

  const getMuridAttendance = (muridId: string) => {
    const list = db.presensi.filter((p) => p.muridId === muridId);
    const hadir = list.filter((p) => p.status === 'H').length;
    const total = list.length || 1;
    return {
      total: list.length,
      hadir,
      persen: Math.round((hadir / total) * 100),
      list,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Data Murid PJOK Fase F
          </h2>
          <p className="text-xs text-slate-500">
            Daftar lengkap siswa per rombel kelas XI 1 sampai XI 7, riwayat capaian nilai, dan statistik presensi
          </p>
        </div>

        {/* Class switcher buttons pill */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {db.kelas.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelectedKelasId(k.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedKelasId === k.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {k.nama}
            </button>
          ))}
        </div>
      </div>

      {/* Search and class info banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-black text-sm border border-sky-100">
            {selectedKelasObj?.nama}
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">
              Daftar Siswa Kelas {selectedKelasObj?.nama}
            </h3>
            <p className="text-xs text-slate-400">
              Wali Kelas: {selectedKelasObj?.waliKelasNama} • Total: {filteredMurid.length} Siswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Murid</span>
          </button>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMurid.map((murid) => {
          const score = getMuridScore(murid.id);
          const att = getMuridAttendance(murid.id);
          return (
            <div
              key={murid.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      murid.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
                    }
                    alt={murid.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-800 truncate">{murid.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      NIS: {murid.nis} • {murid.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>
                </div>

                {/* Score & Attendance Mini Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Nilai Praktik
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      {score?.praktik || 88}
                    </span>
                  </div>

                  <div className="p-2 bg-sky-50/60 rounded-xl border border-sky-100">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block">
                      Kehadiran
                    </span>
                    <span className="text-base font-black text-sky-700">
                      {att.persen || 100}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => setActiveMuridDetail(murid)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold"
                >
                  Detail Profil
                </button>
                <button
                  onClick={() => onNavigatePraktik(murid.id)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5" /> Nilai Praktik
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Profile Detail Modal */}
      {activeMuridDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setActiveMuridDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <img
                src={activeMuridDetail.avatar}
                alt={activeMuridDetail.name}
                className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-emerald-500/20 shadow-md"
              />
              <h3 className="text-base font-extrabold text-slate-800">{activeMuridDetail.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                NIS: {activeMuridDetail.nis} • NISN: {activeMuridDetail.nisn || '-'}
              </p>
              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
                Kelas {selectedKelasObj?.nama} • TP {activeMuridDetail.tahunPelajaran}
              </span>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Akun:</span>
                <span className="font-bold text-emerald-700">{activeMuridDetail.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jenis Kelamin:</span>
                <span className="font-semibold text-slate-800">
                  {activeMuridDetail.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Akun:</span>
                <span className="font-mono text-slate-600">{activeMuridDetail.email}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                Ringkasan Nilai Akhir PJOK
              </span>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Tugas</span>
                  <span className="font-black text-slate-800">
                    {getMuridScore(activeMuridDetail.id)?.tugas || 85}
                  </span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Quiz</span>
                  <span className="font-black text-slate-800">
                    {getMuridScore(activeMuridDetail.id)?.quiz || 80}
                  </span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Praktik</span>
                  <span className="font-black text-emerald-700">
                    {getMuridScore(activeMuridDetail.id)?.praktik || 88}
                  </span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Akhir</span>
                  <span className="font-black text-sky-700">
                    {getMuridScore(activeMuridDetail.id)?.nilaiAkhir || 86}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveMuridDetail(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup Profil Siswa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upload Data Murid Modal */}
      <UploadDataModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        type="murid"
        onImport={handleImportMurid}
      />
    </div>
  );
};
