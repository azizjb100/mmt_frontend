<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();
const API_MUTASI_INTERNAL = "/mmt/mutasi-internal";

const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref([]);
const expanded = ref([]);
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center",
    fixed: true,
  },
  { title: "No. Mutasi", key: "Nomor_Mutasi", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Asal", key: "Bagian_Asal", minWidth: "100px", align: "center" },
  { title: "Tujuan", key: "Bagian_Tujuan", minWidth: "160px", align: "center" },
  {
    title: "Total Qty Item",
    key: "Total_Qty",
    minWidth: "110px",
    align: "end",
  },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
];

const detailHeaders = [
  { title: "No. SPK", key: "Nomor_SPK", minWidth: "130px", fixed: true },
  { title: "PO Internal", key: "No_PO_Internal", minWidth: "140px" },
  { title: "Size", key: "Size", minWidth: "80px" },
  { title: "Nama Order", key: "Nama_SPK", minWidth: "200px" },
  { title: "Komponen", key: "Nama_Komponen", minWidth: "130px" },
  { title: "Qty Mutasi", key: "Qty_Mutasi", minWidth: "100px", align: "end" },
];

// Helper parsing tanggal jika data dari database bertipe string custom
const parseCustomDate = (dateString: any): Date | null => {
  if (!dateString) return null;

  // Jika data ternyata sudah berupa objek Date, langsung kembalikan
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }

  // Konversi ke string jika bertipe data lain (misal number/timestamp)
  const str = String(dateString).trim();
  if (!str) return null;

  // 1. Cek jika formatnya adalah kustom bawaan database (misal: "14-Jul-2026" atau "14-07-2026")
  const parts = str.split("-");
  if (parts.length === 3) {
    const day = Number(parts[0]);
    const year = Number(parts[2]);

    // Validasi struktur angka hari dan tahun dasar
    if (!isNaN(day) && !isNaN(year) && year > 1000) {
      let month = isNaN(Number(parts[1]))
        ? [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
          ].indexOf(parts[1].toLowerCase().substring(0, 3))
        : Number(parts[1]) - 1;

      if (month >= 0 && month <= 11) {
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
  }

  // 2. Fallback jika string adalah ISO Standard (misal: "2026-07-14") atau format bawaan Javascript
  const fallbackDate = new Date(str);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  // Jika semua metode gagal, kembalikan null agar tidak crash di date-fns
  return null;
};

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(API_MUTASI_INTERNAL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat data utama mutasi internal.");
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor_Mutasi : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(
      `${API_MUTASI_INTERNAL}/detail/${encodeURIComponent(lastExpandedNomor)}`,
    );
    const resData = response.data?.data ?? response.data;
    details.value[lastExpandedNomor] = resData || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "MutasiInternalMMTNew" });
  } else if (selected.value[0]?.Nomor_Mutasi) {
    router.push({
      name: "MutasiInternalMMTEdit",
      params: { nomor: selected.value[0].Nomor_Mutasi },
    });
  }
};

const handleDelete = async () => {
  const nomor = selected.value[0]?.Nomor_Mutasi;
  if (
    !nomor ||
    !confirm(
      `Apakah Anda yakin ingin menghapus dokumen mutasi ${nomor}? Sisa stok bagian tujuan akan dikembalikan ke Sublim.`,
    )
  )
    return;
  try {
    await api.delete(`${API_MUTASI_INTERNAL}/${nomor}`);
    toast.success("Dokumen mutasi berhasil dihapus!");
    fetchData();
  } catch (e: any) {
    toast.error("Gagal menghapus data mutasi.");
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some(
    (s: any) => s.Nomor_Mutasi === row.item.Nomor_Mutasi,
  )
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s: any) => s.Nomor_Mutasi === item.Nomor_Mutasi)
    ? "row-selected"
    : "",
});

const getBagianNama = (kode: string) => {
  if (!kode) return "SUBLIM";
  const k = kode.toUpperCase();
  switch (k) {
    case "PTG":
    case "GP001":
      return "SUBLIM";
    case "JHT":
    case "GJ001":
      return "JAHIT / SEWING";
    case "FIN":
    case "GF001":
      return "FINISHING / QC";
    case "GGD":
    case "GB001":
      return "POTONG / CUTTING";
    default:
      return k;
  }
};

// Mengubah warna menjadi kategori netral (Grayscale/Slate)
const getBagianColor = (kode: string) => {
  if (!kode) return "grey-darken-1";
  const k = kode.toUpperCase();
  switch (k) {
    case "PTG":
    case "GP001":
      return "grey-darken-3"; // Abu-abu gelap untuk bagian produksi utama
    case "SUBLIM":
      return "grey-darken-1"; // Abu-abu sedang
    default:
      return "grey-darken-2";
  }
};

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Mutasi Internal (Ex Sublim)"
    icon="mdi-vector-arrange-redirect"
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
    @action:delete="handleDelete"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #item.Nomor_Mutasi="{ value }">
      <div
        class="d-flex align-center font-weight-medium text-blue-grey-darken-4"
      >
        <v-icon size="16" class="mr-2 text-grey-darken-1"
          >mdi-file-document-outline</v-icon
        >
        <span class="hover-underline">{{ value }}</span>
      </div>
    </template>

    <template #item.Tanggal="{ value }">
      <div class="d-flex align-center text-body-2 text-grey-darken-2">
        <v-icon size="14" class="mr-2 text-grey-lighten-1">mdi-calendar</v-icon>
        {{
          parseCustomDate(value)
            ? format(parseCustomDate(value)!, "dd/MM/yyyy")
            : value || "-"
        }}
      </div>
    </template>

    <template #item.Bagian_Asal="{ value }">
      <v-chip
        size="small"
        :color="getBagianColor(value)"
        variant="outlined"
        class="font-weight-medium rounded px-2 text-caption border-opacity-50"
      >
        {{ getBagianNama(value) }}
      </v-chip>
    </template>

    <template #item.Bagian_Tujuan="{ value }">
      <v-chip
        size="small"
        :color="getBagianColor(value)"
        variant="tonal"
        class="font-weight-medium rounded px-2 text-caption"
      >
        {{ getBagianNama(value) }}
      </v-chip>
    </template>

    <template #item.Total_Qty="{ value }">
      <div
        :class="
          Number(value) > 0
            ? 'text-grey-darken-4 font-weight-bold'
            : 'text-grey-lighten-1'
        "
        class="text-right pr-2 text-body-2"
      >
        {{ Number(value || 0).toLocaleString("id-ID") }}
      </div>
    </template>

    <template #item.Keterangan="{ value }">
      <span class="text-caption text-grey-darken-1">
        {{ value || "—" }}
      </span>
    </template>

    <template #expanded-content="{ item }">
      <div class="expanded-wrapper pa-4 bg-grey-lighten-5">
        <div
          v-if="isLoadingDetails(item.Nomor_Mutasi)"
          class="text-center pa-3"
        >
          <v-progress-circular
            indeterminate
            size="20"
            color="grey-darken-3"
            class="mr-2"
          />
          <span class="text-caption text-grey">Memuat detail...</span>
        </div>

        <div
          v-else-if="
            !details[item.Nomor_Mutasi] ||
            details[item.Nomor_Mutasi].length === 0
          "
          class="text-center pa-3 text-caption text-grey minimal-border-dashed"
        >
          Tidak ada data detail.
        </div>

        <v-card
          v-else
          variant="outlined"
          class="bg-white rounded border-grey-lighten-2"
        >
          <v-data-table
            :headers="detailHeaders"
            :items="details[item.Nomor_Mutasi]"
            density="compact"
            :items-per-page="-1"
            hide-default-footer
            class="minimal-detail-table"
          >
            <template #[`item.Nomor_SPK`]="{ item: d }">
              <span class="text-grey-darken-3 font-weight-medium">{{
                d.Nomor_SPK
              }}</span>
            </template>

            <template #[`item.Nama_Komponen`]="{ item: d }">
              <v-chip
                size="x-small"
                variant="outlined"
                color="grey-darken-2"
                class="font-weight-medium rounded-sm"
              >
                {{ d.Nama_Komponen || "ALL SET" }}
              </v-chip>
            </template>

            <template #[`item.Qty_Mutasi`]="{ item: d }">
              <div
                class="text-right font-weight-bold text-grey-darken-4 text-body-2"
              >
                {{ Number(d.Qty_Mutasi || 0).toLocaleString("id-ID") }}
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </template>
  </BaseBrowse>
</template>

<style scoped>
/* Warna highlight baris yang dipilih: Abu-abu super lembut */
.row-selected {
  background-color: #f1f3f5 !important;
}
:deep(.row-selected td) {
  background-color: #f1f3f5 !important;
}

/* Hover effect minimalis */
:deep(.v-data-table__tr:hover) {
  background-color: #fafbfc !important;
  cursor: pointer;
}

/* Dekorasi text link tipis pada Nomor Mutasi saat di-hover */
.hover-underline:hover {
  text-decoration: underline;
  color: #1a73e8; /* Sedikit aksen interaktif saat diarahkan mouse */
}

/* Pembungkus area detail */
.expanded-wrapper {
  border-left: 3px solid #757575; /* Aksen garis abu-abu kokoh di sebelah kiri */
}

.minimal-border-dashed {
  border: 1px dashed #e0e0e0;
}

/* Menghilangkan border internal berlebih di tabel detail */
.minimal-detail-table :deep(th) {
  background-color: #f8f9fa !important;
  font-weight: 600 !important;
  color: #495057 !important;
}
</style>
