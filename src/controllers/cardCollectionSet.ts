import appDataSource from '../db'
import { CardCollectionSet } from '../models/cardCollectionSet'

type CreateCardCollectionSetDto = {
  name: string
  slug: string
  cardCollectionId: number
}

export const createCardCollectionSet = async (
  createCardCollectionSetDto: Partial<CreateCardCollectionSetDto>): Promise<CardCollectionSet> => {
  const cardCollectionSetsRepo = appDataSource.getRepository(CardCollectionSet)
  const { name, slug, cardCollectionId } = createCardCollectionSetDto
  const result = await cardCollectionSetsRepo.save({ name, slug, cardCollectionId })
  return result
}

export const updateCardCollectionSet = async (
  id: number,
  updateCardCollectionSetDto: Partial<CreateCardCollectionSetDto>
): Promise<CardCollectionSet> => {
  const cardCollectionSetsRepo = appDataSource.getRepository(CardCollectionSet)

  let cardCollectionSet = await cardCollectionSetsRepo.findOneBy({ id })
  if (!cardCollectionSet) {
    throw new Error(`CardCollectionSet with ID ${id} not found`)
  }

  cardCollectionSet = { ...cardCollectionSet, ...updateCardCollectionSetDto }

  await cardCollectionSetsRepo.save(cardCollectionSet)

  return cardCollectionSet
}

export const getCardCollectionSet = async (id: number): Promise<CardCollectionSet | null> => {
  const cardCollectionSetsRepo = appDataSource.getRepository(CardCollectionSet)
  const cardCollectionSet = await cardCollectionSetsRepo.findOneBy({ id })
  return cardCollectionSet
}
