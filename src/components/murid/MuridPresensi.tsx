import React from 'react';
import { CalendarCheck, CheckCircle2, Clock, AlertTriangle, XCircle, Info } from 'lucide-react';
import { User, PresensiRecord } from '../../types';
import { LMSDatabase } from '../../services/dataStorage';

interface MuridPresensiProps {
  db: LMSDatabase;
  currentUser: User;
}

export const MuridPresensi: React.FC<MuridPresensiProps> = ({ db, currentUser }) => {
  const myPresensiList = db.presensi.filter((p) => p.muridId === currentUser.id);

  const total = myPresensiList.length || 1;
  const countH = myPresensiList.filter((p) => p.status === 'H').length;
  const countS = myPresensiList.filter((p) => p.status === 'S').length;
  const countI = myPresensiList.filter((p) => p.status === 'I').length;
  const countA = myPresensiList.filter((p) => p.status === 'A').length;
  const countT = myPresensiList.filter((p) => p.status === 'T').length;
  const percentage = Math.round(((countH + countT) / total) * 100);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'H':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
            Hadir (H)
          </span>
        );
      case 'S':
        return (
          <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-black">
            Sakit (S)
          </span>
        );
      case 'I':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
            Izin (I)
          </span>
        );
      case 'A':
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-black">
            Alpa (A)
          </span>
        );
      case 'T':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-black">
            Terlambat (T)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Presensi & Kehadiran Saya</h2>
        <p className="text-xs text-slate-500">
          Riwayat kehadiran pembelajaran praktik dan teori PJOK di lapangan
        </p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Persentase Kehadiran
          </span>
          <span className="text-3xl font-black text-emerald-600 mt-1 block">{percentage}%</span>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {countH + countT} dari {total} Pertemuan
          </span>
        </div>

        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
          <span className="text-2xl font-black text-emerald-800 block">{countH}</span>
          <span className="text-[11px] font-bold text-emerald-900 mt-1 block">Hadir</span>
        </div>

        <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-center">
          <span className="text-2xl font-black text-sky-800 block">{countS}</span>
          <span className="text-[11px] font-bold text-sky-900 mt-1 block">Sakit</span>
        </div>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-center">
          <span className="text-2xl font-black text-amber-800 block">{countI}</span>
          <span className="text-[11px] font-bold text-amber-900 mt-1 block">Izin</span>
        </div>

        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
          <span className="text-2xl font-black text-rose-800 block">{countA}</span>
          <span className="text-[11px] font-bold text-rose-900 mt-1 block">Alpa</span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Riwayat Pertemuan Pembelajaran PJOK
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Keterangan Pembelajaran</th>
                <th className="py-3 px-4 text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {myPresensiList.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {new Date(rec.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rec.keterangan || 'Praktik PJOK'}</td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(rec.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
