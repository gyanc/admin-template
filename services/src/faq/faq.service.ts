import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async create(createFaqDto: any, userId: string) {
    const { question, answer, category, status } = createFaqDto;

    if (!question || !answer || !category) {
      throw new BadRequestException('Question, answer, and category are required');
    }

    const faq = await this.prisma.faq.create({
      data: {
        question,
        answer,
        category,
        status: status || 'DRAFT',
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

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
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

    const faq = await this.prisma.faq.update({
      where: { id },
      data: {
        ...updateFaqDto,
        updatedById: userId,
      },
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
