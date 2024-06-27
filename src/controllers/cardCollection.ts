import appDataSource from '../db'
import { CardCollection } from '../models/cardCollection'

type CreateCardCollectionDto = {
  name: string
  slug: string
}

export const createCardCollection = async (
  createCardCollectionDto: Partial<CreateCardCollectionDto>): Promise<CardCollection> => {
  const cardCollectionsRepo = appDataSource.getRepository(CardCollection)
  const cardCollection = cardCollectionsRepo.create(createCardCollectionDto)
  await cardCollectionsRepo.save(cardCollection)
  return cardCollection
}

export const updateCardCollection = async (
  id: number,
  updateCardCollectionDto: Partial<CreateCardCollectionDto>
): Promise<CardCollection> => {
  const cardCollectionsRepo = appDataSource.getRepository(CardCollection)

  let cardCollection = await cardCollectionsRepo.findOneBy({ id })
  if (!cardCollection) {
    throw new Error(`CardCollection with ID ${id} not found`)
  }

  cardCollection = { ...cardCollection, ...updateCardCollectionDto }

  await cardCollectionsRepo.save(cardCollection)

  return cardCollection
}

export const getCardCollection = async (id: number): Promise<CardCollection | null> => {
  const cardCollectionsRepo = appDataSource.getRepository(CardCollection)
  const cardCollection = await cardCollectionsRepo.findOneBy({ id })
  return cardCollection
}
