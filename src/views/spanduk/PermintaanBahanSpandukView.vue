<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();
const API_MINTA_GARMEN = "/spanduk/permintaan-bahan";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

// Filter Khusus Permintaan Garmen (Delphi: GroupBox1 & cbCab)
const selectedJenis = ref<"ACCESORIES" | "OBAT" | "SPAREPART" | "ATK/RTK">(
  "ACCESORIES",
);
const selectedCabang = ref<string>("ALL");

// Pilihan Cabang (Delphi: FormCreate)
const cabangOptions = ref(["P01", "P02", "P03", "P04", "P05", "HO-", "ALL"]);

// Default tanggal 30 hari ke belakang
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers Master Grid (Disesuaikan Dinamis Berdasarkan Jenis Barang) ---
const masterHeaders = computed(() => {
  const headers = [
    {
      title: "Detail",
      key: "data-table-expand",
      minWidth: "60px",
      align: "center",
      fixed: true,
    },
    { title: "Nomor Dokumen", key: "Nomor", minWidth: "150px", fixed: true },
    { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
    { title: "Jam", key: "Jam", minWidth: "100px" },
    { title: "Cabang", key: "Cab", minWidth: "100px" },
    { title: "Gudang Peminta", key: "GdgPeminta", minWidth: "180px" },
  ];

  // Kondisi Delphi: jika ACCESORIES munculkan Divisi, SPK, dst.
  if (selectedJenis.value === "ACCESORIES") {
    headers.push(
      { title: "Divisi", key: "Divisi", minWidth: "130px" },
      { title: "No. SPK", key: "SPK", minWidth: "130px" },
      { title: "Nama SPK", key: "NamaSpk", minWidth: "180px" },
      { title: "Jumlah SPK", key: "JmlSpk", minWidth: "110px", align: "end" },
    );
  } else if (selectedJenis.value === "SPAREPART") {
    headers.push({ title: "Bagian", key: "Bagian", minWidth: "130px" });
  }

  headers.push(
    { title: "Keterangan", key: "Keterangan", minWidth: "220px" },
    { title: "Status", key: "Status", minWidth: "100px", align: "center" },
    { title: "Approve", key: "Approve", minWidth: "100px", align: "center" },
    { title: "User", key: "Usr", minWidth: "120px" },
  );

  return headers as any[];
});

// --- Headers Detail Grid (SQLDetail Delphi) ---
const detailHeaders = [
  { title: "Kode Barang", key: "Kode", minWidth: "120px", fixed: true },
  { title: "Nama Barang", key: "Nama", minWidth: "280px" },
  { title: "Satuan", key: "Satuan", minWidth: "90px" },
  { title: "Qty Diminta", key: "Jumlah", minWidth: "110px", align: "end" },
  { title: "Qty Realisasi", key: "Realisasi", minWidth: "110px", align: "end" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
];

const parseBackendDate = (dateString: string): Date | null => {
  return dateString ? new Date(dateString) : null;
};

// --- Fetch Data Master ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_MINTA_GARMEN}/browse`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        jenis: selectedJenis.value,
        cab: selectedCabang.value,
      },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat data permintaan garmen.");
  } finally {
    loading.value = false;
  }
};

// --- Fetch & Handle Expand Detail Item ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const foundMaster = masterData.value.find(
      (m) => m.Nomor === lastExpandedNomor,
    );
    details.value[lastExpandedNomor] = foundMaster?.Detail || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Redirect Router ---
const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({
      name: "MintaGarmenNew",
      query: { jenis: selectedJenis.value },
    });
  } else {
    const selectedRow = selected.value[0];
    if (!selectedRow?.Nomor) {
      toast.warning("Silahkan pilih satu baris data terlebih dahulu.");
      return;
    }
    router.push({
      name: "MintaGarmenEdit",
      params: { nomor: selectedRow.Nomor },
    });
  }
};

// --- Event Row Clicks & Delphi Dynamic Row Coloring ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData?.Nomor) return;

  selected.value = selected.value.some((s: any) => s.Nomor === itemData.Nomor)
    ? []
    : [itemData];
};

// Implementasi Pewarnaan Row berdasarkan Status dokumen (Delphi: cxGrdMasterCustomDrawCell)
const getRowProps = ({ item }: any) => {
  const data = item?.raw || item;
  let customClass = "cursor-pointer ";

  if (selected.value.some((s: any) => s.Nomor === data?.Nomor)) {
    customClass += "row-selected";
  } else if (data?.Status === "OPEN") {
    customClass += "text-red-custom font-weight-bold"; // Status OPEN berwarna merah
  } else if (data?.Status === "PROSES") {
    customClass += "text-blue-custom"; // Status PROSES berwarna biru
  }

  return { class: customClass };
};

// --- Menentukan Warna Cell Berdasarkan Status Approval / PIN (Ngedit) ---
const getCellBgColor = (item: any, columnKey: string) => {
  // 1. Logika Warna Kolom Nomor berdasarkan Pin Pengajuan Edit (Ngedit)
  if (columnKey === "Nomor") {
    if (item.Ngedit === "WAIT") return "bg-blue text-white";
    if (item.Ngedit === "TOLAK") return "bg-red text-white";
    if (item.Ngedit === "ACC") return "bg-green text-white";
  }
  // 2. Logika Warna Kolom Approve jika Belum Terealisasi Sepenuhnya (Approve = 'N')
  if (columnKey === "Approve" && item.Approve === "N") {
    return "bg-yellow";
  }
  return "";
};

// Trigger reload data saat filter radio button atau combo box berubah
watch([startDate, endDate, selectedJenis, selectedCabang], fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="pa-4 bg-grey-lighten-4">
    <!-- Panel Filter Atas (Meniru Form Delphi) -->
    <v-card class="mb-4 pa-4" outlined>
      <v-row dense align="center">
        <!-- Radio Button Jenis Barang (Delphi GroupBox1) -->
        <v-col cols="12" md="6" class="d-flex align-center flex-wrap gap-2">
          <span class="text-subtitle-2 mr-3 font-weight-bold">Kategori:</span>
          <v-radio-group
            v-model="selectedJenis"
            inline
            hide-details
            class="mt-0"
          >
            <v-radio
              label="Accessories"
              value="ACCESORIES"
              color="primary"
            ></v-radio>
            <v-radio label="Obat" value="OBAT" color="primary"></v-radio>
            <v-radio
              label="Sparepart"
              value="SPAREPART"
              color="primary"
            ></v-radio>
            <v-radio
              label="ATK / RTK"
              value="ATK/RTK"
              color="primary"
            ></v-radio>
          </v-radio-group>
        </v-col>

        <!-- ComboBox Cabang (Delphi cbCab) -->
        <v-col cols="12" md="4" class="d-flex align-center">
          <span class="text-subtitle-2 mr-3 font-weight-bold">Cabang:</span>
          <v-select
            v-model="selectedCabang"
            :items="cabangOptions"
            density="compact"
            hide-details
            outlined
            class="max-width-select"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <!-- Component Utama Grid Browse -->
    <BaseBrowse
      title="Browse Permintaan Garmen"
      icon="mdi-text-box-search-outline"
      :headers="masterHeaders"
      :items="masterData"
      :loading="loading"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:selected="selected"
      v-model:expanded="expanded"
      @refresh="fetchData"
      @action:new="actionSaveRedirect('new')"
      @action:edit="actionSaveRedirect('edit')"
      @row-click="handleRowClick"
      :row-props="getRowProps"
      @update:expanded="handleExpandUpdate(expanded)"
    >
      <!-- Custom Rendering dengan Logika Warna Delphi -->
      <template #item="{ item, columns }">
        <tr
          :class="getRowProps({ item }).class"
          @click="handleRowClick($event, item)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[
              col.align ? `text-${col.align}` : '',
              getCellBgColor(item, col.key),
            ]"
          >
            <!-- Handle Kolom Expand Tombol -->
            <span v-if="col.key === 'data-table-expand'">
              <v-btn
                icon
                variant="text"
                size="small"
                @click.stop="
                  () => {
                    const idx = expanded.indexOf(item);
                    if (idx > -1) expanded.splice(idx, 1);
                    else expanded.push(item);
                  }
                "
              >
                <v-icon>{{
                  expanded.includes(item)
                    ? "mdi-chevron-up"
                    : "mdi-chevron-down"
                }}</v-icon>
              </v-btn>
            </span>

            <!-- Format Tanggal -->
            <span v-else-if="col.key === 'Tanggal'">
              {{
                item.Tanggal
                  ? format(parseBackendDate(item.Tanggal)!, "dd/MM/yyyy")
                  : ""
              }}
            </span>

            <!-- Format Angka Nominal Jumlah SPK -->
            <span v-else-if="col.key === 'JmlSpk'">
              {{ Number(item.JmlSpk || 0).toLocaleString("id-ID") }}
            </span>

            <!-- Default Text -->
            <span v-else>{{ item[col.key] }}</span>
          </td>
        </tr>
      </template>

      <!-- Sub-grid Detail Expand -->
      <template #expanded-content="{ item }">
        <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-3">
          <v-progress-circular
            indeterminate
            size="24"
            color="primary"
            class="mr-2"
          />
          <span class="text-caption">Memuat data item garmen...</span>
        </div>

        <div
          v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
          class="text-center pa-3 text-caption text-grey"
        >
          Tidak ada data item detail untuk nomor {{ item.Nomor }}
        </div>

        <div v-else class="pa-3 bg-white border-sm">
          <div class="text-subtitle-2 mb-2 font-weight-bold text-primary">
            Rincian Barang Realisasi
          </div>
          <v-data-table
            :headers="detailHeaders"
            :items="details[item.Nomor]"
            density="compact"
            :items-per-page="-1"
            hide-default-footer
          >
            <template #[`item.Jumlah`]="{ item: d }">
              <span class="font-weight-bold">{{
                Number(d.Jumlah || 0).toLocaleString("id-ID")
              }}</span>
            </template>
            <template #[`item.Realisasi`]="{ item: d }">
              <span class="font-weight-bold text-success">{{
                Number(d.Realisasi || 0).toLocaleString("id-ID")
              }}</span>
            </template>
          </v-data-table>
        </div>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.max-width-select {
  max-width: 150px;
}
.gap-2 {
  gap: 8px;
}

/* Custom Warna Status Sesuai Kode Delphi */
.text-red-custom,
.text-red-custom td {
  color: #d32f2f !important;
}
.text-blue-custom,
.text-blue-custom td {
  color: #1976d2 !important;
}

/* Background Highlight State */
.bg-yellow {
  background-color: #fff59d !important; /* clYellow */
}
.bg-blue {
  background-color: #1976d2 !important; /* clblue */
}
.bg-red {
  background-color: #d32f2f !important; /* clred */
}
.bg-green {
  background-color: #388e3c !important; /* clgreen */
}

.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
  color: #000000 !important;
}
</style>
