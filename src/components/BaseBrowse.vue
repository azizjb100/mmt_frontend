<template>
  <PageLayout :title="title" :icon="icon">
    <!-- Header Action Buttons -->
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="$emit('action:new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="$emit('action:edit')"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="$emit('action:delete')"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <!-- Slot untuk Tombol Ekstra (ACC, Rekap, Export, dll) -->
      <slot
        name="extra-actions"
        :isSingleSelected="isSingleSelected"
        :selected="selected"
      ></slot>

      <v-divider vertical class="mx-2" v-if="hasPrint" />

      <v-btn
        v-if="hasPrint"
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="$emit('action:print')"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Section Toolbar Filter -->
      <v-card flat class="mb-1">
        <v-card-text class="pa-2">
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <template v-if="hasDateFilter">
              <v-label class="filter-label text-caption"
                >Periode Mulai:</v-label
              >
              <v-text-field
                :model-value="startDateVal"
                @update:model-value="onStartDateChange"
                type="date"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 150px"
              />

              <v-label class="mx-2 text-caption">s/d</v-label>

              <v-text-field
                :model-value="endDateVal"
                @update:model-value="onEndDateChange"
                type="date"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 150px"
              />
            </template>

            <v-btn
              variant="text"
              size="x-small"
              @click="$emit('refresh')"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <!-- Slot untuk Filter Tambahan -->
            <slot name="filter-fields"></slot>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <!-- Tabel Data Utama -->
      <div class="table-container">
        <v-data-table
          :model-value="selected"
          @update:model-value="$emit('update:selected', $event)"
          :expanded="expanded"
          @update:expanded="$emit('update:expanded', $event)"
          :headers="internalHeaders"
          :items="filteredItems"
          :loading="loading"
          :search="search"
          :item-value="itemValue"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          return-object
          :show-expand="computedShowExpand"
          @click:row="(e, row) => $emit('row-click', e, row)"
          :row-props="rowProps"
        >
          <!-- Custom Header Template dengan Filter Excel, Drag, & Resizing Otomatis -->
          <template
            v-for="header in internalHeaders"
            :key="header.key"
            #[`header.${header.key}`]="{ column }"
          >
            <div
              class="d-flex align-center justify-space-between w-100 draggable-header-cell position-relative"
              :class="{ 'header-drop-target': dragOverKey === header.key }"
              draggable="true"
              @dragstart="onDragStart($event, header.key)"
              @dragover="onDragOver"
              @dragenter="onDragEnter(header.key)"
              @dragleave="onDragLeave(header.key)"
              @drop="onDrop($event, header.key)"
            >
              <span
                class="font-weight-bold text-truncate mr-1 header-drag-title"
              >
                {{ column.title }}
              </span>

              <div class="d-flex align-center">
                <!-- Menu Filter Excel per Kolom (Kecuali kolom expand bawaan) -->
                <v-menu
                  v-if="header.key !== 'data-table-expand'"
                  v-model="menuStates[header.key]"
                  :close-on-content-click="false"
                  location="bottom start"
                >
                  <template #activator="{ props }">
                    <v-btn
                      icon
                      variant="text"
                      density="compact"
                      size="x-small"
                      v-bind="props"
                      @click.stop
                      @mousedown.stop
                      :color="
                        isColumnFilterActive(header.key)
                          ? 'primary'
                          : 'grey-darken-1'
                      "
                    >
                      <v-icon size="16">
                        {{
                          isColumnFilterActive(header.key)
                            ? "mdi-filter"
                            : "mdi-filter-variant"
                        }}
                      </v-icon>
                    </v-btn>
                  </template>

                  <v-card
                    min-width="280"
                    max-width="320"
                    class="pa-2 border shadow-2 rounded-lg"
                  >
                    <v-text-field
                      v-model="columnSearch[header.key]"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      autofocus
                      placeholder="Cari..."
                      class="mb-1"
                    />

                    <div class="text-caption text-grey-darken-1 my-1 px-1">
                      {{ getFilteredPopupOptions(header.key).length }} dari
                      {{ (uniqueValuesMap[header.key] || []).length }} nilai
                      ditampilkan
                    </div>

                    <div
                      class="d-flex ga-2 px-1 mb-2 text-caption font-weight-medium"
                    >
                      <a
                        href="#"
                        class="text-primary text-decoration-none"
                        @click.prevent="selectAllFiltered(header.key)"
                      >
                        Tampilkan Semua
                      </a>
                      <span class="text-grey-lighten-1">|</span>
                      <a
                        href="#"
                        class="text-error text-decoration-none"
                        @click.prevent="deselectAllFiltered(header.key)"
                      >
                        Sembunyikan Semua
                      </a>
                    </div>

                    <v-divider />

                    <div
                      style="max-height: 220px; overflow-y: auto"
                      class="my-1 px-1"
                    >
                      <v-checkbox
                        v-for="opt in getFilteredPopupOptions(header.key)"
                        :key="opt"
                        :label="opt"
                        :model-value="isOptionSelected(header.key, opt)"
                        density="compact"
                        hide-details
                        color="primary"
                        @update:model-value="toggleOption(header.key, opt)"
                      />
                      <div
                        v-if="getFilteredPopupOptions(header.key).length === 0"
                        class="text-caption text-grey text-center py-4"
                      >
                        Tidak ada data
                      </div>
                    </div>

                    <v-divider class="mb-2" />

                    <div class="d-flex justify-space-between align-center">
                      <v-btn
                        size="x-small"
                        variant="text"
                        color="grey-darken-1"
                        @click="resetColumnFilter(header.key)"
                      >
                        Reset
                      </v-btn>
                      <v-btn
                        size="small"
                        color="primary"
                        variant="flat"
                        class="px-4 font-weight-bold"
                        @click="menuStates[header.key] = false"
                      >
                        OK
                      </v-btn>
                    </div>
                  </v-card>
                </v-menu>

                <!-- Slot Suffix Kustom jika ada -->
                <slot :name="`header-suffix.${header.key}`" :column="column" />

                <!-- Garis Resizer Handle di Ujung Kanan Header -->
                <div
                  v-if="header.key !== 'data-table-expand'"
                  class="column-resizer"
                  @mousedown.stop.prevent="startResize($event, header.key)"
                ></div>
              </div>
            </div>
          </template>

          <!-- Handle Slot #expanded-row bawaan Vuetify 3 -->
          <template #expanded-row="slotProps" v-if="$slots['expanded-row']">
            <slot name="expanded-row" v-bind="slotProps" />
          </template>

          <!-- Fallback/Forward untuk Slot #expanded-content -->
          <template
            #expanded-row="slotProps"
            v-else-if="$slots['expanded-content']"
          >
            <tr>
              <td
                :colspan="slotProps.columns?.length || internalHeaders.length"
                class="pa-3 bg-grey-lighten-4"
              >
                <div
                  class="expanded-container ml-0 pa-3 bg-white rounded-lg elevation-2 border"
                  style="width: 80%; border-left: 4px solid #1976d2 !important"
                >
                  <div class="d-flex align-center mb-2 px-1">
                    <v-icon size="small" color="primary" class="mr-2"
                      >mdi-package-variant-closed</v-icon
                    >
                    <span
                      class="text-caption font-weight-bold text-grey-darken-3"
                    >
                      Detail Items:
                      {{ slotProps.item?.raw?.Nomor || slotProps.item?.Nomor }}
                    </span>
                  </div>

                  <slot name="expanded-content" v-bind="slotProps" />
                </div>
              </td>
            </tr>
          </template>

          <!-- Footer Total (Grand Total) Dinamis -->
          <template #body.append>
            <tr
              v-if="summaryFields && summaryFields.length > 0"
              class="summary-row"
            >
              <td
                v-for="(header, index) in internalHeaders"
                :key="'summary-' + header.key"
                :class="[
                  header.align === 'end' || header.align === 'right'
                    ? 'text-right'
                    : header.align === 'center'
                      ? 'text-center'
                      : 'text-left',
                ]"
              >
                <!-- Menampilkan teks GRAND TOTAL di kolom pertama data -->
                <template
                  v-if="
                    index ===
                    (internalHeaders[0]?.key === 'data-table-expand' ? 1 : 0)
                  "
                >
                  <span class="font-weight-black text-primary"
                    >GRAND TOTAL</span
                  >
                </template>
                <!-- Menampilkan Hasil Kalkulasi Sum -->
                <template v-else-if="summaryFields.includes(header.key)">
                  <span class="font-weight-black text-primary">{{
                    formatTotal(calculateTotal(header.key))
                  }}</span>
                </template>
              </td>
            </tr>
          </template>

          <!-- Forward Semua Dynamic Custom Slots Lainnya -->
          <template
            v-for="(_, slotName) in customSlots"
            #[slotName]="slotProps"
            :key="slotName"
          >
            <slot :name="slotName" v-bind="slotProps ?? {}" />
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots } from "vue";
import PageLayout from "./PageLayout.vue";

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: "mdi-factory" },
  headers: { type: Array, required: true },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },

  // Dukungan Fleksibel untuk Date Filter
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  filters: { type: Object, default: null },
  hasDateFilter: { type: Boolean, default: true },

  selected: { type: Array, default: () => [] },
  expanded: { type: Array, default: () => [] },
  filteredItems: { type: Array, default: () => [] }, // Tambahan props pendukung
  search: { type: String, default: "" },
  itemValue: { type: String, default: "Nomor" },
  showExpand: { type: Boolean, default: false },
  hasPrint: { type: Boolean, default: false },
  rowProps: { type: Function, default: () => ({}) },
  summaryFields: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:startDate",
  "update:endDate",
  "update:filters",
  "update:selected",
  "update:expanded",
  "update:filteredItems", // Event emit untuk meneruskan data terfilter ke parent
  "refresh",
  "action:new",
  "action:edit",
  "action:delete",
  "action:print",
  "row-click",
]);

const slots = useSlots();

// --- STATE INTERNAL UNTUK DRAG, RESIZE, & FILTER KOLOM ---
const internalHeaders = ref<any[]>([]);

watch(
  () => props.headers,
  (newHeaders) => {
    if (!newHeaders) return;
    if (internalHeaders.value.length === 0) {
      internalHeaders.value = JSON.parse(JSON.stringify(newHeaders));
    } else {
      const currentKeys = new Set(newHeaders.map((h: any) => h.key));
      const preserved = internalHeaders.value.filter((h: any) =>
        currentKeys.has(h.key),
      );
      const existingKeys = new Set(preserved.map((h: any) => h.key));
      newHeaders.forEach((h: any) => {
        if (!existingKeys.has(h.key))
          preserved.push(JSON.parse(JSON.stringify(h)));
      });
      internalHeaders.value = preserved;
    }
  },
  { immediate: true, deep: true },
);

// State Resizing
const resizingKey = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e: MouseEvent, key: string) => {
  resizingKey.value = key;
  startX.value = e.clientX;

  const targetHeader = internalHeaders.value.find((h) => h.key === key);
  let w = parseInt(targetHeader?.width || targetHeader?.minWidth || "120", 10);
  if (isNaN(w)) w = 120;
  startWidth.value = w;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  e.stopPropagation();
};

const onMouseMove = (e: MouseEvent) => {
  if (!resizingKey.value) return;
  const diff = e.clientX - startX.value;
  const newWidth = Math.max(50, startWidth.value + diff);

  const idx = internalHeaders.value.findIndex(
    (h) => h.key === resizingKey.value,
  );
  if (idx !== -1) {
    internalHeaders.value[idx] = {
      ...internalHeaders.value[idx],
      width: `${newWidth}px`,
      minWidth: `${newWidth}px`,
    };
  }
};

const onMouseUp = () => {
  resizingKey.value = null;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
};

// State Drag and Drop Posisi Kolom
const draggedKey = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);

const onDragStart = (e: DragEvent, key: string) => {
  resizingKey.value = null;
  draggedKey.value = key;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
  }
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "move";
  }
};

const onDragEnter = (key: string) => {
  dragOverKey.value = key;
};

const onDragLeave = (_key: string) => {};

const onDrop = (e: DragEvent, targetKey: string) => {
  e.preventDefault();
  const sourceKey = draggedKey.value;
  draggedKey.value = null;
  dragOverKey.value = null;

  if (!sourceKey || sourceKey === targetKey) return;

  const srcIdx = internalHeaders.value.findIndex((h) => h.key === sourceKey);
  const targetIdx = internalHeaders.value.findIndex((h) => h.key === targetKey);

  if (srcIdx !== -1 && targetIdx !== -1) {
    const movedItem = internalHeaders.value.splice(srcIdx, 1)[0];
    internalHeaders.value.splice(targetIdx, 0, movedItem);
  }
};

// --- EXCEL FILTER CORE LOGIC ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

const getCellValue = (item: any, key: string): string => {
  if (!item) return "-";
  let val = item[key];
  if (val === null || val === undefined || val === "") return "-";
  return String(val);
};

const filterableHeaders = computed(() => {
  return internalHeaders.value.filter((h) => h.key !== "data-table-expand");
});

const uniqueValuesMap = computed(() => {
  const map: Record<string, string[]> = {};
  filterableHeaders.value.forEach((h: any) => {
    const key = h.key;
    const set = new Set<string>();
    (props.items ?? []).forEach((item: any) => {
      set.add(getCellValue(item, key));
    });
    map[key] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  });
  return map;
});

const getFilteredPopupOptions = (key: string) => {
  const options = uniqueValuesMap.value[key] || [];
  const search = columnSearch.value[key]?.trim().toLowerCase();
  if (!search) return options;
  return options.filter((opt) => opt.toLowerCase().includes(search));
};

const isOptionSelected = (key: string, option: string) => {
  const sel = selectedValues.value[key];
  if (!sel) return true;
  return sel.includes(option);
};

const toggleOption = (key: string, option: string) => {
  if (!selectedValues.value[key]) {
    selectedValues.value[key] = [...(uniqueValuesMap.value[key] || [])];
  }
  const index = selectedValues.value[key].indexOf(option);
  if (index > -1) {
    selectedValues.value[key].splice(index, 1);
  } else {
    selectedValues.value[key].push(option);
  }
};

const selectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  const newSet = new Set([...currentSelected, ...visibleOptions]);
  selectedValues.value[key] = Array.from(newSet);
};

const deselectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  selectedValues.value[key] = currentSelected.filter(
    (opt) => !visibleOptions.includes(opt),
  );
};

const isColumnFilterActive = (key: string) => {
  const search = columnSearch.value[key]?.trim();
  if (search) return true;

  const sel = selectedValues.value[key];
  if (!sel) return false;
  const all = uniqueValuesMap.value[key] || [];
  return sel.length < all.length;
};

const resetColumnFilter = (key: string) => {
  delete selectedValues.value[key];
  columnSearch.value[key] = "";
};

const filteredItems = computed(() => {
  const rawItems = props.items ?? [];
  return rawItems.filter((item: any) => {
    return filterableHeaders.value.every((h: any) => {
      const key = h.key;
      const cellValue = getCellValue(item, key);

      const searchText = columnSearch.value[key]?.trim().toLowerCase();
      if (searchText && !cellValue.toLowerCase().includes(searchText)) {
        return false;
      }

      const selectedArr = selectedValues.value[key];
      if (selectedArr) {
        return selectedArr.includes(cellValue);
      }

      return true;
    });
  });
});

// Watch dan kirim hasil data terfilter ke komponen parent secara otomatis
watch(
  filteredItems,
  (newVal) => {
    emit("update:filteredItems", newVal);
  },
  { immediate: true, deep: true },
);

// --- SUMMARY / GRAND TOTAL CALCULATIONS ---
const calculateTotal = (key: string) => {
  return filteredItems.value.reduce((sum, item) => {
    const val = Number(item[key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const formatTotal = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

// Otomatis aktifkan tombol expand jika parent mempunyai slot detail/expanded
const computedShowExpand = computed(() => {
  return (
    props.showExpand || !!slots["expanded-row"] || !!slots["expanded-content"]
  );
});

// Mengambil slot custom tanpa menyertakan slot internal / layout
const customSlots = computed(() => {
  const {
    "extra-actions": _,
    "filter-fields": __,
    "expanded-row": ___,
    "expanded-content": ____,
    ...rest
  } = slots;
  return rest;
});

// Getter & Event Handler Tanggal
const startDateVal = computed(
  () => props.filters?.startDate ?? props.startDate,
);
const endDateVal = computed(() => props.filters?.endDate ?? props.endDate);

const onStartDateChange = (val: string) => {
  if (props.filters) {
    emit("update:filters", { ...props.filters, startDate: val });
  } else {
    emit("update:startDate", val);
  }
};

const onEndDateChange = (val: string) => {
  if (props.filters) {
    emit("update:filters", { ...props.filters, endDate: val });
  } else {
    emit("update:endDate", val);
  }
};

const isSingleSelected = computed(() => props.selected.length === 1);
</script>

<style scoped>
:deep(.v-data-table) {
  font-size: 11px !important;
  display: flex !important;
  flex-direction: column !important;
  max-height: 456px !important;
}

:deep(.v-table__wrapper) {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  max-height: 384px !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 36px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  color: #333 !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 5 !important;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

:deep(.v-data-table__tr) {
  cursor: pointer;
}

.browse-content {
  padding-top: 4px;
}

.filter-section {
  padding: 4px 8px;
}

:deep(.expanded-container .v-data-table-header th) {
  background-color: #eceff1 !important;
  color: #37474f !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  height: 30px !important;
}
:deep(.expanded-container .v-data-table td) {
  height: 28px !important;
}

.draggable-header-cell {
  cursor: grab;
  user-select: none;
  transition:
    background-color 0.2s ease,
    border 0.2s ease;
  padding: 2px 6px;
  border-radius: 2px;
  position: relative;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.draggable-header-cell:active {
  cursor: grabbing;
}

.header-drag-title {
  cursor: grab;
}

.header-drop-target {
  background-color: rgba(25, 118, 210, 0.15) !important;
  outline: 2px dashed #1976d2 !important;
}

.column-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 3;
  transition: background-color 0.2s;
}

.column-resizer:hover,
.draggable-header-cell:hover .column-resizer {
  background-color: rgba(0, 0, 0, 0.15);
}

.summary-row td {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 4 !important;
  background-color: #e3f2fd !important;
  border-top: 2px solid #90caf9 !important;
  font-size: 12px !important;
  padding: 6px 8px !important;
}
</style>
