<script setup lang="ts">
import { ref, reactive, computed, nextTick } from "vue";
import QRCode from "qrcode";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";

// --- Interfaces ---
interface PendingBarcode {
  tanggal: string;
  kodeBahan: string;
  namaBahan: string;
  barcode: string;
  panjang: number;
  lebar: number;
  gudangKode: string;
}

// --- State ---
const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const showBahanModal = ref(false);
const listPending = ref<PendingBarcode[]>([]);

const form = reactive({
  tanggal: new Date().toISOString().substr(0, 10),
  kodeBahan: "",
  namaBahan: "",
  panjang: 0,
  lebar: 0,
  gudangKode: "WH-16",
  qty: 1,
});

// --- Methods ---
const selectBahan = (val: any) => {
  form.kodeBahan = val.Kode;
  form.namaBahan = val.Nama;
  form.panjang = val.Panjang || 0;
  form.lebar = val.Lebar || 0;
  showBahanModal.value = false;
};

// FUNGSI GENERATE (Hanya tambah ke list bawah, tidak simpan ke DB)
const handleGenerate = async () => {
  if (!form.kodeBahan || form.qty <= 0) return;
  loading.value = true;

  try {
    // API ini untuk ambil nomor terakhir saja
    const res = await api.get(`/mmt/recreate-barcode/next-number`, {
      params: { kodeBahan: form.kodeBahan, tanggal: form.tanggal },
    });

    let currentSeq = res.data.nextSeq - 1;
    const ym = form.tanggal.replace(/-/g, "").substring(2, 6); // yyMM

    for (let i = 0; i < form.qty; i++) {
      currentSeq++;
      const newBarcode = `${form.kodeBahan}-${ym}-${String(currentSeq).padStart(3, "0")}`;

      listPending.value.push({
        tanggal: form.tanggal,
        kodeBahan: form.kodeBahan,
        namaBahan: form.namaBahan,
        barcode: newBarcode,
        panjang: form.panjang,
        lebar: form.lebar,
        gudangKode: form.gudangKode,
      });
    }

    await nextTick();
    renderAllQRCodes();
    toast.info(`${form.qty} Barcode ditambahkan ke daftar.`);
  } catch (error: any) {
    toast.error("Gagal mengambil nomor urut terakhir");
  } finally {
    loading.value = false;
  }
};

const renderAllQRCodes = async () => {
  for (let i = 0; i < listPending.value.length; i++) {
    const canvas = document.getElementById(`canvas-${i}`) as HTMLCanvasElement;
    if (canvas) {
      await QRCode.toCanvas(canvas, listPending.value[i].barcode, {
        width: 80,
        margin: 1,
      });
    }
  }
};

const removeItem = (index: number) => {
  listPending.value.splice(index, 1);
};

// FUNGSI SIMPAN (Kirim semua list ke DB)
const handleSaveAll = async () => {
  if (listPending.value.length === 0) return;
  saving.value = true;
  try {
    await api.post("/mmt/recreate-barcode/save-batch", {
      items: listPending.value,
    });
    toast.success("Semua data berhasil disimpan ke database.");
    listPending.value = []; // Kosongkan setelah simpan
  } catch (error: any) {
    toast.error("Gagal menyimpan data");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <PageLayout title="Manual Barcode Generator" icon="mdi-barcode-plus">
    <v-row>
      <v-col cols="12" md="4">
        <v-card border flat title="Input Bahan">
          <v-card-text>
            <v-text-field
              v-model="form.tanggal"
              label="Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
            <v-text-field
              v-model="form.namaBahan"
              label="Cari Bahan"
              readonly
              variant="outlined"
              density="compact"
              append-inner-icon="mdi-magnify"
              @click="showBahanModal = true"
            />
            <v-row dense>
              <v-col cols="6"
                ><v-text-field
                  v-model.number="form.panjang"
                  label="P"
                  type="number"
                  variant="outlined"
                  density="compact"
              /></v-col>
              <v-col cols="6"
                ><v-text-field
                  v-model.number="form.lebar"
                  label="L"
                  type="number"
                  variant="outlined"
                  density="compact"
              /></v-col>
            </v-row>
            <v-text-field
              v-model.number="form.qty"
              label="Jumlah Roll"
              type="number"
              variant="outlined"
              density="compact"
            />
            <v-btn
              block
              color="secondary"
              :loading="loading"
              @click="handleGenerate"
              >Generate & Tambah</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card border flat>
          <v-toolbar density="compact" color="transparent">
            <v-toolbar-title class="text-subtitle-1"
              >Daftar Barcode Siap Simpan ({{
                listPending.length
              }})</v-toolbar-title
            >
            <v-spacer />
            <v-btn
              color="primary"
              :disabled="listPending.length === 0"
              :loading="saving"
              @click="handleSaveAll"
              >Simpan Ke Database</v-btn
            >
          </v-toolbar>

          <v-table density="compact">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Barcode / Bahan</th>
                <th>Dimensi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in listPending" :key="idx">
                <td><canvas :id="'canvas-' + idx"></canvas></td>
                <td>
                  <div class="font-weight-bold">{{ item.barcode }}</div>
                  <div class="text-caption">{{ item.namaBahan }}</div>
                </td>
                <td>{{ item.panjang }} x {{ item.lebar }}</td>
                <td>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeItem(idx)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <MasterBahanModal
      :is-visible="showBahanModal"
      @close="showBahanModal = false"
      @select="selectBahan"
    />
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

.label-title {
  font-size: 11px;
  font-weight: bold;
  height: 30px;
  overflow: hidden;
  margin-bottom: 5px;
}
.label-code {
  font-size: 12px;
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  margin-top: 5px;
}
.label-dimens {
  font-size: 10px;
  color: #666;
}

@media print {
  body * {
    visibility: hidden !important;
  }
  #print-area,
  #print-area * {
    visibility: visible !important;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
  }
  .barcode-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 5px;
    padding: 0;
  }
  .barcode-card {
    border: 1px solid #000;
    box-shadow: none;
    page-break-inside: avoid;
  }
}
</style>
