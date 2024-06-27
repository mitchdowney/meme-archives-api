/* eslint-disable indent */
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm'
import { TelegramUser } from './telegramUser'
import { CardCollectible } from './cardCollectible'

@Entity('UserCollectible')
export class UserCollectible {
  @PrimaryColumn()
  telegramUserId: string

  @PrimaryColumn()
  cardCollectibleId: number

  @ManyToOne(() => TelegramUser, (telegramUser) => telegramUser.userCollectibles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'telegramUserId', referencedColumnName: 'publicId' })
  telegramUser: TelegramUser

  @ManyToOne(() => CardCollectible, (cardCollectible) => cardCollectible.userCollectibles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardCollectibleId', referencedColumnName: 'id' })
  cardCollectible: CardCollectible
}
