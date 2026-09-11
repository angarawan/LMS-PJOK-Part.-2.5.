import React, { useState } from 'react';
import {
  School,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Shield,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { SettingsApp, User } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';

interface SchoolSettingsProps {
  db: LMSDatabase;
  currentUser: User;
  onOpenSheets: () => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ db, currentUser, onOpenSheets }) => {
  const [settings, setSettings] = useState<SettingsApp>(() => ({
    namaSekolah: 'SMAN 1 Olahraga Nusantara',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    namaKepalaSekolah: 'Dr. Drs. I Nyoman Sukadana, M.Pd.',
    nipKepalaSekolah: '19690815 199412 1 002',
    namaGuruPJOKUtama: 'Haryono, S.Pd.Jas, M.Or.',
    nipGuruPJOKUtama: '19850314 201001 1 018',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    temaWarna: 'Biru & Hijau Sportif',
    terakhirSinkron: new Date().toISOString(),
    ...(db?.settings || {}),
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanConfirmInput, setCleanConfirmInput] = useState('');
  const [isProcessingClean, setIsProcessingClean] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      settings,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackupData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Backup_LMS_PJOK_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.users && parsed.kelas) {
            dataStorage.updateDatabase(() => parsed);
            alert('Data LMS berhasil direstore secara lengkap!');
          } else {
            alert('Format file backup tidak valid.');
          }
        } catch (err) {
          alert('Gagal membaca file JSON backup.');
        }
      };
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset database kembali ke contoh data awal sekolah (31 siswa demo + materi bawaan)?')) {
      dataStorage.resetToDefault();
      alert('Data telah direset kembali ke konfigurasi awal.');
      window.location.reload();
    }
  };

  const handleExecuteCleanSlate = () => {
    setIsProcessingClean(true);
    try {
      dataStorage.resetToCleanSlate(true);
      setShowCleanModal(false);
      alert(
        'Berhasil!\n\nSeluruh data siswa, materi, tugas, kuis, presensi, dan nilai telah dikosongkan (0).\n\nAkun login Admin & Guru serta tautan Google Spreadsheet Anda tetap aman tersimpan.'
      );
      window.location.reload();
    } catch (e: any) {
      alert('Terjadi kesalahan saat mengosongkan data: ' + (e?.message || 'Unknown error'));
      setIsProcessingClean(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Pengaturan Sistem & Profil Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Konfigurasi identitas lembaga, tahun pelajaran, semester, sinkronisasi cloud, dan backup data
          </p>
        </div>

        <button
          onClick={onOpenSheets}
          className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Sinkronisasi Google Sheets
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Pengaturan sekolah berhasil disimpan dan diperbarui!
        </div>
      )}

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <School className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
            Identitas Sekolah & Akademik
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Nama Sekolah</label>
            <input
              type="text"
              required
              value={settings.namaSekolah}
              onChange={(e) => setSettings({ ...settings, namaSekolah: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Logo Sekolah (URL)
            </label>
            <input
              type="text"
              value={settings.logoSekolah || ''}
              onChange={(e) => setSettings({ ...settings, logoSekolah: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Tahun Pelajaran
            </label>
            <input
              type="text"
              required
              value={settings.tahunPelajaran}
              onChange={(e) => setSettings({ ...settings, tahunPelajaran: e.target.value })}
              placeholder="2026/2027"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Semester Aktif</label>
            <select
              value={settings.semesterAktif}
              onChange={(e) => setSettings({ ...settings, semesterAktif: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="1 (Ganjil)">Semester 1 (Ganjil)</option>
              <option value="2 (Genap)">Semester 2 (Genap)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nama Kepala Sekolah
            </label>
            <input
              type="text"
              value={settings.kepalaSekolahNama || ''}
              onChange={(e) => setSettings({ ...settings, kepalaSekolahNama: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              NIP Kepala Sekolah
            </label>
            <input
              type="text"
              value={settings.kepalaSekolahNip || ''}
              onChange={(e) => setSettings({ ...settings, kepalaSekolahNip: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Guru Pengampu PJOK
            </label>
            <input
              type="text"
              value={settings.guruPjokNama || ''}
              onChange={(e) => setSettings({ ...settings, guruPjokNama: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">NIP Guru PJOK</label>
            <input
              type="text"
              value={settings.guruPjokNip || ''}
              onChange={(e) => setSettings({ ...settings, guruPjokNip: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" /> Simpan Pengaturan Sekolah
          </button>
        </div>
      </form>

      {/* Backup & Restore Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-sky-600" />
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
            Manajemen Data & Cadangan (Backup / Restore)
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Unduh salinan berkas data utuh (seluruh pengguna, rombel, materi, tugas, nilai, dan presensi)
          atau pulihkan dari berkas cadangan JSON sebelumnya.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleBackupData}
            className="p-3.5 bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Backup Database JSON
          </button>

          <label className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Restore Database JSON
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreData}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetSampleData}
            className="p-3.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            title="Kembalikan ke data percontohan awal (31 siswa demo + kuis bawaan)"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Data Contoh (Demo)
          </button>
        </div>
      </div>

      {/* Danger Zone: Mulai dari Nol (Kosongkan Data LMS) */}
      <div className="bg-linear-to-b from-rose-50/60 to-white rounded-3xl p-6 sm:p-8 border-2 border-rose-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-rose-900 uppercase tracking-wider">
                Mulai Mengisi dari Nol (Kosongkan Database LMS)
              </h3>
              <p className="text-[11px] text-rose-600/80 font-medium">
                Bersihkan seluruh siswa & modul pembelajaran agar siap diisi dari nol atau disinkronkan dari Google Sheets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCleanConfirmInput('');
              setShowCleanModal(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Kosongkan Data (Mulai dari Nol)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-white/80 rounded-2xl border border-rose-100 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Data yang Akan Dikosongkan (0):</span>
            </div>
            <ul className="text-slate-600 text-[11px] space-y-1 list-disc list-inside">
              <li>Seluruh data <strong>Murid</strong> (31 siswa contoh dihapus)</li>
              <li>Seluruh <strong>Materi Pembelajaran</strong> PJOK</li>
              <li>Seluruh <strong>Tugas & Pengumpulan Tugas</strong></li>
              <li>Seluruh <strong>Bank Kuis & Jawaban Ujian</strong></li>
              <li>Seluruh <strong>Riwayat Presensi, Jurnal & Nilai</strong></li>
            </ul>
          </div>

          <div className="p-3.5 bg-white/80 rounded-2xl border border-emerald-100 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Data yang Tetap AMAN & Tersimpan:</span>
            </div>
            <ul className="text-slate-600 text-[11px] space-y-1 list-disc list-inside">
              <li><strong>Google Spreadsheet Anda:</strong> 100% AMAN di Google Drive (tidak akan terhapus)</li>
              <li><strong>Akun Admin & Guru:</strong> Tetap aktif untuk login (Anda tidak akan terkunci)</li>
              <li><strong>Tautan Spreadsheet & Webhook:</strong> Tetap tersambung di pengaturan</li>
              <li><strong>Profil & Identitas Sekolah:</strong> Nama sekolah & semester tetap utuh</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCleanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Konfirmasi Kosongkan Data LMS
                  </h4>
                  <p className="text-xs text-rose-700 font-medium">
                    Tindakan ini akan mengosongkan seluruh konten & murid
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCleanModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                  Kecuali Data Google Spreadsheet:
                </p>
                <p className="text-[11px] text-emerald-700">
                  Data pada <strong>Google Spreadsheet Anda TIDAK AKAN terhapus</strong> atau terganggu. Anda dapat mengimpor data siswa atau nilai dari Spreadsheet kapan saja setelah proses reset ini selesai.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 space-y-1">
                <p className="font-bold">Akun Login Pengelola Tetap Aman:</p>
                <p className="text-[11px] text-amber-700">
                  Akun login <strong>Admin</strong> dan <strong>Guru</strong> tetap dipertahankan dengan username & kata sandi yang sama.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-bold">
                  Untuk konfirmasi, ketik kata <span className="text-rose-600 font-mono font-black">RESET</span> di bawah ini:
                </label>
                <input
                  type="text"
                  value={cleanConfirmInput}
                  onChange={(e) => setCleanConfirmInput(e.target.value)}
                  placeholder="Ketik RESET di sini"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold tracking-widest text-rose-700 focus:bg-white focus:outline-hidden focus:border-rose-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCleanModal(false)}
                  disabled={isProcessingClean}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCleanSlate}
                  disabled={cleanConfirmInput.trim().toUpperCase() !== 'RESET' || isProcessingClean}
                  className={`px-5 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                    cleanConfirmInput.trim().toUpperCase() === 'RESET' && !isProcessingClean
                      ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessingClean ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Membersihkan Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Ya, Kosongkan Data Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
