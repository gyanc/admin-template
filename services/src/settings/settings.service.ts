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

    return {
      key: setting.key,
      value: setting.value,
      category: setting.category,
    };
  }

  async getAll(category?: string) {
    const where = category ? { category } : {};

    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    return settings.map((s) => ({
      key: s.key,
      value: s.value,
      category: s.category,
    }));
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

  async setSetting(key: string, value: any, category: string, userId?: string) {
    // Validate setting exists
    const existing = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with key ${key} not found. Use createSetting to add new settings.`);
    }

    const updated = await this.prisma.setting.update({
      where: { key },
      data: {
        value,
      },
    });

    return {
      key: updated.key,
      value: updated.value,
      category: updated.category,
    };
  }

  async createSetting(key: string, value: any, category: string, userId?: string) {
    // Check if already exists
    const existing = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (existing) {
      throw new BadRequestException(`Setting with key ${key} already exists`);
    }

    const setting = await this.prisma.setting.create({
      data: {
        key,
        value,
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

      const updated = await this.prisma.setting.update({
        where: { key },
        data: { value },
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
