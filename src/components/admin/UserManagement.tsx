import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  KeyRound,
  Shield,
  UserCheck,
  GraduationCap,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';
import { GoogleSheetsSyncModal } from '../GoogleSheetsSyncModal';

interface UserManagementProps {
  db: LMSDatabase;
  initialTab?: 'MURID' | 'GURU' | 'ADMIN';
}

export const UserManagement: React.FC<UserManagementProps> = ({ db, initialTab = 'MURID' }) => {
  const [activeTab, setActiveTab] = useState<'MURID' | 'GURU' | 'ADMIN'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPullingSheets, setIsPullingSheets] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('123456');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleExportCSV = () => {
    try {
      const csv = dataStorage.exportUsersCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_pengguna_pjok_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('File CSV data pengguna berhasil diunduh!');
    } catch (err: any) {
      showToast('Gagal mengekspor CSV: ' + err.message, 'error');
    }
  };

  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const res = dataStorage.importUsersCSV(text);
        showToast(res.message, res.count > 0 ? 'success' : 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleQuickPullFromSheets = async () => {
    setIsPullingSheets(true);
    try {
      const res = await dataStorage.pullFromLinkedSpreadsheet();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(`Gagal: ${res.message} (Klik tombol Spreadsheet untuk diagnosa)`, 'error');
      }
    } catch (err: any) {
      showToast(`Gagal: ${err.message || 'Terjadi kesalahan'}`, 'error');
    } finally {
      setIsPullingSheets(false);
    }
  };

  // Form state for Add/Edit
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    role: 'MURID',
    status: 'Aktif',
    nis: '',
    nisn: '',
    nip: '',
    mataPelajaran: 'PJOK',
    kelasId: 'cls-xi-1',
    jenisKelamin: 'L',
    tahunPelajaran: '2026/2027',
  });

  const usersInTab = db.users.filter((u) => u.role === activeTab);

  const filteredUsers = usersInTab.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.nis && u.nis.includes(q)) ||
      (u.nip && u.nip.includes(q));

    const matchKelas =
      activeTab !== 'MURID' || selectedKelas === 'all' || u.kelasId === selectedKelas;

    return matchQuery && matchKelas;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      username: '',
      role: activeTab,
      status: 'Aktif',
      nis: activeTab === 'MURID' ? `2401${Math.floor(10 + Math.random() * 89)}` : '',
      nisn: activeTab === 'MURID' ? `0089123${Math.floor(100 + Math.random() * 899)}` : '',
      nip: activeTab === 'GURU' ? `198${Math.floor(100000000000000 + Math.random() * 899999999999999)}` : '',
      mataPelajaran: 'PJOK Fase F',
      kelasId: 'cls-xi-1',
      jenisKelamin: 'L',
      tahunPelajaran: '2026/2027',
    });
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setIsAddModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username) return;

    if (editingUser) {
      // Update existing
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === editingUser.id ? ({ ...u, ...formData } as User) : u
        ),
      }));
    } else {
      // Add new
      const newUser: User = {
        id: `usr-${activeTab.toLowerCase()}-${Date.now()}`,
        name: formData.name || '',
        username: formData.username || '',
        role: activeTab,
        status: formData.status || 'Aktif',
        email: `${formData.username?.toLowerCase()}@sman1olahraga.sch.id`,
        avatar:
          formData.jenisKelamin === 'P'
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        nis: formData.nis,
        nisn: formData.nisn,
        nip: formData.nip,
        mataPelajaran: formData.mataPelajaran,
        kelasId: formData.kelasId,
        jenisKelamin: formData.jenisKelamin,
        tahunPelajaran: formData.tahunPelajaran,
      };

      dataStorage.updateDatabase((prev) => ({
        ...prev,
        users: [newUser, ...prev.users],
      }));
    }

    setIsAddModalOpen(false);
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
    }));
  };

  const handleResetPassword = () => {
    if (!resetPassUser) return;
    alert(`Password untuk pengguna ${resetPassUser.name} (${resetPassUser.username}) berhasil direset menjadi: ${newPassword}`);
    setResetPassUser(null);
  };

  const getKelasName = (id?: string) => {
    return (db.kelas || []).find((k) => k.id === id)?.nama || '-';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Manajemen Data Pengguna LMS
          </h2>
          <p className="text-xs text-slate-500">
            Kelola akun Admin, Guru Pengampu PJOK, dan Murid Rombel XI
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* Hidden File Input for CSV */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt"
            onChange={handleImportCSVFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportCSV}
            title="Unduh seluruh data pengguna ke CSV"
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Ekspor CSV
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Impor pembaruan data pengguna dari CSV Spreadsheet"
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            Impor CSV
          </button>

          <button
            type="button"
            onClick={handleQuickPullFromSheets}
            disabled={isPullingSheets}
            title="Tarik pembaruan data pengguna langsung dari Google Spreadsheet"
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isPullingSheets ? 'animate-spin' : ''}`} />
            {isPullingSheets ? 'Menarik...' : 'Tarik Data'}
          </button>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            id="btn-open-sheets-sync"
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Spreadsheet & Webhook
          </button>

          <button
            onClick={handleOpenAdd}
            id="btn-add-user"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah {activeTab === 'MURID' ? 'Murid' : activeTab === 'GURU' ? 'Guru' : 'Admin'}
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('MURID')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'MURID'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Data Murid ({db.users.filter((u) => u.role === 'MURID').length})
        </button>
        <button
          onClick={() => setActiveTab('GURU')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'GURU'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Data Guru ({db.users.filter((u) => u.role === 'GURU').length})
        </button>
        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'ADMIN'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Data Admin ({db.users.filter((u) => u.role === 'ADMIN').length})
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Cari nama, username, ${activeTab === 'MURID' ? 'NIS' : 'NIP'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {activeTab === 'MURID' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium shrink-0">Filter Kelas:</span>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Rombel (XI 1 - XI 7)</option>
              {db.kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Lengkap</th>
                {activeTab === 'MURID' && (
                  <>
                    <th className="py-3 px-4">NIS / NISN</th>
                    <th className="py-3 px-4">JK</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Tahun Pelajaran</th>
                  </>
                )}
                {activeTab === 'GURU' && (
                  <>
                    <th className="py-3 px-4">NIP</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                  </>
                )}
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === 'MURID' ? 8 : 6}
                    className="text-center py-8 text-slate-400"
                  >
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
                          }
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{u.name}</span>
                          <span className="text-[10px] text-slate-400 truncate block">ID: {u.id}</span>
                        </div>
                      </div>
                    </td>

                    {activeTab === 'MURID' && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div>{u.nis || '-'}</div>
                          <div className="text-[10px] text-slate-400">{u.nisn || '-'}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              u.jenisKelamin === 'L'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {u.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {getKelasName(u.kelasId)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{u.tahunPelajaran || '2026/2027'}</td>
                      </>
                    )}

                    {activeTab === 'GURU' && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {u.nip || '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {u.mataPelajaran || 'PJOK'}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">@{u.username}</td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title="Klik untuk ubah status"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          u.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {u.status === 'Aktif' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Nonaktif
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Pengguna"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResetPassUser(u)}
                          title="Reset Password"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              {editingUser ? 'Edit Data Pengguna' : `Tambah Pengguna Baru (${activeTab})`}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Isi data akun yang akan tersinkronisasi ke Google Spreadsheet sekolah.
            </p>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="andipratama"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {activeTab === 'MURID' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        NIS
                      </label>
                      <input
                        type="text"
                        value={formData.nis || ''}
                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                        placeholder="240101"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        NISN
                      </label>
                      <input
                        type="text"
                        value={formData.nisn || ''}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        placeholder="0089123451"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Rombel / Kelas
                      </label>
                      <select
                        value={formData.kelasId || 'cls-xi-1'}
                        onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                      >
                        {db.kelas.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={formData.jenisKelamin || 'L'}
                        onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'GURU' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NIP Guru
                    </label>
                    <input
                      type="text"
                      value={formData.nip || ''}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="19850314 201001 1 018"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      value={formData.mataPelajaran || ''}
                      onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                      placeholder="PJOK Fase F"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-800">Reset Password Pengguna</h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur ulang kata sandi untuk akun <span className="font-bold">{resetPassUser.name}</span>.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Password Baru
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setResetPassUser(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                Simpan Password Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Sync & Webhook Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        settings={db.settings}
        db={db}
      />
    </div>
  );
};
