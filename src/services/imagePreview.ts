// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp')

import { readImageFile } from '../lib/fs'
import { arrayBufferToExpressMulterFile } from '../lib/multer'

const baseImagePath = '../assets/preview_1-9by1-frame.png'

const overlayArea = {
  height: 418,
  width: 800
}

const overlayOffsets = {
  top: 23,
  left: 59,
  bottom: 53,
  right: 14
}

const maxAvailableArea = {
  height: overlayArea.height - overlayOffsets.top - overlayOffsets.bottom,
  width: overlayArea.width - overlayOffsets.left - overlayOffsets.right
}

export async function createPreviewImageWithBorder(borderlessImageFile: Express.Multer.File) {
  return new Promise<Express.Multer.File>((resolve, reject) => {
    (async () => {
      try {
        const resizedPaintImage = await resizeForImagePreview(borderlessImageFile?.buffer)
        const paintImage = sharp(resizedPaintImage)

        const baseImageBuffer = await readImageFile(baseImagePath)

        const baseImage = await sharp(baseImageBuffer)
          .flatten({
            background: { r: 192, g: 192, b: 192, alpha: 1 }
          })
        const { width: baseWidth, height: baseHeight } = await paintImage.metadata()
    
        const positionX = overlayOffsets.left + Math.floor((maxAvailableArea.width - baseWidth) / 2)
        const positionY = overlayOffsets.top + Math.floor((maxAvailableArea.height - baseHeight) / 2)

        const finalImageBuffer = await baseImage
          .composite([{ input: await paintImage.toBuffer(), left: positionX, top: positionY }])
          .png()
          .toBuffer()

        const finalImageFile = arrayBufferToExpressMulterFile(finalImageBuffer, 'temp-preview', 'image/png')

        resolve(finalImageFile)
      } catch (error) {
        reject(error)
      }
    })()
  })
}

async function resizeForImagePreview (borderlessImageBuffer: ArrayBuffer) {
  return new Promise((resolve, reject) => {
    sharp(borderlessImageBuffer)
      .resize(maxAvailableArea.width, maxAvailableArea.height, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer((err, previewImageBuffer) => {
        if (err) {
          reject(err)
        } else {
          resolve(previewImageBuffer)
        }
      })
  })
}

export async function createPreviewImageWithoutBorder(
  borderedImageFile: Express.Multer.File,
  cropPosition: 'top' | 'middle' | 'bottom' = 'middle'
) {
  return new Promise<Express.Multer.File>((resolve, reject) => {
    (async () => {
      try {
        // Resize the original image to have a width of 800px while maintaining aspect ratio
        const resizedImageBuffer = await sharp(borderedImageFile?.buffer)
          .resize({ width: overlayArea.width })
          .toBuffer()

        // Calculate the dimensions for cropping the resized image
        const { height: resizedHeight } = await sharp(resizedImageBuffer).metadata()
        const cropWidth = overlayArea.width
        const cropHeight = overlayArea.height

        let cropY = 0
        if (cropPosition === 'top') {
          cropY = 0
        } else if (cropPosition === 'middle') {
          cropY = Math.floor((resizedHeight - cropHeight) / 2)
        } else if (cropPosition === 'bottom') {
          cropY = resizedHeight - cropHeight
        }

        // Crop the resized image based on crop position
        const croppedImageBuffer = await sharp(resizedImageBuffer)
          .extract({ left: 0, top: cropY, width: cropWidth, height: cropHeight })
          .toBuffer()

        // Convert the cropped image buffer to Express Multer File object
        const croppedImageFile = arrayBufferToExpressMulterFile(croppedImageBuffer, 'temp-preview', 'image/png')

        resolve(croppedImageFile)
      } catch (error) {
        reject(error)
      }
    })()
  })
}
