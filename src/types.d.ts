import { Request } from 'express'
import { CollectionQueryType } from './controllers/collections'

export interface PageRequest extends Request {
  locals: {
    id?: number | null
    page?: number
    imageType?: ImageType
    collectionType?: CollectionQueryType
    sort?: QuerySort
    title?: string
  }
}

export interface PathIntIdOrSlugRequest extends Request {
  locals: {
    intId?: number
    slug?: string
  }
}

export interface ImageUploadRequest extends Request {
  files: {
    fileImageAnimations: Express.Multer.File[]
    fileImageBorders: Express.Multer.File[]
    fileImageNoBorders: Express.Multer.File[]
  }
}

export type QuerySort = 'alphabetical' | 'reverse-alphabetical' | 'newest' | 'oldest' | 'random'

export type ImageMediumType = 'animation' | 'border' | 'no-border' | 'preview'

export type ImageType = 'painting' | 'meme' | 'painting-and-meme'

export type ArtistProfilePictureType = 'original' | 'preview'

export interface ArtistUploadRequest extends Request {
  files: {
    fileArtistProfilePictures: Express.Multer.File[]
  }
}
