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
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-[#4A5D4F] text-xl font-bold">MindfulJournal</h2>
                <button id="btnMusic" class="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500">Musik 🎵</button>
            </div>
            
            <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-6 text-left">
                <p class="text-lg italic text-[#4A5D4F]">"${dataSoal.text}"</p>
            </div>

            <div class="mb-8 p-4 border-2 border-dashed border-gray-100 rounded-2xl">
                <p class="text-[10px] font-bold text-gray-400 mb-2 uppercase">Voice Journal</p>
                <button id="btnAction" class="w-full py-3 bg-[#8FBC8F] text-white rounded-xl font-bold shadow-md mb-2">Mulai Rekam</button>
                <p id="status" class="hidden text-red-500 text-[10px] animate-pulse">● Merekam...</p>
            </div>

            <div class="mb-6 text-left">
                <p class="text-[10px] font-bold text-gray-400 mb-2 uppercase">Text Journal</p>
                <textarea id="manualInput" placeholder="Tulis ceritamu di sini..." 
                    class="w-full p-4 rounded-2xl border border-gray-100 text-sm focus:ring-2 focus:ring-[#8FBC8F] outline-none bg-gray-50 min-h-[120px] resize-none"></textarea>
                <button id="btnSaveNote" class="w-full mt-2 py-3 bg-[#4A5D4F] text-white rounded-xl font-bold shadow-md">Simpan sebagai Note (.txt)</button>
            </div>
            
            <div class="mt-10 border-t border-gray-100 pt-6">
                <h3 class="text-[10px] font-bold text-gray-400 mb-4 uppercase text-left tracking-widest">Riwayat Jurnal</h3>
                <div id="daftarRekaman" class="space-y-3"></div>
            </div>
        </div>
    `;
    updateDaftarUI();
    setupFitur();
}

function updateDaftarUI() {
    const container = document.getElementById('daftarRekaman');
    const riwayat = JSON.parse(localStorage.getItem('my_journal') || '[]');
    
    container.innerHTML = riwayat.length === 0 ? '<p class="text-[10px] text-gray-300 italic text-left">Belum ada riwayat.</p>' : 
        riwayat.map((item, index) => `
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] font-bold text-gray-400">${item.date}</span>
                    <button onclick="hapusJurnal(${index})" class="text-red-400 text-[10px]">Hapus ×</button>
                </div>
                <p class="text-xs text-[#4A5D4F] mb-3">${item.type === 'text' ? item.content : 'Rekaman Suara'}</p>
                <a href="${item.fileUrl}" download="${item.fileName}" class="inline-block bg-white border border-gray-200 text-[10px] px-3 py-1 rounded-lg font-bold shadow-sm">
                    📥 Download ${item.type === 'text' ? 'Note' : 'Audio'}
                </a>
            </div>
        `).join('');
}

window.hapusJurnal = function(index) {
    let riwayat = JSON.parse(localStorage.getItem('my_journal') || '[]');
    riwayat.splice(index, 1);
    localStorage.setItem('my_journal', JSON.stringify(riwayat));
    updateDaftarUI();
};

function setupFitur() {
    const btnAction = document.getElementById('btnAction');
    const btnSaveNote = document.getElementById('btnSaveNote');
    const manualInput = document.getElementById('manualInput');
    const bgMusic = document.getElementById('bgMusic');

    bgMusic.volume = 0.3;
    document.getElementById('btnMusic').onclick = function() {
        if (bgMusic.paused) { bgMusic.play(); this.innerText = "Musik Nyala 🎵"; }
        else { bgMusic.pause(); this.innerText = "Mulai Musik 🎵"; }
    };

    // FITUR SIMPAN TEXT KE HP
    btnSaveNote.onclick = () => {
        const text = manualInput.value.trim();
        if (!text) return alert("Tulis sesuatu dulu ya.");

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const fileName = `Note_${Date.now()}.txt`;

        simpanKeRiwayat({ type: 'text', content: text, fileUrl: url, fileName: fileName });
        
        // Trigger download otomatis ke HP
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        manualInput.value = "";
    };

    // FITUR REKAM VOICE KE HP
    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const fileName = `Voice_${Date.now()}.wav`;

                simpanKeRiwayat({ type: 'voice', content: 'Rekaman Suara Jurnal', fileUrl: url, fileName: fileName });
                
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
            };

            mediaRecorder.start();
            btnAction.innerText = "Berhenti & Simpan";
            btnAction.style.background = "#f87171";
            document.getElementById('status').classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "Mulai Rekam";
            btnAction.style.background = "#8FBC8F";
            document.getElementById('status').classList.add('hidden');
        }
    };
}

function simpanKeRiwayat(data) {
    let riwayat = JSON.parse(localStorage.getItem('my_journal') || '[]');
    riwayat.unshift({ ...data, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('my_journal', JSON.stringify(riwayat));
    updateDaftarUI();
}

tampilkanAplikasi();
