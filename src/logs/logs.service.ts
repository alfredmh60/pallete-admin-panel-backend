import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { Log } from '../entities/log.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async findAll(query: Record<string, any>) {
    const {
      adminId,
      action,
      entityType,
      entityId,
      ip,
      from,
      to,
      limit = 20,
      offset = 0,
      page = 1,
    } = query;

    const take = Number(limit);
    const skip = offset ? Number(offset) : (Number(page) - 1) * take;

    const qb = this.logRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (adminId) qb.andWhere('log.adminId = :adminId', { adminId: Number(adminId) });
    if (action) qb.andWhere('log.action = :action', { action });
    if (entityType) qb.andWhere('log.entityType = :entityType', { entityType });
    if (entityId) qb.andWhere('log.entityId = :entityId', { entityId: Number(entityId) });
    if (ip) qb.andWhere('log.ip = :ip', { ip });
    if (from) qb.andWhere('log.createdAt >= :from', { from });
    if (to) qb.andWhere('log.createdAt <= :to', { to });

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: take,
    };
  }

  async findOne(id: number) {
    const log = await this.logRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!log) {
      throw new NotFoundException('لاگ مورد نظر یافت نشد');
    }

    return log;
  }

  async getStats(params: { from?: string; to?: string }) {
    const qb = this.logRepository.createQueryBuilder('log');
    if (params.from) qb.andWhere('log.createdAt >= :from', { from: params.from });
    if (params.to) qb.andWhere('log.createdAt <= :to', { to: params.to });

    const logs = await qb.getMany();
    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const byUserMap = new Map<number, number>();

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntity[log.entityType] = (byEntity[log.entityType] || 0) + 1;
      if (log.adminId) {
        byUserMap.set(log.adminId, (byUserMap.get(log.adminId) || 0) + 1);
      }
    }

    const last24Hours = await this.logRepository.count({
      where: {
        createdAt: LessThan(new Date()),
      },
    });

    return {
      total: logs.length,
      byAction,
      byEntity,
      byUser: Array.from(byUserMap.entries()).map(([userId, count]) => ({ userId, count })),
      last24Hours,
    };
  }

  async getActions() {
    const rows = await this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .getRawMany();

    return rows.map((row) => row.action).filter(Boolean);
  }

  async getDailyReport(params: { from?: string; to?: string }) {
    const qb = this.logRepository.createQueryBuilder('log');
    if (params.from) qb.andWhere('log.createdAt >= :from', { from: params.from });
    if (params.to) qb.andWhere('log.createdAt <= :to', { to: params.to });

    const logs = await qb.getMany();
    const report = new Map<string, { total: number; users: Set<number> }>();

    for (const log of logs) {
      const date = log.createdAt.toISOString().slice(0, 10);
      const entry = report.get(date) || { total: 0, users: new Set<number>() };
      entry.total += 1;
      if (log.adminId) entry.users.add(log.adminId);
      report.set(date, entry);
    }

    return Array.from(report.entries()).map(([date, value]) => ({
      date,
      total: value.total,
      uniqueUsers: value.users.size,
    }));
  }

  async deleteOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.logRepository.delete({
      createdAt: LessThan(cutoff),
    });

    return {
      message: 'لاگ‌های قدیمی حذف شدند',
      count: result.affected || 0,
    };
  }
}
