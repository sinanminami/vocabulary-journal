// 扩展设置页面脚本

class OptionsManager {
  constructor() {
    this.defaultSettings = {
      apiUrl: 'http://localhost:8000',
      webUrl: 'http://localhost:5173',
      enableAutoLookup: true,
      showTooltip: true,
      enableKeyboardShortcut: true,
      dictionaryProvider: 'free_dictionary',
      microsoftKey: '',
      microsoftRegion: ''
    };
    
    this.init();
  }
  
  async init() {
    // 加载当前设置
    await this.loadSettings();
    
    // 绑定事件
    this.bindEvents();
  }
  
  async loadSettings() {
    try {
      const settings = await this.getStoredSettings();
      
      // 填充表单
      document.getElementById('apiUrl').value = settings.apiUrl || this.defaultSettings.apiUrl;
      document.getElementById('webUrl').value = settings.webUrl || this.defaultSettings.webUrl;
      document.getElementById('enableAutoLookup').checked = settings.enableAutoLookup !== false;
      document.getElementById('showTooltip').checked = settings.showTooltip !== false;
      document.getElementById('enableKeyboardShortcut').checked = settings.enableKeyboardShortcut !== false;
      
      // 字典API设置
      document.getElementById('dictionaryProvider').value = settings.dictionaryProvider || this.defaultSettings.dictionaryProvider;
      document.getElementById('microsoftKey').value = settings.microsoftKey || '';
      document.getElementById('microsoftRegion').value = settings.microsoftRegion || '';
      
      // 根据选择的提供商显示/隐藏Microsoft配置
      this.toggleMicrosoftConfig();
      
    } catch (error) {
      console.error('加载设置失败:', error);
      this.showStatus('加载设置失败', 'error');
    }
  }
  
  bindEvents() {
    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });
    
    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetToDefaults();
    });
    
    // 字典提供商选择变化
    document.getElementById('dictionaryProvider').addEventListener('change', () => {
      this.toggleMicrosoftConfig();
      this.hideStatus();
    });
    
    // 输入框变化时隐藏状态信息
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.hideStatus();
      });
    });
  }
  
  async saveSettings() {
    try {
      const settings = {
        apiUrl: document.getElementById('apiUrl').value.trim() || this.defaultSettings.apiUrl,
        webUrl: document.getElementById('webUrl').value.trim() || this.defaultSettings.webUrl,
        enableAutoLookup: document.getElementById('enableAutoLookup').checked,
        showTooltip: document.getElementById('showTooltip').checked,
        enableKeyboardShortcut: document.getElementById('enableKeyboardShortcut').checked,
        dictionaryProvider: document.getElementById('dictionaryProvider').value,
        microsoftKey: document.getElementById('microsoftKey').value.trim(),
        microsoftRegion: document.getElementById('microsoftRegion').value.trim()
      };
      
      // 验证URL格式
      if (!this.isValidUrl(settings.apiUrl)) {
        this.showStatus('API服务器地址格式不正确', 'error');
        return;
      }
      
      if (!this.isValidUrl(settings.webUrl)) {
        this.showStatus('Web界面地址格式不正确', 'error');
        return;
      }
      
      // 验证Microsoft API配置
      if (settings.dictionaryProvider === 'microsoft' && !settings.microsoftKey) {
        this.showStatus('使用Microsoft API需要提供订阅密钥', 'error');
        return;
      }
      
      // 保存到存储
      await this.saveToStorage(settings);
      
      // 同步字典配置到后端
      await this.syncDictionaryConfig(settings);
      
      // 测试连接
      const isConnected = await this.testConnection(settings.apiUrl);
      
      if (isConnected) {
        this.showStatus('设置已保存并成功连接到服务器', 'success');
      } else {
        this.showStatus('设置已保存，但无法连接到API服务器', 'error');
      }
      
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showStatus('保存设置失败', 'error');
    }
  }
  
  async resetToDefaults() {
    if (confirm('确定要恢复默认设置吗？')) {
      try {
        await this.saveToStorage(this.defaultSettings);
        await this.loadSettings();
        this.showStatus('已恢复默认设置', 'success');
      } catch (error) {
        console.error('重置设置失败:', error);
        this.showStatus('重置设置失败', 'error');
      }
    }
  }
  
  async testConnection(apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/`, {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }
  
  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }
  
  async getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (settings) => {
        resolve(settings || {});
      });
    });
  }
  
  async saveToStorage(settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  
  showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    // 3秒后自动隐藏成功消息
    if (type === 'success') {
      setTimeout(() => {
        this.hideStatus();
      }, 3000);
    }
  }
  
  hideStatus() {
    const statusEl = document.getElementById('status');
    statusEl.style.display = 'none';
  }
  
  toggleMicrosoftConfig() {
    const provider = document.getElementById('dictionaryProvider').value;
    const microsoftConfig = document.getElementById('microsoftConfig');
    
    if (provider === 'microsoft') {
      microsoftConfig.style.display = 'block';
    } else {
      microsoftConfig.style.display = 'none';
    }
  }
  
  async syncDictionaryConfig(settings) {
    try {
      const response = await fetch(`${settings.apiUrl}/api/dictionary/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: settings.dictionaryProvider,
          microsoft_subscription_key: settings.microsoftKey,
          microsoft_region: settings.microsoftRegion
        })
      });
      
      if (!response.ok) {
        console.warn('同步字典配置到后端失败:', response.statusText);
      }
    } catch (error) {
      console.warn('同步字典配置失败:', error);
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});