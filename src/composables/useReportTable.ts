import { ref, isRef } from "vue";

export interface ColDef {
  key: string;
  label?: string;
  width?: string;
  align?: "left" | "center" | "right";
  type?: "text" | "date" | "number";
  dec?: number;
  [key: string]: any;
}

export interface UseReportTableOptions {
  tableKey: string;
  defaultWidths?: Record<string, string>;
  defaultSortKey?: string;
  defaultSortOrder?: "asc" | "desc";
}

export function useReportTable(options: UseReportTableOptions) {
  const {
    tableKey,
    defaultWidths = {},
    defaultSortKey = "",
    defaultSortOrder = "asc",
  } = options;

  const storageKeyWidths = `mmt_report_col_widths_${tableKey}`;

  const loadColWidths = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem(storageKeyWidths);
      return raw ? { ...defaultWidths, ...JSON.parse(raw) } : { ...defaultWidths };
    } catch {
      return { ...defaultWidths };
    }
  };

  const saveColWidths = (widths: Record<string, string>) => {
    try {
      localStorage.setItem(storageKeyWidths, JSON.stringify(widths));
    } catch {}
  };

  const colWidths = ref<Record<string, string>>(loadColWidths());

  const colStyles = (key: string, defaultWidth?: string) => {
    const w = colWidths.value[key] || defaultWidth;
    return w ? { width: w, minWidth: w, maxWidth: w } : {};
  };

  // Helper untuk load order dari localStorage
  const loadOrder = <T extends { key: string }>(subKey: string, defaultCols: T[]): T[] => {
    const storageKeyOrder = `mmt_report_col_order_${tableKey}_${subKey}`;
    try {
      const raw = localStorage.getItem(storageKeyOrder);
      if (!raw) return [...defaultCols];
      const savedKeys: string[] = JSON.parse(raw);
      const reordered: T[] = [];
      savedKeys.forEach((k) => {
        const found = defaultCols.find((c) => c.key === k);
        if (found) reordered.push(found);
      });
      defaultCols.forEach((c) => {
        if (!reordered.some((x) => x.key === c.key)) reordered.push(c);
      });
      return reordered;
    } catch {
      return [...defaultCols];
    }
  };

  const saveOrder = (subKey: string, cols: { key: string }[]) => {
    const storageKeyOrder = `mmt_report_col_order_${tableKey}_${subKey}`;
    try {
      const keys = cols.map((c) => c.key);
      localStorage.setItem(storageKeyOrder, JSON.stringify(keys));
    } catch {}
  };

  // Resizing state
  const isResizing = ref(false);
  const hasResized = ref(false);
  const resizingKey = ref<string | null>(null);
  const startX = ref(0);
  const startWidth = ref(0);

  const startResize = (e: MouseEvent, key: string, defaultWidthPx = 100) => {
    isResizing.value = true;
    hasResized.value = false;
    resizingKey.value = key;
    startX.value = e.clientX;
    const currentW = colWidths.value[key];
    let w = currentW ? parseInt(currentW, 10) : defaultWidthPx;
    if (isNaN(w)) w = defaultWidthPx;
    startWidth.value = w;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    e.stopPropagation();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!resizingKey.value) return;
    const diff = e.clientX - startX.value;
    if (Math.abs(diff) > 2) {
      hasResized.value = true;
    }
    const newWidth = Math.max(50, startWidth.value + diff);
    colWidths.value = {
      ...colWidths.value,
      [resizingKey.value]: `${newWidth}px`,
    };
  };

  const onMouseUp = () => {
    if (resizingKey.value) {
      saveColWidths(colWidths.value);
    }
    resizingKey.value = null;
    isResizing.value = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);

    // Kunci flag hasResized sesaat agar click event setelah mouseup tidak memicu sort
    setTimeout(() => {
      hasResized.value = false;
    }, 250);
  };

  // Drag & drop state
  const draggedColKey = ref<string | null>(null);
  const dragOverColKey = ref<string | null>(null);
  const draggedGroup = ref<string | null>(null);

  const onColDragStart = (e: DragEvent, key: string, group: string) => {
    if (isResizing.value || hasResized.value) {
      e.preventDefault();
      return;
    }
    draggedColKey.value = key;
    draggedGroup.value = group;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", key);
    }
  };

  const onColDragOver = (e: DragEvent, key: string, group: string) => {
    if (draggedGroup.value === group && draggedColKey.value !== key) {
      e.preventDefault();
      dragOverColKey.value = key;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    }
  };

  const onColDragEnter = (key: string, group: string) => {
    if (draggedGroup.value === group && draggedColKey.value !== key) {
      dragOverColKey.value = key;
    }
  };

  const onColDragLeave = (eOrKey?: DragEvent | string, keyMaybe?: string) => {
    let key = typeof eOrKey === "string" ? eOrKey : keyMaybe;
    if (typeof eOrKey !== "string" && eOrKey?.currentTarget && eOrKey?.relatedTarget) {
      const current = eOrKey.currentTarget as HTMLElement;
      const related = eOrKey.relatedTarget as HTMLElement;
      if (current.contains && current.contains(related)) {
        return;
      }
    }
    if (key && dragOverColKey.value === key) {
      dragOverColKey.value = null;
    } else if (!key) {
      dragOverColKey.value = null;
    }
  };

  const onColDragEnd = () => {
    draggedColKey.value = null;
    dragOverColKey.value = null;
    draggedGroup.value = null;
  };

  const reorderCols = (colsRef: any, sourceKey: string, targetKey: string) => {
    const list = isRef(colsRef) ? colsRef.value : colsRef;
    if (!Array.isArray(list)) return;
    const srcIdx = list.findIndex((c: any) => c.key === sourceKey);
    const tgtIdx = list.findIndex((c: any) => c.key === targetKey);
    if (srcIdx !== -1 && tgtIdx !== -1) {
      const [moved] = list.splice(srcIdx, 1);
      list.splice(tgtIdx, 0, moved);
      if (isRef(colsRef)) {
        colsRef.value = [...list];
      }
    }
  };

  const onColDrop = (
    e: DragEvent,
    targetKey: string,
    group: string,
    colsRef: any,
    subKey = group
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceKey = draggedColKey.value;
    draggedColKey.value = null;
    dragOverColKey.value = null;
    draggedGroup.value = null;

    if (!sourceKey || sourceKey === targetKey) return;

    reorderCols(colsRef, sourceKey, targetKey);
    const listToSave = isRef(colsRef) ? colsRef.value : colsRef;
    if (Array.isArray(listToSave)) {
      saveOrder(subKey, listToSave);
    }
  };

  // Sorting state
  const sortKey = ref(defaultSortKey);
  const sortOrder = ref<"asc" | "desc">(defaultSortOrder);

  const toggleSort = (key: string) => {
    if (isResizing.value || hasResized.value) return;
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    } else {
      sortKey.value = key;
      sortOrder.value = "asc";
    }
  };

  const getSortIcon = (key: string) => {
    if (sortKey.value !== key) return "⇅";
    return sortOrder.value === "asc" ? "▲" : "▼";
  };

  const formatNumber = (val: any, dec = 0) => {
    if (val === null || val === undefined || val === "") return "0";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  };

  return {
    colWidths,
    colStyles,
    formatNumber,
    loadColWidths,
    saveColWidths,
    loadOrder,
    saveOrder,
    isResizing,
    hasResized,
    startResize,
    draggedColKey,
    dragOverColKey,
    draggedGroup,
    onColDragStart,
    onColDragOver,
    onColDragEnter,
    onColDragLeave,
    onColDragEnd,
    onColDrop,
    reorderCols,
    sortKey,
    sortOrder,
    toggleSort,
    getSortIcon,
  };
}
