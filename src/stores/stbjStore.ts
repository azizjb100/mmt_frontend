import { defineStore } from "pinia";
import api from "@/services/api";
import { format } from "date-fns"; // Pastikan date-fns terinstal

export const useStbjStore = defineStore("stbj", {
  state: () => ({
    header: {
      stbj_nomor: "",
      // Menggunakan format date-fns agar sesuai tanggal lokal saat ini (YYYY-MM-DD)
      stbj_tanggal: format(new Date(), "yyyy-MM-dd"),
      stbj_gdg_kode: "",
      stbj_gdg_nama: "",
      stbj_gdgp_kode: "",
      stbj_keterangan: "",
    },
    details: [] as any[],
  }),

  actions: {
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

    removeDetail(index: number) {
      this.details.splice(index, 1);
      if (this.details.length === 0) {
        this.addDetail();
      }
    },

    async loadSTBJ(nomor: string) {
      try {
        const res = await api.get(`/stbj/detail-full/${nomor}`);
        
        // --- Perbaikan Formatting Tanggal saat Load ---
        const rawHeader = res.data.header;
        if (rawHeader.stbj_tanggal) {
          // Memastikan hanya mengambil 10 karakter pertama (YYYY-MM-DD)
          rawHeader.stbj_tanggal = rawHeader.stbj_tanggal.substring(0, 10);
        }
        
        this.header = rawHeader;
        this.details = res.data.details;
      } catch (error) {
        console.error("Gagal load data STBJ", error);
      }
    },

    $reset() {
      this.header = {
        stbj_nomor: "OTOMATIS",
        stbj_tanggal: format(new Date(), "yyyy-MM-dd"),
        stbj_gdg_kode: "",
        stbj_gdg_nama: "",
        stbj_gdgp_kode: "",
        stbj_keterangan: "",
      };
      this.details = [];
    },
  },
});