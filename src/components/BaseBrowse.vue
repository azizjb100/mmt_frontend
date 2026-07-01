<template>
  <PageLayout :title="title" :icon="icon">
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
      <v-card flat class="mb-1">
        <v-card-text class="pa-2">
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label text-caption">Periode Mulai:</v-label>
            <v-text-field
              :model-value="startDate"
              @update:model-value="$emit('update:startDate', $event)"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2 text-caption">s/d</v-label>

            <v-text-field
              :model-value="endDate"
              @update:model-value="$emit('update:endDate', $event)"
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
            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :model-value="selected"
          @update:model-value="$emit('update:selected', $event)"
          :expanded="expanded"
          @update:expanded="$emit('update:expanded', $event)"
          :headers="headers"
          :items="items"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          return-object
          @click:row="(e, row) => $emit('row-click', e, row)"
          :row-props="rowProps"
        >
          <template
            #item.data-table-expand="{ internalItem, isExpanded, toggleExpand }"
          >
            <v-btn
              variant="text"
              size="small"
              :icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              @click.stop="toggleExpand(internalItem)"
            />
          </template>

          <template #expanded-row="{ columns, item }">
            <tr class="bg-grey-lighten-5">
              <td :colspan="columns.length" class="pa-0 border-0">
                <div class="py-3 px-4" style="max-width: 80%">
                  <v-card
                    variant="outlined"
                    color="grey-lighten-2"
                    class="bg-white rounded shadow-sm"
                  >
                    <div class="pa-4">
                      <slot name="expanded-content" :item="item" />
                    </div>
                  </v-card>
                </div>
              </td>
            </tr>
          </template>

          <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
            <slot :name="slotName" v-bind="slotProps ?? {}" />
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PageLayout from "./PageLayout.vue";

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: "mdi-factory" },
  headers: { type: Array, required: true },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  selected: { type: Array, required: true },
  expanded: { type: Array, required: true },
  hasPrint: { type: Boolean, default: false },
  rowProps: { type: Function, default: () => ({}) },
});

defineEmits([
  "update:startDate",
  "update:endDate",
  "update:selected",
  "update:expanded",
  "refresh",
  "action:new",
  "action:edit",
  "action:delete",
  "action:print",
  "row-click",
]);

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
