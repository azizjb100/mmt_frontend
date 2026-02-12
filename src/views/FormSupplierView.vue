<template>
  <PageLayout
    :title="isEditMode ? 'Ubah Supplier' : 'Tambah Supplier Baru'"
    icon="mdi-truck-plus"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="error"
        class="mr-2"
        @click="handleDelete"
        v-if="isEditMode"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus (F5)
      </v-btn>
      <v-btn size="small" color="warning" class="mr-2" @click="refreshData">
        <v-icon start>mdi-refresh</v-icon> Batal (F7)
      </v-btn>
      <v-btn size="small" color="success" @click="handleSave" :loading="saving">
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
    </template>

    <v-form ref="formSupplier">
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4">
              <v-card-title class="text-subtitle-1 font-weight-bold"
                >Informasi Supplier</v-card-title
              >
              <v-divider class="mb-4"></v-divider>

              <v-text-field
                v-model="form.Kode"
                label="Kode Supplier"
                hint="F1 untuk bantuan / Kosongkan untuk nomor otomatis"
                persistent-hint
                density="compact"
                :readonly="isEditMode"
                @keydown.f1.prevent="openBantuan"
                @blur="onKodeBlur"
              />

              <v-text-field
                v-model="form.Nama"
                label="Nama Supplier"
                density="compact"
                required
                :rules="[(v) => !!v || 'Nama wajib diisi']"
              />
              <v-text-field
                v-model="form.Alamat"
                label="Alamat"
                density="compact"
              />
              <v-text-field
                v-model="form.Kota"
                label="Kota"
                density="compact"
              />

              <v-row>
                <v-col
                  ><v-text-field
                    v-model="form.Telp"
                    label="Telepon"
                    density="compact"
                /></v-col>
                <v-col
                  ><v-text-field
                    v-model="form.Fax"
                    label="Fax"
                    density="compact"
                /></v-col>
              </v-row>

              <v-text-field
                v-model="form.Contact"
                label="Kontak Person (CP)"
                density="compact"
              />
              <v-textarea
                v-model="form.Keterangan"
                label="Keterangan"
                rows="2"
                density="compact"
              />
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4 mb-4">
              <v-card-title class="text-subtitle-1 font-weight-bold"
                >Perpajakan (NPWP)</v-card-title
              >
              <v-divider class="mb-4"></v-divider>
              <v-text-field
                v-model="form.KodeNPWP"
                label="Nomor NPWP"
                density="compact"
              />
              <v-text-field
                v-model="form.NamaNPWP"
                label="Nama di NPWP"
                density="compact"
              />
              <v-text-field
                v-model="form.AlamatNPWP"
                label="Alamat NPWP"
                density="compact"
              />
            </v-card>

            <v-card variant="outlined" class="pa-4">
              <v-card-title class="text-subtitle-1 font-weight-bold"
                >Informasi Perbankan</v-card-title
              >
              <v-divider class="mb-4"></v-divider>
              <v-text-field
                v-model="form.Bank"
                label="Nama Bank"
                density="compact"
              />
              <v-text-field
                v-model="form.NoRekening"
                label="No. Rekening"
                density="compact"
              />
              <v-text-field
                v-model="form.AtasNama"
                label="Atas Nama"
                density="compact"
              />
              <v-text-field
                v-model="form.Cabang"
                label="Cabang"
                density="compact"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-form>

    <v-dialog v-model="dialogBantuan" max-width="600px">
      <v-card>
        <v-card-title>Pilih Supplier</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersBantuan"
            :items="listBantuan"
            hover
            @click:row="(e, { item }) => selectSupplier(item.Kode)"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isEditMode = ref(false);
const saving = ref(false);
const dialogBantuan = ref(false);
const listBantuan = ref([]);

// Initial State (Replikasi refreshdata di Delphi)
const form = reactive({
  Kode: "",
  Nama: "",
  Alamat: "",
  Kota: "",
  Telp: "",
  Fax: "",
  Contact: "",
  KodeNPWP: "",
  NamaNPWP: "",
  AlamatNPWP: "",
  KotaNPWP: "",
  Top: 0,
  TargetMitra: 0,
  NoRekening: "",
  Bank: "",
  AtasNama: "",
  Cabang: "",
  Keterangan: "",
  SaldoHutang: 0,
});

const headersBantuan = [
  { title: "Kode", key: "Kode" },
  { title: "Nama", key: "Nama" },
  { title: "Alamat", key: "Alamat" },
];

// --- LOGIKA CORE ---

const loadData = async (kode: string) => {
  if (!kode) return;
  try {
    const response = await api.get(`/api/master/supplier/${kode}`);
    if (response.data.data) {
      Object.assign(form, response.data.data);
      isEditMode.value = true;
    } else {
      toast.info("Kode tersebut belum ada");
    }
  } catch (e) {
    toast.error("Gagal memuat data");
  }
};

const onKodeBlur = () => {
  if (!isEditMode.value && form.Kode) {
    loadData(form.Kode);
  }
};

const handleSave = async () => {
  if (!form.Nama) {
    toast.warning("Nama Supplier belum diisi");
    return;
  }

  if (!confirm("Yakin ingin simpan?")) return;

  saving.value = true;
  try {
    const payload = { header: form, isEditMode: isEditMode.value };
    const response = await api.post("/api/master/supplier/save", payload);
    toast.success(`Tersimpan dengan kode: ${response.data.kode}`);
    refreshData();
  } catch (e: any) {
    toast.error("Gagal Simpan: " + e.message);
  } finally {
    saving.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm("Yakin ingin hapus?")) return;
  try {
    await api.delete(`/api/master/supplier/${form.Kode}`);
    toast.success("Berhasil hapus");
    refreshData();
  } catch (e) {
    toast.error("Gagal hapus");
  }
};

const refreshData = () => {
  Object.assign(form, {
    Kode: "",
    Nama: "",
    Alamat: "",
    Kota: "",
    Telp: "",
    Fax: "",
    Contact: "",
    KodeNPWP: "",
    NamaNPWP: "",
    AlamatNPWP: "",
    Top: 0,
    TargetMitra: 0,
    NoRekening: "",
    Bank: "",
    AtasNama: "",
    Cabang: "",
    Keterangan: "",
    SaldoHutang: 0,
  });
  isEditMode.value = false;
};

// --- SHORTCUTS (Replikasi FormKeyDown) ---
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "F10") {
    e.preventDefault();
    handleSave();
  }
  if (e.key === "F7") {
    e.preventDefault();
    refreshData();
  }
  if (e.key === "F5" && isEditMode.value) {
    e.preventDefault();
    handleDelete();
  }
};

const openBantuan = async () => {
  const res = await api.get("/api/master/supplier");
  listBantuan.value = res.data.data;
  dialogBantuan.value = true;
};

const selectSupplier = (kode: string) => {
  form.Kode = kode;
  loadData(kode);
  dialogBantuan.value = false;
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  if (route.params.kode) loadData(route.params.kode as string);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>
