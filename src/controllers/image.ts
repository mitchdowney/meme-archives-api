import { Equal, In, LessThan, MoreThan } from 'typeorm'
import appDataSource from '../db'
import { handleThrowError } from '../lib/errors'
import { getPaginationQueryParams } from '../lib/pagination'
import { Image } from '../models/image'
import { findOrCreateArtists, getArtistById } from './artist'
import { findOrCreateTags, getTagById } from './tag'
import { ImageArtist } from '../models/imageArtist'
import { ImageTag } from '../models/imageTag'
import { queryImageCountMaterializedView } from './imageCountMaterializedView'
import { CollectionImage } from '../models/collection_image'
import { ImageMediumType, ImageType, QuerySort } from '../types'
import { queryImageRandomOrderMaterializedView, queryRandomImagesByArtistPaginated } from './imageRandomOrderMaterializedView'
import { Tag } from '../models/tag'

export async function getImageMaxId() {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const imageWithMaxId = await imageRepo.find({
      order: {
        id: 'DESC'
      },
      take: 1
    })

    if (imageWithMaxId[0]) {
      return imageWithMaxId[0].id
    } else {
      return 0
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImageNext(currentId: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const imageNext = await imageRepo.find({
      where: {
        id: MoreThan(currentId)
      },
      order: {
        id: 'ASC'
      },
      take: 1
    })

    if (imageNext[0]) {
      return imageNext[0]
    } else {
      return null
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImagePrev(currentId: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const imagePrev = await imageRepo.find({
      where: {
        id: LessThan(currentId)
      },
      order: {
        id: 'DESC'
      },
      take: 1
    })

    if (imagePrev[0]) {
      return imagePrev[0]
    } else {
      return null
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type CreateOrUpdateImage = {
  artistNames: string[]
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  has_video: boolean
  id: number
  slug: string | null
  tagTitles: string[]
  title: string | null
  type: ImageType
}

export async function createImage({
  artistNames,
  has_animation,
  has_border,
  has_no_border,
  has_video,
  id,
  slug,
  tagTitles,
  title,
  type
}: CreateOrUpdateImage) {  
  try {
    const imageRepo = appDataSource.getRepository(Image)
  
    const image = new Image()
    image.has_animation = has_animation
    image.has_border = has_border
    image.has_no_border = has_no_border
    image.has_video = has_video
    image.id = id
    image.slug = slug || null
    image.title = title
    image.type = type
  
    const tags = await findOrCreateTags(tagTitles)
    image.tags = tags

    const artists = await findOrCreateArtists(artistNames)
    image.artists = artists

    return imageRepo.save(image)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function updateImage({
  artistNames,
  has_animation,
  has_border,
  has_no_border,
  has_video,
  id,
  slug,
  tagTitles,
  title,
  type
}: CreateOrUpdateImage) {  
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const oldImage = await getImageById(id)
  
    if (!oldImage) {
      throw new Error(`No image found for the id ${id}`)
    }
    
    oldImage.has_animation = has_animation
    oldImage.has_border = has_border
    oldImage.has_no_border = has_no_border
    oldImage.has_video = has_video
    oldImage.slug = slug || null
    oldImage.title = title
    oldImage.type = type

    // delete existing many-to-many tags for the image before continuing
    const imageTagRepo = appDataSource.getRepository(ImageTag)
    const imageTags = await imageTagRepo.find({ where: { image_id: oldImage.id }})
    await imageTagRepo.remove(imageTags)

    const tags = await findOrCreateTags(tagTitles)
    oldImage.tags = tags

    // delete existing many-to-many artists for the image before continuing
    const imageArtistRepo = appDataSource.getRepository(ImageArtist)
    const imageArtists = await imageArtistRepo.find({ where: { image_id: oldImage.id }})
    await imageArtistRepo.remove(imageArtists)

    const artists = await findOrCreateArtists(artistNames)
    oldImage.artists = artists

    return imageRepo.save(oldImage)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function deleteImage(id: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    
    const image = await getImageById(id)
    if (!image) {
      throw new Error('Could not delete because an image with that id does not exist')
    }

    await imageRepo.remove(image)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImageById(id: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image: any = await imageRepo.findOne({
      where: {
        id: Equal(id)
      },
      relations: ['tags', 'artists']
    })

    if (image) {
      const prevData = await getImagePrev(image.id)
      const nextData = await getImageNext(image.id)
      image.prevData = prevData
      image.nextData = nextData
    }

    return image
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImageBySlug(slug: string) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image: any = await imageRepo.findOne({
      where: {
        slug: Equal(slug)
      },
      relations: ['tags', 'artists']
    })

    if (image) {
      const prevData = await getImagePrev(image.id)
      const nextData = await getImageNext(image.id)
      image.prevData = prevData
      image.nextData = nextData
    }
    
    return image
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export const getImageTypesArray = (imageType: ImageType): string[] => {
  if (imageType === 'painting') {
    return ['painting', 'painting-and-meme']
  } else if (imageType === 'meme') {
    return ['meme', 'painting-and-meme']
  } else {
    return []
  }
}

export const getImageMediumTypesQueryColumn = (imageMediumType: ImageMediumType | null): string => {
  if (imageMediumType === 'animation') {
    return 'has_animation'
  } else if (imageMediumType === 'border') {
    return 'has_border'
  } else if (imageMediumType === 'no-border') {
    return 'has_no_border'
  } else if (imageMediumType === 'video') {
    return 'has_video'
  } else {
    return ''
  }
}

const getImageTypeWherePropertyObj = (imageType: ImageType) => {
  const types = getImageTypesArray(imageType)
  return types.length > 0 ? { type: In(types) } : {}
}

type SearchImage = {
  page: number
  imageType: ImageType
  sort: QuerySort
  imageMediumType: ImageMediumType
}

const getImagesOrderBy = (sort: QuerySort): { [key: string]: 'ASC' | 'DESC' } => {
  if (sort === 'alphabetical') {
    return { title: 'ASC' }
  } else if (sort === 'reverse-alphabetical') {
    return { title: 'DESC' }
  } else if (sort === 'oldest') {
    return { created_at: 'ASC' }
  } else {
    return { created_at: 'DESC' }
  }
}

export async function getImages({ page, imageType, sort, imageMediumType }: SearchImage) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const allImagesCount = await queryImageCountMaterializedView()

    let images: Image[]
    if (sort === 'random') {
      images = await queryImageRandomOrderMaterializedView(page, imageType, imageMediumType)
    } else {
      images = await imageRepo.find({
        where: {
          ...getImageTypeWherePropertyObj(imageType),
          ...(getImageMediumTypesQueryColumn(imageMediumType) ? {
            [getImageMediumTypesQueryColumn(imageMediumType)]: true
          } : {})
        },
        ...getPaginationQueryParams(page),
        relations: ['artists', 'tags'],
        order: {
          ...(getImagesOrderBy(sort))
        }
      })
    }

    return [images, allImagesCount]
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImagesByArtistId = {
  artistId: number
  page: number
  sort: QuerySort
}

export async function getImagesByArtistId({ page, artistId, sort }: SearchImagesByArtistId) {
  try {
    const artist = await getArtistById(artistId)
    const imageRepo = appDataSource.getRepository(Image)
    const paginationParams = getPaginationQueryParams(page)
    let data: [Image[], number] = [[], 0]

    if (sort === 'random') {
      data = await queryRandomImagesByArtistPaginated(page, artistId)
    } else {
      data = await imageRepo.findAndCount({
        where: {
          artists: artist
        },
        ...paginationParams,
        relations: ['artists', 'tags'],
        relationLoadStrategy: 'query',
        order: {
          ...(getImagesOrderBy(sort))
        }
      })
    }

    return data
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImagesWithoutArtist = {
  page: number
}

export async function getImagesWithoutArtist({ page }: SearchImagesWithoutArtist) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const { skip, take } = getPaginationQueryParams(page)
    const data = await imageRepo.createQueryBuilder('image')
      .leftJoinAndSelect('image.artists', 'artist')
      .where('artist.id IS NULL')
      .orderBy('image.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount()
  
    return data
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImagesByCollectionId = {
  collection_id: number
  page?: number
}

export async function getImagesAllByCollectionId({ collection_id }: SearchImagesByCollectionId) {
  try {
    const data = await appDataSource
      .createQueryBuilder(CollectionImage, 'ci')
      .innerJoinAndSelect('ci.image', 'image')
      .where('ci.collection_id = :collectionId', { collectionId: collection_id })
      .orderBy('ci.image_position', 'ASC')
      .getManyAndCount()

    const collectionImagesWithImages = data?.[0] || []
    const collectionImagesWithImagesCount = data?.[1] || []

    // Extract images from the collectionImagesWithImages array
    const images = collectionImagesWithImages.map(ci => ci.image)

    return [images, collectionImagesWithImagesCount]
  } catch (error) {
    handleThrowError(error)
  }
}

export async function getImagesByCollectionId({ collection_id, page }: SearchImagesByCollectionId) {
  try {
    const { skip, take } = getPaginationQueryParams(page)
    const data = await appDataSource
      .createQueryBuilder(CollectionImage, 'ci')
      .innerJoinAndSelect('ci.image', 'image')
      .where('ci.collection_id = :collectionId', { collectionId: collection_id })
      .orderBy('ci.image_position', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const collectionImagesWithImages = data?.[0] || []
    const collectionImagesWithImagesCount = data?.[1] || []

    // Extract images from the collectionImagesWithImages array
    const images = collectionImagesWithImages.map(ci => ci.image)

    return [images, collectionImagesWithImagesCount]
  } catch (error) {
    handleThrowError(error)
  }
}

export async function getCollectionPreviewImages(collectionId: number) {
  try {
    const collectionImageRepo = appDataSource.getRepository(CollectionImage)
    const collectionImages = await collectionImageRepo
      .createQueryBuilder('collection_image')
      .where('collection_image.preview_position >= 1')
      .innerJoinAndSelect('collection_image.image', 'image')
      .innerJoin('collection_image.collection', 'collection', 'collection.id = :collectionId', { collectionId })
      .orderBy('collection_image.preview_position', 'ASC')
      .getMany()

    return collectionImages
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImagesByTagId = {
  tagId: number
  page: number
  imageType: ImageType
  imageMediumType: ImageMediumType
}

export async function getImagesByTagId({ page, tagId, imageType, imageMediumType }: SearchImagesByTagId) {
  try {
    const tag = await getTagById(tagId)

    const imageRepo = appDataSource.getRepository(Image)
    const data = await imageRepo.findAndCount({
      where: {
        tags: tag,
        ...getImageTypeWherePropertyObj(imageType),
        ...(getImageMediumTypesQueryColumn(imageMediumType) ? {
          [getImageMediumTypesQueryColumn(imageMediumType)]: true
        } : {})
      },
      ...getPaginationQueryParams(page),
      relations: ['artists', 'tags'],
      relationLoadStrategy: 'query',
      order: {
        created_at: 'DESC'
      }
    })
  
    return data
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type GetRandomImage = {
  tagTitle: string
  imageType: ImageType
  imageMediumType: ImageMediumType | null
  memeOnly: boolean
}

export async function getRandomImage({ tagTitle, imageType, imageMediumType, memeOnly }: GetRandomImage) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    let query = imageRepo.createQueryBuilder('image')
      .select('image.id')

    let tagPresent = false
    
    if (tagTitle) {
      tagTitle = tagTitle.toLowerCase().trim()
      const tagRepo = appDataSource.getRepository(Tag)
      const tag = await tagRepo.findOne({ where: { title: tagTitle } })
      
      if (tag) {
        tagPresent = true
        query = query.innerJoin('image.tags', 'tags', 'tags.id = :tagId', { tagId: tag.id })
      }
    }
    
    if (tagPresent) {
      query = query.orderBy('image.last_get_random_date', 'ASC')
    } else {
      query = query.orderBy('RANDOM()')
    }
    
    if (memeOnly) {
      query = query.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from('image_tags', 'image_pfpTag')
          .innerJoin('tag', 'pfpTag', 'pfpTag.id = image_pfpTag.tag_id')
          .where('pfpTag.title = :pfpTagTitle')
          .andWhere('image_pfpTag.image_id = image.id')
          .getQuery();
        return `NOT EXISTS (${subQuery})`
      }).setParameter('pfpTagTitle', 'pfp')
    }

    query = query.take(1)

    const whereType = getImageTypesArray(imageType)
    if (whereType.length > 0) {
      query = query.andWhere('image.type IN (:...types)', { types: whereType })
    }

    const whereMediumType = getImageMediumTypesQueryColumn(imageMediumType)
    if (whereMediumType) {
      query = query.andWhere(`image.${whereMediumType} IS TRUE`)
    }

    const imageIdResult = await query.getRawOne()
    const imageId = imageIdResult?.image_id

    if (!imageId) {
      return null
    }

    const image = await imageRepo.findOne({
      where: { id: imageId },
      relations: ['tags', 'artists']
    })

    if (image) {
      image.last_get_random_date = new Date()
      await imageRepo.update(image.id, { last_get_random_date: image.last_get_random_date })
    }

    return image
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function updateImageLastGetRandomDate() {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const images = await imageRepo.find()

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const fourDaysAgo = new Date()
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)

    for (const image of images) {
      const randomDate = new Date(fourDaysAgo.getTime() + Math.random() * (threeDaysAgo.getTime() - fourDaysAgo.getTime()))
      image.last_get_random_date = randomDate
      await imageRepo.save(image)
    }

    console.log('Updated last_get_random_date for all images.')
  } catch (error: unknown) {
    console.error('Error updating last_get_random_date:', error)
  }
}
