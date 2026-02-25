import { dailyPrompts } from './prompts.js';

// --- KONFIGURASI ---
const SUPABASE_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHZveHNjem53b3Z4aGVseXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzA4ODUsImV4cCI6MjA4NzU0Njg4NX0.aHCqqAqXz_YQbzCy7qQ7D6IGXZUj-7zOoP40EE4Sg0I';
const GEMINI_API_KEY = 'AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U'; 
const MUSIC_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3';

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

// --- FUNGSI UTAMA ---
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
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left">
                    <p class="text-[10px] uppercase text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
                </div>

                <div id="textPreview" class="mb-4 text-[10px] text-gray-400 italic"></div>
                <div id="status" class="hidden mb-4 text-red-500 animate-pulse text-sm">● Mendengarkan...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg mb-4">Mulai Bicara</button>

                <div class="relative mb-6">
                    <textarea id="manualInput" placeholder="Atau ketik ceritamu di sini..." 
                        class="w-full p-4 rounded-2xl border border-gray-100 text-sm focus:ring-2 focus:ring-[#8FBC8F] outline-none bg-gray-50 min-h-[80px] resize-none"></textarea>
                    <button id="btnSendText" class="absolute bottom-2 right-2 bg-[#4A5D4F] text-white px-3 py-1 rounded-lg text-[10px]">Kirim</button>
                </div>

                <div id="aiResponseArea" class="hidden mt-6 p-5 bg-blue-50 rounded-2xl text-left border border-blue-100">
                    <p class="text-[10px] uppercase text-blue-400 font-bold mb-1">Respon AI:</p>
                    <p id="aiText" class="text-[#3A4A3F] text-sm italic"></p>
                </div>
                
                <div class="mt-10 border-t border-gray-100 pt-6">
                    <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase text-left">Riwayat Jurnal</h3>
                    <div id="daftarRekaman" class="space-y-3"></div>
                </div>
            </div>
        `;
        updateDaftarUI();
        setupFitur();
    }
}

// --- LOGIKA AI & SIMPAN ---
async function dapatkanResponAI(teksCerita) {
    const aiTextElement = document.getElementById('aiText');
    const responseArea = document.getElementById('aiResponseArea');
    responseArea.classList.remove('hidden');
    aiTextElement.innerText = "Membaca ceritamu...";

    try {
        const promptSystem = "Kamu adalah teman curhat yang sangat perhatian. DILARANG memberikan jawaban umum.";
        const promptUser = `PENTING: Pengguna bercerita "${teksCerita}". Jawablah dengan 1-2 kalimat yang sangat spesifik menanggapi isi ceritanya secara empati.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptSystem + "\n" + promptUser }] }] })
        });
        
        const data = await response.json();
        const hasilAI = data.candidates[0].content.parts[0].text;
        aiTextElement.innerText = hasilAI;

        // Simpan ke Riwayat
        let riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
        riwayat.unshift({ content: teksCerita, aiResponse: hasilAI, date: new Date().toLocaleString('id-ID'), isText: true });
        localStorage.setItem('my_recordings', JSON.stringify(riwayat));
        updateDaftarUI();
    } catch (err) {
        aiTextElement.innerText = "Terima kasih sudah berbagi. Aku di sini untukmu.";
    }
}

// --- FITUR HAPUS & UI ---
window.hapusRecord = function(index) {
    if (confirm("Hapus catatan ini?")) {
        let riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
        riwayat.splice(index, 1);
        localStorage.setItem('my_recordings', JSON.stringify(riwayat));
        updateDaftarUI();
    }
};

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_recordings') || '[]');
    container.innerHTML = riwayat.length === 0 ? '<p class="text-[10px] text-gray-300 italic text-left">Kosong.</p>' : 
        riwayat.map((item, index) => `
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[9px] font-bold text-gray-400">${item.date}</span>
                    <button onclick="hapusRecord(${index})" class="text-[9px] text-red-400">Hapus ×</button>
                </div>
                <p class="text-[11px] text-[#4A5D4F] line-clamp-2">${item.isText ? item.content : 'Rekaman Suara'}</p>
                <p class="text-[10px] italic text-blue-500 mt-1">${item.aiResponse || ''}</p>
            </div>
        `).join('');
}

// --- SETUP FITUR ---
function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const bgMusic = document.getElementById('bgMusic');
    const manualInput = document.getElementById('manualInput');
    const textPreview = document.getElementById('textPreview');

    bgMusic.volume = 0.3;

    document.getElementById('btnMusic').onclick = function() {
        if (bgMusic.paused) { bgMusic.play(); this.innerText = "Musik Nyala 🎵"; }
        else { bgMusic.pause(); this.innerText = "Mulai Musik 🎵"; }
    };

    if (recognizer) {
        recognizer.onresult = (event) => {
            let res = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) { res += event.results[i][0].transcript; }
            transcription = res;
            textPreview.innerText = "Terdengar: " + transcription;
        };
    }

    document.getElementById('btnSendText').onclick = () => {
        const t = manualInput.value.trim();
        if (t) { dapatkanResponAI(t); manualInput.value = ""; }
    };

    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            bgMusic.volume = 0.05;
            const s = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(s);
            audioChunks = []; transcription = ""; textPreview.innerText = "";
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                bgMusic.volume = 0.3;
                setTimeout(() => { dapatkanResponAI(transcription || "Sesi suara tanpa teks."); }, 1000);
            };
            mediaRecorder.start();
            if (recognizer) recognizer.start();
            btnAction.innerText = "Selesai Bercerita";
            btnAction.style.background = "#f87171";
            document.getElementById('status').classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            if (recognizer) recognizer.stop();
            btnAction.innerText = "Mulai Bicara";
            btnAction.style.background = "#8FBC8F";
            document.getElementById('status').classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
