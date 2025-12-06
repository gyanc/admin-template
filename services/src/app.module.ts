import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CmsModule } from './cms/cms.module';
import { RolesModule } from './roles/roles.module';
import { StaffModule } from './staff/staff.module';
import { FaqModule } from './faq/faq.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StaffModule,
    RolesModule,
    CmsModule,
    FaqModule,
    EmailTemplatesModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
