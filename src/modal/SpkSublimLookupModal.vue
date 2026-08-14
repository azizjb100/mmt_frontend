<template>
  <div>
    <!-- Dialog Utama Lookup SPK Sublim -->
    <v-dialog
      :model-value="isVisible"
      @update:modelValue="emit('close')"
      max-width="1100px"
      persistent
    >
      <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
        <!-- Header Toolbar dengan Radio Mode Extract -->
        <v-toolbar color="indigo-darken-2" density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            🔥 Pencarian SPK & Realisasi Bahan (Khusus Sublimasi)
          </v-toolbar-title>
          <v-spacer></v-spacer>

          <!-- Choice Mode: SET vs KOMPONEN -->
          <v-radio-group
            v-model="extractMode"
            inline
            hide-details
            density="compact"
            class="spk-modal-mode text-body-2 mr-4"
          >
            <v-radio
              label="Ambil Per Set (Semua Komponen)"
              value="SET"
              color="white"
            ></v-radio>
            <v-radio
              label="Ambil Per Komponen"
              value="KOMPONEN"
              color="white"
            ></v-radio>
          </v-radio-group>

          <v-btn
            icon="mdi-close"
            @click="emit('close')"
            variant="text"
            size="small"
          ></v-btn>
        </v-toolbar>

        <!-- Body Content -->
        <v-card-text class="pa-4 d-flex flex-column flex-grow-1">
          <v-text-field
            v-model="searchKeyword"
            label="Cari Nomor SPK, Nama Pelanggan, atau Kain..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4 flex-shrink-0"
            hide-details
            @keyup.enter="fetchSPKData"
          ></v-text-field>

          <v-data-table
            :headers="headers"
            :items="groupedItems"
            :loading="loading"
            hover
            class="desktop-table flex-grow-1 clickable-row"
            density="compact"
            item-key="SPK"
            fixed-header
            :items-per-page="20"
            @click:row="handleRowClick"
            @dblclick:row="handleDoubleClick"
          >
            <template #item.SPK="{ item }">
              <span class="font-weight-bold color-spk">{{ item.SPK }}</span>
            </template>

            <template #item.Nomor_Realisasi="{ item }">
              <v-chip
                :color="item.Nomor_Realisasi !== '-' ? 'success' : 'default'"
                size="x-small"
                label
                class="font-weight-medium"
              >
                {{ item.Nomor_Realisasi }}
              </v-chip>
            </template>

            <template #item.Tanggal="{ item }">
              {{
                item.Tanggal
                  ? new Date(item.Tanggal).toLocaleDateString("id-ID")
                  : "-"
              }}
            </template>

            <template #item.Bahan_Awal="{ item }">
              <span class="font-weight-bold text-teal-darken-3">
                {{ item.Bahan_Awal ? item.Bahan_Awal + " M" : "-" }}
              </span>
            </template>

            <template #item.Tipe_SPK="{ item }">
              <v-chip
                :color="
                  item.Tipe_SPK === 'REGULER'
                    ? 'blue-darken-1'
                    : 'purple-darken-1'
                "
                size="x-small"
                variant="flat"
              >
                {{ item.Tipe_SPK }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <div class="text-center">
                <v-btn
                  color="indigo"
                  size="x-small"
                  @click.stop="selectSPK(item as SPKSublimItem)"
                  variant="flat"
                >
                  Pilih
                </v-btn>
              </div>
            </template>

            <template #no-data>
              <div class="text-center pa-4">
                Tidak ada SPK aktif dengan berkas Realisasi Bahan Gudang yang
                ditemukan.
              </div>
            </template>

            <template #loading>
              <v-progress-linear
                indeterminate
                color="indigo"
              ></v-progress-linear>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions class="d-flex justify-end border-top pa-3">
          <v-btn
            @click="emit('close')"
            color="secondary"
            variant="outlined"
            size="small"
            >Batal</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sub-Dialog Sublim untuk Pemilihan Per Komponen -->
    <v-dialog v-model="componentDialog" max-width="500px" scrollable>
      <v-card border>
        <v-card-title
          class="bg-indigo-darken-3 text-white text-subtitle-1 pa-2"
        >
          Pilih Komponen untuk SPK [{{ selectedSPKNo }}]
          <span v-if="selectedSize"> Size ({{ selectedSize }})</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-list density="compact" nav>
            <v-list-item
              v-for="(comp, idx) in filteredComponents"
              :key="idx"
              @click="confirmComponentSelect(comp)"
              class="border-bottom text-body-2 pa-2"
            >
              <template v-slot:prepend>
                <v-icon color="indigo-darken-4">mdi-package-variant</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ getKomponenName(comp, idx) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Kode: {{ getKomponenKode(comp) }} | Qty:
                {{ comp.Qty_Order || comp.poid_jumlah || 0 }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-4 pa-2">
          <v-spacer />
          <v-btn size="small" variant="text" @click="componentDialog = false"
            >Batal</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { AxiosError } from "axios";
import api from "@/services/api";
import { useToast } from "vue-toastification";

interface SPKSublimItem {
  SPK: string;
  Nama: string;
  Tanggal: string;
  Qty_Order: number;
  Nama_Bahan_Rencana: string;
  Tipe_SPK: string;
  Divisi: string;
  Nomor_Realisasi: string;
  Barang_ID: string;
  Nama_Bahan_Realisasi: string;
  Bahan_Awal: number;
  Size?: string;
  poid_size?: string;
  Nama_Komponen?: string;
  nama_komponen?: string;
  Kode_Komponen?: string;
  poid_bhn_kode?: string;
  poid_jumlah?: number;
  [key: string]: any;
}

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", payload: { mode: string; data: any[] }): void;
}>();

const toast = useToast();

const API_URL = "/mmt/SPK/lookup-sublim";
const SPKList = ref<SPKSublimItem[]>([]);
const searchKeyword = ref("");
const loading = ref(false);
const extractMode = ref<"SET" | "KOMPONEN">("SET");

const componentDialog = ref(false);
const filteredComponents = ref<SPKSublimItem[]>([]);
const selectedSPKNo = ref("");
const selectedSize = ref("");

const headers = [
  { title: "Nomor SPK", key: "SPK", width: "150px" },
  { title: "No. Realisasi Gudang", key: "Nomor_Realisasi", width: "150px" },
  { title: "Nama Order / Pelanggan", key: "Nama", width: "250px" },
  { title: "Bahan Realisasi", key: "Nama_Bahan_Realisasi", width: "200px" },
  {
    title: "Bahan Awal (Gudang)",
    key: "Bahan_Awal",
    width: "120px",
    align: "end" as const,
  },
  {
    title: "Target Qty",
    key: "Qty_Order",
    width: "100px",
    align: "end" as const,
  },
  { title: "Tanggal SPK", key: "Tanggal", width: "110px" },
  { title: "Jenis", key: "Tipe_SPK", width: "90px", align: "center" as const },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "80px",
    align: "center" as const,
  },
];

const groupedItems = computed(() => {
  const seen = new Set();
  return SPKList.value.filter((item) => {
    const itemSize = item.Size || item.poid_size || "";
    const duplicateKey = `${item.SPK}_${itemSize}`;
    if (seen.has(duplicateKey)) {
      return false;
    }
    seen.add(duplicateKey);
    return true;
  });
});

// --- Helper Tampilan Label Sub-Dialog Komponen ---
// --- Helper Tampilan Label Sub-Dialog Komponen ---
const getKomponenName = (comp: SPKSublimItem, idx: number) => {
  // 1. Prioritas Utama: Nama Bahan dari tabel tbahan (Bhn_Name / bhn_name)
  if (comp.Bhn_Name && comp.Bhn_Name.trim() !== "") return comp.Bhn_Name;
  if (comp.bhn_name && comp.bhn_name.trim() !== "") return comp.bhn_name;

  // 2. Prioritas Kedua: Alias Nama_Komponen / nama_komponen
  if (comp.Nama_Komponen && comp.Nama_Komponen.trim() !== "")
    return comp.Nama_Komponen;
  if (comp.nama_komponen && comp.nama_komponen.trim() !== "")
    return comp.nama_komponen;

  // 3. Prioritas Ketiga: sk_nama atau Nama Bahan SPK
  if (comp.sk_nama && comp.sk_nama.trim() !== "") return comp.sk_nama;
  if (comp.Nama_Bahan && comp.Nama_Bahan.trim() !== "") return comp.Nama_Bahan;

  // 4. Fallback ke Kode jika Nama tidak ditemukan
  if (comp.Kode_Komponen && comp.Kode_Komponen.trim() !== "")
    return comp.Kode_Komponen;
  if (comp.sk_kode && comp.sk_kode.trim() !== "") return comp.sk_kode;

  // 5. Fallback Terakhir
  return `Komponen Bagian ${idx + 1}`;
};

const getKomponenKode = (comp: SPKSublimItem) => {
  return (
    comp.Kode_Komponen ||
    comp.poid_bhn_kode ||
    comp.sk_kode ||
    comp.Barang_ID ||
    "-"
  );
};

// --- Helper Pemeta Payload Komplit untuk Form Utama Parent ---
const createMappedPayload = (
  item: SPKSublimItem,
  isSetMode = false,
  compItem?: SPKSublimItem,
) => {
  const targetComp = compItem || item;
  const spkNo = item.SPK || item.spk_nomor || "";
  const spkNama = item.Nama || item.spk_nama || "";

  const compName = isSetMode ? "ALL SET" : getKomponenName(targetComp, 0);

  const compKode = isSetMode ? "ALL SET" : getKomponenKode(targetComp);

  return {
    ...item,
    ...targetComp,

    // Aliasing Lengkap Nomor SPK & PO Internal
    SPK: spkNo,
    Spk: spkNo,
    spk_nomor: spkNo,
    poi_spk_nomor: spkNo,
    poi_nomor: item.PO || item.poi_nomor || spkNo,

    // Aliasing Lengkap Nama SPK / Pekerjaan
    Nama: spkNama,
    spk_nama: spkNama,
    nama_pekerjaan: spkNama,

    // Aliasing Size
    Size: item.Size || item.poid_size || "-",
    poi_size: item.Size || item.poid_size || "-",
    poid_size: item.Size || item.poid_size || "-",

    // Aliasing Komponen
    Nama_Komponen: compName,
    nama_komponen: compName,
    Kode_Komponen: compKode,
    poid_bhn_kode: compKode,

    // Data Realisasi Bahan Gudang
    Nama_Bahan: item.Nama_Bahan_Realisasi || item.Nama_Bahan_Rencana || "-",
    Barang_ID: item.Barang_ID || "-",
    Nomor_Realisasi: item.Nomor_Realisasi || "-",
    Bahan_Awal: item.Bahan_Awal || 0,
  };
};

const fetchSPKData = async () => {
  loading.value = true;
  try {
    const response = await api.get<{ success: boolean; data: SPKSublimItem[] }>(
      API_URL,
      {
        params: { keyword: searchKeyword.value },
      },
    );

    SPKList.value = response.data.data || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Fetch SPK Sublim Error:", err);
    toast.error(
      "Gagal memuat antrean SPK Sublim. Periksa koneksi server database.",
    );
    SPKList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (
  _event: MouseEvent,
  { item }: { item: SPKSublimItem },
) => {
  selectSPK(item);
};

const selectSPK = (item: SPKSublimItem) => {
  if (!item.SPK) {
    toast.error("Error: Struktur data nomor SPK rusak.");
    return;
  }

  if (item.Nomor_Realisasi === "-") {
    toast.warning(
      `Peringatan: SPK ${item.SPK} belum diproses realisasi bahan oleh gudang.`,
    );
  }

  const currentSize = item.Size || item.poid_size || "";

  const komponenTerkait = SPKList.value.filter(
    (data) =>
      data.SPK === item.SPK &&
      (data.Size || data.poid_size || "") === currentSize,
  );

  if (extractMode.value === "SET") {
    const baseItem = komponenTerkait.length > 0 ? komponenTerkait[0] : item;
    const rowPerSet = createMappedPayload(baseItem, true);

    emit("select", { mode: "SET", data: [rowPerSet] });
    emit("close");
  } else {
    selectedSPKNo.value = item.SPK;
    selectedSize.value = currentSize;
    filteredComponents.value =
      komponenTerkait.length > 0 ? komponenTerkait : [item];
    componentDialog.value = true;
  }
};

const confirmComponentSelect = (componentItem: SPKSublimItem) => {
  const mappedComponent = createMappedPayload(
    componentItem,
    false,
    componentItem,
  );

  emit("select", { mode: "KOMPONEN", data: [mappedComponent] });
  componentDialog.value = false;
  emit("close");
};

const handleDoubleClick = (
  _event: MouseEvent,
  { item }: { item: SPKSublimItem },
) => {
  selectSPK(item);
};

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      searchKeyword.value = "";
      fetchSPKData();
    } else {
      SPKList.value = [];
    }
  },
  { immediate: false },
);
</script>

<style scoped>
.dialog-card {
  font-size: 13px;
}
.border-top {
  border-top: 1px solid #e0e0e0;
}
.desktop-table {
  font-size: 12px;
}
.desktop-table :deep(td),
.desktop-table :deep(th) {
  padding: 0 8px !important;
  height: 36px !important;
}
.desktop-table :deep(thead th) {
  background-color: #f8f9fa !important;
  font-weight: bold;
  color: #2c3e50 !important;
}
.color-spk {
  color: #1a237e;
}

.spk-modal-mode :deep(.v-label) {
  color: #ffffff !important;
  font-size: 13px !important;
  font-weight: bold !important;
  opacity: 1 !important;
}

.clickable-row :deep(tbody tr):hover {
  cursor: pointer !important;
  background-color: #edf2f7 !important;
}
.clickable-row :deep(tbody tr):active {
  background-color: #e2e8f0 !important;
}
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.flex-grow-1 {
  height: 100%;
}
</style>
