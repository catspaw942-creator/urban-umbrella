// script.js - 頁面互動與輔助邏輯 (最終修復版：採用更寬鬆的 URL 匹配)

document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // 1. 頁面轉場動畫邏輯
    // ... (此處代碼不變，保持原樣)
    // ===============================================
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        // 確保只對同站內連結啟用動畫
        if (link.hostname === window.location.hostname && !link.href.endsWith('#') && link.target !== '_blank') {
            link.addEventListener('click', function(e) {
                e.preventDefault(); 
                const destination = link.href; 
                document.body.classList.add('is-leaving');
                setTimeout(() => {
                    window.location.href = destination;
                }, 300); 
            });
        }
    });
    
    // ===============================================
    // 2. 導航高亮 (Active Category) 邏輯 (最終修復版)
    // ===============================================
    function setActiveCategory() {
        const fullPath = window.location.pathname.toLowerCase(); // 轉換為小寫，確保匹配
        let activeCat = 'index'; 

        // 移除所有 active-cat 類別
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active-cat'));

        // 優先檢查當前頁面是否為某個分類頁面或詳細頁
        // 由於您所有的分類都對應一個導航按鈕，我們直接遍歷導航連結來匹配
        let matched = false;
        
        navLinks.forEach(link => {
            // 取得導航連結的分類名 (works, articles, cos, daily, about)
            const catName = link.getAttribute('data-category'); 
            
            // 排除 'index'
            if (catName === 'index') {
                return;
            }

            // 檢查當前 URL 路徑中是否包含這個分類名稱
            // 匹配邏輯：例如，如果 URL 包含 /works/ 或 /works.html，就點亮 'works'
            if (fullPath.includes(`/${catName}/`) || fullPath.endsWith(`/${catName}.html`)) {
                 activeCat = catName;
                 link.classList.add('active-cat');
                 matched = true;
            }
        });
        
        // 處理特殊情況：about.html
        if (fullPath.endsWith('/about.html') && !matched) {
             activeCat = 'about';
             document.querySelector('nav a[data-category="about"]').classList.add('active-cat');
             matched = true;
        }


        // 如果沒有匹配到任何分類 (例如：只剩下根目錄 / 或 index.html)
        if (!matched) {
            // 確保 index.html 或找不到時，主頁是活躍的
            document.querySelector('nav a[data-category="index"]').classList.add('active-cat');
            activeCat = 'index';
        }
        
        // 針對主頁單獨檢查 (因為它可能被 /works.html 判斷為不匹配)
        if (fullPath === '/' || fullPath.endsWith('/index.html')) {
            document.querySelector('nav a[data-category="index"]').classList.add('active-cat');
        }
    }

    setActiveCategory();
    
    // ===============================================
    // 3. 回到頂部按鈕邏輯
    // ... (此處代碼不變，保持原樣)
    // ===============================================
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        window.onscroll = function() {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        };
        backToTopBtn.onclick = function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    // ===============================================
    // 4. 詳細頁面鍵盤導航邏輯
    // ... (此處代碼不變，保持原樣)
    // ===============================================
    if (document.body.classList.contains('detail-page')) {
        document.addEventListener('keydown', function(event) {
            const prevBtn = document.querySelector('.nav-prev');
            const nextBtn = document.querySelector('.nav-next');
            
            if (event.key === 'ArrowLeft' && prevBtn) {
                prevBtn.click();
            } else if (event.key === 'ArrowRight' && nextBtn) {
                nextBtn.click();
            }
        });
    }
});