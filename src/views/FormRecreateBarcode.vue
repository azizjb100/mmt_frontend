<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import QRCode from 'qrcode';
import api from '@/services/api';
import { useToast } from 'vue-toastification';
import PageLayout from '../components/PageLayout.vue';
import MasterBahanModal from '@/modal/MasterBahanModal.vue';

// --- Interfaces ---
interface GeneratedBarcode {
  barcode: string;
  namaBahan: string;
}

interface FormState {
  tanggal: string;
  kodeBahan: string;
  namaBahan: string;
  panjang: number;
  lebar: number;
  gudangKode: string;
  qty: number;
}

// --- State ---
const toast = useToast();
const loading = ref<boolean>(false);
const showPreview = ref<boolean>(false);
const showBahanModal = ref<boolean>(false);
const generatedBarcodes = ref<GeneratedBarcode[]>([]);

const form = reactive<FormState>({
  tanggal: new Date().toISOString().substr(0, 10),
  kodeBahan: '',
  namaBahan: '',
  panjang: 0,
  lebar: 0,
  gudangKode: 'WH-16',
  qty: 1
});

const listGudang = [
  { kode: 'WH-16', nama: 'Gudang Utama MMT' },
  { kode: 'GPM', nama: 'Gudang Produksi' }
];

// --- Computed ---
const isFormValid = computed<boolean>(() => {
  return !!(form.kodeBahan && form.qty > 0 && form.panjang > 0 && form.lebar > 0);
});

// --- Methods ---
const selectBahan = (val: any): void => {
  form.kodeBahan = val.Kode;
  form.namaBahan = val.Nama;
  form.panjang = val.Panjang || 0;
  form.lebar = val.Lebar || 0;
  showBahanModal.value = false;
};

const handleGenerate = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await api.post('/mmt/recreate-barcode/generate', form);
    
    if (response.data.success) {
      generatedBarcodes.value = response.data.data.barcodes;
      showPreview.value = true;
      
      await nextTick();
      renderQRCodes();
      toast.success("Data stok berhasil diperbarui dan barcode siap cetak.");
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || "Terjadi kesalahan sistem";
    toast.error(msg);
  } finally {
    loading.value = false;
  }
};

const renderQRCodes = async (): Promise<void> => {
  for (let i = 0; i < generatedBarcodes.value.length; i++) {
    const canvas = document.getElementById(`canvas-${i}`) as HTMLCanvasElement;
    if (canvas) {
      await QRCode.toCanvas(canvas, generatedBarcodes.value[i].barcode, { 
        width: 140, 
        margin: 1,
        errorCorrectionLevel: 'H'
      });
    }
  }
};

const printLabels = (): void => {
  window.print();
};
</script>

<template>
  <PageLayout title="Manual Barcode Generator" icon="mdi-barcode-plus">
    <template #header-actions>
      <v-btn 
        color="primary" 
        :loading="loading" 
        :disabled="!isFormValid"
        prepend-icon="mdi-cog-play"
        @click="handleGenerate"
      >
        Generate & Simpan
      </v-btn>
    </template>

    <v-row justify="center">
      <v-col cols="12" md="7">
        <v-card border flat class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold">Informasi Bahan & Stok</v-card-title>
          <v-divider class="mb-4"></v-divider>
          
          <v-card-text>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.tanggal" label="Tanggal" type="date" variant="outlined" density="compact" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="form.gudangKode" label="Gudang" :items="listGudang" item-title="nama" item-value="kode" variant="outlined" density="compact" />
              </v-col>
              <v-col cols="12">
                <v-text-field 
                  v-model="form.namaBahan" 
                  label="Cari Bahan" 
                  readonly 
                  variant="outlined" 
                  density="compact"
                  append-inner-icon="mdi-magnify"
                  @click="showBahanModal = true"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field v-model.number="form.panjang" label="Panjang (M)" type="number" variant="outlined" density="compact" />
              </v-col>
              <v-col cols="4">
                <v-text-field v-model.number="form.lebar" label="Lebar (M)" type="number" variant="outlined" density="compact" />
              </v-col>
              <v-col cols="4">
                <v-text-field v-model.number="form.qty" label="Jumlah Roll" type="number" variant="outlined" density="compact" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showPreview" fullscreen transition="dialog-bottom-transition">
      <v-card color="grey-lighten-3">
        <v-toolbar color="primary">
          <v-btn icon @click="showPreview = false"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>Preview Label</v-toolbar-title>
          <v-spacer />
          <v-btn variant="elevated" color="white" prepend-icon="mdi-printer" @click="printLabels">Cetak Sekarang</v-btn>
        </v-toolbar>

        <v-card-text id="print-area">
          <div class="barcode-grid">
            <div v-for="(item, idx) in generatedBarcodes" :key="idx" class="barcode-card">
              <div class="label-title">{{ item.namaBahan }}</div>
              <canvas :id="'canvas-' + idx"></canvas>
              <div class="label-code">{{ item.barcode }}</div>
              <div class="label-dimens">{{ form.panjang }}M x {{ form.lebar }}M</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <MasterBahanModal :is-visible="showBahanModal" @close="showBahanModal = false" @select="selectBahan" />
  </PageLayout>
</template>


<style scoped>
.barcode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  padding: 25px;
}

.barcode-card {
  background: white;
  border: 1px solid #333;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.label-title { font-size: 11px; font-weight: bold; height: 30px; overflow: hidden; margin-bottom: 5px; }
.label-code { font-size: 12px; font-family: 'Courier New', Courier, monospace; font-weight: bold; margin-top: 5px; }
.label-dimens { font-size: 10px; color: #666; }

@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; background: white; }
  .barcode-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 5px; padding: 0; }
  .barcode-card { border: 1px solid #000; box-shadow: none; page-break-inside: avoid; }
}
</style>