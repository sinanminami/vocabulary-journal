# 部署指南

## 快速启动

### 1. 启动后端服务

```bash
# 进入后端目录
cd backend

# 安装Python依赖 (首次运行)
pip install -r requirements.txt

# 启动API服务
uvicorn main:app --reload --port 8000
```

后端服务将在 http://localhost:8000 启动，可以访问 http://localhost:8000/docs 查看API文档。

### 2. 启动前端界面

```bash
# 进入前端目录
cd frontend

# 安装依赖 (首次运行)
npm install

# 启动开发服务器
npm run dev
```

前端界面将在 http://localhost:5173 启动。

### 3. 安装浏览器扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `extension` 目录
6. 扩展安装成功后会显示在扩展栏

**注意**: 在安装扩展前，需要先添加图标文件到 `extension/icons/` 目录，或者临时注释掉 `manifest.json` 中的图标配置。

## 使用方法

### 基本功能

1. **划词查词**: 在任意网页选中英文单词，会自动显示释义悬浮窗
2. **添加生词**: 点击悬浮窗中的"添加到生词本"按钮
3. **快捷添加**: 选中单词后按 `Ctrl+Shift+V`
4. **右键添加**: 选中单词后右键菜单选择"添加到生词本"
5. **管理生词**: 点击扩展图标打开Web管理界面

### Web管理界面功能

- 查看所有收集的生词
- 搜索和筛选生词
- 查看词汇统计信息
- 更新单词掌握程度
- 删除不需要的生词
- 手动添加新单词

## 数据存储

- 数据存储在 `backend/vocabulary.db` SQLite文件中
- 包含单词信息、释义、学习记录等
- 支持备份和恢复（复制数据库文件）

## 故障排除

### 常见问题

1. **扩展无法加载**
   - 检查 `manifest.json` 语法是否正确
   - 确保开启了开发者模式
   - 添加必要的图标文件

2. **API连接失败** 
   - 确保后端服务运行在8000端口
   - 检查防火墙设置
   - 查看浏览器控制台错误信息

3. **词典查询失败**
   - 检查网络连接
   - Free Dictionary API可能有访问限制
   - 查看后端日志确认错误

4. **数据库锁定错误**
   - 关闭所有访问数据库的进程
   - 重启后端服务
   - 检查SQLite文件权限

### 开发调试

- 后端日志: 查看终端输出
- 扩展调试: F12 → 扩展程序标签页
- API测试: 访问 http://localhost:8000/docs
- 前端调试: 浏览器开发者工具

## 生产部署

### 前端构建

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录。

### 后端部署

```bash
# 使用gunicorn部署
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UnicornWorker --bind 0.0.0.0:8000
```

### 扩展发布

1. 准备完整的图标文件
2. 测试所有功能正常
3. 打包extension目录
4. 上传到Chrome Web Store

## 扩展功能

### Phase 2 计划

- 记忆曲线算法
- 智能复习提醒
- 单词卡片模式
- 导出功能

### Phase 3 计划

- PDF文档支持
- OCR图片识别
- 移动端扩展
- 云端同步

### Phase 4 计划

- 多语言支持
- 语音朗读
- 社区功能
- 学习分析