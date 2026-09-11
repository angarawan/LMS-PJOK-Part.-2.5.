export type UserRole = 'ADMIN' | 'GURU' | 'MURID';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  avatar?: string;
  email?: string;
  status: 'Aktif' | 'Nonaktif';
  // Guru specific
  nip?: string;
  mataPelajaran?: string;
  // Murid specific
  nis?: string;
  nisn?: string;
  kelasId?: string;
  jenisKelamin?: 'L' | 'P';
  tahunPelajaran?: string;
}

export interface Kelas {
  id: string;
  nama: string; // e.g., "XI 1", "XI 2", "X 1", "XII 1"
  tingkat: 'X' | 'XI' | 'XII';
  waliKelasId: string;
  waliKelasNama: string;
  guruPengampuId: string;
  guruPengampuNama: string;
  tahunPelajaran: string;
  totalMurid: number;
}

export interface MataPelajaran {
  id: string;
  nama: string;
  fase: 'E' | 'F';
  tingkat: string;
  tahunPelajaran: string;
  guruPengampuId: string;
  guruPengampuNama: string;
}

export interface Materi {
  id: string;
  judul: string;
  subJudul?: string;
  kategori: string; // e.g. "Bola Voli", "Bulutangkis", "Atletik", "Kebugaran Jasmani", "Senam"
  kelasId?: string;
  kelasNama?: string;
  kelasIds?: string[];
  fase?: 'E' | 'F';
  semester?: '1' | '2';
  tujuanPembelajaran?: string; // Capaian dan Tujuan Pembelajaran (paling di atas)
  deskripsi: string; // Uraian Materi & Konsep Gerak
  materiInti?: string; // Materi Inti (penjelasan mendalam & tahapan gerak)
  kontenTeks?: string; // Dukungan teks konten tambahan / alias
  konten?: string;
  subMateriList?: {
    id: string;
    judul: string;
    subJudul?: string;
    konten?: string;
    durasi?: string;
  }[];
  kolomKustom?: {
    id: string;
    label: string;
    subJudul?: string;
    isi: string;
  }[];
  status?: 'Publish' | 'Draft' | 'Arsip';
  statusPublikasi?: 'Publish' | 'Draft';
  videoUrl?: string;
  gambarUrl?: string;
  pdfUrl?: string;
  fileUrl?: string;
  linkSumber?: string;
  aktivitasMurid?: string;
  dibuatOleh?: string;
  guruId?: string;
  guruNama?: string;
  tanggalDibuat?: string;
  dibuatPada?: string;
}

export interface Tugas {
  id: string;
  judul: string;
  subJudul?: string;
  materiId?: string;
  materiJudul?: string;
  kategori?: string;
  kelasId?: string;
  kelasNama?: string;
  kelasIds?: string[];
  instruksi: string;
  tanggalMulai?: string;
  deadline: string;
  fileLampiran?: string;
  jenisPengumpulan?: 'Teks' | 'Video/Foto' | 'Dokumen';
  status: 'Aktif' | 'Selesai' | 'Publish' | 'Draft';
  statusPublikasi?: 'Publish' | 'Draft';
  dibuatOleh?: string;
  guruId?: string;
  guruNama?: string;
  dibuatPada?: string;
}

export interface PengumpulanTugas {
  id: string;
  tugasId: string;
  tugasJudul?: string;
  muridId: string;
  muridNama: string;
  kelasId?: string;
  tanggalKumpul: string;
  isiJawaban?: string;
  fileUrl?: string;
  linkVideo?: string;
  catatanSiswa?: string;
  status: 'Belum Dikerjakan' | 'Sudah Dikumpulkan' | 'Dinilai' | 'Terlambat' | 'Dikumpulkan';
  nilai?: number;
  komentarGuru?: string;
  catatanGuru?: string;
}

export type TipeSoal =
  | 'Pilihan Ganda'
  | 'Benar/Salah'
  | 'Mencocokkan Gambar'
  | 'Tarik Garis'
  | 'Urutan Gerak'
  | 'Isian';

export interface MatchingPair {
  id?: string;
  left: string;
  right: string;
  imageUrl?: string;
}

export interface Soal {
  id: string;
  quizId?: string;
  nomor?: number;
  pertanyaan: string;
  tipe?: TipeSoal;
  kategoriSoal?: 'HOTS' | 'AKM' | 'Standar';
  pilihan: string[]; // Options for PG: A, B, C, D, E
  kunciJawaban: string;
  pembahasan?: string;
  bobot: number;
  gambarUrl?: string;
  matchingPairs?: MatchingPair[];
  steps?: string[];
}

export type SoalQuiz = Soal;

export interface Quiz {
  id: string;
  judul: string;
  subJudul?: string;
  materiId?: string;
  materiJudul?: string;
  kelasId?: string;
  kelasNama?: string;
  kelasIds?: string[];
  guruId?: string;
  guruNama?: string;
  durasiMenit: number;
  mulai?: string;
  selesai?: string;
  batasWaktu?: string;
  acakSoal?: boolean;
  acakJawaban?: boolean;
  tampilkanPembahasan?: boolean;
  dibuatOleh?: string;
  dibuatPada?: string;
  status?: 'Publish' | 'Draft' | 'Arsip';
  statusPublikasi?: 'Publish' | 'Draft';
  soalList?: Soal[];
  soal?: Soal[];
}

export interface JawabanQuiz {
  id: string;
  quizId: string;
  quizJudul: string;
  muridId: string;
  muridNama: string;
  kelasId: string;
  tanggalMengerjakan: string;
  nilai: number;
  jumlahBenar: number;
  jumlahSalah: number;
  jawabanMurid: Record<string, string>; // soalId -> jawaban
  status: 'Selesai';
}

export type SkalaPraktik = 1 | 2 | 3 | 4; 
// 1 = Belum Berkembang (BB), 2 = Mulai Berkembang (MB), 3 = Berkembang (B), 4 = Sangat Berkembang (SB)

export interface RubrikPraktik {
  sikapAwal: number;
  pelaksanaanTeknik: number;
  sikapAkhir: number;
  hasilGerakan: number;
  sportivitas: number;
  kerjaSama: number;
}

export interface IndikatorPraktik {
  id: string;
  nama: string;
  deskripsi?: string;
  skor: number; // 1 | 2 | 3 | 4
}

export interface PenilaianPraktik {
  id: string;
  kelasId: string;
  kelasNama?: string;
  materi?: string; // e.g. "Passing Bawah Bola Voli"
  materiJudul?: string;
  muridId: string;
  muridNama: string;
  tanggal: string;
  statusPublikasi?: 'Publish' | 'Draft';
  indikatorPenilaian?: IndikatorPraktik[];
  aspekNilai?: {
    sikapAwal: SkalaPraktik;
    teknikGerakan: SkalaPraktik;
    ketepatan: SkalaPraktik;
    koordinasi: SkalaPraktik;
    kerjaSama: SkalaPraktik;
    sportivitas: SkalaPraktik;
  };
  rubrik?: RubrikPraktik;
  totalSkor?: number; // max 24
  rataRata?: number; // max 4.0
  nilaiAkhir?: number; // converted to 0-100 scale: (totalSkor / 24) * 100
  nilaiTotal?: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  catatanGuru?: string;
  catatanEvaluasi?: string;
  guruNama?: string;
  guruPenilai?: string;
}

export type StatusPresensi = 'H' | 'S' | 'I' | 'A' | 'T'; 
// H: Hadir, S: Sakit, I: Izin, A: Alpa, T: Terlambat

export interface PresensiRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kelasId: string;
  kelasNama?: string;
  muridId: string;
  muridNama: string;
  status: StatusPresensi;
  keterangan?: string;
  guruId?: string;
  guruNama?: string;
}

export interface JurnalMengajar {
  id: string;
  tanggal: string;
  kelasId: string;
  kelasNama: string;
  materi?: string;
  materiJudul?: string;
  tujuanPembelajaran?: string;
  kegiatanPembelajaran?: string;
  kegiatan?: string;
  metode?: string; // e.g. "Demonstrasi, Problem-Based Learning, Praktik Lapangan"
  media?: string; // e.g. "Bola Voli, Lapangan, Peluit, Stopwatch"
  kehadiranRingkas?: string; // e.g. "H: 32, S: 1, I: 1, A: 0, T: 0"
  jumlahHadir?: number;
  jumlahTidakHadir?: number;
  catatanRefleksi?: string;
  catatanKhusus?: string;
  jamKe?: string;
  guruId: string;
  guruNama: string;
}

export interface RekapNilaiMurid {
  id?: string;
  muridId: string;
  muridNama: string;
  nis?: string;
  kelasId?: string;
  kelasNama?: string;
  semester?: string;
  tugas: number;
  quiz: number;
  praktik: number;
  pengetahuan: number;
  keterampilan: number;
  sikap: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D' | '-';
}

export type NilaiItem = RekapNilaiMurid;

export interface SoalRefleksi {
  id: string;
  pertanyaan: string;
  tipe: 'teks' | 'skala' | 'pilihan';
  kategori?: 'pemahaman' | 'kesulitan' | 'perasaan' | 'tindak_lanjut';
  opsi?: string[];
}

export interface RefleksiPembelajaran {
  id: string;
  judul: string;
  subJudul?: string;
  deskripsi?: string;
  materiId?: string;
  materiJudul?: string;
  kelasIds?: string[];
  kelasId?: string;
  targetKelasId?: string;
  guruId: string;
  guruNama: string;
  tanggalDibuat: string;
  deadline?: string;
  status: 'Aktif' | 'Ditutup' | 'Publish' | 'Draft';
  statusPublikasi?: 'Publish' | 'Draft';
  soalList: SoalRefleksi[];
}

export interface JawabanRefleksiMurid {
  id: string;
  refleksiId: string;
  refleksiJudul?: string;
  muridId: string;
  muridNama: string;
  kelasId: string;
  kelasNama?: string;
  tanggalIsi?: string;
  tanggalDiisi?: string;
  skalaEmosi?: 'sangat_senang' | 'senang' | 'netral' | 'kesulitan';
  mood?: string;
  jawaban: {
    soalId: string;
    pertanyaan: string;
    jawaban?: any;
    jawabanTeks?: string;
    nilaiSkala?: number;
  }[];
  catatanGuru?: string;
  tanggalTanggapanGuru?: string;
}

export interface NotifikasiItem {
  id: string;
  judul: string;
  pesan: string;
  waktu: string;
  tipe: 'tugas' | 'quiz' | 'nilai' | 'pengumuman' | 'presensi';
  dibaca: boolean;
  targetRole?: UserRole;
  targetMuridId?: string;
}

export interface PengaturanSekolah {
  namaSekolah: string;
  npsn?: string;
  logoSekolah?: string;
  tahunPelajaran: string;
  semester?: 'Ganjil' | 'Genap';
  semesterAktif?: string;
  namaKepalaSekolah?: string;
  kepalaSekolahNama?: string;
  nipKepalaSekolah?: string;
  kepalaSekolahNip?: string;
  namaGuruPJOKUtama?: string;
  guruPjokNama?: string;
  nipGuruPJOKUtama?: string;
  guruPjokNip?: string;
  mataPelajaran?: string;
  temaWarna?: string;
  googleSpreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetWebhookUrl?: string;
  autoSyncSpreadsheet?: boolean;
  terakhirSinkron?: string;
}

export type SettingsApp = PengaturanSekolah;

export interface SpreadsheetSyncLog {
  id: string;
  timestamp: string;
  action: 'PULL' | 'PUSH' | 'TEST_DIAGNOSTIC' | 'CSV_IMPORT';
  method: 'WEBHOOK_GET' | 'WEBHOOK_POST' | 'GVIZ_CSV' | 'DIRECT_EXPORT' | 'LOCAL';
  url: string;
  httpStatus?: number | null;
  durationMs: number;
  success: boolean;
  recordsCount?: number;
  message: string;
  details?: string;
  corsDetected?: boolean;
  authErrorDetected?: boolean;
  recommendation?: string;
  rawResponseSnippet?: string;
}

export interface DiagnosticTestResult {
  step: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  message: string;
  httpStatus?: number | null;
  details?: string;
  fixAction?: string;
}
