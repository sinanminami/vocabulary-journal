// 内容脚本 - 处理页面划词和悬浮提示

class VocabularyRecorder {
  constructor() {
    this.tooltip = null;
    this.selectedText = "";
    this.isEnabled = true;
    this.settings = {
      enableAutoLookup: true,
      showTooltip: true
    };
    
    this.init();
  }
  
  async init() {
    console.log("VocabularyRecorder 初始化开始");
    
    // 创建样式
    this.injectStyles();
    
    // 绑定事件
    this.bindEvents();
    
    // 异步获取设置（不阻塞初始化）
    try {
      this.settings = await this.getSettings();
      console.log("设置加载完成:", this.settings);
    } catch (error) {
      console.error("获取设置失败，使用默认设置:", error);
    }
    
    console.log("VocabularyRecorder 初始化完成");
  }
  
  bindEvents() {
    // 文本选择事件
    document.addEventListener("mouseup", this.handleTextSelection.bind(this));
    
    // 键盘快捷键
    document.addEventListener("keydown", this.handleKeyboard.bind(this));
    
    // 点击其他地方隐藏提示
    document.addEventListener("click", this.hideTooltip.bind(this));
  }
  
  async handleTextSelection(event) {
    try {
      console.log("文本选择事件触发", {
        enabled: this.isEnabled,
        autoLookup: this.settings?.enableAutoLookup
      });
      
      if (!this.isEnabled || !this.settings?.enableAutoLookup) {
        console.log("功能未启用，跳过处理");
        return;
      }
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log("无有效选择");
        this.hideTooltip();
        return;
      }
      
      const selectedText = selection.toString().trim();
      console.log("选中的文本:", `"${selectedText}"`);
      
      // 放宽条件：允许更多类型的文本
      if (!selectedText || selectedText.length < 1 || selectedText.length > 50) {
        console.log("文本长度不符合要求:", selectedText.length);
        this.hideTooltip();
        return;
      }
      
      // 检查是否包含英文字母（允许包含一些标点和数字）
      if (!/[a-zA-Z]/.test(selectedText)) {
        console.log("不包含英文字母");
        this.hideTooltip();
        return;
      }
      
      // 如果是多个单词，取第一个单词
      let targetWord = selectedText;
      if (selectedText.includes(" ")) {
        const words = selectedText.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 0) {
          targetWord = words[0];
          console.log("多个单词，使用第一个:", targetWord);
        }
      }
      
      // 清理单词（移除标点）
      targetWord = targetWord.replace(/[^\w'-]/g, '').toLowerCase();
      
      if (!targetWord || targetWord.length < 2) {
        console.log("清理后的单词无效:", targetWord);
        this.hideTooltip();
        return;
      }
      
      this.selectedText = targetWord;
      console.log("准备查询单词:", this.selectedText);
      
      // 获取选择位置
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // 确保位置有效
      if (rect.width === 0 && rect.height === 0) {
        console.log("选择位置无效");
        return;
      }
      
      // 显示加载提示
      this.showLoadingTooltip(rect);
      
      // 查询单词释义
      const definition = await this.lookupWord(this.selectedText);
      this.showDefinitionTooltip(definition, rect);
      
    } catch (error) {
      console.error("处理文本选择时出错:", error);
      this.showErrorTooltip(event);
    }
  }
  
  async lookupWord(word) {
    return new Promise((resolve, reject) => {
      console.log("发送查词请求:", word);
      
      if (!chrome.runtime) {
        reject(new Error("Chrome runtime 不可用"));
        return;
      }
      
      chrome.runtime.sendMessage({
        type: "LOOKUP_WORD",
        word: word
      }, (response) => {
        // 检查运行时错误
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        console.log("收到查词响应:", response);
        
        if (response && response.success) {
          resolve(response.data);
        } else {
          const errorMsg = response?.error || "查询失败";
          reject(new Error(errorMsg));
        }
      });
      
      // 设置超时
      setTimeout(() => {
        reject(new Error("查询超时"));
      }, 10000);
    });
  }
  
  async addWordToVocabulary() {
    if (!this.selectedText) return;
    
    const context = {
      sourceUrl: window.location.href,
      sourceContext: this.getSelectionContext()
    };
    
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: "ADD_WORD",
          word: this.selectedText,
          context: context
        }, (response) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error));
          }
        });
      });
      
      this.showSuccessMessage();
    } catch (error) {
      console.error("添加失败:", error);
      this.showErrorMessage();
    }
  }
  
  getSelectionContext() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return "";
    
    const range = selection.getRangeAt(0);
    const container = range.startContainer.parentElement;
    
    // 获取包含选中文本的句子或段落
    let context = container.textContent || "";
    const maxLength = 200;
    
    if (context.length > maxLength) {
      const start = Math.max(0, range.startOffset - maxLength / 2);
      const end = Math.min(context.length, start + maxLength);
      context = "..." + context.substring(start, end) + "...";
    }
    
    return context;
  }
  
  showLoadingTooltip(rect) {
    this.hideTooltip();
    
    this.tooltip = this.createTooltip();
    this.tooltip.innerHTML = `
      <div class="vocab-tooltip-loading">
        <div class="vocab-spinner"></div>
        <span>查询中...</span>
      </div>
    `;
    
    this.positionTooltip(rect);
    document.body.appendChild(this.tooltip);
  }
  
  showDefinitionTooltip(definition, rect) {
    this.hideTooltip();
    
    this.tooltip = this.createTooltip();
    
    // 构建释义HTML
    const definitionsHtml = definition.definitions
      .slice(0, 3) // 只显示前3个释义
      .map(def => `
        <div class="vocab-definition">
          <span class="vocab-pos">${def.partOfSpeech}</span>
          <span class="vocab-meaning">${def.meaning}</span>
        </div>
      `).join("");
    
    this.tooltip.innerHTML = `
      <div class="vocab-tooltip-content">
        <div class="vocab-header">
          <span class="vocab-word">${definition.word}</span>
          ${definition.pronunciation ? `<span class="vocab-pronunciation">${definition.pronunciation}</span>` : ""}
        </div>
        <div class="vocab-definitions">
          ${definitionsHtml}
        </div>
        <div class="vocab-actions">
          <button class="vocab-btn vocab-btn-primary" id="addToVocab">
            <span>📚</span> 添加到生词本
          </button>
          <button class="vocab-btn vocab-btn-secondary" id="closeTooltip">
            <span>✕</span>
          </button>
        </div>
      </div>
    `;
    
    this.positionTooltip(rect);
    document.body.appendChild(this.tooltip);
    
    // 绑定按钮事件
    this.tooltip.querySelector("#addToVocab").addEventListener("click", () => {
      this.addWordToVocabulary();
    });
    
    this.tooltip.querySelector("#closeTooltip").addEventListener("click", () => {
      this.hideTooltip();
    });
  }
  
  showErrorTooltip(rect) {
    this.hideTooltip();
    
    this.tooltip = this.createTooltip();
    this.tooltip.innerHTML = `
      <div class="vocab-tooltip-error">
        <span>❌ 查询失败</span>
        <button class="vocab-btn-small" id="retryLookup">重试</button>
      </div>
    `;
    
    this.positionTooltip(rect);
    document.body.appendChild(this.tooltip);
    
    this.tooltip.querySelector("#retryLookup").addEventListener("click", () => {
      this.handleTextSelection({ target: document });
    });
  }
  
  createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.className = "vocab-tooltip";
    tooltip.id = "vocab-tooltip";
    return tooltip;
  }
  
  positionTooltip(rect) {
    if (!this.tooltip) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let top = rect.bottom + scrollTop + 10;
    let left = rect.left + scrollLeft;
    
    // 防止超出屏幕
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 20;
    }
    
    if (top + tooltipRect.height > viewportHeight + scrollTop) {
      top = rect.top + scrollTop - tooltipRect.height - 10;
    }
    
    this.tooltip.style.top = `${Math.max(10, top)}px`;
    this.tooltip.style.left = `${Math.max(10, left)}px`;
  }
  
  hideTooltip() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
  }
  
  handleKeyboard(event) {
    // ESC键隐藏提示
    if (event.key === "Escape") {
      this.hideTooltip();
    }
    
    // Ctrl+Shift+V 添加选中的词到生词本
    if (event.ctrlKey && event.shiftKey && event.key === "V") {
      event.preventDefault();
      const selection = window.getSelection().toString().trim();
      if (selection && /^[a-zA-Z-']+$/.test(selection)) {
        this.selectedText = selection.toLowerCase();
        this.addWordToVocabulary();
      }
    }
  }
  
  showSuccessMessage() {
    this.showMessage("✅ 已添加到生词本", "success");
  }
  
  showErrorMessage() {
    this.showMessage("❌ 添加失败", "error");
  }
  
  showMessage(text, type) {
    const message = document.createElement("div");
    message.className = `vocab-message vocab-message-${type}`;
    message.textContent = text;
    
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#10b981" : "#ef4444"};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // 动画显示
    setTimeout(() => {
      message.style.transform = "translateX(0)";
    }, 100);
    
    // 3秒后隐藏
    setTimeout(() => {
      message.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 300);
    }, 3000);
  }
  
  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: "GET_SETTINGS"
      }, (response) => {
        resolve(response.data || {});
      });
    });
  }
  
  injectStyles() {
    if (document.getElementById("vocab-recorder-styles")) return;

    const styles = document.createElement("style");
    styles.id = "vocab-recorder-styles";
    styles.textContent = `
      .vocab-tooltip {
        position: absolute;
        background: linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(30, 30, 30, 0.95));
        border: 1px solid rgba(29, 185, 84, 0.3);
        border-radius: 16px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(29, 185, 84, 0.1);
        backdrop-filter: blur(20px);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        color: white;
      }

      .vocab-tooltip-content {
        padding: 16px;
      }

      .vocab-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(29, 185, 84, 0.2);
      }

      .vocab-word {
        font-weight: 600;
        font-size: 16px;
        color: #1db954;
      }

      .vocab-pronunciation {
        color: #9ca3af;
        font-style: italic;
      }

      .vocab-definitions {
        margin-bottom: 12px;
      }

      .vocab-definition {
        margin-bottom: 8px;
      }

      .vocab-pos {
        display: inline-block;
        background: rgba(29, 185, 84, 0.2);
        color: #1db954;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 12px;
        margin-right: 8px;
        border: 1px solid rgba(29, 185, 84, 0.3);
      }

      .vocab-meaning {
        color: #e5e7eb;
      }

      .vocab-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .vocab-btn {
        padding: 6px 12px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
      }

      .vocab-btn-primary {
        background: linear-gradient(135deg, #1db954, #1ed760);
        color: white;
        border: 1px solid rgba(29, 185, 84, 0.5);
      }

      .vocab-btn-primary:hover {
        background: linear-gradient(135deg, #1ed760, #1db954);
        box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
      }

      .vocab-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #9ca3af;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .vocab-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .vocab-tooltip-loading {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #9ca3af;
      }

      .vocab-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-top: 2px solid #1db954;
        border-radius: 50%;
        animation: vocab-spin 1s linear infinite;
      }

      .vocab-tooltip-error {
        padding: 16px;
        color: #f87171;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .vocab-btn-small {
        padding: 4px 8px;
        background: rgba(248, 113, 113, 0.2);
        color: #f87171;
        border: 1px solid rgba(248, 113, 113, 0.3);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      }

      @keyframes vocab-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(styles);
  }
}

// 初始化生词记录器 - 更健壮的初始化方式
(function initVocabularyRecorder() {
  console.log("开始初始化生词记录器，当前状态:", document.readyState);
  
  let recorder = null;
  
  function createRecorder() {
    if (recorder) {
      console.log("记录器已存在，跳过创建");
      return;
    }
    console.log("创建生词记录器实例");
    recorder = new VocabularyRecorder();
  }
  
  // 根据页面状态决定初始化方式
  if (document.readyState === "loading") {
    // 页面还在加载，等待DOM完成
    document.addEventListener("DOMContentLoaded", createRecorder);
    // 同时设置备用的延迟初始化
    setTimeout(createRecorder, 1000);
  } else if (document.readyState === "interactive" || document.readyState === "complete") {
    // 页面已加载，立即初始化
    createRecorder();
  }
  
  // 对于动态页面，额外的延迟初始化
  setTimeout(() => {
    if (!recorder) {
      console.log("延迟初始化生词记录器");
      createRecorder();
    }
  }, 2000);
})();