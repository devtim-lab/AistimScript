// ==UserScript==
// @name         Auto Koreksi, Simpan, & Reload - Erzap
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/devtim-lab/AistimScript/main/koreksiso.js
// @downloadURL  https://raw.githubusercontent.com/devtim-lab/AistimScript/main/koreksiso.js
// @description  [v1.0.0] Alur: KOREKSI (Koreksi1 = Hasil SO, Koreksi2 dst = 0) -> SIMPAN -> RELOAD
// @author       You
// @match        https://demo.erzap.com/stok_opnams/proses_koreksi_so/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=erzap.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isRunning = sessionStorage.getItem('erzap_auto_running') === 'true';

    function getCurrentPageNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        let page = urlParams.get('page');
        if (page) {
            return parseInt(page);
        }
        return 1;
    }

    let maxVisitedPage = parseInt(sessionStorage.getItem('erzap_max_page') || '1');
    let currentPage = getCurrentPageNumber();
    if (currentPage > maxVisitedPage) {
        maxVisitedPage = currentPage;
        sessionStorage.setItem('erzap_max_page', maxVisitedPage);
    }

    let pageLogs = JSON.parse(sessionStorage.getItem('erzap_page_logs') || '{}');

    function showPaginatedSummaryPopup(message, logs) {
        const existingModal = document.getElementById('customAlertModal');
        if (existingModal) existingModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'customAlertModal';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalOverlay.style.zIndex = '99999';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';

        const modalBox = document.createElement('div');
        modalBox.style.backgroundColor = '#fff';
        modalBox.style.padding = '25px 30px';
        modalBox.style.borderRadius = '8px';
        modalBox.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        modalBox.style.textAlign = 'center';
        modalBox.style.minWidth = '380px';
        modalBox.style.maxWidth = '450px';

        const modalText = document.createElement('p');
        modalText.textContent = message;
        modalText.style.fontSize = '16px';
        modalText.style.color = '#333';
        modalText.style.marginBottom = '15px';
        modalText.style.fontWeight = 'bold';

        let logKeys = Object.keys(logs).sort((a, b) => parseInt(a) - parseInt(b));
        let currentPopupPage = 1;
        const itemsPerPage = 10;
        let totalPopupPages = Math.ceil(logKeys.length / itemsPerPage) || 1;

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '15px';

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Halaman (Page)</th>
            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Status Save</th>
        </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        const paginationDiv = document.createElement('div');
        paginationDiv.style.display = 'flex';
        paginationDiv.style.justifyContent = 'space-between';
        paginationDiv.style.alignItems = 'center';
        paginationDiv.style.marginBottom = '20px';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹ Sebelumnya';
        prevBtn.className = 'btn btn-default btn-sm';
        prevBtn.style.padding = '5px 10px';
        prevBtn.style.fontSize = '12px';

        const pageInfo = document.createElement('span');
        pageInfo.style.fontSize = '13px';
        pageInfo.style.color = '#555';

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Selanjutnya ›';
        nextBtn.className = 'btn btn-default btn-sm';
        nextBtn.style.padding = '5px 10px';
        nextBtn.style.fontSize = '12px';

        function renderTablePage(p) {
            tbody.innerHTML = '';
            let start = (p - 1) * itemsPerPage;
            let end = start + itemsPerPage;
            let slicedKeys = logKeys.slice(start, end);

            if (slicedKeys.length === 0) {
                let row = document.createElement('tr');
                row.innerHTML = `<td colspan="2" style="padding: 10px; text-align: center; color: #777;">Tidak ada data.</td>`;
                tbody.appendChild(row);
            } else {
                slicedKeys.forEach(pageNum => {
                    let status = logs[pageNum];
                    let statusColor = status === 'Berhasil' ? '#28a745' : '#dc3545';

                    const row = document.createElement('tr');
                    row.innerHTML = `<td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Page ${pageNum}</td>
                                     <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center; color: ${statusColor}; font-weight: bold;">${status}</td>`;
                    tbody.appendChild(row);
                });
            }

            pageInfo.textContent = `Hal ${p} dari ${totalPopupPages}`;
            prevBtn.disabled = p <= 1;
            prevBtn.style.opacity = p <= 1 ? '0.5' : '1';
            nextBtn.disabled = p >= totalPopupPages;
            nextBtn.style.opacity = p >= totalPopupPages ? '0.5' : '1';
        }

        prevBtn.addEventListener('click', function() {
            if (currentPopupPage > 1) {
                currentPopupPage--;
                renderTablePage(currentPopupPage);
            }
        });

        nextBtn.addEventListener('click', function() {
            if (currentPopupPage < totalPopupPages) {
                currentPopupPage++;
                renderTablePage(currentPopupPage);
            }
        });

        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(pageInfo);
        paginationDiv.appendChild(nextBtn);

        renderTablePage(currentPopupPage);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'OK';
        closeBtn.className = 'btn btn-success';
        closeBtn.style.padding = '8px 25px';
        closeBtn.style.fontSize = '14px';
        closeBtn.style.backgroundColor = '#28a745';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.cursor = 'pointer';

        closeBtn.addEventListener('click', function() {
            modalOverlay.remove();
            sessionStorage.removeItem('erzap_max_page');
            sessionStorage.removeItem('erzap_page_logs');
        });

        modalBox.appendChild(modalText);
        modalBox.appendChild(table);
        modalBox.appendChild(paginationDiv);
        modalBox.appendChild(closeBtn);
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);
    }

    function initControls() {
        if (document.getElementById('autoKoreksiGroup')) return;

        let targetBtn = null;
        const allElements = document.querySelectorAll('a, button');
        for (let el of allElements) {
            if (el.textContent.trim() === 'FIFO') {
                targetBtn = el;
                break;
            }
        }

        if (targetBtn) {
            const groupDiv = document.createElement('div');
            groupDiv.id = 'autoKoreksiGroup';
            groupDiv.style.display = 'inline-block';
            groupDiv.style.marginRight = '5px';

            const startBtn = document.createElement('button');
            startBtn.id = 'startAutoBtn';
            startBtn.type = 'button';
            startBtn.className = targetBtn.className ? targetBtn.className : 'btn btn-default';
            startBtn.textContent = isRunning ? 'KOREKSI...' : 'START AUTO';
            startBtn.style.backgroundColor = '#28a745';
            startBtn.style.color = '#fff';
            startBtn.style.borderColor = '#28a745';
            startBtn.style.marginRight = '3px';
            startBtn.style.minWidth = '130px';
            startBtn.style.textAlign = 'center';

            const stopBtn = document.createElement('button');
            stopBtn.id = 'stopAutoBtn';
            stopBtn.type = 'button';
            stopBtn.className = targetBtn.className ? targetBtn.className : 'btn btn-default';
            stopBtn.textContent = 'STOP';
            stopBtn.style.backgroundColor = '#dc3545';
            stopBtn.style.color = '#fff';
            stopBtn.style.borderColor = '#dc3545';
            stopBtn.style.minWidth = '70px';

            startBtn.addEventListener('click', function() {
                if (!isRunning) {
                    sessionStorage.setItem('erzap_auto_running', 'true');
                    sessionStorage.setItem('erzap_max_page', '1');
                    sessionStorage.removeItem('erzap_page_logs');
                    isRunning = true;
                    runAutoProcess(startBtn);
                }
            });

            stopBtn.addEventListener('click', function() {
                sessionStorage.setItem('erzap_auto_running', 'false');
                isRunning = false;
                startBtn.textContent = 'START AUTO';
                startBtn.style.backgroundColor = '#28a745';
                let finalLogs = JSON.parse(sessionStorage.getItem('erzap_page_logs') || '{}');
                showPaginatedSummaryPopup('Proses Auto Koreksi dihentikan.', finalLogs);
            });

            groupDiv.appendChild(startBtn);
            groupDiv.appendChild(stopBtn);
            targetBtn.parentNode.insertBefore(groupDiv, targetBtn);

            if (isRunning) {
                setTimeout(() => runAutoProcess(startBtn), 1500);
            }
        }
    }

    function runAutoProcess(btnElement) {
        if (sessionStorage.getItem('erzap_auto_running') !== 'true') return;

        let currentP = getCurrentPageNumber();
        let storedMax = parseInt(sessionStorage.getItem('erzap_max_page') || '1');
        if (currentP > storedMax) {
            sessionStorage.setItem('erzap_max_page', currentP);
        }

        // --- TAHAP 1: KOREKSI ---
        if (btnElement) {
            btnElement.textContent = 'KOREKSI...';
            btnElement.style.backgroundColor = '#28a745';
            btnElement.style.borderColor = '#28a745';
        }

        setTimeout(function() {
            if (sessionStorage.getItem('erzap_auto_running') !== 'true') return;

            // 1. Isi Pengkoreksi dengan 'AISTIM'
            const pengkoreksiInput = document.getElementById('stok_opnam_pengkoreksi');
            if (pengkoreksiInput) {
                pengkoreksiInput.value = 'AISTIM';
                pengkoreksiInput.dispatchEvent(new Event('input', { bubbles: true }));
                pengkoreksiInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 2. Isi Tanggal Koreksi dengan hari ini (YYYY-MM-DD)
            const tanggalKoreksiInput = document.getElementById('stok_opnam_tanggal_koreksi');
            if (tanggalKoreksiInput) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                tanggalKoreksiInput.value = `${yyyy}-${mm}-${dd}`;
                tanggalKoreksiInput.dispatchEvent(new Event('input', { bubbles: true }));
                tanggalKoreksiInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 3. Loop berdasarkan input jumlah koreksi yang ada di halaman (menangani baris bertingkat/rowspan)
            const allKoreksiInputs = document.querySelectorAll('input[type="text"][name*="jumlah_koreksi"]');

            // Kelompokkan input berdasarkan ID dasar produk atau ambil baris pasangannya
            // Karena namanya berformat stok_opnam_detail_koreksi1[jumlah_koreksi], stok_opnam_detail_koreksi2[jumlah_koreksi], dst.
            // Kita kumpulkan semua input berdasarkan produk atau kita cari elemen `so` di baris utamanya.

            // Cara yang lebih akurat untuk struktur rowspan:
            // Cari semua elemen tr utama atau cari berdasarkan elemen Hasil SO (`td[id^="so"]`)
            const soCells = document.querySelectorAll('td[id^="so"]');
            soCells.forEach(soCell => {
                let valText = soCell.textContent.trim();
                const match = valText.match(/[\d.]+/);
                let hasilSOVal = match ? match[0] : '0';

                // Cari baris `tr` tempat cell ini berada, dan baris-baris berikutnya yang terkait dengan produk ini
                // Berdasarkan HTML Anda, baris pertama memiliki rowspan pada kolom SO, dan baris kedua adalah `tr` berikutnya.
                let currentRow = soCell.closest('tr');

                // Cari semua input jumlah_koreksi yang ada di baris ini DAN baris setelahnya (selama belum masuk ke produk baru)
                let inputsInGroup = [];
                let nextTr = currentRow;

                // Ambil input di row pertama
                let inp1 = currentRow.querySelector('input[type="text"][name*="jumlah_koreksi"]');
                if (inp1) inputsInGroup.push(inp1);

                // Cek row berikutnya (misal tr dengan id yang sama atau tr di bawahnya yang memiliki input koreksi lanjutan)
                let siblingTr = currentRow.nextElementSibling;
                while (siblingTr && siblingTr.id && siblingTr.id.startsWith('tr_')) {
                    let inpSub = siblingTr.querySelector('input[type="text"][name*="jumlah_koreksi"]');
                    if (inpSub) inputsInGroup.push(inpSub);
                    siblingTr = siblingTr.nextElementSibling;
                }

                // Isi nilai: Index 0 (atas) = Hasil SO, Index berikutnya (bawah) = 0
                inputsInGroup.forEach((inp, idx) => {
                    if (idx === 0) {
                        inp.value = hasilSOVal;
                    } else {
                        inp.value = '0';
                    }
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });

            // --- TAHAP 2: SIMPAN ---
            setTimeout(function() {
                if (sessionStorage.getItem('erzap_auto_running') !== 'true') return;

                const divSimpan = document.getElementById('simpan');
                let currentLogs = JSON.parse(sessionStorage.getItem('erzap_page_logs') || '{}');

                if (divSimpan) {
                    if (btnElement) {
                        btnElement.textContent = 'SIMPAN...';
                        btnElement.style.backgroundColor = '#007bff';
                        btnElement.style.borderColor = '#007bff';
                    }

                    divSimpan.click();
                    if (typeof submit_form_koreksi_so === 'function') {
                        submit_form_koreksi_so();
                    }
                    currentLogs[currentP] = 'Berhasil';
                } else {
                    currentLogs[currentP] = 'Gagal Save';
                    if (btnElement) {
                        btnElement.textContent = 'SKIP...';
                        btnElement.style.backgroundColor = '#6c757d';
                        btnElement.style.borderColor = '#6c757d';
                    }
                }
                sessionStorage.setItem('erzap_page_logs', JSON.stringify(currentLogs));

                // --- TAHAP 3: RELOAD / PINDAH HALAMAN BERIKUTNYA ---
                setTimeout(function() {
                    if (sessionStorage.getItem('erzap_auto_running') !== 'true') return;

                    if (btnElement) {
                        btnElement.textContent = 'RELOAD...';
                        btnElement.style.backgroundColor = '#ffc107';
                        btnElement.style.borderColor = '#ffc107';
                    }

                    let nextLink = null;
                    const allLinks = document.querySelectorAll('a');
                    for (let link of allLinks) {
                        let text = link.textContent.trim();
                        if (text.includes('Selanjutnya') || text.includes('›') || text.includes('»') || link.getAttribute('rel') === 'next') {
                            if (!link.parentElement.classList.contains('disabled') && link.offsetParent !== null) {
                                nextLink = link;
                                break;
                            }
                        }
                    }

                    if (nextLink) {
                        nextLink.click();
                        setTimeout(() => runAutoProcess(btnElement), 2500);
                    } else {
                        let finalLogs = JSON.parse(sessionStorage.getItem('erzap_page_logs') || '{}');

                        sessionStorage.setItem('erzap_auto_running', 'false');
                        if (btnElement) {
                            btnElement.textContent = 'SELESAI';
                            btnElement.style.backgroundColor = '#17a2b8';
                            btnElement.style.borderColor = '#17a2b8';
                        }

                        showPaginatedSummaryPopup('Rangkuman Hasil Koreksi & Save:', finalLogs);
                    }
                }, 2000);

            }, 1500);

        }, 1200);
    }

    window.addEventListener('load', function() {
        setTimeout(initControls, 1200);
    });

    const observer = new MutationObserver(function() {
        if (!document.getElementById('autoKoreksiGroup')) {
            initControls();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();