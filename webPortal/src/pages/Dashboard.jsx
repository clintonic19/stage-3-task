// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import MetricsCards from '../components/dashboard/MetricsCards';
import Navbar from '../components/commons/Navbar';
import { api } from '../services/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalProfiles: 0,
    activeSessions: 0,
    apiCallsToday: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  // Real-time updates via WebSocket
  const { lastMessage } = useWebSocket('dashboard');

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'metrics_update') {
        setMetrics(data.metrics);
      } else if (data.type === 'new_activity') {
        setRecentActivity(prev => [data.activity, ...prev].slice(0, 10));
      }
    }
  }, [lastMessage]);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/metrics/dashboard');
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get('/activities/recent');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <MetricsCards metrics={metrics} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">WebSocket</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;