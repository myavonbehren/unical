import { NextRequest, NextResponse } from 'next/server'
import gemini from '@/lib/gemini/client'
import { generateSystemPrompt, generateUserPrompt } from '@/lib/openai/syllabusParser'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
        duration: Date.now() - startTime
      })
    }

    const { processedFile, options } = await request.json()
    const includeSchedule = !!options?.includeSchedule

    const systemPrompt = generateSystemPrompt(includeSchedule)
    const userPrompt = generateUserPrompt(processedFile?.content || '')

    // Gemini (@google/genai): call the Models API directly
    const result = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userPrompt }] }
      ]
    })

    const text = (result.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p?.text || '')
      .join('')

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No content received from Gemini',
        duration: Date.now() - startTime
      })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Gemini returned non-JSON content',
        raw: text,
        duration: Date.now() - startTime
      })
    }

    return NextResponse.json({
      success: true,
      data,
      provider: 'gemini',
      estimatedCost: 0, // not calculated here
      duration: Date.now() - startTime
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
  }
}


