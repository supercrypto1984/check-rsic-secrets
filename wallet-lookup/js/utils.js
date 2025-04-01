/**
 * 工具函数集合
 */

// 格式化数字，添加千位分隔符
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 格式化日期
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 导出数据为CSV文件
function exportToCSV(data, filename = 'export.csv') {
    // 创建CSV内容
    let csvContent = "钱包地址,秘密数量\n";
    
    data.forEach(item => {
        csvContent += `${item.address},${item.secrets}\n`;
    });
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    // 添加到DOM并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 显示加载状态
function showLoading(element) {
    if (!element) return;
    
    const loadingContainer = element.querySelector('.loading-container');
    const resultContent = element.querySelector('.result-content');
    const noResult = element.querySelector('.no-result');
    
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (resultContent) resultContent.style.display = 'none';
    if (noResult) noResult.style.display = 'none';
}

// 显示结果
function showResult(element, hasResults = true) {
    if (!element) return;
    
    const loadingContainer = element.querySelector('.loading-container');
    const resultContent = element.querySelector('.result-content');
    const noResult = element.querySelector('.no-result');
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    
    if (hasResults) {
        if (resultContent) resultContent.style.display = 'block';
        if (noResult) noResult.style.display = 'none';
    } else {
        if (resultContent) resultContent.style.display = 'none';
        if (noResult) noResult.style.display = 'block';
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
