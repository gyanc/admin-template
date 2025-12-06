'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Setting } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface SettingsForm {
  [key: string]: string | number | boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsForm>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: Setting[] }>('/settings');
      const settingsData = response.data.data || [];
      setSettings(settingsData);

      // Initialize form data
      const initial: SettingsForm = {};
      settingsData.forEach((setting) => {
        try {
          if (setting.type === 'json') {
            initial[setting.key] = JSON.stringify(JSON.parse(setting.value), null, 2);
          } else if (setting.type === 'boolean') {
            initial[setting.key] = setting.value === 'true';
          } else if (setting.type === 'number') {
            initial[setting.key] = Number(setting.value);
          } else {
            initial[setting.key] = setting.value;
          }
        } catch {
          initial[setting.key] = setting.value;
        }
      });
      setFormData(initial);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Prepare data for submission
      const updates = Object.entries(formData).map(([key, value]) => {
        const setting = settings.find((s) => s.key === key);
        let finalValue = String(value);

        if (setting?.type === 'json') {
          try {
            JSON.parse(String(value));
          } catch {
            throw new Error(`Invalid JSON for ${key}`);
          }
        }

        return {
          key,
          value: finalValue,
        };
      });

      await apiClient.post('/settings/bulk/update', { settings: updates });
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure application settings and preferences</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settings.map((setting) => (
            <div key={setting.key} className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {setting.key.replace(/_/g, ' ').toUpperCase()}
              </label>
              {setting.description && (
                <p className="text-xs text-gray-500 mb-3">{setting.description}</p>
              )}

              {setting.type === 'boolean' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[setting.key] === true}
                    onChange={(e) => handleChange(setting.key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              ) : setting.type === 'json' ? (
                <textarea
                  value={String(formData[setting.key] || '')}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={6}
                  placeholder="Enter valid JSON..."
                />
              ) : setting.type === 'number' ? (
                <input
                  type="number"
                  value={String(formData[setting.key] || '')}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <input
                  type="text"
                  value={String(formData[setting.key] || '')}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
