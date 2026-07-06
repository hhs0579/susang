import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logoPath = path.join(root, 'public/assets/images/logo2.png')
const outPath = path.join(root, 'public/og-image.jpg')

const width = 1200
const height = 630
const bg = { r: 12, g: 12, b: 12 }

const logo = await sharp(logoPath).resize({ width: 520, withoutEnlargement: true }).png().toBuffer()
const logoMeta = await sharp(logo).metadata()

const left = Math.round((width - (logoMeta.width || 0)) / 2)
const top = Math.round((height - (logoMeta.height || 0)) / 2) - 36

await sharp({
  create: {
    width,
    height,
    channels: 3,
    background: bg,
  },
})
  .composite([
    { input: logo, left: Math.max(0, left), top: Math.max(0, top) },
    {
      input: Buffer.from(
        `<svg width="${width}" height="${height}">
          <text x="50%" y="${height - 72}" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="34" font-weight="600">수상한렌탈</text>
          <text x="50%" y="${height - 28}" text-anchor="middle" fill="#b8b8b8" font-family="Arial, sans-serif" font-size="22">시네마 촬영 장비 렌탈</text>
        </svg>`,
      ),
      top: 0,
      left: 0,
    },
  ])
  .jpeg({ quality: 88 })
  .toFile(outPath)

console.log(`Created ${outPath}`)
