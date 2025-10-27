// app/(dashboard)/test-ai/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/app/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/shared/components/ui/card'
import { Badge } from '@/app/shared/components/ui/badge'
import { Progress } from '@/app/shared/components/ui/progress'
import { Input } from '@/app/shared/components/ui/input'
import { Label } from '@/app/shared/components/ui/label'
import { Textarea } from '@/app/shared/components/ui/textarea'
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download
} from 'lucide-react'
import { processFile, type ProcessingError, type ProcessedFile } from '@/lib/openai/fileProcessor'
import type { ParsedSyllabusData, AssignmentWithDate, WeekConversionResult } from '@/lib/openai/syllabusParser'

interface TestResult {
  step: string
  success: boolean
  data?: unknown
  error?: string
  duration?: number
}

interface ProcessingResults {
  fileProcessing?: TestResult
  openAIParsing?: TestResult
  weekConversion?: TestResult
  overall: {
    success: boolean
    totalTime: number
    cost: number
  }
}

// Type guards for safe data access
function isProcessedFile(data: unknown): data is ProcessedFile {
  return (
    typeof data === 'object' &&
    data !== null &&
    'content' in data &&
    'metadata' in data &&
    typeof (data as any).metadata === 'object' &&
    'wordCount' in (data as any).metadata
  )
}

function isParsedSyllabusData(data: unknown): data is ParsedSyllabusData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'course_info' in data &&
    'assignments' in data &&
    Array.isArray((data as any).assignments)
  )
}

function isWeekConversionResult(data: unknown): data is WeekConversionResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'assignments' in data &&
    'totalConverted' in data &&
    Array.isArray((data as any).assignments)
  )
}

export default function AITestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [semesterStart, setSemesterStart] = useState('2024-09-01')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ProcessingResults | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResults(null)
      setDebugLogs([])
      addLog(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    }
  }

  const processFileHandler = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProgress(0)
    const startTime = Date.now()
    
    const results: ProcessingResults = {
      overall: { success: false, totalTime: 0, cost: 0 }
    }

    try {
      // Step 1: Process file CLIENT-SIDE
      addLog('Step 1: Processing file in browser...')
      setProgress(20)
      
      const fileProcessStartTime = Date.now()
      const processedFileResult = await processFile(selectedFile) // This runs in browser
      const fileProcessDuration = Date.now() - fileProcessStartTime
      
      if ('type' in processedFileResult && (processedFileResult.type === 'UNSUPPORTED_FILE' || processedFileResult.type === 'CORRUPTED_FILE' || processedFileResult.type === 'PROCESSING_ERROR' || processedFileResult.type === 'FILE_TOO_LARGE')) {
        const error = processedFileResult as ProcessingError
        console.log('Processing error:', error)
        throw new Error(`File processing failed: ${error.message || 'Unknown error'}`)
      }

      // At this point, we know it's a ProcessedFile, not a ProcessingError
      const processedFile = processedFileResult as import('@/lib/openai/fileProcessor').ProcessedFile

      results.fileProcessing = {
        step: 'File Processing',
        success: true,
        data: processedFile,
        duration: fileProcessDuration
      }

      addLog(`✅ File processed: ${processedFile.metadata.wordCount} words extracted`)
      setProgress(40)

      // Step 2: Send processed text to API
      addLog('Step 2: Parsing with OpenAI...')
      
      const openAIResponse = await fetch('/api/test/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processedFile: processedFile, // Send the processed text
          options: { includeSchedule: true }
        })
      })

      const openAIData = await openAIResponse.json()
      
      results.openAIParsing = {
        step: 'OpenAI Parsing',
        success: openAIData.success,
        data: openAIData.data,
        error: openAIData.error,
        duration: openAIData.duration
      }

      if (!openAIData.success) {
        throw new Error(`OpenAI parsing failed: ${openAIData.error}`)
      }

      addLog(`AI parsing completed: ${openAIData.data.assignments.length} assignments found`)
      setProgress(70)

      // Step 3: Week Conversion
      addLog('Step 3: Converting weeks to dates...')
      
      const conversionResponse = await fetch('/api/test/convert-weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments: openAIData.data.assignments,
          semesterStart: semesterStart
        })
      })

      const conversionData = await conversionResponse.json()
      
      results.weekConversion = {
        step: 'Week Conversion',
        success: conversionData.success,
        data: conversionData.data,
        error: conversionData.error,
        duration: conversionData.duration
      }

      if (!conversionData.success) {
        throw new Error(`Week conversion failed: ${conversionData.error}`)
      }

      addLog(`Week conversion completed: ${conversionData.data.totalConverted} weeks converted`)
      setProgress(100)

      // Calculate overall results
      const totalTime = Date.now() - startTime
      results.overall = {
        success: true,
        totalTime,
        cost: openAIData.estimatedCost || 0
      }

      addLog(`Processing complete! Total time: ${totalTime}ms`)

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      results.overall.success = false
      results.overall.totalTime = Date.now() - startTime
    }

    setResults(results)
    setIsProcessing(false)
    setProgress(0)
  }


  const downloadResults = () => {
    if (!results) return

    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `unical-test-results-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (file.type.includes('word') || file.type.includes('document')) return <FileText className="h-6 w-6 text-blue-500" />
    if (file.type.includes('image')) return <Image className="h-6 w-6 text-green-500" />
    return <FileText className="h-6 w-6 text-gray-500" />
  }

  const getResultIcon = (result?: TestResult) => {
    if (!result) return <Clock className="h-4 w-4 text-gray-400" />
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI Syllabus Processing Test</h1>
        <p className="text-muted-foreground">
          Test your file processing and OpenAI integration with real syllabus files
        </p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Upload Test File</CardTitle>
          <CardDescription>
            Upload a real syllabus (PDF, Word doc, or image) to test the complete pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Choose Syllabus File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              {getFileIcon(selectedFile)}
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="semester-start">Semester Start Date</Label>
            <Input
              id="semester-start"
              type="date"
              value={semesterStart}
              onChange={(e) => setSemesterStart(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          onClick={processFileHandler}
          disabled={!selectedFile || isProcessing}
          size="lg"
          className="px-8"
        >
          {isProcessing ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Test AI Processing
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Processing Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Processing Results</span>
                {results.overall.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Processing */}
              <div className="flex items-center space-x-3">
                {getResultIcon(results.fileProcessing)}
                <div className="flex-1">
                  <p className="font-medium">File Processing</p>
                  {results.fileProcessing && (
                    <p className="text-sm text-muted-foreground">
                      {results.fileProcessing.success 
                        ? `${isProcessedFile(results.fileProcessing.data) ? results.fileProcessing.data.metadata.wordCount : 0} words extracted`
                        : results.fileProcessing.error
                      }
                    </p>
                  )}
                </div>
                {results.fileProcessing?.duration && (
                  <Badge variant="outline">{results.fileProcessing.duration}ms</Badge>
                )}
              </div>

              {/* OpenAI Parsing */}
              <div className="flex items-center space-x-3">
                {getResultIcon(results.openAIParsing)}
                <div className="flex-1">
                  <p className="font-medium">OpenAI Parsing</p>
                  {results.openAIParsing && (
                    <p className="text-sm text-muted-foreground">
                      {results.openAIParsing.success 
                        ? `${isParsedSyllabusData(results.openAIParsing.data) ? results.openAIParsing.data.assignments.length : 0} assignments found`
                        : results.openAIParsing.error
                      }
                    </p>
                  )}
                </div>
                {results.openAIParsing?.duration && (
                  <Badge variant="outline">{results.openAIParsing.duration}ms</Badge>
                )}
              </div>

              {/* Week Conversion */}
              <div className="flex items-center space-x-3">
                {getResultIcon(results.weekConversion)}
                <div className="flex-1">
                  <p className="font-medium">Week Conversion</p>
                  {results.weekConversion && (
                    <p className="text-sm text-muted-foreground">
                      {results.weekConversion.success 
                        ? `${isWeekConversionResult(results.weekConversion.data) ? results.weekConversion.data.totalConverted : 0} weeks converted`
                        : results.weekConversion.error
                      }
                    </p>
                  )}
                </div>
                {results.weekConversion?.duration && (
                  <Badge variant="outline">{results.weekConversion.duration}ms</Badge>
                )}
              </div>

              {/* Overall Stats */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Time:</span>
                  <span className="text-sm font-medium">{results.overall.totalTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Estimated Cost:</span>
                  <span className="text-sm font-medium">${results.overall.cost.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>Real-time processing logs</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={debugLogs.join('\n')}
                readOnly
                className="h-64 font-mono text-sm"
                placeholder="Processing logs will appear here..."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Parsed Data Display */}
      {results?.openAIParsing?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>Course information and assignments parsed by AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course Info */}
            {isParsedSyllabusData(results.openAIParsing.data) && results.openAIParsing.data.course_info && (
              <div>
                <h3 className="font-semibold mb-2">Course Information</h3>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <p><strong>Name:</strong> {results.openAIParsing.data.course_info.name}</p>
                  {results.openAIParsing.data.course_info.code && (
                    <p><strong>Code:</strong> {results.openAIParsing.data.course_info.code}</p>
                  )}
                  {results.openAIParsing.data.course_info.instructor && (
                    <p><strong>Instructor:</strong> {results.openAIParsing.data.course_info.instructor}</p>
                  )}
                </div>
              </div>
            )}

            {/* Assignments */}
            {results.weekConversion?.success && isWeekConversionResult(results.weekConversion.data) && results.weekConversion.data.assignments && (
              <div>
                <h3 className="font-semibold mb-2">
                  Assignments ({results.weekConversion.data.assignments.length})
                </h3>
                <div className="space-y-2">
                  {results.weekConversion.data.assignments.map((assignment: AssignmentWithDate, index: number) => (
                    <div key={index} className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                            {assignment.original_week && ` (Week ${assignment.original_week})`}
                          </p>
                        </div>
                        <Badge variant="outline">{assignment.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Results */}
            <div className="flex justify-end">
              <Button onClick={downloadResults} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}