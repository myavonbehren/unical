import { NextRequest, NextResponse } from 'next/server'
import { parseSyllabusWithOpenAI } from '../../../../lib/openai/syllabusParser'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { processedFile, options } = await request.json()
    
    const result = await parseSyllabusWithOpenAI(processedFile, options)
    
    if ('error' in result) {
      return NextResponse.json({
        success: false,
        error: result.error.message,
        duration: Date.now() - startTime
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      estimatedCost: 0.03, // Rough estimate
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