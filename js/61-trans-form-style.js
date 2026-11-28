// @file js/61-trans-form-style.js
// 5.2.1：记账窗口样式（经典 / 紧凑）——设置页读写本机偏好、经典/紧凑布局互换、紧凑模式下备注/标签抬升编辑、胶囊同步。
// 只影响「新增/编辑 支出·收入」表单；转账表单不使用紧凑布局。设置只存本机 localStorage，不写入加密数据、不参与同步。

const TRANS_STYLE_KEY = 'APP_trans_form_style';      // 'classic' | 'compact'
const TRANS_SIZES_KEY = 'APP_trans_form_sizes';      // { classic:{cols,icon,key}, compact:{cols,icon,key} }
const TRANS_STYLE_LABELS = { classic: '经典', compact: '紧凑' };
const TRANS_STYLE_DEFAULTS = {
    // 经典 = 5.2.0 的实际尺寸；紧凑 = 截图里的默认值
    classic: { cols: 4, icon: 40, key: 46 },
    compact: { cols: 4, icon: 44, key: 48 }
};
const TRANS_SIZE_LIMITS = {
    cols: { min: 3, max: 6, step: 1 },
    icon: { min: 32, max: 56, step: 2 },
    key:  { min: 36, max: 64, step: 2 }
};

let _transFormLayout = null;    // 当前已经应用的布局：'classic' | 'compact'

function _transStyleGet(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; }
}
function _transStyleSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
}

function getTransFormStyle() {
    return _transStyleGet(TRANS_STYLE_KEY, 'classic') === 'compact' ? 'compact' : 'classic';
}

function _transClampSize(key, value, fallback) {
    const lim = TRANS_SIZE_LIMITS[key];
    let n = parseInt(value, 10);
    if (!isFinite(n)) n = fallback;
    n = Math.round(n / lim.step) * lim.step;
    return Math.max(lim.min, Math.min(lim.max, n));
}

function getTransFormSizeSet(style) {
    style = style === 'compact' ? 'compact' : 'classic';
    let raw = {};
    try { raw = JSON.parse(_transStyleGet(TRANS_SIZES_KEY, '{}')) || {}; } catch (_) { raw = {}; }
    const saved = (raw && raw[style]) || {};
    const d = TRANS_STYLE_DEFAULTS[style];
    return {
        cols: _transClampSize('cols', saved.cols, d.cols),
        icon: _transClampSize('icon', saved.icon, d.icon),
        key:  _transClampSize('key', saved.key, d.key)
    };
}

function _saveTransFormSizeSet(style, sizes) {
    let all = {};
    try { all = JSON.parse(_transStyleGet(TRANS_SIZES_KEY, '{}')) || {}; } catch (_) { all = {}; }
    all[style] = sizes;
    _transStyleSet(TRANS_SIZES_KEY, JSON.stringify(all));
}

/** 把尺寸写到弹窗根节点的 CSS 变量上（列数 / 图标直径 / 键盘按键高度） */
function applyTransFormSizes(style) {
    const modal = $('editTransactionModal');
    if (!modal) return;
    const s = getTransFormSizeSet(style || getTransFormStyle());
    modal.style.setProperty('--tstyle-cols', String(s.cols));
    modal.style.setProperty('--tstyle-icon', s.icon + 'px');
    modal.style.setProperty('--tstyle-key', s.key + 'px');
}

/* ─────────── 设置页 ─────────── */
function setTransFormStyle(style) {
    if (style !== 'classic' && style !== 'compact') return;
    _transStyleSet(TRANS_STYLE_KEY, style);
    applyTransFormLayout();
    renderTransFormStyleSettings();
    if (typeof showToast === 'function') {
        showToast(`已切换为「${TRANS_STYLE_LABELS[style]}」记账窗口`, 'success', 1600);
    }
}

function setTransFormSize(key, value) {
    if (!TRANS_SIZE_LIMITS[key]) return;
    const style = getTransFormStyle();
    const sizes = getTransFormSizeSet(style);
    sizes[key] = _transClampSize(key, value, sizes[key]);
    _saveTransFormSizeSet(style, sizes);
    applyTransFormSizes(style);
    renderTransFormStyleSettings();
}

function resetTransFormSizes() {
    const style = getTransFormStyle();
    const d = TRANS_STYLE_DEFAULTS[style];
    _saveTransFormSizeSet(style, { cols: d.cols, icon: d.icon, key: d.key });
    applyTransFormSizes(style);
    renderTransFormStyleSettings();
    if (typeof showToast === 'function') showToast('已恢复默认大小', 'info', 1400);
}

function renderTransFormStyleSettings() {
    const style = getTransFormStyle();
    document.querySelectorAll('#trans-style-seg button').forEach(btn => {
        const on = btn.dataset.style === style;
        btn.classList.toggle('selected', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const caption = $('trans-style-size-caption');
    if (caption) caption.textContent = `${TRANS_STYLE_LABELS[style]}样式的大小`;
    const s = getTransFormSizeSet(style);
    const set = (id, val, suffix) => {
        const el = $(id), lab = $(id + '-val');
        if (el) el.value = String(val);
        if (lab) lab.textContent = val + suffix;
    };
    set('ts-size-cols', s.cols, ' 个');
    set('ts-size-icon', s.icon, ' px');
    set('ts-size-key', s.key, ' px');
}

/* ─────────── 布局：经典 ⇄ 紧凑 ─────────── */
function _transModalV2() {
    return document.querySelector('#editTransactionModal .trans-modal-v2');
}

/** 拆分模式只支持经典布局（分录区结构固定），进入拆分时临时切回经典，退出后恢复 */
function _transFormTargetLayout() {
    if (typeof _inSplitMode !== 'undefined' && _inSplitMode) return 'classic';
    return getTransFormStyle();
}

function _transMove(el, parent, before) {
    if (!el || !parent) return;
    if (before && before.parentNode === parent) parent.insertBefore(el, before);
    else parent.appendChild(el);
}

function _enterCompactTransLayout() {
    const v2 = _transModalV2();
    if (!v2) return;
    v2.classList.add('trans-compact');
    const toolbar = $('compact-toolbar');
    const accWrap = $('wrap-edit-trans-account');
    const dateWrap = $('wrap-edit-trans-date');
    // 账户 / 日期两个真实控件移进胶囊行（下拉与日期选择仍用原来的元素，定位不会偏）
    if (toolbar) {
        toolbar.insertBefore(accWrap, toolbar.firstChild);
        if (accWrap && accWrap.nextSibling) toolbar.insertBefore(dateWrap, accWrap.nextSibling);
        else toolbar.appendChild(dateWrap);
    }
    _transMove($('cat-grid-edit-trans-category'), $('compact-cat-scroll'));
    _transMove($('desc-suggest-wrap'), $('compact-note-slot'));
    _transMove($('tags-collapse-wrap'), $('compact-tag-slot'));
    _transMove($('trans-amount-card'), $('compact-amt-slot'));
    _transMove($('attachment-section'), $('compact-attach-slot'));
}

function _enterClassicTransLayout() {
    const v2 = _transModalV2();
    if (v2) v2.classList.remove('trans-compact', 'compact-editing-note', 'compact-editing-tag');
    const form = $('edit-transaction-form');
    const scroll = form ? form.querySelector('.trans-scroll-area') : null;
    const combo = form ? form.querySelector('.tm-combo-row') : null;
    const meta = $('single-meta-section');
    const catSection = $('cat-grid-section');
    // 账户 / 日期回到同一行
    if (combo) {
        combo.appendChild($('wrap-edit-trans-account'));
        combo.appendChild($('wrap-edit-trans-date'));
    }
    if (catSection) catSection.appendChild($('cat-grid-edit-trans-category'));
    if (meta) {
        meta.insertBefore($('desc-suggest-wrap'), $('edit-trans-desc-hint'));
        meta.appendChild($('tags-collapse-wrap'));
    }
    if (scroll) {
        scroll.insertBefore($('trans-amount-card'), scroll.firstChild);
        scroll.appendChild($('attachment-section'));
    }
}

/**
 * 应用布局。
 * force：可选 'classic'，用于拆分模式临时切回经典；不传则按用户偏好（拆分时自动用经典）。
 */
function applyTransFormLayout(force) {
    const target = (force === 'classic' || force === 'compact') ? force : _transFormTargetLayout();
    const v2 = _transModalV2();
    if (!v2) return;
    if (target === 'compact') {
        if (_transFormLayout !== 'compact') _enterCompactTransLayout();
    } else {
        // 即使已经是经典布局也走一次复位：从只读/拆分返回时能保证元素回到原位
        _enterClassicTransLayout();
    }
    _transFormLayout = target;
    applyTransFormSizes(target);
    syncCompactToolbar();
    if (typeof _syncTransActionBar === 'function') _syncTransActionBar();
}

/* ─────────── 紧凑模式的胶囊与附件 ─────────── */
function syncCompactToolbar() {
    const typeEl = $('edit-trans-type');
    const isExpense = (typeEl ? typeEl.value : 'expense') === 'expense';
    const img = $('compact-img-pill');
    if (img) img.style.display = isExpense ? '' : 'none';
    const splitCompact = $('split-toggle-btn-compact');
    const splitMain = $('split-toggle-btn');
    if (splitCompact) {
        splitCompact.style.display = isExpense ? '' : 'none';
        if (splitMain) splitCompact.disabled = splitMain.disabled;
    }
    syncCompactAttachment();
}

/** 紧凑模式：没有图片时不显示图片卡片；有图片时胶囊显示“N张” */
function syncCompactAttachment() {
    const field = $('edit-trans-attachment-id');
    const n = field && field.value ? field.value.split(',').filter(x => x.trim()).length : 0;
    const section = $('attachment-section');
    if (section) section.classList.toggle('has-thumbs', n > 0);
    const lab = $('compact-img-label');
    if (lab) lab.textContent = n > 0 ? `${n}张` : '图片';
    const pill = $('compact-img-pill');
    if (pill) pill.classList.toggle('has-value', n > 0);
}

function openCompactAttachment() {
    const input = $('attachment-file-input');
    if (input && !input.disabled) input.click();
}

/* ─────────── 备注 / 标签：抬到屏幕上方编辑 ─────────── */
function openCompactTagEditor() {
    const v2 = _transModalV2();
    if (!v2 || !v2.classList.contains('trans-compact')) return;
    if (typeof _inSplitMode !== 'undefined' && _inSplitMode) return;
    const inp = $('edit-trans-tags');
    if (!inp || inp.disabled) return;
    if (typeof _padTempHidden !== 'undefined') _padTempHidden = true;
    amountPadSync();
    v2.classList.add('compact-editing-tag');
    setTimeout(() => { if (!inp.disabled) inp.focus(); }, 30);
}

function closeCompactTagEditor() {
    const v2 = _transModalV2();
    if (v2) v2.classList.remove('compact-editing-tag');
    const inp = $('edit-trans-tags');
    if (inp) inp.blur();
    setTimeout(() => {
        const a = document.activeElement;
        if (!_isTransTextInput(a) && typeof _padTempHidden !== 'undefined' && _padTempHidden) {
            _padTempHidden = false;
            amountPadSync();
        }
    }, 0);
}

function closeCompactEditors() {
    const v2 = _transModalV2();
    if (v2) v2.classList.remove('compact-editing-note', 'compact-editing-tag');
}

function _isTransTextInput(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    return !el.type || el.type === 'text' || el.type === 'search' || el.type === 'decimal';
}

document.addEventListener('focusin', e => {
    const t = e.target;
    if (!t) return;
    const v2 = _transModalV2();
    if (!v2 || !v2.contains(t) || !v2.classList.contains('trans-compact')) return;
    if (t.id === 'edit-trans-desc') {
        v2.classList.add('compact-editing-note');
        v2.classList.remove('compact-editing-tag');
    } else if (t.id === 'edit-trans-tags') {
        v2.classList.add('compact-editing-tag');
        v2.classList.remove('compact-editing-note');
    }
});

document.addEventListener('focusout', e => {
    const t = e.target;
    if (!t || (t.id !== 'edit-trans-desc' && t.id !== 'edit-trans-tags')) return;
    // 延迟处理：点联想项 / 从备注切到标签时不要把刚抬起的编辑器收掉
    setTimeout(() => {
        const v2 = _transModalV2();
        if (!v2) return;
        const a = document.activeElement;
        if (a && (a.id === 'edit-trans-desc' || a.id === 'edit-trans-tags')) {
            // 在两个文本框之间切换：只保留当前那个的编辑态
            v2.classList.toggle('compact-editing-note', a.id === 'edit-trans-desc');
            v2.classList.toggle('compact-editing-tag', a.id === 'edit-trans-tags');
            return;
        }
        v2.classList.remove('compact-editing-note', 'compact-editing-tag');
        if (typeof _padTempHidden !== 'undefined' && _padTempHidden && !_isTransTextInput(a)) {
            _padTempHidden = false;
            amountPadSync();
        }
    }, 200);
});

document.addEventListener('DOMContentLoaded', () => {
    const modal = $('editTransactionModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', () => {
            closeCompactEditors();
            applyTransFormLayout();
        });
    }
    applyTransFormLayout();
    renderTransFormStyleSettings();
});
