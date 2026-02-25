import { dailyPrompts } from './prompts.js';

const MUSIC_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3';
const appDiv = document.getElementById('app');

let mediaRecorder;
let audioChunks = [];
let audioStream;

function tampilkanAplikasi() {
    const dataSoal = dailyPrompts[0];
    appDiv.innerHTML = `
        <audio id="bgMusic" loop src="${MUSIC_URL}"></audio>
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl text-center border border-gray-50 font-sans">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulJournal</h2>
                <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Musik 🎵</button>
            </div>
            
            <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left">
                <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
            </div>

            <div class="mb-8 p-5 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <button id="btnAction" class="w-full py-4 bg-[#8FBC8F] text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
                    MULAI REKAM SUARA
                </button>
                <div id="status" class="hidden mt-3 flex items-center justify-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span class="text-red-500 text-[11px] font-bold tracking-widest uppercase">Merekam...</span>
                </div>
            </div>

            <div class="mb-6 text-left">
                <textarea id="manualInput" placeholder="Tulis catatan di sini..." 
                    class="w-full p-4 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8FBC8F] outline-none bg-white min-h-[100px] shadow-inner"></textarea>
                <button id="btnSaveNote" class="w-full mt-3 py-3 bg-[#4A5D4F] text-white rounded-2xl font-bold shadow-md active:scale-95">
                    Simpan Note (.txt)
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
        // Kunci: Kecilkan musik ke level sangat rendah saat rekam
        bgMusic.volume = 0.03; 

        audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true, // Meredam suara musik dari speaker
                noiseSuppression: true,
                autoGainControl: true
            } 
        });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        mediaRecorder = new MediaRecorder(audioStream, { mimeType });
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            // Balikkan volume musik ke normal
            bgMusic.volume = 0.3;
            
            const blob = new Blob(audioChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const fileName = `Jurnal_Suara_${Date.now()}.webm`;

            simpanKeRiwayat({ type: 'voice', content: 'Rekaman Suara Jurnal', fileUrl: url, fileName: fileName });
            
            // Download otomatis
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            audioStream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start(1000); 
        updateUI(true);
    } catch (err) {
        alert("Mic Error: " + err.message);
    }
}

function updateUI(isRecording) {
    const btn = document.getElementById('btnAction');
    const status = document.getElementById('status');
    if (isRecording) {
        btn.innerText = "BERHENTI & SIMPAN";
        btn.style.background = "#f87171";
        status.classList.remove('hidden');
    } else {
        btn.innerText = "MULAI REKAM SUARA";
        btn.style.background = "#8FBC8F";
        status.classList.add('hidden');
    }
}

function simpanKeRiwayat(data) {
    let riwayat = JSON.parse(localStorage.getItem('my_journal_final') || '[]');
    riwayat.unshift({ ...data, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('my_journal_final', JSON.stringify(riwayat));
    updateDaftarUI();
}

window.hapusJurnal = function(index) {
    let riwayat = JSON.parse(localStorage.getItem('my_journal_final') || '[]');
    riwayat.splice(index, 1);
    localStorage.setItem('my_journal_final', JSON.stringify(riwayat));
    updateDaftarUI();
};

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_journal_final') || '[]');
    container.innerHTML = riwayat.length === 0 ? '<p class="text-[11px] text-gray-300 italic text-left">Belum ada riwayat.</p>' : 
        riwayat.map((item, index) => `
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] font-bold text-gray-400 uppercase">${item.date}</span>
                    <button onclick="hapusJurnal(${index})" class="text-red-400 text-[10px] font-bold">Hapus ×</button>
                </div>
                <p class="text-xs text-[#4A5D4F] mb-3 leading-relaxed">${item.content}</p>
                <a href="${item.fileUrl}" download="${item.fileName}" class="inline-flex items-center gap-1 bg-white border border-gray-200 text-[10px] px-3 py-1.5 rounded-xl font-bold text-gray-600 shadow-sm active:bg-gray-100">
                    📥 Download ${item.type === 'voice' ? 'Audio' : 'Teks'}
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
            updateUI(false);
        }
    };

    btnSaveNote.onclick = () => {
        const text = document.getElementById('manualInput').value.trim();
        if (!text) return alert("Ketik sesuatu dulu.");
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const name = `Jurnal_Teks_${Date.now()}.txt`;
        simpanKeRiwayat({ type: 'text', content: text, fileUrl: url, fileName: name });
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        document.getElementById('manualInput').value = "";
    };
}

tampilkanAplikasi();
