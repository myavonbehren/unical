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
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY valid JSON. Do not include any explanations or markdown fences.` }] }
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
      // Fallback: try to extract JSON from verbose output
      const fenced = text.match(/```json\s*([\s\S]*?)```/i)
      const braced = fenced?.[1] || text.match(/\{[\s\S]*\}/)?.[0]
      if (braced) {
        try {
          data = JSON.parse(braced)
        } catch (_) {
          return NextResponse.json({
            success: false,
            error: 'Gemini returned non-JSON content',
            raw: text,
            duration: Date.now() - startTime
          })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'Gemini returned non-JSON content',
          raw: text,
          duration: Date.now() - startTime
        })
      }
    }

    // Normalize Gemini JSON to match OpenAI-normalized schema used by the UI
    try {
      // Ensure top-level objects
      data = data || {}
      data.course_info = data.course_info || {}
      data.assignments = Array.isArray(data.assignments) ? data.assignments : []
      data.metadata = data.metadata || {}

      // Map alternate field names to canonical ones
      if (data.course_info.course_name && !data.course_info.name) {
        data.course_info.name = data.course_info.course_name
      }
      if (data.course_info.instructor_name && !data.course_info.instructor) {
        data.course_info.instructor = data.course_info.instructor_name
      }
      if (data.course_info.course_code && !data.course_info.code) {
        data.course_info.code = data.course_info.course_code
      }

      // Metadata defaults
      if (typeof data.metadata.parsing_confidence !== 'number') {
        data.metadata.parsing_confidence = 0.8
      }
      if (typeof data.metadata.weeks_detected !== 'number') {
        data.metadata.weeks_detected = Array.isArray(data.assignments)
          ? data.assignments.filter((a: any) => a && (a.week != null || a.specific_date)).length
          : 0
      }
      if (!data.metadata.original_format) {
        data.metadata.original_format = 'text'
      }

      // Assignment normalization
      const allowedTypes = new Set([
        'homework', 'exam', 'project', 'quiz', 'reading', 'lab', 'discussion', 'deadline'
      ])
      data.assignments = data.assignments.map((a: any) => {
        const assignment = a || {}
        // normalize week to number when given as string
        if (typeof assignment.week === 'string') {
          const n = parseInt(assignment.week, 10)
          if (!Number.isNaN(n)) assignment.week = n
        }
        // coerce type to allowed lowercase value, fallback to 'homework'
        if (assignment.type) {
          const t = String(assignment.type).toLowerCase()
          assignment.type = allowedTypes.has(t) ? t : 'homework'
        } else {
          assignment.type = 'homework'
        }
        return assignment
      })
    } catch {
      // If normalization fails, continue with raw data
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


