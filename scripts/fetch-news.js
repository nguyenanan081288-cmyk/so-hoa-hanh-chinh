import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const parser = new Parser();

// Danh sách các nguồn báo chính thống
const RSS_FEEDS = [
  { name: 'Chính phủ - Chuyển đổi số', url: 'https://baochinhphu.vn/rss/chuyen-doi-so.rss' },
  { name: 'Chính phủ - Tin chung', url: 'https://baochinhphu.vn/rss/home.rss' },
  { name: 'Báo Lao Động - Xã hội', url: 'https://laodong.vn/rss/xa-hoi.rss' }
];

// Bộ từ khóa lọc bài viết đa dạng chủ đề hành chính, chính sách & công nghệ
const KEYWORDS = [
  'chuyển đổi số', 'số hóa', 'đề án 06', 'chính phủ điện tử', 'dịch vụ công', 
  'hành chính công', 'căn cước công dân', 'cải cách hành chính', 'chế độ chính sách', 
  'cán bộ', 'công chức', 'viên chức', 'nghỉ lễ', 'tiền lương', 'bảo hiểm xã hội', 
  'công nghệ', 'quản lý', 'văn phòng', 'lao động', 'quy định'
];

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function run() {
  console.log('🚀 Bắt đầu quét tin tức tự động...');

  const dataPath = path.join(process.cwd(), 'data.json');
  let currentProducts = [];
  
  if (fs.existsSync(dataPath)) {
    currentProducts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  let newArticlesAdded = 0;

  for (const feedConfig of RSS_FEEDS) {
    try {
      console.log(`📡 Đang kiểm tra nguồn: ${feedConfig.name}`);
      const feed = await parser.parseURL(feedConfig.url);

      for (const item of feed.items) {
        const title = item.title || '';
        const contentSnippet = item.contentSnippet || item.summary || '';
        const fullText = (title + ' ' + contentSnippet).toLowerCase();

        const hasKeyword = KEYWORDS.some(kw => fullText.includes(kw));
        if (!hasKeyword) continue;

        const slug = createSlug(title);
        const articleId = `bv-${slug.substring(0, 30)}`;
        const fileName = `bai-viet-${slug.substring(0, 40)}.html`;

        const isExisted = currentProducts.some(p => p.id === articleId || p.articleUrl === fileName);
        if (isExisted) continue;

        console.log(`✨ Phát hiện bài viết mới: "${title}"`);

        const prompt = `
Hãy đóng vai Biên tập viên chuyên môn của trang web "Số Hóa Hành Chính".
Viết lại một bài viết phân tích, tổng hợp tin tức dựa trên thông tin sau:
- Tiêu đề gốc: ${title}
- Nội dung tóm tắt gốc: ${contentSnippet}
- Nguồn gốc: ${item.link} (Nguồn: ${feedConfig.name})

Yêu cầu đầu ra dạng JSON đúng cấu trúc sau (không kèm markdown format ngoài JSON):
{
  "sapo": "Đoạn Sapo thu hút ngắn gọn 2-3 câu",
  "htmlBody": "Nội dung chi tiết bài viết khoảng 3-4 đoạn văn chuẩn HTML (sử dụng các thẻ h2, p, ul, li, blockquote). Đưa ra các nhận định về tầm quan trọng của chủ đề đối với công tác hành chính, cán bộ công chức hoặc ứng dụng công nghệ trong quản lý.",
  "sourceUrl": "${item.link}"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const aiOutput = JSON.parse(response.text);
        const fullArticleHtml = generateArticleHtmlPage(title, aiOutput.sapo, aiOutput.htmlBody, aiOutput.sourceUrl, feedConfig.name, fileName);

        fs.writeFileSync(path.join(process.cwd(), fileName), fullArticleHtml, 'utf-8');

        currentProducts.unshift({
          id: articleId,
          title: title,
          desc: aiOutput.sapo,
          category: 'Mẫu biểu chuẩn',
          icon: 'fa-newspaper',
          isArticle: true,
          articleUrl: fileName
        });

        newArticlesAdded++;
        if (newArticlesAdded >= 2) break;
      }
    } catch (err) {
      console.error(`❌ Lỗi khi đọc feed ${feedConfig.name}:`, err.message);
    }

    if (newArticlesAdded >= 2) break;
  }

  if (newArticlesAdded > 0) {
    fs.writeFileSync(dataPath, JSON.stringify(currentProducts, null, 2), 'utf-8');
    console.log(`🎉 Đã bổ sung thành công ${newArticlesAdded} bài viết mới vào data.json!`);
  } else {
    console.log('ℹ️ Không có bài viết mới nào cần cập nhật.');
  }
}

function generateArticleHtmlPage(title, sapo, htmlBody, sourceUrl, sourceName, fileName) {
  return `<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Số Hóa Hành Chính</title>
    <meta name="description" content="${sapo}">
    <link rel="canonical" href="https://sohoahanhchinh.vn/${fileName}">
    <meta name="theme-color" content="#0f172a">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { fontFamily: { sans: ['"Be Vietnam Pro"', 'sans-serif'] } } } }
    </script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased">
    <header class="bg-slate-900/90 backdrop-blur-xl text-white shadow-lg sticky top-0 z-40 border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 lg:px-6 py-3.5 flex justify-between items-center">
            <a href="/" class="flex items-center space-x-3 group">
                <div class="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <i class="fa-solid fa-file-invoice text-xl"></i>
                </div>
                <div>
                    <span class="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-tight">SỐ HÓA HÀNH CHÍNH</span>
                    <span class="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block">Giải pháp & Tiện ích văn phòng</span>
                </div>
            </a>
            <nav class="hidden md:flex space-x-2 text-sm font-medium">
                <a href="/" class="px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition">Trang chủ</a>
                <a href="index.html#cong-cu-truc-tuyen" class="px-3 py-2 rounded-xl text-amber-400 font-bold hover:bg-amber-500/10 transition"><i class="fa-solid fa-bolt mr-1"></i> Tiện Ích Online</a>
            </nav>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <nav class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
            <a href="/" class="hover:text-blue-600">Trang chủ</a>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
            <span class="text-slate-800 dark:text-slate-200 font-semibold truncate">Tin tức Hành chính</span>
        </nav>

        <article class="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
            <header class="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <span class="bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-black px-3 py-1 rounded-full uppercase">Tổng hợp Tin tức</span>
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">${title}</h1>
                <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span><i class="fa-solid fa-building-columns mr-1 text-blue-500"></i> Nguồn: ${sourceName}</span>
                    <span><i class="fa-solid fa-clock mr-1 text-emerald-500"></i> Nguồn tin chính thống</span>
                </div>
            </header>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-l-4 border-blue-600 text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed">
                ${sapo}
            </div>

            <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                ${htmlBody}
            </div>

            <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Tham khảo thông tin bài viết gốc tại: <strong>${sourceName}</strong></span>
                <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-bold hover:underline">Xem bài gốc &rarr;</a>
            </div>
        </article>
    </main>

    <footer class="bg-slate-950 text-slate-400 py-8 text-center text-xs border-t border-slate-800">
        © 2026 Số Hóa Hành Chính. Thông tin tổng hợp tự động từ Cổng TTĐT Chính phủ & Báo chí chính thống.
    </footer>
</body>
</html>`;
}

run();
