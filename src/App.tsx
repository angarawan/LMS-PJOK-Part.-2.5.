import React, { useState, useEffect } from 'react';
import { dataStorage, LMSDatabase } from './services/dataStorage';
import { User, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { ClassManagement } from './components/admin/ClassManagement';
import { SubjectManagement } from './components/admin/SubjectManagement';
import { SchoolSettings } from './components/admin/SchoolSettings';

// Teacher Components
import { GuruDashboard } from './components/guru/GuruDashboard';
import { GuruDataMurid } from './components/guru/GuruDataMurid';
import { JurnalMengajarView } from './components/guru/JurnalMengajar';
import { GuruRefleksi } from './components/guru/GuruRefleksi';

// Student Components
import { MuridDashboard } from './components/murid/MuridDashboard';
import { MuridMateri } from './components/murid/MuridMateri';
import { MuridTugas } from './components/murid/MuridTugas';
import { MuridQuiz } from './components/murid/MuridQuiz';
import { MuridNilai } from './components/murid/MuridNilai';
import { MuridPresensi } from './components/murid/MuridPresensi';
import { MuridProfil } from './components/murid/MuridProfil';
import { MuridRefleksi } from './components/murid/MuridRefleksi';

// Shared Components
import { MateriManager } from './components/shared/MateriManager';
import { TugasManager } from './components/shared/TugasManager';
import { QuizManager } from './components/shared/QuizManager';
import { ContentManager } from './components/shared/ContentManager';
import { AttendanceManager } from './components/shared/AttendanceManager';
import { GradesReport } from './components/shared/GradesReport';
import { PraktikAssessment } from './components/shared/PraktikAssessment';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [db, setDb] = useState<LMSDatabase>(dataStorage.getDatabase());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // When opening the link fresh, the initial main view should be the login screen
    try {
      const isSessionActive = sessionStorage.getItem('lms_pjok_session_active');
      if (isSessionActive === 'true') {
        const savedUser = dataStorage.getCurrentUser();
        if (savedUser) return savedUser;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [activeSubParam, setActiveSubParam] = useState<string | undefined>(undefined);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Subscribe to local storage changes
  useEffect(() => {
    const unsubscribe = dataStorage.subscribe((newDb) => {
      setDb(newDb);
    });
    return () => unsubscribe();
  }, []);

  // Update current user if updated in db
  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    dataStorage.setCurrentUser(updatedUser);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    const targetUser = (db.users || []).find((u) => u.role === newRole) || db.users?.[0];
    if (targetUser) {
      setCurrentUser(targetUser);
      dataStorage.setCurrentUser(targetUser);
      setActiveMenu('dashboard');
      setActiveSubParam(undefined);
    }
  };

  const handleLogout = () => {
    dataStorage.clearCurrentUser();
    try {
      sessionStorage.removeItem('lms_pjok_session_active');
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setIsLoginModalOpen(false);
    setActiveMenu('dashboard');
    setActiveSubParam(undefined);
  };

  const handleNavigate = (menuId: string, param?: string) => {
    setActiveMenu(menuId);
    setActiveSubParam(param);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not logged in, render the dedicated Login Screen as the main initial view
  if (!currentUser) {
    return (
      <LoginPage
        settings={db.settings}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          dataStorage.setCurrentUser(user);
          setActiveMenu('dashboard');
          setActiveSubParam(undefined);
        }}
      />
    );
  }

  const renderActiveView = () => {
    // 1. ADMIN VIEWS
    if (currentUser.role === 'ADMIN') {
      switch (activeMenu) {
        case 'dashboard':
          return (
            <AdminDashboard
              db={db}
              onNavigate={handleNavigate}
              onOpenSheets={() => setIsSheetsModalOpen(true)}
            />
          );
        case 'data-murid':
          return <UserManagement db={db} initialTab="MURID" />;
        case 'data-guru':
          return <UserManagement db={db} initialTab="GURU" />;
        case 'users':
          return <UserManagement db={db} initialTab="ADMIN" />;
        case 'kelas':
          return <ClassManagement db={db} />;
        case 'mapel':
          return <SubjectManagement db={db} />;
        case 'materi':
          return <MateriManager db={db} currentUser={currentUser} />;
        case 'tugas':
          return <TugasManager db={db} currentUser={currentUser} />;
        case 'quiz':
          return <QuizManager db={db} currentUser={currentUser} />;
        case 'praktik':
          return <PraktikAssessment db={db} currentUser={currentUser} />;
        case 'refleksi':
          return <GuruRefleksi db={db} currentUser={currentUser} />;
        case 'jurnal':
          return <JurnalMengajarView db={db} currentUser={currentUser} />;
        case 'presensi':
          return <AttendanceManager db={db} role="ADMIN" currentUser={currentUser} initialTab="harian" />;
        case 'rekap-absensi':
          return <AttendanceManager db={db} role="ADMIN" currentUser={currentUser} initialTab="rekap" />;
        case 'nilai':
          return (
            <GradesReport
              db={db}
              currentUser={currentUser}
              onOpenSheets={() => setIsSheetsModalOpen(true)}
            />
          );
        case 'settings':
          return (
            <SchoolSettings
              db={db}
              currentUser={currentUser}
              onOpenSheets={() => setIsSheetsModalOpen(true)}
            />
          );
        default:
          return <AdminDashboard db={db} onNavigate={handleNavigate} />;
      }
    }

    // 2. GURU VIEWS
    if (currentUser.role === 'GURU') {
      switch (activeMenu) {
        case 'dashboard':
          return <GuruDashboard db={db} currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'data-murid':
          return (
            <GuruDataMurid
              db={db}
              onNavigatePraktik={(muridId) => {
                handleNavigate('praktik', muridId);
              }}
            />
          );
        case 'materi':
          return <MateriManager db={db} currentUser={currentUser} />;
        case 'tugas':
          return <TugasManager db={db} currentUser={currentUser} />;
        case 'quiz':
          return <QuizManager db={db} currentUser={currentUser} />;
        case 'praktik':
          return <PraktikAssessment db={db} currentUser={currentUser} />;
        case 'refleksi':
          return <GuruRefleksi db={db} currentUser={currentUser} />;
        case 'presensi':
          return <AttendanceManager db={db} role="GURU" currentUser={currentUser} initialTab="harian" />;
        case 'rekap-absensi':
          return <AttendanceManager db={db} role="GURU" currentUser={currentUser} initialTab="rekap" />;
        case 'nilai':
          return (
            <GradesReport
              db={db}
              currentUser={currentUser}
            />
          );
        case 'jurnal':
          return <JurnalMengajarView db={db} currentUser={currentUser} />;
        case 'settings':
          return (
            <SchoolSettings
              db={db}
              currentUser={currentUser}
              onOpenSheets={() => setIsSheetsModalOpen(true)}
            />
          );
        default:
          return <GuruDashboard db={db} currentUser={currentUser} onNavigate={handleNavigate} />;
      }
    }

    // 3. MURID VIEWS
    if (currentUser.role === 'MURID') {
      switch (activeMenu) {
        case 'dashboard':
          return <MuridDashboard db={db} currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'materi-saya':
          return <MuridMateri db={db} currentUser={currentUser} initialMateriId={activeSubParam} />;
        case 'tugas-saya':
          return <MuridTugas db={db} currentUser={currentUser} />;
        case 'quiz-saya':
          return <MuridQuiz db={db} currentUser={currentUser} />;
        case 'refleksi-saya':
          return <MuridRefleksi db={db} currentUser={currentUser} />;
        case 'nilai-saya':
          return <MuridNilai db={db} currentUser={currentUser} />;
        case 'presensi-saya':
          return <MuridPresensi db={db} currentUser={currentUser} />;
        case 'profil-saya':
          return (
            <MuridProfil
              db={db}
              currentUser={currentUser}
              onUpdateUser={handleUserUpdate}
            />
          );
        default:
          return <MuridDashboard db={db} currentUser={currentUser} onNavigate={handleNavigate} />;
      }
    }

    return <div>Role tidak dikenali</div>;
  };

  return (
    <div id="app" className="flex h-screen w-full bg-gray-100 font-sans overflow-hidden text-slate-800 antialiased">
      {/* Left Sidebar */}
      <Sidebar
        role={currentUser.role}
        activeMenu={activeMenu}
        onSelectMenu={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar
          currentUser={currentUser}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          onSwitchRole={handleRoleSwitch}
          onSelectMenuItem={(menuId, param) => {
            handleNavigate(menuId);
            if (param) setActiveSubParam(param);
          }}
          settings={db.settings}
        />

        {/* Workspace Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>

        {/* Footer - Visible on every menu */}
        <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-between px-4 sm:px-8 text-[11px] text-slate-500 shrink-0 font-medium z-10">
          <div className="flex items-center gap-2">
            <span className="font-black text-blue-950 tracking-wider">
              VERSI 2.4.0 - 2026 PJOK SMANSAKA
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-500">
              Learning Management System Penjasorkes
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-500 font-semibold">
            <span>{db.settings?.namaSekolah || 'SMA Negeri 1 Tejakula'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              v2.4.0
            </span>
          </div>
        </footer>
      </div>

      {/* Login & Demo Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        settings={db.settings}
        onSelectUser={(user) => {
          handleUserUpdate(user);
          setActiveMenu('dashboard');
          setActiveSubParam(undefined);
        }}
        currentUserId={currentUser.id}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        settings={db.settings}
        db={db}
        onDbUpdate={(newDb) => {
          dataStorage.updateDatabase(() => newDb);
        }}
      />
    </div>
  );
}
