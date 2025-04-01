/**
 * Web Worker for data processing
 */
self.addEventListener("message", (e) => {
  const { type, data } = e.data

  switch (type) {
    case "load":
      loadData(data.url)
      break
    case "search":
      searchAddress(data.address, data.walletData, data.addressIndex)
      break
    case "batch-search":
      batchSearch(data.addresses, data.walletData, data.addressIndex)
      break
  }
})

// 加载数据
async function loadData(url) {
  try {
    // 获取数据
    const response = await fetch(url)

    // 检查响应
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    // 获取响应大小
    const contentLength = response.headers.get("content-length")
    const total = contentLength ? Number.parseInt(contentLength, 10) : 0

    // 创建响应读取器
    const reader = response.body.getReader()
    let receivedLength = 0
    const chunks = []

    // 读取数据
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      chunks.push(value)
      receivedLength += value.length

      // 更新进度
      if (total) {
        const progress = Math.round((receivedLength / total) * 100)
        self.postMessage({ type: "progress", data: { progress } })
      }
    }

    // 合并数据块
    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    // 转换为文本
    const text = new TextDecoder("utf-8").decode(chunksAll)

    // 解析JSON
    const walletData = JSON.parse(text)

    // 创建地址索引
    const addressIndex = {}
    for (let i = 0; i < walletData.length; i++) {
      const item = walletData[i]
      addressIndex[item.address.toLowerCase()] = i
    }

    // 发送数据
    self.postMessage({
      type: "load-complete",
      data: {
        walletData,
        addressIndex,
        count: walletData.length,
      },
    })
  } catch (error) {
    self.postMessage({ type: "error", data: { message: error.message } })
  }
}

// 搜索单个地址
function searchAddress(address, walletData, addressIndex) {
  try {
    const lowerAddress = address.toLowerCase()
    const index = addressIndex[lowerAddress]

    if (index !== undefined) {
      const result = walletData[index]
      self.postMessage({ type: "search-complete", data: { result } })
    } else {
      self.postMessage({ type: "search-complete", data: { result: null } })
    }
  } catch (error) {
    self.postMessage({ type: "error", data: { message: error.message } })
  }
}

// 批量搜索地址
function batchSearch(addresses, walletData, addressIndex) {
  try {
    const results = []

    for (const address of addresses) {
      const lowerAddress = address.toLowerCase()
      const index = addressIndex[lowerAddress]

      if (index !== undefined) {
        results.push(walletData[index])
      }
    }

    self.postMessage({
      type: "batch-search-complete",
      data: {
        results,
        total: addresses.length,
      },
    })
  } catch (error) {
    self.postMessage({ type: "error", data: { message: error.message } })
  }
}

