<template>
  <PageLayout
    title="Input Kerja Finishing (Pra-LHK)"
    icon="mdi-ray-start-arrow"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        @click="handleSaveDraft"
        :loading="isSaving"
        :disabled="detailData.length === 0"
      >
        <v-icon start>mdi-content-save-edit</v-icon> Simpan ke Pra-LHK
      </v-btn>
    </template>

    <v-row>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4">
          <v-select
            label="Jenis Proses"
            v-model="formData.proses"
            :items="daftarProses"
            item-title="title"
            item-value="value"
            variant="solo-filled"
            class="mb-3"
          />
          <v-text-field
            label="Tanggal Kerja"
            type="date"
            v-model="formData.tanggal"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            label="Shift"
            type="number"
            v-model.number="formData.shift"
            variant="outlined"
            density="compact"
          />

          <v-divider class="my-3" />
          <div class="text-caption font-weight-bold">Informasi:</div>
          <div class="text-body-2 text-grey">
            Data ini akan tersimpan di tabel <strong>Pra-LHK (tpra)</strong>.
            Admin akan melakukan bundling data ini untuk menerbitkan nomor LHK
            resmi.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center bg-grey-lighten-4">
            Rincian Pekerjaan - {{ formData.proses }}
            <v-spacer />
            <v-btn
              color="success"
              size="small"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
            >
              Pilih SPK
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="dynamicHeaders"
            :items="detailData"
            density="compact"
            no-data-text="Belum ada SPK yang dipilih"
          >
            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty_hasil"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-end"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="detailData.splice(index, 1)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <SpkLookupModal
      :isVisible="isSpkModalVisible"
      @select="addSpk"
      @close="isSpkModalVisible = false"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue"; // Pastikan path benar

const toast = useToast();
const isSaving = ref(false);
const isSpkModalVisible = ref(false);

const daftarProses = [
  { title: "POTONG", value: "POTONG" },
  { title: "SEAMING", value: "SEAMING" },
  { title: "MATA AYAM", value: "MATA_AYAM" }, // Tampilan pakai spasi, value pakai underscore
  { title: "KOLI", value: "KOLI" },
];

const formData = reactive({
  proses: "POTONG",
  tanggal: new Date().toISOString().substr(0, 10),
  shift: 1,
});

const detailData = ref<any[]>([]);

// Header tabel yang dinamis mengikuti jenis proses yang dipilih
const dynamicHeaders = computed(() => [
  { title: "No SPK", key: "spk_nomor", width: "150px" },
  { title: "Nama Produk", key: "spk_nama" },
  {
    title: `Hasil ${formData.proses}`,
    key: "qty",
    width: "150px",
    align: "end",
  },
  { title: "", key: "actions", width: "50px", sortable: false },
]);

const openSpkSearch = () => (isSpkModalVisible.value = true);

// Fungsi untuk menangkap data dari SpkLookupModal
const addSpk = (spk: any) => {
  // Cek agar SPK yang sama tidak diinput dua kali dalam satu sesi input
  const isExist = detailData.value.some(
    (d) => d.spk_nomor === (spk.Spk || spk.spk_nomor),
  );

  if (isExist) {
    toast.warning("SPK ini sudah ada di daftar rincian");
    return;
  }

  detailData.value.push({
    spk_nomor: spk.Spk || spk.spk_nomor, // Mengambil data dari modal
    spk_nama: spk.Nama || spk.spk_nama,
    qty_hasil: 0,
    qty_bs: 0,
  });

  isSpkModalVisible.value = false;
};

const handleSaveDraft = async () => {
  if (detailData.value.length === 0) {
    toast.error("Rincian pekerjaan masih kosong");
    return;
  }

  isSaving.value = true;
  try {
    // Mapping data agar sesuai dengan struktur kolom tabel tpra_lhk_finishing di backend
    const payload = {
      details: detailData.value.map((item) => ({
        spk_nomor: item.spk_nomor,
        spk_nama: item.spk_nama,
        proses_kategori: formData.proses,
        qty_hasil: item.qty_hasil,
        qty_bs: item.qty_bs || 0,
        tgl_input: formData.tanggal,
        shift_input: formData.shift,
        is_bundled: false,
      })),
    };

    // Pastikan endpoint ini sesuai dengan route POST /pra yang kita buat di backend
    await api.post("/mmt/lhk-finishing/pra", payload);

    toast.success("Berhasil menyimpan ke Pra-LHK");
    detailData.value = []; // Bersihkan tabel setelah berhasil
  } catch (e: any) {
    console.error("Save Error:", e);
    toast.error(e.response?.data?.message || "Gagal menyimpan draft pekerjaan");
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.v-card-title {
  font-size: 0.95rem !important;
  font-weight: bold;
}
</style>
