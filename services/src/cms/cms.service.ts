import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async create(createCmsDto: any, userId: string) {
    const { title, slug, content, seoTitle, seoDescription, seoKeywords } = createCmsDto;

    // Check if slug is unique
    const existingPage = await this.prisma.cmsPage.findUnique({
      where: { slug },
    });

    if (existingPage) {
      throw new BadRequestException('Slug must be unique');
    }

    const page = await this.prisma.cmsPage.create({
      data: {
        title,
        slug,
        content,
        status: 'DRAFT',
        seoTitle,
        seoDescription,
        seoKeywords,
        createdById: userId,
        updatedById: userId,
      },
    });

    // Create initial version
    await this.prisma.cmsPageVersion.create({
      data: {
        pageId: page.id,
        version: 1,
        title,
        content,
      },
    });

    return page;
  }

  async findAll(skip = 0, take = 20, status?: string) {
    const where = status ? { status: status as any } : {};

    const [pages, total] = await Promise.all([
      this.prisma.cmsPage.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.cmsPage.count({ where }),
    ]);

    return {
      data: pages,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('CMS page not found');
    }

    return page;
  }

  async update(id: string, updateCmsDto: any, userId: string) {
    const { title, content, seoTitle, seoDescription, seoKeywords, slug, status } = updateCmsDto;

    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('CMS page not found');
    }

    // Check if slug is unique (if being changed)
    if (slug && slug !== page.slug) {
      const existingPage = await this.prisma.cmsPage.findUnique({
        where: { slug },
      });
      if (existingPage) {
        throw new BadRequestException('Slug must be unique');
      }
    }

    // Get latest version number
    const latestVersion = await this.prisma.cmsPageVersion.findFirst({
      where: { pageId: id },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new version if content changed
    if (content && content !== page.content) {
      await this.prisma.cmsPageVersion.create({
        data: {
          pageId: id,
          version: nextVersion,
          title: title || page.title,
          content,
        },
      });
    }

    const updated = await this.prisma.cmsPage.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(slug && { slug }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
        ...(status && { status }),
        updatedById: userId,
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('CMS page not found');
    }

    // Soft delete
    await this.prisma.cmsPage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DRAFT',
      },
    });

    return { message: 'CMS page deleted successfully' };
  }

  async publish(id: string, userId: string, scheduledFor?: Date) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('CMS page not found');
    }

    const updated = await this.prisma.cmsPage.update({
      where: { id },
      data: {
        status: scheduledFor ? 'SCHEDULED' : 'PUBLISHED',
        publishedAt: scheduledFor || new Date(),
        scheduledPublishAt: scheduledFor,
        updatedById: userId,
      },
    });

    return updated;
  }

  async unpublish(id: string, userId: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('CMS page not found');
    }

    const updated = await this.prisma.cmsPage.update({
      where: { id },
      data: {
        status: 'DRAFT',
        publishedAt: null,
        scheduledPublishAt: null,
        updatedById: userId,
      },
    });

    return updated;
  }

  async getVersions(id: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('CMS page not found');
    }

    return page.versions;
  }

  async restoreVersion(pageId: string, version: number, userId: string) {
    const versionData = await this.prisma.cmsPageVersion.findUnique({
      where: {
        pageId_version: {
          pageId,
          version,
        },
      },
    });

    if (!versionData) {
      throw new NotFoundException('Version not found');
    }

    // Get latest version number
    const latestVersion = await this.prisma.cmsPageVersion.findFirst({
      where: { pageId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new version with restored content
    await this.prisma.cmsPageVersion.create({
      data: {
        pageId,
        version: nextVersion,
        title: versionData.title,
        content: versionData.content,
      },
    });

    // Update page
    const updated = await this.prisma.cmsPage.update({
      where: { id: pageId },
      data: {
        title: versionData.title,
        content: versionData.content,
        updatedById: userId,
      },
    });

    return updated;
  }
}
