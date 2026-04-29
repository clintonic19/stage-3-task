// src/components/dashboard/MetricsCards.jsx
import React from 'react';

const MetricsCards = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Profiles',
      value: metrics.totalProfiles,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Active Sessions',
      value: metrics.activeSessions,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-green-500',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'API Calls Today',
      value: metrics.apiCallsToday,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'bg-purple-500',
      change: '+23%',
      trend: 'up'
    },
    {
      title: 'System Health',
      value: metrics.systemHealth === 'healthy' ? 'Healthy' : 'Degraded',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: metrics.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-yellow-500',
      change: metrics.systemHealth === 'healthy' ? '100%' : '95%',
      trend: metrics.systemHealth === 'healthy' ? 'up' : 'down'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button className="font-medium text-blue-700 hover:text-blue-900">
                View details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;