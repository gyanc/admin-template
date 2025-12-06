import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const permissions = [
    // Users permissions
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    // Staff permissions
    { resource: 'staff', action: 'create' },
    { resource: 'staff', action: 'read' },
    { resource: 'staff', action: 'update' },
    { resource: 'staff', action: 'delete' },
    { resource: 'staff', action: 'manage' },
    // Roles permissions
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'roles', action: 'manage' },
    // Permissions
    { resource: 'permissions', action: 'read' },
    { resource: 'permissions', action: 'manage' },
    // CMS permissions
    { resource: 'cms', action: 'create' },
    { resource: 'cms', action: 'read' },
    { resource: 'cms', action: 'update' },
    { resource: 'cms', action: 'delete' },
    { resource: 'cms', action: 'publish' },
    // FAQ permissions
    { resource: 'faq', action: 'create' },
    { resource: 'faq', action: 'read' },
    { resource: 'faq', action: 'update' },
    { resource: 'faq', action: 'delete' },
    { resource: 'faq', action: 'manage' },
    // Email templates
    { resource: 'email_templates', action: 'create' },
    { resource: 'email_templates', action: 'read' },
    { resource: 'email_templates', action: 'update' },
    { resource: 'email_templates', action: 'delete' },
    { resource: 'email_templates', action: 'manage' },
    // Settings
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'update' },
    // Audit
    { resource: 'audit', action: 'read' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: {},
        create: {
          resource: perm.resource,
          action: perm.action,
        },
      }),
    ),
  );

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // Create roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access',
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Administrator with most permissions',
    },
  });

  const contentManagerRole = await prisma.role.create({
    data: {
      name: 'Content Manager',
      description: 'Manages CMS pages and FAQs',
    },
  });

  const staffManagerRole = await prisma.role.create({
    data: {
      name: 'Staff Manager',
      description: 'Manages staff accounts',
    },
  });

  const userManagerRole = await prisma.role.create({
    data: {
      name: 'User Manager',
      description: 'Manages end users',
    },
  });

  console.log(`✅ Created 5 roles`);

  // Assign all permissions to Super Admin
  await prisma.rolePermission.createMany({
    data: createdPermissions.map((perm) => ({
      roleId: superAdminRole.id,
      permissionId: perm.id,
    })),
  });

  // Assign permissions to Admin (all except some)
  const adminPermissions = createdPermissions.filter(
    (p) => !['permissions:manage', 'roles:delete'].includes(`${p.resource}:${p.action}`),
  );
  await prisma.rolePermission.createMany({
    data: adminPermissions.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    })),
  });

  // Assign permissions to Content Manager
  const contentPermissions = createdPermissions.filter(
    (p) => `${p.resource}:${p.action}`.match(/^(cms|faq):/),
  );
  await prisma.rolePermission.createMany({
    data: contentPermissions.map((perm) => ({
      roleId: contentManagerRole.id,
      permissionId: perm.id,
    })),
  });

  // Assign permissions to Staff Manager
  const staffPermissions = createdPermissions.filter(
    (p) => `${p.resource}:${p.action}`.match(/^staff:/),
  );
  await prisma.rolePermission.createMany({
    data: staffPermissions.map((perm) => ({
      roleId: staffManagerRole.id,
      permissionId: perm.id,
    })),
  });

  // Assign permissions to User Manager
  const userPermissions = createdPermissions.filter(
    (p) => `${p.resource}:${p.action}`.match(/^users:/),
  );
  await prisma.rolePermission.createMany({
    data: userPermissions.map((perm) => ({
      roleId: userManagerRole.id,
      permissionId: perm.id,
    })),
  });

  console.log(`✅ Assigned permissions to roles`);

  // Create super admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@adminpanel.com',
      password: hashedPassword,
      name: 'Super Administrator',
      phone: '+1-555-0000',
      status: 'ACTIVE',
      roles: {
        create: [
          {
            roleId: superAdminRole.id,
          },
        ],
      },
    },
  });

  console.log(`✅ Created super admin user: ${superAdmin.email}`);

  // Create staff
  const admin = await prisma.staff.create({
    data: {
      email: 'admin@adminpanel.com',
      password: hashedPassword,
      name: 'Admin Staff',
      phone: '+1-555-0001',
      department: 'Administration',
      status: 'ACTIVE',
      roles: {
        create: [
          {
            roleId: adminRole.id,
          },
        ],
      },
    },
  });

  const contentManager = await prisma.staff.create({
    data: {
      email: 'content@adminpanel.com',
      password: hashedPassword,
      name: 'Content Manager',
      phone: '+1-555-0002',
      department: 'Content',
      status: 'ACTIVE',
      roles: {
        create: [
          {
            roleId: contentManagerRole.id,
          },
        ],
      },
    },
  });

  console.log(`✅ Created staff accounts`);

  // Create FAQ categories
  await prisma.faqCategory.createMany({
    data: [
      { name: 'Account & Login', priority: 1 },
      { name: 'Password Management', priority: 2 },
      { name: 'Subscriptions', priority: 3 },
      { name: 'Billing', priority: 4 },
      { name: 'Technical Support', priority: 5 },
      { name: 'General Questions', priority: 6 },
    ],
  });

  console.log(`✅ Created FAQ categories`);

  // Create sample settings
  await prisma.setting.createMany({
    data: [
      {
        key: 'system_name',
        value: { value: 'Admin Panel' },
        category: 'general',
      },
      {
        key: 'system_email',
        value: { value: 'noreply@adminpanel.com' },
        category: 'general',
      },
      {
        key: 'jwt_expires_in',
        value: { value: '24h' },
        category: 'auth',
      },
      {
        key: 'password_min_length',
        value: { value: 8 },
        category: 'auth',
      },
      {
        key: 'max_login_attempts',
        value: { value: 5 },
        category: 'auth',
      },
      {
        key: 'account_lock_duration_minutes',
        value: { value: 15 },
        category: 'auth',
      },
      {
        key: 'max_file_upload_size_mb',
        value: { value: 5 },
        category: 'file_upload',
      },
    ],
  });

  console.log(`✅ Created system settings`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Default Credentials:');
  console.log('   Super Admin: superadmin@adminpanel.com / Admin@123');
  console.log('   Admin: admin@adminpanel.com / Admin@123');
  console.log('   Content Manager: content@adminpanel.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
