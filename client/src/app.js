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
    recognizer.interimResults = true;
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
            <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl text-center border border-gray-50 font-sans">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulVoice</h2>
                    <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left shadow-sm">
                    <p class="text-[10px] uppercase tracking-widest text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <div id="textPreview" class="mb-4 text-xs text-gray-400 italic min-h-[20px]"></div>
                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-sm">● AI sedang mendengarkan...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg transition-all mb-4 hover:opacity-90">
                    Mulai Bicara
                </button>

                <div class="relative mb-6">
                    <textarea id="manualInput" placeholder="Atau ketik ceritamu di sini..." 
                        class="w-full p-4 rounded-2xl border border-gray-100 text-sm focus:ring-2 focus:ring-[#8FBC8F] outline-none bg-gray-50 min-h-[100px] resize-none"></textarea>
                    <button id="btnSendText" class="absolute bottom-3 right-3 bg-[#4A5D4F] text-white p-2 rounded-xl text-xs font-bold shadow-sm">Kirim Teks</button>
                </div>

                <div id="aiResponseArea" class="hidden mt-6 p-6 bg-blue-50 rounded-2xl text-left border border-blue-100 shadow-inner">
                    <p class="text-[10px] uppercase text-blue-400 font-bold mb-2 tracking-widest">Teman AI Menjawab:</p>
                    <p id="aiText" class="text-[#3A4A3F] leading-relaxed italic text-sm">Berpikir...</p>
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
    aiTextElement.innerText = "Merespon ceritamu...";

    try {
        const promptSystem = "Kamu adalah MindfulVoice, teman curhat yang hangat. Gunakan bahasa Indonesia santai (aku-kamu).";
        const promptUser = `Seseorang bercerita: "${teksCerita}". Berikan respon 1-2 kalimat yang sangat nyambung dan empatik.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptSystem + "\n" + promptUser }] }] })
        });
        
        const data = await response.json();
        const hasilAI = data.candidates[0].content.parts[0].text;
        
        // Tampilkan di layar
        aiTextElement.innerText = hasilAI;

        // --- SIMPAN SEBAGAI NOTE ---
        // 1. Simpan ke Riwayat Lokal (Agar muncul di daftar bawah)
        let riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
        riwayat.unshift({ 
            name: "Catatan Teks", 
            content: teksCerita, 
            aiResponse: hasilAI,
            date: new Date().toLocaleString('id-ID'),
            isText: true 
        });
        localStorage.setItem('my_recordings', JSON.stringify(riwayat));
        updateDaftarUI();

        // 2. Notifikasi ke user bahwa sudah tersimpan
        console.log("Jurnal disimpan ke Note HP: ", teksCerita);
        
    } catch (err) {
        aiTextElement.innerText = "Aku di sini mendengarkanmu. Terima kasih ya sudah mau berbagi sama aku. Pelan-pelan saja ya jalaninnya. Menerima keadaan memang paling sulit di dalam hidup kita. Tetapi setelah kamu terima semuanya itu dengan hati yang lapang, percayalah, kamu sudah maju ke langkah berikutnya";
    }
}

async function uploadKeSupabase(blob) {
    const fileName = `jurnal-${Date.now()}.wav`;
    const filePath = `${userId}/${fileName}`;
    await fetch(`${SUPABASE_URL}/storage/v1/object/recordings/${filePath}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'audio/wav' },
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
            <a href="${SUPABASE_URL}/storage/v1/object/public/recordings/${item.path}" target="_blank" class="text-[10px] bg-white border border-green-200 text-green-600 px-3 py-1 rounded-full font-bold">Putar 🎧</a>
        </div>
    `).join('');
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const btnSendText = document.getElementById('btnSendText');
    const manualInput = document.getElementById('manualInput');
    const textPreview = document.getElementById('textPreview');
    const bgMusic = document.getElementById('bgMusic');

    bgMusic.volume = 0.3;

    document.getElementById('btnMusic').onclick = function() {
        if (bgMusic.paused) { bgMusic.play(); this.innerText = "Musik Nyala 🎵"; }
        else { bgMusic.pause(); this.innerText = "Mulai Musik 🎵"; }
    };

    if (recognizer) {
        recognizer.onresult = (event) => {
            let resultText = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                resultText += event.results[i][0].transcript;
            }
            transcription = resultText;
            textPreview.innerText = "Terdengar: " + transcription;
        };
    }

    btnSendText.onclick = () => {
        const teks = manualInput.value.trim();
        if (teks) { dapatkanResponAI(teks); manualInput.value = ""; }
    };

    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            bgMusic.volume = 0.05;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = []; transcription = ""; textPreview.innerText = "";
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                bgMusic.volume = 0.3;
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                setTimeout(() => {
                    uploadKeSupabase(blob);
                    dapatkanResponAI(transcription || "Sesi jurnal suara tanpa kata.");
                }, 1000);
            };
            mediaRecorder.start();
            if (recognizer) recognizer.start();
            btnAction.innerText = "Selesai Bercerita";
            btnAction.classList.replace('bg-[#8FBC8F]', 'bg-red-400');
            document.getElementById('status').classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            if (recognizer) recognizer.stop();
            btnAction.innerText = "Mulai Bicara";
            btnAction.classList.replace('bg-red-400', 'bg-[#8FBC8F]');
            document.getElementById('status').classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
