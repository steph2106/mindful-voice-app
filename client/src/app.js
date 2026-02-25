import { dailyPrompts } from './prompts.js';

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];

function tampilkanAplikasi() {
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <audio id="bgMusic" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>

            <div class="max-w-md mx-auto mt-20 p-8 bg-white rounded-[32px] shadow-lg border border-gray-100 font-sans text-center">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-[#4A5D4F] text-xl font-serif">MindfulVoice</h2>
                    <button id="btnMusic" class="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
                </div>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-10 text-left">
                    <p class="text-[10px] uppercase tracking-[2px] text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <div id="statusRekam" class="hidden mb-4 text-red-500 animate-pulse text-sm font-bold">● Sedang Merekam...</div>

                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg hover:bg-[#7FA87F] transition-all">
                    Mulai Rekam Suara
                </button>
                
                <p id="infoKoneksi" class="text-[10px] text-gray-300 mt-6 tracking-widest uppercase">Koneksi Berhasil</p>
            </div>
        `;

        setupFitur();
    }
}

function setupFitur() {
    const btnMusic = document.getElementById('btnMusic');
    const bgMusic = document.getElementById('bgMusic');
    const btnAction = document.getElementById('btnAction');
    const statusRekam = document.getElementById('statusRekam');

    // Kontrol Musik
    btnMusic.onclick = () => {
        if (bgMusic.paused) {
            bgMusic.play();
            btnMusic.innerText = "Matikan Musik 🔇";
        } else {
            bgMusic.pause();
            btnMusic.innerText = "Mulai Musik 🎵";
        }
    };

    // Kontrol Rekaman
    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                alert("Rekaman selesai! Langkah selanjutnya: Kirim ke Supabase.");
                audioChunks = [];
            };

            mediaRecorder.start();
            btnAction.innerText = "Berhenti & Simpan";
            btnAction.classList.replace('bg-[#8FBC8F]', 'bg-red-500');
            statusRekam.classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "Mulai Rekam Suara";
            btnAction.classList.replace('bg-red-500', 'bg-[#8FBC8F]');
            statusRekam.classList.add('hidden');
        }
    };
}

tampilkanAplikasi();
