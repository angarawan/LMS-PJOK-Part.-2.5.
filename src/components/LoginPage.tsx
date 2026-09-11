import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { User, PengaturanSekolah } from '../types';
import { dataStorage } from '../services/dataStorage';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  settings?: PengaturanSekolah;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const db = dataStorage.getDatabase();

  const handleSelect = (user: User) => {
    try {
      sessionStorage.setItem('lms_pjok_session_active', 'true');
    } catch (e) {
      // ignore
    }
    onLoginSuccess(user);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMsg('Silakan masukkan Username, NIS, atau NIP Anda.');
      return;
    }

    const foundUser = (db.users || []).find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        (u.nis && u.nis.toLowerCase() === cleanId) ||
        (u.nip && u.nip.replace(/\s+/g, '').toLowerCase() === cleanId.replace(/\s+/g, ''))
    );

    if (!foundUser) {
      setErrorMsg('Pengguna tidak terdaftar. Periksa kembali Username, NIS, atau NIP.');
      return;
    }

    if (foundUser.status === 'Nonaktif') {
      setErrorMsg('Akun ini dinonaktifkan oleh administrator sekolah.');
      return;
    }

    handleSelect(foundUser);
  };

  return (
    <div id="login-page-root" className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Main Login Card Centered */}
      <div className="relative z-10 w-full max-w-md my-auto">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/60 backdrop-blur-xl">
          
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Masuk ke Akun</h2>
            <p className="text-xs text-slate-400 mt-1.5">Masukkan username dan kata sandi Anda</p>
          </div>

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username & Password Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label
                htmlFor="manual-identifier"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Username / NIP / NIS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="manual-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan Username, NIP, atau NIS"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="manual-password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="manual-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-manual-login"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer mt-2"
            >
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-1.5">
            <p className="text-[11px] text-slate-400">
              Gunakan akun terdaftar Anda untuk mengakses portal LMS PJOK.
            </p>
            <p className="text-[10px] font-bold text-blue-400/90 tracking-widest uppercase">
              VERSI 2.4.0 - 2026 PJOK SMANSAKA
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Bantuan Akses Akun LMS</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                Untuk siswa atau guru yang lupa password, silakan hubungi operator sekolah atau admin lab komputer:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                <p>• <strong>Admin:</strong> Pak Budi Santoso, S.Pd., M.Pd.</p>
                <p>• <strong>Operator:</strong> Ruang Kurikulum / Lab Komputer</p>
                <p>• <strong>Format Login Siswa:</strong> Gunakan NIS terdaftar</p>
                <p>• <strong>Format Login Guru:</strong> Gunakan NIP terdaftar</p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup Bantuan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
