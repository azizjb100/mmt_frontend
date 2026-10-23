// services/dataMode.ts
//
// Menyimpan pilihan mode data (REAL / TRIAL) di browser. Nilai ini
// dikirim sebagai header `X-Data-Mode` pada setiap request API sehingga
// backend memakai database yang sesuai.

import { ref, onUnmounted } from "vue";

export type DataMode = "real" | "trial";

export const DATA_MODE_STORAGE_KEY = "mmt_data_mode";
export const DATA_MODE_EVENT = "mmt-data-mode-changed";

export const isTrialMode = (value: unknown): boolean =>
  String(value || "").toLowerCase() === "trial";

export const getDataMode = (): DataMode =>
  isTrialMode(localStorage.getItem(DATA_MODE_STORAGE_KEY)) ? "trial" : "real";

export const setDataMode = (mode: DataMode) => {
  localStorage.setItem(DATA_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(
    new CustomEvent(DATA_MODE_EVENT, { detail: { mode } }),
  );
};

/**
 * Composable reaktif: nilainya ikut berubah ketika toggle diganti,
 * termasuk pergantian dari tab browser lain.
 */
export const useDataMode = () => {
  const mode = ref<DataMode>(getDataMode());

  const sync = () => {
    mode.value = getDataMode();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === DATA_MODE_STORAGE_KEY) sync();
  };

  window.addEventListener(DATA_MODE_EVENT, sync);
  window.addEventListener("storage", onStorage);

  onUnmounted(() => {
    window.removeEventListener(DATA_MODE_EVENT, sync);
    window.removeEventListener("storage", onStorage);
  });

  return {
    mode,
    isTrial: () => mode.value === "trial",
    setMode: setDataMode,
  };
};
