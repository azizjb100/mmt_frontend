<template>
 <PageLayout title="Data Penerimaan Paper Print" icon="mdi-receipt-text-check-outline">
  <template #header-actions>
   <v-btn
    v-if="authStore.can(MENU_ID, 'insert')"
    size="x-small"
    color="success"
    @click="handleNew"
   >
    <v-icon start>mdi-plus</v-icon> Baru
   </v-btn>

   <v-btn
    v-if="authStore.can(MENU_ID, 'edit')"
    size="x-small"
    color="warning"
    :disabled="!isSingleSelected"
    @click="handleEdit"
   >
    <v-icon start>mdi-pencil</v-icon> Ubah
   </v-btn>

   <v-btn
    v-if="authStore.can(MENU_ID, 'delete')"
    size="x-small"
    color="error"
    :disabled="!isSingleSelected"
    @click="handleDelete"
   >
    <v-icon start>mdi-trash-can</v-icon> Hapus
   </v-btn>

   <v-divider vertical class="mx-2" />

   <v-btn
    v-if="authStore.can(MENU_ID, 'view')"
    size="x-small"
    color="info"
    :disabled="!isSingleSelected"
    @click="handlePrint"
   >
    <v-icon start>mdi-printer</v-icon> Cetak
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
            
            <v-text-field
       v-model="filters.spk"
       label="Filter SPK"
       density="compact"
       hide-details
       variant="outlined"
       style="max-width: 180px;"
      />


      <v-btn variant="text" size="x-small" @click="fetchData">
       <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
      <v-spacer />
     </div>
    </v-card-text>
   </v-card>

   <div class="table-container">
    <v-data-table
     v-model:selected="selected"
     v-model:expanded="expanded"
     :headers="masterHeaders"
     :items="masterData || []"
     :loading="loading"
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
          
          <template #item.Dateline="{ item }">
      {{ safeFormatDate(item.Dateline) }}
     </template>


    <template #expanded-row="{ columns, item }">
      <tr>
       <td :colspan="columns.length">
        <div class="detail-container">
         <div class="detail-table-wrapper">
          <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-4 text-caption">
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
           <template #item.Qty="{ item: d }">
                        {{ Number(d.Qty).toFixed(2) }}
           </template>
                      <template #item.Qty_Terima="{ item: d }">
                        {{ Number(d.Qty_Terima).toFixed(2) }}
           </template>
                      <template #item.Harga="{ item: d }">
                        {{ Number(d.Harga).toFixed(2) }}
           </template>
          </v-data-table>

          <div
           v-if="!details[item.Nomor] || details[item.Nomor].length === 0"
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
import { format, subDays, parseISO, isValid } from 'date-fns';
import PageLayout from '../components/PageLayout.vue'; 

// --- Interfaces Penerimaan Paper Print ---

interface RecPaperDetail {
 Nomor: string; // pjd_nomor_rec
 pjd_Nomor: string; // pjd_nomor (Nomor PO)
 Spk: string; // pjd_spk
 NamaSpk: string; // pjd_nama
 Ukuran: string; // pjd_ukuran
 Bahan: string; // pjd_bahan
 Qty: number; // pjd_qty (QTY PO)
  Qty_Terima: number; // pjd_qtyterima (QTY diterima)
  Harga: number; // pjd_harga
 Keterangan: string; // pjd_ket
 [key: string]: any;
}

interface RecPaperHeader {
 Nomor: string; // pjh_nomor_rec
 PO_Nomor: string; // pjh_nomor
 Cab: string; // pjh_cab
 Tanggal: string; // pjh_tanggal (Tanggal Rec)
 Dateline: string; // pjh_dateline (Tanggal Dateline PO)
 KodeSup: string; 
 Nama: string; // Sup_nama
 Alamat: string; // Sup_alamat
 Keterangan: string; // pjh_ket
 [key: string]: any;
}

const api = axios;
const API_BASE_URL = 'http://localhost:8000/api/mmt/po-paperprint'; 
const MENU_ID = 'MMT_REC_PAPER'; 


// --- Store & utils ---
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();


// --- State ---
const masterData = ref<RecPaperHeader[]>([]);
const details = ref<Record<string, RecPaperDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set()); 
const selected = ref<RecPaperHeader[]>([]); 
const expanded = ref<string[]>([]); 

const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
const today = format(new Date(), 'yyyy-MM-dd');

const filters = reactive({
 startDate: thirtyDaysAgo,
 endDate: today,
  spk: '', // Filter tambahan untuk SPK dari edtspk
});


// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() => 
 isSingleSelected.value ? (selected.value[0] as RecPaperHeader).Nomor : null
);

const selectedRow = computed<RecPaperHeader | null>(() =>
 isSingleSelected.value ? (selected.value[0] as RecPaperHeader) : null
);

// Asumsi isFormValid hanya relevan untuk form entri
const isFormValid = computed(() => true); 


// --- Helpers ---

const safeFormatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const parsedDate = parseISO(dateString); 
        if (isValid(parsedDate)) {
            return format(parsedDate, 'dd/MM/yyyy');
        }
        // Fallback untuk format Delphi (DD-Month-YYYY)
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return dateString; 
        }
        return '';
    } catch (e) {
        return '';
    }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);


// --- Headers ---

const masterHeaders = [
 { title: 'Nomor ', key: 'Nomor', minWidth: '150px', fixed: true }, // pjh_nomor_rec
 { title: 'Nomor PO', key: 'PO_Nomor', minWidth: '150px' }, // pjh_nomor
 { title: 'Cab', key: 'Cab', minWidth: '100px' }, // pjh_cab
 { title: 'Tanggal ', key: 'Tanggal', minWidth: '120px' },
 { title: 'Dateline', key: 'Dateline', minWidth: '120px' },
 { title: 'Kode Sup', key: 'KodeSup', minWidth: '100px' },
 { title: 'Supplier', key: 'Nama', minWidth: '200px' },
 { title: 'Keterangan', key: 'Keterangan', minWidth: '250px' },
  { title: '', key: 'data-table-expand', minWidth: '40px' },
] as any[];

const detailHeaders = [
  { title: 'Nomor Rec', key: 'Nomor', minWidth: '140px', fixed: true },
  { title: 'Mesin', key: 'pjd_Nomor', minWidth: '140px' },
  { title: 'Nomor PO', key: 'pjd_Nomor', minWidth: '140px' },
  { title: 'SPK', key: 'SPK', minWidth: '120px' },
  { title: 'Nama SPK', key: 'NamaSpk', minWidth: '250px' },
  { title: 'Ukuran', key: 'Ukuran', minWidth: '100px' },
  { title: 'Panjang', key: 'panjang', minWidth: '140px' },
  { title: 'Lebar', key: 'lebar', minWidth: '140px' },
  { title: 'Bahan', key: 'Bahan', minWidth: '100px' },
  { title: 'Qty PO', key: 'Qty', minWidth: '80px', align: 'end' },
  { title: 'Qty Terima', key: 'Qty_Terima', minWidth: '100px', align: 'end' },
  { title: 'Harga', key: 'Harga', minWidth: '100px', align: 'end' },
  { title: 'Keterangan', key: 'Keterangan', minWidth: '150px' },
] as any[];


// --- API calls (Implementasi dari SQL Delphi) ---

const fetchData = async () => {
 loading.value = true;
 selected.value = [];
 expanded.value = [];
 details.value = {};
 try {
    // Menggantikan btnRefreshClick Delphi
  const response = await axios.get<RecPaperHeader[]>(`${API_BASE_URL}/`, {
   params: {
    startDate: filters.startDate,
    endDate: filters.endDate,
        spk: filters.spk, // Mengirimkan filter SPK
   },
  });
    
  masterData.value = response.data || [];

 } catch (err) {
  toast.error('Gagal mengambil data Penerimaan Paper Print.');
 } finally {
  loading.value = false;
 }
};

const loadDetails = async (newlyExpandedItems: RecPaperHeader[]) => {
    // Menggantikan SQLDetail Delphi
 const itemToLoad = newlyExpandedItems?.find(
  (it) => it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor)
 );
 if (!itemToLoad) return;

 loadingDetails.value.add(itemToLoad.Nomor);
 try {
    // Asumsi endpoint /browse-detail mengembalikan detail Penerimaan Paper Print
  const res = await axios.get<RecPaperDetail[]>(`${API_BASE_URL}/detail`, {
        params: { nomor: itemToLoad.Nomor }
    });
    
    // Pastikan data numerik diubah/difilter untuk toFixed
  details.value[itemToLoad.Nomor] = res.data.map(d => ({
        ...d,
        Qty: d.Qty || 0,
        Qty_Terima: d.Qty_Terima || 0,
        Harga: d.Harga || 0,
    })) || [];

 } catch (err) {
  toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
  details.value[itemToLoad.Nomor] = [];
 } finally {
  loadingDetails.value.delete(itemToLoad.Nomor);
 }
};


// --- Actions ---

const handleNew = () => {
 // cxButton2Click
 router.push({ name: 'RecPaperCreate' });
};

const handleEdit = () => {
 // cxButton1Click
 if (!selectedNomor.value) return;
 // Asumsi form Edit Paper Print ada:
 router.push({ name: 'RecPaperEdit', params: { nomor: selectedNomor.value } });
};

const handleDelete = async () => {
 // cxButton4Click
 if (!selectedNomor.value) return;
 
 if (confirm(`Yakin ingin hapus Penerimaan Paper Print ${selectedNomor.value}?`)) {
  try {
        // Logika delete dari Delphi (menghapus detail dan header)
    await axios.delete(`${API_BASE_URL}/${selectedNomor.value}`);
    toast.success('Data sudah diHapus.');
    await fetchData();
  } catch (error) {
    toast.error('Gagal Hapus.');
  }
 }
};

const handlePrint = () => {
 // cxButton3Click (membuka form ufrmRecPaper dalam mode print)
 if (!selectedNomor.value) return;
 // Asumsi form Print Paper Print ada:
 router.push({ name: 'RecPaperPrint', params: { nomor: selectedNomor.value } });
};

// --- Lifecycle ---
onMounted(() => {
 fetchData(); // Menggantikan FormShow
});

watch(filters, fetchData, { deep: true });
</script>

<style scoped>
/* Menyesuaikan gaya Vuetify agar lebih padat dan ringkas */
.browse-content {
 padding-top: 10px;
}

.filter-section {
 padding: 10px 16px;
}
.v-data-table__td--expanded-row .v-btn {
    /* Mengurangi ukuran fisik tombol ikon */
    height: 2px !important; /* Atur tinggi tombol */
    width: 2px !important;  /* Atur lebar tombol */
    padding: 0 !important;   /* Hilangkan padding internal tombol */
}


.v-data-table__td--expanded-row .v-icon {
    /* Mengurangi ukuran font/ikon itu sendiri */
    font-size: 16px !important; /* Nilai default biasanya 24px atau 20px */
}

/* Detail Table Styling */
.detail-container {
 padding: 10px 0;
 background-color: #f7f7f7;
 border-top: 1px solid #ddd;
}

.detail-table-wrapper {
 padding: 0 40px; 
}

.detail-table {
 background-color: white !important;
 font-size: 0.8rem;
}

/* FIX: Ensure numeric alignment in tables */
.v-data-table :deep(.text-end) {
  text-align: right !important;
}
.v-data-table__td .v-btn {
    /* Mengurangi ukuran tombol, jika perlu */
    height: 10px !important; 
    width: 24px !important;
}

</style>