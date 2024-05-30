import { NextFunction, Response } from 'express'
import { ImageMediumType, ImageType, PageRequest, QuerySort } from '../types'
import { CollectionQueryType } from '../controllers/collections'

export const parsePageQuery = async (req: PageRequest, res: Response, next: NextFunction) => {
  const { id, page, imageType, imageMediumType, sort, title } = req.query

  let parsedPage = typeof page === 'string' ? Math.ceil(parseInt(page, 10)) : 1
  parsedPage = parsedPage < 1 ? 1 : parsedPage

  const parsedId = typeof id === 'string' ? parseInt(id, 10) : null

  const parsedImageType: ImageType = ['meme', 'painting'].includes(imageType as string)
    ? imageType as ImageType : 'painting-and-meme'

  const parsedImageMediumType: ImageMediumType | null = ['animation', 'border', 'no-border', 'video'].includes(imageMediumType as string)
    ? imageMediumType as ImageMediumType : null

  const parsedQuerySort: QuerySort = ['alphabetical', 'reverse-alphabetical', 'newest', 'oldest', 'random']
    .includes(sort as string) ? sort as QuerySort : 'newest'

  const parsedTitle = typeof title === 'string' ? title : null

  req.locals = {
    id: parsedId,
    page: parsedPage,
    imageType: parsedImageType,
    imageMediumType: parsedImageMediumType,
    sort: parsedQuerySort,
    title: parsedTitle
  }

  await next()
}

export const parseCollectionsQuery = async (req: PageRequest, res: Response, next: NextFunction) => {
  const { sort, collectionType } = req.query

  const parsedCollectionType: CollectionQueryType = ['general', 'telegram-stickers', 'discord-stickers', 'stickers', 'all']
    .includes(collectionType as string) ? collectionType as CollectionQueryType : 'all' 

  const parsedQuerySort: QuerySort = ['alphabetical', 'reverse-alphabetical', 'newest', 'oldest']
    .includes(sort as string) ? sort as QuerySort : 'newest'

  req.locals = {
    ...req.locals,
    collectionType: parsedCollectionType,
    sort: parsedQuerySort
  }

  await next()
}