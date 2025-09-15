import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAddWord: (word: string) => void;
  searchQuery: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onAddWord,
  searchQuery
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim()) {
      onAddWord(newWord.trim());
      setNewWord('');
      setShowAddForm(false);
    }
  };

  // CSS变量和样式
  const cssVariables = {
    '--primary-green': '#1db954',
    '--dark-bg': '#2E2E2E',
    '--light-gray': '#AAAAAA',
    '--border-radius': '12px'
  } as React.CSSProperties;

  return (
    <div className="space-y-8" style={cssVariables}>
      {/* 搜索栏 - 动态边框设计 */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>
        {/* 主搜索框 - 动态边框容器 */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(45deg, var(--primary-green), #1ed760, #00ff88, var(--primary-green), #1ed760)',
              backgroundSize: '400% 400%',
              animation: 'gradientShift 5s ease infinite',
              padding: '3px',
              borderRadius: 'var(--border-radius)',
              boxShadow: '0 0 20px rgba(29, 185, 84, 0.4), 0 0 40px rgba(29, 185, 84, 0.2)'
            }}
          >
            {/* 内部容器 */}
            <div style={{
              display: 'flex',
              background: 'var(--dark-bg)',
              borderRadius: 'calc(var(--border-radius) - 3px)',
              overflow: 'hidden'
            }}>
              {/* 搜索输入框区域 */}
              <div style={{ flex: '1', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: 'var(--light-gray)',
                    zIndex: 10
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="搜索生词或输入新单词..."
                  style={{
                    width: '100%',
                    height: '44px',
                    background: 'transparent',
                    border: '0',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    paddingLeft: '48px',
                    paddingRight: searchQuery ? '48px' : '16px',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearch('')}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      color: 'var(--light-gray)',
                      padding: '4px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--light-gray)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* 添加生词按钮 */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  background: 'var(--primary-green)',
                  color: 'white',
                  border: 'none',
                  padding: '0 20px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1ed760';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary-green)';
                }}
              >
                <Plus size={18} />
                <span>添加生词</span>
              </button>
            </div>
          </div>

          {/* 搜索提示 */}
          <div style={{
            marginTop: '16px',
            fontSize: '12px',
            color: 'var(--light-gray)',
            textAlign: 'right',
            fontWeight: '400'
          }}>
            快速搜索: 按 Enter 确认 • 支持中英文搜索
          </div>
        </div>
      </div>

      {/* CSS动画定义 */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 25%; }
          50% { background-position: 100% 75%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }

        input::placeholder {
          color: var(--light-gray) !important;
        }
      `}</style>
      
      {/* 添加生词表单 - 优化设计 */}
      {showAddForm && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="card">
            <div className="card-content">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  添加新单词
                </h3>
                <p className="text-gray-500">
                  输入单词，系统将自动获取释义和例句
                </p>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="输入要添加的单词..."
                    className="input w-full text-lg h-12"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    type="submit"
                    className="btn btn-default px-8"
                    disabled={!newWord.trim()}
                  >
                    <Plus size={18} />
                    <span className="ml-2">添加到生词本</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewWord('');
                    }}
                    className="btn btn-secondary px-6"
                  >
                    取消
                  </button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">💡</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      支持英文单词自动释义查询，添加后可设置掌握程度，跟踪学习进度
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};