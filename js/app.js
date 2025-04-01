/**
 * 钱包地址查询工具主应用逻辑
 */

// 数据URL - 使用相对路径
const DATA_URL = "./wallet_data.json"

// 全局变量
let walletData = []
let addressIndex = {}
let isDataLoaded = false
const dataWorker = null

// DOM元素
const loadingOverlay = document.getElementById("loading-overlay")
const progressBar = document.getElementById("progress-bar")
const progressText = document.getElementById("progress-text")
const debugInfo = document.getElementById("debug-info")
const dataStatus = document.getElementById("data-status")
const totalAddresses = document.getElementById("total-addresses")
const lastUpdated = document.getElementById("last-updated")

// 单个查询元素
const singleSearch = document.getElementById("single-search")
const singleSearchBtn = document.getElementById("single-search-btn")
const singleResult = document.getElementById("single-result")
const resultAddress = document.getElementById("result-address")
const resultSecrets = document.getElementById("result-secrets")

// 批量查询元素
const batchAddresses = document.getElementById("batch-addresses")
const batchSearchBtn = document.getElementById("batch-search-btn")
const clearBatchBtn = document.getElementById("clear-batch-btn")
const batchResult = document.getElementById("batch-result")
const batchCount = document.getElementById("batch-count")
const batchResultsBody = document.getElementById("batch-results-body")
const exportCsvBtn = document.getElementById("export-csv-btn")

// 标签切换
const tabBtns = document.querySelectorAll(".tab-btn")
const tabContents = document.querySelectorAll(".tab-content")

// 查询结果缓存
const searchCache = new Map()
const batchResultsCache = []

// 翻译函数 (示例，需要根据实际情况修改)
function getTranslation(key) {
  const translations = {
    dataLoading: "数据加载中...",
    dataLoaded: "数据加载完成",
    dataLoadFailed: "数据加载失败",
  }
  return translations[key] || key // 如果找不到翻译，返回原始key
}

// 格式化数字
function formatNumber(number) {
  return number.toLocaleString()
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// 初始化
document.addEventListener("DOMContentLoaded", init)

// 初始化函数
function init() {
  // 设置事件监听器
  setupEventListeners()

  // 直接加载数据，不使用Web Worker
  loadDataDirect()
}

// 设置事件监听器
function setupEventListeners() {
  // 标签切换
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab")

      // 更新按钮状态
      tabBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      // 更新内容显示
      tabContents.forEach((content) => {
        content.classList.remove("active")
        if (content.id === `${tabId}-tab`) {
          content.classList.add("active")
        }
      })
    })
  })

  // 单个查询
  singleSearchBtn.addEventListener("click", performSingleSearch)
  singleSearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSingleSearch()
  })

  // 批量查询
  batchSearchBtn.addEventListener("click", performBatchSearch)
  clearBatchBtn.addEventListener("click", () => {
    batchAddresses.value = ""
  })

  // 导出CSV
  exportCsvBtn.addEventListener("click", exportBatchResults)
}

// 直接加载数据，不使用Web Worker
async function loadDataDirect() {
  try {
    // 显示加载界面
    loadingOverlay.style.display = "flex"
    dataStatus.textContent = getTranslation("dataLoading")
    debugInfo.textContent = "开始加载数据..."

    // 获取数据
    const response = await fetch(DATA_URL)

    // 检查响应
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    // 获取响应大小
    const contentLength = response.headers.get("content-length")
    const total = contentLength ? Number.parseInt(contentLength, 10) : 0

    debugInfo.textContent = `获取到响应，大小: ${total} 字节`

    // 读取数据
    const text = await response.text()
    debugInfo.textContent = `读取到数据，长度: ${text.length} 字符`

    // 解析JSON
    try {
      debugInfo.textContent = "正在解析JSON..."
      let data = JSON.parse(text)

      // 检查数据格式
      if (!Array.isArray(data)) {
        debugInfo.textContent = "警告: 数据不是数组，尝试转换..."
        // 如果不是数组，尝试将其作为单个对象处理
        data = [data]
      }

      // 确保每个项目都有address和secrets属性
      walletData = data
        .map((item) => {
          // 如果是字符串，尝试解析
          if (typeof item === "string") {
            try {
              item = JSON.parse(item)
            } catch (e) {
              // 如果解析失败，创建一个空对象
              item = {}
            }
          }

          return {
            address: item.address || "",
            secrets: item.secrets || 0,
          }
        })
        .filter((item) => item.address) // 过滤掉没有地址的项目

      debugInfo.textContent = `处理后的数据项数: ${walletData.length}`

      // 创建地址索引
      addressIndex = {}
      for (let i = 0; i < walletData.length; i++) {
        const item = walletData[i]
        addressIndex[item.address.toLowerCase()] = i
      }

      isDataLoaded = true

      // 更新状态
      dataStatus.textContent = getTranslation("dataLoaded")
      totalAddresses.textContent = formatNumber(walletData.length)
      lastUpdated.textContent = formatDate(new Date())

      debugInfo.textContent = `成功加载 ${walletData.length} 条记录。索引大小: ${Object.keys(addressIndex).length}`

      // 隐藏加载界面
      loadingOverlay.style.display = "none"
    } catch (parseError) {
      throw new Error("解析JSON失败: " + parseError.message)
    }
  } catch (error) {
    handleError(error.message)
  }
}

// 处理错误
function handleError(message) {
  console.error("错误:", message)
  dataStatus.textContent = getTranslation("dataLoadFailed")
  debugInfo.textContent = "错误: " + message
  // 不要隐藏加载界面，以便用户可以看到错误信息
  // loadingOverlay.style.display = 'none';
  alert(`操作失败: ${message}`)
}

// 执行单个地址查询
function performSingleSearch() {
  const searchTerm = singleSearch.value.trim()

  if (!isDataLoaded) {
    alert("数据仍在加载中，请稍候...")
    return
  }

  if (!searchTerm) {
    alert("请输入要查询的钱包地址")
    return
  }

  // 检查缓存
  if (searchCache.has(searchTerm.toLowerCase())) {
    const cachedResult = searchCache.get(searchTerm.toLowerCase())
    displaySingleResult(cachedResult)
    return
  }

  // 显示加载状态
  const loadingContainer = singleResult.querySelector(".loading-container")
  const resultContent = singleResult.querySelector(".result-content")
  const noResult = singleResult.querySelector(".no-result")
  const initialMessage = singleResult.querySelector(".initial-message")

  if (loadingContainer) loadingContainer.style.display = "flex"
  if (resultContent) resultContent.style.display = "none"
  if (noResult) noResult.style.display = "none"
  if (initialMessage) initialMessage.style.display = "none"

  // 在主线程中搜索
  setTimeout(() => {
    const lowerAddress = searchTerm.toLowerCase()
    const index = addressIndex[lowerAddress]

    let result = null
    if (index !== undefined) {
      result = walletData[index]
    }

    // 缓存结果
    searchCache.set(lowerAddress, result)

    // 显示结果
    displaySingleResult(result)
  }, 100)
}

// 显示单个查询结果
function displaySingleResult(result) {
  const loadingContainer = singleResult.querySelector(".loading-container")
  const resultContent = singleResult.querySelector(".result-content")
  const noResult = singleResult.querySelector(".no-result")
  const initialMessage = singleResult.querySelector(".initial-message")

  if (loadingContainer) loadingContainer.style.display = "none"
  if (initialMessage) initialMessage.style.display = "none"

  if (result) {
    // 显示结果
    resultAddress.textContent = result.address
    resultSecrets.textContent = formatNumber(result.secrets)

    if (resultContent) resultContent.style.display = "block"
    if (noResult) noResult.style.display = "none"
  } else {
    // 显示无结果
    if (resultContent) resultContent.style.display = "none"
    if (noResult) noResult.style.display = "block"
  }
}

// 执行批量地址查询
function performBatchSearch() {
  const addressesText = batchAddresses.value.trim()

  if (!isDataLoaded) {
    alert("数据仍在加载中，请稍候...")
    return
  }

  if (!addressesText) {
    alert("请输入要查询的钱包地址")
    return
  }

  // 解析地址列表
  const addressList = addressesText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (addressList.length === 0) {
    alert("未找到有效的地址")
    return
  }

  // 显示加载状态
  const loadingContainer = batchResult.querySelector(".loading-container")
  const resultContent = batchResult.querySelector(".result-content")
  const noResult = batchResult.querySelector(".no-result")
  const initialMessage = batchResult.querySelector(".initial-message")

  if (loadingContainer) loadingContainer.style.display = "flex"
  if (resultContent) resultContent.style.display = "none"
  if (noResult) noResult.style.display = "none"
  if (initialMessage) initialMessage.style.display = "none"

  // 清空之前的结果缓存
  batchResultsCache.length = 0

  // 在主线程中搜索
  setTimeout(() => {
    const results = []

    for (const address of addressList) {
      const lowerAddress = address.toLowerCase()
      const index = addressIndex[lowerAddress]

      if (index !== undefined) {
        results.push(walletData[index])
      }
    }

    // 缓存结果
    batchResultsCache.push(...results)

    // 显示结果
    if (results.length > 0) {
      // 更新结果计数
      batchCount.textContent = `(${results.length}/${addressList.length})`

      // 清空表格
      batchResultsBody.innerHTML = ""

      // 填充表格
      results.forEach((item) => {
        const row = document.createElement("tr")

        const addressCell = document.createElement("td")
        addressCell.textContent = item.address

        const secretsCell = document.createElement("td")
        secretsCell.textContent = formatNumber(item.secrets)

        row.appendChild(addressCell)
        row.appendChild(secretsCell)
        batchResultsBody.appendChild(row)
      })

      // 显示结果
      if (loadingContainer) loadingContainer.style.display = "none"
      if (resultContent) resultContent.style.display = "block"
      if (noResult) noResult.style.display = "none"
    } else {
      // 显示无结果
      if (loadingContainer) loadingContainer.style.display = "none"
      if (resultContent) resultContent.style.display = "none"
      if (noResult) noResult.style.display = "block"
    }
  }, 100)
}

// 导出批量查询结果
function exportBatchResults() {
  if (batchResultsCache.length === 0) {
    alert("没有可导出的数据")
    return
  }

  // 创建CSV内容
  let csvContent = "钱包地址,SECRETS数量\n"

  batchResultsCache.forEach((item) => {
    csvContent += `${item.address},${item.secrets}\n`
  })

  // 创建Blob对象
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  // 创建下载链接
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", "RSIC_SECRETS查询结果.csv")
  link.style.display = "none"

  // 添加到DOM并触发点击
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

