// 全局变量
let assets = [];
let categoryChart = null;
let valueChart = null;
let timelineChart = null;

// API基础URL
const API_BASE = '/api/assets';

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('chartType').addEventListener('change', updateCategoryChart);
    document.getElementById('timeRange').addEventListener('change', updateTimelineChart);
    document.getElementById('exportReport').addEventListener('click', exportReport);
    document.getElementById('refreshData').addEventListener('click', loadDashboardData);
}

// 显示/隐藏加载状态
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 加载仪表盘数据
async function loadDashboardData() {
    showLoading();
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        assets = await response.json();
        updateMetrics();
        updateCategoryAnalysis();
        updateValueAnalysis();
        updateTimelineAnalysis();
        updateStatusPanels();
        hideLoading();
    } catch (error) {
        console.error('加载数据失败:', error);
        hideLoading();
        showError('加载数据失败，请稍后重试');
    }
}

// 显示错误信息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; font-weight: 500;`;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// 格式化货币
function formatCurrency(amount) {
    return `¥${amount.toLocaleString('zh-CN', {minimumFractionDigits: 2})}`;
}

// 更新核心指标
function updateMetrics() {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const avgValue = totalAssets > 0 ? totalValue / totalAssets : 0;
    const maxAsset = assets.reduce((max, asset) => asset.value > max.value ? asset : max, {value: 0, name: '-'});
    
    document.getElementById('totalAssets').textContent = totalAssets;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('avgValue').textContent = formatCurrency(avgValue);
    document.getElementById('maxValue').textContent = formatCurrency(maxAsset.value);
    document.getElementById('maxAssetName').textContent = maxAsset.name || '-';
}

// 计算类别统计
function calculateCategoryStats() {
    const stats = {};
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    assets.forEach(asset => {
        if (!stats[asset.category]) {
            stats[asset.category] = { count: 0, value: 0, percentage: 0 };
        }
        stats[asset.category].count++;
        stats[asset.category].value += asset.value;
    });
    
    Object.keys(stats).forEach(category => {
        stats[category].percentage = totalValue > 0 ? (stats[category].value / totalValue * 100) : 0;
    });
    
    return stats;
}

// 更新类别分析
function updateCategoryAnalysis() {
    const categoryStats = calculateCategoryStats();
    updateCategoryDetails(categoryStats);
    updateCategoryChart();
}

// 更新类别详情
function updateCategoryDetails(categoryStats) {
    const container = document.getElementById('categoryDetails');
    container.innerHTML = Object.entries(categoryStats).map(([category, stats]) => `
        <div class="category-item ${category}">
            <div class="category-name">${category}</div>
            <div class="category-stats-info">
                <div class="category-count">${stats.count}个</div>
                <div class="category-value">${formatCurrency(stats.value)}</div>
                <div class="category-percentage">${stats.percentage.toFixed(1)}%</div>
            </div>
        </div>
    `).join('');
}

// 更新类别图表
function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const chartType = document.getElementById('chartType').value;
    const categoryStats = calculateCategoryStats();
    
    const data = {
        labels: Object.keys(categoryStats),
        datasets: [{
            data: Object.values(categoryStats).map(stat => stat.count),
            backgroundColor: ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c', '#95a5a6'],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };
    
    const config = {
        type: chartType,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: chartType === 'bar' ? 'top' : 'right' } },
            scales: chartType === 'bar' ? { y: { beginAtZero: true, ticks: { stepSize: 1 } } } : {}
        }
    };
    
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, config);
}

// 更新价值分析
function updateValueAnalysis() {
    updateValueStats();
    updateValueChart();
}

// 更新价值统计
function updateValueStats() {
    const values = assets.map(asset => asset.value);
    if (values.length === 0) {
        ['medianValue', 'stdValue'].forEach(id => document.getElementById(id).textContent = '¥0');
        ['lowValueCount', 'midValueCount', 'highValueCount'].forEach(id => document.getElementById(id).textContent = '0');
        return;
    }
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2 : sortedValues[Math.floor(sortedValues.length / 2)];
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    document.getElementById('medianValue').textContent = formatCurrency(median);
    document.getElementById('stdValue').textContent = formatCurrency(stdDev);
    document.getElementById('lowValueCount').textContent = values.filter(v => v < 1000).length;
    document.getElementById('midValueCount').textContent = values.filter(v => v >= 1000 && v <= 10000).length;
    document.getElementById('highValueCount').textContent = values.filter(v => v > 10000).length;
}

// 更新价值图表
function updateValueChart() {
    const ctx = document.getElementById('valueChart').getContext('2d');
    const ranges = [
        { label: '< ¥1K', min: 0, max: 1000 },
        { label: '¥1K-5K', min: 1000, max: 5000 },
        { label: '¥5K-10K', min: 5000, max: 10000 },
        { label: '¥10K-50K', min: 10000, max: 50000 },
        { label: '> ¥50K', min: 50000, max: Infinity }
    ];
    
    const distribution = ranges.map(range => assets.filter(asset => asset.value >= range.min && asset.value < range.max).length);
    
    if (valueChart) valueChart.destroy();
    valueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{ label: '资产数量', data: distribution, backgroundColor: '#3498db', borderColor: '#2980b9', borderWidth: 1 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// 更新时间趋势分析
function updateTimelineAnalysis() {
    updateTimelineChart();
}

// 更新时间趋势图表
function updateTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    const timeRange = document.getElementById('timeRange').value;
    const timelineData = calculateTimelineData(timeRange);
    
    if (timelineChart) timelineChart.destroy();
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.labels,
            datasets: [{
                label: '新增资产数量',
                data: timelineData.counts,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// 计算时间趋势数据
function calculateTimelineData(timeRange) {
    const timeGroups = {};
    assets.forEach(asset => {
        const date = new Date(asset.purchase_date);
        let key;
        switch (timeRange) {
            case 'year': key = date.getFullYear().toString(); break;
            case 'quarter': key = `${date.getFullYear()}Q${Math.floor(date.getMonth() / 3) + 1}`; break;
            case 'month': key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; break;
        }
        if (!timeGroups[key]) timeGroups[key] = { count: 0 };
        timeGroups[key].count++;
    });
    
    const sortedKeys = Object.keys(timeGroups).sort();
    return { labels: sortedKeys, counts: sortedKeys.map(key => timeGroups[key].count) };
}

// 更新状态面板
function updateStatusPanels() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
    
    const newAssets = assets.filter(asset => new Date(asset.purchase_date) >= thirtyDaysAgo);
    const agingAssets = assets.filter(asset => new Date(asset.purchase_date) <= threeYearsAgo);
    const valuableAssets = assets.filter(asset => asset.value > 10000);
    
    document.getElementById('newAssetsCount').textContent = newAssets.length;
    document.getElementById('activeAssetsCount').textContent = assets.length;
    document.getElementById('agingAssetsCount').textContent = agingAssets.length;
    document.getElementById('valuableAssetsCount').textContent = valuableAssets.length;
    
    updateAssetList('newAssetsList', newAssets.slice(0, 5));
    updateAssetList('agingAssetsList', agingAssets.slice(0, 5));
    updateAssetList('valuableAssetsList', valuableAssets.slice(0, 5));
}

// 更新资产列表
function updateAssetList(containerId, assetList) {
    const container = document.getElementById(containerId);
    container.innerHTML = assetList.map(asset => `
        <div class="status-item">
            <span>${asset.name}</span>
            <span>${formatCurrency(asset.value)}</span>
        </div>
    `).join('');
}

// 导出报告
function exportReport() {
    if (assets.length === 0) {
        showError('没有数据可导出');
        return;
    }
    
    const categoryStats = calculateCategoryStats();
    const reportData = [
        ['资产管理系统 - 数据统计报告'],
        ['生成时间:', new Date().toLocaleString('zh-CN')],
        [''],
        ['核心指标'],
        ['总资产数量', assets.length],
        ['总资产价值', formatCurrency(assets.reduce((sum, asset) => sum + asset.value, 0))],
        [''],
        ['类别分布'],
        ['类别', '数量', '价值', '占比'],
        ...Object.entries(categoryStats).map(([category, stats]) => [
            category, stats.count, formatCurrency(stats.value), `${stats.percentage.toFixed(1)}%`
        ])
    ];
    
    const csvContent = reportData.map(row => 
        Array.isArray(row) ? row.map(field => `"${field}"`).join(',') : `"${row}"`
    ).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `资产统计报告_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    
    showError('报告导出成功！');
}
