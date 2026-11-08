// @file js/68-transaction-list.js
// renderAllTransactions 交易列表渲染(桌面表格 + 手机卡片)与“加载更多”。

/* ─────────────────────────────────────────────────── */

function renderAllTransactions() {
    _statsDataVersion++; // 交易数据可能已变化，使统计页缓存失效
    const mobileContainer = $('mobile-transaction-cards');
    if (mobileContainer) mobileContainer.innerHTML = '';

    let filtered = getFilteredTransactions();
    filtered.sort((a, b) => {
        if (currentSortField === 'date') {
            const dc = currentSortDirection === 'asc' ? (a.date > b.date ? 1 : a.date < b.date ? -1 : 0) : (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
            return dc !== 0 ? dc : b.id - a.id;
        }
        let valA, valB;
        if (currentSortField === 'amount') { valA = Math.abs(a.amount); valB = Math.abs(b.amount); }
        else if (currentSortField === 'category') { valA = a.category; valB = b.category; }
        else if (currentSortField === 'account') { valA = a.accountId; valB = b.accountId; }
        else if (currentSortField === 'desc') { valA = a.desc; valB = b.desc; }
        else if (currentSortField === 'tags') { valA = a.tags || ''; valB = b.tags || ''; }
        else if (currentSortField === 'user') { valA = a.ownerName; valB = b.ownerName; }
        else { valA = a[currentSortField]; valB = b[currentSortField]; }
        return currentSortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    const displayData = filtered.slice(0, Math.min(displayedTransactionCount, filtered.length));

    // 移动端卡片
    if (mobileContainer) {
        const accMap = new Map(accounts.map(a => [String(a.id), a]));
        displayData.forEach(t => {
            const acc = accMap.get(String(t.accountId));
            if (!acc) return;
            if (t.isTransfer && t.type === 'income') return;

            const card = document.createElement('div');
            card.className = 'mobile-transaction-card';
            card.dataset.ttype = t.type;
            card.dataset.id = t.id;

            const accDisplayName = getAccountDisplayName(acc);
            const tagsDisplay = t.tags ? ` @${t.tags}` : '';
            const descClean = t.desc || '';
            const finalNote = descClean ? `#${descClean}` : '';
            const attachIcon = t.attachmentId ? ` <a href="${getDriveAttachmentUrl(t.attachmentId)}" target="_blank" onclick="event.stopPropagation()"><i class="bi bi-paperclip" style="color:var(--bs-secondary);font-size:0.75rem;"></i></a>` : '';

            let contentHtml;
            const isBatchable = !t.isTransfer && !(t.items && t.items.length > 1) && t.ownerName === currentUserName;

            if (t.isTransfer && t.type === 'expense') {
                const accTo = accMap.get(String(t.relatedAccountId));
                if (!accTo) return;
                let tIn = t.transferPairId ?
                    transactions.find(tx => tx.transferPairId === t.transferPairId && tx.type === 'income') :
                    transactions.find(tx => tx.isTransfer && tx.type === 'income' && tx.date === t.date && tx.relatedAccountId == t.accountId);
                const amountIn = tIn ? Math.abs(tIn.amount) : Math.abs(t.amount);
                const isCrossCurrency = acc.currency !== accTo.currency;
 contentHtml = `
    <div class="card-line-1">
        <div class="fw-bold flex-grow-1" style="font-size:0.85rem;">${accDisplayName} <i class="bi bi-arrow-right-short text-primary"></i> ${getAccountDisplayName(accTo)}${getTxnBadge(t)}</div>
        <div class="amount-transfer fw-bold">${CURRENCY_SYMBOLS[acc.currency]}${formatAmount(Math.abs(t.amount), acc.currency)}</div>
    </div>
    <div class="card-line-2 d-flex justify-content-between align-items-center">
        <span class="text-muted small">${t.date}${descClean ? ` · ${descClean}` : ''}${tagsDisplay}${attachIcon}</span>
        ${isCrossCurrency ? `<span class="small text-primary fw-bold">→ ${CURRENCY_SYMBOLS[accTo.currency]}${formatAmount(amountIn, accTo.currency)}</span>` : ''}
    </div>`;
            } else {
                const amountClass = t.amount < 0 ? 'amount-expense' : 'amount-income';
                const attachIconHtml = t.attachmentId ? ` <i class="bi bi-paperclip" style="color:var(--bs-secondary);font-size:0.72rem;"></i>` : '';

                let tagsHtml, noteHtml;
                if (t.items && t.items.length > 1) {
                    // 拆分交易：聚合各分录标签（第一行）和备注（第二行），/ 分隔
                    const allTags = t.items.map(it => it.tags).filter(Boolean);
                    const allDesc = t.items.map(it => it.desc).filter(Boolean);
                    tagsHtml = allTags.length
                        ? `<span style="color:var(--bs-secondary);font-size:0.78rem;"> <i class="bi bi-tag" style="font-size:0.62rem;"></i> ${allTags.join(' / ')}</span>`
                        : '';
                    noteHtml = allDesc.length
                        ? `<span style="color:var(--bs-secondary);font-size:0.78rem;"> <i class="bi bi-chat-left-text" style="font-size:0.62rem;"></i> ${allDesc.join(' / ')}</span>`
                        : '';
                } else {
                    tagsHtml = t.tags
                        ? `<span style="color:var(--bs-secondary);font-size:0.78rem;"> <i class="bi bi-tag" style="font-size:0.62rem;"></i> ${t.tags}</span>`
                        : '';
                    noteHtml = descClean
                        ? `<span style="color:var(--bs-secondary);font-size:0.78rem;"> <i class="bi bi-chat-left-text" style="font-size:0.62rem;"></i> ${descClean}</span>`
                        : '';
                }

                const catDisplay = t.items && t.items.length > 1
                    ? t.items[0].category + '等' + (t.items.length - 1) + '项'
                    : (t.category || '');

                contentHtml = `
                    <div class="card-line-1">
                        <span class="category-text">${catDisplay}${tagsHtml}${attachIconHtml}${getTxnBadge(t)}</span>
                        <div class="${amountClass} fw-bold">${CURRENCY_SYMBOLS[acc.currency]}${formatAmount(Math.abs(t.amount), acc.currency)}</div>
                    </div>
                    <div class="card-line-2">
                        <span class="text-muted small">${t.date} · ${accDisplayName}${noteHtml}</span>
                    </div>`;
            }

            if (batchEditMode && isBatchable) {
                const checked = batchSelectedIds.has(t.id);
                card.classList.toggle('batch-selected', checked);
                card.innerHTML = `<div class="d-flex align-items-start gap-2">
                    <input type="checkbox" class="form-check-input batch-edit-checkbox" ${checked ? 'checked' : ''} onclick="event.stopPropagation();toggleBatchSelect(${t.id})">
                    <div class="flex-grow-1" style="min-width:0;">${contentHtml}</div>
                </div>`;
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => toggleBatchSelect(t.id));
            } else {
                card.innerHTML = contentHtml;
                if (batchEditMode) {
                    // 批量编辑模式下，转账/拆分交易/他人交易不可勾选，弱化显示并禁用点击
                    card.style.opacity = '0.5';
                } else if (t.ownerName === currentUserName) {
                    initMobileSwipeGestures(card, t.id);
                } else if (!t.isTransfer) {
                    card.style.opacity = '0.85';
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        openEditTransaction(t.id);
                    });
                } else {
                    card.style.opacity = '0.75';
                }
            }
            mobileContainer.appendChild(card);
        });
    }

    const loadMoreContainer = $('load-more-container');
    const mobileLoadMore = $('mobile-load-more-container');
    if (filtered.length > displayedTransactionCount) {
        if (loadMoreContainer) loadMoreContainer.classList.remove('d-none');
        if (mobileLoadMore) mobileLoadMore.classList.remove('d-none');
    } else {
        if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
        if (mobileLoadMore) mobileLoadMore.classList.add('d-none');
    }
}

function loadMoreTransactions() {
    displayedTransactionCount += 100;
    renderAllTransactions();
}
