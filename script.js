// ==================== KHỞI TẠO BIẾN CẤU HÌNH GLOBAL ====================
const GOOGLE_CLIENT_ID = "422788053444-15jiv5s2034rc2knil7q04uq7a1ckigq.apps.googleusercontent.com";

var allProducts = [];
var currentCategoryFilter = 'tất cả';
var showingOnlyFavorites = false;
var favorites = [];
try {
    favorites = JSON.parse(localStorage.getItem('mth_favorites') || localStorage.getItem('shhc_favorites') || '[]');
} catch (e) {
    favorites = [];
}
var selectedMergeFiles = [];
var selectedDeleteFile = null;

// ==================== TẢI THƯ VIỆN CẦN THIẾT (CDN DYNAMIC LOADER) ====================
function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        script.onload = resolve;
        script.onerror = function () { reject(new Error('Không thể tải thư viện PDF-LIB')); };
        document.head.appendChild(script);
    });
}

function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = function () {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
        };
        script.onerror = function () { reject(new Error('Không thể tải PDF.js')); };
        document.head.appendChild(script);
    });
}

function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = resolve;
        script.onerror = function () { reject(new Error('Không thể tải Tesseract.js')); };
        document.head.appendChild(script);
    });
}

function loadXlsxLib() {
    if (window.XLSX) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = function () { reject(new Error('Không thể tải thư viện xuất Excel')); };
        document.head.appendChild(script);
    });
}

function loadMammoth() {
    if (window.mammoth) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        script.onload = resolve;
        script.onerror = function () { reject(new Error('Không thể tải thư viện Mammoth.js')); };
        document.head.appendChild(script);
    });
}

// ==================== HÀM TIỆN ÍCH THÔNG MINH (UTILITIES) ====================
function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str.toLowerCase().trim();
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==================== KHI TRANG LÊN NỀN (INIT) ====================
document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    initTheme();
    updateFavCount();
    checkAutoLogin();

    setTimeout(initGoogleAuth, 1000);

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    var aiInput = document.getElementById('aiChatInput');
    if (aiInput) {
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAiChatSubmit();
            }
        });
    }
});

// ==================== ĐĂNG NHẬP & ĐĂNG KÝ BẰNG GOOGLE ====================
function initGoogleAuth() {
    if (window.google && window.google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false
        });
    }
}

function handleGoogleRegister() {
    if (!window.google || !window.google.accounts) {
        showToast('Đang kết nối thư viện Google SDK, vui lòng thử lại sau giây lát!', 'info');
        initGoogleAuth();
        return;
    }

    google.accounts.id.prompt(function (notification) {
        if (notification.isNotDisplayed() || notification.isSkippedMomentum()) {
            google.accounts.id.renderButton(
                document.getElementById("registerModal"),
                { theme: "outline", size: "large", text: "signup_with" }
            );
        }
    });
}

function handleGoogleCredentialResponse(response) {
    try {
        var userData = parseJwt(response.credential);
        var user = {
            id: userData.sub,
            name: userData.name,
            email: userData.email,
            avatar: userData.picture,
            loggedInAt: new Date().toISOString()
        };

        localStorage.setItem("meotinhoc_user", JSON.stringify(user));
        updateUserHeaderUI(user);
        toggleRegisterModal();
        showToast('🎉 Chào mừng ' + user.name + ' đã đăng nhập thành công!', 'success');
    } catch (error) {
        console.error("Lỗi giải mã Google Token:", error);
        showToast('Đăng nhập không thành công, vui lòng thử lại!', 'error');
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function checkAutoLogin() {
    var savedUser = localStorage.getItem("meotinhoc_user");
    if (savedUser) {
        try {
            var user = JSON.parse(savedUser);
            updateUserHeaderUI(user);
        } catch (e) {
            console.error("Lỗi đọc dữ liệu người dùng lưu trữ");
        }
    }
}

function updateUserHeaderUI(user) {
    var registerBtns = document.querySelectorAll("button[onclick='toggleRegisterModal()']");
    registerBtns.forEach(function (btn) {
        btn.setAttribute("onclick", "logoutUser()");
        btn.title = "Đăng xuất (" + user.email + ")";
        btn.innerHTML = '<img src="' + user.avatar + '" alt="' + escapeHtml(user.name) + '" class="w-5 h-5 rounded-full border border-white/40">' +
            '<span class="hidden lg:inline text-xs font-bold truncate max-w-[100px]">' + escapeHtml(user.name) + '</span>' +
            '<i class="fa-solid fa-right-from-bracket text-red-400 text-xs ml-1"></i>';
    });
}

function logoutUser() {
    if (confirm("Bạn có muốn đăng xuất tài khoản không?")) {
        localStorage.removeItem("meotinhoc_user");
        showToast('Đã đăng xuất tài khoản!', 'info');
        setTimeout(function () { location.reload(); }, 600);
    }
}

// --- Quản lý Giao diện Sáng/Tối (Dark Mode) ---
function initTheme() {
    var savedTheme = localStorage.getItem('theme');
    var isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    var isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
    showToast('Đã chuyển sang giao diện ' + (isDark ? 'Tối' : 'Sáng'), 'info');
}

function updateThemeIcon() {
    var icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (document.documentElement.classList.contains('dark')) {
        icon.className = 'fa-solid fa-sun text-sm sm:text-base text-amber-400';
    } else {
        icon.className = 'fa-solid fa-moon text-sm sm:text-base text-amber-400';
    }
}

// --- Menu Di Động ---
function toggleMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
}

function closeMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.add('hidden');
}

// --- Thông Báo Toast ---
function showToast(message, type) {
    var toast = document.getElementById('toast');
    var toastMsg = document.getElementById('toastMessage');
    var toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMsg) return;

    toastMsg.innerText = message || 'Thông báo!';

    if (toastIcon) {
        if (type === 'error') {
            toastIcon.className = 'fa-solid fa-circle-xmark text-red-400 text-lg';
        } else if (type === 'info') {
            toastIcon.className = 'fa-solid fa-circle-info text-blue-400 text-lg';
        } else {
            toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-lg';
        }
    }

    toast.classList.remove('toast-enter', 'hidden');
    toast.classList.add('toast-show');

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function () {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-enter');
    }, 3200);
}

// --- Nạp Dữ Liệu Sản Phẩm & Bài Viết ---
async function fetchData() {
    try {
        var response = await fetch('data.json');
        if (!response.ok) throw new Error('Không tải được data.json');
        allProducts = await response.json();
        updateCategoryCounts();
        filterProducts();
    } catch (error) {
        console.error('Lỗi nạp dữ liệu:', error);
    }
}

function updateCategoryCounts() {
    if (!Array.isArray(allProducts) || !allProducts.length) return;

    var countAllEl = document.getElementById('countAll');
    if (countAllEl) countAllEl.innerText = allProducts.length;

    var countInternal = allProducts.filter(function (p) { 
        return p.isInternal || (p.category || '').toLowerCase().includes('nội bộ'); 
    }).length;
    var countSoftware = allProducts.filter(function (p) { 
        return (p.category || '').toLowerCase().includes('phần mềm quản lý') || (p.category || '').toLowerCase().includes('software'); 
    }).length;
    var countExcel = allProducts.filter(function (p) { 
        return (p.category || '').toLowerCase().includes('tiện ích excel/word') || (p.category || '').toLowerCase().includes('mẹo excel'); 
    }).length;
    var countDocs = allProducts.filter(function (p) { 
        return (p.category || '').toLowerCase().includes('mẫu biểu') || (p.category || '').toLowerCase().includes('bài viết'); 
    }).length;

    if (document.getElementById('countInternal')) document.getElementById('countInternal').innerText = countInternal;
    if (document.getElementById('countSoftware')) document.getElementById('countSoftware').innerText = countSoftware;
    if (document.getElementById('countExcel')) document.getElementById('countExcel').innerText = countExcel;
    if (document.getElementById('countDocs')) document.getElementById('countDocs').innerText = countDocs;
}

// ==================== BỘ LỌC VÀ HIỂN THỊ SẢN PHẨM THÔNG MINH ====================
function filterProducts() {
    var rawInput = document.getElementById('searchInput')?.value || '';
    var keyword = removeVietnameseTones(rawInput);

    var filtered = allProducts.filter(function (item) {
        var itemTitle = removeVietnameseTones(item.title || '');
        var itemDesc = removeVietnameseTones(item.desc || '');
        var itemCat = removeVietnameseTones(item.category || '');

        var matchesKeyword = !keyword || itemTitle.includes(keyword) || itemDesc.includes(keyword) || itemCat.includes(keyword);
        
        var matchesCategory = (currentCategoryFilter === 'tất cả') || 
            (currentCategoryFilter === 'phần mềm nội bộ' && (item.isInternal || itemCat.includes('noi bo'))) ||
            itemCat.includes(removeVietnameseTones(currentCategoryFilter));
            
        var matchesFav = !showingOnlyFavorites || favorites.includes(item.id);
        return matchesKeyword && matchesCategory && matchesFav;
    });

    renderProducts(filtered);
}

function setCategoryFilter(category, btnElement) {
    currentCategoryFilter = category;
    showingOnlyFavorites = false;

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        if (!btn.id || btn.id !== 'favFilterBtn') {
            btn.className = 'filter-btn px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap';
        }
    });

    if (btnElement) {
        btnElement.className = 'filter-btn px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold whitespace-nowrap shadow-sm';
    }

    var favBtn = document.getElementById('favFilterBtn');
    if (favBtn) {
        favBtn.className = 'px-4 py-2.5 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 text-xs font-bold whitespace-nowrap border border-pink-200/80 dark:border-pink-900/50';
    }

    filterProducts();
}

function toggleFavoriteFilter() {
    showingOnlyFavorites = !showingOnlyFavorites;
    var favBtn = document.getElementById('favFilterBtn');

    if (showingOnlyFavorites) {
        favBtn.className = 'px-4 py-2.5 rounded-2xl bg-pink-600 text-white text-xs font-bold whitespace-nowrap shadow-sm';
        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.className = 'filter-btn px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap';
        });
    } else {
        favBtn.className = 'px-4 py-2.5 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 text-xs font-bold whitespace-nowrap border border-pink-200/80 dark:border-pink-900/50';
        setCategoryFilter('tất cả', document.querySelector('.filter-btn'));
    }

    filterProducts();
}

function renderProducts(products) {
    var grid = document.getElementById('productGrid');
    var noResults = document.getElementById('noResults');

    if (!grid) return;
    grid.innerHTML = '';

    if (!products || products.length === 0) {
        noResults?.classList.remove('hidden');
        return;
    }
    noResults?.classList.add('hidden');

    products.forEach(function (item) {
        var isFav = favorites.includes(item.id);
        var isInternal = item.isInternal || (item.category || '').toLowerCase().includes('nội bộ');
        var card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:-translate-y-1 relative';

        var categoryBadge = isInternal
            ? '<span class="inline-flex items-center gap-1 bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase mb-1"><i class="fa-solid fa-lock text-[9px]"></i> Nội Bổ</span>'
            : '<span class="text-[10px] font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 block mb-1">' + escapeHtml(item.category || '') + '</span>';

        var buttonHTML = '';
        if (item.isOnlineTool) {
            buttonHTML = '<button onclick="openOnlineToolModal(\'' + (item.toolType || '') + '\')" class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"><i class="fa-solid fa-circle-play"></i> Mở Công Cụ Trực Tuyến</button>';
        } else if (item.isArticle) {
            buttonHTML = '<a href="' + (item.articleUrl || '#') + '" class="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"><i class="fa-solid fa-book-open"></i> Đọc Bài Viết</a>';
        } else if (isInternal) {
            buttonHTML = '<button onclick="openDownloadModal(\'' + item.id + '\')" class="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"><i class="fa-solid fa-key"></i> Tải Phần Mềm Nội Bộ</button>';
        } else {
            buttonHTML = '<button onclick="openDownloadModal(\'' + item.id + '\')" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"><i class="fa-solid fa-download"></i> Tải Phần Mềm / Mẫu</button>';
        }

        card.innerHTML = '<div>' +
            '<div class="flex justify-between items-start mb-4">' +
            '<div class="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">' +
            '<i class="fa-solid ' + (item.icon || 'fa-box') + '"></i>' +
            '</div>' +
            '<button onclick="toggleFavorite(\'' + item.id + '\', event)" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 ' + (isFav ? 'text-pink-500' : '') + '">' +
            '<i class="fa-' + (isFav ? 'solid' : 'regular') + ' fa-heart text-base"></i>' +
            '</button>' +
            '</div>' +
            categoryBadge +
            '<h3 class="font-extrabold text-base text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">' + escapeHtml(item.title || '') + '</h3>' +
            '<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">' + escapeHtml(item.desc || '') + '</p>' +
            '</div>' +
            '<div>' + buttonHTML + '</div>';
        grid.appendChild(card);
    });
}

function resetSearch() {
    var input = document.getElementById('searchInput');
    if (input) input.value = '';
    setCategoryFilter('tất cả', document.querySelector('.filter-btn'));
}

// ==================== MỞ POPUP CÔNG CỤ TRỰC TUYẾN ====================
function openOnlineToolModal(toolTypeOrObject) {
    var modal = document.getElementById('onlineToolModal');
    if (!modal) return;

    var toolType = typeof toolTypeOrObject === 'string' ? toolTypeOrObject : (toolTypeOrObject?.toolType || '');

    document.querySelectorAll('.tool-ui-box').forEach(function (box) { box.classList.add('hidden'); });

    var titleEl = document.getElementById('toolTitle');
    var subEl = document.getElementById('toolSub');
    var iconEl = document.getElementById('toolIcon');

    if (toolType === 'pdf-merge') {
        if (titleEl) titleEl.innerText = 'Công Cụ Ghép File PDF Trực Tuyến';
        if (subEl) subEl.innerText = 'Gộp nhiều tệp PDF riêng lẻ thành 1 file duy nhất';
        if (iconEl) iconEl.className = 'fa-solid fa-object-group text-2xl text-blue-600';
        document.getElementById('pdfMergeUI')?.classList.remove('hidden');
    } else if (toolType === 'pdf-delete') {
        if (titleEl) titleEl.innerText = 'Công Cụ Xóa Trang File PDF Trực Tuyến';
        if (subEl) subEl.innerText = 'Chọn và loại bỏ các trang PDF thừa hoặc không cần thiết';
        if (iconEl) iconEl.className = 'fa-solid fa-file-circle-xmark text-2xl text-red-600';
        document.getElementById('pdfDeleteUI')?.classList.remove('hidden');
    } else if (toolType === 'pdf-clean') {
        if (titleEl) titleEl.innerText = 'Công Cụ Làm Sạch Văn Bản PDF';
        if (subEl) subEl.innerText = 'Sửa lỗi ngắt dòng, dính chữ, thừa khoảng trắng khi copy từ PDF/Web';
        if (iconEl) iconEl.className = 'fa-solid fa-broom text-2xl text-cyan-600';
        document.getElementById('pdfCleanTextUI')?.classList.remove('hidden');
    } else if (toolType === 'ocr-online') {
        if (titleEl) titleEl.innerText = 'Quét & Nhận Diện Chữ OCR Tiếng Việt';
        if (subEl) subEl.innerText = 'Trích xuất chữ từ ảnh chụp hoặc PDF scan sang văn bản Word/Excel';
        if (iconEl) iconEl.className = 'fa-solid fa-bolt text-2xl text-teal-600';
        document.getElementById('ocrOnlineUI')?.classList.remove('hidden');
    } else if (toolType === 'spell-online') {
        if (titleEl) titleEl.innerText = 'Soát Lỗi Chính Tả & Căn Chỉnh Khoảng Trắng';
        if (subEl) subEl.innerText = 'Soát lỗi từ ngữ, khoảng trắng và chuẩn hóa văn phong tiếng Việt';
        if (iconEl) iconEl.className = 'fa-solid fa-magnifying-glass-chart text-2xl text-purple-600';
        document.getElementById('spellOnlineUI')?.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
}

function closeOnlineToolModal() {
    document.getElementById('onlineToolModal')?.classList.add('hidden');
}

// --- 1. GHÉP PDF ---
function handlePdfSelect(e) {
    var files = Array.from(e.target.files);
    if (!files.length) return;

    var validPdfFiles = files.filter(function(file) {
        var isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            showToast('Bỏ qua file không phải PDF: ' + file.name, 'error');
        }
        return isPdf;
    });

    var existingNames = selectedMergeFiles.map(function(f) { return f.name; });
    validPdfFiles.forEach(function(f) {
        if (!existingNames.includes(f.name)) {
            selectedMergeFiles.push(f);
        } else {
            showToast('Tệp đã có trong danh sách: ' + f.name, 'info');
        }
    });

    e.target.value = '';
    renderPdfMergeList();
}

function renderPdfMergeList() {
    var listEl = document.getElementById('pdfFileList');
    if (!listEl) return;

    if (selectedMergeFiles.length === 0) {
        listEl.innerHTML = '<li class="text-xs text-slate-400 text-center py-2">Chưa chọn tệp PDF nào</li>';
        return;
    }

    listEl.innerHTML = selectedMergeFiles.map(function (f, i) {
        return '<li class="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">' +
            '<span class="truncate font-semibold text-xs text-slate-700 dark:text-slate-300 max-w-[80%]">' + (i + 1) + '. ' + escapeHtml(f.name) + ' (' + (f.size / 1024 / 1024).toFixed(2) + ' MB)</span>' +
            '<button onclick="removePdfFile(' + i + ')" class="text-red-500 hover:text-red-700 font-bold text-xs px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition">Xóa</button>' +
            '</li>';
    }).join('');
}

function removePdfFile(index) {
    selectedMergeFiles.splice(index, 1);
    renderPdfMergeList();
}

async function processPdfMerge() {
    if (selectedMergeFiles.length < 2) {
        showToast('Vui lòng chọn ít nhất 2 file PDF để ghép!', 'error');
        return;
    }

    showToast('Đang tiến hành ghép ' + selectedMergeFiles.length + ' file PDF...', 'info');

    try {
        await loadPdfLib();
        var mergedPdf = await PDFLib.PDFDocument.create();

        for (var i = 0; i < selectedMergeFiles.length; i++) {
            var file = selectedMergeFiles[i];
            var arrayBuffer = await file.arrayBuffer();
            var pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            var copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(function (page) { mergedPdf.addPage(page); });
        }

        var mergedPdfBytes = await mergedPdf.save();
        var blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        var url = URL.createObjectURL(blob);

        var a = document.createElement('a');
        a.href = url;
        a.download = 'MeoTinHoc_Ghep_' + Date.now() + '.pdf';
        a.click();
        
        setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

        showToast('Ghép PDF thành công! Đã bắt đầu tải về.', 'success');
        selectedMergeFiles = [];
        renderPdfMergeList();
        closeOnlineToolModal();
    } catch (err) {
        console.error(err);
        showToast('Lỗi ghép PDF: Tệp bị khóa mật khẩu hoặc hư hỏng!', 'error');
    }
}

// --- 2. XÓA TRANG PDF ---
function handlePdfDeleteSelect(e) {
    var file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Tệp đã chọn không phải định dạng PDF!', 'error');
        e.target.value = '';
        return;
    }

    selectedDeleteFile = file;
    document.getElementById('pdfDeleteFileName').innerText = '📄 Đã chọn: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
    document.getElementById('pdfDeletePageBox')?.classList.remove('hidden');
}

async function processPdfDelete() {
    if (!selectedDeleteFile) {
        showToast('Vui lòng chọn file PDF cần xóa trang!', 'error');
        return;
    }

    var pageInput = document.getElementById('pagesToDeleteInput')?.value.trim();
    if (!pageInput) {
        showToast('Vui lòng nhập vị trí trang cần xóa (ví dụ: 2, 5 hoặc 3-7)!', 'error');
        return;
    }

    showToast('Đang phân tích & xóa trang PDF...', 'info');

    try {
        await loadPdfLib();
        var arrayBuffer = await selectedDeleteFile.arrayBuffer();
        var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        var totalPages = pdfDoc.getPageCount();

        var pagesToDelete = new Set();
        var parts = pageInput.split(',');

        parts.forEach(function (p) {
            p = p.trim();
            if (p.includes('-')) {
                var range = p.split('-').map(Number);
                if (!isNaN(range[0]) && !isNaN(range[1])) {
                    var start = Math.min(range[0], range[1]);
                    var end = Math.max(range[0], range[1]);
                    for (var i = start; i <= end; i++) {
                        if (i >= 1 && i <= totalPages) pagesToDelete.add(i - 1);
                    }
                }
            } else {
                var pageNum = Number(p);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                    pagesToDelete.add(pageNum - 1);
                }
            }
        });

        if (pagesToDelete.size === 0) {
            showToast('Số trang cần xóa vượt quá tổng số trang (' + totalPages + ' trang) hoặc không hợp lệ!', 'error');
            return;
        }

        if (pagesToDelete.size >= totalPages) {
            showToast('Không thể xóa toàn bộ ' + totalPages + ' trang của tài liệu!', 'error');
            return;
        }

        var newPdf = await PDFLib.PDFDocument.create();
        var pageIndicesKeep = [];
        for (var i = 0; i < totalPages; i++) {
            if (!pagesToDelete.has(i)) pageIndicesKeep.push(i);
        }

        var copiedPages = await newPdf.copyPages(pdfDoc, pageIndicesKeep);
        copiedPages.forEach(function (p) { newPdf.addPage(p); });

        var pdfBytes = await newPdf.save();
        var blob = new Blob([pdfBytes], { type: 'application/pdf' });
        var url = URL.createObjectURL(blob);

        var a = document.createElement('a');
        a.href = url;
        a.download = 'MeoTinHoc_Da_Xoa_Trang_' + Date.now() + '.pdf';
        a.click();

        setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

        showToast('Xóa thành công ' + pagesToDelete.size + ' trang! Đã bắt đầu tải tệp về.', 'success');
        closeOnlineToolModal();
    } catch (err) {
        console.error(err);
        showToast('Lỗi xử lý file PDF!', 'error');
    }
}

// --- 3. THUẬT TOÁN OCR HÓA ĐƠN & BẢNG KẺ ---
function handleOcrSelect(e) {
    var file = e.target.files[0];
    if (file) {
        document.getElementById('ocrFileName').innerText = 'Đã chọn: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
    }
}

function extractStructuredTextFromPdfPage(textContent) {
    var items = textContent.items;
    if (!items || items.length === 0) return "";

    var validItems = items.filter(function (it) { return it.str && it.str.trim().length > 0; });
    if (validItems.length === 0) return "";

    var heights = validItems.map(function (it) { return Math.abs(it.transform[3]) || 12; }).sort(function (a, b) { return a - b; });
    var avgHeight = heights[Math.floor(heights.length / 2)] || 12;

    var lineYThreshold = Math.max(3.0, avgHeight * 0.35);
    var colGapThreshold = Math.max(10.0, avgHeight * 0.75);

    var sortedItems = validItems.slice().sort(function (a, b) {
        var yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > lineYThreshold) return yDiff;
        return a.transform[4] - b.transform[4];
    });

    var rows = [];
    var currentRow = [];
    var currentY = null;

    sortedItems.forEach(function (item) {
        var itemY = item.transform[5];
        if (currentY === null || Math.abs(itemY - currentY) > lineYThreshold) {
            if (currentRow.length > 0) {
                currentRow.sort(function (a, b) { return a.transform[4] - b.transform[4]; });
                rows.push(currentRow);
            }
            currentRow = [item];
            currentY = itemY;
        } else {
            currentRow.push(item);
        }
    });
    if (currentRow.length > 0) {
        currentRow.sort(function (a, b) { return a.transform[4] - b.transform[4]; });
        rows.push(currentRow);
    }

    return rows.map(function (row) {
        var rowText = "";
        var lastX = null;
        var lastWidth = 0;

        row.forEach(function (item) {
            var currentX = item.transform[4];
            var cleanedStr = item.str.replace(/\s{2,}/g, "\t");

            if (lastX !== null) {
                var gap = currentX - (lastX + lastWidth);
                if (gap > colGapThreshold) {
                    if (!rowText.endsWith("\t")) rowText += "\t";
                } else if (gap > 1.5 && !rowText.endsWith(" ") && !rowText.endsWith("\t")) {
                    rowText += " ";
                }
            }
            rowText += cleanedStr;
            lastX = currentX;
            lastWidth = (item.width && item.width > 0) ? item.width : (item.str.length * avgHeight * 0.45);
        });
        return rowText;
    }).join("\n");
}

function processTesseractWordsToStructuredText(words) {
    if (!words || words.length === 0) return "";

    var validWords = words.filter(function (w) { return w.text && w.text.trim().length > 0; });
    if (validWords.length === 0) return "";

    var heights = validWords.map(function (w) { return Math.abs(w.bbox.y1 - w.bbox.y0); }).filter(function (h) { return h > 5; }).sort(function (a, b) { return a - b; });
    var medianHeight = heights.length > 0 ? heights[Math.floor(heights.length / 2)] : 15;

    var rowYThreshold = Math.max(6, medianHeight * 0.45);
    var columnGapThreshold = Math.max(12, medianHeight * 1.1);

    var sortedWords = validWords.slice().sort(function (a, b) {
        var yDiff = a.bbox.y0 - b.bbox.y0;
        if (Math.abs(yDiff) > rowYThreshold) return yDiff;
        return a.bbox.x0 - b.bbox.x0;
    });

    var rows = [];
    var currentRow = [];
    var currentY = null;

    sortedWords.forEach(function (w) {
        if (currentY === null || Math.abs(w.bbox.y0 - currentY) > rowYThreshold) {
            if (currentRow.length > 0) {
                currentRow.sort(function (a, b) { return a.bbox.x0 - b.bbox.x0; });
                rows.push(currentRow);
            }
            currentRow = [w];
            currentY = w.bbox.y0;
        } else {
            currentRow.push(w);
        }
    });
    if (currentRow.length > 0) {
        currentRow.sort(function (a, b) { return a.bbox.x0 - b.bbox.x0; });
        rows.push(currentRow);
    }

    return rows.map(function (row) {
        var rowStr = "";
        var lastX1 = null;

        row.forEach(function (w) {
            if (lastX1 !== null) {
                var gap = w.bbox.x0 - lastX1;
                if (gap > columnGapThreshold) {
                    rowStr += "\t";
                } else if (gap > medianHeight * 0.15) {
                    rowStr += " ";
                }
            }
            rowStr += w.text;
            lastX1 = w.bbox.x1;
        });
        return rowStr;
    }).join("\n");
}

function reconstructParagraphs(rawText) {
    if (!rawText) return "";

    var lines = rawText.split('\n');
    var formattedText = [];
    var currentParagraph = "";

    var isSpecialStructureLine = function (line) {
        var trimmed = line.trim();
        if (!trimmed) return true;

        if (line.includes('\t')) return true;
        if (line.split(/\s{2,}/).length >= 2 && !line.startsWith('---')) return true;
        if (/^\d{1,3}[\.\s\t]/.test(trimmed)) return true;
        if (/\d{1,3}(\.\d{3})+$/.test(trimmed) || /\d+[\.,]\d+$/.test(trimmed)) return true;
        if (/^(CỘNG HÒA|ĐỘC LẬP|HÓA ĐƠN|Đơn vị|Mã số thuế|Địa chỉ|Họ tên|Tên đơn vị|Tài khoản|STT|Tổng cộng|Số tiền|Người mua|Người bán|Ký hiệu|Mã của|Trang tra|Ngày|Tháng|Năm)/i.test(trimmed)) return true;
        if (/^(---|\[TRANG|[I|V|X]+\.|\d+[\.\)]|[a-z]\)|Điều \d+|Chương [I|V|X]+|Mục \d+)/i.test(trimmed)) return true;
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes('.')) return true;

        return false;
    };

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (!line) {
            if (currentParagraph) {
                formattedText.push(currentParagraph);
                currentParagraph = "";
            }
            formattedText.push("");
            continue;
        }

        if (isSpecialStructureLine(line)) {
            if (currentParagraph) {
                formattedText.push(currentParagraph);
                currentParagraph = "";
            }
            formattedText.push(line);
            continue;
        }

        if (!currentParagraph) {
            currentParagraph = line;
        } else {
            if (currentParagraph.endsWith('-')) {
                currentParagraph = currentParagraph.slice(0, -1) + line;
            } else if (/[.:?!;]$/.test(currentParagraph)) {
                formattedText.push(currentParagraph);
                currentParagraph = line;
            } else {
                currentParagraph += " " + line;
            }
        }
    }

    if (currentParagraph) {
        formattedText.push(currentParagraph);
    }

    return formattedText.join('\n');
}

function fixVietnameseSpellingText(text) {
    if (!text) return "";

    var cleaned = text.normalize('NFC');
    cleaned = cleaned.replace(/\s+([,.:;?!])/g, '$1');
    cleaned = cleaned.replace(/([,.:;?!])([A-Za-zÀ-ỹ])/g, '$1 $2');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');

    var errorMap = [
        [/\bCong hoa\b/gi, 'Cộng hòa'],
        [/\bXa hoi\b/gi, 'Xã hội'],
        [/\bChu nghia\b/gi, 'Chủ nghĩa'],
        [/\bViet Nam\b/gi, 'Việt Nam'],
        [/\bDoc lap\b/gi, 'Độc lập'],
        [/\bTu do\b/gi, 'Tự do'],
        [/\bHanh phuc\b/gi, 'Hạnh phúc'],
        [/\bNghi đinh\b/gi, 'Nghị định'],
        [/\bQuyet đinh\b/gi, 'Quyết định'],
        [/\bThong bao\b/gi, 'Thông báo'],
        [/\bThong tu\b/gi, 'Thông tư'],
        [/\bBao cao\b/gi, 'Báo cáo'],
        [/\bTo trinh\b/gi, 'Tờ trình'],
        [/\bKê hoach\b/gi, 'Kế hoạch'],
        [/\bUy ban\b/gi, 'Ủy ban'],
        [/\bHoi đong\b/gi, 'Hội đồng'],
        [/\bCăn cư\b/gi, 'Căn cứ'],
        [/\bBan hanh\b/gi, 'Ban hành'],
        [/\bLuu van thu\b/gi, 'Lưu văn thư'],
        [/\bThanh pho\b/gi, 'Thành phố']
    ];

    errorMap.forEach(function (item) {
        cleaned = cleaned.replace(item[0], item[1]);
    });

    return cleaned;
}

function autoFixVietnameseSpellingUI() {
    var textarea = document.getElementById('ocrResultText');
    if (!textarea || !textarea.value.trim()) {
        showToast('Chưa có nội dung để sửa lỗi chính tả!', 'error');
        return;
    }
    var fixedSpelling = fixVietnameseSpellingText(textarea.value);
    textarea.value = reconstructParagraphs(fixedSpelling);
    showToast('Đã tự động chuẩn hóa đoạn văn & sửa lỗi chính tả!', 'success');
}

async function processOcrExtract() {
    var input = document.getElementById('ocrFileInput');
    if (!input || !input.files || !input.files[0]) {
        showToast('Vui lòng chọn tệp PDF hoặc tệp hình ảnh!', 'error');
        return;
    }

    var file = input.files[0];
    var resultTextarea = document.getElementById('ocrResultText');
    var isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    resultTextarea.value = "⚡ Đang bóc tách cấu trúc bảng kẻ & hóa đơn...";
    showToast('Đang tối ưu & xử lý OCR...', 'info');

    try {
        var rawText = "";

        if (isPdf) {
            await loadPdfJs();
            var arrayBuffer = await file.arrayBuffer();
            var pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            var numPages = pdfDoc.numPages;

            var pagesNeedOcr = [];

            for (var pageNum = 1; pageNum <= numPages; pageNum++) {
                resultTextarea.value = '⚡ Đang kiểm tra cấu trúc trang ' + pageNum + '/' + numPages + '...';
                var page = await pdfDoc.getPage(pageNum);
                var textContent = await page.getTextContent();

                if (textContent.items && textContent.items.length > 5) {
                    var pageText = extractStructuredTextFromPdfPage(textContent);
                    rawText += '--- TRANG ' + pageNum + ' ---\n' + pageText + '\n\n';
                } else {
                    pagesNeedOcr.push({ pageNum: pageNum, page: page });
                }
            }

            if (pagesNeedOcr.length > 0) {
                await loadTesseract();
                for (var i = 0; i < pagesNeedOcr.length; i++) {
                    var pageInfo = pagesNeedOcr[i];
                    resultTextarea.value = '⚡ AI đang quét bảng kẻ trang ' + pageInfo.pageNum + '/' + numPages + '...';

                    var viewport = pageInfo.page.getViewport({ scale: 1.5 });
                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await pageInfo.page.render({ canvasContext: context, viewport: viewport }).promise;

                    var result = await Tesseract.recognize(canvas, 'vie');
                    var ocrText = "";

                    if (result.data.words && result.data.words.length > 0) {
                        ocrText = processTesseractWordsToStructuredText(result.data.words);
                    } else {
                        ocrText = result.data.text.trim();
                    }

                    if (ocrText) {
                        rawText += '--- TRANG ' + pageInfo.pageNum + ' ---\n' + ocrText + '\n\n';
                    }
                }
            }
        } else {
            await loadTesseract();
            resultTextarea.value = "⚡ AI đang bóc tách bảng kẻ & chữ trong ảnh...";
            var result = await Tesseract.recognize(file, 'vie');

            if (result.data.words && result.data.words.length > 0) {
                rawText = processTesseractWordsToStructuredText(result.data.words);
            } else {
                rawText = result.data.text.trim();
            }
        }

        var fixedText = fixVietnameseSpellingText(rawText);
        var finalStructuredText = reconstructParagraphs(fixedText);

        resultTextarea.value = finalStructuredText || "Không trích xuất được văn bản.";
        showToast('Trích xuất & bảo toàn cấu trúc thành công!', 'success');

    } catch (err) {
        console.error("Lỗi OCR:", err);
        resultTextarea.value = '❌ Lỗi: ' + (err.message || 'Không thể xử lý');
        showToast('Có lỗi xảy ra khi quét tài liệu.', 'error');
    }
}

function exportOcrToWord() {
    var textarea = document.getElementById('ocrResultText');
    if (!textarea || !textarea.value.trim()) {
        showToast('Chưa có nội dung văn bản để xuất Word!', 'error');
        return;
    }

    var lines = textarea.value.split('\n');
    var htmlContent = "";
    var inTable = false;

    lines.forEach(function (line) {
        var isTableLine = line.includes('\t') || (line.split(/\s{2,}/).length >= 2 && !line.startsWith('---'));

        if (isTableLine) {
            if (!inTable) {
                htmlContent += "<table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse; width:100%; margin:12px 0; border:1px solid #000;'>";
                inTable = true;
            }
            var cells = line.includes('\t') ? line.split('\t') : line.split(/\s{2,}/);
            var cols = cells.map(function (c, idx) {
                return "<td style='padding:6px 8px; border:1px solid #000; vertical-align:top; font-size:12pt;" + (idx === 0 ? " text-align:center;" : "") + "'>" + escapeHtml(c.trim()) + "</td>";
            }).join('');
            htmlContent += '<tr>' + cols + '</tr>';
        } else {
            if (inTable) {
                htmlContent += "</table>";
                inTable = false;
            }
            if (line.trim()) {
                htmlContent += "<p style='margin:6px 0; text-align:justify; font-size:13pt;'>" + escapeHtml(line.trim()) + "</p>";
            } else {
                htmlContent += "<br>";
            }
        }
    });

    if (inTable) htmlContent += "</table>";

    var wordDoc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><title>Van Ban OCR</title><style>body { font-family: "Times New Roman", serif; line-height: 1.4; color: #000; } table { font-family: "Times New Roman", serif; border-collapse: collapse; } td, th { border: 1px solid #000; }</style></head>' +
        '<body>' + htmlContent + '</body></html>';

    var blob = new Blob(['\ufeff' + wordDoc], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Van_Ban_OCR_' + Date.now() + '.doc';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

    showToast('Đã xuất file Word (.doc) đóng khung bảng kẻ chuẩn!', 'success');
}

async function exportOcrToExcel() {
    var textarea = document.getElementById('ocrResultText');
    if (!textarea || !textarea.value.trim()) {
        showToast('Chưa có nội dung văn bản để xuất Excel!', 'error');
        return;
    }

    showToast('Đang khởi tạo file Excel...', 'info');

    try {
        await loadXlsxLib();

        var lines = textarea.value.split('\n');
        var excelData = lines.map(function (line) {
            if (line.includes('\t')) return line.split('\t');
            if (line.includes('  ')) return line.split(/\s{2,}/);
            return [line];
        });

        var ws = XLSX.utils.aoa_to_sheet(excelData);

        var colWidths = [];
        excelData.forEach(function (row) {
            row.forEach(function (cell, i) {
                var len = cell ? cell.toString().length : 10;
                colWidths[i] = Math.max(colWidths[i] || 10, Math.min(len + 3, 50));
            });
        });
        ws['!cols'] = colWidths.map(function (w) { return { wch: w }; });

        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Noidung_OCR");

        XLSX.writeFile(wb, 'Bang_Du_Lieu_OCR_' + Date.now() + '.xlsx');
        showToast('Đã xuất file Excel (.xlsx) chuẩn cột ô thành công!', 'success');

    } catch (err) {
        console.error(err);
        showToast('Lỗi khi tạo file Excel!', 'error');
    }
}

function copyOcrText() {
    var txt = document.getElementById('ocrResultText');
    if (txt && txt.value) {
        navigator.clipboard.writeText(txt.value);
        showToast('Đã sao chép văn bản vào bộ nhớ tạm!', 'success');
    } else {
        showToast('Chưa có văn bản để sao chép!', 'error');
    }
}

// --- 4. SOÁT LỖI CHÍNH TẢ & ĐỌC FILE TẢI LÊN ---
async function handleSpellFileSelect(e) {
    var file = e.target.files[0];
    if (!file) return;

    var fileNameEl = document.getElementById('spellFileName');
    if (fileNameEl) fileNameEl.innerText = 'Đã chọn: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';

    var textarea = document.getElementById('spellInputText');
    if (!textarea) return;

    showToast('Đang trích xuất nội dung file...', 'info');
    var ext = file.name.split('.').pop().toLowerCase();

    try {
        if (['docx', 'docm', 'dotx', 'dotm'].includes(ext)) {
            await loadMammoth();
            var arrayBuffer = await file.arrayBuffer();
            var result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            textarea.value = result.value || '';
            showToast('Đã trích xuất văn bản từ file Word!', 'success');
        } else if (['doc', 'dot'].includes(ext)) {
            await loadMammoth();
            var arrayBuffer = await file.arrayBuffer();
            try {
                var result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                if (result.value && result.value.trim().length > 0) {
                    textarea.value = result.value;
                } else {
                    throw new Error('Fallback sang bộ đọc chuỗi thô');
                }
            } catch (mErr) {
                var text = await file.text();
                var cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                textarea.value = cleanText;
            }
            showToast('Đã trích xuất nội dung file .doc!', 'success');
        } else if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'ods'].includes(ext)) {
            await loadXlsxLib();
            var arrayBuffer = await file.arrayBuffer();
            var workbook = XLSX.read(arrayBuffer, { type: 'array' });
            var extractedText = [];

            workbook.SheetNames.forEach(function (sheetName) {
                var worksheet = workbook.Sheets[sheetName];
                var json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                json.forEach(function (row) {
                    if (row && row.length > 0) {
                        extractedText.push(row.join('\t'));
                    }
                });
            });

            textarea.value = extractedText.join('\n');
            showToast('Đã trích xuất dữ liệu từ file Excel!', 'success');
        } else if (['txt', 'rtf', 'log'].includes(ext)) {
            var text = await file.text();
            textarea.value = text;
            showToast('Đã nạp file văn bản!', 'success');
        } else {
            showToast('Định dạng file không được hỗ trợ!', 'error');
        }
    } catch (err) {
        console.error("Lỗi đọc file:", err);
        showToast('Không thể đọc file: ' + (err.message || 'Lỗi không xác định'), 'error');
    }
}

function processSpellCheck() {
    var textarea = document.getElementById('spellInputText');
    var val = textarea?.value.trim();
    var resultBox = document.getElementById('spellCheckResults');

    if (!val) {
        showToast('Vui lòng dán văn bản hoặc tải file Word/Excel lên!', 'error');
        return;
    }

    showToast('Đang phân tích cú pháp & chính tả...', 'info');

    var issues = [];
    var countMultipleSpaces = (val.match(/ {2,}/g) || []).length;
    var countPunctuationSpaces = (val.match(/ \b[,.:;?!]/g) || []).length;

    if (countMultipleSpaces > 0) {
        issues.push('Phát hiện <strong>' + countMultipleSpaces + ' vị trí</strong> bị lặp khoảng trắng (thừa dấu cách).');
    }
    if (countPunctuationSpaces > 0) {
        issues.push('Phát hiện <strong>' + countPunctuationSpaces + ' vị trí</strong> đặt khoảng trắng trước dấu câu (ví dụ: "văn bản ,").');
    }

    var unaccentedMatches = val.match(/\b(Cong hoa|Xa hoi|Doc lap|Tu do|Hanh phuc|Nghi đinh|Quyet đinh|Thong bao|Bao cao)\b/gi);
    if (unaccentedMatches && unaccentedMatches.length > 0) {
        issues.push('Phát hiện <strong>' + unaccentedMatches.length + ' từ</strong> thiếu/sai dấu tiếng Việt (VD: ' + unaccentedMatches.slice(0, 3).join(', ') + ').');
    }

    var issueHtml = '';
    if (issues.length > 0) {
        issueHtml = issues.map(function (item) { return '<li class="text-amber-700 dark:text-amber-400"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>' + item + '</li>'; }).join('');
    } else {
        issueHtml = '<li class="text-emerald-600 dark:text-emerald-400 font-semibold"><i class="fa-solid fa-circle-check mr-1.5"></i> Văn bản đạt chuẩn! Không phát hiện lỗi chính tả hoặc thể thức nghiêm trọng.</li>';
    }

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = 
        '<div class="font-bold text-slate-900 dark:text-white mb-2 text-sm flex items-center gap-2">' +
            '<i class="fa-solid fa-magnifying-glass-chart text-purple-600"></i> Kết Quả Phân Tích Dữ Liệu:' +
        '</div>' +
        '<ul class="space-y-2 text-xs leading-relaxed mb-4">' + issueHtml + '</ul>' +
        '<button onclick="autoFixSpellInput()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95">' +
            '<i class="fa-solid fa-wand-magic-sparkles"></i> Tự Động Sửa Nhanh & Căn Chỉnh Khoảng Trắng' +
        '</button>';

    showToast('Hoàn tất soát lỗi chính tả!', 'success');
}

function autoFixSpellInput() {
    var textarea = document.getElementById('spellInputText');
    if (!textarea || !textarea.value) return;

    var fixed = fixVietnameseSpellingText(textarea.value);
    textarea.value = reconstructParagraphs(fixed);
    showToast('Đã tự động sửa lỗi & căn chỉnh văn bản!', 'success');
}

// ==================== CÔNG CỤ LÀM SẠCH CHỮ PDF ====================
function switchCleanTab(mode) {
    var fileArea = document.getElementById('cleanFileArea');
    var textArea = document.getElementById('cleanTextArea');
    var fileBtn = document.getElementById('cleanTabFileBtn');
    var textBtn = document.getElementById('cleanTabTextBtn');

    if (mode === 'file') {
        fileArea?.classList.remove('hidden');
        textArea?.classList.add('hidden');
        fileBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 text-white shadow';
        textBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    } else {
        fileArea?.classList.add('hidden');
        textArea?.classList.remove('hidden');
        textBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 text-white shadow';
        fileBtn.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
}

function smartCleanText(rawText) {
    if (!rawText) return "";

    var text = rawText.normalize('NFC');

    text = text.replace(/(\w+)[-\u2013\u2014]\s*\n\s*(\w+)/g, '$1$2');
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\n\s*\n/g, '___PARAGRAPH_BREAK___');
    text = text.replace(/\n/g, ' ');
    text = text.replace(/___PARAGRAPH_BREAK___/g, '\n\n');

    text = text.replace(/\s+([.,;:!?])/g, '$1');
    text = text.replace(/([.,;:!?])(?=[^\d\s.,;:!?])/g, '$1 ');

    text = text.replace(/[ \t]+/g, ' ');
    text = text.split('\n').map(function (line) { return line.trim(); }).join('\n');

    return text.trim();
}

async function handlePdfCleanFileSelect(e) {
    var file = e.target.files[0];
    if (!file) return;

    var fileNameEl = document.getElementById('pdfCleanFileName');
    var outputEl = document.getElementById('pdfCleanOutput');
    var resultBox = document.getElementById('pdfCleanResultBox');

    if (fileNameEl) {
        fileNameEl.innerText = '📄 Đã chọn: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
        fileNameEl.classList.remove('hidden');
    }

    showToast('Đang đọc & tự động làm sạch file PDF...', 'info');

    try {
        await loadPdfJs();
        var arrayBuffer = await file.arrayBuffer();
        var pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        var numPages = pdfDoc.numPages;
        var fullRawText = "";

        for (var pageNum = 1; pageNum <= numPages; pageNum++) {
            var page = await pdfDoc.getPage(pageNum);
            var textContent = await page.getTextContent();
            var pageStrings = textContent.items.map(function (item) { return item.str; });
            fullRawText += pageStrings.join('\n') + '\n\n';
        }

        var cleanedText = smartCleanText(fullRawText);

        if (outputEl) outputEl.value = cleanedText || "Không tìm thấy nội dung văn bản trong file PDF.";
        resultBox?.classList.remove('hidden');
        showToast('Đã làm sạch toàn bộ chữ trong PDF thành công!', 'success');

    } catch (err) {
        console.error("Lỗi làm sạch PDF:", err);
        showToast('Lỗi khi đọc file PDF!', 'error');
    }
}

function processCleanPdfTextFromInput() {
    var inputEl = document.getElementById('pdfCleanInput');
    var outputEl = document.getElementById('pdfCleanOutput');
    var resultBox = document.getElementById('pdfCleanResultBox');

    var text = inputEl?.value;
    if (!text || !text.trim()) {
        showToast('Vui lòng dán đoạn văn cần làm sạch!', 'error');
        return;
    }

    var cleanedText = smartCleanText(text);
    if (outputEl) outputEl.value = cleanedText;
    resultBox?.classList.remove('hidden');
    showToast('Đã làm sạch đoạn văn thành công!', 'success');
}

function exportCleanPdfToWord() {
    var outputEl = document.getElementById('pdfCleanOutput');
    var text = outputEl?.value;

    if (!text || !text.trim()) {
        showToast('Chưa có nội dung văn bản để xuất Word!', 'error');
        return;
    }

    var paragraphs = text.split('\n\n').map(function (p) {
        return "<p style='margin:8px 0; text-align:justify; font-size:13pt; line-height:1.5; font-family:\"Times New Roman\", serif;'>" + escapeHtml(p).replace(/\n/g, '<br>') + "</p>";
    }).join('');

    var wordDoc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><title>Van Ban Da Lam Sach</title></head>' +
        '<body style="font-family:\'Times New Roman\', serif;">' + paragraphs + '</body></html>';

    var blob = new Blob(['\ufeff' + wordDoc], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Van_Ban_Lam_Sach_' + Date.now() + '.doc';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

    showToast('Đã xuất file Word (.doc) thành công!', 'success');
}

function copyCleanPdfText() {
    var outputEl = document.getElementById('pdfCleanOutput');
    if (outputEl && outputEl.value) {
        navigator.clipboard.writeText(outputEl.value);
        showToast('Đã sao chép văn bản đã làm sạch!', 'success');
    }
}

function resetCleanPdfText() {
    var inputEl = document.getElementById('pdfCleanInput');
    var outputEl = document.getElementById('pdfCleanOutput');
    if (inputEl) inputEl.value = '';
    if (outputEl) outputEl.value = '';
    document.getElementById('pdfCleanResultBox')?.classList.add('hidden');
    document.getElementById('pdfCleanFileName')?.classList.add('hidden');
    showToast('Đã xóa nội dung', 'info');
}

// ==================== HÀM TIỆN ÍCH KHÁC ====================
function toggleFavorite(id, e) {
    if (e) e.stopPropagation();
    var idx = favorites.indexOf(id);
    if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('Đã xóa khỏi danh sách yêu thích!');
    } else {
        favorites.push(id);
        showToast('Đã thêm vào danh sách yêu thích!', 'success');
    }
    localStorage.setItem('mth_favorites', JSON.stringify(favorites));
    updateFavCount();
    filterProducts();
}

function updateFavCount() {
    var el = document.getElementById('favCount');
    if (el) el.innerText = favorites.length;
}

function openDownloadModal(id) {
    var item = allProducts.find(function (p) { return p.id === id; });
    if (!item) return;

    // Kiểm tra mã PIN bảo vệ với phần mềm nội bộ (nếu có)
    if (item.pinCode) {
        var inputPin = prompt("🔒 Đây là phần mềm lưu hành nội bộ. Vui lòng nhập mã PIN xác thực:");
        if (inputPin !== item.pinCode) {
            showToast('Mã PIN không chính xác! Không thể tải tệp nội bộ.', 'error');
            return;
        }
        showToast('Xác thực mã PIN thành công!', 'success');
    }

    if (document.getElementById('modalTitle')) document.getElementById('modalTitle').innerText = item.title || '';
    if (document.getElementById('modalDesc')) document.getElementById('modalDesc').innerText = item.desc || '';
    if (document.getElementById('modalType')) document.getElementById('modalType').innerText = (item.fileType || '.ZIP') + (item.fileSize ? ' (' + item.fileSize + ')' : '');
    if (document.getElementById('modalCouponCode')) document.getElementById('modalCouponCode').innerText = item.coupon || 'MEOTINHOC2026';
    if (document.getElementById('modalChangelog')) document.getElementById('modalChangelog').innerText = item.changelog || 'Phiên bản chuẩn mới nhất';
    
    var downloadBtn = document.getElementById('modalDownloadBtn');
    if (downloadBtn) downloadBtn.href = item.downloadUrl || '#';

    document.getElementById('downloadModal')?.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('downloadModal')?.classList.add('hidden');
}

function triggerDownloadNotification() {
    showToast('Bắt đầu tải tệp về máy...', 'success');
    closeModal();
}

function toggleRegisterModal() {
    var modal = document.getElementById('registerModal');
    if (modal) modal.classList.toggle('hidden');
}

// ==================== TRỢ LÝ AI TIN HỌC THÔNG MINH ====================
function toggleAiModal() {
    var popup = document.getElementById('aiChatPopup');
    if (popup) popup.classList.toggle('hidden');
}

function sendQuickQuestion(text) {
    var input = document.getElementById('aiChatInput');
    if (input) input.value = text;
    handleAiChatSubmit();
}

function handleAiChatSubmit(e) {
    if (e) e.preventDefault();
    var input = document.getElementById('aiChatInput');
    var body = document.getElementById('aiChatBody');
    if (!input || !body) return;

    var userMsg = input.value.trim();
    if (!userMsg) return;

    var userBubble = document.createElement('div');
    userBubble.className = 'flex justify-end';
    userBubble.innerHTML = '<div class="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm leading-relaxed">' + escapeHtml(userMsg) + '</div>';
    body.appendChild(userBubble);
    input.value = '';
    body.scrollTop = body.scrollHeight;

    var aiTyping = document.createElement('div');
    aiTyping.className = 'flex gap-2.5 items-start ai-typing-indicator';
    aiTyping.innerHTML = '<div class="bg-slate-800/90 border border-slate-700/60 text-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5"><span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span><span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></span></div>';
    body.appendChild(aiTyping);
    body.scrollTop = body.scrollHeight;

    setTimeout(function () {
        aiTyping.remove();
        var replyText = generateAiAnswer(userMsg);
        var aiBubble = document.createElement('div');
        aiBubble.className = 'flex gap-2.5 items-start';
        aiBubble.innerHTML = '<div class="bg-slate-800/90 border border-slate-700/60 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[88%] shadow-sm leading-relaxed">' + replyText + '</div>';
        body.appendChild(aiBubble);
        body.scrollTop = body.scrollHeight;
    }, 700);
}

function generateAiAnswer(prompt) {
    var query = removeVietnameseTones(prompt);

    if (query.includes('font') || query.includes('phong') || query.includes('tcvn3') || query.includes('vni')) {
        return 'Để sửa lỗi Font chữ TCVN3 / VNI-Times bị lỗi ô vuông trong Word:<br>1. Bấm <strong>Ctrl + A</strong> copy toàn bộ văn bản.<br>2. Bấm <strong>Ctrl + Shift + F6</strong> mở Unikey Chuyển Mã.<br>3. Chọn Mã nguồn là <strong>TCVN3(ABC)</strong>, Mã đích là <strong>Unicode</strong> rồi bấm <strong>Chuyển mã</strong>.<br>4. Dán lại vào Word là hoàn tất!';
    }
    if (query.includes('excel') || query.includes('vlookup') || query.includes('xlookup') || query.includes('ham')) {
        return 'Mẹo dùng hàm tìm kiếm trong Excel:<br>- Với phiên bản Office mới, bạn nên ưu tiên dùng <strong>XLOOKUP</strong> vì nó tìm ngược được và không cần đếm số cột.<br>- Cú pháp: <code>=XLOOKUP(giá_trị_tìm, cột_tìm, cột_kết_quả)</code>.';
    }
    if (query.includes('pdf') || query.includes('ghep') || query.includes('xoa')) {
        return 'Bạn có thể sử dụng trực tiếp các công cụ PDF trực tuyến của <strong>Mẹo Tin Học</strong> ở thanh menu trên đầu trang: Ghép file PDF, Xóa trang PDF thừa hoặc Làm sạch văn bản hoàn toàn miễn phí & an toàn 100%.';
    }
    if (query.includes('noi bo') || query.includes('pin') || query.includes('mat khau')) {
        return 'Các phần mềm nội bộ yêu cầu mã PIN xác thực khi tải. Bạn vui lòng liên hệ Ban Biên Tập/Admin để lấy mã PIN truy cập các công cụ này.';
    }
    if (query.includes('in') || query.includes('may in') || query.includes('canon') || query.includes('driver')) {
        return 'Để cài đặt driver máy in Canon / Fuji Xerox nhanh nhất:<br>1. Tải đúng bản Driver tương thích với Windows (32bit hoặc 64bit).<br>2. Mở <strong>Device Manager</strong> -> Chọn máy in và cập nhật thủ công nếu gặp lỗi cài tự động.';
    }
    if (query.includes('phim tat') || query.includes('chup man hinh')) {
        return 'Phím tắt thông dụng hữu ích:<br>- Chụp ảnh màn hình khoanh vùng: <strong>Windows + Shift + S</strong>.<br>- Khóa màn hình nhanh: <strong>Windows + L</strong>.<br>- Mở lại tab vừa đóng trên trình duyệt: <strong>Ctrl + Shift + T</strong>.';
    }
    return 'Cảm ơn bạn đã đặt câu hỏi! Câu hỏi của bạn về <strong>"' + escapeHtml(prompt) + '"</strong> đã được hệ thống ghi nhận. Admin sẽ tiếp tục cập nhật bài viết thủ thuật chi tiết về chủ đề này trên website meotinhoc.com.';
}
