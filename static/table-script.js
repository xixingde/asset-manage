// 全局变量
let assets = [];
let filteredAssets = [];
let currentPage = 1;
let pageSize = 25;
let sortColumn = 'id';
let sortDirection = 'asc';

// DOM元素
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const minValue = document.getElementById('minValue');
const maxValue = document.getElementById('maxValue');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');
const refreshTable = document.getElementById('refreshTable');
const exportData = document.getElementById('exportData');
const pageSize_Select = document.getElementById('pageSize');
const assetsTable = document.getElementById('assetsTable');
const tableBody = document.getElementById('tableBody');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const emptyTable = document.getElementById('emptyTable');
const tableInfo = document.getElementById('tableInfo');
const pagination = document.getElementById('pagination');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// 统计元素
const totalCount = document.getElementById('totalCount');
const totalValue = document.getElementById('totalValue');
const averageValue = document.getElementById('averageValue');
const maxValueStat = document.getElementById('maxValue');

// 模态框元素
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const deleteModal = document.getElementById('deleteModal');
const deleteMessage = document.getElementById('deleteMessage');

let currentEditId = null;
let currentDeleteId = null;

// API基础URL
const API_BASE = '/api/assets';

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadAssets();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 筛选和搜索
    applyFilters.addEventListener('click', applyFiltersFunction);
    clearFilters.addEventListener('click', clearFiltersFunction);
    refreshTable.addEventListener('click', loadAssets);
    exportData.addEventListener('click', exportToCSV);
    
    // 实时搜索
    searchInput.addEventListener('input', debounce(applyFiltersFunction, 300));
    categoryFilter.addEventListener('change', applyFiltersFunction);
    
    // 分页
    pageSize_Select.addEventListener('change', changePageSize);
    prevPage.addEventListener('click', () => changePage(currentPage - 1));
    nextPage.addEventListener('click', () => changePage(currentPage + 1));
    
    // 表格排序
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.column;
            const type = th.dataset.type;
            sortTable(column, type);
        });
    });
    
    // 模态框事件
    document.getElementById('closeEdit').addEventListener('click', hideEditModal);
    document.getElementById('cancelEdit').addEventListener('click', hideEditModal);
    editForm.addEventListener('submit', handleEditSubmit);
    
    document.getElementById('confirmDelete').addEventListener('click', handleDeleteConfirm);
    document.getElementById('cancelDelete').addEventListener('click', hideDeleteModal);
    
    // 点击模态框外部关闭
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) hideEditModal();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) hideDeleteModal();
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 显示加载状态
function showLoading() {
    loading.style.display = 'block';
    error.style.display = 'none';
    assetsTable.style.display = 'none';
    emptyTable.style.display = 'none';
    pagination.style.display = 'none';
}

// 隐藏加载状态
function hideLoading() {
    loading.style.display = 'none';
}

// 显示错误信息
function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    hideLoading();
}

// 显示成功消息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// 加载所有资产
async function loadAssets() {
    showLoading();
    
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        assets = await response.json();
        filteredAssets = [...assets];
        applyFiltersFunction();
        hideLoading();
        
    } catch (err) {
        showError('加载资产数据失败: ' + err.message);
        assets = [];
        filteredAssets = [];
        updateStats();
    }
}

// 应用筛选条件
function applyFiltersFunction() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const minVal = parseFloat(minValue.value) || 0;
    const maxVal = parseFloat(maxValue.value) || Infinity;
    const startDateVal = startDate.value;
    const endDateVal = endDate.value;
    
    filteredAssets = assets.filter(asset => {
        // 搜索筛选
        const matchesSearch = !searchTerm || 
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.category.toLowerCase().includes(searchTerm) ||
            (asset.description && asset.description.toLowerCase().includes(searchTerm));
        
        // 类别筛选
        const matchesCategory = !selectedCategory || asset.category === selectedCategory;
        
        // 价值范围筛选
        const matchesValue = asset.value >= minVal && asset.value <= maxVal;
        
        // 日期范围筛选
        let matchesDate = true;
        if (startDateVal || endDateVal) {
            const assetDate = new Date(asset.purchase_date);
            if (startDateVal) {
                matchesDate = matchesDate && assetDate >= new Date(startDateVal);
            }
            if (endDateVal) {
                matchesDate = matchesDate && assetDate <= new Date(endDateVal);
            }
        }
        
        return matchesSearch && matchesCategory && matchesValue && matchesDate;
    });
    
    // 重新排序
    sortAssets();
    
    // 重置到第一页
    currentPage = 1;
    
    // 渲染表格
    renderTable();
    updateStats();
    updatePagination();
}

// 清除筛选条件
function clearFiltersFunction() {
    searchInput.value = '';
    categoryFilter.value = '';
    minValue.value = '';
    maxValue.value = '';
    startDate.value = '';
    endDate.value = '';
    
    applyFiltersFunction();
}

// 排序表格
function sortTable(column, type) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // 更新排序指示器
    updateSortIndicators();
    
    // 排序并重新渲染
    sortAssets();
    renderTable();
}

// 排序资产数据
function sortAssets() {
    filteredAssets.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        // 处理不同数据类型
        if (sortColumn === 'value') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        } else if (sortColumn === 'purchase_date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else if (sortColumn === 'id') {
            aVal = parseInt(aVal);
            bVal = parseInt(bVal);
        } else {
            aVal = (aVal || '').toString().toLowerCase();
            bVal = (bVal || '').toString().toLowerCase();
        }
        
        let result = 0;
        if (aVal < bVal) result = -1;
        else if (aVal > bVal) result = 1;
        
        return sortDirection === 'desc' ? -result : result;
    });
}

// 更新排序指示器
function updateSortIndicators() {
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.className = 'sort-indicator';
    });
    
    const currentTh = document.querySelector(`[data-column="${sortColumn}"] .sort-indicator`);
    if (currentTh) {
        currentTh.className = `sort-indicator ${sortDirection}`;
    }
}

// 工具函数：HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 全局函数供HTML调用
window.showEditModal = showEditModal;
window.showDeleteModal = showDeleteModal;

// 渲染表格
function renderTable() {
    if (filteredAssets.length === 0) {
        assetsTable.style.display = 'none';
        emptyTable.style.display = 'block';
        pagination.style.display = 'none';
        tableInfo.textContent = '显示 0 条记录';
        return;
    }
    
    emptyTable.style.display = 'none';
    assetsTable.style.display = 'table';
    
    // 计算分页
    const totalItems = filteredAssets.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
    const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
    const endIndex = pageSize === 'all' ? totalItems : Math.min(startIndex + pageSize, totalItems);
    
    const displayAssets = filteredAssets.slice(startIndex, endIndex);
    
    // 渲染表格行
    tableBody.innerHTML = displayAssets.map(asset => `
        <tr>
            <td>${asset.id}</td>
            <td>${escapeHtml(asset.name)}</td>
            <td><span class="category-tag ${asset.category}">${asset.category}</span></td>
            <td class="value-cell">¥${asset.value.toLocaleString('zh-CN', {minimumFractionDigits: 2})}</td>
            <td>${formatDate(asset.purchase_date)}</td>
            <td class="description-cell" title="${escapeHtml(asset.description || '')}">${escapeHtml(asset.description || '-')}</td>
            <td class="actions-column">
                <div class="action-buttons">
                    <button class="btn btn-small btn-edit-small" onclick="showEditModal(${asset.id})">编辑</button>
                    <button class="btn btn-small btn-delete-small" onclick="showDeleteModal(${asset.id}, '${escapeHtml(asset.name)}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // 更新信息显示
    tableInfo.textContent = `显示 ${startIndex + 1}-${endIndex} 条，共 ${totalItems} 条记录`;
    
    // 显示分页控件
    if (pageSize !== 'all' && totalPages > 1) {
        pagination.style.display = 'flex';
    } else {
        pagination.style.display = 'none';
    }
}

// 更新统计信息
function updateStats() {
    const count = filteredAssets.length;
    const totalVal = filteredAssets.reduce((sum, asset) => sum + asset.value, 0);
    const avgVal = count > 0 ? totalVal / count : 0;
    const maxVal = count > 0 ? Math.max(...filteredAssets.map(asset => asset.value)) : 0;
    
    totalCount.textContent = count;
    totalValue.textContent = `¥${totalVal.toLocaleString('zh-CN', {minimumFractionDigits: 2})}`;
    averageValue.textContent = `¥${avgVal.toLocaleString('zh-CN', {minimumFractionDigits: 2})}`;
    maxValueStat.textContent = `¥${maxVal.toLocaleString('zh-CN', {minimumFractionDigits: 2})}`;
}

// 分页相关函数
function changePageSize() {
    pageSize = pageSize_Select.value === 'all' ? 'all' : parseInt(pageSize_Select.value);
    currentPage = 1;
    renderTable();
    updatePagination();
}

function changePage(page) {
    const totalPages = Math.ceil(filteredAssets.length / pageSize);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
        updatePagination();
    }
}

function updatePagination() {
    if (pageSize === 'all') return;
    
    const totalPages = Math.ceil(filteredAssets.length / pageSize);
    
    prevPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= totalPages;
    
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
}

// 模态框相关函数
function showEditModal(id) {
    const asset = assets.find(a => a.id === id);
    if (!asset) {
        showError('找不到要编辑的资产');
        return;
    }
    
    currentEditId = id;
    document.getElementById('editAssetId').value = id;
    document.getElementById('editName').value = asset.name;
    document.getElementById('editCategory').value = asset.category;
    document.getElementById('editValue').value = asset.value;
    document.getElementById('editPurchaseDate').value = asset.purchase_date;
    document.getElementById('editDescription').value = asset.description || '';
    
    editModal.style.display = 'flex';
}

function hideEditModal() {
    editModal.style.display = 'none';
    currentEditId = null;
    editForm.reset();
}

function showDeleteModal(id, name) {
    currentDeleteId = id;
    deleteMessage.textContent = `您确定要删除资产"${name}"吗？此操作无法撤销。`;
    deleteModal.style.display = 'flex';
}

function hideDeleteModal() {
    deleteModal.style.display = 'none';
    currentDeleteId = null;
}

// 处理编辑提交
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const assetData = {
        name: document.getElementById('editName').value.trim(),
        category: document.getElementById('editCategory').value,
        value: parseFloat(document.getElementById('editValue').value),
        purchase_date: document.getElementById('editPurchaseDate').value,
        description: document.getElementById('editDescription').value.trim() || null
    };
    
    // 验证数据
    if (!assetData.name || !assetData.category || !assetData.value || !assetData.purchase_date) {
        showError('请填写所有必填字段');
        return;
    }
    
    if (assetData.value <= 0) {
        showError('资产价值必须大于0');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${currentEditId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assetData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showSuccess('资产更新成功！');
        hideEditModal();
        await loadAssets();
        
    } catch (err) {
        showError('更新资产失败: ' + err.message);
    }
}

// 处理删除确认
async function handleDeleteConfirm() {
    if (!currentDeleteId) return;
    
    try {
        const response = await fetch(`${API_BASE}/${currentDeleteId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showSuccess('资产删除成功！');
        hideDeleteModal();
        await loadAssets();
        
    } catch (err) {
        showError('删除资产失败: ' + err.message);
        hideDeleteModal();
    }
}

// 导出CSV
function exportToCSV() {
    if (filteredAssets.length === 0) {
        showError('没有数据可导出');
        return;
    }
    
    // CSV头部
    const headers = ['ID', '资产名称', '类别', '价值', '购买日期', '描述'];
    
    // CSV数据行
    const rows = filteredAssets.map(asset => [
        asset.id,
        asset.name,
        asset.category,
        asset.value,
        asset.purchase_date,
        asset.description || ''
    ]);
    
    // 构建CSV内容
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    
    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `资产数据_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('CSV文件导出成功！');
}
