import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Cached core seller JWT validation (hash only — never store raw token).
 * Validity is always min(session row, token expiresAt from core).
 */
@Entity('seller_token_sessions')
export class SellerTokenSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('UQ_SELLER_TOKEN_SESSIONS_HASH', { unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Index('IDX_SELLER_TOKEN_SESSIONS_USER_ID')
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  language: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', default: () => 'now()' })
  lastUsedAt: Date;
}
