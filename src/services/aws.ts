// eslint-disable-next-line @typescript-eslint/no-var-requires
import { S3 } from 'aws-sdk'
import { config } from '../lib/config'
import { ArtistProfilePictureType, ImageMediumType } from '../types'

const s3 = new S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
})

/* Images */

export const getImageFromS3 = async (
  id: number,
  imageType: ImageMediumType
) => {
  const key = `${id}${getUploadImageFileName(imageType)}.${getUploadImageFileExtension(imageType)}`

  const params: S3.GetObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key
  }

  const data = await s3.getObject(params).promise()

  return data.Body as Buffer
}

export const deleteImageFromS3 = async (
  id: number,
  imageType: ImageMediumType
) => {
  const key = `${id}${getUploadImageFileName(imageType)}.${getUploadImageFileExtension(imageType)}`
  const params = {
    Bucket: config.aws.imageBucket,
    Key: key
  }

  return s3.deleteObject(params).promise()
}

export const uploadImageToS3 = async (
  id: number,
  imageType: ImageMediumType,
  file: Express.Multer.File
) => {
  const key = `${id}${getUploadImageFileName(imageType)}.${getUploadImageFileExtension(imageType)}`
  const ContentType = getUploadImageMimeType(imageType)

  const params: S3.PutObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key,
    Body: file.buffer,
    ContentType
  }

  const uploadResult = await s3.upload(params).promise()
  return uploadResult.Location
}

const getUploadImageFileName = (imageType: ImageMediumType) => {
  if (imageType === 'video') {
    return '-video'
  } else if (imageType === 'animation') {
    return '-animation'
  } else if (imageType === 'border') {
    return '-border'
  } if (imageType === 'preview') {
    return '-preview'
  } else {
    const useDeprecatedNoBorderImageName = config.aws.useDeprecatedNoBorderImageName
    return useDeprecatedNoBorderImageName ? '-no-border' :''
  }
}

const getUploadImageFileExtension = (imageType: ImageMediumType) => {
  if (imageType === 'video') {
    return 'mp4'
  } else if (imageType === 'animation') {
    return 'gif'
  } else if (
    imageType === 'border' || imageType === 'no-border' || imageType === 'preview') {
    return 'png'
  }
}

const getUploadImageMimeType = (imageType: ImageMediumType) => {
  if (imageType === 'video') {
    return 'video/mp4'
  } else if (imageType === 'animation') {
    return 'image/gif'
  } else if (
    imageType === 'border' || imageType === 'no-border' || imageType === 'preview') {
    return 'image/png'
  }
}

/* Artists */

export const deleteArtistProfilePictureFromS3 = async (
  id: number,
  artistProfilePictureType: ArtistProfilePictureType
) => {
  const key = `/artists/${id}-${getUploadArtistProfilePictureFileName(artistProfilePictureType)}.${getUploadArtistProfilePictureFileExtension(artistProfilePictureType)}`
  const params = {
    Bucket: config.aws.imageBucket,
    Key: key
  }

  return s3.deleteObject(params).promise()
}

export const uploadArtistProfilePictureToS3 = async (
  id: number,
  artistProfilePictureType: ArtistProfilePictureType,
  file: Express.Multer.File
) => {
  const key = `artists/${id}-${getUploadArtistProfilePictureFileName(artistProfilePictureType)}.${getUploadArtistProfilePictureFileExtension(artistProfilePictureType)}`

  const params: S3.PutObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }

  const uploadResult = await s3.upload(params).promise()
  return uploadResult.Location
}

const getUploadArtistProfilePictureFileName = (artistProfilePictureType: ArtistProfilePictureType) => {
  if (artistProfilePictureType === 'preview') {
    return 'preview'
  } else {
    return 'original'
  }
}

const getUploadArtistProfilePictureFileExtension = (artistProfilePictureType: ArtistProfilePictureType) => {
  if (artistProfilePictureType === 'original' || artistProfilePictureType === 'preview') {
    return 'png'
  }
}
