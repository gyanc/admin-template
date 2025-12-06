'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { Users, UserCheck, FileText, HelpCircle, Mail, Settings, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/lib/types';

interface DashboardStats {
  totalUsers: number;
  totalStaff: number;
  totalPages: number;
  totalFaqs: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStaff: 0,
    totalPages: 0,
    totalFaqs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [usersRes, staffRes, cmsRes, faqRes] = await Promise.all([
        apiClient.get<PaginatedResponse<any>>('/users?limit=1'),
        apiClient.get<PaginatedResponse<any>>('/staff?limit=1'),
        apiClient.get<PaginatedResponse<any>>('/cms?limit=1'),
        apiClient.get<PaginatedResponse<any>>('/faq?limit=1'),
      ]);

      setStats({
        totalUsers: usersRes.data.meta?.total || 0,
        totalStaff: staffRes.data.meta?.total || 0,
        totalPages: cmsRes.data.meta?.total || 0,
        totalFaqs: faqRes.data.meta?.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your admin panel
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="bg-blue-500"
          />
          <StatCard
            icon={UserCheck}
            label="Staff Members"
            value={stats.totalStaff}
            color="bg-green-500"
          />
          <StatCard
            icon={FileText}
            label="CMS Pages"
            value={stats.totalPages}
            color="bg-purple-500"
          />
          <StatCard
            icon={HelpCircle}
            label="FAQs"
            value={stats.totalFaqs}
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/users"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Manage Users</span>
              </a>
              <a
                href="/staff"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Manage Staff</span>
              </a>
              <a
                href="/cms"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Edit CMS Pages</span>
              </a>
              <a
                href="/faq"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700">Manage FAQs</span>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Role:</span>
                <span className="font-medium text-gray-900">
                  {user?.roles?.[0]?.name || 'User'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Active</span>
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <a
                  href="/settings"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Go to Settings
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Getting Started
              </h2>
              <p className="text-gray-700 mb-4">
                Welcome to your Admin Panel! Start by exploring the different modules:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Users:</strong> Manage user accounts and roles</li>
                <li>• <strong>Staff:</strong> Manage admin staff members</li>
                <li>• <strong>CMS:</strong> Create and manage website content</li>
                <li>• <strong>FAQ:</strong> Manage frequently asked questions</li>
                <li>• <strong>Email Templates:</strong> Design email templates</li>
                <li>• <strong>Settings:</strong> Configure system settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
