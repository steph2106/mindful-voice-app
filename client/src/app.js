import { dailyPrompts } from './prompts.js';

// Load PDF Library
const script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
document.head.appendChild(script);

const MUSIC_URL = 'https://ntxvoxscznwovxhelyrv.supabase.co/storage/v1/object/public/assets/Clearing%20the%20Mind.mp3';
const appDiv = document.getElementById('app');

let mediaRecorder;
let audioChunks = [];
let audioContext;
let audioSource;

function tampilkanAplikasi() {
    const dataSoal = dailyPrompts[0];
    appDiv.innerHTML = `
        <audio id="bgMusic" loop src="${MUSIC_URL}" crossorigin="anonymous"></audio>
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl text-center border border-gray-50 font-sans">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulVoice App</h2>
                <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mulai Musik 🎵</button>
            </div>
            
            <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left shadow-sm">
                <p class="text-[10px] uppercase text-gray-400 mb-2 tracking-widest">${dataSoal.focus || 'Refleksi'}</p>
                <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
            </div>

            <div class="mb-8 p-6 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                <button id="btnAction" class="w-full py-5 bg-[#8FBC8F] text-white rounded-2xl font-bold shadow-lg active:scale-95 text-lg">
                    Mulai Bicara
                </button>
                <div id="status" class="hidden mt-4 flex items-center justify-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span class="text-red-500 text-[11px] font-bold">MEREKAM & MUSIK AKTIF</span>
                </div>
            </div>

            <div class="mb-6 text-left">
                <textarea id="manualInput" placeholder="Tulis ceritamu di sini..." 
                    class="w-full p-5 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8FBC8F] outline-none bg-white min-h-[100px] shadow-inner"></textarea>
                
                <div class="grid grid-cols-2 gap-3 mt-4">
                    <button id="btnSavePdf" class="py-3 bg-[#4A5D4F] text-white rounded-xl font-bold text-xs shadow-md">Simpan PDF</button>
                    <button id="btnSaveTxt" class="py-3 bg-gray-200 text-gray-600 rounded-xl font-bold text-xs shadow-sm">Simpan Teks</button>
                </div>
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
        
        // Agar musik tidak mati di Android/iOS saat mic aktif:
        // Kita gunakan AudioContext untuk memicu stream audio yang konstan
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false, 
                noiseSuppression: false,
                autoGainControl: true
            } 
        });

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const name = `MindfulVoice_${Date.now()}.webm`;
            simpanKeRiwayat({ type: 'voice', content: 'Rekaman Suara Jurnal', fileUrl: url, fileName: name });
            
            const a = document.createElement('a');
            a.href = url; a.download = name; a.click();
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        updateUI(true);
    } catch (err) { 
        alert("Gagal rekam: " + err.message); 
    }
}

function updateUI(isRecording) {
    const btn = document.getElementById('btnAction');
    const status = document.getElementById('status');
    btn.innerText = isRecording ? "Selesai Bicara" : "Mulai Bicara";
    btn.style.background = isRecording ? "#f87171" : "#8FBC8F";
    isRecording ? status.classList.remove('hidden') : status.classList.add('hidden');
}

function simpanKeRiwayat(data) {
    let riwayat = JSON.parse(localStorage.getItem('mindfulvoice_v6') || '[]');
    riwayat.unshift({ ...data, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('mindfulvoice_v6', JSON.stringify(riwayat));
    updateDaftarUI();
}

window.hapusJurnal = function(index) {
    let riwayat = JSON.parse(localStorage.getItem('mindfulvoice_v6') || '[]');
    riwayat.splice(index, 1);
    localStorage.setItem('mindfulvoice_v6', JSON.stringify(riwayat));
    updateDaftarUI();
};

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('mindfulvoice_v6') || '[]');
    container.innerHTML = riwayat.length === 0 ? '<p class="text-[11px] text-gray-300 italic text-left">Belum ada riwayat.</p>' : 
        riwayat.map((item, index) => `
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] font-bold text-gray-400 uppercase">${item.date}</span>
                    <button onclick="hapusJurnal(${index})" class="text-red-400 text-[10px] font-bold">Hapus ×</button>
                </div>
                <p class="text-xs text-[#4A5D4F] mb-3 leading-relaxed">${item.content}</p>
                <a href="${item.fileUrl}" download="${item.fileName}" class="inline-block bg-white border border-gray-200 text-[10px] px-3 py-1.5 rounded-xl font-bold text-gray-600 shadow-sm active:bg-gray-100">
                    📥 Download Audio
                </a>
            </div>
        `).join('');
}

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const bgMusic = document.getElementById('bgMusic');
    const btnMusic = document.getElementById('btnMusic');

    btnMusic.onclick = async () => {
        // Resume AudioContext jika diperlukan (untuk Chrome/Safari)
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        if (bgMusic.paused) { 
            bgMusic.play(); 
            bgMusic.volume = 0.3;
            btnMusic.innerText = "Musik Nyala 🎵"; 
        } else { 
            bgMusic.pause(); 
            btnMusic.innerText = "Mulai Musik 🎵"; 
        }
    };

    btnAction.onclick = () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") startRecording();
        else { mediaRecorder.stop(); updateUI(false); }
    };

    document.getElementById('btnSavePdf').onclick = () => {
        const text = document.getElementById('manualInput').value.trim();
        if (!text) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(text, 10, 10);
        doc.save(`Note_${Date.now()}.pdf`);
        simpanKeRiwayat({ type: 'text', content: text, fileUrl: '#', fileName: 'pdf' });
        document.getElementById('manualInput').value = "";
    };

    document.getElementById('btnSaveTxt').onclick = () => {
        const text = document.getElementById('manualInput').value.trim();
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        simpanKeRiwayat({ type: 'text', content: text, fileUrl: url, fileName: 'txt' });
        const a = document.createElement('a'); a.href = url; a.download = `Note_${Date.now()}.txt`; a.click();
        document.getElementById('manualInput').value = "";
    };
}

tampilkanAplikasi();
