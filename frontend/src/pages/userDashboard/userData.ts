export const userTrendData = [
  { date: 'Senin', stress: 60, energi: 80 },
  { date: 'Selasa', stress: 75, energi: 65 },
  { date: 'Rabu', stress: 85, energi: 50 },
  { date: 'Kamis', stress: 70, energi: 60 },
  { date: 'Jumat', stress: 55, energi: 75 },
  { date: 'Sabtu', stress: 40, energi: 90 },
  { date: 'Minggu', stress: 35, energi: 95 },
];

export const questionsPool = [
  "Bagaimana kualitas tidur Anda tadi malam?",
  "Seberapa fokus Anda dalam mengerjakan tugas hari ini?",
  "Apakah Anda merasa kewalahan dengan beban kerja/tugas?",
  "Seberapa sering Anda merasa cemas hari ini?",
  "Apakah Anda sempat meluangkan waktu untuk istirahat?",
];

export interface CurhatPost {
  id: number;
  text: string;
  sentiment: 'Positif' | 'Netral' | 'Negatif';
  tags: string[];
  time: string;
  hugs: number;
  replies: Reply[];
}

export interface Reply {
  id: number;
  text: string;
  time: string;
}

export const initialCurhat: CurhatPost[] = [
  {
    id: 1,
    text: "Hari ini bener-bener capek banget. Tugas numpuk dan deadline besok semua 😭 rasanya pengen hilang bentar aja.",
    sentiment: 'Negatif',
    tags: ['#Tugas', '#Lelah'],
    time: '10 menit yang lalu',
    hugs: 12,
    replies: [
      { id: 101, text: "Semangat! Coba dicicil pelan-pelan aja, jangan lupa minum air putih.", time: '5 menit yang lalu' }
    ]
  },
  {
    id: 2,
    text: "Akhirnya selesai juga presentasi hari ini. Lega banget rasanya setelah seminggu overthinking.",
    sentiment: 'Positif',
    tags: ['#Presentasi', '#Relief'],
    time: '1 jam yang lalu',
    hugs: 45,
    replies: []
  },
  {
    id: 3,
    text: "Ada yang ngerasa bingung nggak sih sama materi kuantum? Aku ngerasa ketinggalan jauh banget...",
    sentiment: 'Netral',
    tags: ['#Kuliah', '#Bingung'],
    time: '2 jam yang lalu',
    hugs: 8,
    replies: [
      { id: 102, text: "Sama kok, pelan-pelan aja baca materinya lagi.", time: '1 jam yang lalu' },
      { id: 103, text: "Coba tanya asdos aja pas jam kosong, mereka bantuin banget kok.", time: '30 menit yang lalu' }
    ]
  }
];
