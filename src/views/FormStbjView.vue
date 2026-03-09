<template>
  <PageLayout
    :title="isEdit ? 'Edit STBJ' : 'Input Barang Jadi (STBJ)'"
    icon="mdi-package-variant-closed"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        prepend-icon="mdi-content-save"
        @click="saveData"
        :loading="submitting"
      >
        Simpan
      </v-btn>
      <v-btn variant="outlined" class="ml-2" @click="$router.back()"
        >Batal</v-btn
      >
    </template>

    <v-row>
      <!-- Panel Header -->
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <v-row density="compact">
            <v-col cols="12" md="3">
              <v-text-field
                v-model="store.header.stbj_nomor"
                label="Nomor STBJ"
                readonly
                variant="filled"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="store.header.stbj_tanggal"
                label="Tanggal"
                type="date"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="d-flex ga-2">
                <v-text-field
                  v-model="store.header.stbj_gdg_kode"
                  label="Gudang Tujuan"
                  readonly
                  variant="outlined"
                  density="compact"
                  style="max-width: 120px"
                />
                <v-text-field
                  v-model="store.header.stbj_gdg_nama"
                  readonly
                  variant="filled"
                  density="compact"
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openGudangHelp"
                />
              </div>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="store.header.stbj_keterangan"
                label="Keterangan"
                rows="2"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Panel Detail Grid -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-table density="compact" class="stbj-table">
            <thead>
              <tr>
                <th class="text-center" width="50">No</th>
                <th width="200">No. SPK</th>
                <th>Nama Barang / Item</th>
                <th width="100">Size</th>
                <th width="120">Jumlah</th>
                <th width="100">Koli</th>
                <th width="50"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in store.details" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td>
                  <v-text-field
                    v-model="item.stbjd_spk_nomor"
                    placeholder="Input SPK..."
                    variant="plain"
                    hide-details
                    @keyup.enter="handleSPKLookup(index)"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="item.nama_barang"
                    readonly
                    variant="plain"
                    hide-details
                    class="text-grey"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="item.stbjd_size"
                    variant="plain"
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="item.stbjd_jumlah"
                    type="number"
                    variant="plain"
                    hide-details
                    class="text-right font-weight-bold"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="item.stbjd_koli"
                    type="number"
                    variant="plain"
                    hide-details
                    class="text-right"
                  />
                </td>
                <td>
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    color="error"
                    variant="text"
                    @click="store.removeDetail(index)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-divider />
          <v-card-actions>
            <v-btn
              prepend-icon="mdi-plus"
              size="small"
              color="success"
              @click="store.addDetail"
            >
              Tambah Baris (F2)
            </v-btn>
            <v-spacer />
            <div class="mr-4 text-h6">
              Total Qty: <span class="text-primary">{{ totalQty }}</span>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Bantuan Gudang -->
    <v-dialog v-model="showGudangHelp" width="600">
      <!-- Komponen bantuan gudang Anda di sini -->
    </v-dialog>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useStbjStore } from "@/stores/stbjStore";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";

const store = useStbjStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const submitting = ref(false);
const showGudangHelp = ref(false);
const isEdit = computed(() => !!route.params.nomor);

// Computed total qty mirip summary di Grid Delphi
const totalQty = computed(() => {
  return store.details.reduce((sum, item) => sum + (item.stbjd_jumlah || 0), 0);
});

const handleSPKLookup = async (index: number) => {
  const spk = store.details[index].stbjd_spk_nomor;
  if (!spk) return;

  try {
    const res = await api.get(`/bantuan/spk-stbj/${spk}`);
    store.details[index].nama_barang = res.data.nama;
    store.details[index].stbjd_size = res.data.ukuran;
    // Logika auto-focus ke kolom jumlah
  } catch (e) {
    toast.error("Nomor SPK tidak ditemukan");
  }
};

const saveData = async () => {
  // Validasi seperti di Delphi
  if (!store.header.stbj_gdg_kode) {
    return toast.warning("Gudang harus diisi!");
  }
  if (store.details.length === 0) {
    return toast.warning("Detail barang masih kosong!");
  }

  submitting.value = true;
  try {
    const payload = {
      header: store.header,
      details: store.details,
    };

    if (isEdit.value) {
      await api.put(`/stbj/${store.header.stbj_nomor}`, payload);
    } else {
      await api.post("/stbj", payload);
    }

    toast.success("STBJ Berhasil Disimpan");
    router.push({ name: "StbjBrowse" });
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Gagal menyimpan STBJ");
  } finally {
    submitting.value = false;
  }
};

const openGudangHelp = () => {
  showGudangHelp.value = true;
};

onMounted(() => {
  if (isEdit.value) {
    store.loadSTBJ(route.params.nomor as string);
  } else {
    store.$reset();
    store.addDetail();
  }
});
</script>

<style scoped>
.stbj-table :deep(th) {
  background-color: #eceff1 !important;
  font-weight: bold !important;
  color: #455a64 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.stbj-table :deep(td) {
  padding: 0 8px !important;
  border-right: 1px solid #f0f0f0;
}

/* Membuat input dalam table terlihat bersih */
.stbj-table :deep(.v-field__input) {
  padding: 4px 0 !important;
  min-height: 32px !important;
}
</style>
