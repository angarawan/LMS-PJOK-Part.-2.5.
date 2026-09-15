import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarRange,
  Clock,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Users,
  TrendingUp,
  X,
  School,
  Layers,
  FileText,
  BarChart3,
  Award,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { JurnalMengajar, User, getTeacherAssignedClasses } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';

interface RekapJurnalViewProps {
  db: LMSDatabase;
  currentUser: User;
  onOpenAdd?: () => void;
}

export const RekapJurnalView: React.FC<RekapJurnalViewProps> = ({
  db,
  currentUser,
  onOpenAdd,
}) => {
  // Available classes for this teacher
  const availableClasses = useMemo(() => {
    if (currentUser?.role === 'GURU') {
      const assigned = getTeacherAssignedClasses(currentUser, db.kelas);
      return assigned.length > 0 ? assigned : db.kelas;
    }
    return db.kelas;
  }, [currentUser, db.kelas]);

  // Mode: 'bulanan' | 'keseluruhan'
  const [rekapMode, setRekapMode] = useState<'bulanan' | 'keseluruhan'>('bulanan');
  const [selectedFilterKelasId, setSelectedFilterKelasId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Month formatting helper: "2026-09" -> "September 2026"
  const formatMonthLabel = (yearMonth: string) => {
    if (!yearMonth || yearMonth.length < 7) return yearMonth;
    const [y, m] = yearMonth.split('-');
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const mIndex = parseInt(m, 10) - 1;
    return `${monthNames[mIndex] || m} ${y}`;
  };

  // Date formatting helper
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      const day = dayNames[date.getDay()];
      const d = date.getDate();
      const m = monthNames[date.getMonth()];
      const y = date.getFullYear();
      return `${day}, ${d} ${m} ${y}`;
    } catch {
      return dateStr;
    }
  };

  // Distinct available months from actual journal records + current month
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const currentYM = new Date().toISOString().slice(0, 7);
    monthSet.add(currentYM);

    (db.jurnal || []).forEach((j) => {
      if (j.tanggal && j.tanggal.length >= 7) {
        monthSet.add(j.tanggal.slice(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse(); // newest first
  }, [db.jurnal]);

  const [selectedBulan, setSelectedBulan] = useState<string>(
    availableMonths[0] || new Date().toISOString().slice(0, 7)
  );

  // Modals
  const [selectedJurnalDetail, setSelectedJurnalDetail] = useState<JurnalMengajar | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filtered journals for the teacher
  const baseJurnalList = useMemo(() => {
    return (db.jurnal || []).filter((j) => {
      if (currentUser?.role === 'GURU') {
        const isAssigned = availableClasses.some(
          (k) => k.id === j.kelasId || k.nama === j.kelasNama
        );
        if (!isAssigned) return false;
      }
      return true;
    });
  }, [db.jurnal, currentUser, availableClasses]);

  // Main filtered journal based on rekapMode, selectedBulan, class, and search
  const filteredJurnal = useMemo(() => {
    return baseJurnalList
      .filter((j) => {
        // Mode Bulanan vs Keseluruhan
        if (rekapMode === 'bulanan') {
          if (!j.tanggal || !j.tanggal.startsWith(selectedBulan)) return false;
        }

        // Class filter
        if (selectedFilterKelasId !== 'ALL') {
          if (j.kelasId !== selectedFilterKelasId && j.kelasNama !== selectedFilterKelasId) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchMateri = (j.materiJudul || j.materi || '').toLowerCase().includes(q);
          const matchKegiatan = (j.kegiatan || j.kegiatanPembelajaran || '').toLowerCase().includes(q);
          const matchHambatan = (j.hambatan || '').toLowerCase().includes(q);
          const matchTindak = (j.tindakLanjut || '').toLowerCase().includes(q);
          const matchCatatan = (j.catatanKhusus || j.catatanRefleksi || '').toLowerCase().includes(q);
          const matchKelas = (j.kelasNama || '').toLowerCase().includes(q);
          if (!matchMateri && !matchKegiatan && !matchHambatan && !matchTindak && !matchCatatan && !matchKelas) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const diff = (a.tanggal || '').localeCompare(b.tanggal || '');
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [baseJurnalList, rekapMode, selectedBulan, selectedFilterKelasId, searchQuery, sortOrder]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalSesi = filteredJurnal.length;
    let totalHadir = 0;
    let totalTidakHadir = 0;
    let totalHambatan = 0;
    let totalTindakLanjut = 0;

    filteredJurnal.forEach((j) => {
      const h = Number(j.jumlahHadir) || 0;
      const th = Number(j.jumlahTidakHadir) || 0;
      totalHadir += h;
      totalTidakHadir += th;
      if (j.hambatan && j.hambatan.trim()) totalHambatan++;
      if (j.tindakLanjut && j.tindakLanjut.trim()) totalTindakLanjut++;
    });

    const totalPeserta = totalHadir + totalTidakHadir;
    const persenHadir = totalPeserta > 0 ? Math.round((totalHadir / totalPeserta) * 100) : 0;
    const rataHadirPerSesi = totalSesi > 0 ? (totalHadir / totalSesi).toFixed(1) : '0';

    return {
      totalSesi,
      totalHadir,
      totalTidakHadir,
      persenHadir,
      rataHadirPerSesi,
      totalHambatan,
      totalTindakLanjut,
    };
  }, [filteredJurnal]);

  // Per-class breakdown statistics
  const perClassBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        kelasId: string;
        kelasNama: string;
        sesiCount: number;
        hadirCount: number;
        tidakHadirCount: number;
        lastMateri: string;
        lastDate: string;
      }
    > = {};

    availableClasses.forEach((k) => {
      map[k.id] = {
        kelasId: k.id,
        kelasNama: k.nama,
        sesiCount: 0,
        hadirCount: 0,
        tidakHadirCount: 0,
        lastMateri: '-',
        lastDate: '-',
      };
    });

    filteredJurnal.forEach((j) => {
      const targetClass = availableClasses.find((k) => k.id === j.kelasId || k.nama === j.kelasNama);
      const cId = targetClass ? targetClass.id : j.kelasId;

      if (!map[cId]) {
        map[cId] = {
          kelasId: cId,
          kelasNama: j.kelasNama || cId,
          sesiCount: 0,
          hadirCount: 0,
          tidakHadirCount: 0,
          lastMateri: '-',
          lastDate: '-',
        };
      }

      map[cId].sesiCount += 1;
      map[cId].hadirCount += Number(j.jumlahHadir) || 0;
      map[cId].tidakHadirCount += Number(j.jumlahTidakHadir) || 0;
      map[cId].lastMateri = j.materiJudul || j.materi || map[cId].lastMateri;
      map[cId].lastDate = j.tanggal || map[cId].lastDate;
    });

    return Object.values(map).filter((item) => {
      if (selectedFilterKelasId !== 'ALL') {
        return item.kelasId === selectedFilterKelasId;
      }
      return true;
    });
  }, [availableClasses, filteredJurnal, selectedFilterKelasId]);

  // Monthly breakdown overview (when in 'keseluruhan' mode)
  const monthlyBreakdown = useMemo(() => {
    if (rekapMode !== 'keseluruhan') return [];
    const map: Record<string, { bulan: string; label: string; count: number; hadir: number; tidakHadir: number }> = {};

    baseJurnalList.forEach((j) => {
      const ym = (j.tanggal || '').slice(0, 7);
      if (!ym) return;
      if (!map[ym]) {
        map[ym] = {
          bulan: ym,
          label: formatMonthLabel(ym),
          count: 0,
          hadir: 0,
          tidakHadir: 0,
        };
      }
      map[ym].count += 1;
      map[ym].hadir += Number(j.jumlahHadir) || 0;
      map[ym].tidakHadir += Number(j.jumlahTidakHadir) || 0;
    });

    return Object.values(map).sort((a, b) => a.bulan.localeCompare(b.bulan));
  }, [baseJurnalList, rekapMode]);

  // Navigate next/previous month
  const handlePrevMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedBulan);
    if (currentIndex < availableMonths.length - 1) {
      setSelectedBulan(availableMonths[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedBulan);
    if (currentIndex > 0) {
      setSelectedBulan(availableMonths[currentIndex - 1]);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportXLSX = () => {
    try {
      const periodTitle =
        rekapMode === 'bulanan'
          ? `Bulan ${formatMonthLabel(selectedBulan)}`
          : 'Keseluruhan Semester';
      const classTitle =
        selectedFilterKelasId === 'ALL'
          ? 'Semua Kelas'
          : `Kelas ${(availableClasses.find((k) => k.id === selectedFilterKelasId)?.nama || selectedFilterKelasId)}`;

      const data = filteredJurnal.map((j, idx) => {
        const total = (Number(j.jumlahHadir) || 0) + (Number(j.jumlahTidakHadir) || 0);
        const persen = total > 0 ? `${Math.round(((Number(j.jumlahHadir) || 0) / total) * 100)}%` : '0%';

        return {
          No: idx + 1,
          Tanggal: j.tanggal,
          Hari: formatDateIndo(j.tanggal).split(',')[0],
          'Jam Ke': j.jamKe || '-',
          Kelas: j.kelasNama,
          'Materi / Pokok Bahasan': j.materiJudul || j.materi || '-',
          'Kegiatan Pembelajaran': j.kegiatan || j.kegiatanPembelajaran || '-',
          'Jumlah Siswa Hadir': Number(j.jumlahHadir) || 0,
          'Jumlah Siswa Tidak Hadir': Number(j.jumlahTidakHadir) || 0,
          'Persentase Kehadiran': persen,
          'Kendala / Hambatan': j.hambatan || '-',
          'Tindak Lanjut / Solusi': j.tindakLanjut || '-',
          'Catatan Khusus / Refleksi': j.catatanKhusus || j.catatanRefleksi || '-',
          'Guru Pengampu': j.guruNama || currentUser.name,
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      const sheetName = rekapMode === 'bulanan' ? `Rekap_${selectedBulan}` : 'Rekap_Keseluruhan';
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));

      const filename = `Rekap_Jurnal_PJOK_${periodTitle.replace(/\s+/g, '_')}_${classTitle.replace(
        /\s+/g,
        '_'
      )}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
      alert('Terjadi kesalahan saat mengekspor ke Excel.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'No',
        'Tanggal',
        'Jam Ke',
        'Kelas',
        'Materi Pembelajaran',
        'Kegiatan',
        'Hadir',
        'Tidak Hadir',
        '% Hadir',
        'Hambatan',
        'Tindak Lanjut',
        'Catatan Refleksi',
        'Guru Pengampu',
      ];

      const rows = filteredJurnal.map((j, idx) => {
        const total = (Number(j.jumlahHadir) || 0) + (Number(j.jumlahTidakHadir) || 0);
        const persen = total > 0 ? `${Math.round(((Number(j.jumlahHadir) || 0) / total) * 100)}%` : '0%';
        return [
          idx + 1,
          `"${j.tanggal}"`,
          `"${j.jamKe || ''}"`,
          `"${j.kelasNama || ''}"`,
          `"${(j.materiJudul || j.materi || '').replace(/"/g, '""')}"`,
          `"${(j.kegiatan || j.kegiatanPembelajaran || '').replace(/"/g, '""')}"`,
          Number(j.jumlahHadir) || 0,
          Number(j.jumlahTidakHadir) || 0,
          `"${persen}"`,
          `"${(j.hambatan || '').replace(/"/g, '""')}"`,
          `"${(j.tindakLanjut || '').replace(/"/g, '""')}"`,
          `"${(j.catatanKhusus || j.catatanRefleksi || '').replace(/"/g, '""')}"`,
          `"${(j.guruNama || currentUser.name).replace(/"/g, '""')}"`,
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Rekap_Jurnal_PJOK_${rekapMode === 'bulanan' ? selectedBulan : 'Keseluruhan'}_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Gagal mengekspor CSV:', err);
      alert('Terjadi kesalahan saat mengekspor ke CSV.');
    }
  };

  // Generate Sample Jurnal Data (if list is sparse)
  const handleGenerateSampleJurnal = () => {
    const sampleClasses = availableClasses.length > 0 ? availableClasses : db.kelas;
    const targetClass1 = sampleClasses[0] || { id: 'cls-xi-1', nama: 'XI 1' };
    const targetClass2 = sampleClasses[1] || targetClass1;

    const sampleEntries: JurnalMengajar[] = [
      {
        id: `jr-sample-1`,
        tanggal: '2026-09-02',
        jamKe: '1 - 3 (07.15 - 09.30 WIB)',
        kelasId: targetClass1.id,
        kelasNama: targetClass1.nama,
        guruId: currentUser.id,
        guruNama: currentUser.name,
        materiJudul: 'Permainan Bola Voli - Variasi Passing Bawah & Atas',
        kegiatan:
          'Pemanasan statis & dinamis, demonstrasi posisi badan saat passing bawah, drill berpasangan 15 menit, serta evaluasi teknik ayunan lengan.',
        jumlahHadir: 32,
        jumlahTidakHadir: 1,
        hambatan: 'Beberapa siswa masih menekuk siku berlebihan saat perkenaan bola.',
        tindakLanjut: 'Diberikan latihan repetisi ayunan lengan lurus menggunakan dinding pantul.',
        catatanKhusus: 'Siswa antusias dan aktif berpartisipasi dalam drill kelompok.',
      },
      {
        id: `jr-sample-2`,
        tanggal: '2026-09-07',
        jamKe: '4 - 6 (09.45 - 12.00 WIB)',
        kelasId: targetClass2.id,
        kelasNama: targetClass2.nama,
        guruId: currentUser.id,
        guruNama: currentUser.name,
        materiJudul: 'Kebugaran Jasmani - Sirkuit Training Komponen Daya Tahan',
        kegiatan:
          'Pengukuran denyut nadi istirahat, penjelasan 5 pos sirkuit training (push-up, shuttle run, sit-up, burpee, skipping), pelaksanaan 3 set, serta pendinginan.',
        jumlahHadir: 31,
        jumlahTidakHadir: 2,
        hambatan: 'Cuaca lapangan cukup terik menjelang siang hari.',
        tindakLanjut: 'Waktu istirahat antarsirkuit ditambah 30 detik dan disediakan pos hidrasi.',
        catatanKhusus: 'Pencatatan denyut nadi latihan dipahami dengan baik oleh peserta didik.',
      },
      {
        id: `jr-sample-3`,
        tanggal: '2026-09-09',
        jamKe: '1 - 3 (07.15 - 09.30 WIB)',
        kelasId: targetClass1.id,
        kelasNama: targetClass1.nama,
        guruId: currentUser.id,
        guruNama: currentUser.name,
        materiJudul: 'Permainan Bola Voli - Servis Atas & Servis Bawah',
        kegiatan:
          'Apersepsi aturan servis bola voli, peragaan koordinasi lemparan bola dan perkenaan telapak tangan, drill servis menyeberangi net dari jarak 6m dan 9m.',
        jumlahHadir: 33,
        jumlahTidakHadir: 0,
        hambatan: 'Power lemparan bola pada 3 siswi masih kurang stabil.',
        tindakLanjut: 'Bimbingan personal posisi tumpuan kaki kiri dan fokus perkenaan bola pada telapak tangan.',
        catatanKhusus: 'Tingkat keberhasilan servis menyeberangi net mencapai 85%.',
      },
      {
        id: `jr-sample-4`,
        tanggal: '2026-08-19',
        jamKe: '1 - 3 (07.15 - 09.30 WIB)',
        kelasId: targetClass1.id,
        kelasNama: targetClass1.nama,
        guruId: currentUser.id,
        guruNama: currentUser.name,
        materiJudul: 'Atletik - Lari Cepat (Sprint 100 Meter) & Start Jongkok',
        kegiatan:
          'Pemanasan sendi tungkai, teknik aba-aba Bersedia, Siap, Ya pada start block, lari akselerasi 30m, dan sprint penuh 100m berpasangan.',
        jumlahHadir: 30,
        jumlahTidakHadir: 3,
        hambatan: 'Reaksi panggul saat aba-aba "Siap" masih ada yang terlalu lambat terangkat.',
        tindakLanjut: 'Latihan pengulangan respon suara dengan tepukan tangan ritmik.',
        catatanKhusus: 'Semua siswa mengenakan sepatu lari dan mematuhi garis lintasan.',
      },
      {
        id: `jr-sample-5`,
        tanggal: '2026-08-26',
        jamKe: '4 - 6 (09.45 - 12.00 WIB)',
        kelasId: targetClass2.id,
        kelasNama: targetClass2.nama,
        guruId: currentUser.id,
        guruNama: currentUser.name,
        materiJudul: 'Senam Lantai - Rangkaian Guling Depan & Guling Belakang',
        kegiatan:
          'Peregangan leher dan punggung, latihan posisi dagu menempel dada dengan bantuan matras miring, praktik guling depan berulang 5 kali dengan asistensi.',
        jumlahHadir: 32,
        jumlahTidakHadir: 1,
        hambatan: 'Rasa cemas/takut pada 2 siswa saat tubuh berputar ke belakang.',
        tindakLanjut: 'Pendampingan langsung guru pada bahu dan pinggul untuk menjaga keamanan gerak.',
        catatanKhusus: 'Tidak terjadi cedera, matras memenuhi standar kelayakan safety.',
      },
    ];

    dataStorage.updateDatabase((prev) => {
      const existingIds = new Set((prev.jurnal || []).map((j) => j.id));
      const newAdditions = sampleEntries.filter((s) => !existingIds.has(s.id));
      return {
        ...prev,
        jurnal: [...newAdditions, ...(prev.jurnal || [])],
      };
    });
  };

  const periodDisplayName =
    rekapMode === 'bulanan'
      ? `Bulan ${formatMonthLabel(selectedBulan)}`
      : 'Keseluruhan Semester Berjalan';

  return (
    <div className="space-y-6">
      {/* Banner Rekapan Jurnal */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        {/* Subtle Decorative Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Administrasi & Pelaporan Pembelajaran PJOK</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Rekapitulasi Jurnal Mengajar</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold uppercase tracking-wider">
                {rekapMode === 'bulanan' ? 'Mode Bulanan' : 'Mode Keseluruhan'}
              </span>
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Memantau akumulasi tatap muka, sebaran materi pokok per kelas, ketercapaian kehadiran siswa,
              serta inventarisasi kendala dan tindak lanjut pembelajaran PJOK secara terpadu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            {baseJurnalList.length < 3 && (
              <button
                type="button"
                onClick={handleGenerateSampleJurnal}
                className="px-3 py-2 text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Tambahkan 5 contoh jurnal PJOK otomatis untuk uji coba rekap bulanan"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Isi Contoh Rekap (5 Sesi)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportXLSX}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh rekap jurnal ke format spreadsheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh rekap jurnal ke format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Cetak format lembar rekapan dinas resmi A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Lembar Rekap</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="mt-5 pt-5 border-t border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Mode Toggle: Tiap Bulan vs Keseluruhan */}
          <div className="flex items-center bg-black/25 p-1 rounded-2xl border border-white/15 w-fit">
            <button
              type="button"
              onClick={() => setRekapMode('bulanan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                rekapMode === 'bulanan'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Rekap Tiap Bulan</span>
            </button>
            <button
              type="button"
              onClick={() => setRekapMode('keseluruhan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                rekapMode === 'keseluruhan'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rekap Keseluruhan</span>
            </button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bulan Selector (when in 'bulanan' mode) */}
            {rekapMode === 'bulanan' && (
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/15">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={availableMonths.indexOf(selectedBulan) >= availableMonths.length - 1}
                  className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-white/10"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <select
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(e.target.value)}
                    className="text-xs font-bold bg-transparent text-white focus:outline-hidden cursor-pointer"
                  >
                    {availableMonths.map((m) => {
                      const countInMonth = baseJurnalList.filter((j) =>
                        j.tanggal?.startsWith(m)
                      ).length;
                      return (
                        <option key={m} value={m} className="bg-slate-900 text-white">
                          {formatMonthLabel(m)} ({countInMonth} sesi)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={availableMonths.indexOf(selectedBulan) <= 0}
                  className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-white/10"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Filter className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <select
                value={selectedFilterKelasId}
                onChange={(e) => setSelectedFilterKelasId(e.target.value)}
                className="text-xs font-bold bg-transparent text-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  {currentUser?.role === 'GURU' ? 'Semua Kelas Diampu' : 'Semua Kelas'}
                </option>
                {availableClasses.map((k) => (
                  <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                    Kelas {k.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari materi / kegiatan..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white/10 text-white placeholder-slate-300 rounded-xl border border-white/15 focus:outline-hidden focus:bg-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Tatap Muka
            </div>
            <div className="text-xl font-black text-slate-800">
              {stats.totalSesi}{' '}
              <span className="text-xs font-semibold text-slate-400">Pertemuan</span>
            </div>
            <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
              {periodDisplayName}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Kehadiran Siswa
            </div>
            <div className="text-xl font-black text-slate-800">
              {stats.persenHadir}%{' '}
              <span className="text-xs font-semibold text-emerald-600">Rerata</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Total: <strong className="text-emerald-700">{stats.totalHadir}</strong> Hadir
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Hambatan Tercatat
            </div>
            <div className="text-xl font-black text-amber-700">
              {stats.totalHambatan}{' '}
              <span className="text-xs font-semibold text-slate-400">Catatan</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Kendala sarana/cuaca/teknis
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tindak Lanjut Guru
            </div>
            <div className="text-xl font-black text-sky-800">
              {stats.totalTindakLanjut}{' '}
              <span className="text-xs font-semibold text-slate-400">Solusi</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Penyelesaian & diferensiasi
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Overview (if Keseluruhan mode) */}
      {rekapMode === 'keseluruhan' && monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Distribusi Pembelajaran per Bulan (Semester Berjalan)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {monthlyBreakdown.length} Bulan Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {monthlyBreakdown.map((mb) => {
              const totalM = mb.hadir + mb.tidakHadir;
              const pct = totalM > 0 ? Math.round((mb.hadir / totalM) * 100) : 0;
              return (
                <div
                  key={mb.bulan}
                  onClick={() => {
                    setSelectedBulan(mb.bulan);
                    setRekapMode('bulanan');
                  }}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl cursor-pointer transition group"
                >
                  <div className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800">
                    {mb.label}
                  </div>
                  <div className="text-lg font-black text-slate-900 group-hover:text-emerald-700 mt-0.5">
                    {mb.count}{' '}
                    <span className="text-[11px] font-semibold text-slate-400">Pertemuan</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Kehadiran:</span>
                    <strong className="text-emerald-700 font-bold">{pct}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matriks Rekap per Kelas */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Matriks Tatap Muka per Kelas ({periodDisplayName})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {perClassBreakdown.length} Rombel Terdata
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {perClassBreakdown.map((item) => {
            const tot = item.hadirCount + item.tidakHadirCount;
            const pct = tot > 0 ? Math.round((item.hadirCount / tot) * 100) : 0;

            return (
              <div
                key={item.kelasId}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">
                    Kelas {item.kelasNama}
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {item.sesiCount} <span className="font-normal text-slate-400">Sesi</span>
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px]">Rerata Hadir:</span>
                    <span className="font-bold text-emerald-700">{pct}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={item.lastMateri}>
                    Materi: <strong className="text-slate-700">{item.lastMateri}</strong>
                  </div>
                  {item.lastDate !== '-' && (
                    <div className="text-[10px] text-slate-400">
                      Terakhir: {item.lastDate}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">
              Daftar Rinci Jurnal Pembelajaran PJOK
            </h3>
            <p className="text-[11px] text-slate-500">
              Menampilkan {filteredJurnal.length} catatan tatap muka ({periodDisplayName})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Urutan: {sortOrder === 'asc' ? 'Terlama ➜ Terbaru' : 'Terbaru ➜ Terlama'}</span>
            </button>
          </div>
        </div>

        {filteredJurnal.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">
              Belum ada catatan jurnal mengajar pada periode{' '}
              <strong className="text-slate-600">{periodDisplayName}</strong> untuk filter ini.
            </p>
            {onOpenAdd && (
              <button
                type="button"
                onClick={onOpenAdd}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
              >
                + Tulis Jurnal Baru
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3 min-w-[130px]">Hari & Tanggal</th>
                  <th className="py-3 px-3 text-center w-20">Kelas</th>
                  <th className="py-3 px-3 min-w-[180px]">Materi / Pokok Bahasan</th>
                  <th className="py-3 px-3 min-w-[200px]">Kegiatan Pembelajaran</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Presensi</th>
                  <th className="py-3 px-3 min-w-[150px] bg-amber-50/50 text-amber-900 border-x border-amber-100">
                    Kendala / Hambatan
                  </th>
                  <th className="py-3 px-3 min-w-[150px] bg-emerald-50/50 text-emerald-900 border-r border-emerald-100">
                    Tindak Lanjut
                  </th>
                  <th className="py-3 px-3 text-center w-16">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJurnal.map((j, idx) => {
                  const total = (Number(j.jumlahHadir) || 0) + (Number(j.jumlahTidakHadir) || 0);
                  const pct = total > 0 ? Math.round(((Number(j.jumlahHadir) || 0) / total) * 100) : 0;

                  return (
                    <tr
                      key={j.id}
                      className="hover:bg-slate-50/80 transition-colors align-top group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{formatDateIndo(j.tanggal)}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Jam: {j.jamKe || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px] inline-block">
                          {j.kelasNama}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 leading-snug">
                          {j.materiJudul || j.materi || '-'}
                        </div>
                        {j.metode && (
                          <div className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">
                            Metode: {j.metode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-slate-600 leading-relaxed line-clamp-3 text-[11px]">
                          {j.kegiatan || j.kegiatanPembelajaran || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-slate-800 text-[11px]">
                          H: <span className="text-emerald-700">{j.jumlahHadir || 0}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          TH: <span className="text-rose-600">{j.jumlahTidakHadir || 0}</span>
                        </div>
                        <div className="text-[10px] font-extrabold text-teal-800 mt-0.5 bg-teal-50 px-1.5 py-0.5 rounded-md inline-block">
                          {pct}%
                        </div>
                      </td>
                      <td className="py-3 px-3 bg-amber-50/20 border-x border-amber-100/60">
                        {j.hambatan ? (
                          <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                            {j.hambatan}
                          </p>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">- Lancar -</span>
                        )}
                      </td>
                      <td className="py-3 px-3 bg-emerald-50/20 border-r border-emerald-100/60">
                        {j.tindakLanjut ? (
                          <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                            {j.tindakLanjut}
                          </p>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedJurnalDetail(j)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Lihat Rincian Jurnal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Jurnal Modal */}
      {selectedJurnalDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 space-y-4">
            <button
              onClick={() => setSelectedJurnalDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-sm">
                {selectedJurnalDetail.kelasNama}
              </div>
              <div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Detail Catatan Jurnal Mengajar
                </div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedJurnalDetail.materiJudul || selectedJurnalDetail.materi}
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{formatDateIndo(selectedJurnalDetail.tanggal)}</span>
                  <span>•</span>
                  <span>Jam Ke: {selectedJurnalDetail.jamKe || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider mb-1">
                  Kegiatan Pembelajaran (Skenario)
                </span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700">
                  {selectedJurnalDetail.kegiatan || selectedJurnalDetail.kegiatanPembelajaran || '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider">
                    Siswa Hadir
                  </span>
                  <div className="text-lg font-black text-emerald-700">
                    {selectedJurnalDetail.jumlahHadir || 0} Siswa
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider">
                    Siswa Tidak Hadir
                  </span>
                  <div className="text-lg font-black text-rose-600">
                    {selectedJurnalDetail.jumlahTidakHadir || 0} Siswa
                  </div>
                </div>
              </div>

              {(selectedJurnalDetail.hambatan || selectedJurnalDetail.tindakLanjut) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedJurnalDetail.hambatan && (
                    <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Kendala / Hambatan
                      </span>
                      <p className="text-amber-950 text-xs leading-relaxed font-medium">
                        {selectedJurnalDetail.hambatan}
                      </p>
                    </div>
                  )}

                  {selectedJurnalDetail.tindakLanjut && (
                    <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Tindak Lanjut / Solusi
                      </span>
                      <p className="text-emerald-950 text-xs leading-relaxed font-medium">
                        {selectedJurnalDetail.tindakLanjut}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedJurnalDetail.catatanKhusus && (
                <div>
                  <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider mb-1">
                    Catatan Khusus / Refleksi
                  </span>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700">
                    {selectedJurnalDetail.catatanKhusus}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Guru Pengampu: <strong>{selectedJurnalDetail.guruNama || currentUser.name}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedJurnalDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Rekap Jurnal Formal (Print View) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:m-0 print:p-0 print:shadow-none print:border-none">
            {/* Action buttons (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 text-slate-700">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">Pratinjau Lembar Cetak Dokumen Rekap Jurnal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print / PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Print Content Document */}
            <div id="print-area" className="p-4 sm:p-6 bg-white text-black font-serif print:p-0">
              {/* Kop Surat Resmi */}
              <div className="text-center pb-4 border-b-4 border-double border-slate-800 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  PEMERINTAH PROVINSI BALI • DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
                </h3>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                  {db.settings?.namaSekolah || 'SMA NEGERI 1 TEJAKULA'}
                </h1>
                <p className="text-[11px] text-slate-600">
                  NPSN: {db.settings?.npsn || '50100412'} • Alamat: Jl. Raya Singaraja-Amlapura, Kec. Tejakula, Kab. Buleleng
                </p>
                <p className="text-[11px] text-slate-600">
                  Website / E-Learning PJOK: SMANSAKA Smart LMS • Email: sman1tejakula@gmail.com
                </p>
              </div>

              {/* Document Header */}
              <div className="text-center my-5 space-y-1">
                <h2 className="text-sm sm:text-base font-extrabold uppercase underline tracking-wide text-slate-900">
                  REKAPITULASI JURNAL AGENDA PEMBELAJARAN GURU PJOK
                </h2>
                <div className="text-xs text-slate-700 font-sans">
                  {periodDisplayName.toUpperCase()} • TAHUN PELAJARAN{' '}
                  {db.settings?.tahunPelajaran || '2026/2027'} (SEMESTER{' '}
                  {db.settings?.semester || 'GANJIL'})
                </div>
              </div>

              {/* Teacher & Class Metadata Table */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4 p-3 bg-slate-50 rounded-lg border border-slate-300 print:bg-transparent">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 w-32 inline-block">Mata Pelajaran</span>
                    <strong>: {db.settings?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 w-32 inline-block">Guru Pengampu</span>
                    <strong>: {currentUser?.name || db.settings?.namaGuruPJOKUtama || 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 w-32 inline-block">NIP Guru</span>
                    <strong>: {db.settings?.nipGuruPJOKUtama || '-'}</strong>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 w-32 inline-block">Kelas / Rombel</span>
                    <strong>
                      :{' '}
                      {selectedFilterKelasId === 'ALL'
                        ? 'Semua Kelas Binaan'
                        : `Kelas ${(availableClasses.find((k) => k.id === selectedFilterKelasId)?.nama || selectedFilterKelasId)}`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 w-32 inline-block">Jumlah Pertemuan</span>
                    <strong>: {filteredJurnal.length} Kali Tatap Muka</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 w-32 inline-block">Rerata Kehadiran</span>
                    <strong>: {stats.persenHadir}% ({stats.totalHadir} Siswa Hadir)</strong>
                  </div>
                </div>
              </div>

              {/* Printable Table */}
              <table className="w-full text-left text-[11px] font-sans border-collapse border border-slate-900 mb-6">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900 text-center">
                    <th className="border border-slate-900 p-2 w-8">No</th>
                    <th className="border border-slate-900 p-2 w-24">Hari / Tanggal</th>
                    <th className="border border-slate-900 p-2 w-14">Kelas</th>
                    <th className="border border-slate-900 p-2 w-14">Jam Ke</th>
                    <th className="border border-slate-900 p-2 min-w-[140px]">Materi / Topik Pembelajaran</th>
                    <th className="border border-slate-900 p-2 min-w-[180px]">Uraian Kegiatan Pembelajaran</th>
                    <th className="border border-slate-900 p-2 w-16 text-center">Kehadiran (H/TH)</th>
                    <th className="border border-slate-900 p-2 min-w-[120px]">Kendala & Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJurnal.map((j, idx) => (
                    <tr key={j.id} className="border-b border-slate-700 align-top">
                      <td className="border border-slate-900 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-900 p-1.5 font-semibold">
                        <div>{formatDateIndo(j.tanggal).split(',')[0]}</div>
                        <div className="text-[10px] text-slate-700">{j.tanggal}</div>
                      </td>
                      <td className="border border-slate-900 p-1.5 text-center font-bold">{j.kelasNama}</td>
                      <td className="border border-slate-900 p-1.5 text-center">{j.jamKe || '-'}</td>
                      <td className="border border-slate-900 p-1.5 font-bold">
                        {j.materiJudul || j.materi || '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 leading-relaxed text-[10px]">
                        {j.kegiatan || j.kegiatanPembelajaran || '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-center">
                        <strong className="text-emerald-900">H: {j.jumlahHadir || 0}</strong>
                        <br />
                        <span className="text-rose-900 text-[10px]">TH: {j.jumlahTidakHadir || 0}</span>
                      </td>
                      <td className="border border-slate-900 p-1.5 text-[10px]">
                        {j.hambatan && (
                          <div className="mb-1">
                            <strong>Kendala:</strong> {j.hambatan}
                          </div>
                        )}
                        {j.tindakLanjut && (
                          <div>
                            <strong>Solusi:</strong> {j.tindakLanjut}
                          </div>
                        )}
                        {!j.hambatan && !j.tindakLanjut && <span className="italic text-slate-400">- Nihil -</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature Block */}
              <div className="grid grid-cols-2 gap-8 text-xs font-sans pt-4 mt-6">
                <div className="text-center space-y-16">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold">Kepala SMA Negeri 1 Tejakula</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold underline text-sm">
                      {db.settings?.namaKepalaSekolah || db.settings?.kepalaSekolahNama || 'Nyoman Sukrada, S.Pd., M.Pd.'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      NIP. {db.settings?.nipKepalaSekolah || db.settings?.kepalaSekolahNip || '19680105 199103 1 020'}
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-16">
                  <div>
                    <p>Tejakula, {formatDateIndo(new Date().toISOString().slice(0, 10))}</p>
                    <p className="font-bold">Guru Mata Pelajaran PJOK</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold underline text-sm">
                      {currentUser?.name || db.settings?.namaGuruPJOKUtama || 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      NIP. {db.settings?.nipGuruPJOKUtama || '19881115 202221 1 012'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
