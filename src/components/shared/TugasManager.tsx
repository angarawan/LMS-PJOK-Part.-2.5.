import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  ExternalLink,
  Users,
  Search,
  School,
  X,
  Eye,
  Award,
  MessageSquare,
  Sparkles,
  Check,
  ChevronRight,
  Filter,
  Upload,
} from 'lucide-react';
import { Tugas, PengumpulanTugas, User } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';
import { InAppMediaModal } from './InAppMediaModal';
import { UploadDataModal } from './UploadDataModal';

interface TugasManagerProps {
  db: LMSDatabase;
  currentUser: User;
}

export const TugasManager: React.FC<TugasManagerProps> = ({ db, currentUser }) => {
  const [selectedTab, setSelectedTab] = useState<'tugas' | 'pengumpulan'>('tugas');
  const [selectedTugasId, setSelectedTugasId] = useState<string>('Semua');
  const [selectedKelasId, setSelectedKelasId] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPengumpulanStatus, setFilterPengumpulanStatus] = useState<
    'semua' | 'menunggu' | 'dinilai'
  >('semua');
  const [filterPublikasi, setFilterPublikasi] = useState<'Semua' | 'Publish' | 'Draft'>('Semua');

  // In-App Media Viewer
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

  // Modals & Active states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingTugas, setEditingTugas] = useState<Tugas | null>(null);
  const [activeReviewSubmission, setActiveReviewSubmission] = useState<PengumpulanTugas | null>(null);
  const [reviewNilai, setReviewNilai] = useState<number>(85);
  const [reviewCatatan, setReviewCatatan] = useState<string>('');

  const handleImportTugas = (imported: Tugas[]) => {
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      tugas: [...imported, ...prev.tugas],
    }));
    alert(`Berhasil menambahkan ${imported.length} tugas baru ke database!`);
  };

  // Form state
  const [form, setForm] = useState<Partial<Tugas>>({
    judul: '',
    kategori: 'Praktik Gerak Mandiri',
    instruksi: '',
    deadline: '2026-09-30T23:59',
    kelasIds: db.kelas.map((k) => k.id),
    status: 'Publish',
  });

  const categories = [
    'Praktik Gerak Mandiri',
    'Analisis Video Pertandingan',
    'Portofolio Kebugaran Jasmani',
    'Laporan Pola Hidup Sehat',
    'Tugas Teori Aturan Olahraga',
  ];

  // Filtering tasks
  const filteredTugas = db.tugas.filter((t) => {
    const matchQuery =
      t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subJudul && t.subJudul.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.instruksi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchKelas =
      selectedKelasId === 'Semua' ||
      !t.kelasIds ||
      t.kelasIds.length === 0 ||
      t.kelasIds.includes(selectedKelasId);

    const isDraft = t.status === 'Draft' || t.statusPublikasi === 'Draft';
    const matchPublikasi =
      filterPublikasi === 'Semua' ||
      (filterPublikasi === 'Draft' && isDraft) ||
      (filterPublikasi === 'Publish' && !isDraft);

    return matchQuery && matchKelas && matchPublikasi;
  });

  const handleTogglePublikasi = (t: Tugas) => {
    const isDraft = t.status === 'Draft' || t.statusPublikasi === 'Draft';
    const newStatus = isDraft ? 'Publish' : 'Draft';
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      tugas: prev.tugas.map((item) =>
        item.id === t.id
          ? {
              ...item,
              status: newStatus as any,
              statusPublikasi: newStatus as any,
            }
          : item
      ),
    }));
  };

  // Submissions calculation
  const allSubmissions = db.pengumpulanTugas;
  const waitingGrading = allSubmissions.filter(
    (p) => p.nilai === undefined || p.nilai === null
  ).length;
  const gradedSubmissions = allSubmissions.filter(
    (p) => p.nilai !== undefined && p.nilai !== null
  ).length;

  const filteredSubmissions = allSubmissions.filter((p) => {
    const matchTugas = selectedTugasId === 'Semua' || p.tugasId === selectedTugasId;
    const matchKelas = selectedKelasId === 'Semua' || p.kelasId === selectedKelasId;
    const matchStatus =
      filterPengumpulanStatus === 'semua' ||
      (filterPengumpulanStatus === 'menunggu' && (p.nilai === undefined || p.nilai === null)) ||
      (filterPengumpulanStatus === 'dinilai' && p.nilai !== undefined && p.nilai !== null);

    const matchSearch =
      p.muridNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tugasJudul && p.tugasJudul.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.catatanSiswa && p.catatanSiswa.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchTugas && matchKelas && matchStatus && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingTugas(null);
    setForm({
      judul: '',
      kategori: 'Praktik Gerak Mandiri',
      instruksi: '',
      deadline: '2026-09-30T23:59',
      kelasIds: db.kelas.map((k) => k.id),
      status: 'Publish',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tugas) => {
    setEditingTugas(t);
    setForm({
      ...t,
      kelasIds: t.kelasIds || (t.kelasId ? [t.kelasId] : db.kelas.map((k) => k.id)),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul?.trim()) {
      alert('Judul tugas harus diisi');
      return;
    }

    if (editingTugas) {
      const finalStatus = form.status === 'Draft' || form.statusPublikasi === 'Draft' ? 'Draft' : 'Publish';
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        tugas: prev.tugas.map((item) =>
          item.id === editingTugas.id
            ? ({
                ...item,
                ...form,
                status: finalStatus as any,
                statusPublikasi: finalStatus as any,
              } as Tugas)
            : item
        ),
      }));
    } else {
      const finalStatus = form.status === 'Draft' || form.statusPublikasi === 'Draft' ? 'Draft' : 'Publish';
      const newT: Tugas = {
        id: `tug-${Date.now()}`,
        judul: form.judul || 'Tugas Baru',
        subJudul: form.subJudul || '',
        kategori: form.kategori || 'Praktik Gerak Mandiri',
        instruksi: form.instruksi || '',
        deadline: form.deadline || '2026-09-30T23:59',
        kelasIds: form.kelasIds && form.kelasIds.length > 0 ? form.kelasIds : db.kelas.map((k) => k.id),
        status: finalStatus,
        statusPublikasi: finalStatus,
        dibuatOleh: currentUser.name,
        guruNama: currentUser.name,
        dibuatPada: new Date().toISOString().slice(0, 10),
      };
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        tugas: [newT, ...prev.tugas],
      }));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, judul: string) => {
    if (window.confirm(`Yakin ingin menghapus tugas "${judul}"?`)) {
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        tugas: prev.tugas.filter((item) => item.id !== id),
        pengumpulanTugas: prev.pengumpulanTugas.filter((p) => p.tugasId !== id),
      }));
    }
  };

  const handleOpenReview = (submission: PengumpulanTugas) => {
    setActiveReviewSubmission(submission);
    setReviewNilai(submission.nilai ?? 85);
    setReviewCatatan(submission.komentarGuru || submission.catatanGuru || '');
  };

  const handleSaveNilai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewSubmission) return;

    dataStorage.updateDatabase((prev) => {
      const updatedSubmissions = prev.pengumpulanTugas.map((sub) => {
        if (sub.id === activeReviewSubmission.id) {
          return {
            ...sub,
            nilai: Number(reviewNilai),
            komentarGuru: reviewCatatan,
            catatanGuru: reviewCatatan,
            status: 'Dinilai' as const,
          };
        }
        return sub;
      });

      return {
        ...prev,
        pengumpulanTugas: updatedSubmissions,
      };
    });

    setActiveReviewSubmission(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md text-sky-200">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Penugasan Mandiri & Analisis Gerak PJOK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tugas PJOK
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Kelola penugasan rekaman video gerak, analisis taktik pertandingan, dan tinjau hasil pengerjaan serta penilaian murid.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 backdrop-blur-xs border border-white/20"
            >
              <Upload className="w-4 h-4 text-sky-200" />
              <span>Upload Tugas</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-white text-sky-950 hover:bg-sky-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              Buat Tugas Baru
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/15">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <p className="text-[11px] text-sky-200 font-medium">Total Tugas</p>
            <p className="text-xl font-black mt-0.5">{db.tugas.length}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <p className="text-[11px] text-sky-200 font-medium">Pengumpulan Masuk</p>
            <p className="text-xl font-black mt-0.5">{allSubmissions.length}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <p className="text-[11px] text-amber-200 font-medium">Menunggu Penilaian</p>
            <p className="text-xl font-black mt-0.5 text-amber-300">{waitingGrading}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <p className="text-[11px] text-emerald-200 font-medium">Sudah Dinilai</p>
            <p className="text-xl font-black mt-0.5 text-emerald-300">{gradedSubmissions}</p>
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation (Daftar Tugas vs Rekap Pengumpulan) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTab('tugas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedTab === 'tugas'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Daftar Tugas PJOK ({db.tugas.length})
          </button>
          <button
            onClick={() => setSelectedTab('pengumpulan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedTab === 'pengumpulan'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Review Pengumpulan Murid ({allSubmissions.length})
            {waitingGrading > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-extrabold">
                {waitingGrading}
              </span>
            )}
          </button>
        </div>

        {/* Filter Kelas & Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-48 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas / siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <select
            value={filterPublikasi}
            onChange={(e) => setFilterPublikasi(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Status Publikasi</option>
            <option value="Publish">🟢 Diterbitkan (Publish)</option>
            <option value="Draft">🟡 Draft (Belum Terbit)</option>
          </select>

          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Rombel</option>
            {db.kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: DAFTAR TUGAS PJOK */}
      {selectedTab === 'tugas' && (
        <div className="space-y-4">
          {filteredTugas.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-800 text-sm">Tidak ada tugas ditemukan</h3>
              <p className="text-xs text-slate-500">
                Silakan buat tugas praktik gerak atau analisis video baru untuk siswa Anda.
              </p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Buat Tugas Baru
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTugas.map((t) => {
                const subs = db.pengumpulanTugas.filter((p) => p.tugasId === t.id);
                const pendingCount = subs.filter((p) => p.nilai === undefined || p.nilai === null).length;
                const isDraft = t.status === 'Draft' || t.statusPublikasi === 'Draft';

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                      isDraft ? 'border-amber-200/80 bg-amber-50/10' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[10px] font-extrabold">
                            {t.kategori || 'Praktik Gerak'}
                          </span>

                          {/* Status Publikasi Badge */}
                          {!isDraft ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Terbit (Publish)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Draft
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Batas: {new Date(t.deadline).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePublikasi(t)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                              isDraft
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                            }`}
                            title={isDraft ? 'Publikasikan ke siswa sekarang' : 'Tarik kembali ke Draft'}
                          >
                            {isDraft ? 'Terbitkan' : 'Jadikan Draft'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Tugas"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.judul)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 leading-snug">
                          {t.judul}
                        </h3>
                        {t.subJudul && (
                          <p className="text-xs text-sky-700 font-bold mt-1">
                            {t.subJudul}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                          {t.instruksi}
                        </p>
                      </div>

                      {/* Target Classes */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-semibold">Target Rombel:</span>
                        {t.kelasIds && t.kelasIds.length > 0 ? (
                          t.kelasIds.slice(0, 3).map((cid) => {
                            const k = (db.kelas || []).find((kls) => kls.id === cid);
                            return (
                              <span
                                key={cid}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold"
                              >
                                {k?.nama || cid}
                              </span>
                            );
                          })
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                            Semua Rombel
                          </span>
                        )}
                        {t.kelasIds && t.kelasIds.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{t.kelasIds.length - 3} lagi</span>
                        )}
                      </div>
                    </div>

                    {/* Footer / Submissions review action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-slate-700">{subs.length} Siswa</span>{' '}
                        <span className="text-slate-400 text-[11px]">mengumpulkan</span>
                        {pendingCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                            {pendingCount} belum dinilai
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTugasId(t.id);
                          setSelectedTab('pengumpulan');
                        }}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Tinjau Pengumpulan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVIEW PENGUMPULAN SISWA */}
      {selectedTab === 'pengumpulan' && (
        <div className="space-y-4">
          {/* Submissions Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Pilih Tugas:</span>
              <select
                value={selectedTugasId}
                onChange={(e) => setSelectedTugasId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Semua">Semua Penugasan</option>
                {db.tugas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.judul}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status Penilaian:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterPengumpulanStatus('semua')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterPengumpulanStatus === 'semua' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Semua ({allSubmissions.length})
                </button>
                <button
                  onClick={() => setFilterPengumpulanStatus('menunggu')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterPengumpulanStatus === 'menunggu'
                      ? 'bg-amber-400 text-slate-900 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Belum Dinilai ({waitingGrading})
                </button>
                <button
                  onClick={() => setFilterPengumpulanStatus('dinilai')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterPengumpulanStatus === 'dinilai'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Selesai Dinilai ({gradedSubmissions})
                </button>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-800 text-sm">Tidak ada pengumpulan</h3>
              <p className="text-xs text-slate-500">
                Belum ada murid yang mengumpulkan tugas dengan filter yang dipilih saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const tugasObj = (db.tugas || []).find((t) => t.id === sub.tugasId);
                const muridObj = (db.users || []).find((m) => m.id === sub.muridId);
                const kelasObj = (db.kelas || []).find((k) => k.id === (sub.kelasId || muridObj?.kelasId));
                const isGraded = sub.nilai !== undefined && sub.nilai !== null;

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-800">{sub.muridNama}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                            Kelas {kelasObj?.nama || muridObj?.kelasId || 'XI'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • Dikumpulkan: {sub.tanggalKumpul}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-sky-700 mt-0.5">
                          Tugas: {sub.tugasJudul || tugasObj?.judul || 'Praktik Gerak PJOK'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isGraded ? (
                          <div className="text-right">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs inline-flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Nilai: {sub.nilai}
                            </span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Menunggu Penilaian
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenReview(sub)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          {isGraded ? 'Edit Nilai / Masukan' : 'Beri Nilai & Evaluasi'}
                        </button>
                      </div>
                    </div>

                    {/* Student notes & attachment links */}
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs">
                      {sub.isiJawaban || sub.catatanSiswa ? (
                        <p className="text-slate-700 leading-relaxed italic">
                          "{sub.isiJawaban || sub.catatanSiswa}"
                        </p>
                      ) : (
                        <p className="text-slate-400 italic">Tidak ada catatan pengantar dari murid.</p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        {sub.linkVideo && (
                          <button
                            type="button"
                            onClick={() =>
                              setMediaModal({
                                isOpen: true,
                                url: sub.linkVideo!,
                                title: `Video Tugas - ${sub.muridNama}`,
                                category: 'Video Tugas Siswa',
                              })
                            }
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-rose-100 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" /> Lihat Video Gerakan Siswa
                          </button>
                        )}
                        {sub.fileUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setMediaModal({
                                isOpen: true,
                                url: sub.fileUrl!,
                                title: `Dokumen Tugas - ${sub.muridNama}`,
                                category: 'Dokumen / Portofolio',
                              })
                            }
                            className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-sky-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> Lihat Dokumen / Portofolio
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teacher feedback display */}
                    {(sub.komentarGuru || sub.catatanGuru) && (
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[11px] text-emerald-800">
                            Masukan & Catatan Guru:
                          </span>
                          <p className="mt-0.5">{sub.komentarGuru || sub.catatanGuru}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review & Input Nilai Modal */}
      {activeReviewSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setActiveReviewSubmission(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 font-bold text-[10px] rounded-full">
                Form Penilaian Guru
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                Penilaian Tugas: {activeReviewSubmission.muridNama}
              </h3>
              <p className="text-xs text-slate-500">
                {activeReviewSubmission.tugasJudul || 'Tugas Praktik PJOK'}
              </p>
            </div>

            <form onSubmit={handleSaveNilai} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nilai Akhir Tugas (Skala 0 - 100) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={reviewNilai}
                    onChange={(e) => setReviewNilai(Number(e.target.value))}
                    className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                  />
                  <span className="text-xs text-slate-400">
                    {reviewNilai >= 85 ? 'Sangat Baik (A)' : reviewNilai >= 75 ? 'Baik (B)' : 'Cukup (C)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Umpan Balik & Catatan Guru untuk Siswa
                </label>
                <textarea
                  rows={3}
                  placeholder="Misal: Posisi lutut dan siku sudah tepat, perhatikan perkenaan bola pada lengan bawah..."
                  value={reviewCatatan}
                  onChange={(e) => setReviewCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReviewSubmission(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 shadow-sm"
                >
                  Simpan Nilai & Masukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Tugas Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 font-bold text-[10px] rounded-full">
                {editingTugas ? 'Edit Penugasan' : 'Penugasan Baru'}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                {editingTugas ? 'Edit Tugas PJOK' : 'Buat Penugasan PJOK Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Berikan instruksi jelas bagi peserta didik untuk mempraktikkan atau menganalisis gerak.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Tugas PJOK *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Analisis Video & Praktik Mandiri Passing Bawah"
                  value={form.judul || ''}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub Judul Tugas (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Teknik Dasar & Variasi Gerakan Mandiri di Rumah"
                  value={form.subJudul || ''}
                  onChange={(e) => setForm({ ...form, subJudul: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {/* Status Publikasi Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Status Publikasi</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.status !== 'Draft' && form.statusPublikasi !== 'Draft'
                        ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusPublikasiTugas"
                      checked={form.status !== 'Draft' && form.statusPublikasi !== 'Draft'}
                      onChange={() => setForm({ ...form, status: 'Publish', statusPublikasi: 'Publish' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-extrabold text-xs flex items-center gap-1 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terbitkan (Publish)
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Siswa dapat langsung melihat & mengumpulkan tugas</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.status === 'Draft' || form.statusPublikasi === 'Draft'
                        ? 'bg-amber-50/70 border-amber-400 text-amber-950 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusPublikasiTugas"
                      checked={form.status === 'Draft' || form.statusPublikasi === 'Draft'}
                      onChange={() => setForm({ ...form, status: 'Draft', statusPublikasi: 'Draft' })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="font-extrabold text-xs flex items-center gap-1 text-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Simpan Draft
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Disimpan sebagai draf, belum dapat dilihat siswa</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Tugas</label>
                  <select
                    value={form.kategori || 'Praktik Gerak Mandiri'}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Waktu (Deadline) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.deadline || '2026-09-30T23:59'}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Target Kelas Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Target Kelas / Rombel</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {db.kelas.map((k) => {
                    const isChecked = form.kelasIds?.includes(k.id) ?? false;
                    return (
                      <label key={k.id} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = form.kelasIds || [];
                            if (e.target.checked) {
                              setForm({ ...form, kelasIds: [...cur, k.id] });
                            } else {
                              setForm({ ...form, kelasIds: cur.filter((id) => id !== k.id) });
                            }
                          }}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="font-semibold text-slate-700">{k.nama}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instruksi Lengkap Tugas *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Instruksikan siswa untuk merekam video berdurasi 30-60 detik, memperhatikan sudut pandang kamera, dan aspek yang dinilai..."
                  value={form.instruksi || ''}
                  onChange={(e) => setForm({ ...form, instruksi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 shadow-sm"
                >
                  {editingTugas ? 'Simpan Perubahan' : 'Terbitkan Tugas'}
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

      {/* Upload Data Modal */}
      <UploadDataModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        type="tugas"
        onImport={handleImportTugas}
      />
    </div>
  );
};
