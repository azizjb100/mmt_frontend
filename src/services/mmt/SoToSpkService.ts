import api from "@/services/api";

export const soToSpkService = {
  // 1. Mengambil data list / browse SO to SPK
  getBrowse: (params: {
    startDate: string;
    endDate: string;
    workshop?: string;
    customer?: string;
  }) => api.get("/mmt/so-spk", { params }),

  // 2. Mengambil detail breakdown size SPK
  getSizes: (nomor: string) =>
    api.get(`/mmt/so-spk/${encodeURIComponent(nomor)}/sizes`),

  // 3. Menghapus data SPK
  deleteSpk: (nomor: string) =>
    api.delete(`/mmt/so-spk/${encodeURIComponent(nomor)}`),

  // 4. Toggle Close / Batal Close SPK
  toggleClose: (
    nomor: string,
    payload: { isClose: boolean; alasan?: string },
  ) =>
    api.put(`/mmt/so-spk/${encodeURIComponent(nomor)}/toggle-close`, payload),

  // 5. Mengajukan PIN / Perubahan Data SPK
  requestPin: (nomor: string, alasan: string) =>
    api.post(`/mmt/so-spk/${encodeURIComponent(nomor)}/request-pin`, {
      alasan,
    }),

  // 6. Menyutujui / Approve SPK
  approveCmo: (nomor: string) =>
    api.put(`/mmt/so-spk/${encodeURIComponent(nomor)}/approve`),

  // 7. Pengecekan status & izin cetak SPK
  checkPrintPermission: (nomor: string) =>
    api.get(`/mmt/so-spk/${encodeURIComponent(nomor)}/print-check`),

  // 8. Pengajuan approval cetak ulang ke Manager
  requestPrintApproval: (nomor: string, alasan: string) =>
    api.post(
      `/mmt/so-spk/${encodeURIComponent(nomor)}/request-print-approval`,
      { alasan },
    ),

  // 9. Pencatatan log/history setelah SPK dicetak
  recordPrint: (nomor: string) =>
    api.post(`/mmt/so-spk/${encodeURIComponent(nomor)}/record-print`),

  getDetail: (nomor: string) =>
    api.get("/mmt/so-spk/detail", { params: { nomor } }),

  // Ambil data SO sebagai dasar create SPK mmt baru
  getSoSource: (soNomor: string) =>
    api.get("/mmt/so-spk/so-source", { params: { soNomor } }),

  save: (payload: any) =>
    payload.isEdit
      ? api.put("/mmt/so-spk/save", payload)
      : api.post("/mmt/so-spk/save", payload),

  getInitSizes: () => api.get("/mmt/so-spk/init-sizes"),

  getStandarUkuran: (joKode: string, varian = "STANDAR") =>
    api.get("/mmt/so-spk/standar-ukuran", { params: { joKode, varian } }),

  getMkbDetail: (spkNomor: string) =>
    api.get("/mmt/so-spk/mkb-detail", { params: { spkNomor } }),

  getKomponenMaster: (isBordir?: boolean) =>
    api.get("/mmt/so-spk/komponen-master", {
      params: isBordir ? { isBordir: "true" } : {},
    }),

  importLayoutProses: (spkNomor: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file); // ← field name harus "file", sesuai upload.excel.single("file")
    formData.append("spkNomor", spkNomor); // ← field name harus persis "spkNomor", sesuai controller
    return api.post("/mmt/so-spk/layout-proses/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getLayoutProses: (spkNomor: string) =>
    api.get("/mmt/so-spk/layout-proses", { params: { spkNomor } }),

  getKeteranganKhusus: (spkNomor: string) =>
    api.get("/mmt/so-spk/keterangan-khusus", { params: { spkNomor } }),

  getAlokasi: (nomor: string) =>
    api.get("/mmt/so-spk/alokasi", { params: { nomor } }),
};
