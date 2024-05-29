
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FfmpegCommand = require('fluent-ffmpeg')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

import { createImage, deleteImage, getImageById, getImageBySlug, updateImage } from '../controllers/image'
import { handleLogError } from '../lib/errors'
import { getFileExtension } from '../lib/fileExtensions'
import { arrayBufferToExpressMulterFile } from '../lib/multer'
import { ImageType, ImageUploadRequest } from '../types'
import { deleteImageFromS3, uploadImageToS3 } from './aws'
import { createBorderImage } from './imageBorder'
import { createMaxResizedImage } from './imageMaxResize'
import { createPreviewImageWithBorder, createPreviewImageWithoutBorder } from './imagePreview'
import * as util from 'util'

export const imageUploadFields = [
  {
    name: 'fileImageAnimations',
    maxCount: 1
  },
  {
    name: 'fileImageBorders',
    maxCount: 1
  },
  {
    name: 'fileImageNoBorders',
    maxCount: 1
  },
  {
    name: 'fileImageVideos',
    maxCount: 1
  }
]

type CheckImageFileTypes = {
  fileImageAnimation?: Express.Multer.File
  fileImageBorder?: Express.Multer.File
  fileImageNoBorder?: Express.Multer.File
  fileImageVideo?: Express.Multer.File
}

const checkImageFileTypes = ({
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  fileImageVideo
}: CheckImageFileTypes) => {
  if (fileImageAnimation) {
    const ext = getFileExtension(fileImageAnimation)
    if (ext !== 'gif') {
      throw new Error('Invalid animation file type. Expected a gif file.')
    }
  }
  if (fileImageBorder) {
    const ext = getFileExtension(fileImageBorder)
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
      throw new Error('Invalid image border file type. Expected a png, jpg, or jpeg file.')
    }
  }
  if (fileImageNoBorder) {
    const ext = getFileExtension(fileImageNoBorder)
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
      throw new Error('Invalid image no border file type. Expected a png, jpg, or jpeg file.')
    }
  }
  if (fileImageVideo) {
    const ext = getFileExtension(fileImageVideo)
    if (ext !== 'mp4') {
      throw new Error('Invalid video file type. Expected an mp4 file.')
    }
  }
}

// TODO: the allow_preview_border_image etc booleans are actually string / 'true' or undefined type
// the type and handling should be updated
type ImageUpload = {
  allow_preview_border_image: boolean
  artistNames: string[]
  preview_crop_position: 'top' | 'middle' | 'bottom' | 'no-crop'
  fileImageAnimation: Express.Multer.File
  fileImageBorder: Express.Multer.File
  fileImageNoBorder: Express.Multer.File
  fileImageVideo: Express.Multer.File
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  has_video: boolean
  id: number | null
  isUpdating: boolean
  prevent_border_image: boolean
  remove_animation: boolean
  remove_border: boolean
  remove_no_border: boolean
  remove_video: boolean
  slug: string | null
  tagTitles: string[]
  title: string | null
  type: ImageType
}

type ImageData = {
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

const imagesUpload = async ({
  allow_preview_border_image,
  artistNames,
  preview_crop_position,
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  fileImageVideo,
  has_animation,
  has_border,
  has_no_border,
  has_video,
  id,
  isUpdating,
  prevent_border_image,
  remove_animation,
  remove_border,
  remove_no_border,
  remove_video,
  slug,
  tagTitles,
  title,
  type
}: ImageUpload) => {
  checkImageFileTypes({
    fileImageAnimation,
    fileImageBorder,
    fileImageNoBorder,
    fileImageVideo
  })
  const imageData: ImageData = {
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
  }

  // abort early if we're going to run into the unique slug error
  if (!isUpdating && slug) {
    const image = await getImageBySlug(slug)
    if (image) {
      throw new Error('An image already exists for that slug')
    }
  }

  if (remove_video) {
    await deleteImageFromS3(id, 'video')
    imageData.has_video = false
  } else if (fileImageVideo) {
    try {
      await uploadImageToS3(id, 'video', fileImageVideo)
      imageData.has_video = true
    } catch (error) {
      throw new Error(`error fileImageVideo uploadImageToS3: ${error.message}`)
    }
  }

  if (remove_animation) {
    await deleteImageFromS3(id, 'animation')
    imageData.has_animation = false
  } else if (fileImageAnimation) {
    try {
      await uploadImageToS3(id, 'animation', fileImageAnimation)
      imageData.has_animation = true
    } catch (error) {
      throw new Error(`error fileImageAnimation uploadImageToS3: ${error.message}`)
    }
  }
  
  if (remove_border) {
    await deleteImageFromS3(id, 'border')
    imageData.has_border = false
  } else if (fileImageBorder) {
    try {
      await uploadImageToS3(id, 'border', fileImageBorder)
      imageData.has_border = true
    } catch (error) {
      throw new Error(`error fileImageBorder uploadImageToS3: ${error.message}`)
    }
  } else if (fileImageNoBorder && !prevent_border_image) {
    const resizedBorderImageFile = await createMaxResizedImage(fileImageNoBorder)
    const borderImageFile = await createBorderImage(resizedBorderImageFile)
    await uploadImageToS3(id, 'border', borderImageFile)
    imageData.has_border = true
  }
  
  if (remove_no_border) {
    await deleteImageFromS3(id, 'no-border')
    imageData.has_no_border = false
  } else if (fileImageNoBorder) {
    try {
      const noBorderImageFile = await createMaxResizedImage(fileImageNoBorder)
      await uploadImageToS3(id, 'no-border', noBorderImageFile)
      imageData.has_no_border = true
    } catch (error) {
      throw new Error(`error fileImageNoBorder uploadImageToS3: ${error.message}`)
    }
  }
  
  
  if (fileImageVideo) {
    try {
      const writeFile = util.promisify(fs.writeFile)
      const tempDir = path.join(__dirname, '..', 'tmp')
      const tempVideoPath = path.join(tempDir, 'temp.mp4')

      fs.mkdirSync(tempDir, { recursive: true })

      await writeFile(tempVideoPath, fileImageVideo.buffer)

      FfmpegCommand(tempVideoPath)
        .screenshot({
          count: 1,
          timestamps: ['0%'],
          filename: 'screenshot.png',
          folder: tempDir
        })
        .on('end', async () => {
          const screenshotPath = path.join(tempDir, 'screenshot.png')
          const screenshotBuffer = fs.readFileSync(screenshotPath)
          const screenshotFile = arrayBufferToExpressMulterFile(screenshotBuffer, 'temp-screenshot', 'image/png')
          const previewImageFile = await createPreviewImageWithoutBorder(screenshotFile, 'middle')
          await uploadImageToS3(id, 'preview', previewImageFile)
        })
    } catch (error) {
      throw new Error(`Error generating or uploading screenshot: ${error.message}`);
    }
  } else if (fileImageNoBorder && (!prevent_border_image || allow_preview_border_image)) {
    const previewImageFile = await createPreviewImageWithBorder(fileImageNoBorder)
    await uploadImageToS3(id, 'preview', previewImageFile)
  } else if (fileImageNoBorder) {
    const previewImageFile = await createPreviewImageWithoutBorder(fileImageNoBorder, preview_crop_position)
    await uploadImageToS3(id, 'preview', previewImageFile)
  } else if (fileImageBorder) {
    const previewImageFile = await createPreviewImageWithoutBorder(fileImageBorder, preview_crop_position)
    await uploadImageToS3(id, 'preview', previewImageFile)
  }
  
  let imageExists = false
  try {
    const image = await getImageById(id)
    imageExists = !!image
  } catch (error) {
    handleLogError(`error getImageById: ${error}`)
  }

  if (!imageExists) {
    return await createImage(imageData)
  } else {
    return await updateImage(imageData)
  }
}

export const imagesUploadHandler = async (req: ImageUploadRequest, id: number, isUpdating: boolean) => {
  const { allow_preview_border_image, artistNames = [], preview_crop_position, has_animation, has_border,
    has_no_border, has_video, prevent_border_image, remove_animation, remove_border, remove_no_border, slug,
    remove_video, tagTitles = [], title, type } = req.body
  const { fileImageAnimations, fileImageBorders, fileImageNoBorders, fileImageVideos } = req.files

  const fileImageAnimation = fileImageAnimations?.[0]
  const fileImageBorder = fileImageBorders?.[0]
  const fileImageNoBorder = fileImageNoBorders?.[0]
  const fileImageVideo = fileImageVideos?.[0]

  const parsedArtistNames = JSON.parse(artistNames)
  const parsedTagTitles = JSON.parse(tagTitles)

  const data = await imagesUpload({
    allow_preview_border_image,
    artistNames: parsedArtistNames,
    preview_crop_position,
    fileImageAnimation,
    fileImageBorder,
    fileImageNoBorder,
    fileImageVideo,
    has_animation,
    has_border,
    has_no_border,
    has_video,
    id,
    isUpdating,
    prevent_border_image,
    remove_animation,
    remove_border,
    remove_no_border,
    remove_video,
    slug,
    tagTitles: parsedTagTitles,
    title,
    type
  })

  return data
}

export const deleteS3ImageAndDBImage = async (id: number) => {
  await deleteImageFromS3(id, 'animation')
  await deleteImageFromS3(id, 'border')
  await deleteImageFromS3(id, 'no-border')
  await deleteImageFromS3(id, 'preview')
  await deleteImageFromS3(id, 'video')
  await deleteImage(id)
}
