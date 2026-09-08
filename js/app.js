window.isSignUpMode = false;

window.openAuthDrawer = function() {
    const overlay = document.getElementById('auth-drawer-overlay');
    const drawer = document.getElementById('auth-drawer');
    overlay.classList.remove('hidden');
    void overlay.offsetWidth; 
    overlay.classList.remove('opacity-0');
    drawer.classList.remove('translate-x-full');
}

window.closeAuthDrawer = function() {
    const overlay = document.getElementById('auth-drawer-overlay');
    const drawer = document.getElementById('auth-drawer');
    overlay.classList.add('opacity-0');
    drawer.classList.add('translate-x-full');
    setTimeout(() => { overlay.classList.add('hidden'); }, 300);
}

window.toggleAuthMode = function() {
    window.isSignUpMode = !window.isSignUpMode;
    const isVi = appState.currentLang === "vi";
    
    const titleText = window.isSignUpMode ? (isVi ? "Đăng ký tài khoản" : "Create Account") : (isVi ? "Đăng nhập" : "Log In");
    const submitText = titleText;
    const hintText = window.isSignUpMode ? (isVi ? "Đã có tài khoản?" : "Already have an account?") : (isVi ? "Chưa có tài khoản?" : "Don't have an account?");
    const toggleText = window.isSignUpMode ? (isVi ? "Đăng nhập ngay" : "Log in now") : (isVi ? "Đăng ký ngay" : "Sign up now");

    document.getElementById('auth-drawer-title').innerText = titleText;
    document.getElementById('auth-submit-btn').innerText = submitText;
    document.getElementById('auth-toggle-hint').innerText = hintText;
    document.getElementById('auth-toggle-btn').innerText = toggleText;
}

const MOTIVATIONAL_QUOTES = [
    { text_vi: "Thời gian của bạn là có hạn, đừng lãng phí nó để sống cho cuộc đời của người khác.", text_en: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { text_vi: "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.", text_en: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text_vi: "Dù bạn nghĩ mình làm được hay không thể, bạn đều đúng.", text_en: "Whether you think you can or think you can’t, you’re right.", author: "Henry Ford" },
    { text_vi: "Hạnh phúc không phải là thứ có sẵn. Nó được tạo ra từ chính hành động của bạn.", text_en: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
    { text_vi: "Tin xấu là thời gian trôi nhanh như bay. Tin tốt là bạn chính là phi công.", text_en: "The bad news is time flies. The good news is you’re the pilot.", author: "Michael Altshuler" },
    { text_vi: "Chúng ta tạo ra nỗi sợ hãi khi chỉ ngồi yên. Chúng ta vượt qua chúng bằng hành động.", text_en: "We generate fears while we sit. We overcome them by action.", author: "Dr. Henry Link" },
    { text_vi: "Bạn sinh ra để chiến thắng, nhưng để trở thành người chiến thắng, bạn phải lên kế hoạch, chuẩn bị, và thực sự kỳ vọng chiến thắng.", text_en: "You were born to win, but to be a winner, you must plan to win, prepare to win, and expect to win.", author: "Zig Ziglar" },
    { text_vi: "Thành công là tổng của những nỗ lực nhỏ cộng lại, được lặp đi lặp lại mỗi ngày.", text_en: "Success is the sum of small efforts, repeated day in and day out", author: "Robert Collier" }
];

const TIME_LIMITS = { morning: 4, afternoon: 4, evening: 2 };
window.appState = { currentLang: "vi", selectedDate: "", dailyBoards: {}, history: [] };
let myChart = null;
let currentChartDays = 30;

window.openExerciseModal = function(imageSrc) {
    const modal = document.getElementById('exercise-modal');
    const img = document.getElementById('exercise-image');
    img.src = imageSrc; img.style.transform = 'scale(1)'; img.style.cursor = 'zoom-in';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

window.closeExerciseModal = function() {
    document.getElementById('exercise-modal').classList.add('hidden');
    document.body.style.overflow = 'auto'; 
}

window.toggleZoom = function(imgElement) {
    const container = document.getElementById('modal-container');
    if (!imgElement.style.transform || imgElement.style.transform === 'scale(1)') {
        imgElement.style.transform = 'scale(2)'; imgElement.style.cursor = 'zoom-out';
        container.scrollTop = 0; container.scrollLeft = 0;
    } else {
        imgElement.style.transform = 'scale(1)'; imgElement.style.cursor = 'zoom-in';
    }
}

document.getElementById('exercise-modal').addEventListener('click', function(e) {
    if (e.target === this) window.closeExerciseModal();
});

window.applyQuickTitle = function(session, text) { document.getElementById(`input-${session}-title`).value = text; }
window.getLocalTodayString = function() {
    const now = new Date(); const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
}
window.formatToUIDate = function(dateStr) {
    if (!dateStr) return ""; const p = dateStr.split('-');
    if (p.length !== 3) return dateStr; return `${p[2]}/${p[1]}/${p[0]}`;
}

window.initApp = async function() {
    const localToday = window.getLocalTodayString();
    window.appState.currentLang = "vi";

    const saved = localStorage.getItem('todotoday_chart_v7');
    if (saved) {
        const localState = JSON.parse(saved);
        window.appState.currentLang = localState.currentLang || "vi";
        window.appState.dailyBoards = localState.dailyBoards || {};
        window.appState.history = localState.history || [];
        
        let unsettledDate = null;
        for (const dateKey in window.appState.dailyBoards) {
            const dayData = window.appState.dailyBoards[dateKey];
            if (dayData && ((dayData.morning && dayData.morning.length > 0) || (dayData.afternoon && dayData.afternoon.length > 0) || (dayData.evening && dayData.evening.length > 0))) {
                unsettledDate = dateKey; break; 
            }
        }
        window.appState.selectedDate = unsettledDate ? unsettledDate : (localState.selectedDate || localToday);
    } else {
        window.appState.selectedDate = localToday;
        window.appState.dailyBoards = {};
        window.appState.history = [];
    }

    window.ensureStructure(window.appState.selectedDate);

    try {
        const picker = document.getElementById('date-picker');
        const displayText = document.getElementById('date-display-text');
        if (picker) picker.value = window.appState.selectedDate;
        if (displayText) displayText.innerText = window.formatToUIDate(window.appState.selectedDate);
    } catch(e) {}

    try { if(typeof window.toggleGotoTodayButtonVisibility === 'function') window.toggleGotoTodayButtonVisibility(); } catch(e) {}
    try { if(typeof window.buildYearFilterOptions === 'function') window.buildYearFilterOptions(); } catch(e) {}
    try { if(typeof window.setRandomQuote === 'function') window.setRandomQuote(); } catch(e) {}
    try { if(typeof window.updateLanguageUI === 'function') window.updateLanguageUI(); } catch(e) {}
    
    window.renderBoard(); 
}

window.exportBackupData = function() {
    const isVi = window.appState.currentLang === "vi";
    if (!window.appState.history || window.appState.history.length === 0) {
        return alert(isVi ? "Chưa có dữ liệu lịch sử nào để xuất!" : "No history data to export!");
    }
    if (!confirm(isVi ? "Bạn có muốn xuất và tải về file sao lưu dữ liệu (.json) hiện tại không?" : "Do you want to export and download the current backup file (.json)?")) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `todotoday_backup_${window.getLocalTodayString()}.json`);
    document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove();
}

window.triggerImportClick = function() {
    const isVi = window.appState.currentLang === "vi";
    if (confirm(isVi ? "⚠️ Anh có muốn nhập dữ liệu sao lưu không?\nHệ thống sẽ GIỮ NGUYÊN các ngày cũ độc lập, nạp thêm ngày mới và chỉ GHI ĐÈ nếu trùng ngày." : "⚠️ Do you want to import backup data?")) {
        document.getElementById('hidden-file-input').click();
    }
}

window.importBackupData = function(event) {
    const isVi = window.appState.currentLang === "vi";
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState && (importedState.history || importedState.dailyBoards)) {
                const historyMap = new Map();
                if (Array.isArray(window.appState.history)) window.appState.history.forEach(item => { if (item.date) historyMap.set(item.date, item); });
                if (Array.isArray(importedState.history)) importedState.history.forEach(item => { if (item.date) historyMap.set(item.date, item); });
                window.appState.history = Array.from(historyMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

                if (!window.appState.dailyBoards) window.appState.dailyBoards = {};
                if (importedState.dailyBoards) {
                    for (const dateKey in importedState.dailyBoards) window.appState.dailyBoards[dateKey] = importedState.dailyBoards[dateKey];
                }
                window.appState.currentLang = importedState.currentLang || window.appState.currentLang;
                window.save();
                alert(isVi ? "🎉 Đã hợp nhất dữ liệu sao lưu thành công!" : "🎉 Data merged and imported successfully!");
                window.location.reload();
            } else {
                alert(isVi ? "❌ File JSON không đúng cấu trúc!" : "❌ Invalid structure!"); event.target.value = '';
            }
        } catch (err) { alert(isVi ? "❌ Lỗi đọc file!" : "❌ Error parsing file!"); event.target.value = ''; }
    };
    reader.readAsText(file);
}

window.save = function() { 
    // 1. Luôn lưu vào LocalStorage để làm bộ đệm Offline
    localStorage.setItem('todotoday_chart_v7', JSON.stringify(window.appState)); 
    
    // 2. Nếu đang có user đăng nhập -> Đẩy lên Cloud Firestore
    if (window.currentFirebaseUser && typeof window.saveToCloud === 'function') {
        window.saveToCloud(window.appState);
    }
}

window.ensureStructure = function(dateStr) { 
    if (!window.appState.dailyBoards[dateStr]) window.appState.dailyBoards[dateStr] = { morning: [], afternoon: [], evening: [] }; 
}

window.updateDateDisplay = function() {
    const pickerVal = document.getElementById('date-picker').value;
    if (!pickerVal) return;
    if (window.appState.history.some(h => h.date === pickerVal)) {
        alert("Ngày được chọn đã có dữ liệu trong Lịch sử. Bạn có thể vào tab Lịch sử để chỉnh sửa.");
        document.getElementById('date-picker').value = window.appState.selectedDate; return;
    }
    window.appState.selectedDate = pickerVal;
    document.getElementById('date-display-text').innerText = window.formatToUIDate(pickerVal);
    window.toggleGotoTodayButtonVisibility();
    window.ensureStructure(pickerVal); window.save(); window.renderBoard();
}

window.toggleGotoTodayButtonVisibility = function() {
    const btn = document.getElementById('btn-goto-today');
    if (!btn) return;
    if (window.appState.selectedDate === window.getLocalTodayString()) btn.classList.add('hidden');
    else btn.classList.remove('hidden');
}

window.getSessionTimeCalculations = function(session) {
    let total = 0, done = 0;
    const board = window.appState.dailyBoards[window.appState.selectedDate];
    if (board && board[session]) {
        board[session].forEach(t => { total += t.hours; if (t.completed) done += t.hours; });
    }
    return { total, done };
}

window.addTask = function(session) {
    const title = document.getElementById(`input-${session}-title`).value.trim();
    const desc = document.getElementById(`input-${session}-desc`).value.trim();
    const hours = parseFloat(document.getElementById(`input-${session}-hours`).value || 0);

    if (!title) return alert(window.appState.currentLang === 'vi' ? "Vui lòng nhập tiêu đề!" : "Title is required!");
    window.appState.dailyBoards[window.appState.selectedDate][session].push({ id: 't_' + Date.now(), title, desc, hours, completed: false });
    document.getElementById(`input-${session}-title`).value = ""; document.getElementById(`input-${session}-desc`).value = "";
    window.save(); window.renderBoard();
}

window.toggleTask = function(session, id) {
    const task = window.appState.dailyBoards[window.appState.selectedDate][session].find(t => t.id === id);
    if (task) { task.completed = !task.completed; window.save(); window.renderBoard(); }
}

window.deleteTask = function(session, id) {
    window.appState.dailyBoards[window.appState.selectedDate][session] = window.appState.dailyBoards[window.appState.selectedDate][session].filter(t => t.id !== id);
    window.save(); window.renderBoard();
}

window.renderBoard = function() {
    const isVi = window.appState.currentLang === "vi";
    const board = window.appState.dailyBoards[window.appState.selectedDate];
    let totalDoneHours = 0;

    const currentHour = new Date().getHours();
    let currentSession = 'evening'; 
    if (currentHour >= 0 && currentHour < 12) currentSession = 'morning';
    else if (currentHour >= 12 && currentHour < 18) currentSession = 'afternoon';

    const isToday = window.appState.selectedDate === window.getLocalTodayString();
    const isPastDay = window.appState.selectedDate < window.getLocalTodayString();

    ['morning', 'afternoon', 'evening'].forEach(session => {
        let isPastSession = false;
        let isCurrentSession = isToday && (session === currentSession);
        
        if (isPastDay) isPastSession = true; 
        else if (isToday) {
            if (currentSession === 'afternoon' && session === 'morning') isPastSession = true;
            if (currentSession === 'evening' && (session === 'morning' || session === 'afternoon')) isPastSession = true;
        }

        const calcs = window.getSessionTimeCalculations(session);
        const container = document.getElementById(`tasks-${session}`);
        const sessionBlock = container?.closest('.rounded-2xl') || container?.parentElement;
        
        if (sessionBlock) {
            const classesToKeep = sessionBlock.className.split(' ').filter(c => {
                if (c.startsWith('bg-') || c.startsWith('border-') || c.startsWith('ring-') || c.startsWith('shadow') || c.startsWith('scale-')) return false;
                if (c === 'border') return false; 
                return true;
            });
            sessionBlock.className = classesToKeep.join(' ');
            sessionBlock.classList.add('transition-all', 'duration-300', 'border');
            sessionBlock.style.boxShadow = ''; sessionBlock.style.transform = ''; sessionBlock.style.borderColor = '';

            if (session === 'morning') {
                sessionBlock.classList.add('bg-amber-50/50');
                if (isCurrentSession) {
                    sessionBlock.style.borderColor = '#fbbf24'; sessionBlock.style.boxShadow = 'inset 0 4px 0 0 #f59e0b, 0 10px 15px -3px rgba(0,0,0,0.05)'; sessionBlock.style.transform = 'translateY(-2px)';
                } else sessionBlock.style.borderColor = '#fde68a';
            } 
            else if (session === 'afternoon') {
                sessionBlock.classList.add('bg-sky-50/50');
                if (isCurrentSession) {
                    sessionBlock.style.borderColor = '#38bdf8'; sessionBlock.style.boxShadow = 'inset 0 4px 0 0 #0ea5e9, 0 10px 15px -3px rgba(0,0,0,0.05)'; sessionBlock.style.transform = 'translateY(-2px)';
                } else sessionBlock.style.borderColor = '#bae6fd';
            } 
            else if (session === 'evening') {
                sessionBlock.classList.add('bg-indigo-100/50');
                if (isCurrentSession) {
                    sessionBlock.style.borderColor = '#a855f7'; sessionBlock.style.boxShadow = 'inset 0 4px 0 0 #9333ea, 0 10px 15px -3px rgba(0,0,0,0.05)'; sessionBlock.style.transform = 'translateY(-2px)';
                } else sessionBlock.style.borderColor = '#e9d5ff';
            }
        }

        const limit = TIME_LIMITS[session];
        const left = Math.max(limit - calcs.total, 0);
        totalDoneHours += calcs.done;
        const sessionScore = Math.round((calcs.done / limit) * 100);

        document.getElementById(`score-box-${session}`).innerText = `${sessionScore}%`;
        document.getElementById(`status-${session}`).innerText = isVi ? `Còn trống ${left}h` : `${left}h left`;
        
        const selectEl = document.getElementById(`input-${session}-hours`);
        selectEl.innerHTML = "";
        if (left <= 0) selectEl.innerHTML = `<option value="0">0h</option>`;
        else for (let i = 0.5; i <= left; i += 0.5) selectEl.innerHTML += `<option value="${i}">${i}h</option>`;

        container.innerHTML = "";
        if (!board[session] || board[session].length === 0) {
            container.innerHTML = `<div class="bg-white/60 border border-dashed border-slate-200/60 rounded-xl p-4 text-center text-sm text-slate-400 my-1 italic">${isVi?'Trống / Chưa lên kế hoạch':'Empty / Unplanned'}</div>`;
        } else {
            board[session].forEach(t => {
                let cardColorClass = "", titleColorClass = "", descColorClass = "";
                if (t.completed) {
                    cardColorClass = "bg-white/40 opacity-60"; titleColorClass = "line-through text-slate-400 font-medium"; descColorClass = "text-slate-300";
                } else {
                    cardColorClass = "bg-white"; 
                    if (isPastSession) { titleColorClass = "text-rose-400 font-medium"; descColorClass = "text-rose-300"; } 
                    else if (isCurrentSession) { titleColorClass = "text-indigo-700 font-bold"; descColorClass = "text-slate-500"; } 
                    else { titleColorClass = "text-slate-700 font-medium"; descColorClass = "text-slate-400"; }
                }
                container.innerHTML += `
                    <div class="flex items-start justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors w-full ${cardColorClass} mb-2">
                        <div class="flex items-start gap-2.5 min-w-0 flex-1">
                            <input type="checkbox" ${t.completed?'checked':''} onclick="toggleTask('${session}','${t.id}')" class="mt-0.5 rounded text-indigo-600 h-4 w-4 cursor-pointer shrink-0 border-slate-300 bg-white focus:ring-indigo-500" />
                            <div class="min-w-0 flex-1">
                                <h4 class="text-sm ${titleColorClass} break-words transition-colors">${t.title}</h4>
                                ${t.desc ? `<p class="text-xs ${descColorClass} break-words mt-0.5 transition-colors">${t.desc}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 ml-2">
                            <span class="text-xs bg-slate-50 border border-slate-200 font-bold text-slate-500 px-2 py-0.5 rounded">${t.hours}h</span>
                            <button onclick="deleteTask('${session}','${t.id}')" class="text-slate-400 hover:text-rose-500 text-sm font-bold px-1 cursor-pointer">✕</button>
                        </div>
                    </div>`;
            });
        }
    });

    const totalScore = Math.round((totalDoneHours / 10) * 100);
    document.getElementById('score-display').innerText = `${totalScore}%`;
    document.getElementById('progress-text').innerText = `${totalDoneHours}h / 10h done`;
    document.getElementById('progress-bar').style.width = `${totalScore}%`;

    const statusText = document.getElementById('target-status');
    if (totalScore >= 90) statusText.innerText = isVi ? "🏆 Quá đỉnh! Bạn đã chinh phục trọn vẹn mục tiêu hôm nay!" : "🏆 Superb! You've completely mastered today's goals!";
    else if (totalScore >= 70) statusText.innerText = isVi ? "🚀 Tuyệt vời! Bạn đang bứt phá rất nhanh!" : "🚀 Amazing pace! You are gaining massive momentum!";
    else if (totalScore >= 40) statusText.innerText = isVi ? "🔥 Khá tốt! Hãy giữ vững ngọn lửa quyết tâm!" : "🔥 Solid progress! Keep your focus!";
    else statusText.innerText = isVi ? "💪 Hành động ngay để kiểm soát mục tiêu và chứng minh bản lĩnh kỷ luật của bạn!" : "💪 Take action right now to control your goals!";
}

window.confirmSettleAndSave = function() {
    window.closeSettleModal();
    const isVi = window.appState.currentLang === "vi";
    const scoreEl = document.getElementById('score-display');
    const totalScore = scoreEl ? parseInt(scoreEl.innerText) : 0;
    const currentDate = window.appState.selectedDate;
    const board = window.appState.dailyBoards[currentDate];
    let mDone = 0, cDone = 0, tDone = 0;
    
    if (board) {
        if (board.morning) mDone = board.morning.filter(t => t.completed).length;
        if (board.afternoon) cDone = board.afternoon.filter(t => t.completed).length;
        if (board.evening) tDone = board.evening.filter(t => t.completed).length;
    }

    if (!window.appState.history) window.appState.history = [];
    const existingIndex = window.appState.history.findIndex(h => h.date === currentDate);
    const historyRecord = { date: currentDate, score: totalScore, mDone: mDone, cDone: cDone, tDone: tDone, settledAt: new Date().toISOString() };
    if (existingIndex >= 0) window.appState.history[existingIndex] = historyRecord; else window.appState.history.push(historyRecord);

    if (window.appState.dailyBoards[currentDate]) delete window.appState.dailyBoards[currentDate];

    let targetDate = window.getLocalTodayString();
    while (true) {
        const dayData = window.appState.dailyBoards[targetDate];
        const hasData = dayData && ((dayData.morning && dayData.morning.length > 0) || (dayData.afternoon && dayData.afternoon.length > 0) || (dayData.evening && dayData.evening.length > 0));
        if (!hasData) break;
        let nextD = new Date(targetDate + 'T00:00:00');
        nextD.setDate(nextD.getDate() + 1);
        targetDate = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`;
    }

    window.appState.selectedDate = targetDate;
    window.ensureStructure(window.appState.selectedDate);
    window.save();

    try {
        const datePickerEl = document.getElementById('date-picker');
        if (datePickerEl) datePickerEl.value = window.appState.selectedDate;
        const dateDisplayEl = document.getElementById('date-display-text');
        if (dateDisplayEl) dateDisplayEl.innerText = window.formatToUIDate(window.appState.selectedDate);
        if (typeof window.toggleGotoTodayButtonVisibility === 'function') window.toggleGotoTodayButtonVisibility();
        window.renderBoard();
    } catch(e) {}
    alert(isVi ? "Hệ thống đã kết toán thành công!" : "Settlement successful!");
}

window.buildYearFilterOptions = function() {
    const yearSelect = document.getElementById('filter-year');
    const monthSelect = document.getElementById('filter-month');
    if (!yearSelect || !monthSelect) return;

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    const years = new Set(); years.add(currentYear);
    if (Array.isArray(window.appState.history)) {
        window.appState.history.forEach(h => { if (h.date) years.add(h.date.split('-')[0]); });
    }

    yearSelect.innerHTML = '';
    Array.from(years).sort((a, b) => b - a).forEach(y => {
        const opt = document.createElement('option'); opt.value = y; opt.innerText = y; yearSelect.appendChild(opt);
    });

    yearSelect.value = currentYear; monthSelect.value = currentMonth;
    window.renderHistoryView();
}

window.handleFilterChange = function() { window.renderHistoryView(); }

window.renderHistoryView = function() {
    const isVi = window.appState.currentLang === "vi";
    const yearFilter = document.getElementById('filter-year').value;
    const monthFilter = document.getElementById('filter-month').value;
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = "";

    const sortedHistory = [...window.appState.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    const filteredLogs = sortedHistory.filter(log => {
        if (!log.date) return false;
        const [year, month] = log.date.split('-');
        return year === yearFilter && month === monthFilter;
    });

    if (filteredLogs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-slate-400 py-6 italic">${isVi ? `Không có dữ liệu cho tháng ${monthFilter}/${yearFilter}.` : `No records for ${monthFilter}/${yearFilter}.`}</td></tr>`;
        return;
    }

    filteredLogs.forEach(log => {
        const mS = log.morningScore !== undefined ? log.morningScore : log.score;
        const aS = log.afternoonScore !== undefined ? log.afternoonScore : log.score;
        const eS = log.eveningScore !== undefined ? log.eveningScore : log.score;

        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3.5 px-5 font-semibold text-slate-700">📅 ${window.formatToUIDate(log.date)}</td>
                <td class="py-3.5 px-5 text-center font-black text-indigo-600">${log.score}%</td>
                <td class="py-3.5 px-5 text-center">
                    <div class="flex justify-center items-center gap-1.5 text-xs font-bold">
                        <span class="text-[#854d0e] bg-[#fffdf4] border border-[#fef08a] px-1.5 py-0.5 rounded">${mS}%</span>
                        <span class="text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd] px-1.5 py-0.5 rounded">${aS}%</span>
                        <span class="text-[#6b21a8] bg-[#faf5ff] border border-[#e9d5ff] px-1.5 py-0.5 rounded">${eS}%</span>
                    </div>
                </td>
                <td class="py-3.5 px-5 text-right">
                    <button onclick="openEditModal('${log.date}')" class="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer">✏️</button>
                </td>
            </tr>`;
    });
}

window.openEditModal = function(dateStr) {
    const isVi = window.appState.currentLang === "vi";
    const targetLog = window.appState.history.find(h => h.date === dateStr);
    if (!targetLog) return;

    document.getElementById('modal-target-date').value = dateStr;
    document.getElementById('modal-title').innerText = isVi ? `Chỉnh sửa hiệu suất ngày [${window.formatToUIDate(dateStr)}]` : `Edit Score for [${window.formatToUIDate(dateStr)}]`;
    
    document.getElementById('modal-input-morning').value = targetLog.morningScore !== undefined ? targetLog.morningScore : targetLog.score;
    document.getElementById('modal-input-afternoon').value = targetLog.afternoonScore !== undefined ? targetLog.afternoonScore : targetLog.score;
    document.getElementById('modal-input-evening').value = targetLog.eveningScore !== undefined ? targetLog.eveningScore : targetLog.score;
    
    window.calculateModalLiveScore();
    document.getElementById('edit-modal').classList.remove('hidden');
}

window.closeEditModal = function() { document.getElementById('edit-modal').classList.add('hidden'); }

window.calculateModalLiveScore = function() {
    let nM = parseInt(document.getElementById('modal-input-morning').value) || 0;
    let nA = parseInt(document.getElementById('modal-input-afternoon').value) || 0;
    let nE = parseInt(document.getElementById('modal-input-evening').value) || 0;

    if (nM < 0) nM = 0; if (nM > 100) nM = 100;
    if (nA < 0) nA = 0; if (nA > 100) nA = 100;
    if (nE < 0) nE = 0; if (nE > 100) nE = 100;

    const liveTotal = Math.round((nM * 4 + nA * 4 + nE * 2) / 10);
    document.getElementById('modal-live-total-score').innerText = `${liveTotal}%`;
}

window.saveEditModalData = function() {
    const isVi = window.appState.currentLang === "vi";
    const dateStr = document.getElementById('modal-target-date').value;
    const targetLog = window.appState.history.find(h => h.date === dateStr);
    if (!targetLog) return;

    const nM = parseInt(document.getElementById('modal-input-morning').value);
    const nA = parseInt(document.getElementById('modal-input-afternoon').value);
    const nE = parseInt(document.getElementById('modal-input-evening').value);

    if (isNaN(nM) || nM < 0 || nM > 100 || isNaN(nA) || nA < 0 || nA > 100 || isNaN(nE) || nE < 0 || nE > 100) {
        return alert(isVi ? "❌ Số liệu nhập vào không hợp lệ (Phải từ 0 đến 100)!" : "❌ Invalid values!");
    }

    targetLog.morningScore = nM; targetLog.afternoonScore = nA; targetLog.eveningScore = nE;
    targetLog.score = Math.round((nM * 4 + nA * 4 + nE * 2) / 10);

    window.save(); window.closeEditModal(); window.renderHistoryView(); window.updateChartRange();
}

window.changeChartRange = function(days, btnElement) {
    currentChartDays = days;
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.className = "timeframe-btn px-3 py-1.5 font-medium rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer";
    });
    btnElement.className = "timeframe-btn px-3 py-1.5 font-bold rounded-lg bg-white shadow-sm text-slate-800 transition-all cursor-pointer";
    window.updateChartRange();
}

window.updateChartRange = function() {
    const daysLimit = currentChartDays;
    const isVi = window.appState.currentLang === "vi";
    const titleEl = document.getElementById('chart-title');
    if(daysLimit === 30) titleEl.innerText = isVi ? "Biểu đồ hiệu suất 30 ngày" : "Performance Chart (30 Days)";
    else if(daysLimit === 90) titleEl.innerText = isVi ? "Biểu đồ hiệu suất 3 tháng" : "Performance Chart (3 Months)";
    else if(daysLimit === 180) titleEl.innerText = isVi ? "Biểu đồ hiệu suất 6 tháng" : "Performance Chart (6 Months)";
    else titleEl.innerText = isVi ? "Biểu đồ hiệu suất 1 năm" : "Performance Chart (1 Year)";

    if (!window.appState.history || window.appState.history.length === 0) { window.showEmptyEvaluation(isVi); return; }

    // FIX BUG: Luôn neo biểu đồ vào ngày hôm nay (thực tế) thay vì ngày đang chọn trên bảng
    const todayStr = window.getLocalTodayString();
    const parts = todayStr.split('-');
    const baseDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    
    const generatedLabels = [], generatedScores = [];

    for (let i = daysLimit - 1; i >= 0; i--) {
        const d = new Date(baseDate.getTime()); d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        generatedLabels.push(dStr);
        const match = window.appState.history.find(h => h.date === dStr);
        generatedScores.push(match ? match.score : null);
    }

    let maxTicks = 6;
    if (daysLimit === 90) maxTicks = 7; else if (daysLimit === 180) maxTicks = 9; else if (daysLimit === 365) maxTicks = 12;

    const ctx = document.getElementById('performanceChart').getContext('2d');
    Chart.defaults.color = '#64748b'; Chart.defaults.borderColor = '#e2e8f0';

    if (myChart) {
        myChart.data.labels = generatedLabels.map(l => window.formatToUIDate(l));
        myChart.data.datasets[0].data = generatedScores;
        myChart.data.datasets[0].label = isVi ? 'Hiệu suất (%)' : 'Score (%)';
        myChart.options.scales.x.ticks.maxTicksLimit = maxTicks;
        myChart.options.interaction = { mode: 'index', intersect: false };
        myChart.options.plugins.tooltip.enabled = true;
        myChart.update();
    } else {
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: generatedLabels.map(l => window.formatToUIDate(l)),
                datasets: [{
                    label: isVi ? 'Hiệu suất (%)' : 'Score (%)', data: generatedScores, borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.04)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
                    pointBackgroundColor: '#4f46e5', pointHoverBackgroundColor: '#4f46e5', pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2, spanGaps: true, tension: 0.15, fill: true
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 12, weight: 'bold' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8, displayColors: false } },
                interaction: { mode: 'index', intersect: false },
                scales: { y: { min: 0, max: 110, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, callback: function(value) { if (value > 100) return ''; return value + '%'; } } }, x: { grid: { display: false }, ticks: { maxTicksLimit: maxTicks, font: { size: 10 }, autoSkip: true } } }
            }
        });
    }

    const evalBox = document.getElementById('evaluation-box');
    const evalTagRange = document.getElementById('eval-tag-range');
    if (evalTagRange) evalTagRange.innerText = daysLimit === 30 ? "30D" : (daysLimit === 90 ? "3M" : (daysLimit === 180 ? "6M" : "1Y"));

    const activeLogs = window.appState.history.filter(h => generatedLabels.indexOf(h.date) !== -1);
    if (activeLogs.length === 0) {
        window.showEmptyEvaluation(isVi);
    } else {
        let sumTotal = 0, sumM = 0, sumC = 0, sumT = 0;
        activeLogs.forEach(h => {
            sumTotal += h.score; sumM += h.morningScore !== undefined ? h.morningScore : h.score; sumC += h.afternoonScore !== undefined ? h.afternoonScore : h.score; sumT += h.eveningScore !== undefined ? h.eveningScore : h.score;
        });

        const totalCount = activeLogs.length;
        const avgTotal = Math.round(sumTotal / totalCount);
        const avgM = Math.round(sumM / totalCount);
        const avgC = Math.round(sumC / totalCount);
        const avgT = Math.round(sumT / totalCount);

        let bestSession = "Buổi Sáng"; let bestValue = avgM; let bestBg = "bg-amber-500";
        if (avgC > bestValue) { bestSession = "Buổi Chiều"; bestValue = avgC; bestBg = "bg-sky-500"; }
        if (avgT > bestValue) { bestSession = "Buổi Tối"; bestValue = avgT; bestBg = "bg-purple-500"; }

        let comment = "";
        if (avgTotal >= 80) comment = isVi ? "Tuyệt vời! Anh đang làm chủ quỹ 10 tiếng rất tốt." : "Excellent time execution.";
        else if (avgTotal >= 50) comment = isVi ? "Phong độ khá đều, tối ưu thêm buổi thấp nhất để bứt phá." : "Good consistency.";
        else comment = isVi ? "Cần tập trung đẩy cao khối lượng hoàn thành." : "Focus needs improvement.";

        evalBox.innerHTML = `
            <div class="w-full h-full flex flex-col justify-between items-stretch text-left space-y-3.5">
                <div class="flex justify-between items-baseline border-b border-slate-100 pb-1.5">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${isVi ? 'Tổng Trung bình' : 'Total Average'}</span>
                    <span class="text-2xl font-black text-indigo-600">${avgTotal}%</span>
                </div>
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#854d0e] mb-1"><span>☀️ Sáng (Quỹ 4h)</span> <span>${avgM}%</span></div>
                        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60"><div class="bg-amber-500 h-full rounded-full" style="width: ${avgM}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#0369a1] mb-1"><span>🌤️ Chiều (Quỹ 4h)</span> <span>${avgC}%</span></div>
                        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60"><div class="bg-sky-500 h-full rounded-full" style="width: ${avgC}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#6b21a8] mb-1"><span>🌙 Tối (Quỹ 2h)</span> <span>${avgT}%</span></div>
                        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60"><div class="bg-purple-500 h-full rounded-full" style="width: ${avgT}%"></div></div>
                    </div>
                </div>
                <div class="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs space-y-1">
                    <p class="text-slate-700 font-semibold">🔥 Năng suất đỉnh nhất: <span class="px-1.5 py-0.5 rounded text-white text-[11px] font-black ${bestBg}">${bestSession} (${bestValue}%)</span></p>
                    <p class="text-slate-500 italic mt-1 font-medium">"${comment}"</p>
                </div>
            </div>`;
    }
}

window.showEmptyEvaluation = function(isVi) {
    document.getElementById('evaluation-box').innerHTML = `<div class="py-6 flex flex-col items-center justify-center space-y-2"><p class="text-xs font-bold text-slate-400">${isVi ? 'Chưa có dữ liệu kết toán.' : 'No data.'}</p></div>`;
}

window.switchTab = function(name) {
    const btnToday = document.getElementById('tab-today');
    const btnHistory = document.getElementById('tab-history');
    const panelToday = document.getElementById('panel-today');
    const panelHistory = document.getElementById('panel-history');

    if (name === 'today') {
        btnToday.className = "flex-1 sm:flex-none py-3 px-6 text-base font-bold text-indigo-600 border-b-2 border-indigo-600 transition-all cursor-pointer text-center";
        btnHistory.className = "flex-1 sm:flex-none py-3 px-6 text-base font-medium text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition-all cursor-pointer text-center";
        panelToday.classList.remove('hidden'); panelHistory.classList.add('hidden');
        window.renderBoard();
    } else {
        btnHistory.className = "flex-1 sm:flex-none py-3 px-6 text-base font-bold text-indigo-600 border-b-2 border-indigo-600 transition-all cursor-pointer text-center";
        btnToday.className = "flex-1 sm:flex-none py-3 px-6 text-base font-medium text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition-all cursor-pointer text-center";
        panelHistory.classList.remove('hidden'); panelToday.classList.add('hidden');
        window.buildYearFilterOptions(); window.renderHistoryView(); setTimeout(window.updateChartRange, 40); 
    }
}

window.toggleLanguage = function() {
    window.appState.currentLang = window.appState.currentLang === "vi" ? "en" : "vi";
    document.getElementById('lang-btn').innerText = window.appState.currentLang === "vi" ? "English 🌐" : "Tiếng Việt 🌐";
    window.save(); window.updateLanguageUI(); window.setRandomQuote(); window.buildYearFilterOptions();
    if(!document.getElementById('panel-today').classList.contains('hidden')) window.renderBoard();
    else { window.renderHistoryView(); window.updateChartRange(); }
}

window.updateLanguageUI = function() {
    const isVi = window.appState.currentLang === "vi";
    document.querySelectorAll('[data-vi]').forEach(el => { el.innerText = isVi ? el.getAttribute('data-vi') : el.getAttribute('data-en'); });
    document.getElementById('tab-today').innerHTML = isVi ? "Bảng Công Việc" : "Task Board";
    document.getElementById('tab-history').innerHTML = isVi ? "Lịch sử" : "History";
}

window.setRandomQuote = function() {
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    document.getElementById('quote-text').innerText = window.appState.currentLang === 'vi' ? `"${quote.text_vi}"` : `"${quote.text_en}"`;
    document.getElementById('quote-author').innerText = `— ${quote.author}`;
}

window.showBackupHint = function() {
    const isVi = window.appState.currentLang === "vi";
    alert(isVi 
        ? `💡 HƯỚNG DẪN QUẢN LÝ DỮ LIỆU:\n\n1. Ứng dụng này lưu dữ liệu TỰ ĐỘNG và RIÊNG BIỆT trên trình duyệt của máy này (LocalStorage).\n\n2. Xuất Data: Tải về file .json lưu trên máy tính để làm bản sao lưu dự phòng (Backup).\n\n3. Nhập Data (Smart Merge): Khi anh đổi thiết bị hoặc muốn nạp lại dữ liệu cũ, hệ thống sẽ tự gộp dữ liệu lại:\n   - Giữ nguyên các ngày cũ độc lập trên máy hiện tại.\n   - Nạp thêm các ngày mới có trong file.\n   - Chỉ ghi đè (cập nhật mới) nếu trùng ngày.`
        : `💡 DATA MANAGEMENT GUIDE:\n\n1. Data is saved AUTOMATICALLY and PRIVATELY inside your browser (LocalStorage).\n\n2. Export Data: Downloads a .json file to back up your records.\n\n3. Import Data (Smart Merge):\n   - Keeps unique local data records intact.\n   - Adds new records from the file.\n   - Only overwrites on duplicate dates.`);
}

window.toggleTooltip = function(event) {
    event.stopPropagation();
    const tooltip = document.getElementById('hint-tooltip');
    if (tooltip) tooltip.classList.toggle('hidden');
}

window.handleSettleClick = function() { document.getElementById('settle-modal').classList.remove('hidden'); }
window.closeSettleModal = function() { document.getElementById('settle-modal').classList.add('hidden'); }

document.addEventListener('click', function (event) {
    const tooltip = document.getElementById('hint-tooltip');
    if (tooltip && !tooltip.classList.contains('hidden')) tooltip.classList.add('hidden');
});

window.onload = window.initApp;