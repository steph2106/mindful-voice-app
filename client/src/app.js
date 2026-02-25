import { dailyPrompts } from './prompts.js';

// --- ISI KUNCI KAMU DI SINI ---
const SUPABASE_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co'; // Nanti ini akan otomatis terisi jika pakai process.env atau ganti manual sementara
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHZveHNjem53b3Z4aGVseXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzA4ODUsImV4cCI6MjA4NzU0Njg4NX0.aHCqqAqXz_YQbzCy7qQ7D6IGXZUj-7zOoP40EE4Sg0I'; 
const GEMINI_API_KEY = 'AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U';

// ------------------------------

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];

// Buat ID Unik untuk HP ini agar tidak tertukar dengan orang lain
if (!localStorage.getItem('user_voice_id')) {
    localStorage.setItem('user_voice_id', 'user-' + Math.random().toString(36).substr(2, 9));
}
const userId = localStorage.getItem('user_voice_id');

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    appDiv.innerHTML = `
        <audio id="bgMusic" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl font-sans">
            <h2 class="text-[#4A5D4F] text-xl font-serif mb-6 text-center">MindfulVoice</h2>
            
            <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-8 text-left">
                <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
            </div>

            <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-center">● Sedang Mendengarkan...</div>
            <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg transition-all">Mulai Bicara</button>

            <div id="aiResponseArea" class="hidden mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <p class="text-[10px] uppercase text-blue-400 font-bold mb-2">Teman AI Menjawab:</p>
                <p id="aiText" class="text-[#3A4A3F] italic">...</p>
            </div>
            
            <div class="mt-10 border-t pt-6">
                <h3 class="text-sm font-bold text-gray-500 mb-4 text-center uppercase tracking-widest">Riwayat Rekamanku</h3>
                <div id="daftarRekaman" class="space-y-3">
                    </div>
            </div>
        </div>
    `;
    updateDaftarUI();
    setupFitur();
}

// Fungsi menyimpan daftar link di HP (Local)
function simpanKeRiwayatLokal(fileName) {
    let riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    riwayat.unshift({ name: fileName, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('my_recordings', JSON.stringify(riwayat));
    updateDaftarUI();
}

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    
    if (riwayat.length === 0) {
        container.innerHTML = `<p class="text-center text-xs text-gray-300 italic">Belum ada rekaman tersimpan.</p>`;
        return;
    }

    container.innerHTML = riwayat.map(item => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span class="text-[10px] text-gray-500">${item.date}</span>
            <a href="${SUPABASE_URL}/storage/v1/object/public/recordings/${userId}/${item.name}" 
               download="${item.name}"
               class="text-[10px] bg-white border border-[#8FBC8F] text-[#8FBC8F] px-3 py-1 rounded-full font-bold">
               Download 📥
            </a>
        </div>
    `).join('');
}

async function uploadKeSupabase(blob) {
    const fileName = `jurnal-${Date.now()}.wav`;
    // Folder di Supabase akan dipisah per User ID
    const filePath = `${userId}/${fileName}`;

    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/recordings/${filePath}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'audio/wav'
        },
        body: blob
    });

    if (response.ok) {
        simpanKeRiwayatLokal(fileName);
        dapatkanResponAI("Aku sudah selesai bercerita.");
    }
}

// ... (Sisanya fungsi setupFitur dan dapatkanResponAI tetap sama seperti sebelumnya) ...
// (Pastikan kamu tetap memanggil dapatkanResponAI dan setupFitur)
