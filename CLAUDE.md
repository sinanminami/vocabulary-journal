# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

生词记录系统 MVP - 一个帮助用户在浏览器中无摩擦记录和学习生词的系统，包含浏览器扩展、Web管理界面和本地API服务。

## Commands

### 启动后端服务
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 启动前端开发服务器
```bash
cd frontend  
npm install
npm run dev
```

### 同时启动所有服务
```bash
npm install  # 在根目录安装 concurrently
npm run dev:all
```

### 构建前端
```bash
cd frontend
npm run build
```

## Architecture

### 技术栈
- **后端**: FastAPI + SQLite + Python
- **前端**: React 18 + TypeScript + Vite + TailwindCSS + React Query
- **扩展**: Chrome Extension (Manifest V3) + Vanilla JS/TypeScript
- **数据库**: SQLite (本地文件存储)

### 项目结构
```
project_claude/
├── backend/          # FastAPI后端服务
│   ├── main.py      # 主应用和API路由
│   └── requirements.txt
├── frontend/         # React Web管理界面
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── api/        # API客户端
│   │   ├── types/      # TypeScript类型定义
│   │   └── App.tsx     # 主应用组件
│   └── package.json
├── extension/        # Chrome浏览器扩展
│   ├── manifest.json   # 扩展配置
│   ├── background.js   # 后台脚本
│   ├── content.js      # 内容脚本
│   ├── popup/         # 扩展弹窗
│   └── options/       # 设置页面
└── README.md
```

### 核心功能流程
1. **词汇收集**: 用户在网页中选中单词 → content.js监听选择事件 → 调用词典API查询释义 → 显示悬浮提示
2. **添加生词**: 用户点击"添加到生词本" → 调用后端API保存 → 存储到SQLite数据库
3. **词汇管理**: Web界面通过React Query获取词汇列表 → 展示词汇卡片 → 支持搜索、删除、更新掌握程度

### API接口设计
- `GET /api/words` - 获取生词列表，支持搜索和分页
- `POST /api/words` - 添加新生词，自动查询释义
- `GET /api/words/{word}/lookup` - 查询单词释义
- `DELETE /api/words/{id}` - 删除生词
- `PUT /api/words/{id}/mastery` - 更新掌握程度

### 数据模型
- **words表**: 存储单词基础信息（单词、发音、释义、词性等）
- **word_records表**: 存储学习记录（来源、语境、笔记、掌握程度等）

## Development Notes

### 扩展开发
- 使用Manifest V3规范，需要在`chrome://extensions/`开启开发者模式加载
- content.js注入到所有页面，监听文本选择事件
- background.js处理扩展全局事件和API通信
- 支持右键菜单和键盘快捷键(Ctrl+Shift+V)

### 前端开发
- 使用React Query管理API状态和缓存
- TailwindCSS提供响应式UI组件
- 支持词汇搜索、统计显示、掌握程度管理
- 错误处理和加载状态管理

### 后端开发  
- FastAPI提供RESTful API和自动文档生成
- SQLite数据库零配置，数据存储在`vocabulary.db`文件
- 集成Free Dictionary API获取单词释义
- CORS配置支持跨域请求

### 调试和测试
- 后端API文档: http://localhost:8000/docs
- 前端开发服务器: http://localhost:5173  
- 扩展控制台: F12 → 扩展程序标签页
- 数据库文件: `backend/vocabulary.db`

## Common Issues

1. **扩展无法加载**: 检查manifest.json语法，确保开启开发者模式
2. **API连接失败**: 确保后端服务运行在8000端口，检查CORS配置
3. **词典查询失败**: 网络问题或Free Dictionary API限制，会自动降级处理
4. **数据库锁定**: 多个进程访问SQLite，重启后端服务解决