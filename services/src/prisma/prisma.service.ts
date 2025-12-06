import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete all data in reverse order of dependencies
    await this.$transaction([
      this.activityLog.deleteMany(),
      this.loginHistory.deleteMany(),
      this.rolePermission.deleteMany(),
      this.userRole.deleteMany(),
      this.staffRole.deleteMany(),
      this.cmsPageVersion.deleteMany(),
      this.cmsPage.deleteMany(),
      this.faq.deleteMany(),
      this.faqCategory.deleteMany(),
      this.emailTemplateVersion.deleteMany(),
      this.emailTemplate.deleteMany(),
      this.setting.deleteMany(),
      this.permission.deleteMany(),
      this.role.deleteMany(),
      this.user.deleteMany(),
      this.staff.deleteMany(),
    ]);
  }
}
