// ==UserScript==
// @name         Rekap Stok Minus - Lihat Stok
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/devtim-lab/AistimScript/main/rekapstokmin.js
// @downloadURL  https://raw.githubusercontent.com/devtim-lab/AistimScript/main/rekapstokmin.js
// @description  [v1.0.0] Tombol rekap stok minus, sticky header, centang pindah ke bawah, HD zoom, dan tombol tutup
// @author       You
// @match        https://trial.erzap.com/produk_gudangs/lihat_stok/new*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=erzap.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function triggerMainSearch() {
        const searchBtn = document.getElementById('bt_filter_pencarian_gudang') || document.querySelector('input[type="submit"][name="commit"]');
        if (searchBtn) {
            searchBtn.click();
        } else {
            const form = document.querySelector('form.simple_form');
            if (form) form.submit();
        }
    }

    // CSS Styling Modal, HD Zoom Viewer, Checkbox, Shadow Merah Theme & Compact Button
    const style = document.createElement('style');
    style.innerHTML = `
        .tm-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.65); z-index: 9999; display: none; justify-content: center; align-items: center; }
        .tm-modal-content { background: #fff; width: 850px; max-width: 95%; max-height: 90vh; border-radius: 8px; box-shadow: 0 10px 30px rgba(139, 0, 0, 0.35); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #d32f2f; }

        .tm-modal-header { padding: 15px; background: linear-gradient(135deg, #b71c1c, #880e4f); color: white; display: block; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .tm-header-top { display: flex; justify-content: space-between; align-items: center; }
        .tm-modal-header h4 { margin: 0; font-size: 18px; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .tm-close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; line-height: 1; transition: 0.2s; }
        .tm-close-btn:hover { color: #ffcdd2; }

        .tm-filter-area { margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 6px; display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; border: 1px solid rgba(255,255,255,0.2); }
        .tm-filter-group { display: flex; flex-direction: column; flex-grow: 1; }
        .tm-filter-group label { margin-bottom: 3px; font-size: 12px; font-weight: normal; color: #fff; }
        .tm-filter-group input, .tm-filter-group select { padding: 6px; border-radius: 4px; border: 1px solid #ccc; color: #333; font-size: 13px; background: #fff; }

        .tm-btn-cari { padding: 6px 15px; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; height: 32px; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .tm-btn-cari:hover { background: #b71c1c; }
        .tm-btn-cari:disabled { background: #6c757d; cursor: not-allowed; }

        .tm-modal-body { padding: 15px; overflow-y: auto; display: flex; flex-direction: column; max-height: calc(90vh - 160px); }

        /* Sticky Table Header agar th tidak ikut ter-scroll */
        .tm-modal-body table { border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 0; }
        .tm-modal-body th { position: sticky; top: 0; background-color: #f8f9fa; z-index: 2; border-bottom: 2px solid #dee2e6; box-shadow: inset 0 -1px 0 #dee2e6; }

        #tmPaginationContainer { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        #tmPaginationContainer .paginate_lite_wrap { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        #tmPaginationContainer .pagination_links { display: flex; align-items: center; gap: 8px; }
        #tmPaginationContainer a.pagination_link, #tmPaginationContainer .paginate_button { color: #b71c1c; text-decoration: none; padding: 5px 12px; border: 1px solid #b71c1c; border-radius: 4px; cursor: pointer; font-weight: 500; transition: 0.2s; }
        #tmPaginationContainer a.pagination_link:hover, #tmPaginationContainer .paginate_button:hover { background: #b71c1c; color: white; }
        #tmPaginationContainer .disabled { color: #6c757d; cursor: not-allowed; padding: 5px 12px; border: 1px solid #ccc; border-radius: 4px; background: #f8f9fa; }
        .tm-note { font-size: 11px; color: #888; margin-top: 5px; text-align: right; font-style: italic; }

        /* HD Zoomable File Viewer Styles */
        .tm-file-viewer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.92); z-index: 10000; display: none; flex-direction: column; align-items: center; justify-content: center; }
        .tm-file-viewer-toolbar { position: absolute; top: 15px; right: 25px; display: flex; gap: 10px; align-items: center; z-index: 10001; }
        .tm-file-info-badge { background: rgba(183, 28, 28, 0.9); color: white; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .tm-check-badge { background: rgba(40, 167, 69, 0.9); color: white; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.3); user-select: none; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .tm-check-badge input { width: 16px; height: 16px; cursor: pointer; }
        .tm-zoom-btn { background: rgba(255,255,255,0.2); border: 1px solid white; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .tm-zoom-btn:hover { background: rgba(255,255,255,0.4); }

        .tm-view-close-btn { background: #495057; border: 1px solid white; color: white; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .tm-view-close-btn:hover { background: #343a40; }

        .tm-file-container { width: 90%; height: 85vh; display: flex; align-items: center; justify-content: center; overflow: auto; position: relative; border-radius: 4px; }
        .tm-file-container img {
            max-width: 100%;
            transition: transform 0.15s ease-out;
            cursor: grab;
            user-select: none;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
        .tm-file-container img:active { cursor: grabbing; }
        .tm-file-container iframe { width: 100%; height: 100%; background: #fff; border: none; border-radius: 4px; }

        .tm-checkbox-cek { width: 18px; height: 18px; cursor: pointer; }
        tr.checked-row { background-color: #ffebee !important; color: #555; }
    `;
    document.head.appendChild(style);

    const modalHTML = `
        <div class="tm-modal-overlay" id="modalRekapStok">
            <div class="tm-modal-content">
                <div class="tm-modal-header">
                    <div class="tm-header-top">
                        <h4>Rekap Stok Minus (< 0) & Filter</h4>
                        <button class="tm-close-btn" id="closeModalRekap">&times;</button>
                    </div>
                    <div class="tm-filter-area">
                        <div class="tm-filter-group">
                            <label>Cari Barcode / Nama / Kode Ref</label>
                            <input type="text" id="tmInputKeyword" placeholder="Cari produk...">
                        </div>
                        <div class="tm-filter-group">
                            <label>Outlet</label>
                            <select id="tmSelectOutlet"></select>
                        </div>
                        <div class="tm-filter-group" style="flex-grow: 0;">
                            <button class="tm-btn-cari" id="tmBtnCari">Terapkan Filter</button>
                        </div>
                    </div>
                </div>
                <div class="tm-modal-body">
                    <table class="table table-bordered table-striped" style="width: 100%; margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th style="width: 60px; text-align:center;">No</th>
                                <th style="width: 150px;">Barcode</th>
                                <th>Nama Produk</th>
                                <th style="text-align:right; width: 100px;">Jumlah</th>
                                <th style="text-align:center; width: 90px;">Sudah Dicek</th>
                            </tr>
                        </thead>
                        <tbody id="tmRekapBody"></tbody>
                    </table>
                    <div class="tm-note">*Hanya menampilkan produk dengan stok minus (< 0) pada halaman aktif. Header tabel terkunci.</div>
                    <div id="tmPaginationContainer"></div>
                </div>
            </div>
        </div>

        <div class="tm-file-viewer" id="modalFileViewer">
            <div class="tm-file-viewer-toolbar" id="viewerToolbar">
                <div class="tm-file-info-badge" id="fileInfoBadge">Barcode: - | Stok: -</div>
                <div class="tm-check-badge" id="viewerCheckContainer">
                    <input type="checkbox" id="viewerCheckbox" style="cursor: pointer;"> Sudah Dicek
                </div>
                <button class="tm-zoom-btn" id="btnZoomIn" title="Perbesar">+</button>
                <button class="tm-zoom-btn" id="btnZoomOut" title="Perkecil">-</button>
                <button class="tm-zoom-btn" id="btnZoomReset" title="Reset Ukuran">Reset</button>
                <button class="tm-view-close-btn" id="btnViewClose">Tutup</button>
                <button class="tm-close-btn" id="closeFileViewer" style="font-size: 28px; margin-left: 5px;">&times;</button>
            </div>
            <div class="tm-file-container" id="fileContainer"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    window.addEventListener('load', function() {
        const btnRekap = document.createElement('button');
        btnRekap.innerHTML = '<i class="fa fa-chart-bar"></i> Rekap Stok Minus';
        btnRekap.className = 'btn btn-danger btn-sm';
        btnRekap.style.marginLeft = '12px';
        btnRekap.style.padding = '4px 10px';
        btnRekap.style.fontSize = '12px';
        btnRekap.type = 'button';

        const titleArea = document.querySelector('.panel-heading') || document.querySelector('h1, h2, h3');
        if (titleArea) {
            titleArea.appendChild(btnRekap);
        } else {
            document.body.prepend(btnRekap);
        }

        function updateDataTabelModal() {
            const rekapBody = document.getElementById('tmRekapBody');
            rekapBody.innerHTML = '';
            let dataDitemukan = false;
            let counter = 1;

            const tbody = document.querySelector('#data_table tbody');
            let rowsArray = [];

            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                rows.forEach((row, index) => {
                    const cols = row.querySelectorAll('td');
                    // Sesuaikan struktur kolom halaman lihat stok (biasanya No, Barcode, Nama, Qty/Stok, dsb)
                    if (cols.length >= 4 && !row.classList.contains('dataTables_empty')) {
                        const barcodeText = cols[1] ? cols[1].innerText.trim() : `row_${index}`;
                        const storageKey = `erzap_stok_checked_${window.location.pathname}_${barcodeText}`;
                        const isChecked = localStorage.getItem(storageKey) === 'true';

                        const barcodeHtml = cols[1] ? cols[1].innerHTML.trim() : '';
                        const namaHtml = cols[2] ? cols[2].innerHTML.trim() : '';

                        // Asumsi kolom jumlah/stok berada di indeks tertentu (misal indeks ke-3 atau kolom terakhir berisi angka minus)
                        // Kita periksa seluruh kolom atau kolom qty standar tabel stok Erzap
                        let qtyVal = 0;
                        let qtyColIndex = -1;
                        for(let i = 3; i < cols.length; i++) {
                            let val = parseFloat(cols[i].innerText.replace(/[^\d.-]/g, ''));
                            if (!isNaN(val) && (cols[i].innerText.includes('-') || val < 0)) {
                                qtyVal = val;
                                qtyColIndex = i;
                                break;
                            }
                        }

                        // Jika ditemukan stok < 0
                        if (qtyColIndex !== -1 && qtyVal < 0) {
                            dataDitemukan = true;
                            const textQty = cols[qtyColIndex].innerText.trim();

                            rowsArray.push({
                                storageKey,
                                isChecked,
                                barcodeHtml,
                                namaHtml,
                                textQty
                            });
                        }
                    }
                });
            }

            // Urutkan: yang belum dicek di atas, yang sudah dicek pindah ke bawah
            rowsArray.sort((a, b) => (a.isChecked === b.isChecked) ? 0 : a.isChecked ? 1 : -1);

            rowsArray.forEach(item => {
                const rowClass = item.isChecked ? 'checked-row' : '';
                rekapBody.innerHTML += `
                    <tr class="${rowClass}" data-storage-key="${item.storageKey}" data-barcode="${item.barcodeHtml}" data-qty="${item.textQty}">
                        <td style="text-align:center;">${counter++}</td>
                        <td>${item.barcodeHtml}</td>
                        <td>${item.namaHtml}</td>
                        <td style="text-align:right; color: red; font-weight: bold;">${item.textQty}</td>
                        <td style="text-align:center;">
                            <input type="checkbox" class="tm-checkbox-cek" ${item.isChecked ? 'checked' : ''}>
                        </td>
                    </tr>
                `;
            });

            if (!dataDitemukan) {
                rekapBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:green;">Tidak ada produk dengan stok minus di halaman ini.</td></tr>';
            }

            rekapBody.querySelectorAll('.tm-checkbox-cek').forEach(chk => {
                chk.addEventListener('change', function() {
                    const tr = this.closest('tr');
                    const key = tr.getAttribute('data-storage-key');
                    localStorage.setItem(key, this.checked ? 'true' : 'false');
                    updateDataTabelModal();
                });
            });

            const paginationContainer = document.getElementById('tmPaginationContainer');
            paginationContainer.innerHTML = '';

            const mainPagination = document.querySelector('.paginate_lite_wrap') || document.querySelector('.dataTables_paginate');
            if (mainPagination) {
                paginationContainer.innerHTML = mainPagination.innerHTML;
                const pagLinks = paginationContainer.querySelectorAll('a, .paginate_button');
                pagLinks.forEach(link => {
                    if(link.classList.contains('disabled') || link.getAttribute('disabled')) return;
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        sessionStorage.setItem('erzap_auto_open_stok_modal', 'yes');
                        const href = this.getAttribute('href');
                        if (href && href !== '#' && !href.includes('javascript:')) {
                            window.location.href = href;
                        } else {
                            const text = this.innerText.trim();
                            const originLinks = document.querySelectorAll('.paginate_lite_wrap a, .dataTables_paginate a, .dataTables_paginate .paginate_button');
                            for(let ol of originLinks) {
                                if (ol.innerText.trim() === text) {
                                    ol.click();
                                    break;
                                }
                            }
                        }
                    });
                });
            }
        }

        btnRekap.addEventListener('click', function(e) {
            if(e) e.preventDefault();

            const oriOutlet = document.getElementById('pencarian_idoutlet_own');
            const tmSelectOutlet = document.getElementById('tmSelectOutlet');
            tmSelectOutlet.innerHTML = '';
            if (oriOutlet) {
                Array.from(oriOutlet.options).forEach(opt => {
                    const newOpt = document.createElement('option');
                    newOpt.value = opt.value;
                    newOpt.text = opt.text;
                    tmSelectOutlet.appendChild(newOpt);
                });
                tmSelectOutlet.value = oriOutlet.value;
            }

            updateDataTabelModal();
            document.getElementById('modalRekapStok').style.display = 'flex';
        });

        document.getElementById('tmBtnCari').addEventListener('click', function() {
            this.innerText = 'Memproses...';
            this.disabled = true;

            sessionStorage.setItem('erzap_auto_open_stok_modal', 'yes');

            const oriOutlet = document.getElementById('pencarian_idoutlet_own');
            const keywordInput = document.getElementById('pencarian_barcode_nama_produk');

            if (oriOutlet) {
                oriOutlet.value = document.getElementById('tmSelectOutlet').value;
                oriOutlet.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (keywordInput) {
                keywordInput.value = document.getElementById('tmInputKeyword').value;
            }

            setTimeout(() => {
                triggerMainSearch();
            }, 100);
        });

        document.getElementById('closeModalRekap').addEventListener('click', () => {
            document.getElementById('modalRekapStok').style.display = 'none';
        });

        let currentZoom = 1;
        let activeRowForViewer = null;

        function closeViewer() {
            document.getElementById('modalFileViewer').style.display = 'none';
            document.getElementById('fileContainer').innerHTML = '';
            currentZoom = 1;
            activeRowForViewer = null;
        }

        document.getElementById('closeFileViewer').addEventListener('click', closeViewer);
        document.getElementById('btnViewClose').addEventListener('click', closeViewer);

        document.getElementById('viewerToolbar').addEventListener('click', function(e) {
            e.stopPropagation();
        });

        const viewerCheckContainer = document.getElementById('viewerCheckContainer');
        viewerCheckContainer.addEventListener('click', function(e) {
            e.stopPropagation();
            const checkbox = document.getElementById('viewerCheckbox');
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            if (activeRowForViewer) {
                const mainCheckbox = activeRowForViewer.querySelector('.tm-checkbox-cek');
                if (mainCheckbox) {
                    mainCheckbox.checked = checkbox.checked;
                    mainCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });

        document.getElementById('viewerCheckbox').addEventListener('change', function(e) {
            e.stopPropagation();
            if (activeRowForViewer) {
                const mainCheckbox = activeRowForViewer.querySelector('.tm-checkbox-cek');
                if (mainCheckbox) {
                    mainCheckbox.checked = this.checked;
                    mainCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });

        document.getElementById('btnZoomIn').addEventListener('click', (e) => {
            e.stopPropagation();
            currentZoom += 0.25;
            applyZoom();
        });

        document.getElementById('btnZoomOut').addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentZoom > 0.5) currentZoom -= 0.25;
            applyZoom();
        });

        document.getElementById('btnZoomReset').addEventListener('click', (e) => {
            e.stopPropagation();
            currentZoom = 1;
            applyZoom();
        });

        function applyZoom() {
            const img = document.querySelector('#fileContainer img');
            if (img) {
                img.style.transform = `scale(${currentZoom})`;
            }
        }

        if (sessionStorage.getItem('erzap_auto_open_stok_modal') === 'yes') {
            sessionStorage.removeItem('erzap_auto_open_stok_modal');
            setTimeout(() => {
                btnRekap.click();
                const btnCari = document.getElementById('tmBtnCari');
                if (btnCari) {
                    btnCari.innerText = 'Terapkan Filter';
                    btnCari.disabled = false;
                }
            }, 1000);
        }
    });
})();
