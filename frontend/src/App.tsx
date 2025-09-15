import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, CheckCircle, XCircle, BookOpen, MessageCircle, X } from 'lucide-react';
import { vocabularyApi } from './api/vocabulary';
import { WordCard } from './components/WordCard';
import { SearchBar } from './components/SearchBar';
import { StatsCard } from './components/StatsCard';

const queryClient = new QueryClient();

// Toast notification component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50`}>
      <Icon size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        ×
      </button>
    </div>
  );
};

const VocabularyApp: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const queryClient = useQueryClient();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // 获取生词列表
  const { 
    data: words = [], 
    isLoading: wordsLoading, 
    error: wordsError,
    refetch: refetchWords 
  } = useQuery({
    queryKey: ['words', searchQuery],
    queryFn: () => vocabularyApi.getWords({ 
      limit: 100, 
      search: searchQuery || undefined 
    }),
    retry: 2,
  });

  // 获取统计信息
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['stats'],
    queryFn: vocabularyApi.getStats,
    retry: 2,
  });

  // 添加生词 mutation
  const addWordMutation = useMutation({
    mutationFn: (word: string) => vocabularyApi.addWord({
      word: word,
      source_url: window.location.href,
      source_context: '从Web管理界面手动添加'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('生词添加成功！', 'success');
    },
    onError: (error: any) => {
      console.error('添加生词失败:', error);
      showToast(
        error.response?.data?.detail || '添加生词失败，请稍后重试',
        'error'
      );
    },
  });

  // 删除生词 mutation
  const deleteWordMutation = useMutation({
    mutationFn: vocabularyApi.deleteWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('生词已删除', 'success');
    },
    onError: () => {
      showToast('删除失败，请稍后重试', 'error');
    },
  });

  // 更新掌握程度 mutation
  const updateMasteryMutation = useMutation({
    mutationFn: ({ wordId, level }: { wordId: number; level: number }) =>
      vocabularyApi.updateMastery(wordId, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('掌握程度已更新', 'success');
    },
    onError: () => {
      showToast('更新失败，请稍后重试', 'error');
    },
  });

  const handleAddWord = async (word: string) => {
    addWordMutation.mutate(word);
  };

  const handleDeleteWord = async (wordId: number) => {
    if (window.confirm('确定要删除这个生词吗？')) {
      deleteWordMutation.mutate(wordId);
    }
  };

  const handleUpdateMastery = (wordId: number, level: number) => {
    updateMasteryMutation.mutate({ wordId, level });
  };

  const filteredWords = words.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 错误状态
  if (wordsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            连接失败
          </h2>
          <p className="text-gray-600 mb-4">
            无法连接到后端服务，请确保服务正在运行
          </p>
          <button 
            onClick={() => refetchWords()}
            className="btn btn-default"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* 星空背景 */}
      <div className="starfield"></div>


      {/* 联系我按钮 - 位于统计卡片右侧 */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1020
        }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            onMouseEnter={(e) => {
              const tooltip = e.currentTarget.nextElementSibling;
              if (tooltip) {
                const buttonStyles = window.getComputedStyle(e.currentTarget);
                tooltip.style.visibility = 'visible';
                tooltip.style.fontSize = buttonStyles.fontSize;
                tooltip.style.fontWeight = buttonStyles.fontWeight;
                tooltip.style.fontFamily = buttonStyles.fontFamily;
              }
            }}
            onMouseLeave={(e) => {
              const tooltip = e.currentTarget.nextElementSibling;
              if (tooltip) tooltip.style.visibility = 'hidden';
            }}
            className="btn btn-secondary"
          >
            <MessageCircle size={18} />
            <span className="ml-2">联系我</span>
          </button>

          {/* 悬停提示框 */}
          <div
            style={{
              position: 'absolute',
              right: '100%',
              marginRight: '12px',
              top: '0',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 50,
              visibility: 'hidden',
              border: '1px solid #4b5563',
              backdropFilter: 'blur(10px)'
            }}
          >
            微信：sinan_minami
            <div
              style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid #374151',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {/* 头部 */}
        <div className="relative mb-16 animate-fadeIn">

          {/* 背景装饰元素 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-20 w-72 h-72 bg-gradient-to-br from-green-400/10 to-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-purple-400/8 to-pink-500/5 rounded-full blur-3xl"></div>
          </div>

          {/* 主标题区域 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            paddingTop: '100px',
            position: 'relative'
          }}>
            {/* 渐变背景层 */}
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              height: '390px',
              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(30, 215, 96, 0.08) 25%, rgba(18, 18, 18, 0.05) 50%, rgba(59, 130, 246, 0.08) 75%, rgba(147, 51, 234, 0.1) 100%)',
              backgroundSize: '400% 400%',
              animation: 'gradientFloat 8s ease-in-out infinite',
              borderRadius: '0px',
              backdropFilter: 'blur(20px)',
              border: 'none',
              zIndex: 1
            }}></div>

            {/* 额外的光晕层 */}
            <div style={{
              position: 'fixed',
              top: '20px',
              left: '0',
              right: '0',
              height: '340px',
              background: 'radial-gradient(ellipse at center, rgba(29, 185, 84, 0.08) 0%, rgba(30, 215, 96, 0.05) 30%, transparent 70%)',
              animation: 'haloFloat 12s ease-in-out infinite alternate',
              borderRadius: '50%',
              zIndex: 2,
              pointerEvents: 'none'
            }}></div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '800',
              marginBottom: '24px',
              lineHeight: '1.2',
              position: 'relative',
              zIndex: 10,
              padding: '0 20px'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #d1d5db 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                生词记录
              </span>
              <span style={{ margin: '0 2px' }}> </span>
              <span style={{ color: '#1db954' }}>
                Vocabulary Journal
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(14px, 3vw, 18px)',
              color: '#9ca3af',
              maxWidth: '90%',
              margin: '0 auto 30px auto',
              lineHeight: '1.6',
              position: 'relative',
              zIndex: 10,
              padding: '0 20px',
              textAlign: 'center'
            }}>
              智能管理您的词汇学习进度，让每个单词都成为您语言能力提升的基石
            </p>
          </div>

        </div>

        {/* 统计卡片 */}
        <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          {stats && <StatsCard stats={stats} loading={statsLoading} />}
        </div>

        {/* 搜索和添加 */}
        <div className="animate-fadeIn" style={{ animationDelay: '0.2s', marginTop: '60px' }}>
          <SearchBar
            onSearch={setSearchQuery}
            onAddWord={handleAddWord}
            searchQuery={searchQuery}
          />
        </div>

        {/* 生词列表 */}
        <div style={{ marginTop: '80px', padding: '0 24px' }}>
          {wordsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>加载中...</span>
            </div>
          ) : filteredWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                {searchQuery ? '未找到相关生词' : '暂无生词记录'}
              </h3>
              <p style={{ color: '#6b7280' }}>
                {searchQuery
                  ? '尝试调整搜索关键词'
                  : '开始使用浏览器扩展收集生词，或手动添加单词'
                }
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 320px)',
              gap: '32px',
              maxWidth: '1040px',
              margin: '0 auto',
              justifyContent: 'flex-start'
            }}>
              {filteredWords.map((word, index) => (
                <div
                  key={word.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${0.1 * (index % 6)}s` }}
                >
                  <WordCard
                    word={word}
                    onDelete={handleDeleteWord}
                    onUpdateMastery={handleUpdateMastery}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 加载状态指示器 */}
        {(addWordMutation.isPending || deleteWordMutation.isPending || updateMasteryMutation.isPending) && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            <span className="text-sm text-gray-600">处理中...</span>
          </div>
        )}
      </div>

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 联系弹窗 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <MessageCircle className="mx-auto text-blue-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                联系方式
              </h3>
              <p className="text-gray-600">
                微信：sinan_minami
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <VocabularyApp />
    </QueryClientProvider>
  );
};

export default App;
