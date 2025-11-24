import { NextRequest, NextResponse } from 'next/server'
import { convertWeeksToDate } from '../../../../lib/openai/syllabusParser'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { assignments, semesterStart } = await request.json()
    
    const result = convertWeeksToDate(assignments, semesterStart)
    
    return NextResponse.json({
      success: true,
      data: result,
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