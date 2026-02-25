import { dailyPrompts } from './prompts.js';

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

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <audio id="bgMusic" loop src="${MUSIC_URL}"></audio>
            <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl text-center border border-gray-50">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulVoice</h2>
                    <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left shadow-sm">
                    <p class="text-[10px] uppercase tracking-widest text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <div id="textPreview" class="mb-4 text-xs text-gray-400 italic min-h-[20px]"></div>

                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-sm text-center">● AI sedang mendengarkan...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg transition-all mb-4">
                    Mulai Bicara
                </button>

                <div id="aiResponseArea" class="hidden mt-8 p-6 bg-blue-50 rounded-2xl text-left border border-blue-100 shadow-inner">
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
        const promptSystem = "Kamu adalah MindfulVoice, teman curhat yang sangat hangat dan tulus. Gunakan bahasa Indonesia santai (aku-kamu).";
        const promptUser = `Seseorang baru saja bercerita: "${teksCerita}". 
                            Berikan respon 1-2 kalimat yang SANGAT NYAMBUNG dengan ceritanya tadi. 
                            Jangan berikan jawaban umum. Jika ceritanya tentang sedih, kuatkan dia. Jika tentang senang, ikutlah senang.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptSystem + "\n" + promptUser }] }] })
        });
        
        const data = await response.json();
        const hasilAI = data.candidates[0].content.parts[0].text;
        aiTextElement.innerText = hasilAI;
    } catch (err) {
        aiTextElement.innerText = "Aku di sini mendengarkanmu. Ceritakan lebih banyak jika kamu mau.";
    }
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const status = document.getElementById('status');
    const textPreview = document.getElementById('textPreview');
    const bgMusic = document.getElementById('bgMusic');

    bgMusic.volume = 0.3;

    if (recognizer) {
        recognizer.onresult = (event) => {
            let interimTranscription = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                interimTranscription += event.results[i][0].transcript;
            }
            transcription = interimTranscription;
            textPreview.innerText = "Terdengar: " + transcription; // Biar kamu tahu suaramu masuk
        };
    }

    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            bgMusic.volume = 0.05;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            transcription = "";
            textPreview.innerText = "";

            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                bgMusic.volume = 0.3;
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                
                // Beri waktu proses transkripsi
                setTimeout(() => {
                    uploadKeSupabase(blob);
                    // Jika transcription kosong, kita kirim pesan manual ke AI
                    if (transcription.trim().length > 2) {
                        dapatkanResponAI(transcription);
                    } else {
                        dapatkanResponAI("Pengguna tidak bicara apapun, mungkin dia hanya ingin didengarkan dalam diam.");
                    }
                }, 1000);
            };

            mediaRecorder.start();
            if (recognizer) recognizer.start();

            btnAction.innerText = "Selesai Bercerita";
            btnAction.classList.replace('bg-[#8FBC8F]', 'bg-red-400');
            status.classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            if (recognizer) recognizer.stop();
            btnAction.innerText = "Mulai Bicara";
            btnAction.classList.replace('bg-red-400', 'bg-[#8FBC8F]');
            status.classList.add('hidden');
        }
    };
}

// Fungsi dummy agar kode tidak error
async function uploadKeSupabase(blob) { console.log("Audio diupload..."); }
function updateDaftarUI() { console.log("Riwayat diupdate..."); }

tampilkanAplikasi();
