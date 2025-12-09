'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { User, Staff } from "@/lib/types";
import {
  Users,
  UserCheck,
  FileText,
  HelpCircle,
  Mail,
  Settings,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

export interface ActivityItem {
  id: string;
  type: "user" | "staff" | "cms" | "faq" | "email";
  action: string;
  description: string;
  timestamp: string;
  user?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalStaff: number;
  totalPages: number;
  totalFaqs: number;
  activeUsers: number;
  recentActivity: ActivityItem[];
  userGrowth: { date: string; users: number }[];
  pageViews: { date: string; views: number }[];
}

interface DashboardClientProps {
  user: User | Staff;
  stats: DashboardStats;
}

export function DashboardClient({ user, stats }: DashboardClientProps) {
  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    changeType,
    color,
    href,
  }: {
    icon: any;
    label: string;
    value: number | string;
    change?: string;
    changeType?: "increase" | "decrease";
    color: string;
    href?: string;
  }) => {
    const content = (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}
            >
              {changeType === "increase" ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    );

    if (href) {
      return <Link href={href}>{content}</Link>;
    }
    return content;
  };

  const ActivityIcon = ({ type }: { type: ActivityItem["type"] }) => {
    const icons = {
      user: Users,
      staff: UserCheck,
      cms: FileText,
      faq: HelpCircle,
      email: Mail,
    };
    const Icon = icons[type] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="text-sm text-gray-500 mb-2">
              <span className="hover:text-gray-700">Dashboard</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your admin panel today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid - Modern CRM Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            change="+12%"
            changeType="increase"
            color="bg-blue-500"
            href="/users"
          />
          <StatCard
            icon={UserCheck}
            label="Staff Members"
            value={stats.totalStaff}
            change="+5%"
            changeType="increase"
            color="bg-green-500"
            href="/staff"
          />
          <StatCard
            icon={FileText}
            label="CMS Pages"
            value={stats.totalPages}
            change="+8%"
            changeType="increase"
            color="bg-purple-500"
            href="/cms"
          />
          <StatCard
            icon={HelpCircle}
            label="FAQs"
            value={stats.totalFaqs}
            change="+3%"
            changeType="increase"
            color="bg-orange-500"
            href="/faq"
          />
        </div>

        {/* Charts Section - Modern CRM Dashboard Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  User Growth
                </h3>
                <p className="text-sm text-gray-600 mt-1">Last 7 days</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Page Views Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Page Views
                </h3>
                <p className="text-sm text-gray-600 mt-1">Last 7 days</p>
              </div>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.pageViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <Bar dataKey="views" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/users/create"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Add New User</span>
              </Link>
              <Link
                href="/staff"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <UserCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700 font-medium">Manage Staff</span>
              </Link>
              <Link
                href="/cms"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700 font-medium">Create CMS Page</span>
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <HelpCircle className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700 font-medium">Add FAQ</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                      </span>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Information Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                System Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Your Role</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.roles?.[0]?.name || "User"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-900">
                      Active
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Active Users</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stats.activeUsers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
