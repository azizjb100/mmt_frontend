<template>
  <div>
    <v-dialog
      :model-value="isVisible"
      @update:modelValue="emit('close')"
      max-width="1150px"
      persistent
    >
      <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
        <v-toolbar color="indigo-darken-2" density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            📦 Lookup PO Internal — 1 PO Banyak Size & Komponen
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="emit('close')" variant="text" size="small"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-4 d-flex flex-column flex-grow-1">
          <v-text-field
            v-model="search"
            label="Cari Nomor PO, SPK, Size, Komponen, atau Nama Order..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3 flex-shrink-0"
            hide-details
            @keyup.enter="fetchData"
          ></v-text-field>

          <v-data-table
            :headers="headers"
            :items="groupedPos"
            :loading="loading"
            item-value="poi_nomor"
            show-expand
            v-model:expanded="expandedRows"
            hover
            class="desktop-table flex-grow-1 clickable-row"
            density="compact"
            fixed-header
            :items-per-page="20"
            @click:row="handleRowClick"
            @dblclick:row="handleRowClick"
          >
            <template #item.poi_nomor="{ item }">
              <span class="font-weight-bold color-spk">{{ item.poi_nomor }}</span>
            </template>

            <template #item.poi_tanggal="{ item }">
              {{ formatDate(item.poi_tanggal) }}
            </template>

            <!-- Kolom No. SPK & Nama Order -->
            <template #item.poi_spk_nomor="{ item }">
              <div>
                <div class="d-flex flex-wrap gap-1 align-center">
                  <span
                    v-for="(spk, sIdx) in item.spks"
                    :key="spk"
                    class="font-weight-bold color-spk mr-1"
                  >
                    {{ spk }}<span v-if="sIdx < item.spks.length - 1">,</span>
                  </span>
                  <span v-if="item.spks.length === 0" class="text-grey">-</span>
                </div>
                <div
                  v-if="item.spk_nama_display"
                  class="text-caption text-grey-darken-1 text-truncate"
                  style="max-width: 220px"
                  :title="item.spk_nama_display"
                >
                  {{ item.spk_nama_display }}
                </div>
              </div>
            </template>

            <!-- Kolom Size -->
            <template #item.sizes="{ item }">
              <div class="d-flex flex-wrap gap-1 align-center">
                <v-chip
                  v-for="s in item.sizes.slice(0, 4)"
                  :key="s"
                  color="teal-darken-2"
                  size="x-small"
                  label
                  class="font-weight-bold mr-1 mb-1"
                >
                  {{ s }}
                </v-chip>
                <v-chip
                  v-if="item.sizes.length > 4"
                  size="x-small"
                  color="teal"
                  variant="tonal"
                  class="text-caption pa-1 mb-1 font-weight-medium"
                >
                  +{{ item.sizes.length - 4 }}
                </v-chip>
                <span v-if="item.sizes.length === 0" class="text-grey">-</span>
              </div>
            </template>

            <!-- Kolom Komponen -->
            <template #item.komponens="{ item }">
              <div class="d-flex flex-wrap gap-1 align-center">
                <v-chip
                  v-for="k in item.komponens.slice(0, 3)"
                  :key="k"
                  color="indigo-darken-2"
                  size="x-small"
                  label
                  variant="tonal"
                  class="mr-1 mb-1 text-caption font-weight-medium"
                >
                  {{ k }}
                </v-chip>
                <v-chip
                  v-if="item.komponens.length > 3"
                  size="x-small"
                  color="indigo"
                  variant="tonal"
                  class="text-caption pa-1 mb-1 font-weight-medium"
                >
                  +{{ item.komponens.length - 3 }}
                </v-chip>
                <span v-if="item.komponens.length === 0" class="text-grey">-</span>
              </div>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                color="indigo-darken-2"
                size="x-small"
                @click.stop="openComponentDialog(item)"
                variant="flat"
              >
                Pilih
              </v-btn>
            </template>

            <!-- Expanded Row: Detail Lengkap Per Baris Komponen/Size -->
            <template #expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="pa-3 bg-grey-lighten-4">
                  <v-card flat border class="rounded overflow-hidden">
                    <div class="pa-2 bg-indigo-lighten-5 border-b d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <span class="text-caption font-weight-bold text-indigo-darken-3 mr-2">
                          📋 Rincian Detail PO [{{ item.poi_nomor }}]
                        </span>
                        <v-chip size="x-small" color="indigo" variant="flat" label>
                          {{ item.details?.length || 0 }} Komponen/Size
                        </v-chip>
                      </div>
                      <v-btn
                        size="x-small"
                        color="indigo-darken-2"
                        variant="flat"
                        @click.stop="openComponentDialog(item)"
                      >
                        Pilih PO Ini
                      </v-btn>
                    </div>
                    <v-table density="compact" class="bg-white">
                      <thead>
                        <tr class="bg-grey-lighten-3 text-caption font-weight-bold">
                          <th class="text-left py-1" style="width: 140px">No. SPK</th>
                          <th class="text-left py-1" style="min-width: 150px">Nama Order</th>
                          <th class="text-left py-1" style="min-width: 150px">Komponen</th>
                          <th class="text-center py-1" style="width: 80px">Size</th>
                          <th class="text-right py-1" style="width: 90px">Qty PO</th>
                          <th class="text-right py-1" style="width: 90px">Sisa Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(dtl, idx) in item.details" :key="idx" class="text-caption">
                          <td class="font-weight-medium color-spk">{{ dtl.poi_spk_nomor || '-' }}</td>
                          <td>{{ dtl.spk_nama || '-' }}</td>
                          <td class="font-weight-medium">{{ getKomponenName(dtl, idx) }}</td>
                          <td class="text-center">
                            <v-chip size="x-small" color="teal-darken-2" label class="font-weight-bold">
                              {{ dtl.poid_size || '-' }}
                            </v-chip>
                          </td>
                          <td class="text-right font-weight-medium">{{ dtl.poid_jumlah || 0 }}</td>
                          <td class="text-right font-weight-bold text-teal-darken-3">
                            {{ dtl.sisa_qty ?? dtl.poid_jumlah ?? 0 }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card>
                </td>
              </tr>
            </template>

            <template #no-data>
              <div class="text-center pa-4">Tidak ada PO Internal ditemukan.</div>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions class="d-flex justify-end border-top pa-3">
          <v-btn @click="emit('close')" color="secondary" variant="outlined" size="small">Batal</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sub-dialog: Pilih Size & Komponen seperti SPK Sublim -->
    <v-dialog v-model="componentDialog" max-width="600px" scrollable>
      <v-card border>
        <v-card-title class="bg-indigo-darken-3 text-white text-subtitle-1 pa-3 d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon start size="18">mdi-package-variant</v-icon>
            <span>Pilih PO [{{ selectedPoiNo }}]</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="componentDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Info Banner SPK & Order -->
          <v-sheet rounded class="pa-3 mb-3 bg-indigo-lighten-5 border">
            <div class="d-flex justify-space-between align-center mb-1">
              <div>
                <span class="text-caption text-grey-darken-2 font-weight-bold">No. SPK: </span>
                <span class="text-caption font-weight-bold color-spk">{{ activePoiItem?.spk_display || '-' }}</span>
              </div>
              <div>
                <span class="text-caption text-grey-darken-2 font-weight-bold">Total Qty: </span>
                <v-chip size="x-small" color="indigo" label class="font-weight-bold">
                  {{ activePoiItem?.totalQty || 0 }} Pcs
                </v-chip>
              </div>
            </div>
            <div v-if="activePoiItem?.spk_nama_display" class="text-caption text-grey-darken-3">
              <span class="font-weight-bold">Nama Order: </span>{{ activePoiItem.spk_nama_display }}
            </div>
          </v-sheet>

          <div class="text-subtitle-2 font-weight-bold text-indigo-darken-3 mb-1">1. Pilih Metode Pengambilan:</div>
          <v-radio-group v-model="extractMode" inline density="compact" class="mb-3" hide-details>
            <v-radio label="Ambil Semua Set (All Set)" value="SET" color="indigo-darken-3"></v-radio>
            <v-radio label="Pilih Komponen Tertentu" value="KOMPONEN" color="indigo-darken-3"></v-radio>
          </v-radio-group>
          <v-divider class="mb-4"></v-divider>

          <div class="text-subtitle-2 font-weight-bold text-indigo-darken-3 mb-1">2. Pilih Ukuran (Size - Bisa Lebih dari 1):</div>
          <v-select
            v-model="selectedSizes"
            :items="availableSizes"
            label="Pilih Size..."
            variant="outlined"
            density="compact"
            class="mb-4"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="onSizeChange"
          >
            <template v-slot:item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" density="compact">
                <template v-slot:prepend>
                  <v-checkbox-btn :model-value="selectedSizes.includes(item.raw)" color="indigo-darken-3" density="compact" class="mr-2" hide-details></v-checkbox-btn>
                </template>
                <v-list-item-title class="font-weight-medium">{{ item.raw }}</v-list-item-title>
              </v-list-item>
            </template>
          </v-select>
          <v-divider class="mb-3"></v-divider>

          <div v-if="extractMode === 'KOMPONEN'">
            <div class="text-subtitle-2 font-weight-bold text-indigo-darken-3 mb-1">3. Pilih Komponen (Multi-Select):</div>
            <div v-if="selectedSizes.length > 0" class="text-caption text-grey-darken-1 mb-2">Centang komponen untuk size yang dipilih:</div>
            <div v-else class="text-caption text-error mb-2">Harap pilih minimal 1 Size terlebih dahulu.</div>
            <v-list v-if="selectedSizes.length > 0" density="compact" class="border rounded bg-grey-lighten-5" style="max-height: 240px; overflow-y: auto">
              <v-list-item v-for="(comp, idx) in currentSizeComponents" :key="idx" class="border-bottom">
                <template v-slot:prepend>
                  <v-checkbox-btn
                    v-model="selectedComponentKeys"
                    :value="getKomponenKode(comp) + '_' + getKomponenName(comp, idx) + '_' + (comp.poid_size || comp.poi_size)"
                    color="indigo-darken-3" class="mr-2"
                  ></v-checkbox-btn>
                </template>
                <v-list-item-title class="font-weight-bold text-body-2">
                  {{ getKomponenName(comp, idx) }}
                  <v-chip size="x-small" color="teal-darken-2" label class="ml-1 font-weight-bold">
                    {{ comp.poid_size || comp.poi_size }}
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="comp.poi_spk_nomor" class="color-spk font-weight-bold mr-2">
                    SPK: {{ comp.poi_spk_nomor }}
                  </span>
                  <span>Kode: {{ getKomponenKode(comp) }}</span> |
                  <span>Qty PO: {{ comp.poid_jumlah || 0 }}</span>
                  <span v-if="comp.sisa_qty !== undefined"> | Sisa: {{ comp.sisa_qty }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
          <div v-else-if="extractMode === 'SET' && selectedSizes.length > 0" class="text-body-2 text-grey-darken-2 pa-3 bg-grey-lighten-4 rounded text-center">
            Semua komponen untuk Size <b>{{ selectedSizes.join(", ") }}</b> akan diambil sebagai kesatuan set (All Set).
          </div>
          <div v-else class="text-body-2 text-grey pa-3 bg-grey-lighten-3 rounded text-center">Silakan pilih Size di atas.</div>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4 pa-3">
          <v-btn size="small" variant="text" @click="componentDialog = false">Batal</v-btn>
          <v-spacer />
          <v-btn size="small" color="indigo-darken-3" variant="flat" :disabled="selectedSizes.length === 0 || (extractMode === 'KOMPONEN' && selectedComponentKeys.length === 0)" @click="confirmSelection">Konfirmasi & Pilih</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "@/services/api";
import { format } from "date-fns";

const props = defineProps(["isVisible"]);
const emit = defineEmits(["close", "select", "update:isVisible"]);

const dialogModel = computed({
  get() { return props.isVisible; },
  set(v) { emit("update:isVisible", v); if (!v) emit("close"); },
});

const items = ref([]);
const loading = ref(false);
const search = ref("");
const expandedRows = ref([]);

// Sub-dialog state (mirip SPK Sublim)
const componentDialog = ref(false);
const extractMode = ref("SET");
const selectedSizes = ref([]);
const availableSizes = ref([]);
const currentSizeComponents = ref([]);
const selectedComponentKeys = ref([]);
const selectedPoiNo = ref("");
const activePoiItem = ref(null);

const headers = [
  { title: "Nomor PO", key: "poi_nomor", width: "135px" },
  { title: "Tanggal", key: "poi_tanggal", width: "95px" },
  { title: "No. SPK & Nama Order", key: "poi_spk_nomor", minWidth: "170px" },
  { title: "Size", key: "sizes", width: "135px" },
  { title: "Komponen", key: "komponens", minWidth: "170px" },
  { title: "Aksi", key: "actions", width: "80px", align: "center", sortable: false },
];

const getKomponenName = (comp, idx = 0) => {
  if (comp.nama_komponen && comp.nama_komponen.trim() !== "") return comp.nama_komponen.trim();
  if (comp.Bhn_Name && comp.Bhn_Name.trim() !== "") return comp.Bhn_Name.trim();
  if (comp.bhn_name && comp.bhn_name.trim() !== "") return comp.bhn_name.trim();
  if (comp.poid_bhn_kode && comp.poid_bhn_kode.trim() !== "") return comp.poid_bhn_kode.trim();
  return `Komponen Bagian ${idx + 1}`;
};

const getKomponenKode = (comp) => comp.poid_bhn_kode || comp.Kode_Komponen || "-";

const groupedPos = computed(() => {
  const map = new Map();
  items.value.forEach((it) => {
    const key = it.poi_nomor;
    if (!map.has(key)) {
      const allForPo = items.value.filter((x) => x.poi_nomor === key);
      const spkSet = new Set(allForPo.map((x) => x.poi_spk_nomor).filter(Boolean));
      const spkNamaSet = new Set(allForPo.map((x) => x.spk_nama).filter(Boolean));
      const sizeSet = new Set(allForPo.map((x) => x.poid_size).filter(Boolean));
      const kompSet = new Set(
        allForPo
          .map((x, idx) => getKomponenName(x, idx))
          .filter(Boolean)
      );

      const totalQty = allForPo.reduce((acc, curr) => acc + Number(curr.poid_jumlah || 0), 0);

      map.set(key, {
        poi_nomor: key,
        poi_tanggal: allForPo[0]?.poi_tanggal || "",
        spks: Array.from(spkSet),
        spk_display: Array.from(spkSet).join(", "),
        spk_namas: Array.from(spkNamaSet),
        spk_nama_display: Array.from(spkNamaSet).join(", "),
        sizes: Array.from(sizeSet),
        size_display: Array.from(sizeSet).join(", "),
        komponens: Array.from(kompSet),
        komponen_display: Array.from(kompSet).join(", "),
        jumlahSpk: spkSet.size,
        jumlahSize: sizeSet.size,
        jumlahKomponen: kompSet.size,
        totalQty,
        details: allForPo,
      });
    }
  });

  let list = [...map.values()];
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (r) =>
        r.poi_nomor.toLowerCase().includes(q) ||
        r.spk_display.toLowerCase().includes(q) ||
        r.spk_nama_display.toLowerCase().includes(q) ||
        r.size_display.toLowerCase().includes(q) ||
        r.komponen_display.toLowerCase().includes(q)
    );
  }
  return list;
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/po-internal/lookup");
    items.value = res.data.success ? res.data.data : [];
  } catch (e) {
    console.error("Gagal load POI", e);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event, { item }) => {
  openComponentDialog(item);
};

const openComponentDialog = (poRow) => {
  const poiNo = poRow.poi_nomor;
  const allForPo = items.value.filter((d) => d.poi_nomor === poiNo);
  const sizeSet = new Set();
  allForPo.forEach((r) => { const s = r.poid_size; if (s) sizeSet.add(s); });
  activePoiItem.value = poRow;
  selectedPoiNo.value = poiNo;
  availableSizes.value = Array.from(sizeSet);
  selectedSizes.value = availableSizes.value.length > 0 ? [availableSizes.value[0]] : [];
  extractMode.value = "SET";
  selectedComponentKeys.value = [];
  onSizeChange();
  componentDialog.value = true;
};

const onSizeChange = () => {
  selectedComponentKeys.value = [];
  if (!activePoiItem.value || selectedSizes.value.length === 0) {
    currentSizeComponents.value = [];
    return;
  }
  const poiNo = activePoiItem.value.poi_nomor;
  const matched = items.value.filter((d) => d.poi_nomor === poiNo && selectedSizes.value.includes(d.poid_size || ""));
  const uniq = [];
  const seen = new Set();
  matched.forEach((c, idx) => {
    const k = getKomponenKode(c) + "_" + getKomponenName(c, idx) + "_" + (c.poid_size || "");
    if (!seen.has(k)) { seen.add(k); uniq.push(c); }
  });
  currentSizeComponents.value = uniq;
};

const confirmSelection = () => {
  if (!activePoiItem.value || selectedSizes.value.length === 0) return;
  const poiNo = activePoiItem.value.poi_nomor;
  if (extractMode.value === "SET") {
    const payload = selectedSizes.value.map((sizeName) => {
      const base = currentSizeComponents.value.find((c) => (c.poid_size || "") === sizeName) || items.value.find((d) => d.poi_nomor === poiNo && (d.poid_size || "") === sizeName) || activePoiItem.value;
      return {
        ...base,
        poi_nomor: poiNo,
        poi_size: sizeName,
        poid_size: sizeName,
        nama_komponen: "ALL SET",
        poid_bhn_kode: "ALL SET",
        poi_spk_nomor: base.poi_spk_nomor || base.spk_nomor || "",
        poid_jumlah: base.poid_jumlah || 0,
      };
    });
    emit("select", { mode: "SET", data: payload });
    componentDialog.value = false;
    emit("close");
  } else {
    if (selectedComponentKeys.value.length === 0) return;
    const selected = currentSizeComponents.value.filter((comp, idx) => {
      const k = getKomponenKode(comp) + "_" + getKomponenName(comp, idx) + "_" + (comp.poid_size || "");
      return selectedComponentKeys.value.includes(k);
    });
    const payload = selected.map((comp, idx) => ({
      ...comp,
      poi_nomor: poiNo,
      poi_size: comp.poid_size || "",
      poid_size: comp.poid_size || "",
      nama_komponen: getKomponenName(comp, idx),
      poid_bhn_kode: getKomponenKode(comp),
    }));
    emit("select", { mode: "KOMPONEN", data: payload });
    componentDialog.value = false;
    emit("close");
  }
};

const formatDate = (date) => date ? format(new Date(date), "dd/MM/yyyy") : "-";

watch(() => props.isVisible, (v) => { if (v) fetchData(); });
</script>

<style scoped>
.poi-modal-mode :deep(.v-label) { color: #ffffff !important; font-size: 13px !important; font-weight: bold !important; opacity: 1 !important; }
.cursor-pointer :deep(tbody tr) { cursor: pointer; }
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.desktop-table { font-size: 12px; }
.desktop-table :deep(td), .desktop-table :deep(th) { padding: 0 8px !important; height: 36px !important; }
.desktop-table :deep(thead th) { background-color: #f8f9fa !important; font-weight: bold; color: #2c3e50 !important; }
.color-spk { color: #1a237e; }
.clickable-row :deep(tbody tr):hover { cursor: pointer !important; background-color: #edf2f7 !important; }
</style>
