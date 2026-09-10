import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCC4Jqztj0Ze7Pf47PWmZrBHmvmrxIdmA0",
    authDomain: "todotoday-d9a93.firebaseapp.com",
    projectId: "todotoday-d9a93",
    storageBucket: "todotoday-d9a93.firebasestorage.app",
    messagingSenderId: "791087744814",
    appId: "1:791087744814:web:d5e3cbc461a5d352f61cbf",
    measurementId: "G-X727KFDT6N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseAuth = auth;
window.firebaseDb = db;
window.GoogleAuthProvider = GoogleAuthProvider;
window.signInWithPopup = signInWithPopup;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;

// Biến toàn cục để app.js có thể kiểm tra trạng thái login
window.currentFirebaseUser = null;

// --- HÀM LƯU DỮ LIỆU LÊN CLOUD ---
window.saveToCloud = async function(state) {
    if (!window.currentFirebaseUser) return;
    const syncStatusEl = document.getElementById('cloud-sync-status');
    const isVi = window.appState.currentLang === "vi";
    
    try {
        if (syncStatusEl) syncStatusEl.innerText = isVi ? "Đang đồng bộ..." : "Syncing...";
        const userRef = doc(db, "users", window.currentFirebaseUser.uid);
        await setDoc(userRef, state);
        if (syncStatusEl) syncStatusEl.innerText = isVi ? "Đã đồng bộ" : "Synced";
        console.log("Cloud Saved!");
    } catch (error) {
        console.error("Lỗi lưu Cloud:", error);
        if (syncStatusEl) syncStatusEl.innerText = isVi ? "Lỗi đồng bộ!" : "Sync Error!";
    }
}

// --- LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP ---
onAuthStateChanged(auth, async (user) => {
    window.currentFirebaseUser = user;
    const authBtnText = document.getElementById('auth-btn-text');
    const unloggedView = document.getElementById('auth-unlogged-view');
    const loggedView = document.getElementById('auth-logged-view');
    const isVi = (window.appState && window.appState.currentLang === "vi") ? true : true; 

    if (user) {
        // UI: Hiện thông tin user
        const rawDisplayName = user.displayName || user.email.split('@')[0];
        
        // Cắt giới hạn 12 ký tự cho nút Button trên thanh Header
        const shortName = rawDisplayName.length > 12 ? rawDisplayName.substring(0, 12) + '...' : rawDisplayName;
        if(authBtnText) authBtnText.innerText = shortName; 
        
        // Trong bảng Drawer thì vẫn hiển thị tên gốc đầy đủ (rawDisplayName)
        if(document.getElementById('user-display-name')) {
            document.getElementById('user-display-name').innerText = rawDisplayName;
            document.getElementById('user-email-text').innerText = user.email;
            document.getElementById('user-avatar-text').innerText = rawDisplayName.charAt(0).toUpperCase();
        }

       
        if(unloggedView && loggedView) {
            unloggedView.classList.add('hidden');
            loggedView.classList.remove('hidden');
            loggedView.classList.add('flex');
        }

        // LOGIC: Kéo dữ liệu từ Cloud Firestore về
        try {
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                
                // 1. KIỂM TRA THÔNG MINH (Bỏ qua các ngày trống & đồng nhất thứ tự key)
                const getComparableData = (state) => {
                    if (!state) return { h: [], d: {} };
                    const cleanD = {};
                    if (state.dailyBoards) {
                        for (const dateKey in state.dailyBoards) {
                            const b = state.dailyBoards[dateKey];
                            // Chỉ lấy những ngày CÓ TASK để đem ra so sánh
                            if (b && (b.morning?.length > 0 || b.afternoon?.length > 0 || b.evening?.length > 0)) {
                                cleanD[dateKey] = b;
                            }
                        }
                    }
                    // Hàm đệ quy sắp xếp key alphabet để JSON.stringify so sánh chính xác 100%
                    const normalize = (obj) => {
                        if (obj === null || typeof obj !== 'object') return obj;
                        if (Array.isArray(obj)) return obj.map(normalize);
                        return Object.keys(obj).sort().reduce((res, key) => {
                            res[key] = normalize(obj[key]);
                            return res;
                        }, {});
                    };
                    return JSON.stringify(normalize({ h: state.history || [], d: cleanD }));
                };

                const localCompare = getComparableData(window.appState);
                const cloudCompare = getComparableData(cloudData);

                // NẾU CÓ SỰ KHÁC BIỆT THỰC SỰ
                if (localCompare !== cloudCompare) {
                    
                    // 2. TỰ ĐỘNG HỢP NHẤT (Auto-Merge)
                    const historyMap = new Map();
                    if (Array.isArray(window.appState.history)) window.appState.history.forEach(item => { if (item.date) historyMap.set(item.date, item); });
                    if (Array.isArray(cloudData.history)) cloudData.history.forEach(item => { if (item.date) historyMap.set(item.date, item); });
                    window.appState.history = Array.from(historyMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

                    if (!window.appState.dailyBoards) window.appState.dailyBoards = {};
                    if (cloudData.dailyBoards) {
                        for (const dateKey in cloudData.dailyBoards) {
                            window.appState.dailyBoards[dateKey] = cloudData.dailyBoards[dateKey];
                        }
                    }
                    // GỌI HÀM KIỂM TRA ĐỂ SỬA NGÀY LÀM VIỆC NẾU DATA MỚI TỪ CLOUD ĐÃ CHỐT (FIX BUG)
                    if (typeof window.validateAndAutoShiftDate === 'function') {
                        window.validateAndAutoShiftDate();
                    }
                    
                    // 3. LƯU & RENDER LẠI GIAO DIỆN
                    window.save(); 
                    if(window.ensureStructure) window.ensureStructure(window.appState.selectedDate);
                    const panelToday = document.getElementById('panel-today');
                    if(panelToday && !panelToday.classList.contains('hidden') && window.renderBoard) {
                        window.renderBoard();
                    } else if (window.buildYearFilterOptions) {
                        window.buildYearFilterOptions();
                    }

                    // 4. HIỂN THỊ TOAST THÔNG BÁO (Tự tắt sau 5s)
                    const toast = document.getElementById('sync-toast');
                    if (toast) {
                        toast.classList.remove('-translate-y-[150%]', 'opacity-0');
                        toast.classList.add('translate-y-0', 'opacity-100');
                        
                        setTimeout(() => {
                            toast.classList.remove('translate-y-0', 'opacity-100');
                            toast.classList.add('-translate-y-[150%]', 'opacity-0');
                        }, 5000);
                    }
                    console.log("Auto-merged new data from Cloud.");
                } else {
                    console.log("Local and Cloud data are identical. No merge needed.");
                }

            } else {
                // Lần đầu tiên đăng nhập, account chưa có data -> Đẩy data máy này lên
                window.saveToCloud(window.appState);
            }
        } catch (err) {
            console.error("Lỗi kéo dữ liệu từ Cloud:", err);
        }

    } else {
        // NẾU LOG OUT
        if(authBtnText) authBtnText.innerText = isVi ? "Đăng nhập" : "Log In";
        if(unloggedView && loggedView) {
            unloggedView.classList.remove('hidden');
            loggedView.classList.add('hidden');
            loggedView.classList.remove('flex');
        }
    }
});

window.loginWithGoogle = async function() {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (error) { alert("Lỗi đăng nhập Google: " + error.message); }
}

window.handleEmailAuth = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const isVi = window.appState.currentLang === "vi";
    if (!email || !password) return alert(isVi ? "Vui lòng nhập đủ thông tin!" : "Enter all fields!");

    try {
        if (window.isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            alert(isVi ? "🎉 Đăng ký thành công!" : "🎉 Sign up successful!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) { alert(error.message); }
}

window.logoutFromFirebase = async function() {
    try {
        await signOut(auth);
        alert(window.appState.currentLang === "vi" ? "Đã đăng xuất an toàn." : "Logged out successfully.");
    } catch (error) { console.error("Logout Error:", error); }
}
