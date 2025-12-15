/**
 * ===================================================================
 * generateWebsite.js - 內容生成與網站調度 (最終修化版 - 整合 LOGO 副標題)
 * ===================================================================
 */

const fs = require('fs').promises;
const path = require('path');

// ===================================================================
// 【A. 配置數據】
// ===================================================================
// generateWebsite.js (節錄)

// --- 所有網站分類的設定 ---
const categories = {
    // 列表頁和詳細頁 H2 隨頁標題將顯示 'CoNeCoLin&NekoIcchou：Works'
    'works': { title: 'CoNeCoLin&NekoIcchou：Works', dir: 'works' }, 
    
    // 列表頁和詳細頁 H2 隨頁標題將顯示 'CoNeCoLin&NekoIcchou：Articles'
    'articles': { title: 'CoNeCoLin&NekoIcchou：Articles', dir: 'articles' }, 
    
    // 列表頁和詳細頁 H2 隨頁標題將顯示 'CoNeCoLin&NekoIcchou：CosProps'
    'cos': { title: 'CoNeCoLin&NekoIcchou：CosProps', dir: 'cos' }, 
    
    // 列表頁和詳細頁 H2 隨頁標題將顯示 'CoNeCoLin&NekoIcchou：Videos'
    'video': { title: 'CoNeCoLin&NekoIcchou：Videos', dir: 'video' }, 
    
    // 列表頁和詳細頁 H2 隨頁標題將顯示 'CoNeCoLin&NekoIcchou：Life'
    'daily': { title: 'CoNeCoLin&NekoIcchou：Life', dir: 'daily' },
};

// ... 後續程式碼不變 ...

const ALLOWED_MEDIA_EXTENSIONS = ['.mp4', '.jpg', '.png', '.jpeg', '.webp'];

// --- 主頁的預設內容 (可在此處修改 index.html 內容) ---
const indexContent = `
<div class="welcome-text">
    <h3>歡迎來到子貓玲/CoNeCoLin的官方網站!</h3>
    <p>請從上方的導航列選擇您感興趣的分類，探索我的作品與創作歷程。</p>
</div>
`;

// --- 關於我們頁面的預設內容 (已使用您提供的專業介紹) ---
const aboutUsContent = `
<div class="welcome-text article-content" style="max-width: 850px; text-align: left; padding: 0 10px;">
    <h3>🎨 關於 子貓玲 / CoNeCoLin 🎨</h3>
    
    <p>
        工作室接案經驗已**超過 25 年**，我們的專業領域廣泛且深入，從早期傳統的藝術創作，到現代多媒體設計，我們一路走來：
    </p>
    
    <ul>
        <li>**視覺藝術：** 漫畫、電玩封面、遊戲圖、教科書插畫、油畫人像。</li>
        <li>**空間與工藝：** 造景設計（五行風水）、立體壁畫、工筆佛畫。</li>
        <li>**多元創作：** Cosplay 道具製作等。</li>
    </ul>

    <p>
        我們是被殘酷的生活狀況推著走的創作者們，曾經的時間都在線上了，我們多元、並且必須專業，嚴格的標準是對待自己，向來如此的。因此，我們才會對未來繼續懷有夢想和對人能有慷慨的笑容。
    </p>

    <blockquote style="margin-top: 30px; padding: 15px; border-left: 5px solid #000; background-color: #f0f0f0;">
        (謝謝工作室創立以來共同努力、但中途病逝陣亡的隊友俊吾，我們會一直想念你。一起修復的工作室牆壁讓我紀念過往的日子，直到我們在天相聚那天。)
    </blockquote>
</div>
`;

// ===================================================================
// 【B. 數據解析與 C 區塊內容生成】
// ===================================================================

/**
 * @description HTML特殊字符轉義
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * @description 解析 .txt 檔案內容，轉換為 HTML 和其他資訊
 */
function parseDetailTxt(txtContent, fallbackName, postDate = '') {
    const rawLines = txtContent.split(/\r?\n/);
    
    let txtHtml = '', 
        h1Content = '', 
        h2Content = '', 
        altText = fallbackName, 
        linkHtml = '';
    
    // 過濾出需要處理的行
    const contentLines = rawLines.filter(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return false;
        const upperLine = trimmedLine.toUpperCase();
        
        // 集中處理不應出現在 HTML 內文中的標籤
        if (upperLine.startsWith('貼文日期:'.toUpperCase())) return false;
        if (upperLine.startsWith('MAIN_COVER:'.toUpperCase())) return false; 
        
        return true;
    });

    contentLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const upperLine = trimmedLine.toUpperCase();
        
        // 1. 處理第一行 (H1 標題)
        if (index === 0) {
            h1Content = trimmedLine || fallbackName; 
            txtHtml += `<h1>${h1Content}</h1>\n`; 
        
        // 2. 處理第二行 (H2 標題 或 貼文日期)
        } else if (index === 1) {
            if (trimmedLine) {
                h2Content = trimmedLine; 
            } else if (postDate) {
                h2Content = postDate;
            }
            if (h2Content) {
                txtHtml += `<h2>${h2Content}</h2>\n`;
            }
        
        // 3. 處理第三行及之後的內容 (特殊標籤或內文)
        } else { 
            if (upperLine.startsWith('ALT:')) {
                altText = trimmedLine.substring(4).trim();
            } else if (upperLine.startsWith('SIG:')) {
                const sigContent = trimmedLine.substring(4).trim();
                txtHtml += `<p class="sig-line">${sigContent}</p>\n`; 
            } else if (upperLine.startsWith('URL:')) {
                const urlPart = trimmedLine.substring(4).trim();
                const [url, text] = urlPart.includes('|') ? urlPart.split('|').map(s => s.trim()) : [urlPart, urlPart];
                linkHtml = `<p><a href="${url}" target="_blank">${text}</a></p>`;
            } else {
                txtHtml += `<p>${trimmedLine}</p>\n`; 
            }
        }
    });

    const finalDescription = (h1Content || '') + (h2Content ? ' / ' + h2Content : '');
    
    return { txtHtml, description: finalDescription, h1Content, h2Content, altText: altText, linkHtml, additionalImages: [] }; 
}

/**
 * @description 載入一個分類的所有作品資訊 (從 .txt 檔案)
 */
async function loadFileInfo(cat) {
    const imagesFolder = path.join(__dirname, cat.dir, 'images');
    
    let txtFiles = [];
    let allImageFiles = []; 

    try {
        const files = await fs.readdir(imagesFolder);
        txtFiles = files.filter(f => path.extname(f).toLowerCase() === '.txt');
        allImageFiles = files.filter(f => path.extname(f).toLowerCase() !== '.txt'); 
    } catch (err) {
        if (err.code !== 'ENOENT') {
             console.warn(`⚠️ 掃描 ${cat.dir}/images 失敗: ${err.message}`);
        }
        return []; 
    }
    
    const allFileInfo = [];
    
    const lowerCaseFilesMap = new Map();
    allImageFiles.forEach(f => lowerCaseFilesMap.set(f.toLowerCase(), f));

    for (const txtFileName of txtFiles) {
        const name = path.basename(txtFileName, '.txt');
        const lowerName = name.toLowerCase();
        
        let file = '', mainMediaFile = '', sortCode = 'ZZZZZ', postDate = '';
        let processedTxtContent = '';
        let h1Title = name, description = '無說明', altText = name, linkHtml = ''; 
        
        // 1. 偵測主媒體檔案 (mainMediaFile)
        for (const ext of ALLOWED_MEDIA_EXTENSIONS) {
            const possibleFile = lowerName + ext;
            if (lowerCaseFilesMap.has(possibleFile)) {
                mainMediaFile = lowerCaseFilesMap.get(possibleFile); 
                break;
            }
        }
        
        // 決定列表頁使用的縮圖檔案名 (file)
        if (!mainMediaFile) { 
            mainMediaFile = `${name}.jpg`; 
            file = mainMediaFile;
        } else {
            file = mainMediaFile.toLowerCase().endsWith('.mp4') 
                ? mainMediaFile.replace(/\.mp4$/i, '.jpg') 
                : mainMediaFile; 
        }

        // 2. 偵測輔助圖片 (additionalImages)
        let additionalImages = [];
        const mainBaseName = path.basename(mainMediaFile, path.extname(mainMediaFile)).toLowerCase();
        
        lowerCaseFilesMap.forEach((originalFileName, lowerFileName) => {
             const isMain = lowerFileName === mainMediaFile.toLowerCase();
             if (lowerFileName.startsWith(mainBaseName) && !isMain) {
                 additionalImages.push(originalFileName);
             }
        });

        // 3. 解析 TXT 內容
        try {
            const rawTxtContent = await fs.readFile(path.join(imagesFolder, txtFileName), 'utf8');
            let lines = rawTxtContent.split(/\r?\n/); 
            
            // 集中處理特殊標籤，並從內容中移除
            lines = lines.filter(line => {
                const upperLine = line.trim().toUpperCase();
                
                if (upperLine.startsWith('貼文日期:'.toUpperCase())) {
                    postDate = line.substring('貼文日期:'.length).trim();
                    return false;
                }
                
                // 處理 ORDER 標籤
                if (upperLine.startsWith('ORDER:')) {
                    sortCode = line.substring(6).trim();
                    return false;
                }
                
                // 剔除 MEDIA_LIST
                if (upperLine.startsWith('MEDIA_LIST:'.toUpperCase())) {
                    return false;
                }
                
                return true;
            });
            
            processedTxtContent = lines.join('\n');

            const parsed = parseDetailTxt(escapeHtml(processedTxtContent), name, postDate); 
            
            h1Title = parsed.h1Content || h1Title;
            description = parsed.description || description; 
            altText = parsed.altText || altText;
            linkHtml = parsed.linkHtml || linkHtml; 
            
            allFileInfo.push({ 
                sortCode, 
                file, 
                mainMediaFile, 
                name, 
                txtHtml: parsed.txtHtml, 
                description, 
                h1Title, 
                altText, 
                linkHtml, 
                additionalImages: additionalImages.sort() 
            });
            
        } catch (err) {
            console.warn(`⚠️ 讀取或解析 TXT 檔案失敗 ${txtFileName}: ${err.message}`);
        }
    }

    allFileInfo.sort((a, b) => a.sortCode.localeCompare(b.sortCode));
    return allFileInfo;
}

/**
 * @description 生成列表頁的卡片 HTML 片段 (C區)
 */
function generateListCards(allFileInfo, catName) {
    return allFileInfo
        .map(info => {
            const isVideo = info.mainMediaFile.toLowerCase().endsWith('.mp4');
            const isGallery = info.additionalImages.length > 0;

            let tagsHtml = '';
            if (isVideo) tagsHtml += '<span class="media-tag video-tag">🎬 VIDEO</span>';
            if (isGallery) tagsHtml += '<span class="media-tag gallery-tag">🖼️ GALLERY</span>';
            
            let listImagePath = `${catName}/images/${info.file}`;

            return `
            <div class="card">
                <a href="${catName}/${info.name}.html" class="card-link">
                    <img src="${listImagePath}" alt="${info.altText}" loading="lazy">
                    <div class="card-tags">${tagsHtml}</div>
                    <div class="card-description">${info.description}</div>
                </a>
            </div>`;
        })
        .join('\n');
}

/**
 * @description 生成詳細頁的 C 區塊所有內容
 */
function generateDetailContent(info, allFileInfo, index) {
    const { mainMediaFile, txtHtml, altText, linkHtml, additionalImages } = info;
    
    const detailMediaPrefix = 'images/'; 
    
    // 處理輔助圖片
    const additionalImagesHtml = additionalImages.length > 0 ? `
    <div class="additional-images-container"><h3>作品細節 / 輔助媒體</h3>
    ${additionalImages.map(imgFile => {
        const fileExt = path.extname(imgFile).toLowerCase();
        if (fileExt === '.mp4') {
            return `<video controls class="additional-media" src="${detailMediaPrefix}${imgFile}"></video>`;
        } else {
            return `<img src="${detailMediaPrefix}${imgFile}" alt="${altText} - 輔助圖" class="additional-img">`;
        }
    }).join('\n')}
    </div>` : '';

    // 判斷主媒體是圖片還是影片
    const isVideo = mainMediaFile.toLowerCase().endsWith('.mp4');
    const mainMediaHtml = isVideo 
        ? `<video controls autoplay muted class="main-img" src="${detailMediaPrefix}${mainMediaFile}" poster="${detailMediaPrefix}${mainMediaFile.replace(/\.mp4$/i, '.jpg')}"></video>`
        : `<img src="${detailMediaPrefix}${mainMediaFile}" alt="${altText}" class="main-img">`;

    // 上一個/下一個按鈕
    const prev = index > 0 ? allFileInfo[index - 1].name : null;
    const next = index < allFileInfo.length - 1 ? allFileInfo[index + 1].name : null;
    
    // 導航按鈕 (配合 script.js 的鍵盤導航)
    const navigationButtons = `
    <div class="navigation-links">
        ${prev ? `<a href="${prev}.html" class="nav-btn nav-prev" title="上一個">&lt;</a>` : ''}
        ${next ? `<a href="${next}.html" class="nav-btn nav-next" title="下一個">&gt;</a>` : ''}
    </div>
    `;

    // 組合 C 區內容
    return `
    ${mainMediaHtml}
    <div class="article-content">${txtHtml}${linkHtml || ''}</div>
    ${additionalImagesHtml}
    ${navigationButtons}
    `;
}

// ===================================================================
// 【C. 流程控制與總調度】
// ===================================================================

/**
 * @description 清理所有舊的生成的 HTML 文件
 */
async function cleanUpOldWebsite() {
    console.log("🧹 開始清理舊網站生成檔案 (僅刪除 HTML)...");
    
    // 從 categories 動態生成需要清理的頂層 HTML 檔案列表
    const dynamicTopLevelHtml = Object.keys(categories).map(k => `${k}.html`);
    const allTopLevelHtml = [...dynamicTopLevelHtml, 'index.html', 'about.html'];
    
    for (const topLevelHtml of allTopLevelHtml) {
        try {
            await fs.unlink(path.join(__dirname, topLevelHtml));
        } catch (err) {
            if (err.code !== 'ENOENT') { console.warn(`⚠️ 無法刪除 ${topLevelHtml}: ${err.message}`); }
        }
    }
    
    // 清理內容資料夾內部的詳細頁 HTML
    for (const cat of Object.values(categories)) {
        const dirPath = path.join(__dirname, cat.dir);
        try {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                if (path.extname(file).toLowerCase() === '.html') {
                    await fs.unlink(path.join(dirPath, file));
                }
            }
        } catch (err) {
            if (err.code !== 'ENOENT') { console.warn(`⚠️ 掃描 ${cat.dir} 失敗: ${err.message}`); }
        }
    }
    
    console.log("🧹 舊 HTML 檔案清理完成。");
}

/**
 * @description 核心替換函數 (替換 layout.html 模板中的標記)
 */
async function replaceAndWrite(template, outputPath, title, categoryTitle, mainContent, bodyClass, prefix, pageType) {
    const cssPrefix = prefix; 

    // --- 【新增邏輯：處理 LOGO 副標題 $LOGO_SUBTITLE$】 ---
    const isHomePage = (pageType === 'index' || pageType === 'about');
    let logoSubtitleHtml = '';
    
    if (isHomePage) {
        logoSubtitleHtml = '<div class="logo-subtitle">CoNeCoLin&NekoIcchou</div>';
    }
    // ----------------------------------------------------

    let finalHtml = template
        .replace(/\$TITLE\$/g, title)
        .replace(/\$DYNAMIC_CONTENT\$/g, mainContent)
        .replace(/\$BODY_CLASS\$/g, bodyClass) 
        .replace(/\$CSS_PREFIX\$/g, cssPrefix) 
        .replace(/\$PREFIX\$/g, prefix); 

    // 處理 H2 標題替換 ($CATEGORY_NAME$)
    const categoryNameHtml = categoryTitle ? `<h2 class="page-subtitle">${categoryTitle}</h2>` : '';
    finalHtml = finalHtml.replace(/\$CATEGORY_NAME\$/g, categoryNameHtml);
    
    // 替換 $LOGO_SUBTITLE$
    finalHtml = finalHtml.replace(/\$LOGO_SUBTITLE\$/g, logoSubtitleHtml);

    await fs.writeFile(outputPath, finalHtml, 'utf8');
}


/**
 * @description 網站生成的總流程 (只負責調度、替換和寫入)
 */
async function generateWebsite() {
    try {
        await fs.access(path.join(__dirname, 'layout.html'));
        await fs.access(path.join(__dirname, 'script.js')); // 確保 script.js 存在
    } catch (e) {
        console.error("⛔ 致命錯誤: 未找到 'layout.html' 或 'script.js' 模板文件。請確保檔案已正確放置。");
        return;
    }
    
    const layoutTemplate = await fs.readFile(path.join(__dirname, 'layout.html'), 'utf8');
    await cleanUpOldWebsite(); 
    
    console.log("\n🚀 開始生成靜態網站 (最終優化版)...");
    
    // --- 1. 處理主頁 (index.html) ---
    console.log(`\n--- 正在處理網站主頁 (index.html) ---`);
    await replaceAndWrite(layoutTemplate, path.join(__dirname, 'index.html'), 
        '主頁', '', indexContent, 'index-page', '', 'index'); // <-- 新增 pageType 參數
    console.log(`✅ 已生成 index.html 主頁`);
    
    // --- 2. 處理關於我們頁面 (about.html) ---
    console.log(`\n--- 正在處理網站關於我們頁 (about.html) ---`);
    await replaceAndWrite(layoutTemplate, path.join(__dirname, 'about.html'), 
        '關於我們', '', aboutUsContent, 'index-page', '', 'about'); // <-- 新增 pageType 參數
    console.log(`✅ 已生成 about.html 關於我們頁`);


    // --- 3. 處理列表頁和詳細頁 ---
    for (const [catName, cat] of Object.entries(categories)) {
        
        const allFileInfo = await loadFileInfo(cat);
        const rootPrefix = ''; 

        if (allFileInfo.length === 0) {
            console.log(`- ${cat.title} 分類沒有內容，將生成空的列表頁面。`);
            const emptyContent = `<div class="empty-message" style="padding: 50px; text-align: center;"><h2>目前這個分類沒有任何內容。</h2><p>請將內容檔案放入 ${cat.dir}/images 資料夾中。</p></div>`;
            await replaceAndWrite(layoutTemplate, path.join(__dirname, `${catName}.html`), 
                `${cat.title} 列表`, cat.title, emptyContent, 'list-page', rootPrefix, 'list'); // <-- 新增 pageType 參數
            console.log(`✅ 已生成 ${catName}.html 列表頁`);
            continue;
        }

        // --- 3.1. 列表頁生成 ---
        console.log(`\n--- 正在處理分類：${cat.title} ---`);
        const cardsHtml = generateListCards(allFileInfo, catName);
        await replaceAndWrite(layoutTemplate, path.join(__dirname, `${catName}.html`), 
            `${cat.title} 列表`, cat.title, cardsHtml, 'list-page', rootPrefix, 'list'); // <-- 新增 pageType 參數
        console.log(`✅ 已生成 ${catName}.html 列表頁`);

        // --- 3.2. 詳細頁生成 ---
        const detailPrefix = '../'; 
        for (let index = 0; index < allFileInfo.length; index++) {
            const info = allFileInfo[index];
            const detailContent = generateDetailContent(info, allFileInfo, index);
            const detailPath = path.join(__dirname, cat.dir, `${info.name}.html`);
            
            await replaceAndWrite(layoutTemplate, detailPath, 
                info.h1Title, cat.title, detailContent, 'detail-page', detailPrefix, 'detail'); // <-- 新增 pageType 參數
            console.log(`✅ 已生成 ${cat.dir}/${info.name}.html`);
        }
    }
    
    console.log("\n✨ 網站最終標準化生成任務完成！");
}

generateWebsite().catch(err => {
    console.error("⛔ 網站生成過程中發生致命錯誤：", err);
});