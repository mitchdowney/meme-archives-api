/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Enum } from 'typeorm'
import { CardCollectionSet } from './cardCollectionSet'

enum EditionType {
  Normal = 'normal',
  Foil = 'foil',
  Gold = 'gold'
}

@Entity('CardCollectible')
export class CardCollectible {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 255 })
  name: string

  @Column({ type: 'int' })
  number: number

  @Column({ type: 'int' })
  rarity: number
  
  @Column({
    type: 'enum',
    enum: EditionType,
    enumName: 'edition_type',
  })
  edition: EditionType

  @Column('text', { name: 'about' })
  description: string

  @Column({ type: 'int', nullable: true })
  artistId: number | null

  @ManyToOne(() => CardCollectionSet, (cardCollectionSet) => cardCollectionSet.cardCollectibles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardCollectionSetId' })
  cardCollectionSet: CardCollectionSet

  @Column()
  cardCollectionSetId: number

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}
