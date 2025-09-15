import React from 'react';
import { BookOpen, Calendar, TrendingUp, Star } from 'lucide-react';

interface StatsData {
  totalWords: number;
  todayWords: number;
  weekWords: number;
  masteryDistribution: Record<number, number>;
}

interface StatsCardProps {
  stats: StatsData;
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="card-content">
              <div className="h-4 bg-gray-100 rounded-lg mb-3"></div>
              <div className="h-8 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getMasteryPercentage = () => {
    const total = stats.totalWords;
    if (total === 0) return 0;
    
    const masteredCount = Object.entries(stats.masteryDistribution)
      .reduce((sum, [level, count]) => {
        return sum + (parseInt(level) >= 3 ? count : 0); // 3级以上算掌握
      }, 0);
    
    return Math.round((masteredCount / total) * 100);
  };

  const statCards = [
    {
      title: '总词汇量',
      value: stats.totalWords,
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'rgba(59, 130, 246, 0.1)'
    },
    {
      title: '今日新增',
      value: stats.todayWords,
      icon: Calendar,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: '本周新增',
      value: stats.weekWords,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'rgba(168, 85, 247, 0.1)'
    },
    {
      title: '掌握率',
      value: `${getMasteryPercentage()}%`,
      icon: Star,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card group cursor-pointer">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className="p-4 rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: stat.iconBg }}
                >
                  <Icon className={`text-white bg-gradient-to-r ${stat.gradient} bg-clip-text`} size={28} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};