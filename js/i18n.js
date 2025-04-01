/**
 * 国际化支持
 */

// 语言包
const translations = {
  zh: {
    title: "RSIC SECRETS 查询工具",
    singleSearchTab: "单个地址查询",
    batchSearchTab: "批量地址查询",
    walletAddressLabel: "钱包地址",
    searchBtnText: "查询",
    searchingText: "查询中...",
    searchResultTitle: "查询结果",
    addressLabel: "钱包地址",
    secretsLabel: "SECRETS数量",
    noMatchText: "未找到匹配的地址",
    pleaseEnterAddress: "请输入钱包地址进行查询",
    batchSearchBtnText: "批量查询",
    clearBtnText: "清空",
    batchSearchingText: "查询中...",
    batchResultTitle: "批量查询结果",
    exportBtnText: "导出CSV",
    tableAddressHeader: "钱包地址",
    tableSecretsHeader: "SECRETS数量",
    batchNoMatchText: "未找到匹配的地址",
    batchPleaseEnterAddress: "请输入钱包地址进行批量查询",
    dataStatusLabel: "数据状态",
    totalAddressesLabel: "总地址数",
    lastUpdatedLabel: "最后更新",
    loadingDatabaseText: "正在加载数据库...",
    batchInputPlaceholder: "输入多个钱包地址，每行一个...",
    singleInputPlaceholder: "输入钱包地址...",
    dataLoading: "加载中...",
    dataLoaded: "已加载完成",
    dataLoadFailed: "加载失败",
  },
  en: {
    title: "RSIC SECRETS Lookup Tool",
    singleSearchTab: "Single Address Lookup",
    batchSearchTab: "Batch Address Lookup",
    walletAddressLabel: "Wallet Address",
    searchBtnText: "Search",
    searchingText: "Searching...",
    searchResultTitle: "Search Result",
    addressLabel: "Wallet Address",
    secretsLabel: "SECRETS Count",
    noMatchText: "No matching address found",
    pleaseEnterAddress: "Please enter a wallet address to search",
    batchSearchBtnText: "Batch Search",
    clearBtnText: "Clear",
    batchSearchingText: "Searching...",
    batchResultTitle: "Batch Search Results",
    exportBtnText: "Export CSV",
    tableAddressHeader: "Wallet Address",
    tableSecretsHeader: "SECRETS Count",
    batchNoMatchText: "No matching addresses found",
    batchPleaseEnterAddress: "Please enter wallet addresses for batch search",
    dataStatusLabel: "Data Status",
    totalAddressesLabel: "Total Addresses",
    lastUpdatedLabel: "Last Updated",
    loadingDatabaseText: "Loading database...",
    batchInputPlaceholder: "Enter multiple wallet addresses, one per line...",
    singleInputPlaceholder: "Enter wallet address...",
    dataLoading: "Loading...",
    dataLoaded: "Loaded",
    dataLoadFailed: "Load Failed",
  },
}

// 当前语言
let currentLang = "zh"

// DOM元素
const langZhBtn = document.getElementById("lang-zh")
const langEnBtn = document.getElementById("lang-en")

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  // 设置语言切换事件
  langZhBtn.addEventListener("click", () => setLanguage("zh"))
  langEnBtn.addEventListener("click", () => setLanguage("en"))

  // 初始化语言
  setLanguage(currentLang)
})

// 设置语言
function setLanguage(lang) {
  currentLang = lang

  // 更新按钮状态
  langZhBtn.classList.toggle("active", lang === "zh")
  langEnBtn.classList.toggle("active", lang === "en")

  // 更新所有文本
  updateAllTexts()

  // 更新占位符
  document.getElementById("single-search").placeholder = translations[lang].singleInputPlaceholder
  document.getElementById("batch-addresses").placeholder = translations[lang].batchInputPlaceholder

  // 更新数据状态文本
  const dataStatus = document.getElementById("data-status")
  if (dataStatus.textContent.includes("加载中")) {
    dataStatus.textContent = translations[lang].dataLoading
  } else if (dataStatus.textContent.includes("已加载完成")) {
    dataStatus.textContent = translations[lang].dataLoaded
  } else if (dataStatus.textContent.includes("加载失败")) {
    dataStatus.textContent = translations[lang].dataLoadFailed
  }
}

// 更新所有文本
function updateAllTexts() {
  // 更新所有带有特定类的元素
  const elements = document.querySelectorAll(
    '[class*="-text"], [class*="-label"], [class*="-title"], [class*="-header"], [class*="-tab"]',
  )

  elements.forEach((el) => {
    const classes = el.className.split(" ")

    for (const cls of classes) {
      const key = convertClassToKey(cls)
      if (key && translations[currentLang][key]) {
        el.textContent = translations[currentLang][key]
        break
      }
    }
  })

  // 直接更新初始消息元素
  const initialMessages = document.querySelectorAll(".initial-message p")
  initialMessages.forEach((el) => {
    if (currentLang === "zh") {
      el.textContent = translations.zh.pleaseEnterAddress
    } else {
      el.textContent = translations.en.pleaseEnterAddress
    }
  })

  // 更新批量查询的初始消息
  const batchInitialMessage = document.querySelector("#batch-tab .initial-message p")
  if (batchInitialMessage) {
    if (currentLang === "zh") {
      batchInitialMessage.textContent = translations.zh.batchPleaseEnterAddress
    } else {
      batchInitialMessage.textContent = translations.en.batchPleaseEnterAddress
    }
  }

  // 更新无结果消息
  const noResults = document.querySelectorAll(".no-result p")
  noResults.forEach((el) => {
    if (currentLang === "zh") {
      el.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + translations.zh.noMatchText
    } else {
      el.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + translations.en.noMatchText
    }
  })

  // 更新批量查询的无结果消息
  const batchNoResult = document.querySelector("#batch-tab .no-result p")
  if (batchNoResult) {
    if (currentLang === "zh") {
      batchNoResult.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + translations.zh.batchNoMatchText
    } else {
      batchNoResult.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + translations.en.batchNoMatchText
    }
  }
}

// 将类名转换为翻译键
function convertClassToKey(className) {
  const keyMap = {
    "title-text": "title",
    "single-search-tab": "singleSearchTab",
    "batch-search-tab": "batchSearchTab",
    "wallet-address-label": "walletAddressLabel",
    "search-btn-text": "searchBtnText",
    "searching-text": "searchingText",
    "search-result-title": "searchResultTitle",
    "address-label": "addressLabel",
    "secrets-label": "secretsLabel",
    "no-match-text": "noMatchText",
    "please-enter-address": "pleaseEnterAddress",
    "batch-search-btn-text": "batchSearchBtnText",
    "clear-btn-text": "clearBtnText",
    "batch-searching-text": "batchSearchingText",
    "batch-result-title": "batchResultTitle",
    "export-btn-text": "exportBtnText",
    "table-address-header": "tableAddressHeader",
    "table-secrets-header": "tableSecretsHeader",
    "batch-no-match-text": "batchNoMatchText",
    "batch-please-enter-address": "batchPleaseEnterAddress",
    "data-status-label": "dataStatusLabel",
    "total-addresses-label": "totalAddressesLabel",
    "last-updated-label": "lastUpdatedLabel",
    "loading-database-text": "loadingDatabaseText",
  }

  return keyMap[className]
}

// 导出函数，用于其他JS文件
function getTranslation(key) {
  return translations[currentLang][key] || key
}

