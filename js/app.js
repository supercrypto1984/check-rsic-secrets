/**
 * 钱包地址查询工具主应用逻辑
 */

// 数据URL
const DATA_URL = 'https://rsic.4everland.store/wallet_data.json';

// 全局变量
let walletData = [];
let isDataLoaded = false;

// DOM元素
const loadingOverlay = document.getElementById('loading-overlay');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const dataStatus = document.getElementById('data-status');
const totalAddresses = document.getElementById('total-addresses');
const lastUpdated = document.getElementById('last-updated');

// 单个查询元素
const singleSearch = document.getElementById('single-search');
const singleSearchBtn = document.getElementById('single-search-btn');
const singleResult = document.getElementById('single-result');
const resultAddress = document.getElementById('result-address');
const resultSecrets = document.getElementById('result-secrets');

// 批量查询元素
const batchAddresses = document.getElementById('batch-addresses');
const batchSearchBtn = document.getElementById('batch-search-btn');
const clearBatchBtn = document.getElementById('clear-batch-btn');
const batchResult = document.getElementById('batch-result');
const batchCount = document.getElementById('batch-count');
const batchResultsBody = document.getElementById('batch-results-body');
const exportCsvBtn = document.getElementById('export-csv-btn');

// 标签切换
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// 初始化
document.addEventListener('DOMContentLoaded', init);

// 初始化函数
async function init() {
    // 设置事件监听器
    setupEventListeners();
    
    // 加载数据
    await loadData();
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // 单个查询
    singleSearchBtn.addEventListener('click', performSingleSearch);
    singleSearch.addEventListener('keypress', e => {
        if (e.key === 'Enter') performSingleSearch();
    });
    
    // 批量查询
    batchSearchBtn.addEventListener('click', performBatchSearch);
    clearBatchBtn.addEventListener('click', () => {
        batchAddresses.value = '';
    });
    
    // 导出CSV
    exportCsvBtn.addEventListener('click', exportBatchResults);
}

// 加载数据
async function loadData() {
    try {
        // 显示加载界面
        loadingOverlay.style.display = 'flex';
        dataStatus.textContent = '正在加载...';
        
        // 获取数据
        const response = await fetch(DATA_URL);
        
        // 检查响应
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        // 获取响应大小
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        // 创建响应读取器
        const reader = response.body.getReader();
        let receivedLength = 0;
        let chunks = [];
        
        // 读取数据
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            receivedLength += value.length;
            
            // 更新进度
            if (total) {
                const progress = Math.round((receivedLength / total) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            }
        }
        
        // 合并数据块
        let chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (let chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }
        
        // 转换为文本
        const text = new TextDecoder('utf-8').decode(chunksAll);
        
        // 解析JSON
        walletData = JSON.parse(text);
        
        // 更新状态
        isDataLoaded = true;
        dataStatus.textContent = '已加载完成';
        totalAddresses.textContent = formatNumber(walletData.length);
        lastUpdated.textContent = formatDate(new Date());
        
        // 隐藏加载界面
        loadingOverlay.style.display = 'none';
        
    } catch (error) {
        console.error('加载数据失败:', error);
        dataStatus.textContent = '加载失败';
        loadingOverlay.style.display = 'none';
        alert(`加载数据失败: ${error.message}`);
    }
}

// 执行单个地址查询
function performSingleSearch() {
    const searchTerm = singleSearch.value.trim();
    
    if (!isDataLoaded) {
        alert('数据仍在加载中，请稍候...');
        return;
    }
    
    if (!searchTerm) {
        alert('请输入要查询的钱包地址');
        return;
    }
    
    // 显示加载状态
    showLoading(singleResult);
    
    // 模拟查询延迟
    setTimeout(() => {
        // 查找匹配的地址
        const result = walletData.find(item => 
            item.address.toLowerCase() === searchTerm.toLowerCase()
        );
        
        if (result) {
            // 显示结果
            resultAddress.textContent = result.address;
            resultSecrets.textContent = formatNumber(result.secrets);
            showResult(singleResult, true);
        } else {
            // 显示无结果
            showResult(singleResult, false);
        }
    }, 500);
}

// 执行批量地址查询
function performBatchSearch() {
    const addressesText = batchAddresses.value.trim();
    
    if (!isDataLoaded) {
        alert('数据仍在加载中，请稍候...');
        return;
    }
    
    if (!addressesText) {
        alert('请输入要查询的钱包地址');
        return;
    }
    
    // 解析地址列表
    const addressList = addressesText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (addressList.length === 0) {
        alert('未找到有效的地址');
        return;
    }
    
    // 显示加载状态
    showLoading(batchResult);
    
    // 模拟查询延迟
    setTimeout(() => {
        // 查找匹配的地址
        const results = [];
        
        for (const address of addressList) {
            const match = walletData.find(item => 
                item.address.toLowerCase() === address.toLowerCase()
            );
            
            if (match) {
                results.push(match);
            }
        }
        
        if (results.length > 0) {
            // 更新结果计数
            batchCount.textContent = `(${results.length}/${addressList.length})`;
            
            // 清空表格
            batchResultsBody.innerHTML = '';
            
            // 填充表格
            results.forEach(item => {
                const row = document.createElement('tr');
                
                const addressCell = document.createElement('td');
                addressCell.textContent = item.address;
                
                const secretsCell = document.createElement('td');
                secretsCell.textContent = formatNumber(item.secrets);
                
                row.appendChild(addressCell);
                row.appendChild(secretsCell);
                batchResultsBody.appendChild(row);
            });
            
            // 显示结果
            showResult(batchResult, true);
        } else {
            // 显示无结果
            showResult(batchResult, false);
        }
    }, 800);
}

// 导出批量查询结果
function exportBatchResults() {
    // 获取表格中的所有行
    const rows = batchResultsBody.querySelectorAll('tr');
    
    if (rows.length === 0) {
        alert('没有可导出的数据');
        return;
    }
    
    // 准备导出数据
    const exportData = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const address = cells[0].textContent;
        const secrets = parseInt(cells[1].textContent.replace(/,/g, ''), 10);
        
        exportData.push({ address, secrets });
    });
    
    // 导出为CSV
    exportToCSV(exportData, '钱包地址查询结果.csv');
}
