<template>
  <div class="pa-4 bg-white rounded elevation-1">
    <!-- Header Title -->
    <div class="d-flex align-center justify-space-between mb-4 border-b pb-3">
      <div class="d-flex align-center">
        <v-icon color="primary" size="28" class="mr-2">mdi-truck-delivery</v-icon>
        <div>
          <h2 class="text-h6 font-weight-bold">Buat Surat Jalan Hasil Maklon</h2>
          <span class="text-caption text-grey-darken-1">
            Konfirmasi penerimaan barang jadi dari proses maklon (P05 Mesin Cetak MMT & DTF)
          </span>
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          size="small"
          @click="onCancel"
        >
          <v-icon start size="16">mdi-arrow-left</v-icon> Batal
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          :loading="isSaving"
          :disabled="isLoading || !formData.Items.length"
          @click="onClickSave"
        >
          <v-icon start size="16">mdi-content-save</v-icon> Simpan SJ
        </v-btn>
      </div>
    </div>

    <!-- Loading State -->
    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />

    <!-- Error State -->
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" closable @click:close="errorMessage = ''">
      {{ errorMessage }}
    </v-alert>

    <!-- Pemilihan Maklon (Mode Input Baru / Ganti Maklon) -->
    <v-card
      v-if="!formData.MklNomor || isDirectInput"
      variant="outlined"
      class="pa-4 mb-4 bg-blue-grey-lighten-5"
    >
      <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
        <v-icon size="18" color="primary" class="mr-1">mdi-clipboard-text-search</v-icon>
        Pilih Nomor Maklon Induk
      </div>
      <v-row dense align="center">
        <v-col cols="12" md="8">
          <v-autocomplete
            v-model="selectedMklNomor"
            :items="availableMaklons"
            item-title="label"
            item-value="MklNomor"
            label="Cari No. Maklon / Cabang / Keterangan..."
            placeholder="Pilih Maklon yang memiliki LHK selesai..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            :loading="isLoadingAvailable"
            @update:model-value="onSelectMaklon"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle">
                <template #prepend>
                  <v-chip
                    size="x-small"
                    :color="item.raw.Sumber === 'P05' ? 'purple-darken-1' : 'blue-darken-1'"
                    variant="flat"
                    class="mr-2"
                  >
                    {{ item.raw.Sumber }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :loading="isLoadingAvailable"
            @click="fetchAvailableMaklons"
          >
            <v-icon start size="16">mdi-refresh</v-icon> Muat Ulang Daftar Maklon
          </v-btn>
        </v-col>
      </v-row>
      <div v-if="availableMaklons.length === 0 && !isLoadingAvailable" class="text-caption text-grey-darken-2 mt-2">
        <v-icon size="14" color="warning" class="mr-1">mdi-alert-circle-outline</v-icon>
        Tidak ada Maklon dengan LHK outstanding saat ini.
      </div>
    </v-card>

    <!-- Form Content -->
    <div v-if="!isLoading && formData.MklNomor" class="form-content">
      <!-- Section Info Maklon -->
      <v-card variant="outlined" class="pa-4 mb-4 bg-grey-lighten-5">
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <div class="text-caption text-grey-darken-1">No. Maklon Induk</div>
            <div class="text-subtitle-1 font-weight-bold text-primary d-flex align-center">
              {{ formData.MklNomor }}
              <v-chip size="x-small" color="primary" variant="tonal" class="ml-2 font-weight-bold">
                {{ formData.Sumber }}
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-caption text-grey-darken-1">Gudang Penerima (Cabang Asal)</div>
            <div class="text-subtitle-1 font-weight-medium">
              {{ formData.CabAsal }} — {{ formData.NamaCabAsal }}
              <v-chip size="x-small" color="blue-grey" variant="tonal" class="ml-2">
                Wajib kembali ke asal
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.Tanggal"
              label="Tanggal SJ / Terima"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 200px"
            />
          </v-col>
        </v-row>
      </v-card>

      <!-- Section Tabel Item Hasil Maklon -->
      <div class="mb-2 d-flex align-center justify-space-between">
        <div>
          <h3 class="text-subtitle-2 font-weight-bold">
            Daftar Item Barang Jadi Hasil Maklon
          </h3>
          <span class="text-caption text-grey-darken-1">
            Silakan periksa atau sesuaikan Qty Diterima dan BS / Afval aktual jika diperlukan.
          </span>
        </div>
        <span class="text-caption text-grey">
          {{ formData.Items.length }} item barang
        </span>
      </div>

      <v-table density="compact" class="border rounded mb-4">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th style="width: 40px" class="text-center font-weight-bold">No.</th>
            <th class="font-weight-bold">Item Barang Jadi</th>
            <th class="font-weight-bold text-right" style="width: 150px">Qty Diterima</th>
            <th class="font-weight-bold text-right" style="width: 130px">BS / Afval</th>
            <th class="font-weight-bold text-center" style="width: 90px">Satuan</th>
            <th class="font-weight-bold" style="width: 220px">No. LHK</th>
            <th style="width: 60px" class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in formData.Items" :key="idx">
            <td class="text-center">{{ idx + 1 }}</td>
            <td>
              <div class="font-weight-bold text-purple-darken-3">{{ item.KodeHasil }}</div>
              <div class="text-caption text-grey-darken-2">{{ item.NamaHasil }}</div>
              <div v-if="item.NamaPolos && item.NamaPolos !== item.NamaHasil" class="text-caption text-grey">
                Bahan: {{ item.NamaPolos }}
              </div>
            </td>
            <td class="text-right">
              <v-text-field
                v-model.number="item.QtyHasil"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="qty-field"
              />
            </td>
            <td class="text-right">
              <v-text-field
                v-model.number="item.BsAfval"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="qty-field"
              />
            </td>
            <td class="text-center">{{ item.Satuan || "PCS" }}</td>
            <td>
              <div class="font-weight-medium text-caption text-blue-grey-darken-2">
                {{ item.LhkNomor || "-" }}
                <v-chip
                  v-if="item.Sumber"
                  size="x-small"
                  :color="item.Sumber === 'P05' ? 'purple-darken-1' : 'blue-darken-1'"
                  variant="tonal"
                  class="ml-1"
                >
                  {{ item.Sumber }}
                </v-chip>
              </div>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                color="error"
                size="x-small"
                title="Hapus baris dari Surat Jalan ini"
                @click="removeItem(idx)"
              />
            </td>
          </tr>
          <tr v-if="formData.Items.length === 0">
            <td colspan="7" class="text-center pa-4 text-grey">
              Tidak ada item barang dalam daftar.
            </td>
          </tr>
        </tbody>
        <tfoot v-if="formData.Items.length > 0">
          <tr class="bg-grey-lighten-4 font-weight-bold">
            <td colspan="2" class="text-right">TOTAL:</td>
            <td class="text-right text-success">{{ formatNumber(totalQtyHasil) }}</td>
            <td class="text-right text-error">{{ formatNumber(totalBs) }}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </v-table>
    </div>

    <!-- Dialog Konfirmasi Simpan -->
    <v-dialog v-model="showSaveDialog" max-width="440">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Konfirmasi Simpan Surat Jalan
        </v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin membuat Surat Jalan Hasil Maklon untuk
          <strong>{{ formData.Items.length }} item</strong> dari No. Maklon
          <strong>{{ formData.MklNomor }}</strong> dengan total terima
          <strong class="text-success">{{ formatNumber(totalQtyHasil) }} pcs</strong>
          <span v-if="totalBs > 0"> dan BS <strong>{{ formatNumber(totalBs) }}</strong></span>?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showSaveDialog = false">Batal</v-btn>
          <v-btn color="primary" :loading="isSaving" @click="executeSave">
            Ya, Simpan SJ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format } from "date-fns";
import { sjHasilMaklonService } from "@/services/sjHasilMaklonService";

interface SjHasilItem {
  DtfMaklonId?: number | string;
  DtfMaklonHasilId?: number | string;
  KodeHasil: string;
  NamaHasil: string;
  KodePolos?: string;
  NamaPolos?: string;
  Satuan: string;
  QtyHasil: number;
  BsAfval: number;
  LhkNomor: string;
  LhkUrut?: number;
  MkldId?: number;
  Sumber?: string;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const rawQueryIds = (route.query.ids as string) || "";
const initialIds = rawQueryIds
  ? rawQueryIds.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

const isDirectInput = ref(initialIds.length === 0);
const isLoading = ref(false);
const isLoadingAvailable = ref(false);
const isSaving = ref(false);
const showSaveDialog = ref(false);
const errorMessage = ref("");

const availableMaklons = ref<any[]>([]);
const selectedMklNomor = ref<string | null>(null);

const formData = reactive({
  MklNomor: "",
  CabAsal: "",
  NamaCabAsal: "",
  Sumber: "P05",
  Tanggal: format(new Date(), "yyyy-MM-dd"),
  Items: [] as SjHasilItem[],
});

const totalQtyHasil = computed(() =>
  formData.Items.reduce((sum, item) => sum + (Number(item.QtyHasil) || 0), 0),
);

const totalBs = computed(() =>
  formData.Items.reduce((sum, item) => sum + (Number(item.BsAfval) || 0), 0),
);

const formatNumber = (val?: any) => {
  const n = Number(val);
  return Number.isFinite(n) ? n.toLocaleString("id-ID") : "0";
};

const removeItem = (idx: number) => {
  formData.Items.splice(idx, 1);
};

// Ambil daftar Maklon yang memiliki LHK outstanding untuk opsi dropdown
const fetchAvailableMaklons = async () => {
  isLoadingAvailable.value = true;
  try {
    const res = await sjHasilMaklonService.getAvailableMaklon();
    const list = res.data?.data || res.data || [];
    availableMaklons.value = list.map((m: any) => ({
      MklNomor: m.MklNomor,
      Sumber: m.Sumber,
      label: `${m.MklNomor} — ${m.NamaCabAsal || m.CabAsal} ➜ ${m.NamaCabTujuan || m.CabTujuan} (${m.Keterangan || "-"})`,
      subtitle: `Total Hasil: ${Number(m.TotalQtyHasil || 0).toLocaleString("id-ID")} pcs (${m.JmlLhk || 1} LHK) [${m.Sumber}]`,
      raw: m,
    }));
  } catch (err: any) {
    console.error("Gagal memuat daftar Maklon available:", err);
  } finally {
    isLoadingAvailable.value = false;
  }
};

// Ketika user memilih nomor maklon dari autocomplete
const onSelectMaklon = async (nomor: string | null) => {
  if (!nomor) {
    formData.MklNomor = "";
    formData.CabAsal = "";
    formData.NamaCabAsal = "";
    formData.Items = [];
    return;
  }
  await loadData({ mklNomor: nomor });
};

// Muat data create dari ids atau mklNomor
const loadData = async ({ ids = [] as (string | number)[], mklNomor = "" }) => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const res = await sjHasilMaklonService.getCreateData(ids, mklNomor);
    const { header, items } = res.data?.data ?? res.data;

    if (!header || !items || !items.length) {
      throw new Error("Tidak ada data LHK yang ditemukan untuk Maklon ini.");
    }

    formData.MklNomor = header.mkl_nomor;
    formData.CabAsal = header.mkl_cab_asal;
    formData.NamaCabAsal = header.NamaCabAsal || header.mkl_cab_asal;
    formData.Sumber = items[0]?.Sumber || "P05";
    formData.Tanggal = format(new Date(), "yyyy-MM-dd");
    selectedMklNomor.value = header.mkl_nomor;

    formData.Items = items.map((r: any) => ({
      DtfMaklonId: r.DtfMaklonId,
      DtfMaklonHasilId: r.DtfMaklonHasilId,
      KodeHasil: r.KodeHasil,
      NamaHasil: r.NamaHasil || r.KodeHasil,
      KodePolos: r.KodePolos,
      NamaPolos: r.NamaPolos || r.KodePolos,
      Satuan: r.Satuan || "PCS",
      QtyHasil: Number(r.QtyHasil) || 0,
      BsAfval: Number(r.BsAfval) || 0,
      LhkNomor: r.LhkNomor || "",
      LhkUrut: r.LhkUrut || 0,
      MkldId: r.MkldId || null,
      Sumber: r.Sumber || "P05",
    }));
  } catch (err: any) {
    console.error("Gagal memuat data create SJ Hasil Maklon:", err);
    errorMessage.value = err.response?.data?.message || err.message || "Gagal memuat data.";
    toast.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (initialIds.length > 0) {
    // Mode dengan ID dari tabel browse
    await loadData({ ids: initialIds });
  } else {
    // Mode input baru langsung
    await fetchAvailableMaklons();
  }
});

const onCancel = () => {
  router.push("/mmt/sj-hasil-maklon");
};

const onClickSave = () => {
  if (!formData.MklNomor) {
    toast.warning("Silakan pilih No. Maklon terlebih dahulu.");
    return;
  }
  if (!formData.Items.length) {
    toast.warning("Daftar item tidak boleh kosong.");
    return;
  }
  if (totalQtyHasil.value <= 0 && totalBs.value <= 0) {
    toast.warning("Qty Diterima atau BS harus lebih dari 0.");
    return;
  }
  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  isSaving.value = true;
  try {
    const payload = {
      tanggal: formData.Tanggal,
      mklNomor: formData.MklNomor,
      ids: formData.Items.map((i) => i.DtfMaklonHasilId || i.DtfMaklonId),
      items: formData.Items.map((i) => ({
        dtf_maklon_hasil_id: i.Sumber === "DTF" ? Number(i.DtfMaklonHasilId) : null,
        dtf_maklon_id: i.Sumber === "DTF" ? Number(i.DtfMaklonId) : null,
        mkld_id: i.MkldId || null,
        kode_jadi: i.KodeHasil,
        qty_terima: Number(i.QtyHasil) || 0,
        qty_bs: Number(i.BsAfval) || 0,
        lhk_nomor: i.LhkNomor || "",
        sumber: i.Sumber || "P05",
      })),
    };

    const res = await sjHasilMaklonService.create(payload);
    const nomor = res.data?.data?.nomor || "";
    toast.success(`SJ Hasil Maklon ${nomor} berhasil disimpan.`);

    if (nomor) {
      const url = router.resolve({
        name: "SjHasilMaklonPrint",
        params: { nomor },
      }).href;
      window.open(url, "_blank");
    }

    router.push("/mmt/sj-hasil-maklon");
  } catch (err: any) {
    console.error("Gagal menyimpan SJ Hasil Maklon:", err);
    toast.error(err.response?.data?.message || err.message || "Gagal menyimpan SJ Hasil Maklon.");
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form-content {
  max-width: 1100px;
}
.qty-field :deep(.v-field__input) {
  text-align: right;
  font-weight: bold;
  padding: 4px 8px;
}
</style>
