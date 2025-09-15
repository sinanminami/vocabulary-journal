# 生词记录系统 MVP

一个帮助用户在浏览器中无摩擦记录和学习生词的系统。

## ✨ 功能特性

- 🔤 **智能划词取词** - 网页选中单词自动显示释义
- 📚 **一键添加生词** - 点击按钮或快捷键快速保存
- 📊 **可视化管理** - Web界面管理所有词汇和学习进度
- 🎯 **掌握程度追踪** - 5级掌握度系统，科学记录学习进度
- 🔍 **智能搜索** - 快速查找已收集的生词
- 📈 **学习统计** - 词汇量统计和学习趋势分析
- 💾 **本地存储** - SQLite数据库，数据完全本地化

## 🛠 技术架构

- **后端**: FastAPI + SQLite + Python
- **前端**: React 18 + TypeScript + Vite + 响应式CSS
- **扩展**: Chrome Extension (Manifest V3) + JavaScript
- **词典**: Free Dictionary API 集成
- **数据库**: SQLite 轻量级本地存储

## 📁 项目结构

```
project_claude/
├── backend/              # FastAPI后端服务
│   ├── main.py          # 主应用和API路由
│   ├── requirements.txt # Python依赖
│   └── vocabulary.db    # SQLite数据库(运行时生成)
├── frontend/             # React Web界面  
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── api/        # API客户端
│   │   ├── types/      # TypeScript类型
│   │   └── App.tsx     # 主应用
│   ├── dist/           # 构建产物
│   └── package.json
├── extension/            # Chrome浏览器扩展
│   ├── manifest.json   # 扩展配置
│   ├── background.js   # 后台脚本
│   ├── content.js      # 内容脚本 
│   ├── popup/         # 扩展弹窗
│   └── options/       # 设置页面
├── docs/                # 项目文档
│   ├── DEPLOYMENT.md   # 部署指南
│   └── ...
└── CLAUDE.md           # Claude Code 指南
```

## 🚀 快速开始

### 环境要求

- Python 3.9+
- Node.js 18+
- Chrome浏览器

### 1. 启动后端服务

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端将在 http://localhost:8000 启动，访问 http://localhost:8000/docs 查看API文档。

### 2. 启动前端界面

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动。

### 3. 安装浏览器扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 `extension` 目录
5. 扩展安装成功！

> **注意**: 需要先添加图标文件到 `extension/icons/` 目录，或临时注释掉 manifest.json 中的图标配置。

### 4. 开始使用

1. 在任意网页选中英文单词，查看自动显示的释义
2. 点击"添加到生词本"保存单词
3. 使用快捷键 `Ctrl+Shift+V` 快速添加
4. 点击扩展图标访问Web管理界面

## 📋 核心API

### 词汇管理
- `GET /api/words` - 获取生词列表(支持搜索和分页)
- `POST /api/words` - 添加新生词(自动查询释义)
- `DELETE /api/words/{id}` - 删除生词
- `PUT /api/words/{id}/mastery` - 更新掌握程度

### 词典查询
- `GET /api/words/{word}/lookup` - 查询单词释义

## 🎯 使用方法

### 浏览器扩展
- **自动查词**: 选中单词自动显示释义悬浮窗
- **快速添加**: 
  - 点击悬浮窗"添加到生词本"按钮
  - 快捷键 `Ctrl+Shift+V`
  - 右键菜单"添加到生词本"
- **扩展弹窗**: 显示最近单词和统计信息
- **设置管理**: 配置API地址和功能开关

### Web管理界面
- **词汇浏览**: 卡片式展示所有生词
- **智能搜索**: 实时搜索词汇
- **掌握管理**: 5星级掌握程度标记
- **统计分析**: 总词汇量、今日新增、本周新增、掌握率
- **批量操作**: 删除、导出等功能

## ✅ 开发进度

- [x] 项目结构搭建和环境配置
- [x] FastAPI后端和SQLite数据库设计
- [x] Free Dictionary API词典服务集成
- [x] Chrome扩展核心功能(划词、悬浮窗、右键菜单)
- [x] React Web管理界面(词汇管理、统计、搜索)
- [x] 完整的用户交互流程和错误处理
- [x] 项目文档和部署指南

## 📖 详细文档

- [部署指南](docs/DEPLOYMENT.md) - 完整的安装、配置和故障排除
- [CLAUDE.md](CLAUDE.md) - 开发者指南和架构说明

## 🔧 开发调试

- **后端**: 查看终端日志，访问 `/docs` 测试API
- **前端**: 浏览器开发者工具
- **扩展**: F12 → 扩展程序标签页查看日志

## 🚧 后续计划

### Phase 2
- 记忆曲线算法和智能复习
- 单词卡片学习模式
- 数据导出和备份功能

### Phase 3  
- PDF文档支持和OCR识别
- 移动端支持
- 云端数据同步

### Phase 4
- 多语言支持
- 语音朗读功能
- 社区学习功能

## 📄 License

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**🎉 现在就开始你的词汇学习之旅吧！**