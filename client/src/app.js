// client/src/app.js

// Mengambil daftar pertanyaan dari file prompts.js
import { dailyPrompts } from './prompts.js';

const appDiv = document.getElementById('app');

function tampilkanAplikasi() {
    // Kita tes munculkan pertanyaan Hari ke-1
    const hariIni = 1; 
    const dataSoal = dailyPrompts.find(p => p.day === hariIni);

    if (dataSoal) {
        appDiv.innerHTML = `
            <div class="max-w-md mx-auto mt-20 p-8 bg-white rounded-[32px] shadow-sm border border-gray-100 font-sans">
                <h2 class="text-[#4A5D4F] text-xl font-serif mb-6">MindfulVoice</h2>
                
                <div class="p-6 bg-[#FDFBF7] rounded-2xl border-l-4 border-[#8FBC8F] mb-10">
                    <p class="text-[10px] uppercase tracking-[2px] text-gray-400 mb-2">${dataSoal.focus}</p>
                    <p class="text-lg italic text-[#4A5D4F] leading-relaxed">"${dataSoal.text}"</p>
                </div>

                <button id="btnRekam" class="w-full py-4 bg-[#8FBC8F] text-white rounded-full font-bold shadow-lg shadow-green-100 hover:bg-[#7FA87F] active:scale-95 transition-all">
                    Mulai Rekam Suara
                </button>
                
                <p class="text-center text-[10px] text-gray-300 mt-6 tracking-widest uppercase">Koneksi Berhasil</p>
            </div>
        `;

        document.getElementById('btnRekam').onclick = function() {
            alert("Tombol aktif! Selanjutnya kita akan pasang fitur rekam suara.");
        };
    }
}

tampilkanAplikasi();
