import { dailyPrompts } from './prompts.js';

// KONFIGURASI SUPABASE (Ganti dengan milikmu)
const SUPABASE_URL = 'URL_PROYEK_SUPABASE_KAMU';
const SUPABASE_KEY = 'API_KEY_ANON_KAMU';

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <audio id="bgMusic" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
            <div class="max-w-md mx-auto mt-20 p-8 bg-white rounded-[32px] shadow-lg text-center font-sans">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-serif">MindfulVoice</h2>
                    <button id="btnMusic" class="text-xs bg-gray-100 px-3 py-1 rounded-full">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-10 text-left">
                    <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
                </div>

                <div id="status" class="hidden mb-4 text-red-500 animate-pulse font-bold">● Merekam...</div>
                
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg">Mulai Rekam</button>
                
                <div id="areaDownload" class="hidden mt-6 p-4 bg-green-50 rounded-xl">
                    <p class="text-sm text-green-700 mb-2">Rekaman Tersimpan!</p>
                    <a id="linkDownload" class="inline-block bg-white border border-green-500 text-green-600 px-4 py-2 rounded-lg text-sm font-bold">Simpan ke HP 📥</a>
                </div>
            </div>
        `;
        setupFitur();
    }
}

async function uploadKeSupabase(blob) {
    const fileName = `rekaman-${Date.now()}.wav`;
    const filePath = `recordings/${fileName}`;

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
        const urlDownload = window.URL.createObjectURL(blob);
        const linkDownload = document.getElementById('linkDownload');
        linkDownload.href = urlDownload;
        linkDownload.download = fileName; // Ini yang bikin bisa di-download ke HP
        document.getElementById('areaDownload').classList.remove('hidden');
    }
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const status = document.getElementById('status');

    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                uploadKeSupabase(audioBlob);
            };

            mediaRecorder.start();
            btnAction.innerText = "Berhenti & Simpan";
            btnAction.style.backgroundColor = "#f87171";
            status.classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "Mulai Rekam";
            btnAction.style.backgroundColor = "#8FBC8F";
            status.classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
