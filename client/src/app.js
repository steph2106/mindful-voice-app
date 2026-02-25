import { dailyPrompts } from './prompts.js';

// Load library PDF secara dinamis
const pdfScript = document.createElement('script');
pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
document.head.appendChild(pdfScript);

const appDiv = document.getElementById('app');
let mediaRecorder;
let audioChunks = [];

function tampilkanAplikasi() {
    const dataSoal = dailyPrompts[0];
    appDiv.innerHTML = `
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-[32px] shadow-xl font-sans border border-gray-100">
            <h2 class="text-xl font-bold text-[#4A5D4F] mb-6">Jurnal Pribadi</h2>
            
            <div class="p-4 bg-gray-50 rounded-2xl mb-6 border-l-4 border-green-400">
                <p class="italic text-sm text-gray-600">"${dataSoal.text}"</p>
            </div>

            <div class="mb-6">
                <button id="btnAction" class="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg">Mulai Rekam Suara</button>
                <p id="status" class="hidden text-red-500 text-[10px] mt-2 animate-pulse">● MEREKAM...</p>
            </div>

            <div class="mb-6">
                <textarea id="manualInput" placeholder="Tulis di sini..." class="w-full p-4 rounded-2xl border bg-gray-50 min-h-[100px] outline-none focus:border-green-400"></textarea>
                <div class="grid grid-cols-2 gap-2 mt-2">
                    <button id="btnSaveTxt" class="py-2 bg-gray-800 text-white rounded-xl text-xs font-bold">Simpan .TXT</button>
                    <button id="btnSavePdf" class="py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Simpan .PDF</button>
                </div>
            </div>
            
            <div class="mt-8 border-t pt-4">
                <p class="text-[10px] font-bold text-gray-400 uppercase mb-4">Riwayat</p>
                <div id="daftar" class="space-y-3"></div>
            </div>
        </div>
    `;
    updateUI();
    setup();
}

function setup() {
    const btnAction = document.getElementById('btnAction');
    const input = document.getElementById('manualInput');

    // LOGIKA REKAM (VERSI PALING DASAR)
    btnAction.onclick = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Suara_${Date.now()}.wav`;
                link.click(); // Langsung download ke HP
                simpan('voice', 'Rekaman Suara', url);
            };

            mediaRecorder.start();
            btnAction.innerText = "BERHENTI";
            document.getElementById('status').classList.remove('hidden');
        } else {
            mediaRecorder.stop();
            btnAction.innerText = "Mulai Rekam Suara";
            document.getElementById('status').classList.add('hidden');
        }
    };

    // SIMPAN TXT
    document.getElementById('btnSaveTxt').onclick = () => {
        const t = input.value; if(!t) return;
        const blob = new Blob([t], {type:'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Catatan_${Date.now()}.txt`; a.click();
        simpan('text', t);
        input.value = "";
    };

    // SIMPAN PDF
    document.getElementById('btnSavePdf').onclick = () => {
        const t = input.value; if(!t) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(t, 10, 10);
        doc.save(`Catatan_${Date.now()}.pdf`);
        simpan('text', t);
        input.value = "";
    };
}

function simpan(type, content, url = '') {
    let r = JSON.parse(localStorage.getItem('jurnal_final') || '[]');
    r.unshift({ type, content, url, date: new Date().toLocaleString() });
    localStorage.setItem('jurnal_final', JSON.stringify(r));
    updateUI();
}

window.hapus = (i) => {
    let r = JSON.parse(localStorage.getItem('jurnal_final') || '[]');
    r.splice(i, 1);
    localStorage.setItem('jurnal_final', JSON.stringify(r));
    updateUI();
};

function updateUI() {
    const d = document.getElementById('daftar');
    const r = JSON.parse(localStorage.getItem('jurnal_final') || '[]');
    d.innerHTML = r.map((item, i) => `
        <div class="p-3 bg-gray-50 rounded-xl text-left border">
            <div class="flex justify-between text-[9px] mb-1">
                <span>${item.date}</span>
                <button onclick="hapus(${i})" class="text-red-500">Hapus</button>
            </div>
            <p class="text-xs mb-2">${item.content}</p>
            ${item.url ? `<a href="${item.url}" download class="text-[10px] text-blue-600 font-bold">Download Audio</a>` : ''}
        </div>
    `).join('');
}

tampilkanAplikasi();
