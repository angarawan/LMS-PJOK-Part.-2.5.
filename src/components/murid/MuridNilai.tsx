import React from 'react';
import { Award, CheckCircle2, TrendingUp, HelpCircle, FileText, Printer } from 'lucide-react';
import { User, NilaiItem } from '../../types';
import { LMSDatabase } from '../../services/dataStorage';

interface MuridNilaiProps {
  db: LMSDatabase;
  currentUser: User;
}

export const MuridNilai: React.FC<MuridNilaiProps> = ({ db, currentUser }) => {
  const kelasObj = (db.kelas || []).find((k) => k.id === currentUser.kelasId);

  // Student's grade record
  const myNilai = (db.nilai || []).find((n) => n.muridId === currentUser.id) || {
    id: `nil-${currentUser.id}`,
    muridId: currentUser.id,
    muridNama: currentUser.name,
    kelasId: currentUser.kelasId || 'cls-xi-1',
    semester: '1 (Ganjil)',
    tugas: 85,
    quiz: 80,
    praktik: 88,
    pengetahuan: 83,
    keterampilan: 88,
    sikap: 90,
    nilaiAkhir: 86,
    predikat: 'B',
  };

  // Practical assessments for student
  const myPraktikAssessments = db.penilaianPraktik.filter(
    (p) => p.muridId === currentUser.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Transkrip & Rekap Nilai PJOK Saya
          </h2>
          <p className="text-xs text-slate-500">
            Laporan capaian kompetensi psikomotorik, kognitif, dan afektif Kurikulum Merdeka Fase F
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" /> Cetak Rapor PJOK
        </button>
      </div>

      {/* Main Final Score Highlight Card */}
      <div className="bg-gradient-to-tr from-emerald-800 via-teal-800 to-sky-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md text-emerald-200">
            Nilai Akhir Rapor Semester 1 (Ganjil)
          </span>
          <h3 className="text-2xl font-black tracking-tight">{currentUser.name}</h3>
          <p className="text-xs text-slate-300">
            NIS: {currentUser.nis} • Kelas {kelasObj?.nama} • {db.settings?.namaSekolah || 'SMAN 1 Olahraga Nusantara'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
          <div className="text-center">
            <span className="text-4xl font-black font-mono">{myNilai.nilaiAkhir}</span>
            <span className="text-xs text-emerald-200 block font-bold">Skor Akhir</span>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-4xl font-black text-amber-300 font-mono">
              {myNilai.predikat}
            </span>
            <span className="text-xs text-emerald-200 block font-bold">Predikat</span>
          </div>
        </div>
      </div>

      {/* 6 Dimension Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Nilai Tugas
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{myNilai.tugas}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Tuntas</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Nilai Quiz
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{myNilai.quiz}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Tuntas</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Nilai Praktik
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {myNilai.praktik}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Sangat Baik</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pengetahuan
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">
            {myNilai.pengetahuan}
          </span>
          <span className="text-[10px] text-sky-600 font-semibold">Kognitif</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Keterampilan
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">
            {myNilai.keterampilan}
          </span>
          <span className="text-[10px] text-purple-600 font-semibold">Motorik</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Nilai Sikap
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{myNilai.sikap}</span>
          <span className="text-[10px] text-amber-600 font-semibold">Sportivitas</span>
        </div>
      </div>

      {/* Detailed Practice Rubric Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          Catatan & Hasil Ujian Praktik Lapangan (Rubrik PJOK)
        </h3>

        {myPraktikAssessments.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
            Belum ada rekam catatan praktik baru. Penilaian praktik akan muncul setelah guru menguji gerakan Anda di lapangan.
          </div>
        ) : (
          <div className="space-y-3">
            {myPraktikAssessments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800">{p.materiJudul || p.materi || 'Praktik PJOK'}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                    Skor: {p.nilaiTotal ?? p.nilaiAkhir ?? 80} ({p.predikat || 'B'})
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-2">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Sikap Awal</span>
                    <strong className="text-slate-800">{p.rubrik?.sikapAwal ?? p.aspekNilai?.sikapAwal ?? 3}/4</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Pelaksanaan</span>
                    <strong className="text-slate-800">{p.rubrik?.pelaksanaanTeknik ?? p.aspekNilai?.teknikGerakan ?? 3}/4</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Sikap Akhir</span>
                    <strong className="text-slate-800">{p.rubrik?.sikapAkhir ?? p.aspekNilai?.koordinasi ?? 3}/4</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Hasil Gerak</span>
                    <strong className="text-slate-800">{p.rubrik?.hasilGerakan ?? p.aspekNilai?.ketepatan ?? 3}/4</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Sportivitas</span>
                    <strong className="text-slate-800">{p.rubrik?.sportivitas ?? p.aspekNilai?.sportivitas ?? 4}/4</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Kerja Sama</span>
                    <strong className="text-slate-800">{p.rubrik?.kerjaSama ?? p.aspekNilai?.kerjaSama ?? 4}/4</strong>
                  </div>
                </div>

                {(p.catatanEvaluasi || p.catatanGuru) && (
                  <p className="mt-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 italic">
                    Catatan Guru: "{p.catatanEvaluasi || p.catatanGuru}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
