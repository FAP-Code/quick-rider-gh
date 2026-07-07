import { GARMENT_TYPES } from '../types/pattern.types'
import type { GarmentType, InputMethod } from '../types/pattern.types'
import type {
  GarmentPhotoAnalysis,
  CustomerPhotoAnalysis,
  PatternUploadAnalysis,
  PhotoAnalysisResult,
} from '../types/photoAnalysis.types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

function getApiKey(): string {
  const key = import.meta.env['VITE_ANTHROPIC_API_KEY'] as string | undefined
  if (!key) throw new Error('VITE_ANTHROPIC_API_KEY is not configured. Add it to your .env file.')
  return key
}

function parseBase64Image(dataUrl: string): { mediaType: string; data: string } {
  const commaIdx = dataUrl.indexOf(',')
  const header = commaIdx > -1 ? dataUrl.slice(0, commaIdx) : ''
  const data = commaIdx > -1 ? dataUrl.slice(commaIdx + 1) : dataUrl
  const mediaType = header.match(/data:([^;]+);/)?.[1] ?? 'image/jpeg'
  return { mediaType, data }
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
}

async function callClaude(imageDataUrl: string, prompt: string): Promise<string> {
  const key = getApiKey()
  const { mediaType, data } = parseBase64Image(imageDataUrl)

  const resp = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Anthropic API error ${resp.status}: ${body}`)
  }

  const json = (await resp.json()) as AnthropicResponse
  return json.content[0]?.text ?? ''
}

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match?.[0]) throw new Error('No JSON object found in model response')
  return JSON.parse(match[0])
}

export async function analyzeGarmentPhoto(dataUrl: string): Promise<GarmentPhotoAnalysis> {
  const garmentList = GARMENT_TYPES.join(', ')
  const prompt = `You are a professional pattern maker analysing a garment photo. Respond ONLY with a valid JSON object — no markdown fences, no explanation text.

Analyse the garment in this image and return exactly this structure:
{
  "garmentType": "<one value from: ${garmentList}>",
  "silhouette": "<e.g. slim-fit, regular, oversized, A-line, fitted, flared, straight>",
  "collarStyle": "<e.g. point collar, band collar, round neck, V-neck, mandarin, lapel>",
  "sleeveStyle": "<e.g. long sleeve set-in, short sleeve, raglan, puff sleeve, sleeveless>",
  "closureType": "<e.g. button front, side zip, pull-on, tie wrap, snap>",
  "pocketDetails": "<e.g. chest pocket, two hip pockets, welt pockets, none>",
  "fabricType": "<e.g. woven cotton, knit jersey, linen, silk, denim, wool>",
  "easePreference": "<one of: slim, regular, relaxed>",
  "designNotes": "<1-2 sentence summary of the key design features>",
  "confidence": "<one of: high, medium, low>"
}`

  const text = await callClaude(dataUrl, prompt)
  return extractJSON(text) as GarmentPhotoAnalysis
}

export async function analyzeCustomerPhoto(dataUrl: string): Promise<CustomerPhotoAnalysis> {
  const prompt = `You are a professional tailor analysing a customer reference photo to help with garment fitting. Respond ONLY with a valid JSON object — no markdown fences, no explanation text. Do not include any identifying personal information.

Analyse visible posture, stance, and body proportions and return exactly this structure:
{
  "proportionNotes": "<brief observation on shoulder vs hip vs waist proportions>",
  "postureNotes": "<brief posture observation e.g. upright, slight forward shoulder, sway back>",
  "recommendedCheckpoints": ["<measurement to verify>", "<measurement to verify>"],
  "fitHints": ["<fit adjustment hint>", "<fit adjustment hint>"],
  "confidence": "<one of: high, medium, low>"
}`

  const text = await callClaude(dataUrl, prompt)
  return extractJSON(text) as CustomerPhotoAnalysis
}

export async function analyzePatternUpload(dataUrl: string): Promise<PatternUploadAnalysis> {
  const prompt = `You are a professional pattern maker analysing a pattern image. Respond ONLY with a valid JSON object — no markdown fences, no explanation text.

Identify all visible pattern pieces and construction details and return exactly this structure:
{
  "detectedPieces": ["<piece name>", "<piece name>"],
  "grainLineNotes": "<observation about grain lines if visible, or 'not visible'>",
  "seamAllowanceEstimate": "<e.g. 1.5 cm seam allowance indicated, or 'not marked'>",
  "constructionNotes": "<key construction notes from the pattern if visible>",
  "confidence": "<one of: high, medium, low>"
}`

  const text = await callClaude(dataUrl, prompt)
  return extractJSON(text) as PatternUploadAnalysis
}

export async function analyzePhoto(dataUrl: string, method: InputMethod): Promise<PhotoAnalysisResult> {
  switch (method) {
    case 'garment-photo': {
      const data = await analyzeGarmentPhoto(dataUrl)
      return { type: 'garment-photo', data }
    }
    case 'customer-photo': {
      const data = await analyzeCustomerPhoto(dataUrl)
      return { type: 'customer-photo', data }
    }
    case 'pattern-upload': {
      const data = await analyzePatternUpload(dataUrl)
      return { type: 'pattern-upload', data }
    }
    default:
      throw new Error(`analyzePhoto: unsupported method "${method as string}"`)
  }
}

export function matchGarmentType(analysisType: string): GarmentType | null {
  const normalized = analysisType.toLowerCase().trim()
  if ((GARMENT_TYPES as readonly string[]).includes(normalized)) return normalized as GarmentType
  return (GARMENT_TYPES as readonly string[]).find(t => t.includes(normalized) || normalized.includes(t)) as GarmentType | undefined ?? null
}
