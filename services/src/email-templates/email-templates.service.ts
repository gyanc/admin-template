import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmailTemplateDto: any, userId: string) {
    const { name, subject, bodyHtml, bodyText, variables, triggerType, body } = createEmailTemplateDto;

    if (!name || !subject || !triggerType) {
      throw new BadRequestException('Name, subject, and triggerType are required');
    }

    // Use body if provided, otherwise use bodyHtml/bodyText or empty strings
    const finalBodyHtml = bodyHtml || body || '';
    const finalBodyText = bodyText || body || '';

    const template = await this.prisma.emailTemplate.create({
      data: {
        name,
        subject,
        bodyHtml: finalBodyHtml,
        bodyText: finalBodyText,
        triggerType,
        variables: variables || [],
        createdById: userId,
        versions: {
          create: {
            version: 1,
            subject,
            bodyHtml,
            bodyText,
          },
        },
      },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        createdBy: { select: { id: true, email: true } },
      },
    });

    return template;
  }

  async findAll(skip: number = 0, take: number = 10, triggerType?: string, search?: string) {
    const where: any = {
      ...(triggerType && { triggerType }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        skip,
        take,
        include: {
          versions: { orderBy: { version: 'desc' }, take: 1 },
          createdBy: { select: { id: true, email: true } },
          updatedBy: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);
    const currentPage = Math.floor(skip / take) + 1;

    return {
      data,
      meta: {
        total,
        page: currentPage,
        limit: take,
        totalPages,
      },
      pagination: {
        total,
        skip,
        take,
        pages: totalPages,
      },
    };
  }

  async findOne(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        createdBy: { select: { id: true, email: true, name: true } },
        updatedBy: { select: { id: true, email: true, name: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Email template with ID ${id} not found`);
    }

    return template;
  }

  async update(id: string, updateEmailTemplateDto: any, userId: string) {
    const template = await this.findOne(id);

    const { name, subject, bodyHtml, bodyText, triggerType, variables } = updateEmailTemplateDto;

    const latestVersion = template.versions[0];

    // Create new version if content changed
    if (subject !== latestVersion.subject || bodyHtml !== latestVersion.bodyHtml || bodyText !== latestVersion.bodyText) {
      await this.prisma.emailTemplateVersion.create({
        data: {
          templateId: id,
          version: (latestVersion?.version || 0) + 1,
          subject: subject || latestVersion.subject,
          bodyHtml: bodyHtml || latestVersion.bodyHtml,
          bodyText: bodyText || latestVersion.bodyText,
        },
      });
    }

    const updatedTemplate = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(bodyHtml && { bodyHtml }),
        ...(bodyText && { bodyText }),
        ...(triggerType && { triggerType }),
        ...(variables && { variables }),
        updatedById: userId,
      },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        createdBy: { select: { id: true, email: true } },
        updatedBy: { select: { id: true, email: true } },
      },
    });

    return updatedTemplate;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    return { message: 'Email template deleted successfully' };
  }

  async getVersions(templateId: string, skip: number = 0, take: number = 10) {
    const template = await this.findOne(templateId);

    const [versions, total] = await Promise.all([
      this.prisma.emailTemplateVersion.findMany({
        where: { templateId },
        skip,
        take,
        orderBy: { version: 'desc' },
      }),
      this.prisma.emailTemplateVersion.count({ where: { templateId } }),
    ]);

    return {
      templateName: template.name,
      versions,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async restoreVersion(templateId: string, version: number, userId: string) {
    const template = await this.findOne(templateId);

    const versionToRestore = await this.prisma.emailTemplateVersion.findFirst({
      where: { templateId, version },
    });

    if (!versionToRestore) {
      throw new NotFoundException(`Version ${version} not found for template ${templateId}`);
    }

    const latestVersion = await this.prisma.emailTemplateVersion.findFirst({
      where: { templateId },
      orderBy: { version: 'desc' },
    });

    // Create new version with restored content
    const newVersion = await this.prisma.emailTemplateVersion.create({
      data: {
        templateId,
        version: (latestVersion?.version || 0) + 1,
        subject: versionToRestore.subject,
        bodyHtml: versionToRestore.bodyHtml,
        bodyText: versionToRestore.bodyText,
      },
    });

    await this.prisma.emailTemplate.update({
      where: { id: templateId },
      data: { updatedById: userId },
    });

    return {
      message: `Restored version ${version} as new version ${newVersion.version}`,
      newVersion,
    };
  }
}
