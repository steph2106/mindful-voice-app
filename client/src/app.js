import { dailyPrompts } from './prompts.js';

const MUSIC_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3';
const appDiv = document.getElementById('app');

let mediaRecorder;
let audioChunks = [];

function tampilkanAplikasi() {
    const dataSoal = dailyPrompts[0];
    appDiv.innerHTML = `
        <audio id="bgMusic" loop src="${MUSIC_URL}"></audio>
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl text-center border border-gray-50 font-sans">
            <h2 class="text-[#4A5D4F] text-xl font-bold mb-6 text-left">MindfulJournal <span class="text-[10px] text-green-500 font-normal">● Kualitas HD</span></h2>
            
            <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left shadow-sm">
                <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
            </div>

            <div class="mb-8 p-5 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
                    MULAI REKAM SUARA
                </button>
                <div id="status" class="hidden mt-3 flex items-center justify-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span class="text-red-500 text-[11px] font-bold">MIC AKTIF: BERBICARALAH...</span>
                </div>
            </div>

            <div class="mb-6 text-left">
                <textarea id="manualInput" placeholder="Atau tulis di sini..." 
                    class="w-full p-4 rounded-2xl border border-gray-200 text-sm outline-none bg-white min-h-[100px]"></textarea>
                <button id="btnSaveNote" class="w-full mt-3 py-3 bg-[#4A5D4F] text-white rounded-2xl font-bold shadow-md active:scale-95">
                    Simpan Catatan (.txt)
                </button>
            </div>
            
            <div class="mt-10 border-t border-gray-100 pt-6">
                <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase text-left tracking-widest">Riwayat Jurnal</h3>
                <div id="daftarRekaman" class="space-y-4"></div>
            </div>
        </div>
    `;
    updateDaftarUI();
    setupFitur();
}

async function startRecording() {
    try {
        const bgMusic = document.getElementById('bgMusic');
        bgMusic.volume = 0.05; 

        // 1. Ambil Stream dengan kualitas tertinggi
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1, // Mono lebih stabil untuk suara manusia
                sampleRate: 44100
            } 
        });

        // 2. Tentukan format yang PASTI jalan di HP/Browser
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                         ? 'audio/webm;codecs=opus' 
                         : 'audio/webm';

        mediaRecorder = new MediaRecorder(stream, { 
            mimeType,
            audioBitsPerSecond: 128000 // Kualitas setara MP3 standar
        });

        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            bgMusic.volume = 0.3;
            
            // 3. Gabungkan data menjadi Blob
            const blob = new Blob(audioChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const fileName = `Jurnal_${Date.now()}.webm`;

            // Simpan ke riwayat agar tidak hilang
            simpanKeRiwayat({ type: 'voice', content: 'Jurnal Suara (Rekaman)', fileUrl: url, fileName: fileName });
            
            // Link download otomatis
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            // Matikan mic agar tidak error di rekaman berikutnya
            stream.getTracks().forEach(track => track.stop());
        };

        // 4. KUNCI KUALITAS: Ambil data setiap 500ms agar memori tidak penuh
        mediaRecorder.start(500); 
        
        document.getElementById('btnAction').innerText = "BERHENTI & SIMPAN";
        document.getElementById('btnAction').style.background = "#f87171";
        document.getElementById('status').classList.remove('hidden');

    } catch (err) {
        alert("Mic Gagal: " + err.message);
    }
}

// --- FUNGSI RIWAYAT ---
function simpanKeRiwayat(data) {
    let riwayat = JSON.parse(localStorage.getItem('journal_final_v3') || '[]');
    riwayat.unshift({ ...data, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('journal_final_v3', JSON.stringify(riwayat));
    updateDaftarUI();
}

window.hapusJurnal = function(index) {
    let riwayat = JSON.parse(localStorage.getItem('journal_final_v3') || '[]');
    riwayat.splice(index, 1);
    localStorage.setItem('journal_final_v3', JSON.stringify(riwayat));
    updateDaftarUI();
};

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('journal_final_v3') || '[]');
    container.innerHTML = riwayat.length === 0 ? '<p class="text-[11px] text-gray-300 italic text-left">Belum ada jurnal.</p>' : 
        riwayat.map((item, index) => `
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] font-bold text-gray-400">${item.date}</span>
                    <button onclick="hapusJurnal(${index})" class="text-red-400 text-[10px]">Hapus ×</button>
                </div>
                <p class="text-xs text-[#4A5D4F] mb-3 leading-relaxed">${item.content}</p>
                <a href="${item.fileUrl}" download="${item.fileName}" class="inline-block bg-white border border-[#8FBC8F] text-[#8FBC8F] text-[10px] px-3 py-1.5 rounded-xl font-bold">
                    📥 Ambil File ${item.type === 'voice' ? 'Audio' : 'Teks'}
                </a>
            </div>
        `).join('');
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const btnSaveNote = document.getElementById('btnSaveNote');
    const bgMusic = document.getElementById('bgMusic');

    document.getElementById('btnMusic').onclick = function() {
        if (bgMusic.paused) { bgMusic.play(); this.innerText = "Musik Nyala 🎵"; }
        else { bgMusic.pause(); this.innerText = "Mulai Musik 🎵"; }
    };

    btnAction.onclick = () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            startRecording();
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "MULAI REKAM SUARA";
            btnAction.style.background = "#8FBC8F";
            document.getElementById('status').classList.add('hidden');
        }
    };

    btnSaveNote.onclick = () => {
        const text = document.getElementById('manualInput').value.trim();
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const name = `Note_${Date.now()}.txt`;
        simpanKeRiwayat({ type: 'text', content: text, fileUrl: url, fileName: name });
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        document.getElementById('manualInput').value = "";
    };
}

tampilkanAplikasi();
