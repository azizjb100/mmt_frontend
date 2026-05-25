<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format, parseISO, isBefore } from "date-fns";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

// --- Import Modals Lookup ---
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import POLookupModal from "@/modal/POLookupModal.vue";

// --- Interfaces ---
interface CustomDetailItem {
  nama: string;
  panjang: number;
  lebar: number;
  jumlah: number;
  harga: number;
  total: number;
}

interface AlokasiItem {
  alokasi: boolean;
  kota: string;
  jumlah: number;
}

interface DPItem {
  tanggal: string;
  nominal: number;
  akun: string;
  namabank: string;
  link: string;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  dateline: string;
  nomorSpk: string;
  namaSpk: string;
  divisi: string;
  joKode: string;
  joNama: string;
  bahan: string;
  ukuran: string;
  panjang: number;
  lebar: number;
  jumlahSpk: number;
  finishing: string;
  keterangan: string;
  cabang: string;
  supKode: string;
  supNama: string;
  supAlamat: string;
  supKota: string;
  bahanSendiri: boolean;
  hasGambar: boolean;
  statusBpb: string;

  // Kalkulasi Utama
  jmlPo: number;
  tarif: number;
  totalHeader: number;

  // Data Tables
  detailCustom: CustomDetailItem[];
  detailAlokasi: AlokasiItem[];
  detailDp: DPItem[];
}

interface LookupItem {
  Kode?: string;
  Nama?: string;
  Alamat?: string;
  Kota?: string;
  [key: string]: any;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/po-external-mmt";
const API_SUPPLIER_DETAIL = "/supplier/detail"; // Endpoint detail supplier dari po-bahan

// --- UI & Modal Controls ---
const isEditMode = ref(false);
const isSaving = ref(false);
const isPoModalVisible = ref(false);
const isSpkModalVisible = ref(false);
const isSupplierModalVisible = ref(false);
const activeTab = ref(0);

// --- State Delphi Lock/Approvals Flags ---
const xminta5 = ref("");
const xurut5 = ref(0);
const zCloseDate = ref<string | null>(null);
const currentUserKode = ref("");

// --- Form State ---
const formData = reactive<FormDataState>({
  nomor: "",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  dateline: format(new Date(), "yyyy-MM-dd"),
  nomorSpk: "",
  namaSpk: "",
  divisi: "",
  joKode: "",
  joNama: "",
  bahan: "",
  ukuran: "",
  panjang: 0,
  lebar: 0,
  jumlahSpk: 0,
  finishing: "",
  keterangan: "",
  cabang: "P05",
  supKode: "",
  supNama: "",
  supAlamat: "",
  supKota: "",
  bahanSendiri: true,
  hasGambar: false,
  statusBpb: "",
  jmlPo: 0,
  tarif: 0,
  totalHeader: 0,
  detailCustom: [
    { nama: "", panjang: 0, lebar: 0, jumlah: 0, harga: 0, total: 0 },
  ],
  detailAlokasi: [{ alokasi: false, kota: "", jumlah: 0 }],
  detailDp: [{ tanggal: "", nominal: 0, akun: "", namabank: "", link: "" }],
});

// --- Table Headers Configuration ---
const headerCustom = [
  { title: "Nama Item", key: "nama", width: "200px" },
  { title: "Panjang", key: "panjang", width: "90px", align: "end" as const },
  { title: "Lebar", key: "lebar", width: "90px", align: "end" as const },
  { title: "Jumlah", key: "jumlah", width: "90px", align: "end" as const },
  { title: "Harga", key: "harga", width: "120px", align: "end" as const },
  { title: "Total", key: "total", width: "130px", align: "end" as const },
  { title: "Aksi", key: "actions", width: "60px", align: "center" as const },
];

const headerAlokasi = [
  { title: "Alokasi", key: "alokasi", width: "70px", align: "center" as const },
  { title: "Kota Tujuan", key: "kota", width: "200px" },
  { title: "Jumlah", key: "jumlah", width: "120px", align: "end" as const },
];

const headerDp = [
  { title: "Tanggal", key: "tanggal", width: "150px" },
  { title: "Nominal", key: "nominal", width: "130px", align: "end" as const },
  { title: "Kode Akun", key: "akun", width: "100px" },
  { title: "Nama Bank", key: "namabank", width: "200px" },
  { title: "Link", key: "link", width: "120px" },
  { title: "Aksi", key: "actions", width: "60px", align: "center" as const },
];

// --- Computed Metrics ---
const totalCustomSum = computed(() => {
  return formData.detailCustom.reduce(
    (sum, item) => sum + (item.total || 0),
    0,
  );
});

const isPeriodClosed = computed(() => {
  if (!zCloseDate.value) return false;
  return (
    isBefore(parseISO(formData.tanggal), parseISO(zCloseDate.value)) &&
    xminta5.value !== "ACC"
  );
});

const isFormReadOnly = computed(() => {
  return (
    ["MINTA", "WAIT", "TOLAK"].includes(xminta5.value) || isPeriodClosed.value
  );
});

// --- Core Delphi Logic Transformed ---
const hitungKalkulasiHeader = () => {
  const { joKode, divisi, panjang, lebar, jmlPo, tarif } = formData;
  let tot = 0;

  if (joKode === "LM" || joKode === "LN") {
    tot = jmlPo * tarif;
  } else if (divisi === "MMT") {
    tot = panjang * lebar * jmlPo * tarif;
  } else {
    tot = panjang * jmlPo * tarif;
  }
  formData.totalHeader = tot;
};

const hitungRowCustom = (index: number) => {
  const item = formData.detailCustom[index];
  const { joKode, divisi } = formData;
  let tot = 0;

  if (joKode === "LM" || joKode === "LN") {
    tot = item.jumlah * item.harga;
  } else if (divisi === "MMT") {
    tot = item.panjang * item.lebar * item.jumlah * item.harga;
  } else {
    tot = item.panjang * item.jumlah * item.harga;
  }
  item.total = tot;
};

watch(
  () => [
    formData.jmlPo,
    formData.tarif,
    formData.panjang,
    formData.lebar,
    formData.joKode,
  ],
  () => {
    hitungKalkulasiHeader();
  },
  { deep: true },
);

// --- Methods & Events ---
const getCurrentUser = () => {
  currentUserKode.value = localStorage.getItem("kdUser") || "";
};

const initGridDefaults = () => {
  formData.detailCustom = [
    { nama: "", panjang: 0, lebar: 0, jumlah: 0, harga: 0, total: 0 },
  ];
  formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];
  formData.detailDp = [
    { tanggal: "", nominal: 0, akun: "", namabank: "", link: "" },
  ];
};

const refreshData = () => {
  isEditMode.value = false;
  xminta5.value = "";
  xurut5.value = 0;

  formData.nomor = "";
  formData.tanggal = format(new Date(), "yyyy-MM-dd");
  formData.dateline = format(new Date(), "yyyy-MM-dd");
  formData.nomorSpk = "";
  formData.namaSpk = "";
  formData.divisi = "";
  formData.joKode = "";
  formData.joNama = "";
  formData.bahan = "";
  formData.ukuran = "";
  formData.panjang = 0;
  formData.lebar = 0;
  formData.jumlahSpk = 0;
  formData.finishing = "";
  formData.keterangan = "";
  formData.supKode = "";
  formData.supNama = "";
  formData.supAlamat = "";
  formData.supKota = "";
  formData.bahanSendiri = true;
  formData.hasGambar = false;
  formData.statusBpb = "";
  formData.jmlPo = 0;
  formData.tarif = 0;
  formData.totalHeader = 0;

  initGridDefaults();
};

const loadDataAll = async (nomorPo: string) => {
  if (!nomorPo) return;
  isSaving.value = true;

  try {
    // 1. Ambil data utama PO dari API lookup backend
    const response = await api.get(`${API_URL}/${nomorPo}`);
    const res = response.data.data || response.data;

    if (res && res.header) {
      const h = res.header;
      isEditMode.value = true;

      // Mapping data form header berdasarkan response database
      formData.nomor = h.poe_nomor;
      formData.tanggal = h.poe_tanggal
        ? format(parseISO(h.poe_tanggal), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      formData.dateline = h.poe_dateline
        ? format(parseISO(h.poe_dateline), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      formData.nomorSpk = h.poe_spk_nomor || "";
      formData.namaSpk = h.spk_nama || "";
      formData.divisi = h.divisi || "";
      formData.joKode = h.spk_jo_kode || "";
      formData.joNama = h.jo_nama || "";
      formData.bahan = h.spk_kain || "";
      formData.ukuran = h.spk_ukuran || "";
      formData.panjang = Number(h.spk_panjang) || 0;
      formData.lebar = Number(h.spk_lebar) || 0;
      formData.jumlahSpk = Number(h.spk_jumlah) || 0;
      formData.finishing = h.poe_finishing || "";
      formData.keterangan = h.poe_ket || "";
      formData.cabang = h.poe_cab || "P05";

      // Data Supplier
      formData.supKode = h.poe_sup || "";
      formData.supNama = h.Sup_nama || "";
      formData.supAlamat = h.Sup_alamat || "";
      formData.supKota = h.Sup_kota || "";

      // Checkbox Flags & Status
      formData.bahanSendiri = h.poe_bahansendiri === "Y";
      formData.statusBpb = h.poe_status || "";
      formData.hasGambar = h.has_gambar === "Y";

      // Nilai Utama Tarif & Qty
      formData.jmlPo = Number(h.poe_jumlah) || 0;
      formData.tarif = Number(h.poe_tarif) || 0;

      // ------------------------------------------------------------
      // 2. AMBIL STATUS LOCK PIN APPROVAL SECARA DINAMIS (Sama dengan LHK pattern)
      // ------------------------------------------------------------
      try {
        const pinRes = await api.get(`${API_URL}/check-pin/${nomorPo}`);
        const pinData = pinRes.data.data || pinRes.data;
        if (pinData) {
          xurut5.value = Number(pinData.pin_urut) || 0;
          if (pinData.pin_acc === "" && pinData.pin_dipakai === "") {
            xminta5.value = "WAIT";
          } else if (pinData.pin_acc === "Y" && pinData.pin_dipakai === "") {
            xminta5.value = "ACC";
          } else if (pinData.pin_acc === "N") {
            xminta5.value = "TOLAK";
          } else if (pinData.pin_acc === "Y" && pinData.pin_dipakai === "Y") {
            xminta5.value = "";
          }
        } else {
          xminta5.value = "";
          xurut5.value = 0;
        }
      } catch (e) {
        console.error("Gagal memuat status PIN kuncian akuntansi:", e);
        xminta5.value = "";
      }

      // ------------------------------------------------------------
      // 3. MAPPING DETAIL ALOKASI KOTA
      // ------------------------------------------------------------
      formData.detailAlokasi.splice(0, formData.detailAlokasi.length);
      if (Array.isArray(res.alokasi) && res.alokasi.length > 0) {
        formData.detailAlokasi = res.alokasi.map((a: any) => ({
          alokasi: true,
          kota: a.poeda_kota,
          jumlah: Number(a.poeda_jumlah) || 0,
        }));
      } else {
        formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];
      }

      // ------------------------------------------------------------
      // 4. MAPPING DETAIL ITEM CUSTOM
      // ------------------------------------------------------------
      formData.detailCustom.splice(0, formData.detailCustom.length);
      if (Array.isArray(res.custom) && res.custom.length > 0) {
        formData.detailCustom = res.custom.map((c: any) => ({
          nama: c.poed_nama,
          panjang: Number(c.poed_panjang) || 0,
          lebar: Number(c.poed_lebar) || 0,
          jumlah: Number(c.poed_jumlah) || 0,
          harga: Number(c.poed_harga) || 0,
          total: Number(c.poed_total) || 0,
        }));
      } else {
        formData.detailCustom = [
          { nama: "", panjang: 0, lebar: 0, jumlah: 0, harga: 0, total: 0 },
        ];
      }

      // ------------------------------------------------------------
      // 5. MAPPING DETAIL DP DENGAN LOOPING TERPISAH (POLA ASYNC LHK)
      // ------------------------------------------------------------
      formData.detailDp.splice(0, formData.detailDp.length);

      if (Array.isArray(res.dp) && res.dp.length > 0) {
        for (const d of res.dp) {
          let namaBankFromDb = d.rek_nama || "";

          // Pola LHK: Jika nama bank kosong di detail, tembak API bantuan finance secara dinamis
          if (!namaBankFromDb && d.poed2_akun) {
            try {
              const resBank = await api.get(
                `/finance/rekening/${d.poed2_akun}`,
              );
              const b = resBank.data.data || resBank.data;
              namaBankFromDb = b.rek_nama || b.NamaBank || "";
            } catch (e) {
              console.error(
                `Gagal ambil detail rekening/bank untuk kode: ${d.poed2_akun}`,
                e,
              );
            }
          }

          formData.detailDp.push({
            tanggal: d.poed2_tanggal
              ? format(parseISO(d.poed2_tanggal), "yyyy-MM-dd")
              : "",
            nominal: Number(d.poed2_nominal) || 0,
            akun: d.poed2_akun || "",
            namabank: namaBankFromDb,
            link: d.poed2_link || "",
          });
        }
      }

      // Jika data DP kosong setelah loop, buatkan baris instan kosong siap pakai
      if (formData.detailDp.length === 0) {
        formData.detailDp = [
          { tanggal: "", nominal: 0, akun: "", namabank: "", link: "" },
        ];
      }

      // Hitung ulang total header utama
      hitungKalkulasiHeader();
      toast.success(`Berhasil memuat transaksi: ${nomorPo}`);
    }
  } catch (error: any) {
    console.error("Load Error PO External:", error);
    toast.error("Gagal memuat data transaksi.");
    refreshData();
  } finally {
    isSaving.value = false;
  }
};

// --- Handlers Supplier (Meniru Persis Sistem PO Bahan) ---
const openSupplierSearch = () => {
  if (isFormReadOnly.value) return;
  isSupplierModalVisible.value = true;
};

const handleSupKodeExit = async () => {
  if (!formData.supKode) return;
  try {
    const response = await api.get(
      `${API_SUPPLIER_DETAIL}/${formData.supKode}`,
    );
    const detail = response.data;
    formData.supNama = detail.Nama;
    formData.supAlamat = detail.Alamat;
    formData.supKota = detail.Kota;
  } catch (error) {
    toast.error("Kode Supplier tidak ditemukan.");
    formData.supKode = "";
    formData.supNama = "";
    formData.supAlamat = "";
    formData.supKota = "";
  }
};

const handleSupplierSelect = async (sup: LookupItem) => {
  if (!sup.Kode) return;
  formData.supKode = sup.Kode;
  formData.supNama = sup.Nama || "";
  formData.supAlamat = sup.Alamat || "";
  formData.supKota = sup.Kota || "";
  isSupplierModalVisible.value = false;
};

const handleSpkSelect = (payload: any) => {
  console.log("Payload mentah yang diterima dari modal:", payload);

  if (!payload) return;

  let spk = payload;
  if (payload.item) spk = payload.item;
  if (payload.raw) spk = payload.raw;

  console.log("Data SPK setelah diekstrak:", spk);

  // PERBAIKAN: Tambahkan spk.Spk di urutan paling depan karena di console terbaca 'Spk'
  const nomorSpkTerpilih = spk.Spk || spk.SPK || spk.spk || spk.spk_nomor || "";

  if (!nomorSpkTerpilih) {
    console.error(
      "Gagal mendeteksi nomor SPK! Periksa key properti pada console.",
    );
    return; // Hentikan proses jika memang kosong
  }

  // Masukkan ke state reactive form
  formData.nomorSpk = nomorSpkTerpilih;
  formData.namaSpk = spk.Nama || spk.nama || "";
  formData.divisi = spk.Divisi || spk.divisi || "";
  formData.bahan = spk.Bahan || spk.bahan || "";
  formData.ukuran = spk.Ukuran || spk.ukuran || "";
  formData.panjang = Number(spk.Panjang) || 0;
  formData.lebar = Number(spk.Lebar) || 0;
  formData.jumlahSpk = Number(spk.Jumlah) || 0;

  // Isi otomatis jumlah PO utama dengan Qty SPK jika nilai awal masih 0
  if (formData.jmlPo === 0) {
    formData.jmlPo = Number(spk.Jumlah) || 0;
  }

  // Tentukan Jenis Order otomatis berdasarkan prefix nomor SPK
  if (formData.nomorSpk) {
    const prefix = formData.nomorSpk.substring(3, 5); // Mengambil KO, MT, LT, dll.
    formData.joKode = prefix;
    formData.joNama = prefix === "MT" ? "MMT / BANNER" : "KONVEKSI / KAOS";
  }

  formData.hasGambar = spk.design_done === "Y" || spk.design_baru === "Y";
  formData.keterangan = spk.Kepentingan || "";

  // Sediakan row alokasi default
  formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];

  // Tutup modal setelah data berhasil di-mapping
  isSpkModalVisible.value = false;
};

const addRowCustom = () => {
  formData.detailCustom.push({
    nama: "",
    panjang: 0,
    lebar: 0,
    jumlah: 0,
    harga: 0,
    total: 0,
  });
};

const removeRowCustom = (index: number) => {
  formData.detailCustom.splice(index, 1);
  if (formData.detailCustom.length === 0) addRowCustom();
};

const addRowDp = () => {
  formData.detailDp.push({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    nominal: 0,
    akun: "",
    namabank: "",
    link: "",
  });
};

const removeRowDp = (index: number) => {
  formData.detailDp.splice(index, 1);
  if (formData.detailDp.length === 0) addRowDp();
};

const saveForm = async () => {
  if (isFormReadOnly.value) {
    toast.error("Transaksi sudah diclose. Silakan minta approve kembali.");
    return;
  }
  if (isPeriodClosed.value) {
    toast.error(
      "Anda tidak boleh input di tanggal periode yang sudah diclose.",
    );
    return;
  }
  if (!formData.nomorSpk) return toast.warning("SPK harus diisi.");
  if (!formData.supKode) return toast.warning("Supplier belum diisi.");
  if (formData.jmlPo <= 0) return toast.warning("Jumlah PO belum diisi.");
  if (formData.tarif <= 0) return toast.warning("Tarif belum diisi.");
  if (isBefore(parseISO(formData.dateline), parseISO(formData.tanggal))) {
    return toast.error("Tanggal Dateline salah (mendahului tanggal order).");
  }

  if (!confirm("Yakin ingin menyimpan data transaksi ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      isEditMode: isEditMode.value,
      poe_nomor: formData.nomor,
      poe_tanggal: formData.tanggal,
      poe_dateline: formData.dateline,
      poe_spk_nomor: formData.nomorSpk,
      poe_cab: formData.cabang,
      poe_sup: formData.supKode,
      poe_ket: formData.keterangan,
      poe_finishing: formData.finishing,
      poe_jumlah: formData.jmlPo,
      poe_tarif: formData.tarif,
      poe_total: formData.totalHeader,
      poe_bahansendiri: formData.bahanSendiri ? "Y" : "N",
      xminta5: xminta5.value,
      xurut5: xurut5.value,
      alokasi: formData.detailAlokasi.filter((a) => a.alokasi),
      dp: formData.detailDp.filter((d) => d.tanggal && d.nominal > 0),
      custom: formData.detailCustom.filter((c) => c.total > 0),
    };

    const res = await api.post(`${API_URL}/save`, payload);
    toast.success(`Tersimpan dengan nomor: ${res.data.nomor}`);

    if (confirm("Ingin cetak nota PO External?")) {
      window.open(`${API_URL}/print/${res.data.nomor}`, "_blank");
    }

    refreshData();
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Gagal menyimpan transaksi.");
  } finally {
    isSaving.value = false;
  }
};

// --- Perbaikan onMounted pada Halaman Form ---
onMounted(async () => {
  getCurrentUser();
  refreshData(); // Bersihkan / isi default form di awal

  // Deteksi parameter nomor dari rute (diambil dari router.push halaman browse)
  const nomorDariParams = route.params.nomor as string;

  if (nomorDariParams) {
    console.log("Mendeteksi Mode Edit untuk Nomor PO:", nomorDariParams);
    // Jalankan fungsi load data pola asynchronous LHK yang sudah kita buat
    await loadDataAll(nomorDariParams);
  } else {
    console.log("Mendeteksi Mode Input Transaksi Baru");
    // Jalankan API kuncian date-close bulanan secara background hanya jika transaksi baru
    try {
      const res = await api.get(`${API_URL}/date-close/PO EXT MMT`);
      zCloseDate.value = res.data.closeDate;
    } catch (err) {
      console.error("Gagal mengambil status periode closing", err);
    }
  }
});
</script>

<template>
  <PageLayout
    title="Form PO External MMT"
    icon="mdi-file-document-edit-outline"
  >
    <template #header-actions>
      <v-chip
        v-if="xminta5 === 'MINTA'"
        color="orange"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-alert-circle</v-icon> STATUS: MINTA PIN
      </v-chip>
      <v-chip
        v-else-if="xminta5 === 'WAIT'"
        color="cyan"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-clock-outline</v-icon> STATUS: WAIT ACC
      </v-chip>
      <v-chip
        v-else-if="xminta5 === 'ACC'"
        color="success"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-check-decagram</v-icon> STATUS: APPROVED
      </v-chip>
      <v-chip
        v-else-if="xminta5 === 'TOLAK'"
        color="error"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-close-octagon</v-icon> STATUS: REJECTED
      </v-chip>

      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm"
        :loading="isSaving"
        :disabled="isFormReadOnly"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan [F10]
      </v-btn>
      <v-btn size="x-small" color="warning" class="ml-1" @click="refreshData">
        <v-icon start>mdi-cancel</v-icon> Batal [F7]
      </v-btn>
      <v-btn size="x-small" color="error" class="ml-1" @click="router.back()">
        <v-icon start>mdi-logout</v-icon> Keluar [F8]
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- LEFT COLUMN -->
      <div class="left-column">
        <v-card flat border>
          <v-card-title
            class="text-caption font-weight-bold py-2 bg-grey-lighten-4"
          >
            HEADER PO & REFERENSI SPK
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor PO (F1)"
                  v-model="formData.nomor"
                  readonly
                  append-inner-icon="mdi-magnify"
                  placeholder="<-- Kosong = Baru"
                  @click="isPoModalVisible = true"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Tanggal Order"
                  v-model="formData.tanggal"
                  type="date"
                  density="compact"
                  variant="outlined"
                  :readonly="isFormReadOnly"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Dateline"
                  v-model="formData.dateline"
                  type="date"
                  density="compact"
                  variant="outlined"
                  :readonly="isFormReadOnly"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  label="Cabang Pembuat"
                  v-model="formData.cabang"
                  :items="['P02', 'P05']"
                  density="compact"
                  variant="outlined"
                  :readonly="isFormReadOnly"
                  hide-details
                />
              </v-col>

              <v-col cols="12" class="mt-2">
                <v-text-field
                  label="Nomor SPK (F1)"
                  v-model="formData.nomorSpk"
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click:control="!isFormReadOnly && (isSpkModalVisible = true)"
                  @click:append-inner="
                    !isFormReadOnly && (isSpkModalVisible = true)
                  "
                  density="compact"
                  variant="outlined"
                  color="blue"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama SPK"
                  v-model="formData.namaSpk"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  label="Divisi"
                  v-model="formData.divisi"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Jenis Order"
                  v-model="formData.joNama"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Bahan"
                  v-model="formData.bahan"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Ukuran"
                  v-model="formData.ukuran"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Panjang"
                  v-model="formData.panjang"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Lebar"
                  v-model="formData.lebar"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Qty SPK"
                  v-model="formData.jumlahSpk"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>

              <v-col cols="12" class="d-flex align-center py-0">
                <v-checkbox
                  v-model="formData.bahanSendiri"
                  label="Bahan Sendiri"
                  density="compact"
                  hide-details
                  :readonly="isFormReadOnly"
                />
                <v-checkbox
                  v-model="formData.hasGambar"
                  label="Ada File Gambar"
                  density="compact"
                  hide-details
                  disabled
                  class="ml-2"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- SUPPLIER DATA CARD -->
        <v-card flat border class="mt-2">
          <v-card-title
            class="text-caption font-weight-bold py-1 bg-grey-lighten-4"
          >
            DATA SUPPLIER
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="4">
                <v-text-field
                  label="Kode Sup"
                  v-model="formData.supKode"
                  :readonly="isFormReadOnly"
                  @click="openSupplierSearch"
                  @keyup.f1.prevent="openSupplierSearch"
                  @blur="handleSupKodeExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="8">
                <v-text-field
                  label="Supplier"
                  v-model="formData.supNama"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Alamat"
                  v-model="formData.supAlamat"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Kota"
                  v-model="formData.supKota"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="right-column">
        <!-- DETAIL PRICING PANEL -->
        <v-card flat border class="mb-2 bg-blue-grey-lighten-5 pa-3">
          <v-row dense align="center">
            <v-col cols="3">
              <v-text-field
                label="Jumlah PO"
                v-model.number="formData.jmlPo"
                type="number"
                density="compact"
                variant="outlined"
                :readonly="isFormReadOnly"
                hide-details
                class="bg-white"
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                label="Tarif / Harga"
                v-model.number="formData.tarif"
                type="number"
                density="compact"
                variant="outlined"
                :readonly="isFormReadOnly"
                hide-details
                class="bg-white"
              />
            </v-col>
            <v-col cols="6">
              <v-card flat border color="primary" class="pa-1 text-right">
                <span
                  class="text-caption font-weight-bold d-block px-2 text-blue-lighten-4"
                >
                  TOTAL NOTA UTAMA
                </span>
                <!-- PERBAIKAN: white--text diubah ke text-white -->
                <span class="text-h6 font-weight-black px-2 text-white">
                  Rp {{ Number(formData.totalHeader).toLocaleString() }}
                </span>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <!-- MULTI TABS FOR CLIENTDATASETS -->
        <v-tabs
          v-model="activeTab"
          density="compact"
          color="primary"
          bg-color="grey-lighten-4"
        >
          <v-tab value="0">
            <v-icon start size="small">mdi-table-edit</v-icon>Item Custom (CDS)
          </v-tab>
          <v-tab value="1">
            <v-icon start size="small">mdi-map-marker-distance</v-icon>Alokasi
            Kota (CDS2)
          </v-tab>
          <v-tab value="2">
            <v-icon start size="small">mdi-cash-multiple</v-icon>Uang Muka / DP
            (CDS3)
          </v-tab>
        </v-tabs>

        <v-window
          v-model="activeTab"
          class="border-x border-b fill-height-window bg-white pa-2"
        >
          <!-- TAB 1: ITEM CUSTOM GRID -->
          <v-window-item value="0">
            <v-data-table
              :headers="headerCustom"
              :items="formData.detailCustom"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
            >
              <template #[`item.nama`]="{ item }">
                <v-text-field
                  v-model="item.nama"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.panjang`]="{ item, index }">
                <v-text-field
                  v-model.number="item.panjang"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.lebar`]="{ item, index }">
                <v-text-field
                  v-model.number="item.lebar"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.jumlah`]="{ item, index }">
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.harga`]="{ item, index }">
                <v-text-field
                  v-model.number="item.harga"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.total`]="{ item }">
                <span class="d-block text-right font-weight-bold">
                  Rp {{ Number(item.total).toLocaleString() }}
                </span>
              </template>
              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRowCustom(index)"
                  :disabled="isFormReadOnly"
                />
              </template>
              <template #bottom>
                <!-- PERBAIKAN: justify-between dihapus, mengandalkan v-spacer di dalam d-flex -->
                <div class="pa-2 border-t d-flex align-center">
                  <v-btn
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="addRowCustom"
                    :disabled="isFormReadOnly"
                  >
                    Tambah Item
                  </v-btn>
                  <v-spacer />
                  <span class="text-caption font-weight-bold text-primary mr-4">
                    Total Custom: Rp {{ totalCustomSum.toLocaleString() }}
                  </span>
                </div>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- TAB 2: ALOKASI KOTA -->
          <v-window-item value="1">
            <v-data-table
              :headers="headerAlokasi"
              :items="formData.detailAlokasi"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
            >
              <template #[`item.alokasi`]="{ item }">
                <v-checkbox
                  v-model="item.alokasi"
                  density="compact"
                  hide-details
                  color="primary"
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.kota`]="{ item }">
                <v-text-field
                  v-model="item.kota"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.jumlah`]="{ item }">
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                />
              </template>
            </v-data-table>
          </v-window-item>

          <!-- TAB 3: DP -->
          <v-window-item value="2">
            <v-data-table
              :headers="headerDp"
              :items="formData.detailDp"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
            >
              <template #[`item.tanggal`]="{ item }">
                <v-text-field
                  v-model="item.tanggal"
                  type="date"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.nominal`]="{ item }">
                <v-text-field
                  v-model.number="item.nominal"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.akun`]="{ item }">
                <v-text-field
                  v-model="item.akun"
                  density="compact"
                  variant="plain"
                  hide-details
                  placeholder="F1 Help"
                  append-inner-icon="mdi-magnify"
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.namabank`]="{ item }">
                <v-text-field
                  v-model="item.namabank"
                  density="compact"
                  variant="plain"
                  hide-details
                  readonly
                  bg-color="grey-lighten-5"
                />
              </template>
              <template #[`item.link`]="{ item }">
                <v-text-field
                  v-model="item.link"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRowDp(index)"
                  :disabled="isFormReadOnly"
                />
              </template>
              <template #bottom>
                <div class="pa-2 border-t">
                  <v-btn
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="addRowDp"
                    :disabled="isFormReadOnly"
                  >
                    Tambah DP
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>

        <!-- PANEL NOTE -->
        <v-textarea
          label="Keterangan Tambahan PO (Memo)"
          v-model="formData.keterangan"
          rows="2"
          variant="outlined"
          density="compact"
          class="mt-2 text-caption"
          hide-details
          :readonly="isFormReadOnly"
        />
      </div>
    </div>

    <!-- LOOKUP MODALS CHANNELS -->
    <POLookupModal
      :isVisible="isPoModalVisible"
      @close="isPoModalVisible = false"
      @select="loadDataAll"
    />
    <SPKLookupModal
      :isVisible="isSpkModalVisible"
      @close="isSpkModalVisible = false"
      @select="handleSpkSelect"
    />
    <SupplierLookupModal
      v-if="isSupplierModalVisible"
      :isVisible="isSupplierModalVisible"
      @close="() => (isSupplierModalVisible = false)"
      @select="handleSupplierSelect"
    />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 12px;
  padding: 8px;
}
.right-column :deep(*) {
  font-size: 11px !important;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
:deep(.v-data-table__td) {
  height: 32px !important;
}
.fill-height-window {
  min-height: 280px;
}
</style>
