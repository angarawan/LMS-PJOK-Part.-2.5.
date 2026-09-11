import React from 'react';
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  FolderKanban,
  FileCheck2,
  CalendarCheck,
  Settings,
  GraduationCap,
  ClipboardList,
  CheckCircle,
  Activity,
  FileText,
  UserCheck,
  BookMarked,
  Award,
  Calendar,
  User,
  LogOut,
  Zap,
  X,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeMenu: string;
  onSelectMenu: (menuId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenGoogleSheets?: () => void;
  onLogout?: () => void;
}

interface MenuSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeMenu,
  onSelectMenu,
  isOpen = false,
  onClose,
  onOpenGoogleSheets,
  onLogout,
}) => {
  const getAdminSections = (): MenuSection[] => [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Data Pengguna & Pengajar',
      items: [
        { id: 'data-murid', label: 'Data Murid', icon: <GraduationCap className="w-5 h-5" /> },
        { id: 'data-guru', label: 'Data Guru', icon: <UserCheck className="w-5 h-5" /> },
        { id: 'users', label: 'Kelola Pengguna', icon: <Users className="w-5 h-5" /> },
        { id: 'kelas', label: 'Kelas & Rombel', icon: <School className="w-5 h-5" /> },
        { id: 'mapel', label: 'Mata Pelajaran', icon: <BookOpen className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Pembelajaran & Asesmen',
      items: [
        { id: 'materi', label: 'Konten Materi', icon: <BookMarked className="w-5 h-5" /> },
        { id: 'tugas', label: 'Tugas PJOK', icon: <ClipboardList className="w-5 h-5" /> },
        { id: 'quiz', label: 'Quiz & Asesmen', icon: <CheckCircle className="w-5 h-5" /> },
        { id: 'praktik', label: 'Penilaian Praktik', icon: <Activity className="w-5 h-5" /> },
        { id: 'refleksi', label: 'Refleksi Pembelajaran', icon: <Sparkles className="w-5 h-5" /> },
        { id: 'jurnal', label: 'Jurnal Mengajar', icon: <FileText className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Laporan & Pengaturan',
      items: [
        { id: 'presensi', label: 'Presensi Siswa', icon: <CalendarCheck className="w-5 h-5" /> },
        { id: 'rekap-absensi', label: 'Rekapan Absensi', icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> },
        { id: 'nilai', label: 'Penilaian & Rapor', icon: <Award className="w-5 h-5" /> },
        { id: 'settings', label: 'Pengaturan Sistem', icon: <Settings className="w-5 h-5" /> },
      ],
    },
  ];

  const getGuruSections = (): MenuSection[] => [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard Guru', icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Pembelajaran',
      items: [
        { id: 'data-murid', label: 'Data Siswa', icon: <GraduationCap className="w-5 h-5" /> },
        { id: 'materi', label: 'Materi PJOK', icon: <BookMarked className="w-5 h-5" /> },
        { id: 'tugas', label: 'Tugas PJOK', icon: <ClipboardList className="w-5 h-5" /> },
        { id: 'quiz', label: 'Bank & Kelola Quiz', icon: <CheckCircle className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Penilaian & Jurnal',
      items: [
        { id: 'praktik', label: 'Penilaian Praktik', icon: <Activity className="w-5 h-5" /> },
        { id: 'refleksi', label: 'Refleksi Pembelajaran', icon: <Sparkles className="w-5 h-5" /> },
        { id: 'presensi', label: 'Presensi Siswa', icon: <UserCheck className="w-5 h-5" /> },
        { id: 'rekap-absensi', label: 'Rekapan Absensi', icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> },
        { id: 'nilai', label: 'Rekap Nilai Siswa', icon: <Award className="w-5 h-5" /> },
        { id: 'jurnal', label: 'Jurnal Mengajar', icon: <FileText className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Pengaturan & Cadangan',
      items: [
        { id: 'settings', label: 'Pengaturan & Reset Data', icon: <Settings className="w-5 h-5" /> },
      ],
    },
  ];

  const getMuridSections = (): MenuSection[] => [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Aktivitas Belajar',
      items: [
        { id: 'materi-saya', label: 'Materi Pembelajaran', icon: <BookMarked className="w-5 h-5" /> },
        { id: 'tugas-saya', label: 'Tugas Saya', icon: <ClipboardList className="w-5 h-5" /> },
        { id: 'quiz-saya', label: 'Quiz & Asesmen', icon: <CheckCircle className="w-5 h-5" /> },
        { id: 'refleksi-saya', label: 'Refleksi Belajar', icon: <Sparkles className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Akademik & Profil',
      items: [
        { id: 'nilai-saya', label: 'Transkrip Nilai', icon: <Award className="w-5 h-5" /> },
        { id: 'presensi-saya', label: 'Riwayat Kehadiran', icon: <Calendar className="w-5 h-5" /> },
        { id: 'profil-saya', label: 'Profil Saya', icon: <User className="w-5 h-5" /> },
      ],
    },
  ];

  const sections =
    role === 'ADMIN' ? getAdminSections() : role === 'GURU' ? getGuruSections() : getMuridSections();

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-950 shrink-0 border-b border-slate-800/80">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-xs">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white block leading-none">
              LMS PJOK
            </span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1 block">
              {role === 'ADMIN' ? 'Admin Portal' : role === 'GURU' ? 'Guru Olahraga' : 'Portal Murid'}
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="mb-4">
            <div className="px-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectMenu(item.id);
                      if (onClose) onClose();
                    }}
                    id={`nav-menu-${item.id}`}
                    className={`w-full flex items-center px-6 py-3 text-sm transition-colors text-left group ${
                      isActive
                        ? 'bg-blue-600 text-white border-r-4 border-blue-400 font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span
                      className={`mr-3.5 shrink-0 transition-transform ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick action: Google Sheets in sidebar for Admin only */}
        {role === 'ADMIN' && onOpenGoogleSheets && (
          <div className="px-4 mt-2">
            <button
              onClick={onOpenGoogleSheets}
              className="w-full flex items-center px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/60 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2.5 text-emerald-400 shrink-0" />
              <span>Sinkron Google Sheets</span>
            </button>
          </div>
        )}

        {/* Logout action */}
        {onLogout && (
          <div className="px-4 mt-2">
            <button
              onClick={() => {
                if (onClose) onClose();
                onLogout();
              }}
              id="btn-sidebar-logout"
              className="w-full flex items-center px-4 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-xs font-medium text-rose-300 border border-rose-900/40 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2.5 text-rose-400 shrink-0" />
              <span>Keluar Sistem</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Version Marker */}
      <div className="p-3.5 bg-slate-950 text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest border-t border-slate-800/80 shrink-0">
        VERSI 2.4.0 - 2026 PJOK SMANSAKA
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 hidden md:flex h-full border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
