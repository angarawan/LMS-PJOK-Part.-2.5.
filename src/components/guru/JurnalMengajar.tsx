import React, { useState } from 'react';
import { FileText, Plus, Calendar, Clock, School, Save, Trash2, Edit2, X } from 'lucide-react';
import { JurnalMengajar, User } from '../../types';
import { dataStorage, LMSDatabase } from '../../services/dataStorage';

interface JurnalMengajarProps {
  db: LMSDatabase;
  currentUser: User;
}

export const JurnalMengajarView: React.FC<JurnalMengajarProps> = ({ db, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJurnal, setEditingJurnal] = useState<JurnalMengajar | null>(null);

  const [formData, setFormData] = useState<Partial<JurnalMengajar>>({
    tanggal: new Date().toISOString().slice(0, 10),
    jamKe: '1 - 3 (07.15 - 09.30 WIB)',
    kelasId: 'cls-xi-1',
    materiJudul: 'Permainan Bola Voli - Passing Bawah & Passing Atas',
    kegiatan:
      'Pemanasan dinamis, demonstrasi teknik perkenaan bola pada lengan, latihan passing berpasangan 20 kali, dan evaluasi gerak.',
    jumlahHadir: 32,
    jumlahTidakHadir: 0,
    catatanKhusus:
      'Semua siswa aktif dan antusias. Siswa mampu memahami koordinasi ayunan lengan dengan dorongan lutut.',
  });

  const handleOpenAdd = () => {
    setEditingJurnal(null);
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      jamKe: '1 - 3 (07.15 - 09.30 WIB)',
      kelasId: 'cls-xi-1',
      materiJudul: 'Permainan Bola Voli - Passing Bawah & Passing Atas',
      kegiatan: '',
      jumlahHadir: 32,
      jumlahTidakHadir: 0,
      catatanKhusus: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (j: JurnalMengajar) => {
    setEditingJurnal(j);
    setFormData(j);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus catatan jurnal mengajar ini?')) {
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        jurnal: prev.jurnal.filter((item) => item.id !== id),
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const kelasObj = (db.kelas || []).find((k) => k.id === formData.kelasId);

    if (editingJurnal) {
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        jurnal: prev.jurnal.map((item) =>
          item.id === editingJurnal.id
            ? ({
                ...item,
                ...formData,
                kelasNama: kelasObj?.nama || item.kelasNama,
              } as JurnalMengajar)
            : item
        ),
      }));
    } else {
      const newJurnal: JurnalMengajar = {
        id: `jr-${Date.now()}`,
        tanggal: formData.tanggal || new Date().toISOString().slice(0, 10),
        jamKe: formData.jamKe || '1 - 3',
        kelasId: formData.kelasId || 'cls-xi-1',
        kelasNama: kelasObj?.nama || 'XI 1',
        guruId: currentUser.id,
        guruNama: currentUser.name,
        materiJudul: formData.materiJudul || 'PJOK',
        kegiatan: formData.kegiatan || '',
        jumlahHadir: Number(formData.jumlahHadir) || 32,
        jumlahTidakHadir: Number(formData.jumlahTidakHadir) || 0,
        catatanKhusus: formData.catatanKhusus || '',
      };
      dataStorage.updateDatabase((prev) => ({
        ...prev,
        jurnal: [newJurnal, ...prev.jurnal],
      }));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Jurnal Mengajar Guru PJOK
          </h2>
          <p className="text-xs text-slate-500">
            Dokumentasi agenda harian pembelajaran, materi gerak, kehadiran siswa, dan catatan refleksi
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Tulis Jurnal Baru
        </button>
      </div>

      {/* Jurnal Cards List */}
      <div className="space-y-4">
        {db.jurnal.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            Belum ada catatan jurnal mengajar. Klik tombol "Tulis Jurnal Baru" untuk menambahkan.
          </div>
        ) : (
          db.jurnal.map((j) => (
            <div
              key={j.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-xs">
                    {j.kelasNama}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">{j.materiJudul}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5" /> {j.tanggal}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Jam: {j.jamKe}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                    Hadir: <strong className="text-emerald-700">{j.jumlahHadir}</strong> • Tidak:{' '}
                    <strong className="text-rose-600">{j.jumlahTidakHadir}</strong>
                  </span>
                  <button
                    onClick={() => handleOpenEdit(j)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-2 text-slate-700">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                    Kegiatan Pembelajaran:
                  </span>
                  <p className="leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {j.kegiatan}
                  </p>
                </div>

                {j.catatanKhusus && (
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                      Catatan Refleksi & Evaluasi:
                    </span>
                    <p className="leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/80 text-amber-900">
                      {j.catatanKhusus}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingJurnal ? 'Edit Jurnal Mengajar' : 'Tulis Jurnal Mengajar Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Jam Ke</label>
                  <input
                    type="text"
                    required
                    value={formData.jamKe || ''}
                    onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                    placeholder="1 - 3 (07.15 - 09.30 WIB)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Kelas</label>
                  <select
                    value={formData.kelasId || 'cls-xi-1'}
                    onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Jumlah Siswa Hadir
                  </label>
                  <input
                    type="number"
                    value={formData.jumlahHadir || 32}
                    onChange={(e) =>
                      setFormData({ ...formData, jumlahHadir: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Materi yang Diajarkan
                </label>
                <input
                  type="text"
                  required
                  value={formData.materiJudul || ''}
                  onChange={(e) => setFormData({ ...formData, materiJudul: e.target.value })}
                  placeholder="Permainan Bola Voli - Passing Bawah dan Atas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Kegiatan Pembelajaran (Apersepsi, Inti, Penutup)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.kegiatan || ''}
                  onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                  placeholder="Uraian langkah kegiatan di lapangan, metode, dan media..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Catatan Khusus / Refleksi
                </label>
                <textarea
                  rows={2}
                  value={formData.catatanKhusus || ''}
                  onChange={(e) => setFormData({ ...formData, catatanKhusus: e.target.value })}
                  placeholder="Kendala sarana, catatan siswa berbakat, atau evaluasi gerak..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
