// eslint-disable-next-line @typescript-eslint/no-var-requires
import { S3 } from 'aws-sdk'
import axios from 'axios'
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

export const uploadIPFSImageToS3Cache = async (
  ipfsImageUrl: string
) => {
  const key = ipfsImageUrl.replace('https://ipfs.io/ipfs/', '')

  const headParams: S3.HeadObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key
  }

  try {
    await s3.headObject(headParams).promise()
    // If no error is thrown, the object exists
    return `https://${config.aws.imageBucket}.s3.${config.aws.region}.amazonaws.com/${key}`
  } catch (error) {
    if (error.code !== 'NotFound') {
      throw error
    }
  }

  let response
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      response = await axios.get(ipfsImageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
      })
      break
    } catch (error) {
      if (attempt === 5) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  const fileBuffer = Buffer.from(response.data)

  const params: S3.PutObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key,
    Body: fileBuffer
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
