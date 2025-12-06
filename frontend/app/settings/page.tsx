'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Setting } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Loader2, Save, RotateCcw, Settings as SettingsIcon, CheckCircle2, Edit2, Plus, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const settingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

type SettingFormData = z.infer<typeof settingSchema>;

interface SettingsForm {
  [key: string]: string | number | boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsForm>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<SettingsForm>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<SettingFormData>({
    resolver: zodResolver(settingSchema),
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if form data has changed
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

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
      setOriginalData(JSON.parse(JSON.stringify(initial)));
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

  const handleReset = () => {
    setFormData(JSON.parse(JSON.stringify(originalData)));
    toast.success('Settings reset to original values');
  };

  const handleEditSetting = (setting: Setting) => {
    setEditingSetting(setting);
    const currentValue = formData[setting.key];
    setValue('value', String(currentValue || setting.value || ''));
    setDrawerOpen(true);
  };

  const handleUpdateSetting = async (data: SettingFormData) => {
    if (!editingSetting) return;

    try {
      await apiClient.put(`/settings/${editingSetting.key}`, {
        value: data.value,
        category: editingSetting.type === 'json' ? 'general' : undefined,
      });
      toast.success('Setting updated successfully');
      setDrawerOpen(false);
      fetchSettings();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update setting';
      toast.error(message);
    }
  };

  const handleCreateSetting = async (data: SettingFormData) => {
    try {
      const key = `general_${Date.now()}`;
      await apiClient.post('/settings', {
        key,
        value: data.value,
        category: 'general',
      });
      toast.success('Setting created successfully');
      setCreateDrawerOpen(false);
      reset();
      fetchSettings();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create setting';
      toast.error(message);
    }
  };

  // Group settings by category (assuming key format like 'category_key')
  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.key.split('_')[0] || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Settings' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure application settings, preferences, and system behavior
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>You have unsaved changes</span>
              </div>
            )}
            <Button variant="outline" onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <SettingsIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {category} Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categorySettings.map((setting) => (
                  <div key={setting.key} className="space-y-2 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Label htmlFor={setting.key} className="text-sm font-semibold text-gray-700">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {setting.description && (
                          <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditSetting(setting)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Quick Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {setting.type === 'boolean' ? (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          id={setting.key}
                          checked={formData[setting.key] === true}
                          onChange={(e) => handleChange(setting.key, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {formData[setting.key] ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    ) : setting.type === 'json' ? (
                      <Textarea
                        id={setting.key}
                        value={String(formData[setting.key] || '')}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="font-mono text-sm min-h-[120px]"
                        placeholder="Enter valid JSON..."
                        readOnly
                      />
                    ) : setting.type === 'number' ? (
                      <Input
                        id={setting.key}
                        type="number"
                        value={String(formData[setting.key] || '')}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        readOnly
                      />
                    ) : (
                      <Input
                        id={setting.key}
                        type="text"
                        value={String(formData[setting.key] || '')}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        readOnly
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            {hasChanges
              ? 'You have unsaved changes. Don\'t forget to save your settings.'
              : 'All settings are saved.'}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || !hasChanges}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Edit Setting Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            {editingSetting ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>
                        {editingSetting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </DrawerTitle>
                      <DrawerDescription>
                        {editingSetting.description || 'Edit setting value'}
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <form onSubmit={handleSubmit(handleUpdateSetting)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="setting-value" className="text-sm font-semibold">
                        Value <span className="text-red-500">*</span>
                      </Label>
                      {editingSetting.type === 'json' ? (
                        <Textarea
                          id="setting-value"
                          {...register('value')}
                          disabled={isSubmitting}
                          rows={10}
                          className="font-mono text-sm"
                          placeholder="Enter valid JSON..."
                        />
                      ) : editingSetting.type === 'number' ? (
                        <Input
                          id="setting-value"
                          type="number"
                          {...register('value')}
                          disabled={isSubmitting}
                          className={errors.value ? 'border-red-500' : ''}
                        />
                      ) : editingSetting.type === 'boolean' ? (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            id="setting-value"
                            checked={formData[editingSetting.key] === true}
                            onChange={(e) => {
                              handleChange(editingSetting.key, e.target.checked);
                              setValue('value', String(e.target.checked));
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            disabled={isSubmitting}
                          />
                          <Label htmlFor="setting-value" className="text-sm font-semibold text-gray-900 cursor-pointer">
                            {formData[editingSetting.key] ? 'Enabled' : 'Disabled'}
                          </Label>
                        </div>
                      ) : (
                        <Input
                          id="setting-value"
                          type="text"
                          {...register('value')}
                          disabled={isSubmitting}
                          className={errors.value ? 'border-red-500' : ''}
                        />
                      )}
                      {errors.value && (
                        <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="font-medium text-gray-900 capitalize">{editingSetting.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Key</p>
                          <p className="font-medium text-gray-900 font-mono text-xs">{editingSetting.key}</p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <DrawerFooter className="flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(handleUpdateSetting)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Setting
                      </>
                    )}
                  </Button>
                </DrawerFooter>
              </div>
            ) : null}
          </DrawerContent>
        </Drawer>

        {/* Create Setting Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New Setting</DrawerTitle>
                    <DrawerDescription>Add a new system setting</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmit(handleCreateSetting)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-value" className="text-sm font-semibold">
                      Value <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-value"
                      type="text"
                      {...register('value')}
                      disabled={isSubmitting}
                      className={errors.value ? 'border-red-500' : ''}
                      placeholder="Enter setting value"
                    />
                    {errors.value && (
                      <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      A unique key will be automatically generated
                    </p>
                  </div>
                </form>
              </div>

              <DrawerFooter className="flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDrawerOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit(handleCreateSetting)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Setting
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
