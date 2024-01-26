import { createImage, getImageById, getImageBySlug, updateImage } from '../controllers/image'
import { ImageUploadRequest } from '../types'
import { uploadImageToS3 } from './aws'

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
  }
]

type CheckFileTypes = {
  fileImageAnimation: Express.Multer.File
  fileImageBorder: Express.Multer.File
  fileImageNoBorder: Express.Multer.File
}

const getFileExtension = (file: Express.Multer.File) => {
  const originalFileName = file.originalname
  const fileExtension = originalFileName?.split('.').pop()
  return fileExtension
}

const checkFileTypes = ({
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder
}: CheckFileTypes) => {
  if (fileImageAnimation) {
    const ext = getFileExtension(fileImageAnimation)
    if (ext !== 'gif') {
      throw new Error('Invalid animation file type. Expected a gif file.')
    }
  }
  if (fileImageBorder) {
    const ext = getFileExtension(fileImageBorder)
    if (ext !== 'png') {
      throw new Error('Invalid image border file type. Expected a png file.')
    }
  }
  if (fileImageNoBorder) {
    const ext = getFileExtension(fileImageNoBorder)
    if (ext !== 'png') {
      throw new Error('Invalid image no border file type. Expected a png file.')
    }
  }
}

type ImageUpload = {
  artist: string | null
  fileImageAnimation: Express.Multer.File
  fileImageBorder: Express.Multer.File
  fileImageNoBorder: Express.Multer.File
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  id: number | null
  isUpdating: boolean
  slug: string | null
  tagTitles: string[]
  title: string | null
}

type ImageData = {
  artist: string | null
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  id: number
  slug: string | null
  tagTitles: string[]
  title: string | null
}

const imagesUpload = async ({
  artist,
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  has_animation,
  has_border,
  has_no_border,
  id,
  isUpdating,
  slug,
  tagTitles,
  title
}: ImageUpload) => {
  checkFileTypes({ fileImageAnimation, fileImageBorder, fileImageNoBorder })
  const imageData: ImageData = {
    artist,
    has_animation,
    has_border,
    has_no_border,
    id,
    slug,
    tagTitles,
    title
  }

  // abort early if we're going to run into the unique slug error
  if (!isUpdating && slug) {
    const image = await getImageBySlug(slug)
    if (image) {
      throw new Error('An image already exists for that slug')
    }
  }

  if (fileImageAnimation) {
    try {
      await uploadImageToS3(id, 'animation', fileImageAnimation)
      imageData.has_animation = true
    } catch (error) {
      throw new Error(`error fileImageAnimation uploadImageToS3: ${error.message}`)
    }
  }
  
  if (fileImageBorder) {
    try {
      await uploadImageToS3(id, 'border', fileImageBorder)
      imageData.has_border = true
    } catch (error) {
      throw new Error(`error fileImageBorder uploadImageToS3: ${error.message}`)
    }
  }
  
  if (fileImageNoBorder) {
    try {
      await uploadImageToS3(id, 'no-border', fileImageNoBorder)
      imageData.has_no_border = true
    } catch (error) {
      throw new Error(`error fileImageNoBorder uploadImageToS3: ${error.message}`)
    }
  }
  
  let imageExists = false
  try {
    const image = await getImageById(id)
    imageExists = !!image
  } catch (error) {
    console.log('error getImageById:', error)
  }

  if (!imageExists) {
    return await createImage(imageData)
  } else {
    return await updateImage(imageData)
  }
}

export const imagesUploadHandler = async (req: ImageUploadRequest, id: number, isUpdating: boolean) => {
  const { artist, has_animation, has_border, has_no_border, slug, tagTitles = [], title } = req.body
  const { fileImageAnimations, fileImageBorders, fileImageNoBorders } = req.files

  const fileImageAnimation = fileImageAnimations?.[0]
  const fileImageBorder = fileImageBorders?.[0]
  const fileImageNoBorder = fileImageNoBorders?.[0]

  const parsedTagTitles = JSON.parse(tagTitles)

  const data = await imagesUpload({
    artist,
    fileImageAnimation,
    fileImageBorder,
    fileImageNoBorder,
    has_animation,
    has_border,
    has_no_border,
    id,
    isUpdating,
    slug,
    tagTitles: parsedTagTitles,
    title
  })

  return data
}
