<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import { format } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

// --- Interfaces ---
interface DetailItem {
  SKU: string;
  NamaBarang: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Expired: string | null;
  System: number; // Stok Program
  Fisik: number; // Stok Riil
  Qty: number; // Selisih (Fisik - System)
  Harga: number;
  Nilai: number; // Qty * Harga
}

interface MasterHeader {
  Nomor: string;
  Tanggal: string;
  GudangKode: string;
  GudangNama: string;
  TypeKor: number | null;
  Keterangan: string;
}

const router = useRouter();
const route = useRoute();

// --- State ---
const loading = ref(false);
const isEdit = computed(() => !!route.params.id);

const header = reactive<MasterHeader>({
  Nomor: "AUTO",
  Tanggal: format(new Date(), "yyyy-MM-dd"),
  GudangKode: "WH-16",
  GudangNama: "GUDANG UTAMA MMT",
  TypeKor: "STOK OPNAME AWAL", // Default sesuai Delphi: cxLookupTypekor.ItemIndex:=3
  Keterangan: "",
});

const details = ref<DetailItem[]>([]);
const listGudang = ref([]);
const listTypeKor = ref([]);

// --- Table Headers ---
const tableHeaders = [
  { title: "No", key: "index", width: "50px" },
  { title: "SKU / Kode Barang", key: "SKU", width: "150px" },
  { title: "Nama Barang", key: "NamaBarang", minWidth: "250px" },
  { title: "Satuan", key: "Satuan", width: "100px" },
  { title: "Stok Sistem", key: "System", align: "end", width: "120px" },
  { title: "Stok Fisik", key: "Fisik", align: "end", width: "120px" },
  { title: "Qty Koreksi", key: "Qty", align: "end", width: "120px" },
  { title: "Aksi", key: "actions", sortable: false, width: "50px" },
];

// --- Methods ---
const addRow = () => {
  details.value.push({
    SKU: "",
    NamaBarang: "",
    Satuan: "",
    Panjang: 0,
    Lebar: 0,
    Expired: null,
    System: 0,
    Fisik: 0,
    Qty: 0,
    Harga: 0,
    Nilai: 0,
  });
};

const removeRow = (index: number) => {
  details.value.splice(index, 1);
  if (details.value.length === 0) addRow();
};

// Logika hitung selisih (Fisik - Sistem)
const calculateRow = (index: number) => {
  const item = details.value[index];
  item.Qty = (item.Fisik || 0) - (item.System || 0);
  item.Nilai = item.Qty * (item.Harga || 0);
};

const fetchLookups = async () => {
  try {
    const [resGdg, resType] = await Promise.all([
      api.get("/lookup/gudang-mmt"),
      api.get("/lookup/type-koreksi"),
    ]);
    listGudang.value = resGdg.data.data;
    listTypeKor.value = resType.data.data;
  } catch (e) {
    console.error("Gagal load lookup", e);
  }
};

const loadAllStockFromGudang = async () => {
  if (!header.GudangKode) return alert("Pilih gudang terlebih dahulu");

  loading.value = true;
  try {
    // Perbaikan: Mengirim parameter gudangKode dan tanggal melalui query string
    const res = await api.get("/mmt/koreksi-stok/stok", {
      params: {
        gudangKode: header.GudangKode,
        tanggal: header.Tanggal,
      },
    });

    // Pastikan mengambil data dari struktur response yang benar (res.data.data)
    const dataStok = res.data.data || [];

    if (dataStok.length === 0) {
      alert("Tidak ada data stok ditemukan untuk gudang dan tanggal tersebut.");
      details.value = [];
      return;
    }

    // Mapping hasil query ke dalam format tabel detail
    details.value = dataStok.map((item: any) => ({
      SKU: item.Kode,
      NamaBarang: item.Nama,
      Satuan: item.Satuan,
      Panjang: item.Panjang || 0,
      Lebar: item.Lebar || 0,
      Expired: null,
      System: item.Stok, // Stok dari database masuk ke kolom System
      Fisik: 0, // User akan mengisi ini
      Qty: item.Stok * -1, // Logika awal: 0 - System
      Harga: item.HRGBELI || 0,
      Nilai: item.Stok * -1 * (item.HRGBELI || 0),
    }));
  } catch (e: any) {
    console.error("Gagal load stok:", e);
    alert("Gagal memuat stok: " + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

// Simulasi bantuansku (Pencarian Barang)
const searchBarang = async (index: number) => {
  console.log("Mencari barang untuk baris", index);
};

const saveData = async () => {
  // Validasi minimal
  if (!header.GudangKode) return alert("Pilih gudang terlebih dahulu!");
  if (details.value.filter((d) => d.SKU).length === 0)
    return alert("Detail barang belum diisi!");

  loading.value = true;
  try {
    const payload = {
      header: header,
      details: details.value.filter((d) => d.SKU), // Hanya kirim baris yang ada SKU-nya
    };

    const res = await api.post("/mmt/koreksi-stok", payload);

    if (res.data.status === "success") {
      alert("Simpan Berhasil dengan Nomor: " + res.data.data.nomor);
      router.push({ name: "KoreksiStokBrowse" }); // Kembali ke daftar histori
    }
  } catch (e: any) {
    alert("Gagal Simpan: " + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLookups();
  if (!isEdit.value) addRow();
});
</script>

<template>
  <PageLayout
    :title="isEdit ? 'Edit Koreksi Stok' : 'Input Koreksi Stok'"
    icon="mdi-plus-box"
  >
    <template #header-actions>
      <v-btn
        color="secondary"
        variant="outlined"
        size="small"
        class="mr-2"
        @click="router.back()"
      >
        Batal
      </v-btn>

      <v-btn color="primary" size="small" @click="saveData" :loading="loading">
        <v-icon start>mdi-content-save</v-icon>
        Simpan Data
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4 bg-grey-lighten-4">
          <v-text-field
            v-model="header.Nomor"
            label="Nomor Bukti"
            readonly
            density="compact"
            variant="outlined"
            color="primary"
            class="mb-2"
          />
          <v-text-field
            v-model="header.Tanggal"
            label="Tanggal"
            type="date"
            density="compact"
            variant="outlined"
            class="mb-2"
          />
          <v-select
            v-model="header.GudangKode"
            :items="listGudang"
            item-title="Gudang"
            item-value="Kode"
            label="Gudang"
            density="compact"
            variant="outlined"
            class="mb-2"
          />
          <v-select
            v-model="header.TypeKor"
            :items="listTypeKor"
            item-title="nama"
            item-value="kode"
            label="Tipe Koreksi"
            density="compact"
            variant="outlined"
            class="mb-2"
          />
          <v-textarea
            v-model="header.Keterangan"
            label="Keterangan"
            rows="2"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="outlined" class="d-flex flex-column h-100">
          <v-toolbar density="compact" color="grey-lighten-4" flat>
            <v-btn
              color="indigo"
              variant="flat"
              size="small"
              prepend-icon="mdi-database-import"
              @click="loadAllStockFromGudang"
              :loading="loading"
              class="ml-2"
            >
              Ambil Semua Stok Gudang
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" size="small" @click="addRow">
              <v-icon start>mdi-plus</v-icon>Tambah Baris Manual
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="tableHeaders"
            :items="details"
            density="compact"
            class="flex-grow-1"
            fixed-header
            height="400px"
          >
            <template #item.index="{ index }">
              {{ index + 1 }}
            </template>

            <template #item.SKU="{ item, index }">
              <v-text-field
                v-model="item.SKU"
                density="compact"
                variant="plain"
                hide-details
                append-inner-icon="mdi-magnify"
                @click:append-inner="searchBarang(index)"
                readonly
              />
            </template>

            <template #item.Fisik="{ item, index }">
              <v-text-field
                v-model.number="item.Fisik"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                @input="calculateRow(index)"
                class="text-right custom-input"
              />
            </template>

            <template #item.Qty="{ item }">
              <span
                :class="
                  item.Qty < 0
                    ? 'text-error font-weight-bold'
                    : 'text-success font-weight-bold'
                "
              >
                {{ item.Qty }}
              </span>
            </template>

            <template #item.actions="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeRow(index)"
              />
            </template>
          </v-data-table>

          <v-divider />

          <v-card-actions class="bg-grey-lighten-5">
            <v-btn
              color="primary"
              variant="text"
              prepend-icon="mdi-plus"
              @click="addRow"
            >
              Tambah Baris
            </v-btn>
            <v-spacer />
            <div class="text-subtitle-1 mr-4">
              Total Nilai:
              <span class="font-weight-bold text-primary">
                {{
                  details
                    .reduce((a, b) => a + (b.Nilai || 0), 0)
                    .toLocaleString()
                }}
              </span>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>
</template>

<style scoped>
.custom-input :deep(input) {
  text-align: right;
}
:deep(.v-data-table-header) {
  background-color: #f5f5f5 !important;
}
</style>
