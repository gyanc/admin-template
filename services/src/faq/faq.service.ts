import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async create(createFaqDto: any, userId: string) {
    const { question, answer, category, status, isActive, priority } = createFaqDto;

    if (!question || !answer) {
      throw new BadRequestException('Question and answer are required');
    }

    // Map isActive to status or use status directly
    let faqStatus = status;
    if (isActive !== undefined) {
      faqStatus = isActive ? 'PUBLISHED' : 'DRAFT';
    } else if (!faqStatus) {
      faqStatus = 'DRAFT';
    }

    const faq = await this.prisma.faq.create({
      data: {
        question,
        answer,
        category: category || 'general',
        status: faqStatus as any,
        priority: priority || 0,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    });

    return faq;
  }

  async findAll(skip: number = 0, take: number = 10, category?: string, search?: string) {
    const where: any = {
      ...(category && { category }),
      ...(search && {
        OR: [{ question: { contains: search, mode: 'insensitive' } }, { answer: { contains: search, mode: 'insensitive' } }],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.faq.findMany({
        where,
        skip,
        take,
        include: { createdBy: { select: { id: true, email: true } } },
        orderBy: { priority: 'desc' },
      }),
      this.prisma.faq.count({ where }),
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
    const faq = await this.prisma.faq.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, email: true, name: true } }, updatedBy: { select: { id: true, email: true, name: true } } },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async update(id: string, updateFaqDto: any, userId: string) {
    await this.findOne(id); // Verify exists

    // Build update data
    const updateData: any = {};
    
    if (updateFaqDto.question !== undefined) updateData.question = updateFaqDto.question;
    if (updateFaqDto.answer !== undefined) updateData.answer = updateFaqDto.answer;
    if (updateFaqDto.category !== undefined) updateData.category = updateFaqDto.category;
    if (updateFaqDto.priority !== undefined) updateData.priority = updateFaqDto.priority;
    
    // Handle status - map isActive to status or use status directly
    if (updateFaqDto.isActive !== undefined) {
      updateData.status = updateFaqDto.isActive ? 'PUBLISHED' : 'DRAFT';
    } else if (updateFaqDto.status !== undefined) {
      updateData.status = updateFaqDto.status;
    }
    
    updateData.updatedById = userId;

    const faq = await this.prisma.faq.update({
      where: { id },
      data: updateData,
      include: { createdBy: { select: { id: true, email: true } }, updatedBy: { select: { id: true, email: true } } },
    });

    return faq;
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists

    await this.prisma.faq.delete({
      where: { id },
    });

    return { message: 'FAQ deleted successfully' };
  }

  async findByCategory(category: string, skip: number = 0, take: number = 10) {
    const categoryExists = await this.prisma.faqCategory.findUnique({
      where: { name: category },
    });

    if (!categoryExists) {
      throw new NotFoundException(`Category ${category} not found`);
    }

    const faqs = await this.prisma.faq.findMany({
      where: { category },
      skip,
      take,
      include: { createdBy: { select: { id: true, email: true } } },
      orderBy: { priority: 'desc' },
    });

    return faqs;
  }

  async recordView(id: string) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException(`FAQ with ID ${id} not found`);

    return this.prisma.faq.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  async recordHelpful(id: string, helpful: boolean) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException(`FAQ with ID ${id} not found`);

    if (helpful) {
      return this.prisma.faq.update({
        where: { id },
        data: { helpful: { increment: 1 } },
      });
    } else {
      return this.prisma.faq.update({
        where: { id },
        data: { notHelpful: { increment: 1 } },
      });
    }
  }

  async updatePriority(faqIds: string[], priorities: number[]) {
    const operations = faqIds.map((id, index) =>
      this.prisma.faq.update({
        where: { id },
        data: { priority: priorities[index] || 0 },
      }),
    );

    await Promise.all(operations);

    return { message: 'FAQ priorities updated successfully' };
  }
}
