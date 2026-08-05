# PRD Sistem Evaluasi CV Berbasis Machine Learning

## 1. Ringkasan Produk

Sistem ini adalah aplikasi untuk membantu HRD melakukan penyaringan awal CV kandidat berdasarkan kebutuhan posisi dan daftar skill yang telah ditentukan. Sistem membaca CV kandidat, mengekstrak informasi penting seperti skill, pengalaman kerja, pendidikan, sertifikasi, dan kata kunci relevan, lalu memberikan skor kecocokan kandidat terhadap kriteria posisi.

Machine learning digunakan untuk membantu proses klasifikasi, ekstraksi informasi, dan pemberian rekomendasi kandidat. Keputusan akhir tetap berada pada HRD agar proses rekrutmen tetap dapat dikontrol dan diaudit.

## 2. Latar Belakang

Proses seleksi CV secara manual membutuhkan waktu lama, terutama ketika jumlah pelamar banyak. HRD sering harus membaca satu per satu dokumen CV dan mencocokkannya dengan kebutuhan posisi. Hal ini dapat menyebabkan proses seleksi tidak efisien, berulang, dan berisiko subjektif.

Sistem evaluasi CV berbasis machine learning diharapkan dapat:

- Mempercepat proses screening awal kandidat.
- Membantu HRD menemukan kandidat yang paling sesuai dengan kebutuhan posisi.
- Mengurangi pekerjaan manual dalam membaca dan memilah CV.
- Memberikan hasil penilaian yang lebih terstruktur dan dapat ditinjau ulang.

## 3. Tujuan Produk

Tujuan utama sistem adalah menyediakan alat bantu bagi HRD untuk mengevaluasi CV kandidat berdasarkan skill dan kriteria lowongan yang telah diatur.

Tujuan khusus:

- HRD dapat membuat kriteria posisi dan daftar skill yang dibutuhkan.
- Sistem dapat membaca CV dalam format dokumen.
- Sistem dapat mengekstrak skill dan informasi penting dari CV.
- Sistem dapat menghitung skor kecocokan kandidat.
- HRD dapat melihat peringkat kandidat berdasarkan hasil evaluasi.
- HRD dapat meninjau alasan sistem memberikan skor tertentu.

## 4. Target Pengguna

### 4.1 HRD / Recruiter

Pengguna utama yang membuat lowongan, menentukan skill, mengunggah CV, dan meninjau hasil rekomendasi kandidat.

### 4.2 Admin Sistem

Pengguna yang mengelola akun, data master skill, role pengguna, dan konfigurasi sistem.

### 4.3 Manajemen

Pengguna opsional yang melihat ringkasan proses rekrutmen, jumlah kandidat, dan hasil screening.

## 5. Ruang Lingkup Produk

### 5.1 Termasuk Dalam Ruang Lingkup

- Manajemen lowongan pekerjaan.
- Pengaturan skill wajib dan skill tambahan oleh HRD.
- Upload CV kandidat.
- Parsing CV dari file PDF atau DOCX.
- Ekstraksi data kandidat.
- Pencocokan skill kandidat dengan kriteria lowongan.
- Perhitungan skor kecocokan.
- Ranking kandidat.
- Dashboard hasil evaluasi.
- Riwayat evaluasi kandidat.
- Laporan hasil screening.

### 5.2 Di Luar Ruang Lingkup Awal

- Wawancara otomatis berbasis AI.
- Tes psikologi online.
- Integrasi langsung dengan job portal eksternal.
- Pengambilan keputusan otomatis tanpa validasi HRD.
- Penilaian kepribadian kandidat dari CV.

## 6. Permasalahan Yang Diselesaikan

| Masalah | Dampak | Solusi Sistem |
|---|---|---|
| CV terlalu banyak untuk dibaca manual | Proses seleksi lambat | Sistem melakukan screening awal otomatis |
| Skill kandidat sulit dicocokkan satu per satu | HRD membutuhkan waktu lebih lama | Sistem mencocokkan skill dengan kriteria posisi |
| Penilaian tidak terdokumentasi | Sulit diaudit | Sistem menyimpan skor dan alasan kecocokan |
| Kandidat potensial bisa terlewat | Risiko kehilangan kandidat baik | Sistem memberi ranking kandidat |

## 7. Alur Utama Sistem

1. HRD login ke sistem.
2. HRD membuat lowongan pekerjaan.
3. HRD menentukan skill yang dibutuhkan, bobot skill, pengalaman minimal, pendidikan, dan kriteria tambahan.
4. HRD mengunggah CV kandidat.
5. Sistem membaca dan memproses file CV.
6. Sistem mengekstrak informasi kandidat.
7. Sistem membandingkan hasil ekstraksi dengan kriteria lowongan.
8. Sistem menghasilkan skor kecocokan dan ranking kandidat.
9. HRD meninjau detail kandidat dan alasan penilaian.
10. HRD memilih kandidat untuk tahap berikutnya.

## 8. Fitur Utama

### 8.1 Autentikasi dan Hak Akses

Deskripsi:
Pengguna dapat login sesuai role masing-masing.

Kebutuhan:

- Login dan logout.
- Role HRD dan Admin.
- Pembatasan akses berdasarkan role.

Prioritas: Tinggi

### 8.2 Manajemen Lowongan

Deskripsi:
HRD dapat membuat dan mengelola posisi yang sedang dibuka.

Kebutuhan:

- Tambah lowongan.
- Edit lowongan.
- Hapus atau nonaktifkan lowongan.
- Menentukan nama posisi, deskripsi pekerjaan, lokasi, dan status lowongan.

Prioritas: Tinggi

### 8.3 Pengaturan Skill Oleh HRD

Deskripsi:
HRD dapat mengatur skill yang menjadi acuan evaluasi kandidat.

Kebutuhan:

- Menambahkan skill wajib.
- Menambahkan skill tambahan.
- Memberikan bobot pada setiap skill.
- Menentukan pengalaman minimal.
- Menentukan tingkat prioritas skill.

Contoh:

| Skill | Jenis | Bobot |
|---|---|---|
| Python | Wajib | 30% |
| Machine Learning | Wajib | 30% |
| SQL | Tambahan | 20% |
| Data Visualization | Tambahan | 20% |

Prioritas: Tinggi

### 8.4 Upload CV Kandidat

Deskripsi:
HRD dapat mengunggah CV kandidat ke sistem.

Kebutuhan:

- Upload file PDF.
- Upload file DOCX.
- Validasi ukuran file.
- Validasi format file.
- Upload banyak CV sekaligus.

Prioritas: Tinggi

### 8.5 Parsing dan Ekstraksi CV

Deskripsi:
Sistem membaca isi CV dan mengekstrak data penting.

Data yang diekstrak:

- Nama kandidat.
- Email.
- Nomor telepon.
- Pendidikan.
- Pengalaman kerja.
- Skill.
- Sertifikasi.
- Bahasa.
- Proyek.

Prioritas: Tinggi

### 8.6 Evaluasi Kecocokan Kandidat

Deskripsi:
Sistem menghitung kecocokan kandidat berdasarkan kriteria posisi.

Komponen penilaian:

- Kecocokan skill wajib.
- Kecocokan skill tambahan.
- Lama pengalaman.
- Relevansi pengalaman kerja.
- Pendidikan.
- Sertifikasi.

Contoh formula awal:

```text
Skor Akhir =
(Skor Skill Wajib x 40%) +
(Skor Skill Tambahan x 25%) +
(Skor Pengalaman x 20%) +
(Skor Pendidikan x 10%) +
(Skor Sertifikasi x 5%)
```

Prioritas: Tinggi

### 8.7 Ranking Kandidat

Deskripsi:
Sistem menampilkan kandidat berdasarkan skor tertinggi.

Kebutuhan:

- Menampilkan daftar kandidat.
- Sorting berdasarkan skor.
- Filter berdasarkan status, skill, dan skor minimal.
- Label rekomendasi seperti Sangat Sesuai, Sesuai, Cukup Sesuai, dan Tidak Sesuai.

Prioritas: Tinggi

### 8.8 Detail Hasil Evaluasi

Deskripsi:
HRD dapat melihat alasan mengapa kandidat mendapatkan skor tertentu.

Kebutuhan:

- Skill yang cocok.
- Skill yang tidak ditemukan.
- Ringkasan pengalaman.
- Skor per kategori.
- Catatan sistem.

Prioritas: Tinggi

### 8.9 Manajemen Kandidat

Deskripsi:
HRD dapat mengelola status kandidat.

Status kandidat:

- Baru.
- Direkomendasikan.
- Diproses.
- Ditolak.
- Diterima.

Prioritas: Sedang

### 8.10 Laporan Screening

Deskripsi:
Sistem menyediakan laporan hasil evaluasi.

Kebutuhan:

- Export laporan ke PDF atau Excel.
- Ringkasan jumlah kandidat.
- Rata-rata skor kandidat.
- Kandidat terbaik untuk tiap lowongan.

Prioritas: Sedang

## 9. Kebutuhan Machine Learning

### 9.1 Fungsi ML

Machine learning digunakan untuk:

- Ekstraksi skill dari teks CV.
- Klasifikasi relevansi kandidat.
- Pencocokan semantik antara skill kandidat dan skill lowongan.
- Pemberian skor kecocokan.

### 9.2 Pendekatan Model

Beberapa pendekatan yang dapat digunakan:

- Natural Language Processing untuk membaca teks CV.
- TF-IDF dan cosine similarity untuk pencocokan awal.
- Word embedding atau sentence embedding untuk pencocokan makna.
- Model klasifikasi untuk menentukan kandidat sesuai atau tidak sesuai.
- Named Entity Recognition untuk mengenali entitas seperti nama, skill, institusi, dan perusahaan.

### 9.3 Data Training

Data yang dibutuhkan:

- Dataset CV.
- Daftar skill.
- Data lowongan.
- Label kecocokan kandidat dari HRD.
- Riwayat hasil seleksi.

Contoh label:

| Kandidat | Posisi | Label |
|---|---|---|
| Kandidat A | Data Analyst | Sesuai |
| Kandidat B | Data Analyst | Tidak Sesuai |
| Kandidat C | Backend Developer | Sesuai |

### 9.4 Evaluasi Model

Metrik evaluasi:

- Accuracy.
- Precision.
- Recall.
- F1-score.
- Confusion matrix.

Untuk sistem screening CV, precision dan recall penting karena sistem harus mengurangi kandidat tidak relevan tanpa terlalu banyak melewatkan kandidat potensial.

## 10. Kebutuhan Non-Fungsional

### 10.1 Keamanan

- Password harus disimpan dalam bentuk hash.
- File CV hanya dapat diakses oleh pengguna berwenang.
- Sistem harus membatasi hak akses berdasarkan role.
- Data pribadi kandidat harus dilindungi.

### 10.2 Privasi

- Sistem hanya menggunakan data kandidat untuk kebutuhan rekrutmen.
- Kandidat dapat dihapus dari sistem jika diperlukan.
- Data sensitif tidak boleh ditampilkan kepada pengguna yang tidak berwenang.

### 10.3 Performa

- Sistem dapat memproses satu CV dalam waktu kurang dari 10 detik pada kondisi normal.
- Sistem dapat menampilkan daftar kandidat dalam waktu kurang dari 3 detik.
- Sistem mendukung upload banyak CV dalam satu proses.

### 10.4 Akurasi

- Sistem harus menampilkan alasan skor agar HRD dapat memvalidasi hasil.
- Sistem tidak boleh menjadi satu-satunya dasar keputusan akhir.
- HRD dapat mengubah atau memberi koreksi pada hasil sistem.

### 10.5 Skalabilitas

- Sistem dapat menangani banyak lowongan dan kandidat.
- Sistem dapat dikembangkan untuk integrasi dengan job portal atau sistem HRIS.

## 11. Desain Data Awal

### 11.1 Entitas Utama

| Entitas | Deskripsi |
|---|---|
| User | Data pengguna sistem |
| Role | Hak akses pengguna |
| Job Vacancy | Data lowongan pekerjaan |
| Required Skill | Skill yang dibutuhkan untuk lowongan |
| Candidate | Data kandidat |
| CV Document | File CV kandidat |
| Extracted CV Data | Hasil ekstraksi CV |
| Evaluation Result | Hasil penilaian kandidat |

### 11.2 Contoh Struktur Tabel

#### users

| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Primary key |
| name | varchar | Nama pengguna |
| email | varchar | Email pengguna |
| password_hash | varchar | Password terenkripsi |
| role | varchar | Role pengguna |

#### job_vacancies

| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Primary key |
| title | varchar | Nama posisi |
| description | text | Deskripsi lowongan |
| status | varchar | Status lowongan |
| created_by | integer | ID HRD |

#### required_skills

| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Primary key |
| job_id | integer | ID lowongan |
| skill_name | varchar | Nama skill |
| skill_type | varchar | Wajib atau tambahan |
| weight | decimal | Bobot skill |

#### candidates

| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Primary key |
| name | varchar | Nama kandidat |
| email | varchar | Email kandidat |
| phone | varchar | Nomor telepon |
| status | varchar | Status kandidat |

#### evaluation_results

| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Primary key |
| candidate_id | integer | ID kandidat |
| job_id | integer | ID lowongan |
| final_score | decimal | Skor akhir |
| recommendation_label | varchar | Label rekomendasi |
| evaluation_detail | json | Detail hasil evaluasi |

## 12. Kriteria Penerimaan

Sistem dianggap berhasil jika:

- HRD dapat membuat lowongan dan mengatur skill.
- HRD dapat mengunggah CV kandidat.
- Sistem dapat membaca isi CV.
- Sistem dapat menampilkan skill yang ditemukan dari CV.
- Sistem dapat menghitung skor kecocokan kandidat.
- Sistem dapat menampilkan ranking kandidat.
- HRD dapat melihat alasan dari hasil penilaian.
- Sistem dapat menyimpan hasil evaluasi.

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| CV memiliki format berbeda-beda | Parsing tidak akurat | Gunakan library parsing dan validasi manual |
| Skill ditulis dengan variasi nama | Skill tidak terdeteksi | Gunakan kamus sinonim dan semantic matching |
| Model bias terhadap kandidat tertentu | Penilaian tidak adil | Hindari fitur sensitif dan sediakan audit hasil |
| Data training kurang | Akurasi rendah | Mulai dengan rule-based + similarity, lalu latih model bertahap |
| File CV berisi data pribadi | Risiko privasi | Terapkan kontrol akses dan enkripsi penyimpanan |

## 14. MVP

Versi MVP sebaiknya mencakup:

- Login HRD.
- Manajemen lowongan.
- Pengaturan skill dan bobot.
- Upload CV PDF.
- Ekstraksi teks CV.
- Deteksi skill dari CV.
- Skoring kecocokan kandidat.
- Ranking kandidat.
- Detail alasan skor.

## 15. Pengembangan Lanjutan

Fitur lanjutan setelah MVP:

- Upload DOCX.
- Batch upload CV.
- Dashboard analitik rekrutmen.
- Export laporan.
- Feedback HRD untuk memperbaiki model.
- Integrasi email kandidat.
- Integrasi job portal.
- Model ML yang dilatih dari data historis perusahaan.

## 16. Catatan Etika

Sistem ini harus diposisikan sebagai alat bantu HRD, bukan pengganti keputusan manusia. Informasi sensitif seperti gender, agama, ras, status pernikahan, foto, dan umur sebaiknya tidak digunakan sebagai faktor penilaian. Sistem harus memprioritaskan kompetensi, pengalaman, pendidikan, dan kesesuaian skill terhadap posisi.

