// client/src/app.js
import { dailyPrompts } from './prompts.js';

// Ambil kunci dari Environment Variables Netlify
const SUPABASE_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co'; // Nanti ini akan otomatis terisi jika pakai process.env atau ganti manual sementara
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHZveHNjem53b3Z4aGVseXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzA4ODUsImV4cCI6MjA4NzU0Njg4NX0.aHCqqAqXz_YQbzCy7qQ7D6IGXZUj-7zOoP40EE4Sg0I'; 
const GEMINI_API_KEY = 'AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U';

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <audio id="bgMusic" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
            <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl font-sans">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-serif">MindfulVoice</h2>
                    <button id="btnMusic" class="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-8 text-left">
                    <p class="text-[10px] uppercase tracking-[2px] text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
                </div>

                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold text-sm text-center">● Sedang Mendengarkan...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">
                    Mulai Bicara
                </button>

                <div id="aiResponseArea" class="hidden mt-8 p-6 bg-blue-50 rounded-2xl text-left border border-blue-100">
                    <p class="text-[10px] uppercase text-blue-400 font-bold mb-2">Teman AI Menjawab:</p>
                    <p id="aiText" class="text-[#3A4A3F] leading-relaxed italic">Sedang berpikir...</p>
                </div>
                
                <div id="areaDownload" class="hidden mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                    <p class="text-xs text-green-700 mb-3">Rekamanmu tersimpan secara privat.</p>
                    <a id="linkDownload" class="inline-block w-full bg-white border border-green-500 text-green-600 py-2 rounded-lg text-sm font-bold text-center">Unduh Rekaman ke HP 📥</a>
                </div>
            </div>
        `;
        setupFitur();
    }
}

async function dapatkanResponAI(transcript) {
    const aiTextElement = document.getElementById('aiText');
    document.getElementById('aiResponseArea').classList.remove('hidden');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyC5OVWRrSJZMHt_7uXMC7e1lU5hTMng8_U`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Kamu adalah teman curhat yang sangat hangat dan empati. Responlah cerita singkat ini dengan tulus dan beri semangat kecil: ${transcript}` }] }]
            })
        });
        const data = await response.json();
        aiTextElement.innerText = data.candidates[0].content.parts[0].text;
    } catch (err) {
        aiTextElement.innerText = "Aku di sini mendengarkanmu. Kamu hebat sudah mau berbagi hari ini.";
    }
}

async function uploadKeSupabase(blob) {
    const fileName = `jurnal-${Date.now()}.wav`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/recordings/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'audio/wav'
        },
        body: blob
    });

    if (response.ok) {
        const url = window.URL.createObjectURL(blob);
        const link = document.getElementById('linkDownload');
        link.href = url;
        link.download = fileName;
        document.getElementById('areaDownload').classList.remove('hidden');
        
        // Pancing AI untuk merespon (Simulasi transkripsi sederhana)
        dapatkanResponAI("Aku baru saja merekam perasaanku hari ini.");
    }
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
            btnAction.classList.replace('bg-[#8FBC8F]', 'bg-red-400');
            status.classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "Mulai Bicara";
            btnAction.classList.replace('bg-red-400', 'bg-[#8FBC8F]');
            status.classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
