import { dailyPrompts } from './prompts.js';

// --- KONFIGURASI ---
const MUSIC_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3';
const appDiv = document.getElementById('app');

let mediaRecorder;
let audioChunks = [];
let audioStream;

// --- TAMPILAN UTAMA ---
function tampilkanAplikasi() {
    const dataSoal = dailyPrompts[0];
    appDiv.innerHTML = `
        <audio id="bgMusic" loop src="${MUSIC_URL}"></audio>
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl text-center border border-gray-50 font-sans">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulJournal</h2>
                <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
            </div>
            
            <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left">
                <p class="text-[10px] uppercase text-gray-400 mb-2">Refleksi Hari Ini</p>
                <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
            </div>

            <div class="mb-8 p-5 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                <p class="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Voice Journal</p>
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
                    Mulai Rekam Suara
                </button>
                <div id="status" class="hidden mt-3 flex items-center justify-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span class="text-red-500 text-[11px] font-bold tracking-widest uppercase">Merekam...</span>
                </div>
            </div>

            <div class="mb-6 text-left">
                <p class="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Text Journal</p>
                <textarea id="manualInput" placeholder="Tulis ceritamu di sini..." 
                    class="w-full p-4 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8FBC8F] outline-none bg-white min-h-[120px] shadow-inner"></textarea>
                <button id="btnSaveNote" class="w-full mt-3 py-3 bg-[#4A5D4F] text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">
                    Simpan & Download Note (.txt)
                </button>
            </div>
            
            <div class="mt-10 border-t border-gray-100 pt-6">
                <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase text-left tracking-[2px]">Riwayat Jurnal</h3>
                <div id="daftarRekaman" class="space-y-4"></div>
            </div>
        </div>
    `;
    updateDaftarUI();
    setupFitur();
}

// --- LOGIKA MEREKAM (FIXED AUDIO) ---
async function startRecording() {
    try {
        const bgMusic = document.getElementById('bgMusic');
        bgMusic.volume = 0.05; // Kecilkan musik agar suara mic masuk jelas

        audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });

        // Pakai format yang paling didukung (webm/opus)
        let options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'audio/ogg' };
        }

        mediaRecorder = new MediaRecorder(audioStream, options);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            bgMusic.volume = 0.3;
            const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(blob);
            const fileName = `Jurnal_Suara_${Date.now()}.wav`;

            simpanKeRiwayat({ 
                type: 'voice', 
                content: 'Rekaman Suara Jurnal', 
                fileUrl: url, 
                fileName: fileName 
            });

            // Langsung tawarkan download
            triggerDownload(url, fileName);

            // Matikan Mic sepenuhnya
            audioStream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        updateButtonUI(true);
    } catch (err) {
        alert("Gagal akses Mikrofon: " + err.message);
    }
}

// --- FUNGSI PEMBANTU ---
function triggerDownload(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function updateButtonUI(isRecording) {
    const btnAction = document.getElementById('btnAction');
    const status = document.getElementById('status');
    if (isRecording) {
        btnAction.innerText = "Berhenti & Simpan Audio";
        btnAction.style.background = "#f87171";
        status.classList.remove('hidden');
    } else {
        btnAction.innerText = "Mulai Rekam Suara";
        btnAction.style.background = "#8FBC8F";
        status.classList.add('hidden');
    }
}

function simpanKeRiwayat(data) {
    let riwayat = JSON.parse(localStorage.getItem('my_journal_v2') || '[]');
    riwayat.unshift({ 
        ...data, 
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) 
    });
    localStorage.setItem('my_journal_v2', JSON.stringify(riwayat));
    updateDaftarUI();
}

window.hapusJurnal = function(index) {
    if (confirm("Hapus jurnal ini dari riwayat?")) {
        let riwayat = JSON.parse(localStorage.getItem('my_journal_v2') || '[]');
        riwayat.splice(index, 1);
        localStorage.setItem('my_journal_v2', JSON.stringify(riwayat));
        updateDaftarUI();
    }
};

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_journal_v2') || '[]');
    
    container.innerHTML = riwayat.length === 0 ? 
        '<p class="text-[11px] text-gray-300 italic text-left">Belum ada riwayat jurnal.</p>' : 
        riwayat.map((item, index) => `
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left shadow-sm">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">${item.date}</span>
                    <button onclick="hapusJurnal(${index})" class="text-red-300 hover:text-red-500 text-[11px] font-bold">Hapus ×</button>
                </div>
                <p class="text-xs text-[#4A5D4F] mb-3 leading-relaxed">${item.content}</p>
                <a href="${item.fileUrl}" download="${item.fileName}" class="inline-flex items-center gap-1 bg-white border border-gray-200 text-[10px] px-3 py-1.5 rounded-xl font-bold text-gray-600 shadow-sm active:bg-gray-100">
                    📥 Simpan ${item.type === 'text' ? 'Note' : 'Audio'} ke HP
                </a>
            </div>
        `).join('');
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const btnSaveNote = document.getElementById('btnSaveNote');
    const manualInput = document.getElementById('manualInput');
    const bgMusic = document.getElementById('bgMusic');

    document.getElementById('btnMusic').onclick = function() {
        if (bgMusic.paused) { 
            bgMusic.play().catch(() => alert("Klik di mana saja dulu agar musik bisa diputar")); 
            this.innerText = "Musik Nyala 🎵"; 
        } else { 
            bgMusic.pause(); 
            this.innerText = "Mulai Musik 🎵"; 
        }
    };

    // LOGIKA TOMBOL REKAM
    btnAction.onclick = () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            startRecording();
        } else {
            mediaRecorder.stop();
            updateButtonUI(false);
        }
    };

    // LOGIKA TOMBOL SIMPAN TEXT
    btnSaveNote.onclick = () => {
        const text = manualInput.value.trim();
        if (!text) return alert("Tulis jurnalmu dulu ya.");

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const fileName = `Jurnal_Teks_${Date.now()}.txt`;

        simpanKeRiwayat({ type: 'text', content: text, fileUrl: url, fileName: fileName });
        triggerDownload(url, fileName);
        manualInput.value = "";
    };
}

tampilkanAplikasi();
