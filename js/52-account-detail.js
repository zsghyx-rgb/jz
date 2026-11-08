// @file js/52-account-detail.js
// 账户详情页：详情内容渲染、详情内标签切换、搜索、从详情进入编辑/删除。

let currentDetailAccountId = null;
let openedFromDetail = false;
var _fromChartDrawer = false;
var _chartDrawerData = null;

function renderDetailContent(id) {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    currentDetailAccountId = id;

    const bal = calculateBalance(id);
    const balStr = `${CURRENCY_SYMBOLS[acc.currency]}${formatAmount(bal, acc.currency)}`;
    const typeLabel = acc.accountType === 'Asset' ? '资产' : acc.accountType === 'Liability' ? '负债' : '应收';
    const isOwner = acc.ownerName === currentUserName;
    const initial = acc.ownerName.charAt(0).toLowerCase();
    const displayName = isOwner ? acc.name : `[${initial}] ${acc.name}`;

    $('ad-title').textContent = displayName;
    $('ad-type').textContent = typeLabel;
    $('ad-currency').textContent = acc.currency;
    $('ad-balance').textContent = `余额 ${balStr}`;
    $('ad-action-btns').style.display = isOwner ? 'flex' : 'none';

    const acctTrans = transactions.filter(t => t.accountId == id && !t._isBaseline)
        .sort((a, b) => b.date.localeCompare(a.date));

    const mobileContainer = $('account-detail-view-list');
    const empty = $('account-detail-view-empty');

    const resolveTransfer = (t) => {
        let tOut, tIn;
        if (t.transferPairId) {
            const pair = transactions.filter(x => x.transferPairId === t.transferPairId);
            tOut = pair.find(x => x.type === 'expense');
            tIn  = pair.find(x => x.type === 'income');
        } else {
            if (t.type === 'expense') {
                tOut = t;
                tIn = transactions.find(x => x.isTransfer && x.type === 'income' && x.date === t.date && x.relatedAccountId == t.accountId);
            } else {
                tIn = t;
                tOut = transactions.find(x => x.isTransfer && x.type === 'expense' && x.date === t.date && x.relatedAccountId == t.accountId);
            }
        }
        return { tOut, tIn };
    };

    // 搜索过滤
    const adSearchRaw = ($('ad-search-input')?.value || '').trim().toLowerCase();
    const filteredTrans = adSearchRaw ? acctTrans.filter(t => {
        // 类别
        const cats = t.items && t.items.length > 1
            ? t.items.map(it => it.category || '').join(' ')
            : (t.category || '');
        if (cats.toLowerCase().includes(adSearchRaw)) return true;
        // 备注
        const descs = t.items && t.items.length > 1
            ? t.items.map(it => it.desc || '').join(' ')
            : (t.desc || '');
        if (descs.toLowerCase().includes(adSearchRaw)) return true;
        // 标签
        const tags = t.items && t.items.length > 1
            ? t.items.map(it => it.tags || '').join(' ')
            : (t.tags || '');
        if (tags.toLowerCase().includes(adSearchRaw)) return true;
        // 金额（匹配数字字符串）
        const amtStr = formatAmount(Math.abs(t.amount), acc.currency);
        if (amtStr.includes(adSearchRaw)) return true;
        // 转入/转出账户名
        if (t.isTransfer) {
            const { tOut, tIn } = resolveTransfer(t);
            const fromAcc = tOut ? accounts.find(a => a.id == tOut.accountId) : null;
            const toAcc   = tIn  ? accounts.find(a => a.id == tIn.accountId)  : null;
            if (fromAcc && getAccountDisplayName(fromAcc).toLowerCase().includes(adSearchRaw)) return true;
            if (toAcc   && getAccountDisplayName(toAcc).toLowerCase().includes(adSearchRaw))   return true;
        }
        return false;
    }) : acctTrans;

    if (filteredTrans.length === 0) {
        if (mobileContainer) mobileContainer.innerHTML = '';
        if (empty) empty.classList.remove('d-none');
        return;
    }
    if (empty) empty.classList.add('d-none');

    // ---- 手机卡片列表 ----
    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        filteredTrans.forEach(t => {
            const isTransfer = t.isTransfer;
            let canEdit = t.ownerName === currentUserName;
            let titleHtml = '', subLine = t.date;
            let amtColor = isTransfer ? '#ff8c00' : (t.amount >= 0 ? '#198754' : '#dc3545');
            let iconClass = isTransfer ? 'bi-arrow-left-right' : (t.amount >= 0 ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle');

            if (isTransfer) {
                const { tOut, tIn } = resolveTransfer(t);
                if (tOut) canEdit = (tOut.ownerName === currentUserName);
                const fromAcc = tOut ? accounts.find(a => a.id == tOut.accountId) : null;
                const toAcc   = tIn  ? accounts.find(a => a.id == tIn.accountId)  : null;
                const fromName = fromAcc ? getAccountDisplayName(fromAcc) : '?';
                const toName   = toAcc   ? getAccountDisplayName(toAcc)   : '?';
                titleHtml = `<span style="font-size:0.83rem;font-weight:600;">${fromName}<span style="color:var(--bs-primary);margin:0 2px;">→</span>${toName}${getTxnBadge(t)}</span>`;
                const cleanDesc = tOut ? (tOut.desc || '') : (t.desc || '');
                if (cleanDesc) subLine += ' · ' + cleanDesc;
            } else {
                const catDisplay = t.items && t.items.length > 1
                    ? t.items[0].category + '等' + (t.items.length - 1) + '项'
                    : (t.category || '');
                let tagsHtml, noteStr;
                if (t.items && t.items.length > 1) {
                    const allTags = t.items.map(it => it.tags).filter(Boolean);
                    const allDesc = t.items.map(it => it.desc).filter(Boolean);
                    tagsHtml = allTags.length
                        ? `<span style="font-size:0.72rem;color:var(--bs-secondary);margin-left:4px;"><i class="bi bi-tag" style="font-size:0.62rem;"></i> ${allTags.join(' / ')}</span>`
                        : '';
                    noteStr = allDesc.length ? allDesc.join(' / ') : '';
                } else {
                    tagsHtml = t.tags
                        ? `<span style="font-size:0.72rem;color:var(--bs-secondary);margin-left:4px;"><i class="bi bi-tag" style="font-size:0.62rem;"></i> ${t.tags}</span>`
                        : '';
                    noteStr = t.desc || '';
                }
                titleHtml = `<span style="font-weight:600;font-size:0.83rem;">${catDisplay}${tagsHtml}</span>`;
                if (noteStr) subLine += ` <i class="bi bi-chat-left-text" style="font-size:0.62rem;"></i> ${noteStr}`;
            }

            const amtSign = (!isTransfer && t.amount >= 0) ? '+' : '';
            const displayAmt = `${amtSign}${CURRENCY_SYMBOLS[acc.currency]}${formatAmount(Math.abs(t.amount), acc.currency)}`;

            const item = document.createElement('div');
            item.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-bottom:1px solid var(--bs-border-color);background:var(--bs-body-bg);${canEdit ? 'cursor:pointer;' : ''}transition:background 0.15s;`;
            if (canEdit) {
                item.addEventListener('mouseenter', () => item.style.background = 'rgba(var(--bs-primary-rgb),0.06)');
                item.addEventListener('mouseleave', () => item.style.background = 'var(--bs-body-bg)');
                item.addEventListener('click', () => {
                    openedFromDetail = true;
                    isTransfer ? openEditTransfer(t.id) : openEditTransaction(t.id);
                });
            }
            item.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                    <i class="bi ${iconClass}" style="font-size:0.95rem;color:${amtColor};flex-shrink:0;"></i>
                    <div style="min-width:0;overflow:hidden;">
                        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${titleHtml}${t.attachmentId ? ` <i class="bi bi-paperclip" style="font-size:0.7rem;color:var(--bs-secondary);"></i>` : ''}</div>
                        <div style="font-size:0.72rem;color:var(--bs-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subLine}</div>
                    </div>
                </div>
                <div style="font-weight:700;font-size:0.88rem;color:${amtColor};margin-left:8px;white-space:nowrap;">${displayAmt}</div>`;
            mobileContainer.appendChild(item);
        });
    }
}

function openAccountDetailTab(id) {
    // 切换账户时重置搜索状态
    const panel = $('ad-search-panel');
    const input = $('ad-search-input');
    const btn   = $('ad-search-btn');
    if (panel) panel.style.display = 'none';
    if (input) input.value = '';
    if (btn)   btn.classList.remove('active');
    renderDetailContent(id);
    switchTab('account-detail', null);
    $('view-account-detail').scrollTop = 0;
}

// 只刷新内容，不触发switchTab（保存交易后调用，避免关闭modal）
function refreshDetailContent(id) {
    if (!id) return;
    renderDetailContent(id);
}

// 保留旧名称兼容
function openAccountDetail(id) { openAccountDetailTab(id); }

function editAccountFromDetail() {
    openEditAccount(currentDetailAccountId);
}

function toggleAdSearch() {
    const panel = $('ad-search-panel');
    const btn   = $('ad-search-btn');
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    btn.classList.toggle('active', isHidden);
    if (isHidden) {
        setTimeout(() => $('ad-search-input')?.focus(), 50);
    } else {
        const input = $('ad-search-input');
        if (input) { input.value = ''; refreshDetailContent(currentDetailAccountId); }
    }
}

function clearAdSearch() {
    const input = $('ad-search-input');
    if (input) { input.value = ''; refreshDetailContent(currentDetailAccountId); input.focus(); }
}

function deleteAccountFromDetail() {
    deleteAccount(currentDetailAccountId);
    if (!accounts.find(a => a.id === currentDetailAccountId)) {
        switchTab('accounts', document.querySelector('.nav-link[onclick*=accounts]'));
    }
}
