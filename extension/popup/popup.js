// 扩展弹窗脚本

class PopupController {
  constructor() {
    this.apiUrl = "http://localhost:8000";
    this.webUrl = "http://localhost:5173";
    this.currentSearchResult = null;
    
    this.init();
  }
  
  async init() {
    // 获取设置
    const settings = await this.getSettings();
    this.apiUrl = settings.apiUrl || this.apiUrl;
    this.webUrl = settings.webUrl || this.webUrl;
    
    // 绑定事件
    this.bindEvents();
    
    // 加载数据
    this.loadRecentWords();
    this.loadStats();
  }
  
  bindEvents() {
    // 搜索功能
    document.getElementById("quickSearch").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchWord();
      }
    });
    
    document.getElementById("searchBtn").addEventListener("click", () => {
      this.searchWord();
    });
    
    // 打开Web应用
    document.getElementById("openWebApp").addEventListener("click", () => {
      chrome.tabs.create({ url: this.webUrl });
      window.close();
    });
    
    // 打开设置
    document.getElementById("openSettings").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });

    // 调试工具
    document.getElementById("testAddWord").addEventListener("click", () => {
      this.testAddWord();
    });

    document.getElementById("checkStatus").addEventListener("click", () => {
      this.checkStatus();
    });

    document.getElementById("testChromeAPI").addEventListener("click", () => {
      this.testChromeAPI();
    });

    document.getElementById("testDirectAPI").addEventListener("click", () => {
      this.testDirectAPI();
    });
    
    // 模态框
    document.getElementById("closeModal").addEventListener("click", () => {
      this.hideSearchResult();
    });
    
    document.getElementById("addWordBtn").addEventListener("click", () => {
      this.addCurrentWord();
    });
    
    // 点击模态框外部关闭
    document.getElementById("searchResult").addEventListener("click", (e) => {
      if (e.target.id === "searchResult") {
        this.hideSearchResult();
      }
    });
  }
  
  async searchWord() {
    const input = document.getElementById("quickSearch");
    const word = input.value.trim().toLowerCase();
    
    if (!word) return;
    
    try {
      // 显示加载状态
      const searchBtn = document.getElementById("searchBtn");
      const originalText = searchBtn.textContent;
      searchBtn.textContent = "查询中...";
      searchBtn.disabled = true;
      
      // 查询单词
      const response = await fetch(`${this.apiUrl}/api/words/${encodeURIComponent(word)}/lookup`);
      
      if (response.ok) {
        const definition = await response.json();
        this.showSearchResult(definition);
        input.value = ""; // 清空输入框
      } else {
        this.showError("查询失败，请稍后重试");
      }
      
      // 恢复按钮状态
      searchBtn.textContent = originalText;
      searchBtn.disabled = false;
      
    } catch (error) {
      console.error("搜索失败:", error);
      this.showError("网络错误，请检查连接");
      
      // 恢复按钮状态
      const searchBtn = document.getElementById("searchBtn");
      searchBtn.textContent = "查询";
      searchBtn.disabled = false;
    }
  }
  
  showSearchResult(definition) {
    this.currentSearchResult = definition;
    
    // 填充结果
    document.getElementById("resultWord").textContent = definition.word;
    
    // 构建释义HTML
    const definitionsHtml = definition.definitions
      .slice(0, 5)
      .map(def => `
        <div class="definition-item">
          ${def.partOfSpeech ? `<span class="definition-pos">${def.partOfSpeech}</span>` : ""}
          <div class="definition-meaning">${def.meaning}</div>
          ${def.example ? `<div class="definition-example">${def.example}</div>` : ""}
        </div>
      `).join("");
    
    let contentHtml = `
      <div class="definition-header">
        <h5>${definition.word}</h5>
        ${definition.pronunciation ? `<span class="pronunciation">${definition.pronunciation}</span>` : ""}
      </div>
      <div class="definitions">
        ${definitionsHtml}
      </div>
    `;
    
    if (definition.examples && definition.examples.length > 0) {
      contentHtml += `
        <div class="examples">
          <h6>例句:</h6>
          ${definition.examples.slice(0, 2).map(ex => `<p class="example">${ex}</p>`).join("")}
        </div>
      `;
    }
    
    document.getElementById("resultContent").innerHTML = contentHtml;
    document.getElementById("searchResult").style.display = "flex";
  }
  
  hideSearchResult() {
    document.getElementById("searchResult").style.display = "none";
    this.currentSearchResult = null;
  }
  
  async addCurrentWord() {
    if (!this.currentSearchResult) return;
    
    try {
      const addBtn = document.getElementById("addWordBtn");
      const originalText = addBtn.textContent;
      addBtn.textContent = "添加中...";
      addBtn.disabled = true;
      
      // 获取当前标签页信息
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await fetch(`${this.apiUrl}/api/words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word: this.currentSearchResult.word,
          source_url: tab?.url,
          source_context: `从扩展弹窗手动添加`,
          personal_notes: ""
        })
      });
      
      if (response.ok) {
        this.showSuccess("已添加到生词本");
        this.hideSearchResult();
        // 刷新最近单词列表
        setTimeout(() => this.loadRecentWords(), 500);
        setTimeout(() => this.loadStats(), 500);
      } else {
        this.showError("添加失败，请稍后重试");
      }
      
      // 恢复按钮状态
      addBtn.textContent = originalText;
      addBtn.disabled = false;
      
    } catch (error) {
      console.error("添加单词失败:", error);
      this.showError("网络错误，请稍后重试");
      
      // 恢复按钮状态
      const addBtn = document.getElementById("addWordBtn");
      addBtn.textContent = "添加到生词本";
      addBtn.disabled = false;
    }
  }
  
  async loadRecentWords() {
    try {
      const response = await fetch(`${this.apiUrl}/api/words?limit=5`);
      
      if (response.ok) {
        const words = await response.json();
        this.renderRecentWords(words);
      } else {
        this.showRecentWordsError();
      }
    } catch (error) {
      console.error("加载最近单词失败:", error);
      this.showRecentWordsError();
    }
  }
  
  renderRecentWords(words) {
    const container = document.getElementById("recentWords");
    
    if (words.length === 0) {
      container.innerHTML = '<div class="empty">暂无生词记录</div>';
      return;
    }
    
    const wordsHtml = words.map(word => {
      const timeAgo = this.getTimeAgo(new Date(word.created_at));
      return `
        <div class="word-item">
          <div class="word-info">
            <div class="word-text">${word.word}</div>
            <div class="word-time">${timeAgo}</div>
          </div>
          <div class="word-actions">
            <button class="action-btn" onclick="popupController.removeWord(${word.id})" title="删除">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join("");
    
    container.innerHTML = wordsHtml;
  }
  
  showRecentWordsError() {
    document.getElementById("recentWords").innerHTML = 
      '<div class="empty">加载失败，请检查后端服务</div>';
  }
  
  async loadStats() {
    try {
      const response = await fetch(`${this.apiUrl}/api/words?limit=1000`);
      
      if (response.ok) {
        const words = await response.json();
        
        const total = words.length;
        const today = new Date();
        const todayWords = words.filter(word => {
          const wordDate = new Date(word.created_at);
          return wordDate.toDateString() === today.toDateString();
        }).length;
        
        document.getElementById("totalWords").textContent = total;
        document.getElementById("todayWords").textContent = todayWords;
      } else {
        document.getElementById("totalWords").textContent = "?";
        document.getElementById("todayWords").textContent = "?";
      }
    } catch (error) {
      console.error("加载统计失败:", error);
      document.getElementById("totalWords").textContent = "?";
      document.getElementById("todayWords").textContent = "?";
    }
  }
  
  async removeWord(wordId) {
    if (!confirm("确定要删除这个单词吗？")) return;
    
    try {
      const response = await fetch(`${this.apiUrl}/api/words/${wordId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        this.showSuccess("删除成功");
        // 刷新列表
        setTimeout(() => this.loadRecentWords(), 300);
        setTimeout(() => this.loadStats(), 300);
      } else {
        this.showError("删除失败");
      }
    } catch (error) {
      console.error("删除单词失败:", error);
      this.showError("网络错误");
    }
  }
  
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString("zh-CN");
  }
  
  showSuccess(message) {
    this.showToast(message, "success");
  }
  
  showError(message) {
    this.showToast(message, "error");
  }
  
  showToast(message, type) {
    // 移除现有的toast
    const existingToast = document.querySelector(".toast");
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === "success" ? "#10b981" : "#ef4444"};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 2000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
  
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (settings) => {
        resolve(settings || {});
      });
    });
  }

  // 调试工具方法
  async testAddWord() {
    const debugStatus = document.getElementById("debugStatus");
    debugStatus.textContent = "测试中...";

    try {
      // 测试通过background script添加单词
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: "ADD_WORD",
          word: "debugtest",
          context: {
            sourceUrl: "debug://popup",
            sourceContext: "从popup调试工具添加的测试单词"
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });

      if (response.success) {
        debugStatus.textContent = "✅ 通过background script添加成功";
        debugStatus.style.color = "#10b981";
        // 刷新数据
        setTimeout(() => this.loadRecentWords(), 500);
        setTimeout(() => this.loadStats(), 500);
      } else {
        debugStatus.textContent = `❌ Background script错误: ${response.error}`;
        debugStatus.style.color = "#ef4444";
      }
    } catch (error) {
      debugStatus.textContent = `❌ 通信错误: ${error.message}`;
      debugStatus.style.color = "#ef4444";
    }
  }

  async checkStatus() {
    const debugStatus = document.getElementById("debugStatus");
    debugStatus.textContent = "检查中...";

    try {
      // 检查后端连接
      const backendResponse = await fetch(`${this.apiUrl}/api/words?limit=1`);
      const backendOk = backendResponse.ok;

      // 检查background script通信
      const messageResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: "GET_SETTINGS"
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });

      const messageOk = messageResponse && messageResponse.success;

      const status = [
        `后端API: ${backendOk ? "✅" : "❌"}`,
        `Background通信: ${messageOk ? "✅" : "❌"}`,
        `API地址: ${this.apiUrl}`
      ].join(" | ");

      debugStatus.textContent = status;
      debugStatus.style.color = (backendOk && messageOk) ? "#10b981" : "#ef4444";

    } catch (error) {
      debugStatus.textContent = `❌ 检查失败: ${error.message}`;
      debugStatus.style.color = "#ef4444";
    }
  }

  // 测试Chrome API可用性
  testChromeAPI() {
    const debugStatus = document.getElementById("debugStatus");

    try {
      if (typeof chrome === 'undefined') {
        debugStatus.textContent = "❌ chrome对象不存在";
        debugStatus.style.color = "#ef4444";
        return;
      }

      const results = [];
      results.push(`chrome: ✅`);

      if (chrome.runtime) {
        results.push(`runtime: ✅ (ID: ${chrome.runtime.id})`);
      } else {
        results.push(`runtime: ❌`);
      }

      if (chrome.storage) {
        results.push(`storage: ✅`);
      } else {
        results.push(`storage: ❌`);
      }

      if (chrome.tabs) {
        results.push(`tabs: ✅`);
      } else {
        results.push(`tabs: ❌`);
      }

      debugStatus.textContent = results.join(" | ");
      debugStatus.style.color = "#10b981";

    } catch (error) {
      debugStatus.textContent = `❌ API检查失败: ${error.message}`;
      debugStatus.style.color = "#ef4444";
    }
  }

  // 测试直接API调用
  async testDirectAPI() {
    const debugStatus = document.getElementById("debugStatus");
    debugStatus.textContent = "测试直接API...";

    try {
      const testWord = `popup_test_${Date.now()}`;

      const response = await fetch(`${this.apiUrl}/api/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word: testWord,
          source_url: 'popup-test',
          source_context: '扩展弹窗直接API测试',
          personal_notes: ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        debugStatus.textContent = `✅ 直接API成功，ID: ${result.id}，单词: ${result.word}`;
        debugStatus.style.color = "#10b981";

        // 刷新数据
        setTimeout(() => this.loadRecentWords(), 300);
        setTimeout(() => this.loadStats(), 300);
      } else {
        const errorText = await response.text();
        debugStatus.textContent = `❌ API失败: ${response.status} - ${errorText}`;
        debugStatus.style.color = "#ef4444";
      }
    } catch (error) {
      debugStatus.textContent = `❌ 网络错误: ${error.message}`;
      debugStatus.style.color = "#ef4444";
    }
  }
}

// 全局实例，供HTML事件调用
let popupController;

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  popupController = new PopupController();
});