// client/src/app.js
import { dailyPrompts } from './prompts.js';

// --- KONFIGURASI KUNCI ---
const SUPABASE_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHZveHNjem53b3Z4aGVseXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzA4ODUsImV4cCI6MjA4NzU0Njg4NX0.aHCqqAqXz_YQbzCy7qQ7D6IGXZUj-7zOoP40EE4Sg0I';
const GEMINI_API_KEY = 'AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U'; 
const MUSIC_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3';
// -------------------------

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];
let transcription = ""; 

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = Recognition ? new Recognition() : null;
if (recognizer) {
    recognizer.lang = 'id-ID';
    recognizer.continuous = true;
    recognizer.interimResults = true; // Mengaktifkan hasil sementara agar lebih akurat
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
            <audio id="bgMusic" loop src="${MUSIC_URL}"></audio>
            <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl font-sans text-center border border-gray-50">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulVoice</h2>
                    <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-8 text-left shadow-sm">
                    <p class="text-[10px] uppercase tracking-widest text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-sm text-center">● AI sedang mendengarkan...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg transition-all">
                    Mulai Bicara
                </button>

                <div id="aiResponseArea" class="hidden mt-8 p-6 bg-blue-50 rounded-2xl text-left border border-blue-100 shadow-inner">
                    <p class="text-[10px] uppercase text-blue-400 font-bold mb-2 tracking-widest">Teman AI Menjawab:</p>
                    <p id="aiText" class="text-[#3A4A3F] leading-relaxed italic text-sm">Sedang merespon ceritamu...</p>
                </div>
                
                <div class="mt-10 border-t border-gray-100 pt-6">
                    <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[2px] text-left">Riwayat Rekaman</h3>
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
    const responseArea = document.getElementById('aiResponseArea');
    responseArea.classList.remove('hidden');
    aiTextElement.innerText = "Berpikir...";

    // Cek jika teks kosong, beri konteks default
    const inputUser = (teksCerita && teksCerita.trim().length > 0) ? teksCerita : "Saya baru saja menyelesaikan sesi jurnal suara saya tanpa banyak bicara.";

    try {
        const prompt = `Kamu adalah MindfulVoice, teman curhat yang hangat dan penuh empati. Seseorang baru saja bercerita hal ini: "${inputUser}". 
        Berikan respon singkat (1-2 kalimat) yang sangat spesifik menanggapi apa yang dia katakan. 
        Tunjukkan bahwa kamu benar-benar mendengarkan. Gunakan bahasa Indonesia santai (aku-kamu).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        aiTextElement.innerText = data.candidates[0].content.parts[0].text;
    } catch (err) {
        aiTextElement.innerText = "Terima kasih sudah berbagi ceritamu. Aku di sini mendengarkanmu. Kamu hebat.";
    }
}

async function uploadKeSupabase(blob) {
    const fileName = `jurnal-${Date.now()}.wav`;
    const filePath = `${userId}/${fileName}`;
    await fetch(`${SUPABASE_URL}/storage/v1/object/recordings/${filePath}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'audio/wav'
        },
        body: blob
    });
    
    let riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    riwayat.unshift({ name: fileName, path: filePath, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('my_recordings', JSON.stringify(riwayat));
    updateDaftarUI();
}

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    if (riwayat.length === 0) {
        container.innerHTML = `<p class="text-left text-[10px] text-gray-300 italic">Belum ada rekaman.</p>`;
        return;
    }
    container.innerHTML = riwayat.map(item => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span class="text-[10px] font-bold text-gray-500">${item.date}</span>
            <a href="${SUPABASE_URL}/storage/v1/object/public/recordings/${item.path}" target="_blank" class="text-[10px] bg-white border border-green-200 text-green-600 px-3 py-1 rounded-full font-bold shadow-sm">Putar 🎧</a>
        </div>
    `).join('');
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const status = document.getElementById('status');
    const btnMusic = document.getElementById('btnMusic');
    const bgMusic = document.getElementById('bgMusic');

    bgMusic.volume = 0.3; // Volume normal musik latar

    btnMusic.onclick = () => {
        if (bgMusic.paused) {
            bgMusic.play().catch(e => console.log("Interaksi user diperlukan"));
            btnMusic.innerText = "Musik Nyala 🎵";
        } else {
            bgMusic.pause();
            btnMusic.innerText = "Mulai Musik 🎵";
        }
    };

    // --- BAGIAN PENGENALAN SUARA (PASTIKAN INI JALAN) ---
if (recognizer) {
    recognizer.onstart = () => {
        console.log("Speech Recognition: Mulai mendengarkan...");
        transcription = ""; // Pastikan bersih setiap mulai
    };

    recognizer.onresult = (event) => {
        // Mengambil teks paling update dari suara kamu
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
        }
        transcription = currentText;
        console.log("Teks yang tertangkap:", transcription); 
    };

    recognizer.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
    };
}

btnAction.onclick = async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        // START RECORDING
        bgMusic.volume = 0.05;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                bgMusic.volume = 0.3;
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                
                // JEDA 1.5 DETIK (Agar Speech Recognition benar-benar selesai memproses)
                setTimeout(() => {
                    uploadKeSupabase(blob);
                    
                    // CEK TERAKHIR: Kalau masih kosong, kita paksa AI merespon "kebisuan"
                    const hasilTeks = transcription.trim();
                    if (hasilTeks.length > 0) {
                        dapatkanResponAI(hasilTeks);
                    } else {
                        dapatkanResponAI("Pengguna baru saja merekam suara tapi teksnya tidak terdeteksi. Berikan sapaan hangat dan tanyakan apakah ada yang ingin diceritakan lagi.");
                    }
                }, 1500);
            };

            mediaRecorder.start();
            if (recognizer) recognizer.start();

            btnAction.innerText = "Selesai Bercerita";
            btnAction.style.background = "#f87171";
            status.classList.remove('hidden');
        } catch (err) {
            alert("Mic tidak aktif: " + err);
        }
    } else {
        // STOP RECORDING
        mediaRecorder.stop();
        if (recognizer) recognizer.stop();
        btnAction.innerText = "Mulai Bicara";
        btnAction.style.background = "#8FBC8F";
        status.classList.add('hidden');
    }
};
