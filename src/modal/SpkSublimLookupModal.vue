<template>
  <div>
    <!-- Dialog Utama Lookup SPK Sublim (Bersih dari pilihan mode di atas) -->
    <v-dialog
      :model-value="isVisible"
      @update:modelValue="emit('close')"
      max-width="1100px"
      persistent
    >
      <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
        <!-- Header Toolbar -->
        <v-toolbar color="indigo-darken-2" density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            🔥 Pencarian SPK & Realisasi Bahan (Khusus Sublimasi)
          </v-toolbar-title>
          <v-spacer></v-spacer>
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
                  @click.stop="openComponentDialog(item as SPKSublimItem)"
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

    <!-- Sub-Dialog Pemilihan Mode & Ceklist Komponen (Muncul Setelah Klik SPK) -->
    <v-dialog v-model="componentDialog" max-width="550px" scrollable>
      <v-card border>
        <v-card-title
          class="bg-indigo-darken-3 text-white text-subtitle-1 pa-3 d-flex justify-space-between align-center"
        >
          <div>
            Pilih Komponen SPK [{{ selectedSPKNo }}]
            <span v-if="selectedSize" class="text-caption">
              | Size: ({{ selectedSize }})</span
            >
          </div>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Pilihan Mode Pengambilan -->
          <v-radio-group
            v-model="extractMode"
            inline
            density="compact"
            class="mb-3"
            hide-details
          >
            <v-radio
              label="Ambil Semua Set (Semua Komponen)"
              value="SET"
              color="indigo-darken-3"
            ></v-radio>
            <v-radio
              label="Pilih Komponen Tertentu (Multi-Select)"
              value="KOMPONEN"
              color="indigo-darken-3"
            ></v-radio>
          </v-radio-group>

          <v-divider class="mb-3"></v-divider>

          <!-- Daftar Checkbox Komponen (Aktif jika mode KOMPONEN dipilih) -->
          <div v-if="extractMode === 'KOMPONEN'">
            <div class="text-caption text-grey-darken-1 mb-2">
              Centang komponen (misal: badan depan, badan belakang, lengan)
              untuk digabung jadi 1 sub set:
            </div>
            <v-list
              density="compact"
              class="border rounded bg-grey-lighten-5"
              style="max-height: 250px; overflow-y: auto"
            >
              <v-list-item
                v-for="(comp, idx) in filteredComponents"
                :key="idx"
                class="border-bottom"
              >
                <template v-slot:prepend>
                  <v-checkbox-btn
                    v-model="selectedComponentKeys"
                    :value="
                      getKomponenKode(comp) + '_' + getKomponenName(comp, idx)
                    "
                    color="indigo-darken-3"
                    class="mr-2"
                  ></v-checkbox-btn>
                </template>
                <v-list-item-title class="font-weight-bold text-body-2">
                  {{ getKomponenName(comp, idx) }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Kode: {{ getKomponenKode(comp) }} | Qty:
                  {{ comp.Qty_Order || comp.poid_jumlah || 0 }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>

          <div
            v-else
            class="text-body-2 text-grey-darken-2 pa-4 bg-grey-lighten-4 rounded text-center"
          >
            Semua komponen dalam SPK ini akan diambil secara utuh sebagai satu
            kesatuan set.
          </div>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4 pa-3">
          <v-btn size="small" variant="text" @click="componentDialog = false"
            >Batal</v-btn
          >
          <v-spacer />
          <v-btn
            size="small"
            color="indigo-darken-3"
            variant="flat"
            @click="confirmSelection"
          >
            Konfirmasi & Pilih
          </v-btn>
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

// State Sub-Dialog
const componentDialog = ref(false);
const extractMode = ref<"SET" | "KOMPONEN">("SET");
const filteredComponents = ref<SPKSublimItem[]>([]);
const selectedComponentKeys = ref<string[]>([]);
const selectedSPKNo = ref("");
const selectedSize = ref("");
const activeRowItem = ref<SPKSublimItem | null>(null);

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

const getKomponenName = (comp: SPKSublimItem, idx: number) => {
  if (comp.Bhn_Name && comp.Bhn_Name.trim() !== "") return comp.Bhn_Name;
  if (comp.bhn_name && comp.bhn_name.trim() !== "") return comp.bhn_name;
  if (comp.Nama_Komponen && comp.Nama_Komponen.trim() !== "")
    return comp.Nama_Komponen;
  if (comp.nama_komponen && comp.nama_komponen.trim() !== "")
    return comp.nama_komponen;
  if (comp.sk_nama && comp.sk_nama.trim() !== "") return comp.sk_nama;
  if (comp.Kode_Komponen && comp.Kode_Komponen.trim() !== "")
    return comp.Kode_Komponen;
  if (comp.sk_kode && comp.sk_kode.trim() !== "") return comp.sk_kode;
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
    SPK: spkNo,
    Spk: spkNo,
    spk_nomor: spkNo,
    poi_spk_nomor: spkNo,
    poi_nomor: item.PO || item.poi_nomor || spkNo,
    Nama: spkNama,
    spk_nama: spkNama,
    nama_pekerjaan: spkNama,
    Size: item.Size || item.poid_size || "-",
    poi_size: item.Size || item.poid_size || "-",
    poid_size: item.Size || item.poid_size || "-",
    Nama_Komponen: compName,
    nama_komponen: compName,
    Kode_Komponen: compKode,
    poid_bhn_kode: compKode,
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
  openComponentDialog(item);
};

const handleDoubleClick = (
  _event: MouseEvent,
  { item }: { item: SPKSublimItem },
) => {
  openComponentDialog(item);
};

const openComponentDialog = (item: SPKSublimItem) => {
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

  activeRowItem.value = item;
  selectedSPKNo.value = item.SPK;
  selectedSize.value = currentSize;
  filteredComponents.value =
    komponenTerkait.length > 0 ? komponenTerkait : [item];

  // Default reset ke SET dan kosongkan ceklist
  extractMode.value = "SET";
  selectedComponentKeys.value = [];

  componentDialog.value = true;
};

const confirmSelection = () => {
  if (!activeRowItem.value) return;

  if (extractMode.value === "SET") {
    const baseItem =
      filteredComponents.value.length > 0
        ? filteredComponents.value[0]
        : activeRowItem.value;
    const rowPerSet = createMappedPayload(baseItem, true);
    rowPerSet.multiplier = 1;

    emit("select", { mode: "SET", data: [rowPerSet] });
    componentDialog.value = false;
    emit("close");
  } else {
    // Mode Komponen (Multi-select)
    if (selectedComponentKeys.value.length === 0) {
      toast.warning("Pilih minimal satu komponen terlebih dahulu.");
      return;
    }

    // Ambil semua komponen yang dicentang
    const selectedItemsData = filteredComponents.value.filter((comp, idx) => {
      const uniqueKey =
        getKomponenKode(comp) + "_" + getKomponenName(comp, idx);
      return selectedComponentKeys.value.includes(uniqueKey);
    });

    // 🌟 1. GABUNGKAN NAMA KOMPONEN MENJADI SATU STRING (Contoh: "BADAN DEPAN + BADAN BELAKANG")
    const gabungNamaKomponen = selectedItemsData
      .map((comp, idx) => getKomponenName(comp, idx))
      .join(" + ");

    // 🌟 2. GABUNGKAN KODE KOMPONEN
    const gabungKodeKomponen = selectedItemsData
      .map((comp) => getKomponenKode(comp))
      .join(",");

    // Ambil referensi dari item pertama
    const baseItem = selectedItemsData[0];
    const mappedPayload = createMappedPayload(
      activeRowItem.value!,
      false,
      baseItem,
    );

    // Timpa dengan data gabungan agar hanya menjadi 1 baris di tabel utama
    mappedPayload.Nama_Komponen = gabungNamaKomponen;
    mappedPayload.nama_komponen = gabungNamaKomponen;
    mappedPayload.Kode_Komponen = gabungKodeKomponen;
    mappedPayload.poid_bhn_kode = gabungKodeKomponen;

    // Set default multiplier/porsi awal (bisa diubah fleksibel di form utama)
    mappedPayload.multiplier = 1;

    // 🌟 3. EMIT SEBAGAI ARRAY BERISI 1 ITEM SAJA (1 Baris)
    emit("select", { mode: "KOMPONEN", data: [mappedPayload] });
    componentDialog.value = false;
    emit("close");
  }
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
