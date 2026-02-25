// client/src/app.js
import { dailyPrompts } from './prompts.js';

// --- KONFIGURASI KUNCI (PASTIKAN SUPABASE URL & KEY SUDAH BENAR) ---
const SUPABASE_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co'; // Nanti ini akan otomatis terisi jika pakai process.env atau ganti manual sementara
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHZveHNjem53b3Z4aGVseXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzA4ODUsImV4cCI6MjA4NzU0Njg4NX0.aHCqqAqXz_YQbzCy7qQ7D6IGXZUj-7zOoP40EE4Sg0I'; 
const GEMINI_API_KEY = 'AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U'; 
// ------------------------------------------------------------------

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];

// 1. Membuat ID Unik agar riwayat tetap privat di HP masing-masing
if (!localStorage.getItem('user_voice_id')) {
    localStorage.setItem('user_voice_id', 'user-' + Math.random().toString(36).substr(2, 9));
}
const userId = localStorage.getItem('user_voice_id');

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <audio id="bgMusic" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
            <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl font-sans text-center border border-gray-50">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-serif">MindfulVoice</h2>
                    <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500 hover:bg-gray-200 transition-all">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-8 text-left shadow-sm">
                    <p class="text-[10px] uppercase tracking-widest text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-sm">● Sedang Mendengarkan...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                    Mulai Bicara
                </button>

                <div id="aiResponseArea" class="hidden mt-8 p-6 bg-blue-50 rounded-2xl text-left border border-blue-100 shadow-inner">
                    <p class="text-[10px] uppercase text-blue-400 font-bold mb-2 tracking-widest">Teman AI Menjawab:</p>
                    <p id="aiText" class="text-[#3A4A3F] leading-relaxed italic text-sm">Sedang memikirkan kata-kata hangat untukmu...</p>
                </div>
                
                <div class="mt-10 border-t border-gray-100 pt-6">
                    <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[2px] text-left">Riwayat Rekamanku</h3>
                    <div id="daftarRekaman" class="space-y-3 max-h-60 overflow-y-auto pr-2"></div>
                </div>
            </div>
        `;
        updateDaftarUI();
        setupFitur();
    }
}

async function dapatkanResponAI() {
    const aiTextElement = document.getElementById('aiText');
    document.getElementById('aiResponseArea').classList.remove('hidden');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Kamu adalah teman curhat yang sangat hangat dan empati. Pengguna baru saja merekam jurnal suara mereka. Berikan respon singkat (maksimal 2 kalimat) yang membuat mereka merasa didengar dan divalidasi perasaannya." }] }]
            })
        });
        const data = await response.json();
        aiTextElement.innerText = data.candidates[0].content.parts[0].text;
    } catch (err) {
        aiTextElement.innerText = "Terima kasih sudah berbagi ceritamu hari ini. Kamu hebat sudah meluangkan waktu untuk dirimu sendiri.";
    }
}

async function uploadKeSupabase(blob) {
    const fileName = `jurnal-${Date.now()}.wav`;
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
        let riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
        riwayat.unshift({ name: fileName, path: filePath, date: new Date().toLocaleString('id-ID') });
        localStorage.setItem('my_recordings', JSON.stringify(riwayat));
        
        updateDaftarUI();
        dapatkanResponAI();
    }
}

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    
    if (riwayat.length === 0) {
        container.innerHTML = `<p class="text-left text-[10px] text-gray-300 italic">Belum ada rekaman tersimpan di HP ini.</p>`;
        return;
    }

    container.innerHTML = riwayat.map(item => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
            <div class="text-left">
                <p class="text-[10px] font-bold text-gray-600">${item.date}</p>
            </div>
            <a href="${SUPABASE_URL}/storage/v1/object/public/recordings/${item.path}" 
               download class="text-[10px] bg-white border border-green-200 text-green-600 px-3 py-1 rounded-full font-bold shadow-sm">
               Simpan 📥
            </a>
        </div>
    `).join('');
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const status = document.getElementById('status');
    const btnMusic = document.getElementById('btnMusic');
    const bgMusic = document.getElementById('bgMusic');

    btnMusic.onclick = () => {
        if (bgMusic.paused) { bgMusic.play(); btnMusic.innerText = "Matikan Musik 🔇"; }
        else { bgMusic.pause(); btnMusic.innerText = "Mulai Musik 🎵"; }
    };

    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: 'audio/wav' });
                    uploadKeSupabase(blob);
                };
                mediaRecorder.start();
                btnAction.innerText = "Selesai Bercerita";
                btnAction.style.background = "#f87171";
                status.classList.remove('hidden');
            } catch (err) {
                alert("Mohon izinkan akses mikrofon untuk mulai bercerita.");
            }
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "Mulai Bicara";
            btnAction.style.background = "#8FBC8F";
            status.classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
