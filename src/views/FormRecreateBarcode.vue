<script setup lang="ts">
import { ref, reactive, computed, nextTick } from "vue";
import QRCode from "qrcode";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";

// --- Interfaces ---
interface BarcodeItem {
  tanggal: string;
  kodeBahan: string;
  namaBahan: string;
  barcode: string;
  panjang: number;
  lebar: number;
  gudangKode: string;
  isNew: boolean; // Menentukan mana yang baru (perlu di-save) dan mana yang cuma reprint
  qrImage: string; // Menyimpan data URL base64 untuk mempermudah cetak stiker lewat iframe
}

// --- State ---
const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const showBahanModal = ref(false);
const activeTab = ref(0); // Tab 0: Generate Baru, Tab 1: Ambil Data Lama
const listPending = ref<BarcodeItem[]>([]);

const form = reactive({
  tanggal: new Date().toISOString().substr(0, 10),
  kodeBahan: "",
  namaBahan: "",
  panjang: 0,
  lebar: 0,
  gudangKode: "WH-16",
  qty: 1,
  barcodeSearchInput: "", // Input untuk scan barcode lama
});

// --- Menghitung jumlah item baru yang butuh disimpan ke DB ---
const totalNewItems = computed(
  () => listPending.value.filter((item) => item.isNew).length,
);

// --- Methods ---
const selectBahan = (val: any) => {
  form.kodeBahan = val.Kode;
  form.namaBahan = val.Nama;
  form.panjang = val.Panjang || 0;
  form.lebar = val.Lebar || 0;
  showBahanModal.value = false;
};

// =========================================================================
// MODE 1: GENERATE BARCODE BARU (SINKRONISASI DATABASE + DUPLIKASI 2 LABEL)
// =========================================================================
const handleGenerate = async () => {
  if (!form.kodeBahan || form.qty <= 0) {
    toast.warning("Pilih bahan dan isi jumlah qty");
    return;
  }

  loading.value = true;
  try {
    const res = await api.get(`/mmt/recreate-barcode/next-number`, {
      params: {
        kodeBahan: form.kodeBahan,
        tanggal: form.tanggal,
      },
    });

    if (res.data.success) {
      const ym = res.data.ym;
      let startSeq = res.data.nextSeq;

      // Sinkronisasi nomor urut dengan antrean lokal yang belum di-save
      const sameBahanInAntrean = listPending.value.filter(
        (item) => item.kodeBahan === form.kodeBahan && item.isNew,
      );

      if (sameBahanInAntrean.length > 0) {
        const lastBarcodeInList =
          sameBahanInAntrean[sameBahanInAntrean.length - 1].barcode;
        const parts = lastBarcodeInList.split("-");
        const lastSeqNumber = parseInt(parts[parts.length - 1]);
        startSeq = lastSeqNumber + 1;
      }

      // Masukkan ke daftar antrean sebagai data BARU (isNew: true)
      for (let i = 0; i < form.qty; i++) {
        const currentSeq = startSeq + i;
        const newBarcode = `${form.kodeBahan}-${ym}-${String(currentSeq).padStart(3, "0")}`;

        // Buat Base64 QR Image menggunakan modul qrcode secara langsung
        const qrImage = await QRCode.toDataURL(newBarcode, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: "M",
        });

        // Loop sebanyak 2 kali agar otomatis terduplikasi 2 stiker per roll
        for (let d = 0; d < 2; d++) {
          listPending.value.push({
            tanggal: form.tanggal,
            kodeBahan: form.kodeBahan,
            namaBahan: form.namaBahan,
            barcode: newBarcode,
            panjang: form.panjang,
            lebar: form.lebar,
            gudangKode: form.gudangKode,
            isNew: true,
            qrImage: qrImage,
          });
        }
      }

      await nextTick();
      renderAllQRCodes();
      toast.success(
        `${form.qty} roll baru ditambahkan (Total: ${form.qty * 2} label stiker).`,
      );
    }
  } catch (error: any) {
    console.error("Error Generate:", error);
    toast.error("Gagal sinkronisasi nomor urut terakhir");
  } finally {
    loading.value = false;
  }
};

// =========================================================================
// MODE 2: AMBIL DATA BARCODE LAMA DARI DATABASE (REPRINT + DUPLIKASI 2 LABEL)
// =========================================================================
const handleFindOldBarcode = async () => {
  const code = form.barcodeSearchInput?.trim();
  if (!code) return;

  if (listPending.value.some((item) => item.barcode === code)) {
    toast.warning(`Barcode ${code} sudah ada di dalam antrean!`);
    form.barcodeSearchInput = "";
    return;
  }

  loading.value = true;
  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);
    const resData = res.data.data;

    if (resData && resData.data) {
      const infoStok = resData.data;

      // Buat Base64 QR Image dari barcode terdaftar database
      const qrImage = await QRCode.toDataURL(infoStok.Barcode, {
        width: 300,
        margin: 0,
        errorCorrectionLevel: "M",
      });

      // Loop 2 kali untuk mencetak sepasang label/roll
      for (let d = 0; d < 2; d++) {
        listPending.value.push({
          barcode: infoStok.Barcode,
          kodeBahan: infoStok.Kode,
          namaBahan: infoStok.Nama_Bahan || "Material Terdaftar",
          panjang: parseFloat(infoStok.Sisa_Panjang || infoStok.Panjang || 0),
          lebar: parseFloat(infoStok.Lebar || 0),
          tanggal: infoStok.Tanggal || new Date().toISOString().substr(0, 10),
          gudangKode: infoStok.Gudang || form.gudangKode,
          isNew: false, // Ditandai false agar tidak tersimpan ulang
          qrImage: qrImage,
        });
      }

      form.barcodeSearchInput = ""; // Kosongkan input scan

      await nextTick();
      renderAllQRCodes();
      toast.success(`Barcode lama ${code} berhasil dimuat ke antrean.`);
    } else {
      toast.error("Barcode tidak ditemukan di master stok database!");
    }
  } catch (error) {
    toast.error("Gagal memuat data dari database");
  } finally {
    loading.value = false;
  }
};

// Render QR Code untuk elemen <canvas> preview di baris tabel browser
const renderAllQRCodes = async () => {
  for (let i = 0; i < listPending.value.length; i++) {
    const canvas = document.getElementById(`canvas-${i}`) as HTMLCanvasElement;
    if (canvas) {
      await QRCode.toCanvas(canvas, listPending.value[i].barcode, {
        width: 60,
        margin: 1,
      });
    }
  }
};

const removeItem = (index: number) => {
  listPending.value.splice(index, 1);
  nextTick(() => renderAllQRCodes());
};

// =========================================================================
// AKSI SIMPAN KE DATABASE (HANYA MENGIRIM DATA BARU / isNew: true)
// =========================================================================
const handleSaveAllNew = async () => {
  // Ambil hanya item unik yang berstatus isNew === true (tidak mengirim baris duplikat cetak)
  const uniqueNewItems: any[] = [];
  const map = new Map();

  for (const item of listPending.value) {
    if (item.isNew && !map.has(item.barcode)) {
      map.set(item.barcode, true);
      uniqueNewItems.push(item);
    }
  }

  if (uniqueNewItems.length === 0) return;

  saving.value = true;
  try {
    await api.post("/mmt/recreate-barcode/save-batch", {
      items: uniqueNewItems,
    });
    toast.success("Barcode baru berhasil didaftarkan ke database.");

    // Ubah semua status isNew menjadi false karena sekarang sudah resmi terdaftar
    listPending.value.forEach((item) => (item.isNew = false));
  } catch (error: any) {
    toast.error("Gagal menyimpan data baru");
  } finally {
    saving.value = false;
  }
};

// =========================================================================
// LOGIKA PRINT FORMAT STIKER THERMAL (70mm x 50mm - IFRAME BYPASS)
// =========================================================================
const handlePrintLayout = () => {
  if (listPending.value.length === 0) return;

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // Mapping data antrean ke template stiker thermal 70mm x 50mm
  const labelHtml = listPending.value
    .map(
      (item) => `
    <div class="label-box">
      <div class="border-inner">
        <div class="top-row">
          <img src="${item.qrImage}" class="qr-img" />
          <div class="info-column">
            <div class="qr-text">${item.barcode}</div>
            <div class="dimens-text">${item.panjang} x ${item.lebar}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="product-name">${item.namaBahan}</div>
      </div>
    </div>
  `,
    )
    .join("");

  doc.open();
  doc.write(`
    <html>
      <head>
         <style>
          @page { size: 101.2mm 101mm portrait; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
          .label-box { width: 70mm; height: 50mm; padding: 3mm; box-sizing: border-box; }
          .label-box:nth-child(2n) { page-break-after: always; }
          .border-inner { border: 1pt solid black; height: 100%; width: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box; }
          .top-row { display: flex; gap: 10px; margin-bottom: 4px; }
          .qr-img { width: 1.5cm; height: 1.5cm; }
          .info-column { display: flex; flex-direction: column; justify-content: center; }
          .qr-text { font-weight: bold; font-size: 8pt; word-break: break-all; font-family: monospace; }
          .dimens-text { font-size: 11pt; font-weight: bold; margin-top: 5px; }
          .divider { border-top: 1pt solid black; width: 100%; margin: 4px 0; }
          .product-name { font-size: 13pt; font-weight: bold; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; text-transform: uppercase; }
        </style>
      </head>
      <body>${labelHtml}</body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 500);
};
</script>

<template>
  <PageLayout title="Dual Barcode Generator & Reprint" icon="mdi-barcode-scan">
    <v-row>
      <v-col cols="12" md="4">
        <v-card border flat>
          <v-tabs
            v-model="activeTab"
            bg-color="grey-lighten-4"
            grow
            density="compact"
          >
            <v-tab :value="0"
              ><v-icon start size="small">mdi-plus-circle</v-icon> Baru</v-tab
            >
            <v-tab :value="1"
              ><v-icon start size="small">mdi-database-search</v-icon> Ambil
              DB</v-tab
            >
          </v-tabs>

          <v-window v-model="activeTab" class="pa-4">
            <v-window-item :value="0">
              <v-text-field
                v-model="form.tanggal"
                label="Tanggal"
                type="date"
                variant="outlined"
                density="compact"
              />
              <v-text-field
                v-model="form.namaBahan"
                label="Cari Bahan Master"
                readonly
                variant="outlined"
                density="compact"
                append-inner-icon="mdi-magnify"
                @click="showBahanModal = true"
              />
              <v-row dense>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="form.panjang"
                    label="Panjang (M)"
                    type="number"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="form.lebar"
                    label="Lebar (M)"
                    type="number"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>
              <v-text-field
                v-model.number="form.qty"
                label="Jumlah Roll Baru"
                type="number"
                variant="outlined"
                density="compact"
              />
              <v-btn
                block
                color="success"
                :loading="loading"
                @click="handleGenerate"
                >Generate Baru</v-btn
              >
            </v-window-item>

            <v-window-item :value="1">
              <p class="text-caption text-grey-darken-1 mb-2">
                Scan atau masukkan kode barcode dari database stok untuk dicetak
                ulang tanpa menambah nomor urut baru.
              </p>
              <v-text-field
                v-model="form.barcodeSearchInput"
                label="Scan Barcode Terdaftar"
                placeholder="Scan di sini..."
                prepend-inner-icon="mdi-barcode-scan"
                variant="outlined"
                density="compact"
                color="indigo"
                autofocus
                @keyup.enter="handleFindOldBarcode"
              />
              <v-btn
                block
                color="indigo"
                class="text-white"
                :loading="loading"
                :disabled="!form.barcodeSearchInput"
                @click="handleFindOldBarcode"
                >Ambil Dari Database</v-btn
              >
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card border flat>
          <v-toolbar density="compact" color="transparent" class="px-2">
            <v-toolbar-title class="text-subtitle-2 font-weight-bold">
              Antrean Cetak ({{ listPending.length }} Label)
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              color="orange-darken-2"
              size="small"
              variant="elevated"
              class="mr-2 text-white"
              :disabled="totalNewItems === 0"
              :loading="saving"
              @click="handleSaveAllNew"
            >
              <v-icon start>mdi-database-plus</v-icon> Simpan ke Database ({{
                totalNewItems
              }})
            </v-btn>
            <v-btn
              color="primary"
              size="small"
              :disabled="listPending.length === 0"
              @click="handlePrintLayout"
            >
              <v-icon start>mdi-printer</v-icon> Cetak Label (F3)
            </v-btn>
          </v-toolbar>

          <v-table density="compact">
            <thead>
              <tr>
                <th>QR</th>
                <th>Informasi Barcode</th>
                <th>Ukuran</th>
                <th>Tipe</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in listPending" :key="idx">
                <td><canvas :id="'canvas-' + idx" class="mt-1"></canvas></td>
                <td>
                  <div class="font-weight-bold">{{ item.barcode }}</div>
                  <div
                    class="text-caption text-truncate"
                    style="max-width: 250px"
                  >
                    {{ item.namaBahan }}
                  </div>
                </td>
                <td>{{ item.panjang }} x {{ item.lebar }} M</td>
                <td>
                  <v-chip
                    size="x-small"
                    :color="item.isNew ? 'success' : 'indigo'"
                    variant="flat"
                    class="text-white"
                  >
                    {{ item.isNew ? "BARU" : "REPRINT" }}
                  </v-chip>
                </td>
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
/* CSS UNTUK PREVIEW GRID DI MONITOR */
.label-box-preview {
  width: 70mm;
  height: 50mm;
  padding: 3mm;
  box-sizing: border-box;
  border: 1px solid #ccc;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.border-inner-preview {
  border: 1pt solid black;
  height: 100%;
  width: 100%;
  padding: 2mm;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.top-row-preview {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
}
.qr-img-preview {
  width: 1.5cm;
  height: 1.5cm;
}
.info-column-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.qr-text-preview {
  font-weight: bold;
  font-size: 8pt;
  word-break: break-all;
  font-family: monospace;
}
.dimens-text-preview {
  font-size: 11pt;
  font-weight: bold;
  margin-top: 2px;
}
.divider-preview {
  border-top: 1pt solid black;
  width: 100%;
  margin: 4px 0;
}
.product-name-preview {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-transform: uppercase;
}
.delete-btn-pos {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: white;
  border-radius: 50%;
}
</style>
