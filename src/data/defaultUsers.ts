import { User, RekapNilaiMurid } from '../types';

export interface StudentCSVRecord {
  id: string;
  username: string;
  role: string;
  name: string;
  nip: string;
  email?: string;
  status: 'Aktif' | 'Nonaktif';
  avatar?: string;
}

export const RAW_USERS_CSV_DATA: StudentCSVRecord[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    role: 'ADMIN',
    name: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
    nip: '198811152022211012',
    email: 'i5123@guru.sma.belajar.id',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-guru-1',
    username: 'guru',
    role: 'GURU',
    name: 'I Ketut Agus Nova Anggarawan, S.Pd., Gr.',
    nip: '198811152022211013',
    email: 'i5123@guru.sma.belajar.id',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-guru-2',
    username: 'ratna',
    role: 'GURU',
    name: 'Ratna Sartika, S.Pd.',
    nip: '19901020 201502 2 004',
    email: 'ratna.pjok@sman1olahraga.sch.id',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-1',
    username: 'usr-murid-1',
    role: 'murid1',
    name: 'Gede Aditya Peratama',
    nip: '7504',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-2',
    username: 'usr-murid-2',
    role: 'murid2',
    name: 'Gede Eric Surya Purnama',
    nip: '7474',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-3',
    username: 'usr-murid-3',
    role: 'murid3',
    name: 'Gede Reynard Dharma Mahardika',
    nip: '7440',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-4',
    username: 'usr-murid-4',
    role: 'murid4',
    name: 'I Gede Mukiadi',
    nip: '7478',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-5',
    username: 'usr-murid-5',
    role: 'murid5',
    name: 'I Komang Nova Andriana',
    nip: '7612',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-6',
    username: 'usr-murid-6',
    role: 'murid6',
    name: 'Ida Ayu Putu Savira Maharani',
    nip: '7480',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-7',
    username: 'usr-murid-7',
    role: 'murid7',
    name: 'Kadek Dito Mahendra',
    nip: '7679',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-8',
    username: 'usr-murid-8',
    role: 'murid8',
    name: 'Kadek Wilma Adhya Kusuma',
    nip: '7483',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-9',
    username: 'usr-murid-9',
    role: 'murid9',
    name: 'Kenzie Ramdhan Tjhang',
    nip: '7447',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-10',
    username: 'usr-murid-10',
    role: 'murid10',
    name: 'Ketut Cetra Neo Budiartha',
    nip: '7484',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-11',
    username: 'usr-murid-11',
    role: 'murid11',
    name: 'Komang Ayu Mahadewi',
    nip: '7450',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-12',
    username: 'usr-murid-12',
    role: 'murid12',
    name: 'Komang Bintang Gayatri',
    nip: '7451',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-13',
    username: 'usr-murid-13',
    role: 'murid13',
    name: 'Komang Ceriya Ningsih',
    nip: '7721',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-14',
    username: 'usr-murid-14',
    role: 'murid14',
    name: 'Komang Dhini Pradnyamita Kesuma',
    nip: '7453',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-15',
    username: 'usr-murid-15',
    role: 'murid15',
    name: 'Komang Dian Widyasari',
    nip: '7454',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-16',
    username: 'usr-murid-16',
    role: 'murid16',
    name: 'Luh Tina Cahyani',
    nip: '7725',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-17',
    username: 'usr-murid-17',
    role: 'murid17',
    name: 'Made Dwi Astuti Damayanti',
    nip: '7630',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-18',
    username: 'usr-murid-18',
    role: 'murid18',
    name: 'Made Gustini',
    nip: '7696',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-19',
    username: 'usr-murid-19',
    role: 'murid19',
    name: 'Made Suyasa',
    nip: '7731',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-20',
    username: 'usr-murid-20',
    role: 'murid20',
    name: 'Nadine Azzahra Gauri Jendra',
    nip: '7697',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-21',
    username: 'usr-murid-21',
    role: 'murid21',
    name: 'Ni Ketut Kirani Savitri',
    nip: '7526',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-22',
    username: 'usr-murid-22',
    role: 'murid22',
    name: 'Ni Komang Nova Ayu Purwani',
    nip: '7665',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-23',
    username: 'usr-murid-23',
    role: 'murid23',
    name: 'Ni Made Asha Caitanya',
    nip: '7496',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-24',
    username: 'usr-murid-24',
    role: 'murid24',
    name: 'Ni Made Avara Cetasa',
    nip: '7497',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-25',
    username: 'usr-murid-25',
    role: 'murid25',
    name: 'Ni Putu Bulan Mulia Febriana',
    nip: '7700',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-26',
    username: 'usr-murid-26',
    role: 'murid26',
    name: 'Nyoman Ayu Brinda Vitare',
    nip: '7468',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-27',
    username: 'usr-murid-27',
    role: 'murid27',
    name: 'Putu Audya Sinthya Dewi',
    nip: '7499',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-28',
    username: 'usr-murid-28',
    role: 'murid28',
    name: 'Putu Dinda Cintya Dewi',
    nip: '7565',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-29',
    username: 'usr-murid-29',
    role: 'murid29',
    name: 'Putu Egalita Grazina Bendesa Mas',
    nip: '7501',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-30',
    username: 'usr-murid-30',
    role: 'murid30',
    name: 'Putu Sinta',
    nip: '7734',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-murid-31',
    username: 'usr-murid-31',
    role: 'murid31',
    name: 'Tyo Ferdiansyah',
    nip: '7503',
    email: '',
    status: 'Aktif',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_USERS: User[] = RAW_USERS_CSV_DATA.map((r) => {
  const isMurid = r.role.toLowerCase().includes('murid') || (!r.role.includes('ADMIN') && !r.role.includes('GURU'));
  const isGuru = r.role === 'GURU';
  const isAdmin = r.role === 'ADMIN';

  const user: User = {
    id: r.id,
    username: r.username,
    role: isAdmin ? 'ADMIN' : isGuru ? 'GURU' : 'MURID',
    name: r.name,
    email: r.email || (isMurid ? `${r.username}@siswa.sman1olahraga.sch.id` : `${r.username}@guru.sma.belajar.id`),
    status: r.status,
    avatar: r.avatar,
  };

  if (isAdmin || isGuru) {
    user.nip = r.nip;
    if (isGuru) {
      user.mataPelajaran = r.username === 'ratna' ? 'PJOK Putri & Senam' : 'PJOK Fase E & F';
    }
  } else {
    user.nis = r.nip;
    user.nip = r.nip; // preserve nip column compatibility
    user.kelasId = 'cls-xi-1';
    user.tahunPelajaran = '2026/2027';
    // Gender detection
    const lower = r.name.toLowerCase();
    const isFemale =
      lower.includes('ni ') ||
      lower.includes('putu ') ||
      lower.includes('dewi') ||
      lower.includes('ayu') ||
      lower.includes('luh ') ||
      lower.includes('savitri') ||
      lower.includes('purwani') ||
      lower.includes('caitanya') ||
      lower.includes('febriana') ||
      lower.includes('vitare') ||
      lower.includes('sinthya') ||
      lower.includes('cintya') ||
      lower.includes('sinta') ||
      lower.includes('nadine') ||
      lower.includes('ida ayu') ||
      lower.includes('gustini') ||
      lower.includes('cahyani');
    user.jenisKelamin = isFemale ? 'P' : 'L';
  }

  return user;
});

// Generate default RekapNilaiMurid for all 31 students
export const DEFAULT_NILAI: RekapNilaiMurid[] = DEFAULT_USERS.filter((u) => u.role === 'MURID').map((m, idx) => {
  // Deterministic realistic scores
  const baseTugas = 82 + ((idx * 3) % 15);
  const baseQuiz = 80 + ((idx * 4) % 17);
  const basePraktik = 85 + ((idx * 2) % 14);
  const pengetahuan = Math.round((baseTugas + baseQuiz) / 2);
  const keterampilan = basePraktik;
  const sikap = 88 + (idx % 10);
  const nilaiAkhir = Math.round(pengetahuan * 0.3 + keterampilan * 0.5 + sikap * 0.2);
  const predikat = nilaiAkhir >= 88 ? 'A' : nilaiAkhir >= 78 ? 'B' : 'C';

  return {
    id: `nil-${idx + 1}`,
    muridId: m.id,
    muridNama: m.name,
    nis: m.nis || m.nip || `75${String(idx + 1).padStart(2, '0')}`,
    kelasId: 'cls-xi-1',
    kelasNama: 'XI 1',
    semester: '1 (Ganjil)',
    tugas: baseTugas,
    quiz: baseQuiz,
    praktik: basePraktik,
    pengetahuan,
    keterampilan,
    sikap,
    nilaiAkhir,
    predikat,
  };
});
