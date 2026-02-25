import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TicketDepartment } from '../../entities/ticket-department.entity';
import { AdminDepartment } from '../../entities/admin-department.entity';
import { Admins } from '../../entities/admins.entity';
import { Ticket } from '../../entities/ticket.entity';

import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(TicketDepartment)
    private departmentRepository: Repository<TicketDepartment>,
    @InjectRepository(AdminDepartment)
    private adminDepartmentRepository: Repository<AdminDepartment>,
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async findAll(query: any): Promise<{ data: any[]; total: number }> {
    const { search, limit = 100, offset = 0 } = query;

    const queryBuilder = this.departmentRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.admins', 'adminDept')
      .leftJoinAndSelect('adminDept.admin', 'admin')
      .leftJoinAndSelect('department.tickets', 'ticket');

    if (search) {
      queryBuilder.where(
        '(department.name ILIKE :search OR department.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('department.name', 'ASC');
    queryBuilder.skip(offset).take(limit);

    const [departments, total] = await queryBuilder.getManyAndCount();

    const data = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      createdAt: dept.createdAt,
      adminCount: dept.admins?.length || 0,
      ticketCount: dept.tickets?.length || 0,
      activeTicketCount: dept.tickets?.filter(t => 
        ['new', 'in_progress'].includes(t.status)
      ).length || 0,
    }));

    return { data, total };
  }

  async findOne(id: number, query: any): Promise<any> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['admins', 'admins.admin', 'tickets'],
    });

    if (!department) {
      throw new NotFoundException('دپارتمان مورد نظر یافت نشد');
    }

    return {
      id: department.id,
      name: department.name,
      description: department.description,
      createdAt: department.createdAt,
      admins: department.admins?.map(ad => ({
        id: ad.admin.id,
        name: ad.admin.name,
        email: ad.admin.email,
        avatar: ad.admin.avatar,
      })) || [],
      adminCount: department.admins?.length || 0,
      ticketCount: department.tickets?.length || 0,
      ticketsByStatus: this.groupTicketsByStatus(department.tickets || []),
    };
  }

  async getStats(): Promise<any> {
    const totalDepartments = await this.departmentRepository.count();

    const departmentsWithCounts = await this.departmentRepository
      .createQueryBuilder('department')
      .leftJoin('department.admins', 'adminDept')
      .leftJoin('department.tickets', 'ticket')
      .select('department.id', 'id')
      .addSelect('department.name', 'name')
      .addSelect('COUNT(DISTINCT adminDept.adminId)', 'adminCount')
      .addSelect('COUNT(ticket.id)', 'ticketCount')
      .addSelect('SUM(CASE WHEN ticket.status IN (:...activeStatuses) THEN 1 ELSE 0 END)', 'activeTicketCount')
      .setParameter('activeStatuses', ['new', 'in_progress'])
      .groupBy('department.id')
      .orderBy('ticketCount', 'DESC')
      .getRawMany();

    const mostBusyDepartment = departmentsWithCounts[0];
    const leastBusyDepartment = departmentsWithCounts[departmentsWithCounts.length - 1];

    return {
      totalDepartments,
      departments: departmentsWithCounts,
      mostBusyDepartment,
      leastBusyDepartment,
    };
  }

  async getDepartmentAdmins(departmentId: number): Promise<any[]> {
    const adminDepts = await this.adminDepartmentRepository.find({
      where: { departmentId },
      relations: ['admin'],
    });

    return adminDepts.map(ad => ({
      id: ad.admin.id,
      name: ad.admin.name,
      email: ad.admin.email,
      avatar: ad.admin.avatar,
      isActive: ad.admin.isActive,
    }));
  }

  async create(createDepartmentDto: CreateDepartmentDto, creatorId: number): Promise<any> {
    const { name, description } = createDepartmentDto;

    // بررسی تکراری نبودن نام
    const existing = await this.departmentRepository.findOne({
      where: { name },
    });
    if (existing) {
      throw new ConflictException('دپارتمانی با این نام قبلاً ثبت شده است');
    }

    const department = this.departmentRepository.create({
      name,
      description,
    });

    const savedDepartment = await this.departmentRepository.save(department);

    return {
      id: savedDepartment.id,
      name: savedDepartment.name,
      description: savedDepartment.description,
      createdAt: savedDepartment.createdAt,
    };
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto): Promise<any> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('دپارتمان مورد نظر یافت نشد');
    }

    const { name, description } = updateDepartmentDto;

    // بررسی تکراری نبودن نام (اگر نام تغییر کرده باشد)
    if (name && name !== department.name) {
      const existing = await this.departmentRepository.findOne({
        where: { name },
      });
      if (existing) {
        throw new ConflictException('دپارتمانی با این نام قبلاً ثبت شده است');
      }
    }

    const updateData: Partial<TicketDepartment> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await this.departmentRepository.update(id, updateData);

    const updatedDepartment = await this.departmentRepository.findOne({
      where: { id },
    });

    return {
      id: updatedDepartment?.id,
      name: updatedDepartment?.name,
      description: updatedDepartment?.description,
      createdAt: updatedDepartment?.createdAt,
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['tickets', 'admins'],
    });

    if (!department) {
      throw new NotFoundException('دپارتمان مورد نظر یافت نشد');
    }

    // بررسی وجود تیکت در این دپارتمان
    if (department.tickets && department.tickets.length > 0) {
      throw new BadRequestException(
        'این دپارتمان دارای تیکت است و قابل حذف نیست',
      );
    }

    // حذف ارتباط با ادمین‌ها
    if (department.admins && department.admins.length > 0) {
      await this.adminDepartmentRepository.delete({ departmentId: id });
    }

    await this.departmentRepository.delete(id);

    return { message: 'دپارتمان با موفقیت حذف شد' };
  }

  async assignAdmins(departmentId: number, adminIds: number[]): Promise<{ message: string }> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('دپارتمان مورد نظر یافت نشد');
    }

    // بررسی وجود ادمین‌ها
    const admins = await this.adminRepository.find({
      where: adminIds.map(id => ({ id })),
    });

    if (admins.length !== adminIds.length) {
      throw new BadRequestException('بعضی از ادمین‌ها معتبر نیستند');
    }

    // حذف ارتباطات قبلی
    await this.adminDepartmentRepository.delete({ departmentId });

    // ایجاد ارتباطات جدید
    if (adminIds.length > 0) {
      const adminDepartments = adminIds.map(adminId =>
        this.adminDepartmentRepository.create({
          adminId,
          departmentId,
        }),
      );
      await this.adminDepartmentRepository.save(adminDepartments);
    }

    return { message: 'ادمین‌ها با موفقیت به دپارتمان اختصاص یافتند' };
  }

  async removeAdmin(departmentId: number, adminId: number): Promise<{ message: string }> {
    const adminDept = await this.adminDepartmentRepository.findOne({
      where: { departmentId, adminId },
    });

    if (!adminDept) {
      throw new NotFoundException('این ادمین به این دپارتمان اختصاص ندارد');
    }

    await this.adminDepartmentRepository.delete({ departmentId, adminId });

    return { message: 'ادمین با موفقیت از دپارتمان حذف شد' };
  }

  private groupTicketsByStatus(tickets: Ticket[]): Record<string, number> {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}