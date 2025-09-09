// 全局变量
let assets = [];
let editingAssetId = null;

// DOM元素
const assetForm = document.getElementById('assetForm');
const assetsGrid = document.getElementById('assetsGrid');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const emptyState = document.getElementById('emptyState');
const totalCount = document.getElementById('totalCount');
const totalValue = document.getElementById('totalValue');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const refreshBtn = document.getElementById('refreshBtn');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const deleteModal = document.getElementById('deleteModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');

let deleteAssetId = null;

// API基础URL
const API_BASE = '/api/assets';

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadAssets();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 表单提交
    assetForm.addEventListener('submit', handleFormSubmit);
    
    // 搜索和筛选
    searchInput.addEventListener('input', filterAssets);
    categoryFilter.addEventListener('change', filterAssets);
    
    // 刷新按钮
    refreshBtn.addEventListener('click', loadAssets);
    
    // 取消编辑按钮
    cancelBtn.addEventListener('click', cancelEdit);
    
    // 删除确认模态框
    confirmDelete.addEventListener('click', handleDeleteConfirm);
    cancelDelete.addEventListener('click', hideDeleteModal);
    
    // 点击模态框外部关闭
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });
}

// 显示加载状态
function showLoading() {
    loading.style.display = 'block';
    error.style.display = 'none';
    assetsGrid.style.display = 'none';
    emptyState.style.display = 'none';
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
    // 创建成功消息元素
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // 插入到容器顶部
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);
    
    // 3秒后自动移除
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
        renderAssets(assets);
        updateStats();
        hideLoading();
        
    } catch (err) {
        showError('加载资产数据失败: ' + err.message);
        assets = [];
        updateStats();
    }
}

// 渲染资产列表
function renderAssets(assetsToRender) {
    if (assetsToRender.length === 0) {
        assetsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    assetsGrid.style.display = 'grid';
    
    assetsGrid.innerHTML = assetsToRender.map(asset => `
        <div class="asset-card">
            <div class="asset-category">${asset.category}</div>
            <h3>${escapeHtml(asset.name)}</h3>
            <div class="asset-info">
                <p><strong>价值:</strong> <span class="asset-value">¥${asset.value.toLocaleString('zh-CN', {minimumFractionDigits: 2})}</span></p>
                <p><strong>购买日期:</strong> ${formatDate(asset.purchase_date)}</p>
                ${asset.description ? `<p><strong>描述:</strong> ${escapeHtml(asset.description)}</p>` : ''}
            </div>
            <div class="asset-actions">
                <button class="btn btn-edit" onclick="editAsset(${asset.id})">编辑</button>
                <button class="btn btn-delete" onclick="showDeleteModal(${asset.id})">删除</button>
            </div>
        </div>
    `).join('');
}

// 更新统计信息
function updateStats() {
    const count = assets.length;
    const value = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    totalCount.textContent = count;
    totalValue.textContent = `¥${value.toLocaleString('zh-CN', {minimumFractionDigits: 2})}`;
}

// 筛选资产
function filterAssets() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    
    let filtered = assets;
    
    // 按搜索词筛选
    if (searchTerm) {
        filtered = filtered.filter(asset => 
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.category.toLowerCase().includes(searchTerm) ||
            (asset.description && asset.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // 按类别筛选
    if (selectedCategory) {
        filtered = filtered.filter(asset => asset.category === selectedCategory);
    }
    
    renderAssets(filtered);
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(assetForm);
    const assetData = {
        name: formData.get('name').trim(),
        category: formData.get('category'),
        value: parseFloat(formData.get('value')),
        purchase_date: formData.get('purchase_date'),
        description: formData.get('description').trim() || null
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
        let response;
        if (editingAssetId) {
            // 更新资产
            response = await fetch(`${API_BASE}/${editingAssetId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assetData)
            });
        } else {
            // 创建新资产
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assetData)
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (editingAssetId) {
            showSuccess('资产更新成功！');
        } else {
            showSuccess('资产添加成功！');
        }
        
        // 重置表单和状态
        assetForm.reset();
        cancelEdit();
        
        // 重新加载资产列表
        await loadAssets();
        
    } catch (err) {
        showError(editingAssetId ? '更新资产失败: ' + err.message : '添加资产失败: ' + err.message);
    }
}

// 编辑资产
function editAsset(id) {
    const asset = assets.find(a => a.id === id);
    if (!asset) {
        showError('找不到要编辑的资产');
        return;
    }
    
    // 填充表单
    document.getElementById('name').value = asset.name;
    document.getElementById('category').value = asset.category;
    document.getElementById('value').value = asset.value;
    document.getElementById('purchase_date').value = asset.purchase_date;
    document.getElementById('description').value = asset.description || '';
    
    // 更新UI状态
    editingAssetId = id;
    submitBtn.textContent = '更新资产';
    cancelBtn.style.display = 'inline-block';
    
    // 滚动到表单
    document.querySelector('.add-asset-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// 取消编辑
function cancelEdit() {
    editingAssetId = null;
    submitBtn.textContent = '添加资产';
    cancelBtn.style.display = 'none';
    assetForm.reset();
}

// 显示删除确认模态框
function showDeleteModal(id) {
    deleteAssetId = id;
    deleteModal.style.display = 'flex';
}

// 隐藏删除确认模态框
function hideDeleteModal() {
    deleteAssetId = null;
    deleteModal.style.display = 'none';
}

// 处理删除确认
async function handleDeleteConfirm() {
    if (!deleteAssetId) return;
    
    try {
        const response = await fetch(`${API_BASE}/${deleteAssetId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showSuccess('资产删除成功！');
        hideDeleteModal();
        
        // 重新加载资产列表
        await loadAssets();
        
    } catch (err) {
        showError('删除资产失败: ' + err.message);
        hideDeleteModal();
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
window.editAsset = editAsset;
window.showDeleteModal = showDeleteModal;