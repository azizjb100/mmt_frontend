<template>
  <PageLayout :title="formTitle" icon="mdi-factory">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan Data
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar
      </v-btn>
    </template>

    <v-row dense>
      <!-- Panel Kiri: Header Info (advpnl3 di Delphi) -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="formData.nomor"
                label="Nomor LHK"
                readonly
                density="compact"
                variant="filled"
                color="primary"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.tanggal"
                label="Tanggal"
                type="date"
                density="compact"
                variant="outlined"
                @change="fetchMaxKode"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.gdgKode"
                label="Gudang Produksi"
                append-inner-icon="mdi-magnify"
                density="compact"
                variant="outlined"
                readonly
                @click:append-inner="openGudangLookup"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="formData.shift"
                label="Shift"
                type="number"
                density="compact"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Panel Kanan: Grid Detail (cxGrid1 di Delphi) -->
      <v-col cols="12" md="8">
        <v-card variant="outlined">
          <v-table density="compact" class="lhk-table">
            <thead>
              <tr class="bg-grey-lighten-3">
                <th class="text-center" width="50">No</th>
                <th width="150">Mesin</th>
                <th width="180">Nomor SPK / Nama</th>
                <th width="150">Bahan (Media)</th>
                <th width="100">Qty Cetak</th>
                <th class="text-center bg-cyan-lighten-5">Cyan</th>
                <th class="text-center bg-magenta-lighten-5">Mag</th>
                <th class="text-center bg-yellow-lighten-5">Yel</th>
                <th class="text-center bg-grey-lighten-4">Blk</th>
                <th width="50"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in detailData" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <!-- Mesin (clmesin) -->
                <td>
                  <v-text-field
                    v-model="item.mesin"
                    placeholder="Pilih Mesin"
                    density="compact"
                    hide-details
                    readonly
                    variant="plain"
                    append-inner-icon="mdi-dots-horizontal"
                    @click:append-inner="openMesinLookup(index)"
                  />
                </td>
                <!-- SPK (cxspk_nomor) -->
                <td>
                  <div class="text-caption font-weight-bold text-primary">
                    {{ item.spk_nomor }}
                  </div>
                  <v-text-field
                    v-model="item.spk_nama"
                    placeholder="Pilih SPK"
                    density="compact"
                    hide-details
                    readonly
                    variant="plain"
                    append-inner-icon="mdi-magnify"
                    @click:append-inner="openSpkLookup(index)"
                  />
                </td>
                <!-- Bahan (clbrg_kode) -->
                <td>
                  <v-text-field
                    v-model="item.brg_nama"
                    placeholder="Pilih Bahan"
                    density="compact"
                    hide-details
                    readonly
                    variant="plain"
                    append-inner-icon="mdi-rhombus-split"
                    @click:append-inner="openBahanLookup(index)"
                  />
                </td>
                <!-- Qty (cljqty_cetak) -->
                <td>
                  <v-text-field
                    v-model.number="item.jumlah_cetak"
                    type="number"
                    density="compact"
                    hide-details
                    variant="underlined"
                    class="font-weight-black"
                  />
                </td>
                <!-- Tinta (Logic cl_c, cl_m, etc) -->
                <td class="bg-cyan-lighten-5">
                  <v-text-field
                    v-model="item.c_kode"
                    density="compact"
                    hide-details
                    variant="plain"
                    @click="openTintaLookup(index, 'CYAN')"
                  />
                </td>
                <td class="bg-magenta-lighten-5">
                  <v-text-field
                    v-model="item.m_kode"
                    density="compact"
                    hide-details
                    variant="plain"
                    @click="openTintaLookup(index, 'MAGENTA')"
                  />
                </td>
                <td class="bg-yellow-lighten-5">
                  <v-text-field
                    v-model="item.y_kode"
                    density="compact"
                    hide-details
                    variant="plain"
                    @click="openTintaLookup(index, 'YELLOW')"
                  />
                </td>
                <td class="bg-grey-lighten-4">
                  <v-text-field
                    v-model="item.k_kode"
                    density="compact"
                    hide-details
                    variant="plain"
                    @click="openTintaLookup(index, 'BLACK')"
                  />
                </td>
                <td>
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    color="red"
                    variant="text"
                    @click="removeRow(index)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-card-actions>
            <v-btn
              prepend-icon="mdi-plus"
              size="small"
              color="success"
              @click="addNewRow"
              >Tambah Baris</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal Lookups -->
    <GenericLookup
      v-model="lookup.show"
      :title="lookup.title"
      :api-url="lookup.url"
      @select="handleLookupSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";

const toast = useToast();
const isSaving = ref(false);
const activeRowIndex = ref(-1);
const activeTintaType = ref("");

const formData = reactive({
  nomor: "",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdgKode: "GPM",
  gdgNama: "GUDANG PRODUKSI MMT",
  shift: 1,
});

const detailData = ref<any[]>([]);

const lookup = reactive({
  show: false,
  title: "",
  url: "",
  type: "", // 'GUDANG' | 'MESIN' | 'SPK' | 'BAHAN' | 'TINTA'
});

// --- Logika GetMaxKode (Delphi: getmaxkode) ---
const fetchMaxKode = async () => {
  try {
    const res = await api.get("/mmt/lhk/next-number", {
      params: { date: formData.tanggal, prefix: "MMT-LHK-T" },
    });
    formData.nomor = res.data.nomor;
  } catch (e) {
    toast.error("Gagal mengambil nomor urut");
  }
};

// --- Logika Initialize Grid (Delphi: initgrid) ---
const addNewRow = () => {
  detailData.value.push({
    mesin: "",
    spk_nomor: "",
    spk_nama: "",
    brg_kode: "",
    brg_nama: "",
    jumlah_cetak: 0,
    c_kode: "",
    m_kode: "",
    y_kode: "",
    k_kode: "",
    c_qty: 0,
    m_qty: 0,
    y_qty: 0,
    k_qty: 0,
  });
};

// --- Penanganan Modal Lookup (Delphi: FormBantuan) ---
const openSpkLookup = (index: number) => {
  activeRowIndex.value = index;
  lookup.title = "Cari SPK";
  lookup.url = "/mmt/help/spk";
  lookup.type = "SPK";
  lookup.show = true;
};

const openTintaLookup = (index: number, color: string) => {
  activeRowIndex.value = index;
  activeTintaType.value = color;
  lookup.title = `Cari Tinta ${color}`;
  lookup.url = `/mmt/help/tinta?color=${color}`;
  lookup.type = "TINTA";
  lookup.show = true;
};

const handleLookupSelect = (data: any) => {
  const row = detailData.value[activeRowIndex.value];

  if (lookup.type === "SPK") {
    row.spk_nomor = data.spk_nomor;
    row.spk_nama = data.spk_nama;
    // Logika Delphi: ambil panjang/lebar SPK jika diperlukan
  } else if (lookup.type === "TINTA") {
    if (activeTintaType.value === "CYAN") row.c_kode = data.brg_kode;
    if (activeTintaType.value === "MAGENTA") row.m_kode = data.brg_kode;
    if (activeTintaType.value === "YELLOW") row.y_kode = data.brg_kode;
    if (activeTintaType.value === "BLACK") row.k_kode = data.brg_kode;
  } else if (lookup.type === "BAHAN") {
    row.brg_kode = data.brg_kode;
    row.brg_nama = data.brg_nama;
  }
  lookup.show = false;
};

// --- Logika Simpan (Delphi: simpandata) ---
const handleSave = async () => {
  if (detailData.value.length === 0)
    return toast.warning("Detail masih kosong");

  const confirmSave = confirm("Simpan data LHK Tekstil?");
  if (!confirmSave) return;

  isSaving.value = true;
  try {
    const payload = {
      header: {
        lth_nomor: formData.nomor,
        lth_tanggal: formData.tanggal,
        lth_gdg_prod: formData.gdgKode,
        lth_shift: formData.shift,
      },
      details: detailData.value.map((item, index) => ({
        ...item,
        ltd_no_urut: index + 1,
      })),
    };

    await api.post("/mmt/lhk-tekstil/save", payload);
    toast.success("Data berhasil disimpan");
    resetForm();
  } catch (e: any) {
    toast.error("Gagal simpan: " + e.message);
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  detailData.value = [];
  addNewRow();
  fetchMaxKode();
};

onMounted(() => {
  resetForm();
});
</script>

<style scoped>
.lhk-table :deep(input) {
  text-align: center;
  font-size: 0.85rem;
}

.bg-cyan-lighten-5 {
  background-color: #e0f7fa !important;
}
.bg-magenta-lighten-5 {
  background-color: #fce4ec !important;
}
.bg-yellow-lighten-5 {
  background-color: #fffde7 !important;
}
</style>
