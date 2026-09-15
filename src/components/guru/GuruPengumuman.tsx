import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Calendar,
  Users,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { LMSDatabase, dataStorage } from '../../services/dataStorage';
import { Pengumuman, User, getTeacherAssignedClasses, NotifikasiItem } from '../../types';

interface GuruPengumumanProps {
  db: LMSDatabase;
  currentUser: User;
}

export const GuruPengumuman: React.FC<GuruPengumumanProps> = ({ db, currentUser }) => {
  const availableClasses = useMemo(() => {
    if (currentUser.role === 'GURU') {
      const assigned = getTeacherAssignedClasses(currentUser, db.kelas);
      return assigned.length > 0 ? assigned : db.kelas;
    }
    return db.kelas;
  }, [currentUser, db.kelas]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengumuman | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pengumuman | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Pengumuman>>({
    judul: '',
    konten: '',
    kategori: 'Informasi',
    targetKelasIds: ['all'],
    disematkan: false,
  });

  const pengumumanList = useMemo(() => {
    const list = db.pengumuman || [];
    // Sort: pinned first, then newest
    return [...list].sort((a, b) => {
      if (a.disematkan && !b.disematkan) return -1;
      if (!a.disematkan && b.disematkan) return 1;
      return new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime();
    });
  }, [db.pengumuman]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      judul: '',
      konten: '',
      kategori: 'Informasi',
      targetKelasIds: ['all'],
      disematkan: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Pengumuman) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleTogglePin = (item: Pengumuman) => {
    const nextPin = !item.disematkan;
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      pengumuman: (prev.pengumuman || []).map((p) =>
        p.id === item.id ? { ...p, disematkan: nextPin } : p
      ),
    }));
    setToastMsg(nextPin ? 'Pengumuman disematkan di paling atas' : 'Sematkan dilepas');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    dataStorage.updateDatabase((prev) => ({
      ...prev,
      pengumuman: (prev.pengumuman || []).filter((p) => p.id !== itemToDelete.id),
    }));
    setToastMsg('Pengumuman berhasil dihapus.');
    setItemToDelete(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim() || !formData.konten?.trim()) {
      alert('Judul dan isi pengumuman wajib diisi!');
      return;
    }

    const nowIso = new Date().toISOString();
    const targetKelas = formData.targetKelasIds && formData.targetKelasIds.length > 0
      ? formData.targetKelasIds
      : ['all'];

    const targetKelasLabel =
      targetKelas.includes('all')
        ? 'Semua Kelas'
        : availableClasses
            .filter((k) => targetKelas.includes(k.id))
            .map((k) => k.nama)
            .join(', ');

    if (editingItem) {
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        pengumuman: (prev.pengumuman || []).map((p) =>
          p.id === editingItem.id
            ? {
                ...p,
                judul: formData.judul!.trim(),
                konten: formData.konten!.trim(),
                kategori: formData.kategori || 'Informasi',
                targetKelasIds: targetKelas,
                disematkan: !!formData.disematkan,
              }
            : p
        ),
      }));
      setToastMsg('Pengumuman berhasil diperbarui.');
    } else {
      const newItem: Pengumuman = {
        id: `ann-${Date.now()}`,
        judul: formData.judul.trim(),
        konten: formData.konten.trim(),
        kategori: formData.kategori || 'Informasi',
        guruId: currentUser.id,
        guruNama: currentUser.name,
        targetKelasIds: targetKelas,
        dibuatPada: nowIso,
        disematkan: !!formData.disematkan,
      };

      // Notification to pupils
      const notifItem: NotifikasiItem = {
        id: `notif-ann-${Date.now()}`,
        judul: `📢 Pengumuman Baru: ${newItem.judul}`,
        pesan: `${currentUser.name} (${targetKelasLabel}): ${newItem.konten.slice(0, 95)}...`,
        waktu: 'Baru saja',
        tipe: 'pengumuman',
        dibaca: false,
      };

      dataStorage.updateDatabase((prev) => ({
        ...prev,
        pengumuman: [newItem, ...(prev.pengumuman || [])],
        notifikasi: [notifItem, ...(prev.notifikasi || [])],
      }));
      setToastMsg('Pengumuman dipublikasikan dan notifikasi dikirimkan ke murid!');
    }

    setTimeout(() => setToastMsg(null), 3500);
    setIsModalOpen(false);
  };

  const getKategoriBadge = (kategori?: string) => {
    switch (kategori) {
      case 'Penting':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Tugas':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Kegiatan':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Papan Pengumuman Guru PJOK
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Buat pengumuman resmi terkait instruksi lapangan, seragam olahraga, jadwal praktik, atau informasi penting lainnya yang langsung dibaca oleh murid.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Announcements List */}
      {pengumumanList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">Belum Ada Pengumuman</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Klik tombol &quot;Buat Pengumuman Baru&quot; untuk mengabarkan informasi penting kepada seluruh murid atau kelas tertentu.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Buat Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pengumumanList.map((item) => {
            const isAllClass = item.targetKelasIds.includes('all');
            const targetClassNames = isAllClass
              ? 'Semua Kelas'
              : availableClasses
                  .filter((k) => item.targetKelasIds.includes(k.id))
                  .map((k) => k.nama)
                  .join(', ') || 'Kelas Tertentu';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl sm:rounded-3xl p-5 border transition-all relative flex flex-col justify-between space-y-4 ${
                  item.disematkan
                    ? 'border-amber-300 ring-2 ring-amber-100 shadow-sm'
                    : 'border-slate-200/80 shadow-2xs hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getKategoriBadge(
                          item.kategori
                        )}`}
                      >
                        {item.kategori || 'Informasi'}
                      </span>

                      {item.disematkan && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                          <Pin className="w-2.5 h-2.5 fill-current" /> Disematkan
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" /> {targetClassNames}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.disematkan
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={item.disematkan ? 'Lepas Sematan' : 'Sematkan Pengumuman'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Pengumuman"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-800 leading-snug">
                      {item.judul}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mt-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {item.konten}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-500">
                    Oleh: {item.guruNama || currentUser.name}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(item.dibuatPada).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded-full">
                {editingItem ? 'Edit Pengumuman' : 'Publikasi Pengumuman'}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                {editingItem ? 'Edit Pengumuman' : 'Tulis Pengumuman Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Pengumuman akan muncul di dashboard murid dan memicu notifikasi otomatis di lonceng murid.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Perubahan Jadwal Praktik Bola Voli Lapangan"
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.kategori || 'Informasi'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-xs font-semibold"
                  >
                    <option value="Informasi">Informasi</option>
                    <option value="Penting">Penting</option>
                    <option value="Kegiatan">Kegiatan Lapangan</option>
                    <option value="Tugas">Tugas / Tagihan</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!formData.disematkan}
                      onChange={(e) => setFormData({ ...formData, disematkan: e.target.checked })}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Sematkan di Atas</span>
                  </label>
                </div>
              </div>

              {/* Target Kelas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Target Penerima Siswa</label>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.targetKelasIds?.includes('all') ?? false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetKelasIds: ['all'] });
                        } else {
                          setFormData({ ...formData, targetKelasIds: [] });
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>Seluruh Kelas (Semua Siswa)</span>
                  </label>

                  {!formData.targetKelasIds?.includes('all') && (
                    <div className="pt-1.5 pl-5 grid grid-cols-2 gap-1.5 border-t border-slate-200">
                      {availableClasses.map((k) => (
                        <label key={k.id} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={formData.targetKelasIds?.includes(k.id) ?? false}
                            onChange={(e) => {
                              const cur = formData.targetKelasIds || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, targetKelasIds: [...cur, k.id] });
                              } else {
                                setFormData({
                                  ...formData,
                                  targetKelasIds: cur.filter((id) => id !== k.id),
                                });
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600"
                          />
                          <span>Kelas {k.nama}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Konten */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pengumuman *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tuliskan isi pengumuman secara rinci, instruksi seragam, perlengkapan yang perlu dibawa, waktu kumpul, dsb..."
                  value={formData.konten || ''}
                  onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Publikasikan Pengumuman'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (In-app, no window.confirm!) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-800">Hapus Pengumuman?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Pengumuman &quot;{itemToDelete.judul}&quot; akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
