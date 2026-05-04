
export const trendData = [
  { date: '01 Mei', semua: 55, mahasiswa: 60, karyawan: 48 },
  { date: '06 Mei', semua: 62, mahasiswa: 68, karyawan: 54 },
  { date: '11 Mei', semua: 58, mahasiswa: 63, karyawan: 51 },
  { date: '16 Mei', semua: 70, mahasiswa: 75, karyawan: 63 },
  { date: '21 Mei', semua: 65, mahasiswa: 70, karyawan: 58 },
  { date: '26 Mei', semua: 72, mahasiswa: 78, karyawan: 65 },
  { date: '31 Mei', semua: 68, mahasiswa: 72, karyawan: 62 },
];

export const burnoutDist = [
  { name: 'Rendah (0-33)', value: 412, color: '#22c55e' },
  { name: 'Sedang (34-66)', value: 578, color: '#f59e0b' },
  { name: 'Tinggi (67-100)', value: 266, color: '#ef4444' },
];

export const psychoDist = [
  { name: 'Rendah', value: 480, color: '#22c55e' },
  { name: 'Sedang', value: 520, color: '#f59e0b' },
  { name: 'Tinggi', value: 256, color: '#ef4444' },
];

export const korelasi = [
  { label: 'Beban Kerja', value: 0.71, positive: true },
  { label: 'Tingkat Stres', value: 0.68, positive: true },
  { label: 'Kualitas Tidur', value: 0.63, positive: true },
  { label: 'Dukungan Sosial', value: -0.42, positive: false },
  { label: 'Kepuasan Hidup', value: -0.38, positive: false },
  { label: 'Aktivitas Fisik', value: -0.29, positive: false },
];

export const scatterData = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 37 + 13) % 100,
  y: (i * 53 + 27) % 100,
}));

export const radarData = [
  { subject: 'R² Score', A: 87, B: 72 },
  { subject: 'Akurasi\nKlasifikasi', A: 93, B: 80 },
  { subject: 'MAE', A: 75, B: 60 },
  { subject: 'RMSE', A: 80, B: 65 },
  { subject: 'MAPE', A: 89, B: 74 },
];

export const tableData = [
  { no: 1, id: 'MHS-2024-1001', nama: '', kelompok: 'Mahasiswa', burnout: 87.6, burnoutLevel: 'Tinggi', psiko: 0.83, psikoLevel: 'Tinggi', stres: 89, stresLevel: 'Tinggi', prediksi: '31 Mei 2024 10:23\n3 jam lalu', status: 'Perlu Intervensi', statusColor: '#ef4444' },
  { no: 2, id: 'KRY-2024-0456', nama: '', kelompok: 'Karyawan', burnout: 81.2, burnoutLevel: 'Tinggi', psiko: 0.79, psikoLevel: 'Tinggi', stres: 85, stresLevel: 'Tinggi', prediksi: '31 Mei 2024 09:15\n4 jam lalu', status: 'Perlu Intervensi', statusColor: '#ef4444' },
  { no: 3, id: 'MHS-2024-0823', nama: '', kelompok: 'Mahasiswa', burnout: 73.5, burnoutLevel: 'Tinggi', psiko: 0.64, psikoLevel: 'Sedang', stres: 78, stresLevel: 'Tinggi', prediksi: '31 Mei 2024 08:47\n5 jam lalu', status: 'Monitor Ketat', statusColor: '#f59e0b' },
  { no: 4, id: 'KRY-2024-0321', nama: '', kelompok: 'Karyawan', burnout: 69.1, burnoutLevel: 'Tinggi', psiko: 0.64, psikoLevel: 'Sedang', stres: 72, stresLevel: 'Tinggi', prediksi: '31 Mei 2024 08:12\n5 jam lalu', status: 'Monitor Ketat', statusColor: '#f59e0b' },
  { no: 5, id: 'MHS-2024-0765', nama: '', kelompok: 'Mahasiswa', burnout: 65.3, burnoutLevel: 'Sedang', psiko: 0.58, psikoLevel: 'Sedang', stres: 65, stresLevel: 'Sedang', prediksi: '31 Mei 2024 07:45\n6 jam lalu', status: 'Monitor', statusColor: '#6c63ff' },
];

export const earlyWarnings = [
  { label: 'Risiko Burnout Tinggi', count: '142 orang', desc: 'Perlu perhatian segera', color: '#ef4444' },
  { label: 'Risiko Psikomatis Tinggi', count: '114 orang', desc: 'Perlu monitoring', color: '#f59e0b' },
  { label: 'Perubahan Drastis', count: '28 orang', desc: 'Perubahan > 30% dari minggu lalu', color: '#f59e0b' },
];

export const quickActions = [
  { title: 'Prediksi Individu Baru', desc: 'Lakukan prediksi untuk responden baru', color: '#6c63ff' },
  { title: 'Import Data Responden', desc: 'Upload data dari file CSV/Excel', color: '#3ecfcf' },
  { title: 'Lihat Laporan Lengkap', desc: 'Analisis lengkap & export', color: '#6c63ff' },
  { title: 'Kelola Early Warning', desc: 'Review pengaturan & tindakan', color: '#f59e0b' },
];
