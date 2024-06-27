/* eslint-disable indent */
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { TelegramUserCardCollectible } from './telegramUserCardCollectible'

@Entity('TelegramUser')
export class TelegramUser {
  @PrimaryColumn()
  publicId: string

  @Column({ type: 'integer' })
  privateId: number

  @Column({ length: 255, nullable: true })
  name: string

  @Column({ length: 255, unique: true })
  slug: string

  @OneToMany(() => TelegramUserCardCollectible, (telegramUserCardCollectible) => telegramUserCardCollectible.telegramUser)
  telegramUserCardCollectibles: TelegramUserCardCollectible[]

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}

