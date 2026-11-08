// @file js/62-category-icons.js
// 分类图标映射与分类网格、金额类型样式、币种符号、编辑表单分类联动、子弹窗关闭处理。

// ── 类别图标网格 ─────────────────────────────────────────────
const CATEGORY_ICON_MAP = {
    // ── 餐饮 ──
    '餐饮': { icon: 'bi-cup-hot-fill', color: '#fd7e14' },
    '早餐': { icon: 'bi-cup-hot-fill', color: '#fd7e14' },
    '午餐': { icon: 'bi-egg-fried', color: '#fd7e14' },
    '晚餐': { icon: 'bi-egg-fried', color: '#fd7e14' },
    '夜宵': { icon: 'bi-moon-stars-fill', color: '#6610f2' },
    '外卖': { icon: 'bi-bicycle', color: '#fd7e14' },
    '聚餐': { icon: 'bi-people-fill', color: '#fd7e14' },
    '咖啡': { icon: 'bi-cup-straw', color: '#6f4e37' },
    '奶茶': { icon: 'bi-cup-straw', color: '#d63384' },
    '烟酒': { icon: 'bi-cup-fill', color: '#6c757d' },
    '零食': { icon: 'bi-egg-fried', color: '#fd7e14' },
    '水果': { icon: 'bi-basket3-fill', color: '#198754' },
    '蔬菜': { icon: 'bi-flower1', color: '#198754' },
    '生鲜': { icon: 'bi-basket-fill', color: '#198754' },
    '超市': { icon: 'bi-cart-fill', color: '#0d6efd' },

    // ── 交通出行 ──
    '交通': { icon: 'bi-bus-front-fill', color: '#0dcaf0' },
    '打车': { icon: 'bi-car-front-fill', color: '#0dcaf0' },
    '地铁': { icon: 'bi-train-front-fill', color: '#0dcaf0' },
    '公交': { icon: 'bi-bus-front-fill', color: '#0dcaf0' },
    '高铁': { icon: 'bi-train-front-fill', color: '#0d6efd' },
    '机票': { icon: 'bi-airplane-fill', color: '#0dcaf0' },
    '停车': { icon: 'bi-p-circle-fill', color: '#6c757d' },
    '加油': { icon: 'bi-fuel-pump-fill', color: '#fd7e14' },
    '车辆保养': { icon: 'bi-tools', color: '#6c757d' },
    '洗车': { icon: 'bi-car-front-fill', color: '#0dcaf0' },
    '共享单车': { icon: 'bi-bicycle', color: '#198754' },
    '旅行': { icon: 'bi-airplane-fill', color: '#0dcaf0' },
    '旅游': { icon: 'bi-airplane-fill', color: '#0dcaf0' },
    '度假': { icon: 'bi-umbrella-fill', color: '#0dcaf0' },
    '门票': { icon: 'bi-ticket-perforated-fill', color: '#fd7e14' },

    // ── 居住 ──
    '住房': { icon: 'bi-house-door-fill', color: '#6f42c1' },
    '房租': { icon: 'bi-house-door-fill', color: '#6f42c1' },
    '房贷': { icon: 'bi-bank', color: '#6f42c1' },
    '物业费': { icon: 'bi-building', color: '#6f42c1' },
    '装修': { icon: 'bi-hammer', color: '#6c757d' },
    '家具': { icon: 'bi-house-gear-fill', color: '#6f42c1' },
    '家电': { icon: 'bi-plug-fill', color: '#495057' },
    '水电': { icon: 'bi-lightning-charge-fill', color: '#ffc107' },
    '水电煤': { icon: 'bi-lightning-charge-fill', color: '#ffc107' },
    '网费': { icon: 'bi-wifi', color: '#20c997' },
    '物业': { icon: 'bi-building', color: '#6f42c1' },
    '日用品': { icon: 'bi-basket2-fill', color: '#0d6efd' },

    // ── 购物 ──
    '购物': { icon: 'bi-bag-fill', color: '#d63384' },
    '服饰': { icon: 'bi-handbag-fill', color: '#e83e8c' },
    '数码': { icon: 'bi-laptop', color: '#495057' },
    '化妆品': { icon: 'bi-stars', color: '#e83e8c' },
    '美妆': { icon: 'bi-stars', color: '#e83e8c' },
    '母婴': { icon: 'bi-emoji-laughing-fill', color: '#fd7e14' },
    '宝宝用品': { icon: 'bi-emoji-laughing-fill', color: '#fd7e14' },
    '玩具': { icon: 'bi-controller', color: '#6610f2' },

    // ── 娱乐 ──
    '娱乐': { icon: 'bi-controller', color: '#6610f2' },
    '电影': { icon: 'bi-film', color: '#6610f2' },
    'KTV': { icon: 'bi-mic-fill', color: '#d63384' },
    '演出': { icon: 'bi-music-note-beamed', color: '#6610f2' },
    '游戏': { icon: 'bi-controller', color: '#6610f2' },
    '订阅': { icon: 'bi-collection-play-fill', color: '#6610f2' },
    '会员': { icon: 'bi-patch-check-fill', color: '#6610f2' },

    // ── 医疗健康 ──
    '医疗': { icon: 'bi-heart-pulse-fill', color: '#dc3545' },
    '药品': { icon: 'bi-capsule', color: '#dc3545' },
    '体检': { icon: 'bi-clipboard2-pulse-fill', color: '#dc3545' },
    '牙医': { icon: 'bi-emoji-smile', color: '#dc3545' },
    '运动': { icon: 'bi-bicycle', color: '#198754' },
    '健身': { icon: 'bi-bicycle', color: '#198754' },
    '健身房': { icon: 'bi-trophy-fill', color: '#198754' },
    '瑜伽': { icon: 'bi-person-arms-up', color: '#198754' },
    '游泳': { icon: 'bi-water', color: '#0dcaf0' },
    '球类': { icon: 'bi-trophy-fill', color: '#198754' },
    '户外': { icon: 'bi-tree-fill', color: '#198754' },
    '登山': { icon: 'bi-tree-fill', color: '#198754' },
    '钓鱼': { icon: 'bi-water', color: '#0dcaf0' },
    '美容': { icon: 'bi-stars', color: '#e83e8c' },
    '美甲': { icon: 'bi-stars', color: '#e83e8c' },
    '理发': { icon: 'bi-scissors', color: '#e83e8c' },
    '护肤': { icon: 'bi-droplet-half', color: '#e83e8c' },

    // ── 教育学习 ──
    '教育': { icon: 'bi-mortarboard-fill', color: '#0d6efd' },
    '课程': { icon: 'bi-mortarboard-fill', color: '#0d6efd' },
    '培训': { icon: 'bi-easel2-fill', color: '#0d6efd' },
    '考试': { icon: 'bi-pencil-square', color: '#0d6efd' },
    '书籍': { icon: 'bi-book-fill', color: '#0d6efd' },
    '文具': { icon: 'bi-pencil-fill', color: '#0d6efd' },

    // ── 通讯数码 ──
    '通讯': { icon: 'bi-phone-fill', color: '#20c997' },
    '话费': { icon: 'bi-phone-fill', color: '#20c997' },

    // ── 人情往来 ──
    '人情': { icon: 'bi-gift-fill', color: '#d63384' },
    '红包': { icon: 'bi-gift-fill', color: '#dc3545' },
    '礼物': { icon: 'bi-gift-fill', color: '#d63384' },
    '慈善': { icon: 'bi-heart-fill', color: '#dc3545' },
    '捐款': { icon: 'bi-heart-fill', color: '#dc3545' },

    // ── 宠物 ──
    '宠物': { icon: 'bi-emoji-smile-fill', color: '#fd7e14' },
    '猫粮': { icon: 'bi-emoji-smile-fill', color: '#fd7e14' },
    '狗粮': { icon: 'bi-emoji-smile-fill', color: '#fd7e14' },
    '宠物医疗': { icon: 'bi-heart-pulse-fill', color: '#fd7e14' },

    // ── 金融与杂项支出 ──
    '保险': { icon: 'bi-shield-check', color: '#0d6efd' },
    '理财': { icon: 'bi-graph-up-arrow', color: '#198754' },
    '税费': { icon: 'bi-receipt-cutoff', color: '#6c757d' },
    '罚款': { icon: 'bi-exclamation-octagon-fill', color: '#dc3545' },
    '手续费': { icon: 'bi-receipt', color: '#6c757d' },
    '利息支出': { icon: 'bi-bank', color: '#6c757d' },
    '违约金': { icon: 'bi-exclamation-octagon-fill', color: '#dc3545' },
    '快递': { icon: 'bi-box-seam-fill', color: '#fd7e14' },
    '维修': { icon: 'bi-tools', color: '#6c757d' },
    '其他': { icon: 'bi-three-dots', color: '#6c757d' },
    '未分类': { icon: 'bi-question-circle', color: '#6c757d' },
    '余额调整': { icon: 'bi-sliders', color: '#6c757d' },

    // ── 收入 ──
    '工资': { icon: 'bi-cash-coin', color: '#198754' },
    '兼职': { icon: 'bi-briefcase-fill', color: '#fd7e14' },
    '副业': { icon: 'bi-briefcase-fill', color: '#fd7e14' },
    '佣金': { icon: 'bi-briefcase-fill', color: '#198754' },
    '奖金': { icon: 'bi-trophy-fill', color: '#198754' },
    '年终奖': { icon: 'bi-trophy-fill', color: '#198754' },
    '投资': { icon: 'bi-graph-up-arrow', color: '#0d6efd' },
    '股息': { icon: 'bi-graph-up-arrow', color: '#0d6efd' },
    '基金': { icon: 'bi-graph-up-arrow', color: '#0d6efd' },
    '利息收入': { icon: 'bi-piggy-bank-fill', color: '#198754' },
    '房租收入': { icon: 'bi-house-door-fill', color: '#198754' },
    '礼金': { icon: 'bi-gift-fill', color: '#d63384' },
    '报销': { icon: 'bi-receipt', color: '#20c997' },
    '退款': { icon: 'bi-arrow-counterclockwise', color: '#20c997' },
    '中奖': { icon: 'bi-stars', color: '#fd7e14' },
    '补贴': { icon: 'bi-cash-coin', color: '#198754' },
    '稿费': { icon: 'bi-pencil-fill', color: '#198754' },
    '二手出售': { icon: 'bi-tag-fill', color: '#198754' },
    '众筹': { icon: 'bi-people-fill', color: '#198754' },
    '赔偿': { icon: 'bi-receipt', color: '#198754' },
    '继承': { icon: 'bi-bank', color: '#198754' },
};
const CAT_FALLBACK_PALETTE = ['#0d6efd','#198754','#fd7e14','#d63384','#6610f2','#20c997','#dc3545','#6c757d'];

function _hexToRgbStr(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return '13,110,253';
    return `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}`;
}

function getCatIcon(name) {
    if (categoryIcons[name]) return categoryIcons[name];
    if (CATEGORY_ICON_MAP[name]) return CATEGORY_ICON_MAP[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return { icon: 'bi-tag-fill', color: CAT_FALLBACK_PALETTE[hash % CAT_FALLBACK_PALETTE.length] };
}

function catGridBuild(selectId, gridId) {
    const sel = $(selectId);
    const grid = $(gridId);
    if (!sel || !grid) return;
    grid.innerHTML = '';
    Array.from(sel.options).forEach((opt, i) => {
        const meta = getCatIcon(opt.value);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-grid-item' + (i === sel.selectedIndex ? ' selected' : '');
        btn.style.setProperty('--cat-color', meta.color);
        btn.style.setProperty('--cat-color-rgb', _hexToRgbStr(meta.color));
        btn.innerHTML = `<span class="cat-icon-circle"><i class="bi ${meta.icon}"></i></span><span class="cat-name">${opt.text}</span>`;
        btn.addEventListener('click', () => {
            sel.selectedIndex = i;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            catGridSync(selectId, gridId);
        });
        grid.appendChild(btn);
    });
}

function catGridSync(selectId, gridId) {
    const sel = $(selectId);
    const grid = $(gridId);
    if (!sel || !grid) return;
    grid.querySelectorAll('.cat-grid-item').forEach((el, i) => {
        el.classList.toggle('selected', i === sel.selectedIndex);
    });
}

// 金额输入框颜色随支出/收入变化
function updateAmountTypeClass(type) {
    [$('trans-amount-bar'), $('trans-amount-card')].forEach(el => {
        if (!el) return;
        el.classList.remove('amt-expense', 'amt-income');
        if (type === 'expense') el.classList.add('amt-expense');
        else if (type === 'income') el.classList.add('amt-income');
    });
}

// 金额前的货币符号随所选账户的币种变化
function updateAmountCurrencySymbol() {
    const accSel = $('edit-trans-account');
    const symEl = $('amount-currency-symbol');
    if (!accSel || !symEl) return;
    const acc = accounts.find(a => a.id == accSel.value);
    symEl.textContent = acc ? (CURRENCY_SYMBOLS[acc.currency] || acc.currency) : '¥';
}

// 转账 转出/转入 金额前的货币符号随各自所选账户的币种变化
function updateTransferCurrencySymbol(direction) {
    const selId = direction === 'out' ? 'edit-transfer-from' : 'edit-transfer-to';
    const symId = direction === 'out' ? 'transfer-currency-out' : 'transfer-currency-in';
    const accSel = $(selId);
    const symEl = $(symId);
    if (!accSel || !symEl) return;
    const acc = accounts.find(a => a.id == accSel.value);
    symEl.textContent = acc ? (CURRENCY_SYMBOLS[acc.currency] || acc.currency) : '¥';
}




function updateEditFormCategories() {
    const type = $('edit-trans-type').value;
    const catSelect = $('edit-trans-category');
    catSelect.innerHTML = '';
    (type === 'expense' ? categories.expense : categories.income).forEach(c => catSelect.add(new Option(c, c)));
    catGridBuild('edit-trans-category', 'cat-grid-edit-trans-category');
    updateAmountTypeClass(type);
    // 附件区域和相机按钮只在支出时显示
    const attachSec = $('attachment-section');
    const attachBtn = $('attachment-btn');
    const isExpense = type === 'expense';
    if (attachSec) attachSec.style.display = isExpense ? '' : 'none';
    if (attachBtn) attachBtn.style.display = isExpense ? '' : 'none';
}

// 编辑弹窗关闭时：若来自账户详情，刷新详情视图
function onSubModalHide() {
    const hintEl = $('edit-trans-desc-hint');
    if (hintEl) hintEl.style.display = 'none';
    resetAttachmentUI();
    // 重置拆分状态
    if (_inSplitMode) exitSplitMode();
    _splitData = [];
    // 重置只读状态（覆盖收/支/转账三个表单，避免下次新增时残留禁用态）
    $('editTransactionModal').querySelectorAll('input,select,textarea').forEach(el => { el.disabled = false; });
    $('editTransactionModal').querySelector('.trans-modal-v2')?.classList.remove('view-only');
    $('edit-trans-submit-btn').style.display = '';
    $('edit-transfer-submit-btn').style.display = '';
    $('edit-trans-delete-btn').style.setProperty('display','none','important');
    $('edit-transfer-delete-btn').style.setProperty('display','none','important');
    $('edit-trans-submit-btn').textContent = '保存';
    $('edit-transfer-submit-btn').textContent = '保存';
    // 确保单笔区域可见
    const singleRow = $('single-item-row');
    const metaSec = $('single-meta-section');
    if (singleRow) singleRow.style.display = '';
    if (metaSec) metaSec.style.display = '';
    maybeReturnToDetail();
    if (_fromChartDrawer && _chartDrawerData) {
        _fromChartDrawer = false;
        setTimeout(function() { showChartDrawer(_chartDrawerData.title, _chartDrawerData.txList); }, 100);
    }
}
