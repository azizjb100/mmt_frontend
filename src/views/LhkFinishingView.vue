<template>
 <PageLayout title="LHK Finishing MMT" icon="mdi-printer-3d">
  <template #header-actions>
            <v-btn size="small" color="success" @click="handleNewEdit('new')">
                <v-icon start>mdi-plus</v-icon> Baru
            </v-btn>
            <v-btn
                size="small"
                color="warning"
                :disabled="!isSingleSelected"
                @click="handleEditClick"
            >
                <v-icon start>mdi-pencil</v-icon> Ubah
            </v-btn>
            <v-btn
                size="small"
                color="error"
                :disabled="!isSingleSelected"
                @click="handleDelete"
            >
                <v-icon start>mdi-trash-can</v-icon> Hapus
            </v-btn>

            <v-divider vertical class="mx-2" />

            <v-btn
                size="small"
                color="info"
                :disabled="!isSingleSelected"
                @click="handlePrint"
            >
                <v-icon start>mdi-printer</v-icon> Cetak Slip
            </v-btn>
             <v-btn
                size="small"
                color="info"
                :disabled="!isSingleSelected"
                @click="handleExportDetail">
                <v-icon start>mdi-download</v-icon> Export Detail
            </v-btn>
  </template>

  <div class="browse-content">
   <v-card flat class="mb-4">
    <v-card-text>
     <div class="filter-section d-flex align-center flex-wrap ga-4">
      <v-label class="filter-label">Periode Mulai:</v-label>
      <v-text-field
       v-model="filters.startDate"
       type="date"
       density="compact"
       hide-details
       variant="outlined"
       style="max-width: 150px;"
      />

      <v-label class="mx-2">s/d</v-label>

      <v-text-field
       v-model="filters.endDate"
       type="date"
       density="compact"
       hide-details
       variant="outlined"
       style="max-width: 150px;"
      />

      <v-btn variant="text" size="small" @click="fetchHeaders">
       <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
      <v-spacer />

      <div class="d-flex align-center ga-2 text-caption">
       <v-icon color="red" size="small">mdi-square-rounded</v-icon>
       <span class="ml-1"><strong>LENGKAP: TIDAK</strong></span>
      </div>
     </div>
    </v-card-text>
   </v-card>

   <div class="table-container">
    <v-data-table
     v-model:selected="selected"
     :headers="masterHeaders"
     :items="headers || []"
     :loading="loading.headers"
     item-value="Nomor"
     density="compact"
     class="desktop-table elevation-1"
     fixed-header
     show-select
     return-object
     show-expand
     @update:expanded="loadDetails"
    >
          <template #item.Tanggal="{ item }">
      {{ safeFormatDate(item.Tanggal) }}
     </template>
          
     <template #item.Lengkap="{ item }">
      <v-chip size="x-small" :color="item.Lengkap === 'Y' ? 'success' : 'error'">
       {{ item.Lengkap === 'Y' ? 'YA' : 'TIDAK' }}
      </v-chip>
     </template>
          
          <template #item.Nomor="{ item }">
            <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
          </template>

          <template #expanded-row="{ columns, item }">
      <tr>
       <td :colspan="columns.length">
        <div class="detail-container">
         <div class="detail-table-wrapper">
          <div v-if="loading.details || isLoadingDetails(item.Nomor)" class="text-center pa-4 text-caption">
           Memuat detail...
          </div>

          <v-data-table
           v-else
           :headers="detailHeaders"
           :items="details[item.Nomor] || []"
           density="compact"
           class="detail-table"
           :items-per-page="-1"
                      hide-default-footer
          >
                                   <template #[`item.J_Order`]="{ item: d }">{{ d.J_Order }}</template>
           <template #[`item.J_Seaming`]="{ item: d }">{{ d.J_Seaming }}</template>
           <template #[`item.J_MataAyam`]="{ item: d }">{{ d.J_MataAyam }}</template>
           <template #[`item.J_Coly`]="{ item: d }">{{ d.J_Coly }}</template>
           <template #[`item.J_Bs`]="{ item: d }">{{ d.J_Bs }}</template>
           <template #[`item.Mata_Ayam`]="{ item: d }">{{ d.Mata_Ayam }}</template>
           <template #[`item.XBanner`]="{ item: d }">{{ d.XBanner }}</template>
           <template #[`item.Plastik`]="{ item: d }">{{ d.Plastik }}</template>

          </v-data-table>

          <div
           v-if="!isLoadingDetails(item.Nomor) && !(details[item.Nomor] && details[item.Nomor].length)"
           class="text-center pa-4 text-caption"
          >
           Tidak ada data detail.
          </div>
         </div>
        </div>
       </td>
      </tr>
     </template>
    </v-data-table>
   </div>
  </div>
 </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { format, subDays, parseISO, isValid } from 'date-fns'; // Import isValid
import PageLayout from '../components/PageLayout.vue';

// --- Interfaces ---
interface LhkFinishingHeader {
 Nomor: string;
 Tanggal?: string;
 Gudang?: string;
 Nama_Gudang?: string;
 Shift?: string;
 Operator?: string;
 Lengkap?: 'Y' | 'N';
 [key: string]: any;
}

interface LhkFinishingDetail {
 Nomor_SPK?: string;
 Nama_SPK?: string;
 J_Order?: number;
 J_Seaming?: number;
 J_MataAyam?: number;
 J_Coly?: number;
 J_Bs?: number;
 Mata_Ayam?: number; 
 XBanner?: number; 
 Plastik?: number; 
 [key: string]: any;
}

type LhkFinishingItem = LhkFinishingHeader;

const api = axios;
const API_BASE_URL = 'http://localhost:8000/api/mmt/lhk-finishing';


// --- Store & utils ---
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const MENU_ID = 'MMT_LHK_FINISHING'; 

// --- State ---
const headers = ref<LhkFinishingHeader[]>([]); 
const details = ref<Record<string, LhkFinishingDetail[]>>({});
const loading = ref({ headers: true, details: false });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<LhkFinishingHeader[]>([]);
const expanded = ref<LhkFinishingHeader[]>([]);


const filters = reactive({
 startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
 endDate: format(new Date(), 'yyyy-MM-dd'),
});

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed<LhkFinishingItem | null>(() =>
 isSingleSelected.value ? (selected.value[0] as LhkFinishingItem) : null
);

// --- Helpers ---
const safeFormatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const parsedDate = parseISO(dateString);
        if (isValid(parsedDate)) {
            return format(parsedDate, 'dd/MM/yyyy');
        }
        return '';
    } catch (e) {
        return '';
    }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: LhkFinishingItem) => {
return item.Lengkap !== 'Y' ? 'text-red font-weight-bold' : '';
};

// --- Headers (Vuetify accepts arrays of objects with `title` and `key`) ---
const masterHeaders = [
 { title: 'Nomor', key: 'Nomor', minWidth: '180px', fixed: true },
 { title: 'Tanggal', key: 'Tanggal', minWidth: '120px' },
 { title: 'Gudang', key: 'Gudang', minWidth: '100px' },
 { title: 'Nama Gudang', key: 'Nama_Gudang', minWidth: '150px' },
 { title: 'Shift', key: 'Shift', minWidth: '80px' },
 { title: 'Lengkap', key: 'Lengkap', minWidth: '100px', align: 'center' },
 { title: 'Operator', key: 'Operator', minWidth: '150px' },
  { title: '', key: 'data-table-expand', minWidth: '40px' },
] as any[];

const detailHeaders = [
 { title: 'Nomor SPK', key: 'Nomor_SPK', minWidth: '150px' },
 { title: 'Nama SPK', key: 'Nama_SPK', minWidth: '250px' },
 { title: 'Jml Order', key: 'J_Order', align: 'end' },
 { title: 'Jml Seaming', key: 'J_Seaming', align: 'end' },
 { title: 'Jml Mata Ayam', key: 'J_MataAyam', align: 'end' },
 { title: 'Jml Coly', key: 'J_Coly', align: 'end' },
 { title: 'Jml BS', key: 'J_Bs', align: 'end' },
 { title: 'Qty Mata Ayam', key: 'Mata_Ayam', align: 'end' },
 { title: 'Qty XBanner', key: 'XBanner', align: 'end' },
 { title: 'Qty Plastik', key: 'Plastik', align: 'end' },
] as any[];

// --- API calls ---

// Mengatasi ReferenceError: fetchGudangList is not defined
const fetchGudangList = async () => {
try {
 console.log('INFO: Simulating fetching Gudang List.');
} catch (error) {
 console.error('Error fetching gudang list:', error);
}
};

const fetchHeaders = async () => {
 loading.value.headers = true;
 try {
  const response = await api.get<LhkFinishingHeader[]>(API_BASE_URL, {
   params: {
    startDate: filters.startDate,
    endDate: filters.endDate,
   },
  });
  headers.value = response.data || []; // FIX: Safe assignment
  selected.value = [];
  expanded.value = [];
 } catch (err) {
  toast.error('Gagal mengambil data LHK Finishing.');
 } finally {
  loading.value.headers = false;
 }
};

const loadDetails = async (newlyExpandedItems: LhkFinishingItem[]) => {
 const itemToLoad = newlyExpandedItems?.find(
  (it) => it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor)
 );
 if (!itemToLoad) return;

 loadingDetails.value.add(itemToLoad.Nomor);
 loading.value.details = true;
 try {
  const res = await api.get<LhkFinishingDetail[]>(`${API_BASE_URL}/details`, {
        params: { nomor: itemToLoad.Nomor }
    });
  details.value[itemToLoad.Nomor] = res.data || [];
 } catch (err) {
  toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
  details.value[itemToLoad.Nomor] = [];
 } finally {
  loadingDetails.value.delete(itemToLoad.Nomor);
    loading.value.details = false;
 }
};

// --- Actions ---
const handleNew = () => {
 router.push({ name: 'LhkFinishingCreate' });
};

const handleEdit = () => {
 if (!selectedRow.value) return;
 const nomor = selectedRow.value.Nomor;
 router.push({ name: 'LhkFinishingEdit', params: { nomor } });
};

const handleDelete = async () => {
 if (!selectedRow.value) return;
 if (confirm(`Yakin ingin menghapus LHK Finishing nomor ${selectedRow.value.Nomor}?`)) {
  try {
        await api.delete(`${API_BASE_URL}/${selectedRow.value.Nomor}`);
        toast.success(`LHK ${selectedRow.value.Nomor} berhasil dihapus.`);
        await fetchHeaders();
    } catch (error) {
        toast.error('Gagal menghapus data.');
    }
 }
};

const handleBahan = () => {
 if (!selectedRow.value) return;
 alert(`TODO: Buka form Bahan untuk LHK ${selectedRow.value.Nomor}`);
};

const handlePrint = () => {
 if (!selectedRow.value) return;
 alert(`TODO: Cetak LHK ${selectedRow.value.Nomor}`);
};

// --- Lifecycle ---
onMounted(() => {
 fetchGudangList(); // Dipanggil di onMounted
 fetchHeaders();
});

watch(filters, fetchHeaders, { deep: true });
</script>

<style scoped>

</style>