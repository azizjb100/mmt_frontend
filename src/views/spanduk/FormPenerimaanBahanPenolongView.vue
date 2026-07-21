<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format } from "date-fns";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const API_PO_PENOLONG = "/po-penolongs"; // Sesuaikan dengan prefix base route Express Anda

// --- State Management ---
const isEditMode = ref(false);
const loading = ref(false);
const loadingSku = ref(false);

// Form Fields Header
const nomor = ref("");
const tanggal = ref(format(new Date(), "yyyy-MM-dd"));
const dateline = ref(format(new Date(), "yyyy-MM-dd"));
const isTax = ref(true);
const memo = ref("");
const supKode = ref("");
const supNama = ref("");
const supAlamat = ref("");
const supTelp = ref("");
const gdgKode = ref("");
const gdgNama = ref("");

// Summary & Diskon
const discPr = ref(0); // edtDiscpr (Diskon %)
const discNominal = ref(0); // edtDisc (Diskon Rp)

// Detail Grid Items (Client DataSet / CDS)
interface PODetailItem {
  SKU: string;
  NamaBarang: string;
  Satuan: string;
  Lebar: string;
  QTY: number;
  Harga: number;
  Disc: number;
  Total: number;
  Keterangan: string;
}
const items = ref<PODetailItem[]>([]);

// Data Sumber Lookup Master
const skuList = ref<any[]>([]);

// --- Grid Headers Config ---
const headers = [
  { title: "No", key: "index", width: "50px", sortable: false },
  { title: "Kode SKU", key: "SKU", width: "180px", sortable: false },
  { title: "Nama Barang", key: "NamaBarang", minWidth: "250px", sortable: false },
  { title: "Satuan", key: "Satuan", width: "90px", align: "center" as const },
  { title: "QTY", key: "QTY", width: "110px", align: "end" as const },
  { title: "Harga Satuan", key: "Harga", width: "140px", align: "end" as const },
  { title: "Disc (%)", key: "Disc", width: "90px", align: "end" as const },
  { title: "Total Bersih", key: "Total", width: "150px", align: "end" as const },
  { title: "Keterangan", key: "Keterangan", minWidth: "180px" },
  { title: "Aksi", key: "actions", width: "70px", sortable: false, align: "center" as const },
];

// --- Hitung Kalkulasi Finansial (Fungsi hitung() di Delphi) ---
const subTotal = computed(() => {
  return items.value.reduce((acc, item) => acc + (Number(item.Total) || 0), 0);
});

const discFaktur = computed(() => {
  const prAmount = (Number(discPr.value) / 100) * subTotal.value;
  return prAmount + Number(discNominal.value);
});

const totalSetelahDiskon = computed(() => {
  const hasil = subTotal.value - discFaktur.value;
  return hasil < 0 ? 0 : hasil;
});

const ppnAmount = computed(() => {
  return isTax.value ? totalSetelahDiskon.value * 0.1 : 0;
});

const grandTotal = computed(() => {
  return isTax.value ? totalSetelahDiskon.value * 1.1 : totalSetelahDiskon.value;
});

// --- Method Actions & Lookups ---
const fetchSkuLookup = async () => {
  loadingSku.value = true;
  try {
    const res = await api.get(`${API_PO_PENOLONG}/lookup/sku`);
    skuList.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat list barang penolong.");
  } finally {
    loadingSku.value = false;
  }
};

const handleSkuChange = (skuCode: string, index: number) => {
  // Cek Duplikasi SKU (Replika dari clSKUPropertiesValidate di Delphi)
  const isDuplicate = items.value.some((item, idx) => item.SKU === skuCode && idx !== index);
  if (isDuplicate) {
    toast.error(`Kode SKU sudah diinput pada baris lain.`);
    items.value[index].SKU = "";
    return;
  }

  const match = skuList.value.find((s) => s.SKU === skuCode);
  if (match) {
    items.value[index].NamaBarang = match.NamaBarang;
    items.value[index].Satuan = match.Satuan;
    items.value[index].Lebar = match.Lebar;
    calculateRowTotal(index);
  }
};

const calculateRowTotal = (index: number) => {
  const row = items.value[index];
  const gross = (Number(row.QTY) || 0) * (Number(row.Harga) || 0);
  const discValue = gross * ((Number(row.Disc) || 0) / 100);
  row.Total = gross - discValue;
};

// --- Manipulasi Baris Grid (Replika HapusRecord1 & initgrid Delphi) ---
const addRow = () => {
  items.value.push({
    SKU: "",
    NamaBarang: "",
    Satuan: "",
    Lebar: "",
    QTY: 0,
    Harga: 0,
    Disc: 0,
    Total: 0,
    Keterangan: "",
  });
};

const removeRow = (index: number) => {
  items.value.splice(index, 1);
  if (items.value.length === 0) addRow();
};

// --- Load Data Terpilih (Fungsi loaddataall di Delphi) ---
const loadDataPO = async (nomorPo: string) => {
  loading.value = true;
  try {
    const res = await api.get(`${API_PO_PENOLONG}/${encodeURIComponent(nomorPo)}`);
    const data = res.data.data;

    isEditMode.value = true;
    nomor.value = data.Nomor;
    tanggal.value = format(new Date(data.Tanggal), "yyyy-MM-dd");
    dateline.value = format(new Date(data.Dateline), "yyyy-MM-dd");
    isTax.value = data.isTax === 1;
    memo.value = data.Memo;
    supKode.value = data.SupKode;
    discPr.value = data.DiscFakturPr;
    discNominal.value = data.DiscFaktur;

    // Load Items Detail
    items.value = (data.details || []).map((d: any) => ({
      SKU: d.SKU,
      NamaBarang: d.NamaBarang,
      Satuan: d.Satuan,
      QTY: Number(d.QTY),
      Harga: Number(d.Harga),
      Disc: Number(d.Disc),
      Total: Number(d.Nilai),
      Keterangan: d.Keterangan || "",
    }));
    
    await fetchSupplierDetail();
    await fetchGudangDetail(data.GdgKode);
  } catch (error) {
    toast.error("Gagal memuat detail transaksi PO.");
  } finally {
    loading.value = false;
  }
};

// Simulasikan Pemanggilan Aksi Bantu / Cek Data Supplier & Gudang
const fetchSupplierDetail = async () => {
  if (!supKode.value) return;
  try {
    const res = await api.get(`/master-bahan/lookup/supplier?q=${supKode.value}`);
    const match = res.data.data?.find((s: any) => s.Kode === supKode.value);
    if (match) {
      supNama.value = match.Nama;
    }
  } catch (e) {}
};

const fetchGudangDetail = async (kodeGdg: string) => {
  if (!kodeGdg) return;
  gdgKode.value = kodeGdg;
  try {
    const res = await api.get(`/master-bahan/lookup/gudang?q=${kodeGdg}`);
    const match = res.data.data?.find((g: any) => g.Kode === kodeGdg);
    if (match) {
      gdgNama.value = match.Nama;
    }
  } catch (e) {}
};

// --- Aksi Simpan Data (cxButton1Click / simpandata Delphi) ---
const handleSave = async () => {
  // Validasi (cekdata Bawaan Delphi)
  if (!supKode.value) return toast.warning("Supplier belum dipilih.");
  if (!gdgKode.value) return toast.warning("Gudang tujuan belum dipilih.");
  
  const invalidRow = items.value.some((item) => !item.SKU || Number(item.QTY) <= 0);
  if (invalidRow) return toast.warning("Pastikan seluruh kolom SKU dan QTY terisi valid.");

  try {
    const payload = {
      isEditMode: isEditMode.value,
      Nomor: nomor.value,
      Tanggal: tanggal.value,
      Dateline: dateline.value,
      isTax: isTax.value ? 1 : 0,
      Memo: memo.value,
      SupKode: supKode.value,
      GdgKode: gdgKode.value,
      Disc: discNominal.value,
      DiscPr: discPr.value,
      Total: grandTotal.value,
      PPN: ppnAmount.value,
      details: items.value,
    };

    await api.post(`${API_PO_PENOLONG}/save`, payload);
    toast.success("Transaksi Purchase Order Penolong berhasil disimpan!");
    router.push({ name: "BrowsePOPenolong" }); // Kembali ke grid utama
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan data transaksi.");
  }
};

onMounted(async () => {
  await fetchSkuLookup();
  const paramNomor = route.params.nomor as string;
  if (paramNomor) {
    await loadDataPO(paramNomor);
  } else {
    addRow();
  }
});
</script>

<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4">
    <v-row>
      <!-- Area Header Form Utama -->
      <v-col cols="12">
        <v-card variant="outlined" class="bg-white rounded-lg shadow-sm">
          <v-card-title class="d-flex align-center py-3 bg-indigo text-white">
            <v-icon icon="mdi-cart-arrow-down" class="mr-3" />
            <span class="text-h6 font-weight-bold">Form Purchase Order Barang Penolong</span>
            <v-spacer />
            <v-chip class="font-weight-black" color="white" variant="outlined">
              {{ isEditMode ? 'MODE UBAH DATA' : 'TRANSAKSI BARU' }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pt-4">
            <v-row dense>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="nomor"
                  label="Nomor Transaksi"
                  density="compact"
                  variant="outlined"
                  readonly
                  placeholder="[Otomatis By System]"
                  bg-color="grey-lighten-3"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="tanggal"
                  label="Tanggal Transaksi"
                  type="date"
                  density="compact"
                  variant="outlined"
                  :readonly="isEditMode"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="dateline"
                  label="Deadline / Jatuh Tempo"
                  type="date"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3" class="d-flex align-center pl-4">
                <v-checkbox
                  v-model="isTax"
                  label="Kena Pajak PPN (11%)"
                  density="compact"
                  color="indigo"
                  hide-details
                  :disabled="isEditMode"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-text-field
                  v-model="supKode"
                  label="Kode Supplier"
                  density="compact"
                  variant="outlined"
                  append-inner-icon="mdi-magnify"
                  @blur="fetchSupplierDetail"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="supNama" label="Nama Supplier" density="compact" variant="outlined" readonly bg-color="grey-lighten-4" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="gdgKode" label="Gudang Default" density="compact" variant="outlined" append-inner-icon="mdi-magnify" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="gdgNama" label="Nama Gudang" density="compact" variant="outlined" readonly bg-color="grey-lighten-4" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Area Dynamic Data Table Detail -->
      <v-col cols="12">
        <v-card variant="outlined" class="bg-white rounded-lg">
          <v-table density="compact" class="border-sm">
            <thead>
              <tr class="bg-grey-lighten-2 text-subtitle-2 font-weight-bold">
                <th style="width: 50px;">No</th>
                <th style="width: 220px;">Kode SKU</th>
                <th>Nama Barang Penolong</th>
                <th style="width: 90px;" class="text-center">Satuan</th>
                <th style="width: 120px;" class="text-right">QTY</th>
                <th style="width: 140px;" class="text-right">Harga Satuan</th>
                <th style="width: 100px;" class="text-right">Disc (%)</th>
                <th style="width: 160px;" class="text-right">Total</th>
                <th>Keterangan</th>
                <th style="width: 60px;" class="text-center">Hapus</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in items" :key="index">
                <td class="text-center font-weight-bold">{{ index + 1 }}</td>
                <td>
                  <v-autocomplete
                    v-model="item.SKU"
                    :items="skuList"
                    item-title="SKU"
                    item-value="SKU"
                    density="compact"
                    variant="plain"
                    hide-details
                    :loading="loadingSku"
                    @update:model-value="(val) => handleSkuChange(val, index)"
                  />
                </td>
                <td>
                  <v-text-field v-model="item.NamaBarang" density="compact" variant="plain" hide-details readonly class="text-grey-darken-1" />
                </td>
                <td class="text-center">{{ item.Satuan || '-' }}</td>
                <td>
                  <v-text-field v-model.number="item.QTY" type="number" density="compact" variant="outlined" hide-details class="text-right no-spin" @input="calculateRowTotal(index)" />
                </td>
                <td>
                  <v-text-field v-model.number="item.Harga" type="number" density="compact" variant="outlined" hide-details class="text-right" @input="calculateRowTotal(index)" />
                </td>
                <td>
                  <v-text-field v-model.number="item.Disc" type="number" density="compact" variant="outlined" hide-details class="text-right" @input="calculateRowTotal(index)" />
                </td>
                <td class="text-right font-weight-bold pr-4">
                  {{ Number(item.Total || 0).toLocaleString("id-ID") }}
                </td>
                <td>
                  <v-text-field v-model="item.Keterangan" density="compact" variant="outlined" hide-details />
                </td>
                <td class="text-center">
                  <v-btn icon="mdi-delete" size="x-small" color="red" variant="text" @click="removeRow(index)" />
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-card-actions class="pa-2 bg-grey-lighten-4">
            <v-btn prepend-icon="mdi-plus" color="indigo" variant="flat" size="small" @click="addRow">
              Tambah Baris Baru
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Area Input Memo & Perhitungan Ringkasan Faktur -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="bg-white rounded-lg fill-height pa-3">
          <v-textarea v-model="memo" label="Catatan / Memo PO Internal" variant="outlined" rows="6" density="compact" counter maxLength="255" />
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="bg-white rounded-lg pa-4">
          <v-row dense class="text-subtitle-2">
            <v-col cols="6" class="d-flex align-center">Subtotal Item Bruto:</v-col>
            <v-col cols="6" class="text-right font-weight-bold">Rp {{ subTotal.toLocaleString("id-ID") }}</v-col>
            
            <v-col cols="3" class="d-flex align-center">Diskon Faktur:</v-col>
            <v-col cols="3">
              <v-text-field v-model.number="discPr" type="number" label="%" suffix="%" density="compact" variant="outlined" hide-details />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="discNominal" type="number" label="Nominal Rp" prefix="Rp" density="compact" variant="outlined" hide-details class="text-right" />
            </v-col>

            <v-divider class="my-2" cols="12" />

            <v-col cols="6" class="d-flex align-center">Total Setelah Potongan:</v-col>
            <v-col cols="6" class="text-right text-indigo font-weight-bold">Rp {{ totalSetelahDiskon.toLocaleString("id-ID") }}</v-col>

            <v-col cols="6" class="d-flex align-center">Nilai PPN Pajak (10% DPP):</v-col>
            <v-col cols="6" class="text-right text-orange-darken-3">Rp {{ ppnAmount.toLocaleString("id-ID") }}</v-col>

            <v-divider class="my-2" cols="12" />

            <v-col cols="6" class="text-h6 font-weight-bold d-flex align-center">GRAND TOTAL PO:</v-col>
            <v-col cols="6" class="text-h6 text-green-darken-3 font-weight-black text-right">
              Rp {{ grandTotal.toLocaleString("id-ID") }}
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Panel Tombol Aksi Bawah -->
      <v-col cols="12" class="d-flex justify-end gap-2">
        <v-btn prepend-icon="mdi-close" color="grey-darken-1" variant="outlined" class="mr-2" @click="router.push({ name: 'BrowsePOPenolong' })">
          Batal / Keluar
        </v-btn>
        <v-btn prepend-icon="mdi-content-save-check" color="success" variant="flat" size="large" @click="handleSave">
          Simpan Transaksi PO (F10)
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.no-spin :deep(input[type="number"]::-webkit-outer-spin-button),
.no-spin :deep(input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
.gap-2 {
  gap: 8px;
}
</style>