// ==UserScript==
// @name         Erzap - Rekap Pesanan Baru per Outlet (Tema Merah Shadow)
// @namespace    http://tampermonkey.net/
// @version      1.1.2
// @updateURL    https://raw.githubusercontent.com/devtim-lab/AistimScript/main/pesananbaru.js
// @downloadURL  https://raw.githubusercontent.com/devtim-lab/AistimScript/main/pesananbaru.js
// @description  Otomatis set status Pesanan Baru, rekap otomatis antar halaman, urutkan dari yang tertinggi (Tema Merah Shadow 3D).
// @author       You
// @match        https://trial.erzap.com/pesanan_penjualans*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=erzap.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Konstanta warna & shadow
    const MERAH = '#dc3545';
    const MERAH_DARK = '#b02a37';
    const MERAH_SHADOW = '0 4px 12px rgba(220, 53, 69, 0.4)';
    const MERAH_GLOW = '0 0 12px rgba(220, 53, 69, 0.6)';
    const MERAH_TEXT_SHADOW = '1px 1px 3px rgba(220, 53, 69, 0.5)';
    const MERAH_BTN_SHADOW = '0 4px 8px rgba(220, 53, 69, 0.35), 0 2px 4px rgba(0,0,0,0.15)';
    const MERAH_BTN_HOVER = '0 6px 14px rgba(220, 53, 69, 0.5), 0 3px 6px rgba(0,0,0,0.2)';

    // 1. Fitur Auto Search saat Outlet Berubah (Manual di layar)
    const interval = setInterval(() => {
        const outletSelect = document.querySelector('#pencarian_idoutlet_own');
        if (outletSelect) {
            clearInterval(interval);
            outletSelect.addEventListener('change', function() {
                const form = outletSelect.closest('form');
                if (form) {
                    form.submit();
                } else {
                    outletSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }
    }, 500);

    // 2. Tambah Tombol "Rekap Pesanan" - Tema Shadow Merah
    const btnInterval = setInterval(() => {
        const marketBtn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Cari Pesanan Marketplace Online'));

        if (marketBtn && !document.querySelector('#btn-rekap-pesanan')) {
            const rekapBtn = document.createElement('button');
            rekapBtn.id = 'btn-rekap-pesanan';
            rekapBtn.type = 'button';
            rekapBtn.className = marketBtn.className || 'btn btn-primary';
            rekapBtn.style.marginRight = '8px';
            // Tema Shadow Merah
            rekapBtn.style.backgroundColor = MERAH;
            rekapBtn.style.backgroundImage = `linear-gradient(180deg, ${MERAHI}, ${MERAHI_DARK})`;
            rekapBtn.style.borderColor = MERAH_DARK;
            rekapBtn.style.color = '#fff';
            rekapBtn.style.boxShadow = MERAH_BTN_SHADOW;
            rekapBtn.style.transition = 'all 0.2s ease';
            rekapBtn.style.borderRadius = '6px';
            rekapBtn.style.padding = '6px 14px';
            rekapBtn.style.fontWeight = '600';
            rekapBtn.innerHTML = '<i class="fa fa-list"></i> Rekap Pesanan';

            // Hover effect
            rekapBtn.addEventListener('mouseenter', () => {
                rekapBtn.style.boxShadow = MERAH_BTN_HOVER;
                rekapBtn.style.transform = 'translateY(-1px)';
            });
            rekapBtn.addEventListener('mouseleave', () => {
                rekapBtn.style.boxShadow = MERAH_BTN_SHADOW;
                rekapBtn.style.transform = 'translateY(0)';
            });

            marketBtn.parentNode.insertBefore(rekapBtn, marketBtn);
            rekapBtn.addEventListener('click', mulaiRekapPesananBaru);
        }
    }, 500);

    async function mulaiRekapPesananBaru() {
        const outletSelect = document.querySelector('#pencarian_idoutlet_own');
        if (!outletSelect) return;

        let statusParamName = '';
        let statusBaruValue = '';
        document.querySelectorAll('select').forEach(sel => {
            Array.from(sel.options).forEach(opt => {
                if(opt.text.toLowerCase().trim() === 'pesanan baru') {
                    statusParamName = sel.name;
                    statusBaruValue = opt.value;
                }
            });
        });

        const options = Array.from(outletSelect.options).filter(opt => opt.value !== "");
        const rekapData = [];
        let totalSemua = 0;

        const searchForm = outletSelect.closest('form');
        const formMethod = searchForm ? (searchForm.method || 'GET').toUpperCase() : 'GET';
        const formAction = searchForm ? searchForm.action : window.location.href;

        tampilkanModalLoadingUI();

        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            updateLoadingStatus(`Proses [${i+1}/${options.length}]: Memeriksa Outlet ${opt.text}...`);

            try {
                const formData = new FormData(searchForm);
                formData.set('pencarian[idoutlet_own]', opt.value);
                if (statusParamName && statusBaruValue) {
                    formData.set(statusParamName, statusBaruValue);
                }

                let fetchUrl = formAction;
                let fetchParams = { method: formMethod };

                if (formMethod === 'GET') {
                    const searchParams = new URLSearchParams(formData);
                    fetchUrl = `${formAction}?${searchParams.toString()}`;
                } else {
                    fetchParams.body = formData;
                }

                let currentUrl = fetchUrl;
                let currentFetchParams = fetchParams;
                let outletTotal = 0;
                let hasNextPage = true;
                let isFirstPage = true;

                while (hasNextPage && currentUrl) {
                    const response = await fetch(currentUrl, currentFetchParams);
                    const htmlText = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlText, 'text/html');

                    if (isFirstPage) {
                        const hasilParse = ekstrakTotalDariTeks(doc);
                        if (hasilParse.exact) {
                            outletTotal = hasilParse.total;
                            break;
                        } else {
                            outletTotal += hasilParse.total;
                        }
                    } else {
                        let countHalaman = 0;
                        doc.querySelectorAll('table tbody tr').forEach(row => {
                            if (row.querySelectorAll('td').length > 3) countHalaman++;
                        });
                        outletTotal += countHalaman;
                    }

                    let nextLink = cariLinkNext(doc);
                    if (nextLink) {
                        currentUrl = nextLink;
                        currentFetchParams = { method: 'GET' };
                        isFirstPage = false;
                        updateLoadingStatus(`Proses [${i+1}/${options.length}]: Menghitung halaman selanjutnya untuk ${opt.text}...`);
                    } else {
                        hasNextPage = false;
                    }
                }

                if (outletTotal > 0) {
                    rekapData.push({ nama: opt.text, jumlah: outletTotal });
                    totalSemua += outletTotal;
                }
            } catch (error) {
                console.error("Gagal memproses data untuk: " + opt.text, error);
            }
        }

        tampilkanHasilModalUI(rekapData, totalSemua);
    }

    function ekstrakTotalDariTeks(doc) {
        const textBody = doc.body.textContent || "";
        const regexDari = /dari\s+([\d.,]+)\s+data/i;
        const matchDari = textBody.match(regexDari);
        if (matchDari) {
            return { total: parseInt(matchDari[1].replace(/[.,]/g, ''), 10), exact: true };
        }
        const regexMenampilkan = /Menampilkan\s+([\d.,]+)\s+data/i;
        const matchMenampilkan = textBody.match(regexMenampilkan);
        if (matchMenampilkan) {
            return { total: parseInt(matchMenampilkan[1].replace(/[.,]/g, ''), 10), exact: true };
        }
        let countBaris = 0;
        doc.querySelectorAll('table tbody tr').forEach(row => {
            if (row.querySelectorAll('td').length > 3) countBaris++;
        });
        return { total: countBaris, exact: false };
    }

    function cariLinkNext(doc) {
        let path = null;
        let relNext = doc.querySelector('a[rel="next"]');
        if (relNext) path = relNext.getAttribute('href');
        if (!path) {
            let links = doc.querySelectorAll('.pagination a, div[class*="pagin"] a, .pager a');
            for (let a of links) {
                let text = a.textContent.toLowerCase().trim();
                if (text === '>' || text === '&gt;' || text === 'next' || text === 'selanjutnya') {
                    path = a.getAttribute('href');
                    break;
                }
            }
        }
        if (path && path !== '#' && !path.includes('javascript:')) {
            if (path.startsWith('http')) return path;
            if (path.startsWith('/')) return window.location.origin + path;
            return window.location.origin + '/' + path;
        }
        return null;
    }

    function tampilkanModalLoadingUI() {
        hapusModalUI();
        const modalOverlay = buatOverlayUI();
        modalOverlay.innerHTML = `
            <div style="background: #fff; width: 450px; border-radius: 10px; box-shadow: 0 8px 30px rgba(220,53,69,0.25), 0 4px 10px rgba(0,0,0,0.15); font-family: sans-serif; text-align: center; padding: 30px; border: 1px solid rgba(220,53,69,0.15);">
                <h3 style="margin-top: 0; color: #333; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Memproses Rekap Data...</h3>
                <p id="loading-status" style="color: #666; margin-bottom: 20px; font-size: 13px;">Mempersiapkan pengaturan pencarian...</p>
                <div style="width: 100%; background: #eee; height: 10px; border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #dc3545, #ff6b7a); box-shadow: 0 0 10px rgba(220,53,69,0.6); animation: progress 1s infinite linear;"></div>
                </div>
            </div>
            <style>@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }</style>
        `;
        document.body.appendChild(modalOverlay);
    }

    function updateLoadingStatus(text) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) statusEl.innerText = text;
    }

    function tampilkanHasilModalUI(rekapData, totalSemua) {
        hapusModalUI();
        const modalOverlay = buatOverlayUI();
        rekapData.sort((a, b) => b.jumlah - a.jumlah);
        let tableContent = '';
        rekapData.forEach(data => {
            tableContent += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.nama}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: #dc3545; text-shadow: 1px 1px 3px rgba(220,53,69,0.3);">${data.jumlah}</td></tr>`;
        });
        if (rekapData.length === 0) {
            tableContent = `<tr><td colspan="2" style="text-align: center; padding: 15px;">Tidak ada <b>Pesanan Baru</b> di semua outlet.</td></tr>`;
        }
        modalOverlay.innerHTML = `
            <div style="background: #fff; width: 500px; border-radius: 10px; box-shadow: 0 10px 40px rgba(220,53,69,0.2), 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; font-family: sans-serif; border: 1px solid rgba(220,53,69,0.1);">
                <!-- Header Modal Merah Shadow -->
                <div style="background: linear-gradient(135deg, #dc3545, #b02a37); color: #fff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(220,53,69,0.4);">
                    <h3 style="margin: 0; font-size: 16px; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">Rekap (Filter: Pesanan Baru)</h3>
                    <button id="close-rekap-modal" style="background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; text-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: transform 0.2s;">&times;</button>
                </div>
                <div style="padding: 15px; max-height: 350px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: linear-gradient(180deg, #f8f9fa, #e9ecef);">
                                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; text-shadow: 0 1px 1px rgba(255,255,255,0.8);">Nama Outlet</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd; text-shadow: 0 1px 1px rgba(255,255,255,0.8);">Jumlah Pesanan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableContent}
                        </tbody>
                    </table>
                    <div style="margin-top: 15px; padding-top: 10px; font-weight: bold; text-align: right; font-size: 16px; border-top: 2px solid #333;">
                        Total Pesanan Baru Keseluruhan: <span style="color: #dc3545; text-shadow: 1px 1px 4px rgba(220,53,69,0.4);">${totalSemua}</span>
                    </div>
                </div>
                <div style="background: #f9f9f9; padding: 10px 15px; text-align: right; border-top: 1px solid #ddd;">
                    <button id="btn-close-footer" style="padding: 6px 14px; background: linear-gradient(180deg, #6c757d, #5a6268); color: #fff; border: none; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: all 0.2s;">Tutup</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        document.getElementById('close-rekap-modal').onclick = () => hapusModalUI();
        document.getElementById('btn-close-footer').onclick = () => hapusModalUI();
        modalOverlay.onclick = (e) => { if (e.target === modalOverlay) hapusModalUI(); };
    }

    function buatOverlayUI() {
        const overlay = document.createElement('div');
        overlay.id = 'erzap-rekap-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 9999; display: flex;
            justify-content: center; align-items: center;
        `;
        return overlay;
    }

    function hapusModalUI() {
        const existing = document.querySelector('#erzap-rekap-modal-overlay');
        if (existing) existing.remove();
    }
})();
