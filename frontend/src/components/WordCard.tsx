import React, { useState } from 'react';
import { Trash2, Volume2, Star, ChevronDown, ChevronUp, Book, Calendar, RotateCcw } from 'lucide-react';
import type { Word } from '../types';

interface WordCardProps {
  word: Word;
  onDelete: (id: number) => void;
  onUpdateMastery: (id: number, level: number) => void;
}

export const WordCard: React.FC<WordCardProps> = ({
  word,
  onDelete,
  onUpdateMastery
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMasteryColor = (level: number) => {
    const colors = [
      { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.2)' }, // 0: 未学习
      { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },     // 1: 初学
      { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', border: 'rgba(249, 115, 22, 0.2)' },  // 2: 认识
      { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', border: 'rgba(234, 179, 8, 0.2)' },    // 3: 理解
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },  // 4: 掌握
      { bg: 'rgba(29, 185, 84, 0.1)', text: '#1db954', border: 'rgba(29, 185, 84, 0.2)' },   // 5: 精通
    ];
    return colors[level] || colors[0];
  };

  const getMasteryText = (level: number) => {
    const texts = ['未学习', '初学', '认识', '理解', '掌握', '精通'];
    return texts[level] || texts[0];
  };

  const handleMasteryClick = (newLevel: number) => {
    if (newLevel !== word.mastery_level) {
      onUpdateMastery(word.id, newLevel);
    }
  };

  const masteryColor = getMasteryColor(word.mastery_level);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.9) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(29, 185, 84, 0.2)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(29, 185, 84, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      position: 'relative'
    }}
    className="group hover:shadow-xl hover:transform hover:scale-[1.02]"
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(29, 185, 84, 0.3)';
      e.currentTarget.style.border = '1px solid rgba(29, 185, 84, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(29, 185, 84, 0.1)';
      e.currentTarget.style.border = '1px solid rgba(29, 185, 84, 0.2)';
    }}>

      {/* 顶部装饰条 */}
      <div style={{
        background: `linear-gradient(135deg, ${masteryColor.text} 0%, rgba(29, 185, 84, 0.8) 100%)`,
        height: '4px',
        width: '100%'
      }}></div>

      {/* 卡片头部 */}
      <div style={{ padding: '20px 24px 6px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                {word.word}
              </h3>

              {/* 掌握程度徽章 */}
              <span style={{
                background: masteryColor.bg,
                color: masteryColor.text,
                border: `1px solid ${masteryColor.border}`,
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {getMasteryText(word.mastery_level)}
              </span>
            </div>

            {/* 词性标签 */}
            {word.pos_tags && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                {word.pos_tags.split(',').map((pos, index) => (
                  <span key={index} style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {pos.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* 发音 */}
            {word.pronunciation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={14} color="#6b7280" />
                <span style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                  fontSize: '13px',
                  color: '#d1d5db'
                }}>
                  {word.pronunciation}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => onDelete(word.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              padding: '8px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
            title="删除单词"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* 卡片内容 */}
      <div style={{ padding: '0 24px 20px 24px' }}>
        {/* 主要释义（总是显示前2个） */}
        <div style={{ marginBottom: '8px' }}>
          {word.definitions.slice(0, 2).map((def, index) => (
            <div key={index} style={{
              padding: '12px 0',
              borderBottom: index === 0 && word.definitions.length > 1 ? '1px solid rgba(75, 85, 99, 0.4)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {def.partOfSpeech && (
                  <span style={{
                    background: 'rgba(147, 51, 234, 0.1)',
                    color: '#9333ea',
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {def.partOfSpeech}
                  </span>
                )}
              </div>
              <p style={{
                color: '#e5e7eb',
                fontSize: '14px',
                lineHeight: '1.5',
                margin: '0 0 8px 0'
              }}>
                {def.meaning}
              </p>
              {def.example && (
                <p style={{
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontStyle: 'italic',
                  margin: 0,
                  paddingLeft: '12px',
                  borderLeft: '2px solid rgba(29, 185, 84, 0.5)'
                }}>
                  {def.example}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 展开/收起更多释义 */}
        {word.definitions.length > 2 && (
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'rgba(29, 185, 84, 0.1)',
                border: '1px solid rgba(29, 185, 84, 0.2)',
                color: '#1db954',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(29, 185, 84, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
              }}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isExpanded ? '收起' : `查看更多 (${word.definitions.length - 2})`}
            </button>

            {isExpanded && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(75, 85, 99, 0.4)' }}>
                {word.definitions.slice(2).map((def, index) => (
                  <div key={index + 2} style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {def.partOfSpeech && (
                        <span style={{
                          background: 'rgba(147, 51, 234, 0.1)',
                          color: '#9333ea',
                          border: '1px solid rgba(147, 51, 234, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          {def.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#d1d5db', fontSize: '13px', margin: 0 }}>{def.meaning}</p>
                    {def.example && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                        {def.example}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 掌握程度和统计信息区域 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)',
        borderTop: '1px solid rgba(29, 185, 84, 0.3)',
        padding: '20px 24px',
        borderRadius: '0 0 16px 16px'
      }}>
        {/* 掌握程度选择器 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Star size={16} color="#1db954" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>掌握程度</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4, 5].map((level) => {
              const isActive = word.mastery_level >= level;
              return (
                <button
                  key={level}
                  onClick={() => handleMasteryClick(level)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)'
                      : 'rgba(75, 85, 99, 0.3)',
                    color: isActive ? '#ffffff' : '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isActive ? '0 6px 20px rgba(29, 185, 84, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(75, 85, 99, 0.5)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(75, 85, 99, 0.3)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  title={getMasteryText(level)}
                >
                  <Star size={14} fill={isActive ? 'currentColor' : 'none'} />
                </button>
              );
            })}
          </div>
        </div>

        {/* 统计信息 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid rgba(29, 185, 84, 0.2)',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(29, 185, 84, 0.1)',
            padding: '6px 10px',
            borderRadius: '12px',
            border: '1px solid rgba(29, 185, 84, 0.2)'
          }}>
            <Calendar size={14} color="#1db954" />
            <span style={{ color: '#d1d5db' }}>{formatDate(word.created_at)}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '6px 10px',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <RotateCcw size={14} color="#3b82f6" />
            <span style={{ color: '#d1d5db' }}>复习 {word.review_count} 次</span>
          </div>
        </div>
      </div>
    </div>
  );
};