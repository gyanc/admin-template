import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSetting(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    // Infer type from value
    let type: 'string' | 'number' | 'boolean' | 'json' = 'string';
    let stringValue = '';
    
    if (typeof setting.value === 'object' && setting.value !== null) {
      if ('value' in setting.value) {
        const actualValue = (setting.value as any).value;
        if (typeof actualValue === 'boolean') {
          type = 'boolean';
          stringValue = String(actualValue);
        } else if (typeof actualValue === 'number') {
          type = 'number';
          stringValue = String(actualValue);
        } else if (typeof actualValue === 'string') {
          type = 'string';
          stringValue = actualValue;
        } else {
          type = 'json';
          stringValue = JSON.stringify(actualValue, null, 2);
        }
      } else {
        type = 'json';
        stringValue = JSON.stringify(setting.value, null, 2);
      }
    } else {
      stringValue = String(setting.value);
      if (typeof setting.value === 'boolean') type = 'boolean';
      else if (typeof setting.value === 'number') type = 'number';
      else type = 'string';
    }

    return {
      key: setting.key,
      value: stringValue,
      category: setting.category,
      type,
      description: this.getSettingDescription(setting.key),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  async getAll(category?: string) {
    const where = category ? { category } : {};

    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    return settings.map((s) => {
      // Infer type from value
      let type: 'string' | 'number' | 'boolean' | 'json' = 'string';
      let stringValue = '';
      
      if (typeof s.value === 'object' && s.value !== null) {
        if ('value' in s.value) {
          const actualValue = (s.value as any).value;
          if (typeof actualValue === 'boolean') {
            type = 'boolean';
            stringValue = String(actualValue);
          } else if (typeof actualValue === 'number') {
            type = 'number';
            stringValue = String(actualValue);
          } else if (typeof actualValue === 'string') {
            type = 'string';
            stringValue = actualValue;
          } else {
            type = 'json';
            stringValue = JSON.stringify(actualValue, null, 2);
          }
        } else {
          type = 'json';
          stringValue = JSON.stringify(s.value, null, 2);
        }
      } else {
        stringValue = String(s.value);
        if (typeof s.value === 'boolean') type = 'boolean';
        else if (typeof s.value === 'number') type = 'number';
        else type = 'string';
      }

      return {
        key: s.key,
        value: stringValue,
        category: s.category,
        type,
        description: this.getSettingDescription(s.key),
        updatedAt: s.updatedAt.toISOString(),
      };
    });
  }
  
  private getSettingDescription(key: string): string | undefined {
    const descriptions: Record<string, string> = {
      system_name: 'The name of the system',
      system_email: 'System email address for notifications',
      jwt_expires_in: 'JWT token expiration time',
      password_min_length: 'Minimum password length requirement',
      max_login_attempts: 'Maximum login attempts before account lockout',
      account_lock_duration_minutes: 'Duration in minutes for account lockout',
      max_file_upload_size_mb: 'Maximum file upload size in megabytes',
    };
    return descriptions[key];
  }

  async getByCategory(category: string) {
    const settings = await this.prisma.setting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    if (!settings.length) {
      throw new NotFoundException(`No settings found for category ${category}`);
    }

    return settings.map((s) => ({
      key: s.key,
      value: s.value,
      category: s.category,
    }));
  }

  async setSetting(key: string, value: any, category?: string, userId?: string) {
    // Validate setting exists
    const existing = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with key ${key} not found. Use createSetting to add new settings.`);
    }

    // Parse value based on existing setting structure
    let parsedValue: any;
    if (typeof existing.value === 'object' && existing.value !== null && 'value' in existing.value) {
      // If existing value has nested structure, preserve it
      parsedValue = { value: this.parseValue(value) };
    } else {
      parsedValue = this.parseValue(value);
    }

    const updated = await this.prisma.setting.update({
      where: { key },
      data: {
        value: parsedValue,
        ...(category && { category }),
      },
    });

    return {
      key: updated.key,
      value: updated.value,
      category: updated.category,
    };
  }

  private parseValue(value: string): any {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch {
      // If not JSON, return as string
      return value;
    }
  }

  async createSetting(key: string, value: any, category: string = 'general', userId?: string) {
    // Check if already exists
    const existing = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (existing) {
      throw new BadRequestException(`Setting with key ${key} already exists`);
    }

    // Parse value - wrap in object structure if it's a simple value
    let parsedValue: any;
    try {
      const parsed = JSON.parse(value);
      parsedValue = { value: parsed };
    } catch {
      // If not JSON, wrap as string value
      parsedValue = { value: value };
    }

    const setting = await this.prisma.setting.create({
      data: {
        key,
        value: parsedValue,
        category,
      },
    });

    return {
      key: setting.key,
      value: setting.value,
      category: setting.category,
    };
  }

  async deleteSetting(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    await this.prisma.setting.delete({
      where: { key },
    });

    return { message: `Setting ${key} deleted successfully` };
  }

  async updateMultiple(settings: Array<{ key: string; value: any }>, userId?: string) {
    const results: any[] = [];

    for (const { key, value } of settings) {
      const existing = await this.prisma.setting.findUnique({ where: { key } });
      if (!existing) continue;

      // Parse value based on existing structure
      let parsedValue: any;
      if (typeof existing.value === 'object' && existing.value !== null && 'value' in existing.value) {
        parsedValue = { value: this.parseValue(String(value)) };
      } else {
        parsedValue = this.parseValue(String(value));
      }

      const updated = await this.prisma.setting.update({
        where: { key },
        data: { value: parsedValue },
      });

      results.push({
        key: updated.key,
        value: updated.value,
        category: updated.category,
      });
    }

    return {
      updated: results.length,
      settings: results,
    };
  }
}
