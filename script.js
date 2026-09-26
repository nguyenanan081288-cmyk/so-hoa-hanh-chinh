// ==================== KHỞI TẠO BIẾN CẤU HÌNH GLOBAL ====================
var allProducts = [];
var currentCategoryFilter = 'tất cả';
var showingOnlyFavorites = false;
var favorites = [];
try {
    favorites = JSON.parse(localStorage.getItem('shhc_favorites') || '[]');
} catch (e) {
    favorites = [];
}
var selectedMergeFiles = [];
var selectedDeleteFile = null;

// ==================== TẢI THƯ VIỆN CẦN THIẾT (CDN) ====================
function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        script.onload = resolve;
        script.onerror = function () { reject('Không thể tải thư viện PDF-LIB'); };
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

// ==================== KHI TRANG LÊN NỀN ====================
document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    initTheme();
    updateFavCount();

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
});

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

    var countSoftware = allProducts.filter(function (p) { return (p.category || '').toLowerCase().includes('phần mềm'); }).length;
    var countExcel = allProducts.filter(function (p) { return (p.category || '').toLowerCase().includes('tiện ích excel/word'); }).length;
    var countDocs = allProducts.filter(function (p) { return (p.category || '').toLowerCase().includes('mẫu biểu'); }).length;

    if (document.getElementById('countSoftware')) document.getElementById('countSoftware').innerText = countSoftware;
    if (document.getElementById('countExcel')) document.getElementById('countExcel').innerText = countExcel;
    if (document.getElementById('countDocs')) document.getElementById('countDocs').innerText = countDocs;
}

// ==================== BỘ LỌC VÀ HIỂN THỊ SẢN PHẨM ====================
function filterProducts() {
    var keyword = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    var filtered = allProducts.filter(function (item) {
        var itemTitle = (item.title || '').toLowerCase();
        var itemDesc = (item.desc || '').toLowerCase();
        var itemCat = (item.category || '').toLowerCase();

        var matchesKeyword = !keyword || itemTitle.includes(keyword) || itemDesc.includes(keyword);
        var matchesCategory = (currentCategoryFilter === 'tất cả') || itemCat.includes(currentCategoryFilter);
        var matchesFav = !showingOnlyFavorites || favorites.includes(item.id);
        return matchesKeyword && matchesCategory && matchesFav;
    });

    renderProducts(filtered);
}

function setCategoryFilter(category, btnElement) {
    currentCategoryFilter = category;
    showingOnlyFavorites = false;

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.className = 'filter-btn px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap';
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
        var card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:-translate-y-1 relative';

        var buttonHTML = '';
        if (item.isOnlineTool) {
            buttonHTML = '<button onclick="openOnlineToolModal(\'' + (item.toolType || '') + '\')" class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"><i class="fa-solid fa-circle-play"></i> Mở Công Cụ Trực Tuyến</button>';
        } else if (item.isArticle) {
            buttonHTML = '<a href="' + (item.articleUrl || '#') + '" class="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"><i class="fa-solid fa-book-open"></i> Đọc Bài Viết</a>';
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
            '<span class="text-[10px] font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 block mb-1">' + (item.category || '') + '</span>' +
            '<h3 class="font-extrabold text-base text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">' + (item.title || '') + '</h3>' +
            '<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">' + (item.desc || '') + '</p>' +
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
    } else if (toolType === 'ocr-online') {
        if (titleEl) titleEl.innerText = 'Quét & Nhận Diện Chữ OCR Tiếng Việt';
        if (subEl) subEl.innerText = 'Trích xuất chữ từ ảnh chụp hoặc PDF scan sang văn bản Word/Excel';
        if (iconEl) iconEl.className = 'fa-solid fa-bolt text-2xl text-teal-600';
        document.getElementById('ocrOnlineUI')?.classList.remove('hidden');
    } else if (toolType === 'spell-online') {
        if (titleEl) titleEl.innerText = 'Soát Lỗi Chính Tả & Văn Phong Hành Chính';
        if (subEl) subEl.innerText = 'Soát lỗi từ ngữ và căn chỉnh dấu câu chuẩn Nghị định 30';
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
    selectedMergeFiles = selectedMergeFiles.concat(files);

    var listEl = document.getElementById('pdfFileList');
    if (listEl) {
        listEl.innerHTML = selectedMergeFiles.map(function (f, i) {
            return '<li class="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">' +
                '<span class="truncate font-semibold text-slate-700 dark:text-slate-300">' + (i + 1) + '. ' + f.name + ' (' + (f.size / 1024 / 1024).toFixed(2) + ' MB)</span>' +
                '<button onclick="removePdfFile(' + i + ')" class="text-red-500 font-bold px-2">Xóa</button>' +
                '</li>';
        }).join('');
    }
}

function removePdfFile(index) {
    selectedMergeFiles.splice(index, 1);
    var event = { target: { files: [] } };
    handlePdfSelect(event);
}

async function processPdfMerge() {
    if (selectedMergeFiles.length < 2) {
        showToast('Vui lòng chọn ít nhất 2 file PDF để ghép!', 'error');
        return;
    }

    showToast('Đang tiến hành ghép PDF...', 'info');

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
        a.download = 'Da_Ghep_' + Date.now() + '.pdf';
        a.click();

        showToast('Ghép PDF thành công! Đã bắt đầu tải về.', 'success');
        closeOnlineToolModal();
    } catch (err) {
        console.error(err);
        showToast('Lỗi ghép PDF!', 'error');
    }
}

// --- 2. XÓA TRANG PDF ---
function handlePdfDeleteSelect(e) {
    var file = e.target.files[0];
    if (!file) return;
    selectedDeleteFile = file;

    document.getElementById('pdfDeleteFileName').innerText = 'Tệp đã chọn: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
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

    showToast('Đang tiến hành xóa trang...', 'info');

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
                if (range[0] && range[1]) {
                    for (var i = range[0]; i <= range[1]; i++) {
                        if (i >= 1 && i <= totalPages) pagesToDelete.add(i - 1);
                    }
                }
            } else {
                var pageNum = Number(p);
                if (pageNum >= 1 && pageNum <= totalPages) pagesToDelete.add(pageNum - 1);
            }
        });

        if (pagesToDelete.size === 0) {
            showToast('Số trang cần xóa không hợp lệ!', 'error');
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
        a.download = 'Da_Xoa_Trang_' + Date.now() + '.pdf';
        a.click();

        showToast('Xóa trang PDF thành công!', 'success');
        closeOnlineToolModal();
    } catch (err) {
        console.error(err);
        showToast('Lỗi xử lý xóa trang PDF!', 'error');
    }
}

// ==================== 3. THUẬT TOÁN OCR HÓA ĐƠN & BẢNG KẺ CHUẨN XÁC ====================

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
        [/\bBan hanh\b/gi, 'Ban hành']
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
        showToast('Trích xuất & bảo toàn cấu trúc hóa đơn/bảng thành công!', 'success');

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
                return "<td style='padding:6px 8px; border:1px solid #000; vertical-align:top; font-size:12pt;" + (idx === 0 ? " text-align:center;" : "") + "'>" + c.trim() + "</td>";
            }).join('');
            htmlContent += '<tr>' + cols + '</tr>';
        } else {
            if (inTable) {
                htmlContent += "</table>";
                inTable = false;
            }
            if (line.trim()) {
                htmlContent += "<p style='margin:6px 0; text-align:justify; font-size:13pt;'>" + line.trim() + "</p>";
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
    URL.revokeObjectURL(url);

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

// ==================== 4. SOÁT LỖI CHÍNH TẢ & ĐỌC FILE TẢI LÊN (WORD/EXCEL/TEXT) ====================

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
        // 1. Nhóm file Word hiện đại (.docx, .docm, .dotx, .dotm)
        if (['docx', 'docm', 'dotx', 'dotm'].includes(ext)) {
            await loadMammoth();
            var arrayBuffer = await file.arrayBuffer();
            var result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            textarea.value = result.value || '';
            showToast('Đã trích xuất văn bản từ file Word!', 'success');
        } 
        // 2. Nhóm file Word cũ (.doc, .dot)
        else if (['doc', 'dot'].includes(ext)) {
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
        }
        // 3. Nhóm file Bảng tính Excel (.xlsx, .xls, .xlsm, .xlsb, .csv, .ods)
        else if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'ods'].includes(ext)) {
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
        } 
        // 4. Nhóm file văn bản thuần (.txt, .rtf, .log)
        else if (['txt', 'rtf', 'log'].includes(ext)) {
            var text = await file.text();
            textarea.value = text;
            showToast('Đã nạp file văn bản!', 'success');
        } 
        else {
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
        issues.push('Phát hiện <strong>' + unaccentedMatches.length + ' từ</strong> bị sai/thiếu dấu hành chính (VD: ' + unaccentedMatches.slice(0, 3).join(', ') + ').');
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
    localStorage.setItem('shhc_favorites', JSON.stringify(favorites));
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

    document.getElementById('modalTitle').innerText = item.title || '';
    document.getElementById('modalDesc').innerText = item.desc || '';
    document.getElementById('modalType').innerText = item.fileType || '.ZIP';
    document.getElementById('modalCouponCode').innerText = item.coupon || 'SOHOA2026';
    document.getElementById('modalChangelog').innerText = item.changelog || 'Phiên bản chuẩn mới nhất';
    document.getElementById('modalDownloadBtn').href = item.downloadUrl || '#';

    document.getElementById('downloadModal')?.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('downloadModal')?.classList.add('hidden');
}

function triggerDownloadNotification() {
    showToast('Bắt đầu tải tệp về máy...', 'success');
    closeModal();
}

// ==================== CỬA SỔ AI & DI ĐỘNG ====================
function toggleAiModal() {
    document.getElementById('aiChatPopup')?.classList.toggle('hidden');
}

function sendQuickQuestion(text) {
    var input = document.getElementById('aiChatInput');
    if (input) {
        input.value = text;
        handleAiChatSubmit(new Event('submit'));
    }
}

function handleAiChatSubmit(e) {
    e.preventDefault();
    var input = document.getElementById('aiChatInput');
    var body = document.getElementById('aiChatBody');

    if (!input || !input.value.trim()) return;

    var userText = input.value.trim();

    var userMsg = document.createElement('div');
    userMsg.className = 'flex justify-end';
    userMsg.innerHTML = '<div class="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed">' + userText + '</div>';
    body.appendChild(userMsg);

    input.value = '';
    body.scrollTop = body.scrollHeight;

    setTimeout(function () {
        var aiMsg = document.createElement('div');
        aiMsg.className = 'flex gap-2.5 items-start';
        aiMsg.innerHTML = '<div class="bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[88%] leading-relaxed">Dựa trên <strong>Nghị định 30/2020/NĐ-CP</strong>, quy định chuẩn được thực hiện như sau: Khổ giấy A4, căn lề trên/dưới 20-25mm, lề trái 30-35mm, lề phải 15-20mm.</div>';
        body.appendChild(aiMsg);
        body.scrollTop = body.scrollHeight;
    }, 800);
}

function toggleMobileMenu() {
    document.getElementById('mobileMenu')?.classList.toggle('hidden');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu')?.classList.add('hidden');
}

function toggleRegisterModal() {
    document.getElementById('registerModal')?.classList.toggle('hidden');
}

function handleGoogleRegister() {
    showToast('Đang kết nối tài khoản Google...', 'info');
    setTimeout(function () {
        showToast('Đăng ký tài khoản thành công!', 'success');
        toggleRegisterModal();
    }, 1200);
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        var themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun text-amber-400';
    } else {
        document.documentElement.classList.remove('dark');
        var themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon text-amber-400';
    }
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        var themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon text-amber-400';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        var themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun text-amber-400';
    }
}

function showToast(message, type) {
    if (!type) type = 'success';
    var toast = document.getElementById('toast');
    var toastMsg = document.getElementById('toastMessage');
    var toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastMsg) return;

    toastMsg.innerText = message;

    if (type === 'error') {
        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-xmark text-red-400 text-lg';
    } else if (type === 'info') {
        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-info text-blue-400 text-lg';
    } else {
        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-lg';
    }

    toast.classList.remove('toast-enter');
    toast.classList.add('toast-show');

    setTimeout(function () {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-enter');
    }, 3000);
}