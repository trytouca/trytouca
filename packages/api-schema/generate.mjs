import { writeFile } from 'node:fs/promises'
import generate from 'openapi-typescript'

const inputPath = new URL('./src/schema.yaml', import.meta.url)

const outputPath = new URL('./src/schema.gen.ts', import.meta.url)

const outputSchema = await generate(inputPath, {
  exportType: true,
  formatter: (node) => {
    if (node.format === 'date-time') {
      return 'Date'
    }
  }
})

await writeFile(outputPath, outputSchema)
