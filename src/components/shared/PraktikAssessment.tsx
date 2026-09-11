import React, { useState, useMemo } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Save,
  Search,
  Users,
  Sparkles,
  CheckSquare,
  Square,
  Filter,
  UserCheck,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Layers,
  Plus,
  Table as TableIcon,
  X,
  Check,
  Download,
  BookOpen,
} from 'lucide-react';
import { PenilaianPraktik, RubrikPraktik, User } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';

interface PraktikAssessmentProps {
  db: LMSDatabase;
  currentUser: User;
}

const RUBRIC_CRITERIA: { key: keyof RubrikPraktik; title: string; desc: string }[] = [
  {
    key: 'sikapAwal',
    title: '1. Sikap Awal (Persiapan)',
    desc: 'Posisi kaki dibuka selebar bahu, lutut ditekuk rileks, kedua lengan siap di depan badan.',
  },
  {
    key: 'pelaksanaanTeknik',
    title: '2. Pelaksanaan Teknik Gerakan',
    desc: 'Gerakan ayunan lengan lurus rapat, perkenaan bola pas di atas pergelangan tangan, dorongan lutut.',
  },
  {
    key: 'sikapAkhir',
    title: '3. Sikap Akhir (Follow Through)',
    desc: 'Keseimbangan tubuh terjaga, pandangan mengikuti arah bola, kembali ke posisi siap siaga.',
  },
  {
    key: 'hasilGerakan',
    title: '4. Kualitas & Hasil Gerakan',
    desc: 'Arah pantulan bola akurat melambung stabil, tinggi bola memenuhi syarat operan permainan.',
  },
  {
    key: 'sportivitas',
    title: '5. Sikap Sportivitas & Etika',
    desc: 'Menghargai instruksi pelatih/guru, mematuhi aturan bermain, dan menghormati lawan/kawan.',
  },
  {
    key: 'kerjaSama',
    title: '6. Kerja Sama Beregu & Komunikasi',
    desc: 'Komunikasi aktif saat menerima bola, gotong royong mengamankan bola olahraga tim.',
  },
];

const SKALA_LABELS: Record<number, { label: string; desc: string; color: string; activeColor: string }> = {
  1: {
    label: 'Kurang',
    desc: 'Belum memenuhi teknik dasar',
    color: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    activeColor: 'bg-rose-600 text-white border-rose-600 shadow-xs',
  },
  2: {
    label: 'Cukup',
    desc: 'Cukup menguasai sebagian gerakan',
    color: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    activeColor: 'bg-amber-500 text-white border-amber-500 shadow-xs',
  },
  3: {
    label: 'Baik',
    desc: 'Menguasai teknik dengan tepat',
    color: 'border-sky-200 text-sky-700 hover:bg-sky-50',
    activeColor: 'bg-sky-600 text-white border-sky-600 shadow-xs',
  },
  4: {
    label: 'Sangat Baik',
    desc: 'Sempurna dan konsisten',
    color: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
  },
};

const DEFAULT_MATERI_LIST = [
  'Permainan Bola Voli - Passing Bawah & Atas',
  'Permainan Sepak Bola - Dribbling & Passing',
  'Bulutangkis - Servis Pendek & Smash',
  'Senam Lantai - Roll Depan & Belakang',
  'Kebugaran Jasmani - Tes MFT & Push Up',
  'Atletik - Lari Cepat & Estafet',
  'Bola Basket - Chest Pass & Dribble',
  'Renang - Gaya Dada & Bebas',
  'Pencak Silat - Jurus Dasar & Kuda-kuda',
];

export const PraktikAssessment: React.FC<PraktikAssessmentProps> = ({ db, currentUser }) => {
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    db.kelas.length > 0 ? db.kelas[0].id : 'cls-xi-1'
  );
  const [selectedMateriJudul, setSelectedMateriJudul] = useState<string>(
    'Permainan Bola Voli - Passing Bawah & Atas'
  );
  const [searchMurid, setSearchMurid] = useState<string>('');
  const [mainViewMode, setMainViewMode] = useState<'rubrik' | 'matriks'>('rubrik');

  // Multi student selection
  const [selectedMuridIds, setSelectedMuridIds] = useState<string[]>([]);
  const [activeMuridId, setActiveMuridId] = useState<string | null>(null);

  // Modal Add New Materi
  const [showAddMateriModal, setShowAddMateriModal] = useState<boolean>(false);
  const [newMateriName, setNewMateriName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state for rubrics keyed by `${materiJudul}_${muridId}`
  const [muridAssessments, setMuridAssessments] = useState<
    Record<string, { rubrik: RubrikPraktik; catatan: string }>
  >({});

  // Dynamic list of available practical materials
  const availableMateriList = useMemo(() => {
    const fromStorage = db.materiPraktikList || [];
    const fromLMSMateri = (db.materi || []).map((m) => m.judul);
    const existingAssessments = (db.penilaianPraktik || []).map(
      (p) => p.materiJudul || p.materi || ''
    );
    const combined = Array.from(
      new Set([...fromStorage, ...DEFAULT_MATERI_LIST, ...fromLMSMateri, ...existingAssessments])
    ).filter(Boolean);
    return combined;
  }, [db.materiPraktikList, db.materi, db.penilaianPraktik]);

  // Students in selected class
  const muridInKelas = useMemo(() => {
    const targetId = (selectedKelasId || '').toLowerCase().trim();
    const targetKelasObj = (db.kelas || []).find((k) => k.id === selectedKelasId);
    const targetNama = (targetKelasObj?.nama || '').toLowerCase().trim();

    return (db.users || []).filter((u) => {
      if (u.role !== 'MURID') return false;
      const uKelas = (u.kelasId || '').toLowerCase().trim();
      return uKelas === targetId || (targetNama && uKelas === targetNama);
    });
  }, [db.users, selectedKelasId, db.kelas]);

  const searchedMurid = useMemo(() => {
    if (!searchMurid.trim()) return muridInKelas;
    const q = searchMurid.toLowerCase();
    return muridInKelas.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.nis && m.nis.includes(q))
    );
  }, [muridInKelas, searchMurid]);

  // Get data for active student on currently selected materi
  const getMuridData = (muridId: string, targetMateri: string = selectedMateriJudul) => {
    const cacheKey = `${targetMateri}_${muridId}`;
    if (muridAssessments[cacheKey]) {
      return muridAssessments[cacheKey];
    }

    const existing = (db.penilaianPraktik || []).find(
      (p) =>
        p.muridId === muridId &&
        ((p.materiJudul || p.materi || '').trim().toLowerCase() === targetMateri.trim().toLowerCase())
    );

    if (existing) {
      const existingRubrik: RubrikPraktik = existing.rubrik
        ? {
            sikapAwal: existing.rubrik.sikapAwal ?? 3,
            pelaksanaanTeknik: existing.rubrik.pelaksanaanTeknik ?? 3,
            sikapAkhir: existing.rubrik.sikapAkhir ?? 3,
            hasilGerakan: existing.rubrik.hasilGerakan ?? 3,
            sportivitas: existing.rubrik.sportivitas ?? 4,
            kerjaSama: existing.rubrik.kerjaSama ?? 4,
          }
        : {
            sikapAwal: existing.aspekNilai?.sikapAwal ?? 3,
            pelaksanaanTeknik: existing.aspekNilai?.teknikGerakan ?? 3,
            sikapAkhir: existing.aspekNilai?.koordinasi ?? 3,
            hasilGerakan: existing.aspekNilai?.ketepatan ?? 3,
            sportivitas: existing.aspekNilai?.sportivitas ?? 4,
            kerjaSama: existing.aspekNilai?.kerjaSama ?? 4,
          };
      return {
        rubrik: existingRubrik,
        catatan: existing.catatanEvaluasi || existing.catatanGuru || '',
      };
    }

    return {
      rubrik: {
        sikapAwal: 3,
        pelaksanaanTeknik: 3,
        sikapAkhir: 3,
        hasilGerakan: 3,
        sportivitas: 4,
        kerjaSama: 4,
      },
      catatan: 'Penguasaan teknik gerakan sudah cukup baik, perlu peningkatan konsistensi.',
    };
  };

  const calculateScore = (rubrik: RubrikPraktik) => {
    const totalPoints =
      (rubrik?.sikapAwal ?? 3) +
      (rubrik?.pelaksanaanTeknik ?? 3) +
      (rubrik?.sikapAkhir ?? 3) +
      (rubrik?.hasilGerakan ?? 3) +
      (rubrik?.sportivitas ?? 4) +
      (rubrik?.kerjaSama ?? 4);
    return Math.round((totalPoints / 24) * 100);
  };

  const getPredikat = (score: number) => {
    if (score >= 90) return 'A (Sangat Baik)';
    if (score >= 80) return 'B (Baik)';
    if (score >= 70) return 'C (Cukup)';
    return 'D (Kurang)';
  };

  // Get all practical assessments done by this student across ANY materials
  const getStudentAllPraktik = (muridId: string) => {
    return (db.penilaianPraktik || []).filter((p) => p.muridId === muridId);
  };

  const toggleSelectMurid = (id: string) => {
    setSelectedMuridIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
    if (!activeMuridId || !selectedMuridIds.includes(id)) {
      setActiveMuridId(id);
    }
  };

  const selectAllStudents = () => {
    setSelectedMuridIds(muridInKelas.map((m) => m.id));
    if (muridInKelas.length > 0 && !activeMuridId) {
      setActiveMuridId(muridInKelas[0].id);
    }
  };

  const clearSelection = () => {
    setSelectedMuridIds([]);
  };

  const selectSmallGroup = (groupSize: number = 4) => {
    const unassessed = muridInKelas.filter((m) => {
      return !(db.penilaianPraktik || []).some(
        (p) =>
          p.muridId === m.id &&
          (p.materiJudul || p.materi || '').trim().toLowerCase() ===
            selectedMateriJudul.trim().toLowerCase()
      );
    });
    const targetPool = unassessed.length >= groupSize ? unassessed : muridInKelas;
    const slice = targetPool.slice(0, groupSize).map((m) => m.id);
    setSelectedMuridIds(slice);
    if (slice.length > 0) setActiveMuridId(slice[0]);
  };

  const handleScoreChange = (muridId: string, key: keyof RubrikPraktik, value: number) => {
    const current = getMuridData(muridId);
    const cacheKey = `${selectedMateriJudul}_${muridId}`;
    setMuridAssessments((prev) => ({
      ...prev,
      [cacheKey]: {
        ...current,
        rubrik: {
          ...current.rubrik,
          [key]: value,
        },
      },
    }));
  };

  const handleCatatanChange = (muridId: string, catatan: string) => {
    const current = getMuridData(muridId);
    const cacheKey = `${selectedMateriJudul}_${muridId}`;
    setMuridAssessments((prev) => ({
      ...prev,
      [cacheKey]: {
        ...current,
        catatan,
      },
    }));
  };

  const applyRubrikToAllSelected = (sourceRubrik: RubrikPraktik) => {
    if (selectedMuridIds.length === 0) {
      alert('Pilih beberapa murid terlebih dahulu untuk menerapkan rubrik bersamaan.');
      return;
    }
    const updated = { ...muridAssessments };
    selectedMuridIds.forEach((id) => {
      const cacheKey = `${selectedMateriJudul}_${id}`;
      const current = getMuridData(id);
      updated[cacheKey] = {
        ...current,
        rubrik: { ...sourceRubrik },
      };
    });
    setMuridAssessments(updated);
    setToastMessage(
      `Berhasil menerapkan nilai rubrik ke ${selectedMuridIds.length} murid terpilih pada materi ${selectedMateriJudul}!`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new materi
  const handleAddNewMateriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMateriName.trim();
    if (!trimmed) return;

    dataStorage.addMateriPraktik(trimmed);
    setSelectedMateriJudul(trimmed);
    setNewMateriName('');
    setShowAddMateriModal(false);
    setToastMessage(`Materi praktik baru "${trimmed}" berhasil ditambahkan!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save assessments (supports multiple materials per student)
  const handleSaveStudents = (targetIds: string[]) => {
    if (targetIds.length === 0) {
      alert('Silakan pilih minimal satu murid untuk disimpan penilaiannya.');
      return;
    }

    const currentKelas = (db.kelas || []).find((k) => k.id === selectedKelasId);
    const kelasNama = currentKelas?.nama || selectedKelasId;

    const newAssessments: PenilaianPraktik[] = [];

    targetIds.forEach((muridId) => {
      const muridObj = db.users.find((u) => u.id === muridId);
      if (!muridObj) return;

      const assessmentData = getMuridData(muridId);
      const score = calculateScore(assessmentData.rubrik);
      const predikatStr = getPredikat(score);
      const totalPoints =
        (assessmentData.rubrik?.sikapAwal ?? 3) +
        (assessmentData.rubrik?.pelaksanaanTeknik ?? 3) +
        (assessmentData.rubrik?.sikapAkhir ?? 3) +
        (assessmentData.rubrik?.hasilGerakan ?? 3) +
        (assessmentData.rubrik?.sportivitas ?? 4) +
        (assessmentData.rubrik?.kerjaSama ?? 4);

      newAssessments.push({
        id: `prk-${muridId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        muridId: muridId,
        muridNama: muridObj.name,
        kelasId: selectedKelasId,
        kelasNama: kelasNama,
        materiJudul: selectedMateriJudul,
        materi: selectedMateriJudul,
        tanggal: new Date().toISOString().slice(0, 10),
        rubrik: assessmentData.rubrik,
        aspekNilai: {
          sikapAwal: assessmentData.rubrik.sikapAwal as any,
          teknikGerakan: assessmentData.rubrik.pelaksanaanTeknik as any,
          ketepatan: assessmentData.rubrik.hasilGerakan as any,
          koordinasi: assessmentData.rubrik.sikapAkhir as any,
          sportivitas: assessmentData.rubrik.sportivitas as any,
          kerjaSama: assessmentData.rubrik.kerjaSama as any,
        },
        totalSkor: totalPoints,
        nilaiTotal: score,
        nilaiAkhir: score,
        predikat: predikatStr.split(' ')[0] as any,
        catatanEvaluasi: assessmentData.catatan,
        catatanGuru: assessmentData.catatan,
        guruPenilai: currentUser.name,
        guruNama: currentUser.name,
      });
    });

    dataStorage.updateDatabase((prev) => {
      // Retain other materials for each student; only update this specific materi
      const filtered = (prev.penilaianPraktik || []).filter(
        (p) =>
          !(
            targetIds.includes(p.muridId) &&
            ((p.materiJudul || p.materi || '').trim().toLowerCase() ===
              selectedMateriJudul.trim().toLowerCase())
          )
      );

      const allCombined = [...filtered, ...newAssessments];

      // Update student's report card (`nilai.praktik`) to the average of ALL their practical assessments
      const updatedNilai = (prev.nilai || []).map((n) => {
        if (targetIds.includes(n.muridId)) {
          const studentAssessments = allCombined.filter((p) => p.muridId === n.muridId);
          if (studentAssessments.length > 0) {
            const avgPraktik = Math.round(
              studentAssessments.reduce(
                (sum, a) => sum + (a.nilaiAkhir || a.nilaiTotal || 80),
                0
              ) / studentAssessments.length
            );
            const newNilaiAkhir = Math.round((n.tugas + n.quiz + avgPraktik + n.sikap) / 4);
            return {
              ...n,
              praktik: avgPraktik,
              nilaiAkhir: newNilaiAkhir,
              predikat: (getPredikat(newNilaiAkhir) || 'B').split(' ')[0] as any,
            };
          }
        }
        return n;
      });

      return {
        ...prev,
        penilaianPraktik: allCombined,
        nilai: updatedNilai,
      };
    });

    setToastMessage(
      `Berhasil menyimpan penilaian untuk ${newAssessments.length} murid pada materi: "${selectedMateriJudul}"!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeMurid = db.users.find((u) => u.id === activeMuridId);
  const activeMuridAssessment = activeMuridId ? getMuridData(activeMuridId) : null;
  const activeScore = activeMuridAssessment ? calculateScore(activeMuridAssessment.rubrik) : 0;

  // Distinct materials that actually have scores in this class (for the Matrix view)
  const assessedMaterialsInClass = useMemo(() => {
    const classStudentIds = muridInKelas.map((m) => m.id);
    const setMateri = new Set<string>();
    (db.penilaianPraktik || []).forEach((p) => {
      if (classStudentIds.includes(p.muridId)) {
        const mTitle = p.materiJudul || p.materi;
        if (mTitle) setMateri.add(mTitle);
      }
    });
    // Add current selected materi if not in list
    setMateri.add(selectedMateriJudul);
    return Array.from(setMateri);
  }, [muridInKelas, db.penilaianPraktik, selectedMateriJudul]);

  // Export Matrix to CSV
  const handleExportMatrixCSV = () => {
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      ...assessedMaterialsInClass.map((m) => `"${m.replace(/"/g, '""')}"`),
      'Rata-rata Praktik',
      'Predikat',
    ];

    const rows = muridInKelas.map((m, idx) => {
      const studentAll = getStudentAllPraktik(m.id);
      let totalScore = 0;
      let count = 0;

      const scores = assessedMaterialsInClass.map((mat) => {
        const found = studentAll.find(
          (p) => (p.materiJudul || p.materi || '').trim().toLowerCase() === mat.trim().toLowerCase()
        );
        if (found) {
          const sc = found.nilaiAkhir || found.nilaiTotal || 0;
          totalScore += sc;
          count++;
          return sc;
        }
        return '-';
      });

      const avg = count > 0 ? Math.round(totalScore / count) : 0;
      const pred = avg > 0 ? getPredikat(avg).split(' ')[0] : '-';

      return [
        idx + 1,
        m.nis || '-',
        `"${m.name.replace(/"/g, '""')}"`,
        `"${db.kelas.find((k) => k.id === selectedKelasId)?.nama || selectedKelasId}"`,
        ...scores,
        avg || '-',
        pred,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Rekap_Nilai_Praktik_${selectedKelasId}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-top-3">
          <div className="p-3.5 rounded-2xl shadow-xl bg-emerald-600 text-white flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md text-teal-200">
              <Activity className="w-3.5 h-3.5" />
              <span>Instrumen Penilaian Autentik Psikomotorik PJOK Multi-Materi</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Penilaian Praktik & Rubrik Kompetensi
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Guru dapat menilai lebih dari satu cabang materi praktik pada setiap murid. Tambahkan materi baru kapan saja dan pantau rekapitulasi nilai komprehensif.
            </p>
          </div>

          {/* Mode Switch & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/15">
              <button
                type="button"
                onClick={() => setMainViewMode('rubrik')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mainViewMode === 'rubrik'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Rubrik Penilaian</span>
              </button>
              <button
                type="button"
                onClick={() => setMainViewMode('matriks')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mainViewMode === 'matriks'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Rekap Semua Materi</span>
              </button>
            </div>

            {selectedMuridIds.length > 0 && mainViewMode === 'rubrik' && (
              <button
                type="button"
                onClick={() => handleSaveStudents(selectedMuridIds)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan {selectedMuridIds.length} Siswa</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mt-5 pt-4 border-t border-white/15">
          {/* Pilih Kelas */}
          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold text-teal-200 block mb-1">
              Pilih Kelas Siswa
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => {
                setSelectedKelasId(e.target.value);
                setSelectedMuridIds([]);
                setActiveMuridId(null);
              }}
              className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:bg-slate-900 cursor-pointer"
            >
              {db.kelas.map((k) => (
                <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                  Kelas {k.nama} ({k.jurusan || 'PJOK'})
                </option>
              ))}
            </select>
          </div>

          {/* Materi Pembelajaran + Tambah Materi Button */}
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-teal-200">
                Materi Penilaian Praktik
              </label>
              <button
                type="button"
                onClick={() => setShowAddMateriModal(true)}
                className="text-[11px] font-extrabold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Materi Baru</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMateriJudul}
                onChange={(e) => setSelectedMateriJudul(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:bg-slate-900 truncate cursor-pointer"
              >
                {availableMateriList.map((materi) => (
                  <option key={materi} value={materi} className="bg-slate-900 text-white">
                    {materi}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddMateriModal(true)}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                title="Tambah Materi Praktik Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Materi Baru</span>
              </button>
            </div>
          </div>

          {/* Cari Murid */}
          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold text-teal-200 block mb-1">
              Cari Nama Murid / NIS
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-teal-300" />
              <input
                type="text"
                placeholder="Ketik nama siswa..."
                value={searchMurid}
                onChange={(e) => setSearchMurid(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-teal-200/60 rounded-xl text-xs focus:outline-hidden focus:bg-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: RUBRIC ASSESSMENT (Left: Students, Right: Rubric) */}
      {mainViewMode === 'rubrik' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Selector with Multi-Materi Badges */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              {/* Action Buttons for Selection */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Daftar Murid ({muridInKelas.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Materi Aktif: <strong className="text-teal-700 truncate">{selectedMateriJudul}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSmallGroup(4)}
                    className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Grup (4)
                  </button>
                  {selectedMuridIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2 py-1 text-slate-400 hover:text-rose-600 font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              {/* Student Cards with Multi-Materi Badges */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {searchedMurid.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Tidak ditemukan murid di kelas ini.
                  </div>
                ) : (
                  searchedMurid.map((murid, idx) => {
                    const isChecked = selectedMuridIds.includes(murid.id);
                    const isActive = activeMuridId === murid.id;
                    const assessmentData = getMuridData(murid.id);
                    const allPraktikMurid = getStudentAllPraktik(murid.id);

                    const existingCurrentMateri = allPraktikMurid.find(
                      (p) =>
                        (p.materiJudul || p.materi || '').trim().toLowerCase() ===
                        selectedMateriJudul.trim().toLowerCase()
                    );
                    const liveScore = calculateScore(assessmentData.rubrik);

                    return (
                      <div
                        key={murid.id}
                        onClick={() => setActiveMuridId(murid.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all space-y-2 ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                            : isChecked
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-slate-200/80 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Checkbox & Avatar & Info */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectMurid(murid.id);
                              }}
                              className="text-slate-400 hover:text-emerald-600 focus:outline-hidden"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>

                            <img
                              src={
                                murid.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${murid.name}`
                              }
                              alt={murid.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 truncate block">
                                  {idx + 1}. {murid.name}
                                </span>
                                {isActive && (
                                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                NIS: {murid.nis || '-'}
                              </span>
                            </div>
                          </div>

                          {/* Live Score for current materi */}
                          <div className="shrink-0 text-right">
                            <div
                              className={`px-2.5 py-1 rounded-xl font-black text-xs inline-flex items-center gap-1 ${
                                liveScore >= 90
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : liveScore >= 80
                                  ? 'bg-sky-100 text-sky-800'
                                  : liveScore >= 70
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span>{liveScore}</span>
                              <span className="text-[10px] font-bold">
                                {liveScore >= 90 ? 'SB' : liveScore >= 80 ? 'B' : liveScore >= 70 ? 'C' : 'K'}
                              </span>
                            </div>
                            {existingCurrentMateri && (
                              <span className="text-[9px] text-emerald-600 font-medium block mt-0.5">
                                Tersimpan
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Multi-Materi Badges: shows all other practical grades this student has earned */}
                        {allPraktikMurid.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-100">
                            <span className="text-[9px] text-slate-400 font-medium">Materi Lain:</span>
                            {allPraktikMurid.map((p) => {
                              const isCurrent =
                                (p.materiJudul || p.materi || '').trim().toLowerCase() ===
                                selectedMateriJudul.trim().toLowerCase();
                              return (
                                <span
                                  key={p.id}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition ${
                                    isCurrent
                                      ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                  title={`${p.materiJudul || p.materi}: Nilai ${p.nilaiAkhir || p.nilaiTotal}`}
                                >
                                  {(p.materiJudul || p.materi || '').slice(0, 12)}: {p.nilaiAkhir || p.nilaiTotal}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Rubric 1 - 4 for Active Student */}
          <div className="lg:col-span-7 space-y-4">
            {!activeMurid ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Pilih Siswa untuk Mulai Penilaian
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Klik salah satu nama murid di panel kiri untuk membuka formulir rubrik psikomotorik 6 aspek skala 1 - 4.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                {/* Active Student Header Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        activeMurid.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeMurid.name}`
                      }
                      alt={activeMurid.name}
                      className="w-11 h-11 rounded-2xl ring-2 ring-emerald-400 bg-white object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{activeMurid.name}</h3>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-extrabold">
                          NIS: {activeMurid.nis || '-'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Materi: <span className="font-bold text-teal-800">{selectedMateriJudul}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Skor Akhir
                      </span>
                      <span className="text-2xl font-black text-emerald-700">{activeScore}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-emerald-200 text-center">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">
                        Predikat
                      </span>
                      <span className="text-xs font-black text-emerald-800">
                        {getPredikat(activeScore).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rubric Criteria 1 to 6 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Rubrik Psikomotorik (Skala 1 - 4)
                    </h4>
                    {selectedMuridIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          activeMuridAssessment &&
                          applyRubrikToAllSelected(activeMuridAssessment.rubrik)
                        }
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Terapkan ke {selectedMuridIds.length} Murid Terpilih</span>
                      </button>
                    )}
                  </div>

                  {RUBRIC_CRITERIA.map((crit) => {
                    const currentVal =
                      (activeMuridAssessment?.rubrik as any)?.[crit.key] ?? 3;

                    return (
                      <div
                        key={crit.key}
                        className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/40 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {crit.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">{crit.desc}</p>
                          </div>

                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-white border border-slate-200 text-slate-800 shrink-0">
                            Skor: {currentVal}
                          </span>
                        </div>

                        {/* 1 - 4 scale buttons */}
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((scale) => {
                            const isSelected = currentVal === scale;
                            const meta = SKALA_LABELS[scale];

                            return (
                              <button
                                type="button"
                                key={scale}
                                onClick={() =>
                                  handleScoreChange(activeMurid.id, crit.key, scale)
                                }
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? meta.activeColor
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <div className="text-sm font-black">{scale}</div>
                                <div className="text-[10px] font-bold truncate">{meta.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Teacher's Evaluation Note */}
                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Catatan Evaluasi / Rekomendasi Perbaikan Gerak:
                    </label>
                    <textarea
                      rows={2}
                      value={activeMuridAssessment?.catatan || ''}
                      onChange={(e) => handleCatatanChange(activeMurid.id, e.target.value)}
                      placeholder="Tuliskan catatan khusus perkembangan teknik gerakan siswa..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Save Buttons Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedMuridIds.length > 1 && (
                      <span>
                        Ada <strong className="text-emerald-700">{selectedMuridIds.length}</strong> murid terpilih
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveStudents([activeMurid.id])}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Nilai {activeMurid.name}</span>
                    </button>

                    {selectedMuridIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSaveStudents(selectedMuridIds)}
                        className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Semua ({selectedMuridIds.length} Siswa)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: MULTI-MATERI RECAP MATRIX (Shows all practical materials for each student) */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800">
                Matriks Nilai Seluruh Materi Praktik Siswa
              </h3>
              <p className="text-xs text-slate-500">
                Membandingkan pencapaian nilai praktik setiap murid di berbagai cabang olahraga PJOK.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMatrixCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Nilai</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-20">No</th>
                  <th className="py-3 px-3 w-28 sticky left-10 bg-slate-50 z-20">NIS</th>
                  <th className="py-3 px-4 min-w-[180px] sticky left-38 bg-slate-50 z-20 shadow-xs">
                    Nama Siswa
                  </th>

                  {/* Dynamic Columns for each evaluated materi */}
                  {assessedMaterialsInClass.map((materi) => (
                    <th
                      key={materi}
                      className="py-3 px-3 text-center min-w-[120px] border-l border-slate-200/60"
                      title={materi}
                    >
                      <div className="font-extrabold text-slate-800 truncate max-w-[130px]">
                        {materi}
                      </div>
                      <div className="text-[9px] text-teal-600 font-medium">Praktik</div>
                    </th>
                  ))}

                  <th className="py-3 px-3 text-center min-w-[90px] bg-emerald-50 border-l border-emerald-200 font-black text-emerald-900">
                    Rata-Rata
                  </th>
                  <th className="py-3 px-3 text-center min-w-[80px] bg-slate-50 border-l border-slate-200">
                    Predikat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchedMurid.map((m, idx) => {
                  const studentAll = getStudentAllPraktik(m.id);
                  let sumScore = 0;
                  let count = 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 sticky left-0 bg-white z-10">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] sticky left-10 bg-white z-10">
                        {m.nis || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 sticky left-38 bg-white z-10 shadow-xs truncate">
                        {m.name}
                      </td>

                      {/* Score per materi */}
                      {assessedMaterialsInClass.map((materi) => {
                        const rec = studentAll.find(
                          (p) =>
                            (p.materiJudul || p.materi || '').trim().toLowerCase() ===
                            materi.trim().toLowerCase()
                        );
                        if (rec) {
                          const val = rec.nilaiAkhir || rec.nilaiTotal || 0;
                          sumScore += val;
                          count++;

                          return (
                            <td
                              key={materi}
                              className="py-2.5 px-2 text-center border-l border-slate-100"
                            >
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-lg font-black text-xs ${
                                  val >= 90
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : val >= 80
                                    ? 'bg-sky-100 text-sky-800'
                                    : val >= 70
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={materi}
                            className="py-2.5 px-2 text-center text-slate-300 font-mono border-l border-slate-100"
                          >
                            -
                          </td>
                        );
                      })}

                      {/* Cumulative Average */}
                      <td className="py-2.5 px-2 text-center font-black text-emerald-800 bg-emerald-50/50 border-l border-emerald-200">
                        {count > 0 ? Math.round(sumScore / count) : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-l border-slate-200">
                        {count > 0 ? (
                          <span className="font-bold text-slate-700">
                            {getPredikat(Math.round(sumScore / count)).split(' ')[0]}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MATERI PRAKTIK BARU */}
      {showAddMateriModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md">
                  Materi Penilaian Praktik
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Tambah Materi Praktik Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMateriModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Ketikkan judul atau cabang materi olahraga baru. Materi ini akan langsung tersedia pada daftar pilihan dan guru bisa menilai seluruh siswa pada materi ini.
            </p>

            <form onSubmit={handleAddNewMateriSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Judul Materi Praktik PJOK *
                </label>
                <input
                  type="text"
                  required
                  value={newMateriName}
                  onChange={(e) => setNewMateriName(e.target.value)}
                  placeholder="Contoh: Tenis Meja - Servis & Forehand Drive"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-400 bg-slate-50/50 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block">Saran Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Tenis Meja - Servis & Spin',
                    'Lompat Jauh - Gaya Menggantung',
                    'Kebugaran - Bleep Test',
                    'Senam Irama - Rangkaian Senam',
                    'Futsal - Passing & Shooting',
                  ].map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => setNewMateriName(sug)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMateriModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Materi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
