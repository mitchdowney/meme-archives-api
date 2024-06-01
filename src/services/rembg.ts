// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

import { exec } from 'child_process'
import * as util from 'util'
import { getImageFromS3, uploadImageToS3 } from './aws'
import { arrayBufferToExpressMulterFile } from '../lib/multer'

export const removeBackgroundFromPngImage = async (imageId: number) => {
  const imageBuffer = await getImageFromS3(imageId, 'no-border')

  if (!imageBuffer) {
    throw new Error('Image not found in S3')
  }

  const tempDir = path.join(__dirname, '..', 'tmp')
  await util.promisify(fs.mkdir)(tempDir, { recursive: true })

  const filename = `${Date.now()}.png`
  const filePath = path.join(tempDir, filename)
  await util.promisify(fs.writeFile)(filePath, imageBuffer)

  const outputFilename = `${Date.now()}-transparent.png`
  const outputFilePath = path.join(tempDir, outputFilename)
  
  const execAsync = util.promisify(exec)
  const { stderr } = await execAsync(`/opt/venv/bin/rembg i ${filePath} ${outputFilePath}`)

  if (stderr) {
    throw new Error(`removeBackgroundFromPngImage error: ${stderr}`)
  }

  const outputImageData = await fs.promises.readFile(outputFilePath, 'base64')
  const outputMulterFile = arrayBufferToExpressMulterFile(Buffer.from(outputImageData, 'base64'), outputFilename, 'image/png')
  await uploadImageToS3(imageId, 'no-border', outputMulterFile)

  await fs.promises.unlink(filePath)
  await fs.promises.unlink(outputFilePath)
}
