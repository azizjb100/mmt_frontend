<template>
  <PageLayout title="Data Mutasi Gudang MMT" icon="mdi-swap-horizontal">
    <template #header-actions>
      <v-card flat class="mb-2 bg-transparent">
        <div class="d-flex ga-2 pa-2">
          <v-btn size="small" color="success" @click="handleNewEdit('new')">
            <v-icon start>mdi-plus</v-icon> Baru
          </v-btn>
          <v-btn
            size="small"
            color="warning"
            :disabled="!isSingleSelected"
            @click="handleNewEdit('edit')"
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
            <v-icon start>mdi-printer</v-icon> Cetak
          </v-btn>
        </div>
      </v-card>
    </template>
    <div class="browse-content">
      <v-card flat class="mb-4 border">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
            />
            <v-label>s/d</v-label>
            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
            />
            <v-btn
              color="primary"
              variant="elevated"
              size="small"
              @click="fetchData"
            >
              <v-icon start>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="headers"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          show-select
          return-object
          show-expand
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal ? format(new Date(item.Tanggal), "dd/MM/yyyy") : "-"
            }}
          </template>

          <template #item.Status="{ item }">
            <v-chip
              size="x-small"
              :color="item.Status === 1 ? 'success' : 'warning'"
            >
              {{ item.Status === 1 ? "Selesai" : "Draft" }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="pa-4 bg-grey-lighten-4">
                  <v-data-table
                    :headers="detailHeaders"
                    :items="item.Details || []"
                    density="compact"
                    hide-default-footer
                    class="elevation-0"
                  >
                    <template #item.Qty="{ item: d }">
                      {{ Number(d.Qty).toFixed(2) }}
                    </template>
                    <template #item.Expired="{ item: d }">
                      {{
                        d.Expired
                          ? format(new Date(d.Expired), "dd/MM/yyyy")
                          : "-"
                      }}
                    </template>
                  </v-data-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>

    <v-dialog v-model="dialog" persistent max-width="950px">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          <span>{{ isEdit ? "Ubah" : "Input" }} Mutasi Gudang</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="formHeader.Nomor"
                  label="Nomor Mutasi"
                  readonly
                  density="compact"
                  variant="underlined"
                  hint="Otomatis"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="formHeader.Tanggal"
                  type="date"
                  label="Tanggal"
                  density="compact"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formHeader.Keterangan"
                  label="Keterangan"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="formHeader.GudangAsal"
                  :items="listGudang"
                  item-title="nama"
                  item-value="kode"
                  label="Gudang Asal"
                  density="compact"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="formHeader.GudangTujuan"
                  :items="listGudang"
                  item-title="nama"
                  item-value="kode"
                  label="Gudang Tujuan"
                  density="compact"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-2 font-weight-bold">Item Detail</span>
              <v-spacer />
              <v-btn
                size="x-small"
                color="primary"
                prepend-icon="mdi-plus"
                @click="addDetailRow"
                >Tambah Baris</v-btn
              >
            </div>

            <v-table density="compact" class="elevation-1 border">
              <thead>
                <tr>
                  <th width="200">Kode Barang</th>
                  <th>Nama Barang</th>
                  <th width="100">Qty</th>
                  <th width="150">Expired</th>
                  <th>Keterangan</th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formDetails" :key="index">
                  <td>
                    <v-text-field
                      v-model="item.kode_barang"
                      density="compact"
                      hide-details
                      variant="plain"
                      placeholder="Scan/Ketik..."
                    />
                  </td>
                  <td
                    class="text-caption text-truncate"
                    style="max-width: 200px"
                  >
                    {{ item.nama_barang || "-" }}
                  </td>
                  <td>
                    <v-text-field
                      v-model.number="item.qty"
                      type="number"
                      density="compact"
                      hide-details
                      variant="plain"
                    />
                  </td>
                  <td>
                    <v-text-field
                      v-model="item.expired"
                      type="date"
                      density="compact"
                      hide-details
                      variant="plain"
                    />
                  </td>
                  <td>
                    <v-text-field
                      v-model="item.keterangan"
                      density="compact"
                      hide-details
                      variant="plain"
                    />
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-delete"
                      size="x-small"
                      color="error"
                      variant="text"
                      @click="formDetails.splice(index, 1)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="grey" variant="text" @click="closeDialog">Batal</v-btn>
          <v-btn color="primary" :loading="saveLoading" @click="saveData"
            >Simpan Mutasi</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, subDays } from "date-fns";

const API_MUTASI = "/mmt/mutasi-gudang";
const toast = useToast();
const loading = ref(false);
const masterData = ref<any[]>([]);
const selected = ref<any[]>([]);
const expanded = ref<string[]>([]);
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- State Form/Dialog ---
const router = useRouter();
const dialog = ref(false);
const isEdit = ref(false);
const saveLoading = ref(false);
const formRef = ref<any>(null);
const listGudang = ref([
  { kode: "WH-16", nama: "Gudang MMT" },
  { kode: "WH-20", nama: "Gudang Obat" },
  { kode: "GPM", nama: "Gudang Produksi" },
]);

const formHeader = reactive({
  Nomor: "AUTO",
  Tanggal: format(new Date(), "yyyy-MM-dd"),
  GudangAsal: "",
  GudangTujuan: "",
  Keterangan: "",
  Type: 0,
});
const formDetails = ref<any[]>([]);

// --- Headers Tabel ---
const headers = [
  { title: "Nomor", key: "Nomor", width: "180px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Asal", key: "Asal", width: "100px" },
  { title: "Tujuan", key: "Tujuan", width: "100px" },
  { title: "Keterangan", key: "Keterangan" },
  { title: "Status", key: "Status", width: "100px" },
  { title: "", key: "data-table-expand" },
];

const detailHeaders = [
  { title: "Kode", key: "Kode" },
  { title: "Nama Barang", key: "Nama_Barang" },
  { title: "Qty", key: "Qty", align: "end" },
  { title: "Expired", key: "Expired" },
  { title: "Ket", key: "Ket" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(API_MUTASI, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data;
  } catch (e: any) {
    toast.error("Gagal ambil data: " + e.message);
  } finally {
    loading.value = false;
  }
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "MutasiGudangNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "MutasiProduksiEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const resetForm = () => {
  Object.assign(formHeader, {
    Nomor: "AUTO",
    Tanggal: format(new Date(), "yyyy-MM-dd"),
    GudangAsal: "",
    GudangTujuan: "",
    Keterangan: "",
    Type: 0,
  });
  formDetails.value = [];
};

const addDetailRow = () => {
  formDetails.value.push({
    kode_barang: "",
    nama_barang: "",
    qty: 1,
    expired: null,
    keterangan: "",
  });
};

const closeDialog = () => {
  dialog.value = false;
};

const saveData = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  if (formDetails.value.length === 0)
    return toast.warning("Detail barang masih kosong");

  saveLoading.value = true;
  try {
    const payload = { ...formHeader, Details: formDetails.value };
    if (isEdit.value) {
      await api.put(`${API_MUTASI}/${formHeader.Nomor}`, payload);
    } else {
      await api.post(API_MUTASI, payload);
    }
    toast.success("Mutasi berhasil disimpan");
    dialog.value = false;
    fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal simpan");
  } finally {
    saveLoading.value = false;
  }
};

const handleDelete = async () => {
  const nomor = selected.value[0].Nomor;
  if (!confirm(`Hapus mutasi ${nomor}?`)) return;
  try {
    await api.delete(`${API_MUTASI}/${nomor}`);
    toast.success("Data dihapus");
    fetchData();
  } catch (e) {
    toast.error("Gagal hapus");
  }
};

const handlePrint = () => {
  alert("Fungsi cetak untuk: " + selected.value[0].Nomor);
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>
