# NexusMind

## Menjalankan lokal

1. Siapkan MySQL dan database `nexusmind`.
2. Salin `backend/.env.example` menjadi `.env` sesuai lingkungan.
3. Jalankan backend:

```bash
cd backend
go run .
```

4. Salin `frontend/.env.example` menjadi `.env` bila endpoint API berbeda.
5. Jalankan frontend:

```bash
cd frontend
npm install
npm run dev
```

## Endpoint kesiapan rilis

- `GET /api/health` untuk status API dan koneksi database.
- `GET /api/public/overview` untuk ringkasan publik landing/login.

## Catatan model

- Prediksi baru memakai `Quantum ridge regression` jika jumlah sampel memadai.
- Jika data belum cukup, sistem memakai `Psychometric fallback`.
- Fitur quantum yang disimpan: interference, order effect, cognitive dissonance, dan NLP stress.
