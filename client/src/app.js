// client/src/app.js
import { dailyPrompts } from './prompts.js';

// --- KONFIGURASI KUNCI ---
const SUPABASE_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHZveHNjem53b3Z4aGVseXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzA4ODUsImV4cCI6MjA4NzU0Njg4NX0.aHCqqAqXz_YQbzCy7qQ7D6IGXZUj-7zOoP40EE4Sg0I';
const GEMINI_API_KEY = 'AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U'; 
// -------------------------

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];
let transcription = ""; // Tempat menyimpan teks hasil pembicaraan

// Inisialisasi Speech Recognition (Fitur Dengar Suara)
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = Recognition ? new Recognition() : null;
if (recognizer) {
    recognizer.lang = 'id-ID';
    recognizer.continuous = true;
    recognizer.interimResults = false;
}

if (!localStorage.getItem('user_voice_id')) {
    localStorage.setItem('user_voice_id', 'user-' + Math.random().toString(36).substr(2, 9));
}
const userId = localStorage.getItem('user_voice_id');

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <audio id="bgMusic" loop src="https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3"></audio>
            <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl font-sans text-center border border-gray-50">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-serif font-bold">MindfulVoice</h2>
                    <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-8 text-left shadow-sm">
                    <p class="text-[10px] uppercase tracking-widest text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-sm text-center">● AI sedang mendengarkan ceritamu...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                    Mulai Bicara
                </button>

                <div id="aiResponseArea" class="hidden mt-8 p-6 bg-blue-50 rounded-2xl text-left border border-blue-100 shadow-inner">
                    <p class="text-[10px] uppercase text-blue-400 font-bold mb-2 tracking-widest font-bold">Teman AI Menjawab:</p>
                    <p id="aiText" class="text-[#3A4A3F] leading-relaxed italic text-sm">Sedang merespon ceritamu...</p>
                </div>
                
                <div class="mt-10 border-t border-gray-100 pt-6">
                    <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[2px] text-left font-bold">Riwayat Rekaman</h3>
                    <div id="daftarRekaman" class="space-y-3"></div>
                </div>
            </div>
        `;
        updateDaftarUI();
        setupFitur();
    }
}

async function dapatkanResponAI(teksCerita) {
    const aiTextElement = document.getElementById('aiText');
    document.getElementById('aiResponseArea').classList.remove('hidden');

    try {
        const prompt = `Kamu adalah teman curhat yang sangat hangat, empatik, dan tulus. Seseorang baru saja bercerita hal ini padamu: "${teksCerita}". Berikan respon singkat (1-2 kalimat) yang menunjukkan kamu memahami perasaannya dan berikan sedikit dukungan moral. Gunakan bahasa yang santai tapi sopan (aku-kamu).`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
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
        // Kirim hasil transkripsi suara ke AI
        dapatkanResponAI(transcription || "Aku baru saja merekam jurnal suaraku.");
    }
}

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    
    if (riwayat.length === 0) {
        container.innerHTML = `<p class="text-left text-[10px] text-gray-300 italic">Belum ada rekaman.</p>`;
        return;
    }

    container.innerHTML = riwayat.map(item => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
            <span class="text-[10px] font-bold text-gray-500">${item.date}</span>
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
// Tambahkan pengaturan volume awal di baris 141 yang tadi
bgMusic.src = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3'; 
bgMusic.volume = 0.3; // Volume normal musik latar

async function startRecording() {
    // 1. Kecilkan volume musik saat mulai rekam
    bgMusic.volume = 0.1; 

    // 2. Optimalkan kualitas Mic (Noise Suppression)
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        } 
    });

    // ... sisa kode mediaRecorder kamu ...
}

async function stopRecording() {
    // ... kode stop recording kamu ...

    // 3. Kembalikan volume musik setelah selesai rekam
    bgMusic.volume = 0.3; 
}

    if (recognizer) {
        recognizer.onresult = (event) => {
            transcription = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
        };
    }

    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                transcription = ""; // Reset teks
                
                mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: 'audio/wav' });
                    uploadKeSupabase(blob);
                };

                mediaRecorder.start();
                if (recognizer) recognizer.start(); // Mulai dengar teks

                btnAction.innerText = "Selesai Bercerita";
                btnAction.style.background = "#f87171";
                status.classList.remove('hidden');
            } catch (err) {
                alert("Mohon izinkan akses mikrofon.");
            }
        } else {
            mediaRecorder.stop();
            if (recognizer) recognizer.stop(); // Berhenti dengar teks
            btnAction.innerText = "Mulai Bicara";
            btnAction.style.background = "#8FBC8F";
            status.classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
