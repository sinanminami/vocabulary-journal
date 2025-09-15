import React from 'react';
import { Trash2, Volume2, Star } from 'lucide-react';
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMasteryColor = (level: number) => {
    const colors = [
      'bg-gray-100 text-gray-600',      // 0: 未学习
      'bg-red-100 text-red-600',        // 1: 初学
      'bg-orange-100 text-orange-600',  // 2: 认识
      'bg-yellow-100 text-yellow-600',  // 3: 理解
      'bg-blue-100 text-blue-600',      // 4: 掌握
      'bg-green-100 text-green-600',    // 5: 精通
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

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-header">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {word.word}
            </h3>

            {word.pos_tags && (
              <div className="flex gap-1 mb-2">
                {word.pos_tags.split(',').map((pos, index) => (
                  <span
                    key={index}
                    className="badge badge-outline text-xs"
                  >
                    {pos.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onDelete(word.id)}
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2 p-1 rounded-full hover:bg-red-50"
            title="删除单词"
            style={{ background: 'transparent', border: 'none' }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          {word.pronunciation && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Volume2 size={14} />
              <span className="font-mono">{word.pronunciation}</span>
            </div>
          )}
          <span className={`badge ${getMasteryColor(word.mastery_level)} ml-auto`}>
            {getMasteryText(word.mastery_level)}
          </span>
        </div>
      </div>
      
      <div className="card-content">
        {/* 释义 */}
        <div className="space-y-3 mb-4">
          {word.definitions.slice(0, 3).map((def, index) => (
            <div key={index} className="border-l-2 border-gray-200" style={{ paddingLeft: '6px' }}>
              {def.partOfSpeech && (
                <span className="badge badge-secondary text-xs mb-1">
                  {def.partOfSpeech}
                </span>
              )}
              <p className="text-gray-700 mb-1">{def.meaning}</p>
              {def.example && (
                <p className="text-sm text-gray-500 italic">
                  例: {def.example}
                </p>
              )}
            </div>
          ))}
          
          {word.definitions.length > 3 && (
            <p className="text-sm text-gray-500">
              还有 {word.definitions.length - 3} 个释义...
            </p>
          )}
        </div>
        
        {/* 例句 */}
        {word.examples.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">例句:</h4>
            <div className="space-y-1">
              {word.examples.slice(0, 2).map((example, index) => (
                <p key={index} className="text-sm text-gray-600 italic">
                  "{example}"
                </p>
              ))}
            </div>
          </div>
        )}
        
        {/* 掌握程度选择器 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">掌握程度:</h4>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => handleMasteryClick(level)}
                className={`group flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium transition-all duration-300 ${
                  word.mastery_level >= level
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg transform scale-110'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105'
                }`}
                title={getMasteryText(level)}
              >
                <Star
                  size={14}
                  fill={word.mastery_level >= level ? 'currentColor' : 'none'}
                  className="transition-all duration-300 group-hover:scale-110"
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <span>添加时间: {formatDate(word.created_at)}</span>
          <span>复习 {word.review_count} 次</span>
        </div>
      </div>
    </div>
  );
};