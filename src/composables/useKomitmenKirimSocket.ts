import { ref } from "vue";

export function useKomitmenKirimSocket() {
  const presenceList = ref<any[]>([]);
  const isConnected = ref(false);

  const joinRoom = (_room: string) => {
    // stub - tidak pakai socket, langsung connected
    isConnected.value = true;
  };
  const leaveRoom = (_room: string) => {
    isConnected.value = false;
  };
  const on = (_event: string, _cb: any) => {
    // no-op
  };
  const emitFieldFocus = (_pjwNomor: string, _pjwdId: number, _field: string) => {};
  const emitFieldBlur = (_pjwNomor: string, _pjwdId: number, _field: string) => {};

  return {
    presenceList,
    isConnected,
    joinRoom,
    leaveRoom,
    on,
    emitFieldFocus,
    emitFieldBlur,
  };
}

export default useKomitmenKirimSocket;
