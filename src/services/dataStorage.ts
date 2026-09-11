import {
  User,
  Kelas,
  MataPelajaran,
  Materi,
  Tugas,
  PengumpulanTugas,
  Quiz,
  Soal,
  JawabanQuiz,
  PenilaianPraktik,
  PresensiRecord,
  JurnalMengajar,
  NotifikasiItem,
  RekapNilaiMurid,
  PengaturanSekolah,
  SpreadsheetSyncLog,
  RefleksiPembelajaran,
  JawabanRefleksiMurid,
  SoalRefleksi,
} from '../types';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { firestore, handleFirestoreError, OperationType } from './firestore';
import { auth } from './firebaseAuth';
import { DEFAULT_USERS, DEFAULT_NILAI } from '../data/defaultUsers';
import {
  syncViaAppsScriptWebhook,
  fetchViaAppsScriptWebhook,
  fetchSheetViaGViz,
  exportUsersToCSV,
  parseCSVToUsers,
  extractSpreadsheetId,
} from './sheetsService';
import { runSpreadsheetDiagnostics, DiagnosticReport } from './sheetsDiagnosticService';

export interface LMSDatabase {
  users: User[];
  kelas: Kelas[];
  mataPelajaran: MataPelajaran[];
  materi: Materi[];
  tugas: Tugas[];
  pengumpulanTugas: PengumpulanTugas[];
  quiz: Quiz[];
  jawabanQuiz: JawabanQuiz[];
  penilaianPraktik: PenilaianPraktik[];
  presensi: PresensiRecord[];
  jurnal: JurnalMengajar[];
  notifikasi: NotifikasiItem[];
  nilai: RekapNilaiMurid[];
  settings: PengaturanSekolah;
  refleksi?: RefleksiPembelajaran[];
  jawabanRefleksi?: JawabanRefleksiMurid[];
  materiPraktikList?: string[];
  isCleanSlate?: boolean;
  cleanSlateTimestamp?: string;
  isNilaiPresensiReset?: boolean;
}

const STORAGE_KEY = 'lms_pjok_db_v2';

const DEFAULT_QUIZ_SOAL: Soal[] = [
  {
    id: 'soal-1',
    quizId: 'qz-1',
    nomor: 1,
    pertanyaan:
      'Ketika seorang pemain menerima smash keras lawan, mengapa posisi tangan passing bawah harus dikunci lurus dan siku tidak boleh tertekuk?',
    tipe: 'Pilihan Ganda',
    kategoriSoal: 'HOTS',
    pilihan: [
      'Agar pantulan bola stabil dan arah lambungan mudah dikontrol ke arah setter',
      'Agar bola langsung kembali ke lapangan lawan tanpa disentuh setter',
      'Untuk menghindari terjadinya pelanggaran double touch oleh wasit',
      'Agar kecepatan bola meningkat tajam saat memantul ke atas',
      'Untuk meredam kekuatan smash tanpa mengubah arah lintas bola',
    ],
    kunciJawaban: 'Agar pantulan bola stabil dan arah lambungan mudah dikontrol ke arah setter',
    pembahasan:
      'Siku yang dikunci lurus menciptakan bidang datar solid pada lengan bawah, meminimalkan getaran dan menghasilkan pantulan elastis yang terarah.',
    bobot: 20,
  },
  {
    id: 'soal-2',
    quizId: 'qz-1',
    nomor: 2,
    pertanyaan:
      'Dalam sistem rotasi bola voli modern, rotasi dilakukan searah jarum jam setiap kali regu penerima servis berhasil mematikan bola lawan dan merebut hak servis.',
    tipe: 'Benar/Salah',
    kategoriSoal: 'AKM',
    pilihan: ['Benar', 'Salah'],
    kunciJawaban: 'Benar',
    pembahasan:
      'Rotasi searah jarum jam (posisi 1 ke 6, 6 ke 5, dst) dilakukan saat tim berhasil merebut hak servis dari lawan.',
    bobot: 15,
  },
  {
    id: 'soal-3',
    quizId: 'qz-1',
    nomor: 3,
    pertanyaan:
      'Cocokkan gambar teknik olahraga di bawah ini dengan nama teknik gerak dasar yang paling tepat!',
    tipe: 'Mencocokkan Gambar',
    kategoriSoal: 'HOTS',
    gambarUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80',
    pilihan: [
      'Passing Bawah Bola Voli',
      'Smash Keras Menukik',
      'Block / Bendungan Net',
      'Servis Atas Mengapung',
      'Passing Atas (Set Up)',
    ],
    kunciJawaban: 'Passing Bawah Bola Voli',
    pembahasan:
      'Gambar menunjukkan posisi kedua tangan rapat lurus ke depan bawah dengan lutut sedikit ditekuk untuk menerima bola.',
    matchingPairs: [
      {
        id: 'mp-1',
        left: 'Passing Bawah',
        right: 'Menerima servis dan smash lawan di depan bawah',
        imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'mp-2',
        left: 'Lay-Up Shoot',
        right: 'Tembakan melayang dua langkah ke papan pantul basket',
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'mp-3',
        left: 'Smash Bulutangkis',
        right: 'Pukulan overhead keras menukik tajam ke area lawan',
        imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80',
      },
    ],
    bobot: 25,
  },
  {
    id: 'soal-4',
    quizId: 'qz-1',
    nomor: 4,
    pertanyaan:
      'Tarik garis / jodohkan peran pemain bola voli (Kolom A) dengan tugas taktis utamanya di lapangan (Kolom B)!',
    tipe: 'Tarik Garis',
    kategoriSoal: 'AKM',
    pilihan: [],
    matchingPairs: [
      { left: 'Tosser / Setter', right: 'Mengatur serangan dan mengumpan bola matang untuk spiker' },
      { left: 'Libero', right: 'Pemain bertahan murni, dilarang menyerang dan servis' },
      { left: 'Spiker / Smasher', right: 'Mengeksekusi bola di atas net untuk mencetak poin serangan' },
      { left: 'Blocker', right: 'Membendung serangan smash lawan di dekat bibir net' },
    ],
    kunciJawaban: 'Tosser=Mengatur serangan, Libero=Pemain bertahan murni, Spiker=Mengeksekusi bola, Blocker=Membendung serangan',
    pembahasan:
      'Setiap posisi dalam bola voli memiliki spesialisasi peran yang saling melengkapi dalam formasi taktik regu.',
    bobot: 25,
  },
  {
    id: 'soal-5',
    quizId: 'qz-1',
    nomor: 5,
    pertanyaan:
      'Berapa jumlah sentuhan maksimal yang diperbolehkan bagi satu regu sebelum bola harus diseberangkan ke daerah lawan (tidak termasuk sentuhan bendungan/block)?',
    tipe: 'Pilihan Ganda',
    kategoriSoal: 'Standar',
    pilihan: [
      '1 kali sentuhan langsung',
      '2 kali sentuhan beruntun',
      '3 kali sentuhan tim',
      '4 kali sentuhan bebas',
      '5 kali sentuhan dalam reli panjang',
    ],
    kunciJawaban: '3 kali sentuhan tim',
    pembahasan:
      'Berdasarkan regulasi resmi FIVB, satu tim berhak menyentuh bola maksimal 3 kali sebelum melewati net.',
    bobot: 15,
  },
  {
    id: 'soal-6',
    quizId: 'qz-1',
    nomor: 6,
    pertanyaan:
      'Pada saat mendarat setelah melakukan loncatan smash atau block bola voli, sendi manakah yang harus ditekuk untuk meredam gaya tumbukan (shock absorption) agar mencegah cedera ligamen lutut?',
    tipe: 'Isian',
    kategoriSoal: 'HOTS',
    pilihan: [],
    kunciJawaban: 'Lutut dan pergelangan kaki',
    pembahasan:
      'Analisis Evaluasi Gerakan Motorik: Fleksi sendi lutut (knee flexion) bersama sendi pergelangan kaki (ankle) dan panggul bertindak sebagai peredam kejut mekanis tubuh (deceleration phase). Mendarat dengan tungkai kaku atau lurus meningkatkan risiko cedera robekan ligamen ACL secara drastis.',
    bobot: 20,
  },
];

export const INITIAL_DATABASE: LMSDatabase = {
  settings: {
    namaSekolah: 'SMAN 1 Olahraga Nusantara',
    logoSekolah: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    namaKepalaSekolah: 'Dr. Drs. I Nyoman Sukadana, M.Pd.',
    nipKepalaSekolah: '19690815 199412 1 002',
    namaGuruPJOKUtama: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
    nipGuruPJOKUtama: '198811152022211013',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    temaWarna: 'Biru & Hijau Sportif',
    terakhirSinkron: new Date().toISOString(),
    autoSyncSpreadsheet: true,
  },
  users: DEFAULT_USERS,
  kelas: [
    {
      id: 'cls-xi-1',
      nama: 'XI 1',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-1',
      waliKelasNama: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
      guruPengampuId: 'usr-guru-1',
      guruPengampuNama: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
      tahunPelajaran: '2026/2027',
      totalMurid: 31,
    },
    {
      id: 'cls-xi-2',
      nama: 'XI 2',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-2',
      waliKelasNama: 'Ratna Sartika, S.Pd.',
      guruPengampuId: 'usr-guru-1',
      guruPengampuNama: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
      tahunPelajaran: '2026/2027',
      totalMurid: 32,
    },
    {
      id: 'cls-xi-3',
      nama: 'XI 3',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-1',
      waliKelasNama: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
      guruPengampuId: 'usr-guru-2',
      guruPengampuNama: 'Ratna Sartika, S.Pd.',
      tahunPelajaran: '2026/2027',
      totalMurid: 33,
    },
    {
      id: 'cls-xi-4',
      nama: 'XI 4',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-2',
      waliKelasNama: 'Ratna Sartika, S.Pd.',
      guruPengampuId: 'usr-guru-1',
      guruPengampuNama: 'Haryono, S.Pd.Jas',
      tahunPelajaran: '2026/2027',
      totalMurid: 34,
    },
    {
      id: 'cls-xi-5',
      nama: 'XI 5',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-1',
      waliKelasNama: 'Haryono, S.Pd.Jas',
      guruPengampuId: 'usr-guru-2',
      guruPengampuNama: 'Ratna Sartika, S.Pd.',
      tahunPelajaran: '2026/2027',
      totalMurid: 32,
    },
    {
      id: 'cls-xi-6',
      nama: 'XI 6',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-1',
      waliKelasNama: 'Haryono, S.Pd.Jas',
      guruPengampuId: 'usr-guru-1',
      guruPengampuNama: 'Haryono, S.Pd.Jas',
      tahunPelajaran: '2026/2027',
      totalMurid: 30,
    },
    {
      id: 'cls-xi-7',
      nama: 'XI 7',
      tingkat: 'XI',
      waliKelasId: 'usr-guru-2',
      waliKelasNama: 'Ratna Sartika, S.Pd.',
      guruPengampuId: 'usr-guru-1',
      guruPengampuNama: 'Haryono, S.Pd.Jas',
      tahunPelajaran: '2026/2027',
      totalMurid: 31,
    },
  ],
  mataPelajaran: [
    {
      id: 'mp-pjok-f',
      nama: 'PJOK',
      fase: 'F',
      tingkat: 'Kelas XI',
      tahunPelajaran: '2026/2027',
      guruPengampuId: 'usr-guru-1',
      guruPengampuNama: 'Haryono, S.Pd.Jas, M.Or.',
    },
  ],
  materi: [
    {
      id: 'mat-1',
      judul: 'Teknik Dasar & Taktik Permainan Bola Voli',
      kategori: 'Bola Voli',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      fase: 'F',
      semester: '1',
      tujuanPembelajaran:
        'Peserta didik mampu menganalisis dan mempraktikkan keterampilan variasi pola gerak dasar passing bawah, passing atas, dan servis mengapung dalam permainan bola voli secara efektif dan suportif.',
      deskripsi:
        'Materi mencakup pengenalan posisi siap (ready position), perkenaan bola pada lengan bawah, ayunan tangan, dan rotasi posisi lapangan 6 orang.',
      kontenTeks: `### 1. Passing Bawah (Underhand Pass)
Passing bawah merupakan teknik dasar yang sangat esensial untuk menerima servis lawan maupun menahan spike (serangan tajam).
Kunci keberhasilan passing bawah:
- **Kaki**: Dibuka selebar bahu, salah satu kaki sedikit di depan, lutut ditekuk membentuk sudut 100-110 derajat.
- **Tangan**: Kedua ibu jari sejajar rapat, telapak tangan saling mengunci tanpa menekuk siku saat memukul bola.
- **Perkenaan**: Bola menyentuh bagian proksimal pergelangan tangan (sekitar 5-10 cm di atas pergelangan).
- **Gerakan Lanjutan**: Dorongan berasal dari meluruskan tungkai kaki, bukan semata-mata mengayunkan lengan.

### 2. Passing Atas (Overhand Set)
Digunakan untuk mengumpan bola ke spiker dengan presisi tinggi.
- Bentuk jari-jari tangan seperti mangkuk terbuka tepat di depan dahi.
- Sentuhan bola hanya dengan ruas-ruas jari, hindari menyentuh telapak tangan.`,
      materiInti: `### 1. Passing Bawah (Underhand Pass)
Passing bawah merupakan teknik dasar yang sangat esensial untuk menerima servis lawan maupun menahan spike (serangan tajam).
Kunci keberhasilan passing bawah:
- **Kaki**: Dibuka selebar bahu, salah satu kaki sedikit di depan, lutut ditekuk membentuk sudut 100-110 derajat.
- **Tangan**: Kedua ibu jari sejajar rapat, telapak tangan saling mengunci tanpa menekuk siku saat memukul bola.
- **Perkenaan**: Bola menyentuh bagian proksimal pergelangan tangan (sekitar 5-10 cm di atas pergelangan).
- **Gerakan Lanjutan**: Dorongan berasal dari meluruskan tungkai kaki, bukan semata-mata mengayunkan lengan.

### 2. Passing Atas (Overhand Set)
Digunakan untuk mengumpan bola ke spiker dengan presisi tinggi.
- Bentuk jari-jari tangan seperti mangkuk terbuka tepat di depan dahi.
- Sentuhan bola hanya dengan ruas-ruas jari, hindari menyentuh telapak tangan.`,
      videoUrl: 'https://www.youtube.com/watch?v=0e68H4Q26pA',
      gambarUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80',
      pdfUrl: 'https://pjok.kemdikbud.go.id/modul-bola-voli-fase-f.pdf',
      linkSumber: 'https://kemdikbud.go.id/kurikulum-merdeka/pjok',
      aktivitasMurid:
        'Praktikkan passing bawah berpasangan sebanyak 20 kali tanpa bola jatuh bersama rekan kelompokmu di lapangan.',
      dibuatOleh: 'Haryono, S.Pd.Jas',
      tanggalDibuat: '2026-08-20',
    },
    {
      id: 'mat-2',
      judul: 'Permainan Bola Basket: Pola Serangan & Fastbreak',
      kategori: 'Bola Basket',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      fase: 'F',
      semester: '1',
      tujuanPembelajaran:
        'Menganalisis konsep gerak dribble zigzag, crossover, chest pass dinamis, dan penyelesaian lay-up shoot dari sisi kanan maupun kiri ring.',
      deskripsi:
        'Materi ini menekankan kecepatan pengambilan keputusan saat transisi menyerang dan akurasi lay-up di bawah tekanan lawan.',
      kontenTeks: `### Fundamental Bola Basket
1. **Dribble Rendah**: Melindungi bola dari jangkauan lawan dengan membungkukkan badan.
2. **Chest Pass & Bounce Pass**: Umpan cepat setinggi dada dan umpan pantul untuk membelah pertahanan zone defense.
3. **Lay-Up Shoot**: Langkah berirama dua langkah (kanan-kiri-lompat) dengan memantulkan bola di sudut kotak papan pantul.`,
      materiInti: `### Fundamental Bola Basket
1. **Dribble Rendah**: Melindungi bola dari jangkauan lawan dengan membungkukkan badan.
2. **Chest Pass & Bounce Pass**: Umpan cepat setinggi dada dan umpan pantul untuk membelah pertahanan zone defense.
3. **Lay-Up Shoot**: Langkah berirama dua langkah (kanan-kiri-lompat) dengan memantulkan bola di sudut kotak papan pantul.`,
      videoUrl: 'https://www.youtube.com/watch?v=3g83hM-nBf4',
      gambarUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      aktivitasMurid:
        'Buat video rekaman gerak lambat lay-up shoot dengan langkah yang benar dan unggah ke LMS.',
      dibuatOleh: 'Haryono, S.Pd.Jas',
      tanggalDibuat: '2026-08-25',
    },
    {
      id: 'mat-3',
      judul: 'Bulutangkis: Footwork Cepat & Teknik Smash Menukik',
      kategori: 'Bulutangkis',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      fase: 'F',
      semester: '1',
      tujuanPembelajaran:
        'Peserta didik mampu memperagakan kelincahan footwork 6 titik lapangan serta teknik pukulan forehand overhead smash dengan sudut menukik tajam.',
      deskripsi:
        'Penguasaan koordinasi langkah kaki (footwork) dan timing pukulan shuttlecock di titik tertinggi jangkauan raket.',
      kontenTeks: `### Footwork Bulutangkis
Langkah kaki adalah 70% keberhasilan bermain bulutangkis. Posisi tubuh selalu kembali ke titik tengah (home base) setelah melakukan pukulan.
### Pukulan Smash
Gunakan lecutan pergelangan tangan (pronation) saat raket menyentuh kepala shuttlecock di titik optimal.`,
      materiInti: `### Footwork Bulutangkis
Langkah kaki adalah 70% keberhasilan bermain bulutangkis. Posisi tubuh selalu kembali ke titik tengah (home base) setelah melakukan pukulan.
### Pukulan Smash
Gunakan lecutan pergelangan tangan (pronation) saat raket menyentuh kepala shuttlecock di titik optimal.`,
      gambarUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      aktivitasMurid:
        'Latihan shuttle-run 6 titik sudut lapangan selama 3 set x 30 detik untuk melatih daya ledak.',
      dibuatOleh: 'Haryono, S.Pd.Jas',
      tanggalDibuat: '2026-09-01',
    },
    {
      id: 'mat-4',
      judul: 'Kebugaran Jasmani & Pengukuran Denyut Nadi Maksimal',
      kategori: 'Kebugaran Jasmani',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      fase: 'F',
      semester: '1',
      tujuanPembelajaran:
        'Menganalisis derajat kebugaran jasmani melalui tes daya tahan aerobik (VO2Max) dan memahami rumus target heart rate.',
      deskripsi:
        'Memahami konsep 220 - Usia untuk menentukan intensitas latihan aerobik pada zona pembakaran lemak dan penguatan kardiovaskular.',
      kontenTeks: `### Komponen Kebugaran Jasmani
1. Daya Tahan Kardiorespirasi (Cardiovascular Endurance)
2. Kekuatan Otot (Muscular Strength)
3. Kelenturan (Flexibility)
4. Komposisi Tubuh (Body Composition)

**Rumus Denyut Nadi Maksimal (DNM):**
DNM = 220 - Usia
Zona Latihan Efektif: 65% - 85% dari DNM.`,
      materiInti: `### Komponen Kebugaran Jasmani
1. Daya Tahan Kardiorespirasi (Cardiovascular Endurance)
2. Kekuatan Otot (Muscular Strength)
3. Kelenturan (Flexibility)
4. Komposisi Tubuh (Body Composition)

**Rumus Denyut Nadi Maksimal (DNM):**
DNM = 220 - Usia
Zona Latihan Efektif: 65% - 85% dari DNM.`,
      gambarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      aktivitasMurid: 'Hitung denyut nadi istirahat pagi hari dan denyut nadi setelah berolahraga 15 menit.',
      dibuatOleh: 'Ratna Sartika, S.Pd.',
      tanggalDibuat: '2026-09-02',
    },
  ],
  tugas: [
    {
      id: 'tug-1',
      judul: 'Tugas Analisis Video Gerakan Passing Bawah Bola Voli',
      materiId: 'mat-1',
      materiJudul: 'Teknik Dasar & Taktik Permainan Bola Voli',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      instruksi:
        'Rekam video gerakan passing bawah mandiri atau berpasangan durasi 1-2 menit. Jelaskan 3 kesalahan umum (sikap badan terlalu tegak, siku menekuk, perkenaan tidak rata) yang sering terjadi pada awal belajar.',
      tanggalMulai: '2026-09-01',
      deadline: '2026-09-12 23:59',
      jenisPengumpulan: 'Video/Foto',
      status: 'Aktif',
      dibuatOleh: 'Haryono, S.Pd.Jas',
    },
    {
      id: 'tug-2',
      judul: 'Laporan Jurnal Kebugaran Jasmani Mandiri 7 Hari',
      materiId: 'mat-4',
      materiJudul: 'Kebugaran Jasmani & Pengukuran Denyut Nadi Maksimal',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      instruksi:
        'Catat aktivitas fisik selama 7 hari berturut-turut meliputi jenis olahraga (jogging, push up, plank, skipping), durasi menit, denyut nadi sebelum dan sesudah latihan.',
      tanggalMulai: '2026-09-03',
      deadline: '2026-09-15 23:59',
      jenisPengumpulan: 'Dokumen',
      status: 'Aktif',
      dibuatOleh: 'Ratna Sartika, S.Pd.',
    },
  ],
  pengumpulanTugas: [],
  quiz: [
    {
      id: 'qz-1',
      judul: 'Quiz Pengetahuan: Aturan & Variasi Gerak Bola Voli (AKM/HOTS)',
      materiId: 'mat-1',
      materiJudul: 'Teknik Dasar & Taktik Permainan Bola Voli',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      durasiMenit: 20,
      batasWaktu: '2026-09-18 23:59',
      acakSoal: true,
      acakJawaban: true,
      dibuatOleh: 'Haryono, S.Pd.Jas',
      soal: DEFAULT_QUIZ_SOAL,
      soalList: DEFAULT_QUIZ_SOAL,
    },
  ],
  jawabanQuiz: [],
  penilaianPraktik: [],
  presensi: [],
  jurnal: [
    {
      id: 'jrn-1',
      tanggal: '2026-09-05',
      kelasId: 'cls-xi-1',
      kelasNama: 'XI 1',
      materi: 'Variasi Passing Bawah dan Formasi Bertahan Bola Voli',
      tujuanPembelajaran:
        'Peserta didik mampu melakukan gerak passing bawah berpasangan dengan akurasi 80% ke area setter.',
      kegiatanPembelajaran:
        'Pemanasan dinamis jogging keliling lapangan 3 putaran, stretching statis, drill berpasangan 15 menit, game simulasi 3v3 setengah lapangan.',
      metode: 'Demonstrasi Guru, Drill Praktik, dan Pembelajaran Berdiferensiasi',
      media: '10 Bola Voli Mikasa, Peluit Molten, Lapangan Utama SMAN 1, Kerucut Cone',
      kehadiranRingkas: 'Hadir: 32, Izin: 1, Sakit: 1, Alpa: 0',
      catatanRefleksi:
        'Mayoritas siswa sudah rileks saat kontak dengan bola. Perlu perhatian khusus bagi 4 siswa yang masih sering mengayun tangan terlalu tinggi di atas pundak.',
      guruId: 'usr-guru-1',
      guruNama: 'Haryono, S.Pd.Jas, M.Or.',
    },
  ],
  notifikasi: [
    {
      id: 'notif-1',
      judul: 'Tugas Baru Diberikan',
      pesan: 'Pak Haryono menambahkan tugas: Analisis Video Gerakan Passing Bawah Bola Voli.',
      waktu: '2 jam yang lalu',
      tipe: 'tugas',
      dibaca: false,
    },
    {
      id: 'notif-2',
      judul: 'Nilai Praktik Diberikan',
      pesan: 'Nilai praktik PJOK Passing Bawah Anda telah dinilai (Skor: 96 / Predikat A).',
      waktu: '1 hari yang lalu',
      tipe: 'nilai',
      dibaca: false,
    },
    {
      id: 'notif-3',
      judul: 'Quiz Aktif Tersedia',
      pesan: 'Quiz Pengetahuan Aturan & Variasi Gerak Bola Voli dibuka hingga 18 September 2026.',
      waktu: '2 hari yang lalu',
      tipe: 'quiz',
      dibaca: true,
    },
    {
      id: 'notif-4',
      judul: 'Pengumuman Penting',
      pesan: 'Jadwal Tes Kebugaran Jasmani Indonesia (TKJI) akan dilaksanakan Jumat depan.',
      waktu: '3 hari yang lalu',
      tipe: 'pengumuman',
      dibaca: true,
    },
  ],
  nilai: [],
  refleksi: [
    {
      id: 'ref-1',
      judul: 'Refleksi Pembelajaran: Teknik Passing Bola Voli',
      deskripsi: 'Evaluasi pemahaman, rasa percaya diri, dan tantangan yang dihadapi murid setelah praktik passing bola voli.',
      materiId: 'mat-1',
      materiJudul: 'Permainan Bola Voli - Passing Bawah & Atas',
      kelasIds: ['cls-xi-1', 'cls-xi-2', 'cls-xi-3', 'cls-xi-4', 'cls-xi-5', 'cls-xi-6', 'cls-xi-7'],
      guruId: 'usr-guru-1',
      guruNama: 'Haryono, S.Pd.Jas, M.Or.',
      tanggalDibuat: '2026-09-08',
      status: 'Aktif',
      soalList: [
        {
          id: 'sq-1',
          pertanyaan: 'Seberapa yakin dan nyaman kamu dalam mengarahkan bola saat melakukan passing bawah hari ini?',
          tipe: 'skala',
          kategori: 'perasaan',
        },
        {
          id: 'sq-2',
          pertanyaan: 'Bagian gerakan mana yang menurutmu paling menantang (posisi kaki, ayunan lengan, atau perkenaan bola)?',
          tipe: 'teks',
          kategori: 'kesulitan',
        },
        {
          id: 'sq-3',
          pertanyaan: 'Bagaimana komunikasi dan kerjasama dengan teman satu tim saat bermain reli operan bola?',
          tipe: 'teks',
          kategori: 'pemahaman',
        },
        {
          id: 'sq-4',
          pertanyaan: 'Apa target atau latihan yang ingin kamu coba mandiri untuk meningkatkan kualitas operanmu?',
          tipe: 'teks',
          kategori: 'tindak_lanjut',
        },
      ],
    },
    {
      id: 'ref-2',
      judul: 'Refleksi Kebugaran Jasmani & Kerjasama Tim',
      deskripsi: 'Refleksi kesadaran pola hidup bugar dan sportivitas dalam kegiatan olahraga kelompok.',
      kelasIds: ['cls-xi-1', 'cls-xi-2', 'cls-xi-3', 'cls-xi-4', 'cls-xi-5', 'cls-xi-6', 'cls-xi-7'],
      guruId: 'usr-guru-1',
      guruNama: 'Haryono, S.Pd.Jas, M.Or.',
      tanggalDibuat: '2026-09-09',
      status: 'Aktif',
      soalList: [
        {
          id: 'sq-5',
          pertanyaan: 'Seberapa bugar dan bersemangat energimu setelah menyelesaikan sesi pemanasan dan latihan kebugaran?',
          tipe: 'skala',
          kategori: 'perasaan',
        },
        {
          id: 'sq-6',
          pertanyaan: 'Tuliskan satu komitmen kebiasaan gerak aktif/sehat yang akan kamu jalani setiap hari di rumah!',
          tipe: 'teks',
          kategori: 'tindak_lanjut',
        },
      ],
    },
  ],
  jawabanRefleksi: [],
  materiPraktikList: [
    'Permainan Bola Voli - Passing Bawah & Atas',
    'Permainan Sepak Bola - Dribbling & Passing',
    'Bulutangkis - Servis Pendek & Smash',
    'Senam Lantai - Roll Depan & Belakang',
    'Kebugaran Jasmani - Tes MFT & Push Up',
    'Atletik - Lari Cepat & Estafet',
  ],
};

export type FirestoreSyncStatus = 'connecting' | 'synced' | 'syncing' | 'offline' | 'error';

class DataStorageService {
  private db: LMSDatabase;
  private listeners: Array<(db: LMSDatabase) => void> = [];
  private syncStatus: FirestoreSyncStatus = 'connecting';
  private lastSyncTime: Date | null = null;
  private statusListeners: Array<(status: FirestoreSyncStatus, lastSync?: Date | null) => void> = [];
  private isApplyingRemoteUpdate = false;
  private isSyncingToFirestore = false;
  private unsubscribeFirestore: Unsubscribe | null = null;
  private syncLogs: SpreadsheetSyncLog[] = [];
  private logListeners: Array<(logs: SpreadsheetSyncLog[]) => void> = [];

  constructor() {
    this.db = this.loadFromLocalStorage();
    // Reset nilai dan absensi ke nol sesuai permintaan user
    if (!this.db.isNilaiPresensiReset) {
      this.db.nilai = [];
      this.db.presensi = [];
      this.db.penilaianPraktik = [];
      this.db.jawabanQuiz = [];
      this.db.pengumpulanTugas = [];
      this.db.isNilaiPresensiReset = true;
      this.saveToLocalStorage(this.db);
    }
    this.initFirestoreSync();
    this.loadSyncLogsFromStorage();
  }

  /**
   * Mengosongkan seluruh rekap nilai (tugas, kuis, praktik) dan riwayat absensi
   * Siswa, Guru, Kelas, Materi, dan Tugas tetap aman tersimpan.
   */
  public resetNilaiDanPresensi(notifyUser: boolean = true): void {
    this.updateDatabase((prev) => ({
      ...prev,
      nilai: [],
      presensi: [],
      penilaianPraktik: [],
      jawabanQuiz: [],
      pengumpulanTugas: [],
      isNilaiPresensiReset: true,
      notifikasi: notifyUser
        ? [
            {
              id: `notif-reset-nilai-${Date.now()}`,
              judul: 'Nilai dan Absensi Direset ke Nol',
              pesan: 'Seluruh rekap nilai dan riwayat absensi telah dikosongkan. Siap mulai mengisi dari nol.',
              tipe: 'pengumuman',
              waktu: 'Baru saja',
              dibaca: false,
            },
            ...(prev.notifikasi || []),
          ]
        : prev.notifikasi,
    }));
    this.seedAllToFirestore();
  }

  private loadSyncLogsFromStorage() {
    try {
      const stored = localStorage.getItem('lms_pjok_sheet_logs');
      if (stored) {
        this.syncLogs = JSON.parse(stored);
      }
    } catch {
      this.syncLogs = [];
    }
  }

  public getSyncLogs(): SpreadsheetSyncLog[] {
    return [...this.syncLogs];
  }

  public addSyncLog(log: SpreadsheetSyncLog) {
    this.syncLogs = [log, ...this.syncLogs].slice(0, 50); // Keep last 50
    try {
      localStorage.setItem('lms_pjok_sheet_logs', JSON.stringify(this.syncLogs));
    } catch {}
    this.logListeners.forEach((fn) => fn([...this.syncLogs]));
  }

  public clearSyncLogs() {
    this.syncLogs = [];
    try {
      localStorage.removeItem('lms_pjok_sheet_logs');
    } catch {}
    this.logListeners.forEach((fn) => fn([]));
  }

  public subscribeSyncLogs(listener: (logs: SpreadsheetSyncLog[]) => void): () => void {
    this.logListeners.push(listener);
    listener([...this.syncLogs]);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== listener);
    };
  }

  public async testSpreadsheetDiagnostics(url?: string): Promise<DiagnosticReport> {
    const targetUrl = url || this.db.settings?.spreadsheetWebhookUrl || this.db.settings?.spreadsheetUrl || '';
    const report = await runSpreadsheetDiagnostics(targetUrl, this.db.settings?.spreadsheetUrl);
    report.logs.forEach((l) => this.addSyncLog(l));
    return report;
  }

  /**
   * Menginisialisasi pendengar real-time Firestore agar perubahan di satu perangkat
   * (misal laptop guru) langsung otomatis diterima di perangkat lain (misal HP siswa)
   */
  private async initFirestoreSync() {
    try {
      // Pastikan ada sesi autentikasi Firebase di background
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((err) => {
          console.info('Anonymous sign-in status:', err?.code || 'bypassed');
        });
      }

      this.updateSyncStatus('connecting');
      const recordsCol = collection(firestore, 'lms_records');

      // Pasang listener real-time onSnapshot
      this.unsubscribeFirestore = onSnapshot(
        recordsCol,
        (snapshot) => {
          this.lastSyncTime = new Date();

          if (snapshot.empty) {
            console.log('Firestore masih kosong, mengunggah data inisial sistem ke Firestore...');
            this.seedAllToFirestore();
            return;
          }

          // Jangan timpa jika sedang dalam proses upload lokal kita sendiri
          if (this.isSyncingToFirestore) {
            this.updateSyncStatus('synced');
            return;
          }

          this.isApplyingRemoteUpdate = true;
          try {
            const incoming: Partial<LMSDatabase> = {};
            let hasIncomingData = false;

            snapshot.forEach((docSnap) => {
              const docId = docSnap.id;
              const data = docSnap.data();

              if (docId === 'settings' && data?.data) {
                incoming.settings = { ...this.db.settings, ...data.data };
                hasIncomingData = true;
              } else if (data && Array.isArray(data.items)) {
                (incoming as any)[docId] = data.items;
                hasIncomingData = true;
              }
            });

            if (hasIncomingData) {
              this.db = {
                ...this.db,
                ...incoming,
                settings: incoming.settings || this.db.settings,
              };

              this.saveToLocalStorage(this.db);
              this.notifyLocalListeners();
            }

            this.updateSyncStatus('synced');
          } catch (err) {
            console.error('Gagal menerapkan update real-time dari Firestore:', err);
            this.updateSyncStatus('error');
          } finally {
            this.isApplyingRemoteUpdate = false;
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error (offline fallback active):', error?.message || error);
          this.updateSyncStatus('offline');
        }
      );
    } catch (error) {
      console.warn('Gagal menghubungkan listener real-time Firestore:', error);
      this.updateSyncStatus('offline');
    }
  }

  /**
   * Mengunggah seluruh data inisial ke Firestore (digunakan saat koleksi baru dibuat)
   */
  public async seedAllToFirestore(): Promise<void> {
    try {
      this.updateSyncStatus('syncing');
      const sections: (keyof LMSDatabase)[] = [
        'settings',
        'users',
        'kelas',
        'mataPelajaran',
        'materi',
        'tugas',
        'pengumpulanTugas',
        'quiz',
        'jawabanQuiz',
        'penilaianPraktik',
        'presensi',
        'jurnal',
        'notifikasi',
        'nilai',
        'refleksi',
        'jawabanRefleksi',
        'materiPraktikList',
      ];

      for (const sec of sections) {
        const docRef = doc(firestore, 'lms_records', sec);
        const rawVal = this.db[sec];
        const cleanVal = JSON.parse(JSON.stringify(rawVal));

        const payload =
          sec === 'settings'
            ? { data: cleanVal, section: sec, updatedAt: new Date().toISOString() }
            : { items: cleanVal, section: sec, updatedAt: new Date().toISOString() };

        await setDoc(docRef, payload, { merge: true });
      }

      this.lastSyncTime = new Date();
      this.updateSyncStatus('synced');
      console.log('Seluruh database awal berhasil disinkronkan ke Firestore cloud.');
    } catch (err) {
      console.error('Gagal melakukan seed database ke Firestore:', err);
      this.updateSyncStatus('error');
    }
  }

  /**
   * Sinkronkan bagian yang berubah ke Firestore secara otomatis
   */
  private async syncChangesToFirestore(prev: LMSDatabase, next: LMSDatabase) {
    if (this.isApplyingRemoteUpdate) {
      return;
    }

    try {
      this.isSyncingToFirestore = true;
      this.updateSyncStatus('syncing');

      const sections: (keyof LMSDatabase)[] = [
        'settings',
        'users',
        'kelas',
        'mataPelajaran',
        'materi',
        'tugas',
        'pengumpulanTugas',
        'quiz',
        'jawabanQuiz',
        'penilaianPraktik',
        'presensi',
        'jurnal',
        'notifikasi',
        'nilai',
        'refleksi',
        'jawabanRefleksi',
        'materiPraktikList',
      ];

      const changedSections = sections.filter((sec) => prev[sec] !== next[sec]);

      for (const sec of changedSections) {
        const docRef = doc(firestore, 'lms_records', sec);
        const rawVal = next[sec];
        const cleanVal = JSON.parse(JSON.stringify(rawVal));

        const payload =
          sec === 'settings'
            ? { data: cleanVal, section: sec, updatedAt: new Date().toISOString() }
            : { items: cleanVal, section: sec, updatedAt: new Date().toISOString() };

        await setDoc(docRef, payload, { merge: true });
      }

      this.lastSyncTime = new Date();
      this.updateSyncStatus('synced');
    } catch (err: any) {
      console.warn('Gagal sinkronisasi ke Firestore (data tetap aman di penyimpanan lokal):', err?.message || err);
      this.updateSyncStatus('offline');
    } finally {
      this.isSyncingToFirestore = false;
    }
  }

  private updateSyncStatus(status: FirestoreSyncStatus) {
    this.syncStatus = status;
    this.statusListeners.forEach((l) => l(status, this.lastSyncTime));
  }

  public getSyncStatus(): FirestoreSyncStatus {
    return this.syncStatus;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public onSyncStatusChange(
    listener: (status: FirestoreSyncStatus, lastSync?: Date | null) => void
  ): () => void {
    this.statusListeners.push(listener);
    listener(this.syncStatus, this.lastSyncTime);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  public async forceRefreshFromFirestore(): Promise<void> {
    try {
      this.updateSyncStatus('syncing');
      const recordsCol = collection(firestore, 'lms_records');
      const snapshot = await getDocs(recordsCol);

      if (!snapshot.empty) {
        const incoming: Partial<LMSDatabase> = {};
        snapshot.forEach((docSnap) => {
          const docId = docSnap.id;
          const data = docSnap.data();
          if (docId === 'settings' && data?.data) {
            incoming.settings = data.data;
          } else if (data && Array.isArray(data.items)) {
            (incoming as any)[docId] = data.items;
          }
        });

        this.db = {
          ...this.db,
          ...incoming,
          settings: incoming.settings || this.db.settings,
        };
        this.saveToLocalStorage(this.db);
        this.notifyLocalListeners();
      }
      this.lastSyncTime = new Date();
      this.updateSyncStatus('synced');
    } catch (err) {
      console.error('Gagal mengambil data paksa dari Firestore:', err);
      this.updateSyncStatus('error');
    }
  }

  public getCurrentUser(): User | null {
    try {
      const savedUser = localStorage.getItem('lms_pjok_current_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      // fallback
    }
    return null;
  }

  public setCurrentUser(user: User | null) {
    try {
      if (user) {
        localStorage.setItem('lms_pjok_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('lms_pjok_current_user');
      }
    } catch (e) {
      console.error('Failed to save current user:', e);
    }
  }

  public clearCurrentUser() {
    try {
      localStorage.removeItem('lms_pjok_current_user');
      sessionStorage.removeItem('lms_pjok_session_active');
    } catch (e) {
      console.error('Failed to clear current user:', e);
    }
  }

  public resetToDefault() {
    this.resetToDefaults();
  }

  private loadFromLocalStorage(): LMSDatabase {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('lms_pjok_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isCleanSlate = parsed?.isCleanSlate === true;

        let loadedUsers: User[] = Array.isArray(parsed?.users) && parsed.users.length > 0 ? parsed.users : (isCleanSlate ? [] : INITIAL_DATABASE.users);
        if (!isCleanSlate) {
          // Auto-upgrade if previous database had old mock users or did not have 31 accurate students
          const hasAccurateData = loadedUsers.some(
            (u: any) => u.name === 'Gede Aditya Peratama' || u.name === 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.'
          );
          if (!hasAccurateData || loadedUsers.length < 30) {
            loadedUsers = INITIAL_DATABASE.users;
          }
        }

        let loadedNilai = Array.isArray(parsed?.nilai) ? parsed.nilai : [];
        let loadedPresensi = Array.isArray(parsed?.presensi) ? parsed.presensi : [];

        const primaryTeacher = 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.';

        return {
          ...INITIAL_DATABASE,
          ...parsed,
          isCleanSlate,
          settings: {
            ...INITIAL_DATABASE.settings,
            ...(parsed?.settings || {}),
            namaGuruPJOKUtama: parsed?.settings?.namaGuruPJOKUtama && parsed?.settings?.namaGuruPJOKUtama !== 'Haryono, S.Pd.Jas, M.Or.'
              ? parsed.settings.namaGuruPJOKUtama
              : primaryTeacher,
          },
          users: loadedUsers,
          kelas: Array.isArray(parsed?.kelas) ? parsed.kelas : INITIAL_DATABASE.kelas,
          mataPelajaran: Array.isArray(parsed?.mataPelajaran) ? parsed.mataPelajaran : INITIAL_DATABASE.mataPelajaran,
          materi: Array.isArray(parsed?.materi)
            ? (isCleanSlate ? parsed.materi : parsed.materi.map((m: any) => ({
                ...m,
                guruNama: m.guruNama === 'Haryono, S.Pd.Jas' ? primaryTeacher : (m.guruNama || m.dibuatOleh || primaryTeacher),
                dibuatOleh: m.dibuatOleh === 'Haryono, S.Pd.Jas' ? primaryTeacher : (m.dibuatOleh || m.guruNama || primaryTeacher),
                materiInti: m.materiInti || m.kontenTeks || m.konten || '',
              })))
            : (isCleanSlate ? [] : INITIAL_DATABASE.materi),
          tugas: Array.isArray(parsed?.tugas)
            ? (isCleanSlate ? parsed.tugas : parsed.tugas.map((t: any) => ({
                ...t,
                guruNama: t.guruNama === 'Haryono, S.Pd.Jas' ? primaryTeacher : (t.guruNama || t.dibuatOleh || primaryTeacher),
                dibuatOleh: t.dibuatOleh === 'Haryono, S.Pd.Jas' ? primaryTeacher : (t.dibuatOleh || t.guruNama || primaryTeacher),
              })))
            : (isCleanSlate ? [] : INITIAL_DATABASE.tugas),
          pengumpulanTugas: Array.isArray(parsed?.pengumpulanTugas) ? parsed.pengumpulanTugas : (isCleanSlate ? [] : INITIAL_DATABASE.pengumpulanTugas),
          quiz: Array.isArray(parsed?.quiz)
            ? (isCleanSlate ? parsed.quiz : parsed.quiz.map((q: any) => {
                let rawSoal = Array.isArray(q.soal) && q.soal.length > 0 
                  ? q.soal 
                  : (Array.isArray(q.soalList) ? q.soalList : []);
                
                if (rawSoal.length < 6 || !rawSoal.some((s: any) => s.tipe === 'Mencocokkan Gambar' || s.tipe === 'Tarik Garis')) {
                  rawSoal = DEFAULT_QUIZ_SOAL;
                }

                return {
                  ...q,
                  soal: rawSoal,
                  soalList: rawSoal,
                  guruNama: q.guruNama === 'Haryono, S.Pd.Jas' ? primaryTeacher : (q.guruNama || q.dibuatOleh || primaryTeacher),
                  dibuatOleh: q.dibuatOleh === 'Haryono, S.Pd.Jas' ? primaryTeacher : (q.dibuatOleh || q.guruNama || primaryTeacher),
                };
              }))
            : (isCleanSlate ? [] : INITIAL_DATABASE.quiz),
          jawabanQuiz: Array.isArray(parsed?.jawabanQuiz) ? parsed.jawabanQuiz : (isCleanSlate ? [] : INITIAL_DATABASE.jawabanQuiz),
          penilaianPraktik: Array.isArray(parsed?.penilaianPraktik)
            ? (isCleanSlate ? parsed.penilaianPraktik : parsed.penilaianPraktik.map((p: any) => ({
                ...p,
                materiJudul: p.materiJudul || p.materi || 'Praktik PJOK',
                nilaiTotal: p.nilaiTotal ?? p.nilaiAkhir ?? 80,
                catatanEvaluasi: p.catatanEvaluasi || p.catatanGuru || '',
                guruPenilai: p.guruPenilai === 'Haryono, S.Pd.Jas' ? primaryTeacher : (p.guruPenilai || p.guruNama || primaryTeacher),
                rubrik: p.rubrik || {
                  sikapAwal: p.aspekNilai?.sikapAwal ?? 3,
                  pelaksanaanTeknik: p.aspekNilai?.teknikGerakan ?? 3,
                  sikapAkhir: p.aspekNilai?.koordinasi ?? 3,
                  hasilGerakan: p.aspekNilai?.ketepatan ?? 3,
                  sportivitas: p.aspekNilai?.sportivitas ?? 4,
                  kerjaSama: p.aspekNilai?.kerjaSama ?? 4,
                },
              })))
            : (isCleanSlate ? [] : INITIAL_DATABASE.penilaianPraktik),
          presensi: loadedPresensi,
          jurnal: Array.isArray(parsed?.jurnal) ? parsed.jurnal : (isCleanSlate ? [] : INITIAL_DATABASE.jurnal),
          notifikasi: Array.isArray(parsed?.notifikasi) ? parsed.notifikasi : (isCleanSlate ? [] : INITIAL_DATABASE.notifikasi),
          nilai: loadedNilai,
          refleksi: Array.isArray(parsed?.refleksi) ? parsed.refleksi : INITIAL_DATABASE.refleksi,
          jawabanRefleksi: Array.isArray(parsed?.jawabanRefleksi) ? parsed.jawabanRefleksi : [],
          materiPraktikList: Array.isArray(parsed?.materiPraktikList) ? parsed.materiPraktikList : INITIAL_DATABASE.materiPraktikList,
          isNilaiPresensiReset: parsed?.isNilaiPresensiReset ?? false,
        };
      }
    } catch (e) {
      console.error('Failed to load local DB, resetting to defaults:', e);
    }
    this.saveToLocalStorage(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  }

  private saveToLocalStorage(data: LMSDatabase) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public getDatabase(): LMSDatabase {
    return this.db;
  }

  public subscribe(listener: (db: LMSDatabase) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyLocalListeners() {
    this.listeners.forEach((l) => l(this.db));
  }

  private notify() {
    this.saveToLocalStorage(this.db);
    this.notifyLocalListeners();
  }

  public updateDatabase(updater: (prev: LMSDatabase) => LMSDatabase) {
    const prev = this.db;
    const next = updater(prev);
    this.db = next;
    this.notify();
    // Sinkronkan perubahan secara asinkron ke Firestore
    this.syncChangesToFirestore(prev, next);
  }

  public resetToDefaults() {
    this.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.notify();
    this.seedAllToFirestore();
  }

  /**
   * Mengosongkan seluruh data pembelajaran, siswa, kuis, tugas, dan nilai agar bisa diisi dari nol.
   * Tetap mempertahankan:
   * 1. Akun Admin dan Guru utama (agar tidak terkunci keluar)
   * 2. Pengaturan sekolah dan konfigurasi Google Spreadsheet / Webhook
   */
  public resetToCleanSlate(keepAdminAndGuru: boolean = true) {
    const currentSettings = this.db.settings || INITIAL_DATABASE.settings;

    let retainedUsers: User[] = [];
    if (keepAdminAndGuru) {
      retainedUsers = (this.db.users || []).filter((u) => u.role === 'ADMIN' || u.role === 'GURU');
      if (!retainedUsers.some((u) => u.role === 'ADMIN')) {
        retainedUsers.unshift(DEFAULT_USERS[0]);
      }
      if (!retainedUsers.some((u) => u.role === 'GURU')) {
        const defaultTeacher = DEFAULT_USERS.find((u) => u.role === 'GURU') || DEFAULT_USERS[1];
        retainedUsers.push(defaultTeacher);
      }
    } else {
      retainedUsers = [DEFAULT_USERS[0], DEFAULT_USERS[1]];
    }

    const resetKelas = (this.db.kelas || INITIAL_DATABASE.kelas).map((k) => ({
      ...k,
      totalMurid: 0,
    }));

    const cleanDb: LMSDatabase = {
      isCleanSlate: true,
      cleanSlateTimestamp: new Date().toISOString(),
      settings: {
        ...currentSettings,
        terakhirSinkron: new Date().toISOString(),
      },
      users: retainedUsers,
      kelas: resetKelas,
      mataPelajaran: this.db.mataPelajaran || INITIAL_DATABASE.mataPelajaran,
      materi: [],
      tugas: [],
      pengumpulanTugas: [],
      quiz: [],
      jawabanQuiz: [],
      penilaianPraktik: [],
      presensi: [],
      jurnal: [],
      notifikasi: [
        {
          id: `notif-clean-${Date.now()}`,
          judul: 'Database Telah Direset ke Nol',
          pesan: 'Data pembelajaran, tugas, kuis, nilai, dan murid telah dibersihkan. Anda dapat mulai mengisi dari nol atau mengimpor dari Google Sheets.',
          tipe: 'pengumuman',
          waktu: 'Baru saja',
          dibaca: false,
        },
      ],
      nilai: [],
    };

    this.db = cleanDb;
    this.notify();
    this.seedAllToFirestore();
  }

  // Helper getters
  public getMuridList(kelasId?: string): User[] {
    return this.db.users.filter(
      (u) => u.role === 'MURID' && (!kelasId || u.kelasId === kelasId)
    );
  }

  public getGuruList(): User[] {
    return this.db.users.filter((u) => u.role === 'GURU');
  }

  public getKelasList(): Kelas[] {
    return this.db.kelas;
  }

  public getMateriList(kelasId?: string): Materi[] {
    return this.db.materi.filter((m) => !kelasId || m.kelasId === kelasId);
  }

  public getTugasList(kelasId?: string): Tugas[] {
    return this.db.tugas.filter((t) => !kelasId || t.kelasId === kelasId);
  }

  public getQuizList(kelasId?: string): Quiz[] {
    return this.db.quiz.filter((q) => !kelasId || q.kelasId === kelasId);
  }

  // Refleksi helpers
  public saveRefleksi(item: RefleksiPembelajaran) {
    this.updateDatabase((prev) => {
      const existingList = prev.refleksi || [];
      const idx = existingList.findIndex((r) => r.id === item.id);
      let updated: RefleksiPembelajaran[];
      if (idx >= 0) {
        updated = [...existingList];
        updated[idx] = item;
      } else {
        updated = [item, ...existingList];
      }
      return {
        ...prev,
        refleksi: updated,
      };
    });
  }

  public deleteRefleksi(id: string) {
    this.updateDatabase((prev) => ({
      ...prev,
      refleksi: (prev.refleksi || []).filter((r) => r.id !== id),
      jawabanRefleksi: (prev.jawabanRefleksi || []).filter((j) => j.refleksiId !== id),
    }));
  }

  public submitJawabanRefleksi(jawaban: JawabanRefleksiMurid) {
    this.updateDatabase((prev) => {
      const list = prev.jawabanRefleksi || [];
      const existingIdx = list.findIndex(
        (j) => j.refleksiId === jawaban.refleksiId && j.muridId === jawaban.muridId
      );
      let updated: JawabanRefleksiMurid[];
      if (existingIdx >= 0) {
        updated = [...list];
        updated[existingIdx] = { ...list[existingIdx], ...jawaban };
      } else {
        updated = [jawaban, ...list];
      }
      return {
        ...prev,
        jawabanRefleksi: updated,
      };
    });
  }

  public tanggapiRefleksi(jawabanId: string, catatanGuru: string) {
    this.updateDatabase((prev) => {
      const list = (prev.jawabanRefleksi || []).map((j) => {
        if (j.id === jawabanId) {
          return {
            ...j,
            catatanGuru,
            tanggalTanggapanGuru: new Date().toISOString().slice(0, 10),
          };
        }
        return j;
      });
      return {
        ...prev,
        jawabanRefleksi: list,
      };
    });
  }

  // Materi Praktik & Penilaian Multi-Materi helpers
  public addMateriPraktik(judulMateri: string) {
    const trimmed = judulMateri.trim();
    if (!trimmed) return;
    this.updateDatabase((prev) => {
      const current = prev.materiPraktikList || [];
      if (current.includes(trimmed)) return prev;
      return {
        ...prev,
        materiPraktikList: [...current, trimmed],
      };
    });
  }

  public savePenilaianPraktikBatch(newItems: PenilaianPraktik[]) {
    this.updateDatabase((prev) => {
      const existing = [...(prev.penilaianPraktik || [])];
      newItems.forEach((newItem) => {
        const targetMateri = newItem.materiJudul || newItem.materi || '';
        const idx = existing.findIndex(
          (p) =>
            p.muridId === newItem.muridId &&
            ((p.materiJudul || p.materi || '').trim().toLowerCase() === targetMateri.trim().toLowerCase())
        );
        if (idx >= 0) {
          existing[idx] = newItem;
        } else {
          existing.push(newItem);
        }
      });
      return {
        ...prev,
        penilaianPraktik: existing,
      };
    });
  }

  // CSV & Spreadsheet Integration Methods
  public exportUsersCSV(): string {
    return exportUsersToCSV(this.db.users);
  }

  public importUsersCSV(csvText: string): { count: number; message: string } {
    const importedUsers = parseCSVToUsers(csvText);
    if (importedUsers.length === 0) {
      return { count: 0, message: 'Tidak ada data pengguna yang valid ditemukan dalam CSV.' };
    }

    this.updateDatabase((prev) => {
      // Merge users by ID or username
      const existingMap = new Map(prev.users.map((u) => [u.id, u]));
      for (const u of importedUsers) {
        existingMap.set(u.id, {
          ...(existingMap.get(u.id) || {}),
          ...u,
        });
      }
      return {
        ...prev,
        users: Array.from(existingMap.values()),
        settings: {
          ...prev.settings,
          terakhirSinkron: new Date().toISOString(),
        },
      };
    });

    return {
      count: importedUsers.length,
      message: `Berhasil mengimpor ${importedUsers.length} data pengguna dari Spreadsheet / CSV!`,
    };
  }

  public async syncToLinkedSpreadsheet(webhookUrl?: string): Promise<{ success: boolean; message: string; log?: SpreadsheetSyncLog }> {
    const startTime = Date.now();
    const url = webhookUrl || this.db.settings?.spreadsheetWebhookUrl;
    if (!url) {
      const errLog: SpreadsheetSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'PUSH',
        method: 'WEBHOOK_POST',
        url: '(Belum diatur)',
        httpStatus: null,
        durationMs: 0,
        success: false,
        message: 'URL Webhook Google Apps Script belum dikonfigurasi.',
        recommendation: 'Buka pengaturan Spreadsheet dan masukkan URL Web App Google Apps Script (/exec).',
      };
      this.addSyncLog(errLog);
      return {
        success: false,
        message: 'URL Webhook Google Apps Script belum dikonfigurasi.',
        log: errLog,
      };
    }

    try {
      const payload = this.toSheetsPayload();
      const res = await syncViaAppsScriptWebhook(url, payload);
      const durationMs = Date.now() - startTime;

      if (res.success) {
        this.updateDatabase((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            terakhirSinkron: new Date().toISOString(),
          },
        }));
      }

      const log: SpreadsheetSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'PUSH',
        method: 'WEBHOOK_POST',
        url,
        httpStatus: res.statusCode ?? 200,
        durationMs,
        success: res.success,
        message: res.message,
        details: res.details,
      };
      this.addSyncLog(log);

      return {
        success: res.success,
        message: res.message,
        log,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const log: SpreadsheetSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'PUSH',
        method: 'WEBHOOK_POST',
        url,
        httpStatus: 0,
        durationMs,
        success: false,
        message: err?.message || 'Gagal menyinkronkan data ke Spreadsheet Webhook.',
        details: String(err),
      };
      this.addSyncLog(log);
      return {
        success: false,
        message: err?.message || 'Gagal menyinkronkan data ke Spreadsheet Webhook.',
        log,
      };
    }
  }

  public async pullFromLinkedSpreadsheet(
    webhookUrl?: string
  ): Promise<{ success: boolean; count: number; message: string; log?: SpreadsheetSyncLog }> {
    const startTime = Date.now();
    const targetUrl = webhookUrl || this.db.settings?.spreadsheetWebhookUrl || this.db.settings?.spreadsheetUrl;
    const fallbackSheetUrl = this.db.settings?.spreadsheetUrl;

    if (!targetUrl) {
      const errLog: SpreadsheetSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'PULL',
        method: 'WEBHOOK_GET',
        url: '(Belum diatur)',
        httpStatus: null,
        durationMs: 0,
        success: false,
        message: 'URL Webhook maupun URL Google Spreadsheet belum dikonfigurasi.',
        recommendation: 'Masukkan URL Google Apps Script atau URL Google Spreadsheet di modal sinkronisasi.',
      };
      this.addSyncLog(errLog);
      return {
        success: false,
        count: 0,
        message: 'URL Webhook maupun URL Google Spreadsheet belum dikonfigurasi.',
        log: errLog,
      };
    }

    try {
      let rawDataList: any[] = [];
      let statusCode = 200;
      let usedMethod: SpreadsheetSyncLog['method'] = 'WEBHOOK_GET';
      let syncMessage = '';
      let isCors = false;
      let isAuth = false;

      // 1. Check if direct Spreadsheet URL
      if (targetUrl.includes('docs.google.com/spreadsheets')) {
        usedMethod = 'GVIZ_CSV';
        const gvizRes = await fetchSheetViaGViz(targetUrl, 'USERS');
        statusCode = gvizRes.statusCode;
        if (gvizRes.success && gvizRes.data.length > 0) {
          rawDataList = gvizRes.data;
          syncMessage = gvizRes.message;
        } else {
          throw new Error(gvizRes.message);
        }
      } else {
        // 2. Apps Script Webhook
        const res = await fetchViaAppsScriptWebhook(targetUrl, 'USERS');
        statusCode = res.statusCode;
        isCors = !!res.corsBlocked;
        isAuth = !!res.authError;

        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          rawDataList = res.data;
          syncMessage = res.message || `Berhasil mengambil ${rawDataList.length} data.`;
        } else if (res.data?.USERS && Array.isArray(res.data.USERS) && res.data.USERS.length > 0) {
          rawDataList = res.data.USERS;
          syncMessage = res.message || `Berhasil mengambil ${rawDataList.length} data.`;
        } else {
          // If Apps Script failed, check if we have a fallback Spreadsheet URL
          const sheetId = extractSpreadsheetId(fallbackSheetUrl || '');
          if (sheetId) {
            const fallbackRes = await fetchSheetViaGViz(sheetId, 'USERS');
            if (fallbackRes.success && fallbackRes.data.length > 0) {
              usedMethod = 'GVIZ_CSV';
              rawDataList = fallbackRes.data;
              statusCode = fallbackRes.statusCode;
              syncMessage = `Sinkronisasi dialihkan ke jalur Google Spreadsheet langsung (GViz CSV): ${fallbackRes.data.length} data berhasil ditarik!`;
            } else {
              throw new Error(res.message || 'Tidak ada data pengguna yang valid ditemukan dalam respons Google Apps Script.');
            }
          } else {
            throw new Error(res.message || 'Tidak ada data pengguna yang valid ditemukan dalam respons Google Apps Script.');
          }
        }
      }

      // 3. Normalize User records
      const mappedUsers: User[] = rawDataList.map((u: any, idx: number) => {
        const rawRole = String(u.role || u.Role || u.peran || u.Peran || 'MURID').toUpperCase();
        const role = rawRole.includes('GURU') ? 'GURU' : rawRole.includes('ADMIN') ? 'ADMIN' : 'MURID';
        const rawName = u.name || u.nama || u.Nama || u.NAMA || u.namalengkap || u.nama_lengkap || `Pengguna ${idx + 1}`;
        const rawUsername = u.username || u.Username || u.nis || u.nip || rawName.toLowerCase().replace(/\s+/g, '') || `user${idx + 1}`;

        return {
          id: u.id || u.ID || `usr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
          username: rawUsername,
          role,
          name: rawName,
          email: u.email || u.Email || '',
          status: (u.status || u.Status || 'Aktif') === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
          nis: u.nis || u.NIS || u.nisn || (role === 'MURID' ? u.nip : '') || '',
          nip: u.nip || u.NIP || (role === 'GURU' ? u.nis : '') || '',
          avatar: u.avatar || u.foto || '',
          kelasId: u.kelasId || u.kelas || u.rombel || 'cls-xi-1',
          tahunPelajaran: u.tahunPelajaran || u.tahun_ajaran || '2026/2027',
          jenisKelamin: (u.jenisKelamin || u.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
        };
      });

      if (mappedUsers.length > 0) {
        this.updateDatabase((prev) => {
          const map = new Map(prev.users.map((item) => [item.id, item]));
          // Also index by username to prevent duplicates
          const usernameMap = new Map(prev.users.map((item) => [item.username.toLowerCase(), item.id]));

          mappedUsers.forEach((item: User) => {
            const existingId = usernameMap.get(item.username.toLowerCase());
            if (existingId && existingId !== item.id) {
              map.set(existingId, { ...map.get(existingId), ...item, id: existingId });
            } else {
              map.set(item.id, { ...map.get(item.id), ...item });
            }
          });

          return {
            ...prev,
            users: Array.from(map.values()),
            settings: {
              ...prev.settings,
              terakhirSinkron: new Date().toISOString(),
            },
          };
        });
      }

      const durationMs = Date.now() - startTime;
      const successLog: SpreadsheetSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'PULL',
        method: usedMethod,
        url: targetUrl,
        httpStatus: statusCode,
        durationMs,
        success: true,
        recordsCount: mappedUsers.length,
        message: syncMessage || `Berhasil menarik ${mappedUsers.length} data dari Spreadsheet!`,
      };
      this.addSyncLog(successLog);

      return {
        success: true,
        count: mappedUsers.length,
        message: syncMessage || `Berhasil menarik ${mappedUsers.length} data dari Spreadsheet!`,
        log: successLog,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errMsg = err?.message || 'Gagal menarik data dari Google Spreadsheet.';
      const isCors = errMsg.includes('CORS') || errMsg.includes('TypeError') || errMsg.includes('fetch');
      const isAuth = errMsg.includes('Autentikasi') || errMsg.includes('login') || errMsg.includes('Privat');

      const errLog: SpreadsheetSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'PULL',
        method: targetUrl.includes('docs.google.com') ? 'GVIZ_CSV' : 'WEBHOOK_GET',
        url: targetUrl,
        httpStatus: isCors ? 0 : isAuth ? 401 : 500,
        durationMs,
        success: false,
        recordsCount: 0,
        corsDetected: isCors,
        authErrorDetected: isAuth,
        message: errMsg,
        details: String(err),
        recommendation: isCors
          ? 'Pastikan Google Apps Script di-deploy dengan "Who has access: Anyone (Siapa saja)". Atau gunakan link Google Spreadsheet dengan izin "Siapa saja dengan link dapat melihat".'
          : isAuth
          ? 'Akses Spreadsheet ditolak oleh Google. Ubah izin berbagi Google Sheets menjadi "Siapa saja yang memiliki tautan" sebagai Pelihat.'
          : 'Periksa URL dan pastikan lembar kerja "USERS" memiliki header id, username, role, name, nip, email.',
      };
      this.addSyncLog(errLog);

      return {
        success: false,
        count: 0,
        message: errMsg,
        log: errLog,
      };
    }
  }


  // Format data for Google Sheets tables
  public toSheetsPayload(): Record<string, any[]> {
    return {
      USERS: this.db.users,
      ADMIN: this.db.users.filter((u) => u.role === 'ADMIN'),
      GURU: this.db.users.filter((u) => u.role === 'GURU'),
      MURID: this.db.users.filter((u) => u.role === 'MURID'),
      KELAS: this.db.kelas,
      MATERI: this.db.materi,
      TUGAS: this.db.tugas,
      PENGUMPULAN: this.db.pengumpulanTugas,
      QUIZ: this.db.quiz.map((q: any) => {
        const list = q.soalList || q.soal || [];
        const { soalList, soal, ...rest } = q;
        return {
          ...rest,
          jumlahSoal: list.length,
        };
      }),
      SOAL: this.db.quiz.flatMap((q) => q.soalList || q.soal || []),
      JAWABAN: this.db.jawabanQuiz,
      PRESENSI: this.db.presensi,
      NILAI: this.db.penilaianPraktik,
      JURNAL: this.db.jurnal,
      NOTIFIKASI: this.db.notifikasi,
      SETTING: [this.db.settings],
    };
  }
}

export const dataStorage = new DataStorageService();
