// lib/openai/pdfjs-setup.ts

/**
 * Initialize PDF.js with proper worker configuration
 * This should be called once when the app loads
 */
export async function initializePdfJs(): Promise<void> {
  if (typeof window === 'undefined') {
    return // Skip on server side
  }

  try {
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker source to public file (most reliable)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    console.log('PDF.js worker initialized with public file:', pdfjsLib.GlobalWorkerOptions.workerSrc)
    
  } catch (error) {
    console.error('Failed to initialize PDF.js:', error)
  }
}

/**
 * Check if PDF.js is properly initialized
 */
export function isPdfJsInitialized(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    // Try to access the global PDF.js worker options
    return !!(window as any).pdfjsLib?.GlobalWorkerOptions?.workerSrc
  } catch {
    return false
  }
}
