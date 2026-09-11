import React, { useState } from 'react';
import { User, Save, Key, Camera, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';

interface MuridProfilProps {
  db: LMSDatabase;
  currentUser: UserType;
  onUpdateUser: (user: UserType) => void;
}

export const MuridProfil: React.FC<MuridProfilProps> = ({ db, currentUser, onUpdateUser }) => {
  const [name, setName] = useState(currentUser.name);
  const [nis, setNis] = useState(currentUser.nis || '');
  const [nisn, setNisn] = useState(currentUser.nisn || '');
  const [kelasId, setKelasId] = useState(currentUser.kelasId || 'cls-xi-1');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert('Konfirmasi password baru tidak cocok!');
        return;
      }
    }

    const updated: UserType = {
      ...currentUser,
      name,
      nis,
      nisn,
      kelasId,
      avatar,
      password: newPassword || currentUser.password,
    };

    dataStorage.updateDatabase((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === currentUser.id ? updated : u)),
    }));

    onUpdateUser(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Profil Murid PJOK</h2>
        <p className="text-xs text-slate-500">
          Perbarui informasi identitas diri, foto profil, dan kata sandi akun Anda
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Data profil dan keamanan akun berhasil diperbarui!
        </div>
      )}

      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-100">
          <div className="relative group">
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/20 shadow-md"
            />
          </div>
          <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              URL Foto Profil
            </label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Student Identity Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Rombongan Belajar / Kelas
            </label>
            <select
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              {db.kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">NIS</label>
            <input
              type="text"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">NISN</label>
            <input
              type="text"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>
        </div>

        {/* Change Password Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 uppercase tracking-wider">
              Ganti Kata Sandi (Opsional)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" /> Simpan Perubahan Profil
          </button>
        </div>
      </form>
    </div>
  );
};
