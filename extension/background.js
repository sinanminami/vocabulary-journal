// 后台脚本 - 处理扩展的全局事件和右键菜单

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "addToVocabulary",
    title: "添加到生词本: \"%s\"",
    contexts: ["selection"]
  });
  
  // 初始化默认设置
  chrome.storage.sync.set({
    apiUrl: "http://localhost:8000",
    enableAutoLookup: true,
    showTooltip: true
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToVocabulary" && info.selectionText) {
    const word = info.selectionText.trim().toLowerCase();
    
    try {
      await addWordToVocabulary(word, {
        sourceUrl: tab.url,
        sourceContext: info.selectionText
      });
      
      // 通知用户添加成功
      chrome.action.setBadgeText({
        text: "✓",
        tabId: tab.id
      });
      
      setTimeout(() => {
        chrome.action.setBadgeText({
          text: "",
          tabId: tab.id
        });
      }, 2000);
      
    } catch (error) {
      console.error("添加生词失败:", error);
      
      chrome.action.setBadgeText({
        text: "✗",
        tabId: tab.id
      });
      
      setTimeout(() => {
        chrome.action.setBadgeText({
          text: "",
          tabId: tab.id
        });
      }, 2000);
    }
  }
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background收到消息:", message);

  switch (message.type) {
    case "LOOKUP_WORD":
      console.log("处理LOOKUP_WORD消息:", message.word);
      handleWordLookup(message.word)
        .then(definition => {
          console.log("LOOKUP_WORD成功:", definition);
          sendResponse({ success: true, data: definition });
        })
        .catch(error => {
          console.error("LOOKUP_WORD失败:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 保持消息通道开放

    case "ADD_WORD":
      console.log("处理ADD_WORD消息:", message.word, message.context);
      addWordToVocabulary(message.word, message.context)
        .then((result) => {
          console.log("ADD_WORD成功:", result);
          sendResponse({ success: true, data: result });
        })
        .catch(error => {
          console.error("ADD_WORD失败:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "GET_SETTINGS":
      console.log("处理GET_SETTINGS消息");
      chrome.storage.sync.get(null, (settings) => {
        console.log("设置获取成功:", settings);
        sendResponse({ success: true, data: settings });
      });
      return true;

    default:
      console.log("未知消息类型:", message.type);
      sendResponse({ success: false, error: "未知消息类型" });
      return false;
  }
});

// 查询单词释义
async function handleWordLookup(word) {
  const settings = await getSettings();
  const apiUrl = settings.apiUrl || "http://localhost:8000";
  
  const response = await fetch(`${apiUrl}/api/words/${encodeURIComponent(word)}/lookup`);
  
  if (!response.ok) {
    throw new Error(`查询失败: ${response.status}`);
  }
  
  return await response.json();
}

// 添加单词到生词本
async function addWordToVocabulary(word, context = {}) {
  const settings = await getSettings();
  const apiUrl = settings.apiUrl || "http://localhost:8000";
  
  console.log("添加单词到后端:", word, "API URL:", apiUrl);
  
  try {
    const response = await fetch(`${apiUrl}/api/words`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        word: word,
        source_url: context.sourceUrl,
        source_context: context.sourceContext,
        personal_notes: context.personalNotes
      })
    });
    
    console.log("API响应状态:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API错误响应:", errorText);
      throw new Error(`添加失败: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("添加成功:", result);
    return result;
    
  } catch (error) {
    console.error("网络请求失败:", error);
    throw error;
  }
}

// 获取扩展设置
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (settings) => {
      resolve(settings);
    });
  });
}

// 监听扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  // 打开生词管理页面
  const settings = await getSettings();
  const webUrl = settings.webUrl || "http://localhost:5173";
  
  chrome.tabs.create({
    url: webUrl
  });
});