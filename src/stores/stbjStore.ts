import { defineStore } from "pinia";
import api from "@/services/api";

export const useStbjStore = defineStore("stbj", {
  state: () => ({
    // Ini mirip dengan Field-field di Tabel tstbj_hdr
    header: {
      stbj_nomor: "",
      stbj_tanggal: new Date().toISOString().substr(0, 10),
      stbj_gdg_kode: "",
      stbj_gdg_nama: "",
      stbj_gdgp_kode: "",
      stbj_keterangan: "",
    },
    // Ini mirip dengan TClientDataSet (CDS) untuk tstbj_dtl
    details: [] as any[],
  }),

  actions: {
    // Fungsi untuk menambah baris kosong (Mirip CDS.Append)
    addDetail() {
      this.details.push({
        stbjd_spk_nomor: "",
        nama_barang: "",
        stbjd_size: "",
        stbjd_jumlah: 0,
        stbjd_koli: 0,
        stbjd_keterangan: "",
      });
    },

    // Fungsi untuk menghapus baris (Mirip CDS.Delete)
    removeDetail(index: number) {
      this.details.splice(index, 1);
      if (this.details.length === 0) {
        this.addDetail();
      }
    },

    // Fungsi untuk load data saat Edit (Mirip loaddataall di Delphi)
    async loadSTBJ(nomor: string) {
      try {
        const res = await api.get(`/stbj/detail-full/${nomor}`);
        this.header = res.data.header;
        this.details = res.data.details;
      } catch (error) {
        console.error("Gagal load data STBJ", error);
      }
    },

    // Fungsi untuk reset form (Mirip refreshdata di Delphi)
    $reset() {
      this.header = {
        stbj_nomor: "OTOMATIS",
        stbj_tanggal: new Date().toISOString().substr(0, 10),
        stbj_gdg_kode: "",
        stbj_gdg_nama: "",
        stbj_gdgp_kode: "",
        stbj_keterangan: "",
      };
      this.details = [];
    },
  },
});