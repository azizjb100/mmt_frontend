<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center">
        <h2 class="mb-4">Sistem Absensi MMT</h2>

        <div style="position: relative" class="d-flex justify-center">
          <video
            ref="videoRef"
            autoplay
            muted
            width="640"
            height="480"
            style="border-radius: 8px; background: #000"
          ></video>
          <canvas
            ref="canvasRef"
            style="position: absolute; left: 50%; transform: translateX(-50%)"
          ></canvas>
        </div>

        <v-btn
          color="primary"
          class="mt-4"
          :loading="loading"
          @click="handleAbsensi"
        >
          Ambil Absen
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="listAbsensi"
          density="compact"
          class="elevation-1"
        >
          <template #[`item.status`]="{ value }">
            <v-chip color="success" size="small">{{ value }}</v-chip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as faceapi from "face-api.js";

const videoRef = ref(null);
const canvasRef = ref(null);
const loading = ref(false);
const listAbsensi = ref([]);

const headers = [
  { title: "Waktu", key: "waktu" },
  { title: "Nama Karyawan", key: "nama" },
  { title: "Status", key: "status" },
];

// 1. Load Model & Mulai Kamera
onMounted(async () => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]);
  startVideo();
});

const startVideo = () => {
  navigator.mediaDevices
    .getUserMedia({ video: {} })
    .then((stream) => {
      videoRef.value.srcObject = stream;
    })
    .catch((err) => console.error("Gagal akses kamera:", err));
};

// 2. Logika Deteksi & Absensi
const handleAbsensi = async () => {
  loading.value = true;

  // Deteksi wajah dari frame video saat ini
  const detection = await faceapi
    .detectSingleFace(videoRef.value, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (detection) {
    console.log("Wajah terdeteksi!", detection.descriptor);

    /* DI SINI: Kirim detection.descriptor (array angka) ke Backend Node.js/Python 
      untuk dicocokkan dengan database karyawan.
    */

    // Simulasi Berhasil:
    listAbsensi.value.push({
      waktu: new Date().toLocaleTimeString(),
      nama: "Karyawan Terdeteksi", // Ganti dengan hasil dari API backend
      status: "Hadir",
    });

    alert("Absensi Berhasil!");
  } else {
    alert("Wajah tidak ditemukan, coba posisi lebih tegak.");
  }

  loading.value = false;
};
</script>
