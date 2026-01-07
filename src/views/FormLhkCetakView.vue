<template>
  <PageLayout :title="formTitle" icon="mdi-printer-3d-nozzle-alert-outline">
    <template #header-actions>
      <v-btn size="small" color="primary" @click="handleSave(false)" :loading="isSaving" :disabled="isSaving || !isFormValid">
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-close</v-icon> Batal (F7)
      </v-btn>
      <v-btn v-if="isEditMode" size="small" color="teal" @click="handlePrint" :disabled="isSaving">
        <v-icon start>mdi-printer</v-icon> Cetak (F3)
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar (F8)
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-grey-lighten-4">Informasi LHK</v-card-title>
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="12"><v-text-field label="Nomor LHK" v-model="formData.nomor" readonly variant="outlined" density="compact" hide-details /></v-col>
              <v-col cols="12"><v-text-field label="Tanggal" v-model="formData.tanggal" type="date" variant="outlined" density="compact" hide-details /></v-col>
              <v-col cols="6"><v-text-field label="Shift" v-model.number="formData.shift" type="number" variant="outlined" density="compact" hide-details /></v-col>
              <v-col cols="6"><v-text-field label="Operator" v-model="formData.operator" variant="outlined" density="compact" hide-details /></v-col>
              <v-col cols="12">
                <v-text-field label="Mesin" v-model="formData.mesin" @click:append-inner="openMesinSearch" append-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details readonly style="cursor: pointer" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-blue-lighten-5">Scan Material (Roll)</v-card-title>
          <v-card-text class="pt-4 pa-2">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Scan Barcode Roll"
                  v-model="formData.barcode_input"
                  placeholder="Scan di sini..."
                  prepend-inner-icon="mdi-barcode-scan"
                  variant="outlined"
                  density="compact"
                  color="primary"
                  @keyup.enter="handleBarcodeScan"
                  autocomplete="off"
                />
              </v-col>
              <v-col cols="6"><v-text-field label="P. Bahan" v-model="formData.Panjang_bahan" readonly filled density="compact" hide-details class="text-end" /></v-col>
              <v-col cols="6"><v-text-field label="L. Bahan" v-model="formData.Lebar_bahan" readonly filled density="compact" hide-details class="text-end" /></v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100">
          <v-card-title class="text-subtitle-1 d-flex align-center pa-2 bg-blue-grey-lighten-5">
            Daftar Produksi (Combine SPK)
            <v-spacer />
            <v-btn size="small" color="success" prepend-icon="mdi-plus" @click="openSpkSearch">Tambah SPK</v-btn>
          </v-card-title>

          <v-card-text class="pa-0">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="detailData"
                class="detail-entry-table"
                hide-default-footer
                density="compact"
              >
                <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

                <template #[`item.padding`]="{ item }">
                  <v-text-field v-model.number="item.padding" type="number" density="compact" variant="underlined" @update:modelValue="recalculateCombine" hide-details class="text-end" />
                </template>

                <template #[`item.tile`]="{ item }">
                  <v-text-field v-model.number="item.tile" type="number" density="compact" variant="underlined" @update:modelValue="recalculateCombine" hide-details class="text-end" />
                </template>

                <template v-for="n in 7" :key="n" #[`item.cetak${n}`]="{ item }">
                  <v-text-field
                    v-model.number="item['cetak' + n]"
                    type="number"
                    density="compact"
                    variant="underlined"
                    @update:modelValue="recalculateCombine"
                    hide-details
                    class="text-end cetak-field"
                  />
                </template>

                <template #[`item.totalcetak`]="{ item }">
                  <div class="text-end font-weight-bold text-primary">{{ item.totalcetak }}</div>
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn icon="mdi-delete" size="x-small" color="red" variant="text" @click="removeDetail(index)"></v-btn>
                </template>

                <template #bottom>
                  <div class="pa-4 bg-grey-lighten-4 d-flex align-center border-t">
                    <div class="mr-6">
                      <span class="text-caption">Estimasi P. Terpakai:</span>
                      <div class="text-h6 text-primary">{{ totalPanjangTerpakai.toFixed(3) }} M</div>
                    </div>
                    <div class="mr-6">
                      <span class="text-caption">Sisa Panjang Bahan:</span>
                      <div class="text-h6" :class="sisaPanjangBahan < 0 ? 'text-error' : 'text-success'">
                        {{ sisaPanjangBahan.toFixed(3) }} M
                      </div>
                    </div>
                    
                    <div class="text-right">
                      <span class="text-caption">Total Lebar Gabungan:</span>
                      <div class="text-subtitle-1" :class="totalLebarGabungan > formData.Lebar_bahan ? 'text-error font-weight-bold' : ''">
                        {{ totalLebarGabungan.toFixed(2) }} / {{ formData.Lebar_bahan }} M
                      </div>
                    </div>
                    <v-spacer />
                  </div>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
    

    <GudangLookupView :isVisible="isGudangLookupVisible" @close="isGudangLookupVisible = false" @select="handleGudangSelect" />
    <MesinLookupView :isVisible="isMesinLookupVisible" @close="isMesinLookupVisible = false" @select="handleMesinSelect" />
    <SpkLookupView :isVisible="isSpkLookupVisible" @close="isSpkLookupVisible = false" @select="handleSpkSelect" />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import GudangLookupView from "@/modal/GudangLookupView.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import PageLayout from "../components/PageLayout.vue";

const toast = useToast();

const isSaving = ref(false);
const isEditMode = ref(false);
const isGudangLookupVisible = ref(false);
const isMesinLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  operator: "",
  mesin: "",
  barcode_input: "",
  Panjang_bahan: 0,
  Lebar_bahan: 0,
  sku_aktif: "",
  kode_bahan_aktif: ""
});

const detailData = reactive<any[]>([]);

const detailHeaders = [
  { title: "No", key: "no", width: "40px" },
  { title: "Nomor SPK", key: "nomor_spk" },
  { title: "Nama Produk", key: "nama_spk" },
  { title: "P. SPK", key: "panjang_spk", align: "end" as const },
  { title: "L. SPK", key: "lebar_spk", align: "end" as const },
  { title: "Pad(cm)", key: "padding", width: "70px" },
  { title: "Tile", key: "tile", width: "60px" },
  { title: "C1", key: "cetak1", width: "50px" },
  { title: "C2", key: "cetak2", width: "50px" },
  { title: "C3", key: "cetak3", width: "50px" },
  { title: "C4", key: "cetak4", width: "50px" },
  { title: "C5", key: "cetak5", width: "50px" },
  { title: "C6", key: "cetak6", width: "50px" },
  { title: "C7", key: "cetak7", width: "50px" },
  { title: "Total", key: "totalcetak", width: "60px", align: 'end' as const },
  { title: "", key: "actions", width: "40px" },
];

// --- Logika Perhitungan ---
const totalLebarGabungan = ref(0);
const totalPanjangTerpakai = ref(0);
const sisaPanjangBahan = computed(() => formData.Panjang_bahan - totalPanjangTerpakai.value);

const recalculateCombine = () => {
  if (detailData.length === 0) {
    totalPanjangTerpakai.value = 0;
    totalLebarGabungan.value = 0;
    return;
  }

  // 1. Hitung Lebar Gabungan (Horizontal)
  totalLebarGabungan.value = detailData.reduce((acc, d) => {
    const padM = (d.padding * 2) / 100;
    return acc + (d.tile * (d.lebar_spk + padM));
  }, 0);

  // 2. Cari Panjang SPK terbesar sebagai acuan tarikan mesin (Vertical)
  const maxPanjangSpk = Math.max(...detailData.map(d => d.panjang_spk));
  // Ambil padding baris pertama sebagai acuan jarak antar tarikan
  const paddingM = (detailData[0].padding * 2) / 100;
  const panjangEfektif = maxPanjangSpk + paddingM;

  let maxPutaran = 0;

  detailData.forEach(d => {
    // Hitung total cetak per baris (C1-C7)
    d.totalcetak = (d.cetak1 || 0) + (d.cetak2 || 0) + (d.cetak3 || 0) + 
                   (d.cetak4 || 0) + (d.cetak5 || 0) + (d.cetak6 || 0) + (d.cetak7 || 0);
    
    // Hitung berapa kali mesin harus menarik roll untuk SPK ini
    const putaranPerSpk = Math.ceil(d.totalcetak / (d.tile || 1));
    if (putaranPerSpk > maxPutaran) maxPutaran = putaranPerSpk;
  });

  // 3. Finalize Angka
  totalPanjangTerpakai.value = maxPutaran * panjangEfektif;

  // Sinkronkan data ke setiap baris agar Map detailPayload tetap valid
  detailData.forEach(d => {
    d.panjangTerpakai = totalPanjangTerpakai.value;
    d.sisaBahanPanjang = formData.Panjang_bahan - totalPanjangTerpakai.value;
  });
};

// --- Handlers ---
const handleBarcodeScan = async () => {
  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    if (res.data?.success) {
      const d = res.data.data.data;
      formData.sku_aktif = d.Barcode;
      formData.kode_bahan_aktif = d.Kode;
      formData.Panjang_bahan = parseFloat(d.Sisa_Panjang);
      formData.Lebar_bahan = parseFloat(d.Lebar);
      recalculateCombine();
      toast.success("Barcode material berhasil dimuat.");
    }
  } catch (e) { toast.error("Barcode tidak ditemukan."); }
};

const handleSpkSelect = (spk: any) => {
  detailData.push({
    // Data Material (Sinkron dengan scan di kolom kiri)
    sku: formData.sku_aktif,
    kodebahan: formData.kode_bahan_aktif,
    ambilBahanPanjang: formData.Panjang_bahan,
    ambilBahanLebar: formData.Lebar_bahan,
    nomor_spk: spk.Spk,
    nama_spk: spk.Nama,
    panjang_spk: spk.Panjang || 0,
    lebar_spk: spk.Lebar || 0,
    padding: 5,
    tile: 1,
    cetak1: 0, cetak2: 0, cetak3: 0, cetak4: 0, cetak5: 0, cetak6: 0, cetak7: 0,
    totalcetak: 0,
    
    // Field hasil kalkulasi per baris
    panjangTerpakai: 0,
    sisaBahanPanjang: 0,
    sisaBahanLebar: 0
  });

  recalculateCombine();
  isSpkLookupVisible.value = false;
};

const handleSave = async (saveAndNew: boolean) => {
  if (detailData.length === 0) {
    toast.warning("Belum ada data produksi.");
    return;
  }

  isSaving.value = true;

  // 1. Detail Payload
  const detailPayload = detailData
    .filter(d => d.sku)
    .map(d => ({
      sku: d.sku,
      kodebahan: d.kodebahan,
      ambilBahanPanjang: d.ambilBahanPanjang,
      ambilBahanLebar: d.ambilBahanLebar,
      cetak1: d.cetak1 || 0,
      cetak2: d.cetak2 || 0,
      cetak3: d.cetak3 || 0,
      cetak4: d.cetak4 || 0,
      cetak5: d.cetak5 || 0,
      cetak6: d.cetak6 || 0,
      cetak7: d.cetak7 || 0,
      totalcetak: d.totalcetak || 0,
      cetakmeter: d.panjangTerpakai || 0,
      sisabahan: d.sisaBahanPanjang || 0,
      sisabahanlebar: d.sisaBahanLebar || 0,
      padding: d.padding || 0,
      tile: d.tile || 0,
    }));

  // 2. Header Payload (TANPA USER)
  const headerPayload = {
    lnomor: formData.nomor,
    ltanggal: formData.tanggal,
    lshift: formData.shift,
    loperator: formData.operator,
    lmesin: formData.mesin,

    lgdg_prod: "GPM",
    lspk_nomor: detailData[0]?.nomor_spk || "",
    lbahan: detailData[0]?.kodebahan || "",
    lpanjang: detailData[0]?.panjang_spk || 0,
    ljumlah_kolom: detailData[0]?.tile || 1,
    lfixed: 0
  };

  const payload = {
    header: headerPayload,
    details: detailPayload
  };

  console.log("Kirim Payload:", payload);

  try {
    const res = await api.post("/mmt/lhk-cetak", payload);

    if (res.data.success) {
      toast.success("LHK berhasil disimpan");
      if (!saveAndNew) {
        // redirect / reset
      }
    } else {
      toast.error(res.data.message || "Gagal menyimpan");
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Terjadi kesalahan sistem");
  } finally {
    isSaving.value = false;
  }
};


const openMesinSearch = () => isMesinLookupVisible.value = true;
const openSpkSearch = () => isSpkLookupVisible.value = true;
const handleMesinSelect = (m: any) => { formData.mesin = m.Kode; isMesinLookupVisible.value = false; };
const removeDetail = (idx: number) => { detailData.splice(idx, 1); recalculateCombine(); };
const isFormValid = computed(() => formData.operator && formData.mesin && detailData.length > 0);
</script>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 15px;
}
.detail-table-wrapper { overflow-x: auto; }
.cetak-field :deep(input) { text-align: center !important; font-size: 11px; }
.text-end :deep(input) { text-align: right !important; }
</style>