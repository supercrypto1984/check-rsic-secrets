/**
 * 钱包地址查询工具主应用逻辑
 */

// 数据URL
const DATA_URL = "wallet_data.json"

// 全局变量
let walletData = []
let addressIndex = {}
let isDataLoaded = false
let dataWorker = null

// DOM元素
const loadingOverlay = document.getElementById("loading-overlay")
const progressBar = document.getElementById("progress-bar")
const progressText = document.getElementById("progress-text")
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

// 显示加载状态
function showLoading(element) {
  element.textContent = "加载中..."
}

// 显示结果
function showResult(element, hasResults) {
  if (hasResults) {
    element.style.display = "block"
    element.textContent = "" // 清空加载中...
  } else {
    element.style.display = "block"
    element.textContent = "未找到相关结果"
  }
}

// 导出为CSV
function exportToCSV(data, filename) {
  const csvRows = []
  const headers = Object.keys(data[0])
  csvRows.push(headers.join(","))

  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = ("" + row[header]).replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(","))
  }

  const csvData = csvRows.join("\n")
  const blob = new Blob([csvData], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.setAttribute("href", url)
  a.setAttribute("download", filename)
  a.click()
}

// 初始化
document.addEventListener("DOMContentLoaded", init)

// 初始化函数
function init() {
  // 设置事件监听器
  setupEventListeners()

  // 初始化Web Worker
  initWorker()

  // 加载数据
  loadData()
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

// 修改Web Worker初始化，确保正确的路径
function initWorker() {
  try {
    dataWorker = new Worker("./js/data-worker.js")

    dataWorker.addEventListener("message", (e) => {
      const { type, data } = e.data

      switch (type) {
        case "progress":
          updateProgress(data.progress)
          break
        case "load-complete":
          handleDataLoaded(data)
          break
        case "search-complete":
          handleSearchComplete(data)
          break
        case "batch-search-complete":
          handleBatchSearchComplete(data)
          break
        case "error":
          handleError(data.message)
          break
      }
    })

    // 添加错误处理
    dataWorker.addEventListener("error", (e) => {
      handleError("Worker错误: " + e.message)
    })
  } catch (error) {
    handleError("无法创建Web Worker: " + error.message)
    // 回退到主线程加载
    loadDataFallback()
  }
}

// 加载数据
function loadData() {
  // 显示加载界面
  loadingOverlay.style.display = "flex"
  dataStatus.textContent = "正在加载..."

  // 使用Web Worker加载数据
  dataWorker.postMessage({
    type: "load",
    data: { url: DATA_URL },
  })
}

// 添加回退加载函数
async function loadDataFallback() {
  try {
    dataStatus.textContent = "正在加载(回退模式)..."
    document.getElementById("debug-info").textContent = "使用回退模式加载数据..."

    const response = await fetch(DATA_URL)
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    const text = await response.text()
    let walletData

    try {
      walletData = JSON.parse(text)

      // 确保数据是数组
      if (!Array.isArray(walletData)) {
        walletData = [walletData]
      }

      // 处理数据格式
      walletData = walletData
        .map((item) => {
          if (typeof item === "string") {
            try {
              item = JSON.parse(item)
            } catch (e) {
              item = {}
            }
          }

          return {
            address: item.address || "",
            secrets: item.secrets || 0,
          }
        })
        .filter((item) => item.address)

      // 创建索引
      const addressIndex = {}
      for (let i = 0; i < walletData.length; i++) {
        addressIndex[walletData[i].address.toLowerCase()] = i
      }

      // 更新全局变量
      window.walletData = walletData
      window.addressIndex = addressIndex
      isDataLoaded = true

      // 更新UI
      dataStatus.textContent = "已加载完成(回退模式)"
      totalAddresses.textContent = formatNumber(walletData.length)
      lastUpdated.textContent = formatDate(new Date())
      document.getElementById("debug-info").textContent = `回退模式: 成功加载 ${walletData.length} 条记录。`

      // 隐藏加载界面
      loadingOverlay.style.display = "none"
    } catch (error) {
      throw new Error("解析JSON失败: " + error.message)
    }
  } catch (error) {
    handleError(error.message)
  }
}

// 更新进度
function updateProgress(progress) {
  progressBar.style.width = `${progress}%`
  progressText.textContent = `${progress}%`
}

// 处理数据加载完成
function handleDataLoaded(data) {
  walletData = data.walletData
  addressIndex = data.addressIndex
  isDataLoaded = true

  // 更新状态
  dataStatus.textContent = "已加载完成"
  totalAddresses.textContent = formatNumber(data.count)
  lastUpdated.textContent = formatDate(new Date())

  // 添加调试信息
  document.getElementById("debug-info").textContent = `成功加载 ${data.count} 条记录。第一条: ${
    data.walletData.length > 0 ? JSON.stringify(data.walletData[0]).substring(0, 50) + "..." : "无数据"
  }`

  // 隐藏加载界面
  loadingOverlay.style.display = "none"
}

// 添加调试功能
function handleError(message) {
  console.error("错误:", message)
  dataStatus.textContent = "加载失败"
  document.getElementById("debug-info").textContent = "错误: " + message
  // 不要隐藏加载界面，以便用户可以看到错误信息
  // loadingOverlay.style.display = 'none';
  alert(`操作失败: ${message}`)
}

// 修改单个查询函数，添加回退模式支持
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

  // 如果Worker可用，使用Worker搜索
  if (dataWorker) {
    dataWorker.postMessage({
      type: "search",
      data: {
        address: searchTerm,
        walletData,
        addressIndex,
      },
    })
  } else {
    // 回退模式：在主线程中搜索
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
}

// 处理搜索完成
function handleSearchComplete(data) {
  const result = data.result

  // 缓存结果
  if (result) {
    searchCache.set(result.address.toLowerCase(), result)
  } else {
    searchCache.set(singleSearch.value.trim().toLowerCase(), null)
  }

  // 显示结果
  displaySingleResult(result)
}

// 修改显示单个查询结果函数
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

// 修改批量查询函数，添加回退模式支持
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

  // 如果Worker可用，使用Worker搜索
  if (dataWorker) {
    dataWorker.postMessage({
      type: "batch-search",
      data: {
        addresses: addressList,
        walletData,
        addressIndex,
      },
    })
  } else {
    // 回退模式：在主线程中搜索
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
}

// 处理批量搜索完成
function handleBatchSearchComplete(data) {
  const { results, total } = data

  // 缓存结果
  batchResultsCache.push(...results)

  // 显示结果
  if (results.length > 0) {
    // 更新结果计数
    batchCount.textContent = `(${results.length}/${total})`

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
    showResult(batchResult, true)
  } else {
    // 显示无结果
    showResult(batchResult, false)
  }
}

// 导出批量查询结果
function exportBatchResults() {
  if (batchResultsCache.length === 0) {
    alert("没有可导出的数据")
    return
  }

  // 导出为CSV
  exportToCSV(batchResultsCache, "钱包地址查询结果.csv")
}

