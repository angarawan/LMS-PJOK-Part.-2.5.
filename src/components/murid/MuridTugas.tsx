import React, { useState } from 'react';
import {
  ClipboardList,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Video,
  ExternalLink,
  MessageSquare,
  Award,
  X,
} from 'lucide-react';
import { Tugas, PengumpulanTugas, User } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';
import { InAppMediaModal } from '../shared/InAppMediaModal';

interface MuridTugasProps {
  db: LMSDatabase;
  currentUser: User;
}

export const MuridTugas: React.FC<MuridTugasProps> = ({ db, currentUser }) => {
  const [filterStatus, setFilterStatus] = useState<'semua' | 'belum' | 'dikumpulkan' | 'dinilai'>(
    'semua'
  );
  const [activeUploadTugas, setActiveUploadTugas] = useState<Tugas | null>(null);

  // In-app media viewer
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    category?: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // Form upload
  const [linkVideo, setLinkVideo] = useState('');
  const [linkDokumen, setLinkDokumen] = useState('');
  const [catatan, setCatatan] = useState('');

  const mySubmissions = db.pengumpulanTugas.filter((p) => p.muridId === currentUser.id);

  const getTugasStatus = (tugasId: string) => {
    const submission = mySubmissions.find((p) => p.tugasId === tugasId);
    if (!submission) return 'belum';
    if (submission.nilai !== undefined && submission.nilai !== null) return 'dinilai';
    return 'dikumpulkan';
  };

  const filteredTugas = db.tugas.filter((t) => {
    if (t.status === 'Draft' || t.statusPublikasi === 'Draft') return false;
    if (t.status !== 'Publish' && t.status !== 'Aktif' && t.statusPublikasi !== 'Publish') return false;
    const st = getTugasStatus(t.id);
    if (filterStatus === 'semua') return true;
    return st === filterStatus;
  });

  const handleOpenUpload = (tugas: Tugas) => {
    const existing = mySubmissions.find((p) => p.tugasId === tugas.id);
    setActiveUploadTugas(tugas);
    if (existing) {
      setLinkVideo(existing.linkVideo || '');
      setLinkDokumen(existing.fileUrl || '');
      setCatatan(existing.catatanSiswa || '');
    } else {
      setLinkVideo('');
      setLinkDokumen('');
      setCatatan('');
    }
  };

  const handleSaveSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUploadTugas) return;

    const existing = mySubmissions.find((p) => p.tugasId === activeUploadTugas.id);

    const submissionData: PengumpulanTugas = {
      id: existing ? existing.id : `sub-${currentUser.id}-${activeUploadTugas.id}`,
      tugasId: activeUploadTugas.id,
      muridId: currentUser.id,
      muridNama: currentUser.name,
      linkVideo: linkVideo.trim() || undefined,
      fileUrl: linkDokumen.trim() || undefined,
      catatanSiswa: catatan.trim(),
      tanggalKumpul: new Date().toISOString().slice(0, 10),
      status: 'Dikumpulkan',
      nilai: existing?.nilai,
      catatanGuru: existing?.catatanGuru,
    };

    dataStorage.updateDatabase((prev) => {
      const otherSubs = prev.pengumpulanTugas.filter(
        (p) => !(p.tugasId === activeUploadTugas.id && p.muridId === currentUser.id)
      );
      return {
        ...prev,
        pengumpulanTugas: [...otherSubs, submissionData],
      };
    });

    alert('Tugas berhasil dikumpulkan dan tersimpan!');
    setActiveUploadTugas(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Tugas PJOK Saya</h2>
          <p className="text-xs text-slate-500">
            Daftar penugasan gerak praktik, tugas teori, dan unggah video pembelajaran
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { key: 'semua', label: 'Semua Tugas' },
            { key: 'belum', label: 'Belum Dikerjakan' },
            { key: 'dikumpulkan', label: 'Sudah Dikumpulkan' },
            { key: 'dinilai', label: 'Sudah Dinilai' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterStatus(btn.key as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterStatus === btn.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tugas Cards List */}
      <div className="space-y-4">
        {filteredTugas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            Tidak ada tugas dengan filter ini.
          </div>
        ) : (
          filteredTugas.map((t) => {
            const submission = mySubmissions.find((p) => p.tugasId === t.id);
            const status = getTugasStatus(t.id);

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-bold">
                        {t.kategori}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {new Date(t.deadline).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-800">{t.judul}</h3>
                    {t.subJudul && (
                      <p className="text-xs text-emerald-700 font-bold mt-0.5">{t.subJudul}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.instruksi}</p>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        status === 'dinilai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'dikumpulkan'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {status === 'dinilai'
                        ? 'Sudah Dinilai'
                        : status === 'dikumpulkan'
                        ? 'Sudah Dikumpulkan'
                        : 'Belum Dikerjakan'}
                    </span>

                    <button
                      onClick={() => handleOpenUpload(t)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      {submission ? 'Perbarui Pengumpulan' : 'Kumpulkan Tugas'}
                    </button>
                  </div>
                </div>

                {/* Submission & Teacher Grade View */}
                {submission && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* What student submitted */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
                        Data Pengumpulan Anda:
                      </span>
                      {submission.linkVideo && (
                        <button
                          type="button"
                          onClick={() =>
                            setMediaModal({
                              isOpen: true,
                              url: submission.linkVideo!,
                              title: `Video Tugas: ${t.judul}`,
                              category: 'Video Tugas Siswa',
                            })
                          }
                          className="text-rose-600 hover:underline flex items-center gap-1 font-semibold truncate text-left"
                          title="Tonton Video di Aplikasi"
                        >
                          <Video className="w-3.5 h-3.5 shrink-0" />
                          <span>Lihat Video: {submission.linkVideo}</span>
                        </button>
                      )}
                      {submission.fileUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setMediaModal({
                              isOpen: true,
                              url: submission.fileUrl!,
                              title: `Dokumen Tugas: ${t.judul}`,
                              category: 'Dokumen / Portofolio',
                            })
                          }
                          className="text-sky-600 hover:underline flex items-center gap-1 font-semibold truncate text-left"
                          title="Buka Dokumen di Aplikasi"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Lihat Dokumen: {submission.fileUrl}</span>
                        </button>
                      )}
                      {submission.catatanSiswa && (
                        <p className="text-slate-600 text-[11px] italic">
                          Catatan: "{submission.catatanSiswa}"
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 block">
                        Dikumpulkan: {submission.tanggalKumpul}
                      </span>
                    </div>

                    {/* Teacher Feedback / Grade */}
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">
                          Koreksi & Nilai Guru:
                        </span>
                        {submission.nilai !== undefined && (
                          <span className="text-lg font-black text-emerald-700">
                            Skor: {submission.nilai}
                          </span>
                        )}
                      </div>

                      {submission.catatanGuru ? (
                        <p className="text-emerald-800 text-[11px] leading-relaxed">
                          {submission.catatanGuru}
                        </p>
                      ) : (
                        <p className="text-slate-400 text-[11px] italic">
                          Menunggu evaluasi dan koreksi dari guru pengampu.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload Submission Modal */}
      {activeUploadTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setActiveUploadTugas(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-1">Kumpulkan Tugas PJOK</h3>
            <p className="text-xs text-slate-500 mb-4">{activeUploadTugas.judul}</p>

            <form onSubmit={handleSaveSubmission} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Link Video Olahraga (YouTube / Google Drive)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={linkVideo}
                    onChange={(e) => setLinkVideo(e.target.value)}
                    placeholder="https://youtu.be/... atau https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pastikan akses video di Google Drive diatur ke "Siapa saja yang memiliki link".
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Link File Dokumen / Laporan (Opsional)
                </label>
                <input
                  type="text"
                  value={linkDokumen}
                  onChange={(e) => setLinkDokumen(e.target.value)}
                  placeholder="https://drive.google.com/... (Laporan analisis/PDF)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Catatan untuk Guru
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Ceritakan kendala, posisi latihan, atau teman berpasangan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveUploadTugas(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Kirim Pengumpulan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Media Viewer Modal */}
      <InAppMediaModal
        isOpen={mediaModal.isOpen}
        onClose={() => setMediaModal((prev) => ({ ...prev, isOpen: false }))}
        url={mediaModal.url}
        title={mediaModal.title}
        category={mediaModal.category}
      />
    </div>
  );
};
