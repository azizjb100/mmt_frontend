import { defineStore } from "pinia";
import { ref } from "vue";

export interface TabItem {
  name: string;
  title: string;
  path: string;
  params?: Record<string, any>;
}

export const useTabStore = defineStore("tab", () => {
  const tabs = ref<TabItem[]>([]);
  const activeTabPath = ref<string>("");

  const addTab = (tab: TabItem) => {
    const existing = tabs.value.find((t) => t.path === tab.path);
    if (!existing) {
      tabs.value.push(tab);
    }
    activeTabPath.value = tab.path;
  };

  const removeTab = (path: string, router: any) => {
    const index = tabs.value.findIndex((t) => t.path === path);
    if (index !== -1) {
      tabs.value.splice(index, 1);
      if (activeTabPath.value === path) {
        const nextTab = tabs.value[index - 1] || tabs.value[0];
        if (nextTab) {
          router.push(nextTab.path);
          activeTabPath.value = nextTab.path;
        } else {
          router.push("/");
          activeTabPath.value = "/";
        }
      }
    }
  };

  return { tabs, activeTabPath, addTab, removeTab };
});
