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
            <v-label class="filter-label text-caption">Periode Mulai:</v-label>
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

            <v-btn
              variant="text"
              size="x-small"
              @click="$emit('refresh')"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <!-- FIX 1: PERBAIKAN PENTING - Tambahkan slot #filter-fields di sini! -->
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
          :headers="headers"
          :items="items"
          :loading="loading"
          :search="search"
          :item-value="itemValue"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          return-object
          :show-expand="showExpand"
          @click:row="(e, row) => $emit('row-click', e, row)"
          :row-props="rowProps"
        >
          <!-- FIX 2: Forward Semua Slots Secara Otomatis Kecuali Slot Bawaan yang di-override -->
          <template
            v-for="(_, slotName) in customSlots"
            #[slotName]="slotProps"
          >
            <slot :name="slotName" v-bind="slotProps ?? {}" />
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
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

  selected: { type: Array, default: () => [] },
  expanded: { type: Array, default: () => [] },
  search: { type: String, default: "" },
  itemValue: { type: String, default: "Nomor" },
  showExpand: { type: Boolean, default: false },
  hasPrint: { type: Boolean, default: false },
  rowProps: { type: Function, default: () => ({}) },
});

const emit = defineEmits([
  "update:startDate",
  "update:endDate",
  "update:filters",
  "update:selected",
  "update:expanded",
  "refresh",
  "action:new",
  "action:edit",
  "action:delete",
  "action:print",
  "row-click",
]);

const slots = useSlots();

// Mengambil hanya slot yang dikirim dari parent agar tidak terjadi konflik template
const customSlots = computed(() => {
  const { 'extra-actions': _, 'filter-fields': __, ...rest } = slots;
  return rest;
});

// Getter & Event Handler Tanggal (Mendukung p-bind via prop filters maupun startDate/endDate)
const startDateVal = computed(() => props.filters?.startDate ?? props.startDate);
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
}
:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 36px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  color: #333 !important;
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
</style>