import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  Phone,
  User,
  FileText,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  HelpCircle,
  Activity,
  HeartPulse,
  Award,
} from 'lucide-react';
import { User as UserType, KategoriIzin, PengajuanIzin, NotifikasiItem } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';
import { processDocumentOrProofImage } from '../../utils/imageHelper';

interface ModalAjukanIzinProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  db: LMSDatabase;
  onSuccess?: () => void;
}

export const ModalAjukanIzin: React.FC<ModalAjukanIzinProps> = ({
  isOpen,
  onClose,
  currentUser,
  db,
  onSuccess,
}) => {
  const [kategori, setKategori] = useState<KategoriIzin>('Sakit');
  const [tanggalMulai, setTanggalMulai] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [namaOrangTua, setNamaOrangTua] = useState<string>('');
  const [noHpOrangTua, setNoHpOrangTua] = useState<string>('');
  const [alasan, setAlasan] = useState<string>('');

  // Upload Surat
  const [suratUrl, setSuratUrl] = useState<string>('');
  const [namaSurat, setNamaSurat] = useState<string>('');
  const [isUploadingSurat, setIsUploadingSurat] = useState<boolean>(false);

  // Upload Foto Bersama Ortu
  const [fotoBersamaUrl, setFotoBersamaUrl] = useState<string>('');
  const [namaFotoBersama, setNamaFotoBersama] = useState<string>('');
  const [isUploadingFotoBersama, setIsUploadingFotoBersama] = useState<boolean>(false);

  // Preview Image Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const suratInputRef = useRef<HTMLInputElement>(null);
  const fotoBersamaInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSuratFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      setIsUploadingSurat(true);
      setErrorMessage(null);
      const dataUrl = await processDocumentOrProofImage(file);
      setSuratUrl(dataUrl);
      setNamaSurat(file.name);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses file surat izin.');
    } finally {
      setIsUploadingSurat(false);
    }
  };

  const handleFotoBersamaFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      setIsUploadingFotoBersama(true);
      setErrorMessage(null);
      const dataUrl = await processDocumentOrProofImage(file);
      setFotoBersamaUrl(dataUrl);
      setNamaFotoBersama(file.name);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses foto bersama orang tua.');
    } finally {
      setIsUploadingFotoBersama(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!tanggalMulai) {
      setErrorMessage('Silakan pilih tanggal izin/sakit.');
      return;
    }
    if (!namaOrangTua.trim()) {
      setErrorMessage('Nama orang tua atau wali wajib diisi.');
      return;
    }
    if (!noHpOrangTua.trim()) {
      setErrorMessage('Nomor HP/WhatsApp orang tua wajib diisi untuk verifikasi pihak sekolah.');
      return;
    }
    if (!alasan.trim()) {
      setErrorMessage('Silakan tuliskan alasan lengkap tidak dapat mengikuti pembelajaran PJOK.');
      return;
    }
    if (!suratUrl) {
      setErrorMessage('Wajib mengunggah surat izin/sakit yang telah ditandatangani oleh orang tua/wali.');
      return;
    }
    if (!fotoBersamaUrl) {
      setErrorMessage('Wajib mengunggah foto murid bersama orang tua sambil menunjukkan surat fisik.');
      return;
    }

    try {
      setIsSubmitting(true);
      const userKelas = (db.kelas || []).find((k) => k.id === currentUser.kelasId);
      const kelasNama = userKelas ? `Kelas ${userKelas.nama}` : currentUser.kelasId || 'XI 1';

      const newPengajuan: PengajuanIzin = {
        id: `izin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        muridId: currentUser.id,
        muridNama: currentUser.name,
        muridNis: currentUser.nis || '',
        kelasId: currentUser.kelasId || '',
        kelasNama: kelasNama,
        tanggal: tanggalMulai,
        tanggalSelesai: isMultiDay && tanggalSelesai ? tanggalSelesai : tanggalMulai,
        kategori,
        alasan: alasan.trim(),
        namaOrangTua: namaOrangTua.trim(),
        noHpOrangTua: noHpOrangTua.trim(),
        suratUrl,
        namaSurat: namaSurat || 'Surat_Izin.jpg',
        fotoBersamaOrangTuaUrl: fotoBersamaUrl,
        namaFotoBersama: namaFotoBersama || 'Foto_Bersama_Ortu.jpg',
        status: 'Menunggu',
        tanggalPengajuan: new Date().toISOString(),
      };

      // Notification for teachers
      const notifItem: NotifikasiItem = {
        id: `notif-izin-${Date.now()}`,
        judul: `Pengajuan ${kategori}: ${currentUser.name}`,
        pesan: `${currentUser.name} (${kelasNama}) mengirimkan surat ${kategori.toLowerCase()} untuk tgl ${tanggalMulai}. Menunggu verifikasi guru.`,
        waktu: 'Baru saja',
        tipe: 'presensi',
        dibaca: false,
      };

      dataStorage.updateDatabase((prev) => {
        const existingList = Array.isArray(prev.pengajuanIzin) ? prev.pengajuanIzin : [];
        const existingNotif = Array.isArray(prev.notifikasi) ? prev.notifikasi : [];
        return {
          ...prev,
          pengajuanIzin: [newPengajuan, ...existingList],
          notifikasi: [notifItem, ...existingNotif],
        };
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mengirim pengajuan izin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-800 via-teal-800 to-emerald-800 text-white flex items-center justify-between">
            <div>
              <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-md backdrop-blur-xs">
                Formulir Presensi Khusus Siswa
              </span>
              <h2 className="text-lg sm:text-xl font-black mt-1 tracking-tight">
                Pengajuan Izin, Sakit & Dispensasi
              </h2>
              <p className="text-xs text-sky-100 mt-0.5">
                Kirimkan surat permohonan bertandatangan orang tua dan foto bukti otentik
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Kategori Pilihan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Keterangan / Kategori Ketidakhadiran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setKategori('Sakit')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    kategori === 'Sakit'
                      ? 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${kategori === 'Sakit' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-xs">Sakit (S)</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Kurang sehat / rawat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKategori('Izin')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    kategori === 'Izin'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${kategori === 'Izin' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-xs">Izin (I)</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Urusan keluarga / darurat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKategori('Dispensasi')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    kategori === 'Dispensasi'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${kategori === 'Dispensasi' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-xs">Dispensasi (D)</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Tugas sekolah / lomba</span>
                </button>
              </div>
            </div>

            {/* Tanggal Izin */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Tanggal Tidak Masuk / Izin <span className="text-rose-500">*</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isMultiDay}
                    onChange={(e) => setIsMultiDay(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Lebih dari 1 hari?</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    {isMultiDay ? 'Tanggal Mulai:' : 'Tanggal Pembelajaran PJOK:'}
                  </span>
                  <input
                    type="date"
                    required
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {isMultiDay && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      Sampai Tanggal:
                    </span>
                    <input
                      type="date"
                      required
                      min={tanggalMulai}
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Data Orang Tua / Wali */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: I Wayan Sudarma, S.Pd."
                  value={namaOrangTua}
                  onChange={(e) => setNamaOrangTua(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  No. HP / WA Orang Tua <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={noHpOrangTua}
                  onChange={(e) => setNoHpOrangTua(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Alasan Lengkap */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Alasan Lengkap Ketidakhadiran <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Tuliskan secara jelas alasan izin/sakit/dispensasi secara santun dan jujur..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            {/* Upload Bagian 1: Surat Ditandatangani Orang Tua */}
            <div className="space-y-2 p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" />
                    1. Upload Surat yang Ditandatangani Orang Tua / Wali <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Surat izin tulis tangan atau surat dokter berstempel & bertandatangan basah orang tua/wali.
                  </p>
                </div>
              </div>

              {suratUrl ? (
                <div className="p-3 bg-white rounded-xl border border-sky-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={suratUrl}
                      alt="Preview Surat"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {namaSurat || 'Surat Bertandatangan'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Berkas Siap Dikirim
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: suratUrl, title: 'Surat Izin Bertandatangan Ortu' })}
                      className="p-1.5 text-sky-700 hover:bg-sky-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuratUrl('');
                        setNamaSurat('');
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                      title="Hapus / Ganti"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => suratInputRef.current?.click()}
                  className="p-4 bg-white border-2 border-dashed border-sky-300 rounded-xl text-center hover:bg-sky-50/60 transition cursor-pointer"
                >
                  <input
                    ref={suratInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleSuratFileChange(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="p-2.5 bg-sky-100 text-sky-700 rounded-full">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-sky-900">
                      {isUploadingSurat ? 'Memproses Berkas...' : 'Klik untuk Pilih Foto Surat atau Dokumen PDF'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Mendukung JPG, PNG, atau scan PDF (Kamera HP / Galeri)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Bagian 2: Foto Bersama Orang Tua Sambil Menunjukkan Surat */}
            <div className="space-y-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    2. Upload Foto Bersama Orang Tua Sambil Menunjukkan Surat <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Foto otentik siswa bersama orang tua/wali memegang surat tersebut untuk validasi kebenaran izin oleh guru.
                  </p>
                </div>
              </div>

              {fotoBersamaUrl ? (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={fotoBersamaUrl}
                      alt="Preview Foto Bersama Ortu"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {namaFotoBersama || 'Foto Bersama Orang Tua'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Foto Otentik Siap Dikirim
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: fotoBersamaUrl, title: 'Foto Bersama Orang Tua Memegang Surat' })}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFotoBersamaUrl('');
                        setNamaFotoBersama('');
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                      title="Hapus / Ganti"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fotoBersamaInputRef.current?.click()}
                  className="p-4 bg-white border-2 border-dashed border-emerald-300 rounded-xl text-center hover:bg-emerald-50/60 transition cursor-pointer"
                >
                  <input
                    ref={fotoBersamaInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFotoBersamaFileChange(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-full">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-900">
                      {isUploadingFotoBersama ? 'Memproses Foto...' : 'Klik untuk Ambil / Upload Foto Bersama Ortu & Surat'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ambil foto selfie/berdua bersama orang tua sambil memperlihatkan surat fisik
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi Form */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingSurat || isUploadingFotoBersama}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim Surat...' : 'Kirim Pengajuan Izin'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Zoom Gambar Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden p-3 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 text-white">
              <span className="text-xs font-extrabold">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-3 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImage.url}
                alt="Zoom Preview"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
