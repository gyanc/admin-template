'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { User, Staff, ChangePasswordDto } from '@/lib/types';
import { useState } from 'react';
import { usersApi, staffApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Mail, Calendar, Shield, KeyRound, Save, User as UserIcon, Phone, Building, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ProfileClientProps {
  initialUser: User | Staff;
}

export function ProfileClient({ initialUser }: ProfileClientProps) {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<User | Staff>(initialUser);
  const [isStaff, setIsStaff] = useState<boolean>('department' in user);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isUpdatingProfile },
    reset: resetProfile,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: 'phone' in user ? user.phone : undefined,
      department: 'department' in user ? user.department : undefined,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isChangingPasswordForm },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleUpdateProfile = async (data: UpdateProfileFormData) => {
    try {
      setIsUpdating(true);
      
      if (isStaff) {
        await staffApi.update(user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          department: data.department,
        });
      } else {
        await usersApi.update(user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }
      
      toast.success('Profile updated successfully');
      await refreshUser();
      // Update local state
      setUser({
        ...user,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || user.email,
        ...(isStaff && { phone: data.phone, department: data.department }),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      setIsChangingPassword(true);
      
      await apiClient.post('/auth/change-password', {
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      toast.success('Password changed successfully');
      resetPassword();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'My Profile' }]} />

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {isStaff && 'department' in user && user.department && (
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {user.department}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user.isActive ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'password'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' ? (
              <form onSubmit={handleSubmitProfile(handleUpdateProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      {...registerProfile('firstName')}
                      disabled={isUpdatingProfile}
                      className={profileErrors.firstName ? 'border-red-500' : ''}
                    />
                    {profileErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{profileErrors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      {...registerProfile('lastName')}
                      disabled={isUpdatingProfile}
                      className={profileErrors.lastName ? 'border-red-500' : ''}
                    />
                    {profileErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile('email')}
                    disabled={isUpdatingProfile || !isStaff}
                    className={profileErrors.email ? 'border-red-500' : ''}
                  />
                  {profileErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{profileErrors.email.message}</p>
                  )}
                  {!isStaff && (
                    <p className="text-gray-500 text-xs mt-1">Email cannot be changed for regular users</p>
                  )}
                </div>

                {isStaff && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...registerProfile('phone')}
                        disabled={isUpdatingProfile}
                        className={profileErrors.phone ? 'border-red-500' : ''}
                      />
                      {profileErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{profileErrors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-semibold">
                        Department
                      </Label>
                      <Input
                        id="department"
                        type="text"
                        {...registerProfile('department')}
                        disabled={isUpdatingProfile}
                        className={profileErrors.department ? 'border-red-500' : ''}
                      />
                      {profileErrors.department && (
                        <p className="text-red-500 text-xs mt-1">{profileErrors.department.message}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetProfile()}
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitPassword(handleChangePassword)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-sm font-semibold">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    {...registerPassword('oldPassword')}
                    disabled={isChangingPasswordForm}
                    className={passwordErrors.oldPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.oldPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.oldPassword.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold">
                      New Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...registerPassword('newPassword')}
                      disabled={isChangingPasswordForm}
                      className={passwordErrors.newPassword ? 'border-red-500' : ''}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                      Confirm New Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerPassword('confirmPassword')}
                      disabled={isChangingPasswordForm}
                      className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetPassword()}
                    disabled={isChangingPasswordForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isChangingPasswordForm}
                  >
                    {isChangingPasswordForm ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {user.roles && user.roles.length > 0 && (
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-sm mb-1">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
