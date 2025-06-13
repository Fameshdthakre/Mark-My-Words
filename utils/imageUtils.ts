
import React from 'react'; // For RefObject type

// Custom error for explicit cancellation
class CancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CancellationError";
  }
}

const SUPPORTED_MIME_TYPES_FOR_GEMINI = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
const CONVERTABLE_TO_JPEG_MIME_TYPES = ['image/avif', 'image/bmp']; // AVIF is the primary target for fix
const TARGET_CONVERSION_MIME_TYPE = 'image/jpeg';
const TARGET_CONVERSION_QUALITY = 0.9; // For JPEG

async function convertToSupportedFormat(
    originalBlob: Blob,
    isCancellationRequestedRef: React.RefObject<boolean>,
    abortSignal?: AbortSignal
): Promise<{blob: Blob, mimeType: string}> {
    if (isCancellationRequestedRef.current) throw new CancellationError("Image conversion cancelled before format conversion.");
    if (abortSignal?.aborted) throw new CancellationError("Image conversion aborted before format conversion via AbortSignal.");

    let imageBitmap: ImageBitmap | null = null;
    try {
        imageBitmap = await createImageBitmap(originalBlob);
    } catch (bitmapError) {
        throw new Error(`Failed to create ImageBitmap from ${originalBlob.type}: ${bitmapError instanceof Error ? bitmapError.message : String(bitmapError)}`);
    }
    
    if (isCancellationRequestedRef.current) {
        imageBitmap.close();
        throw new CancellationError("Image conversion cancelled after creating bitmap.");
    }
    if (abortSignal?.aborted) {
        imageBitmap.close();
        throw new CancellationError("Image conversion aborted after creating bitmap via AbortSignal.");
    }

    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        imageBitmap.close();
        throw new Error('Failed to get canvas context for image conversion.');
    }
    ctx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close(); 

    if (isCancellationRequestedRef.current) throw new CancellationError("Image conversion cancelled after drawing to canvas.");
    if (abortSignal?.aborted) throw new CancellationError("Image conversion aborted after drawing to canvas via AbortSignal.");

    return new Promise((resolve, reject) => {
        let settled = false;
        const signalHandler = () => {
            if (!settled) {
                settled = true;
                reject(new CancellationError(`Image conversion aborted via AbortSignal during canvas.toBlob for ${originalBlob.type}.`));
            }
        };

        if (isCancellationRequestedRef.current) {
            if (!settled) {
                settled = true;
                if (abortSignal) abortSignal.removeEventListener('abort', signalHandler);
                reject(new CancellationError("Image conversion cancelled before canvas.toBlob."));
            }
            return;
        }
        
        if (abortSignal) {
            abortSignal.addEventListener('abort', signalHandler);
        }

        canvas.toBlob(
            (newBlob) => {
                if (abortSignal) abortSignal.removeEventListener('abort', signalHandler);
                if (settled) return; // Already handled by cancellation or abort
                settled = true;

                if (isCancellationRequestedRef.current) { // Check again as toBlob is async
                    reject(new CancellationError("Image conversion cancelled during canvas.toBlob callback."));
                    return;
                }
                if (newBlob) {
                    resolve({ blob: newBlob, mimeType: TARGET_CONVERSION_MIME_TYPE });
                } else {
                    reject(new Error(`Failed to convert ${originalBlob.type} to ${TARGET_CONVERSION_MIME_TYPE}. Canvas toBlob returned null.`));
                }
            },
            TARGET_CONVERSION_MIME_TYPE,
            TARGET_CONVERSION_QUALITY
        );
    });
}

async function processAndEncodeBlob(
    originalBlob: Blob,
    originalNameForError: string, // e.g., URL or file.name
    isCancellationRequestedRef: React.RefObject<boolean>,
    abortSignal?: AbortSignal
): Promise<{ base64: string; mimeType: string }> {
    let blobToEncode = originalBlob;
    let finalMimeType = originalBlob.type;

    if (isCancellationRequestedRef.current) {
        throw new CancellationError(`Processing cancelled for ${originalNameForError} before format check.`);
    }
    if (abortSignal?.aborted) {
      throw new CancellationError(`Processing aborted for ${originalNameForError} before format check via AbortSignal.`);
    }

    if (CONVERTABLE_TO_JPEG_MIME_TYPES.includes(originalBlob.type)) {
        try {
            const conversionResult = await convertToSupportedFormat(originalBlob, isCancellationRequestedRef, abortSignal);
            blobToEncode = conversionResult.blob;
            finalMimeType = conversionResult.mimeType;
        } catch (conversionError) {
            if (conversionError instanceof CancellationError || abortSignal?.aborted) throw conversionError;
            const message = `Failed to convert ${originalBlob.type} image "${originalNameForError}" to ${TARGET_CONVERSION_MIME_TYPE}. Browser might not support decoding ${originalBlob.type}. Error: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`;
            throw new Error(message);
        }
    } else if (!SUPPORTED_MIME_TYPES_FOR_GEMINI.includes(originalBlob.type)) {
        const message = `Unsupported image type: ${originalBlob.type} for "${originalNameForError}". Supported types: ${SUPPORTED_MIME_TYPES_FOR_GEMINI.join(', ')}. Will attempt to convert: ${CONVERTABLE_TO_JPEG_MIME_TYPES.join(', ')}.`;
        throw new Error(message);
    }
    
    if (isCancellationRequestedRef.current) {
        throw new CancellationError(`Processing cancelled for ${originalNameForError} before base64 encoding.`);
    }
    if (abortSignal?.aborted) {
      throw new CancellationError(`Processing aborted for ${originalNameForError} before base64 encoding via AbortSignal.`);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let settled = false; // To prevent multiple rejections/resolutions

        const cleanupAndSettle = (action: 'resolve' | 'reject', value: any) => {
            if (!settled) {
                settled = true;
                if (abortSignal) {
                    abortSignal.removeEventListener('abort', signalAbortHandler);
                }
                if (action === 'resolve') resolve(value);
                else reject(value);
            }
        };
        
        const signalAbortHandler = () => {
            if (reader.readyState === FileReader.LOADING) reader.abort();
            cleanupAndSettle('reject', new CancellationError(`Base64 encoding aborted for ${originalNameForError} via AbortSignal.`));
        };

        if (abortSignal) {
            abortSignal.addEventListener('abort', signalAbortHandler);
        }

        const checkCancellationAndAbortReader = () => {
            if (isCancellationRequestedRef.current || abortSignal?.aborted) {
                if (reader.readyState === FileReader.LOADING) reader.abort(); // Triggers 'onabort'
                else if (!settled) cleanupAndSettle('reject', new CancellationError(`Base64 encoding cancelled for ${originalNameForError}.`));
                return true;
            }
            return false;
        };
        
        reader.onloadstart = () => {
            if (checkCancellationAndAbortReader()) return;
        };

        reader.onprogress = () => {
            if (checkCancellationAndAbortReader()) return;
        };

        reader.onloadend = () => {
            if (settled || checkCancellationAndAbortReader()) return;
            if (typeof reader.result === 'string') {
                const base64Data = reader.result.split(',')[1];
                if (!base64Data) {
                    cleanupAndSettle('reject', new Error(`Failed to parse base64 data from FileReader result for ${originalNameForError}.`));
                    return;
                }
                cleanupAndSettle('resolve', { base64: base64Data, mimeType: finalMimeType });
            } else {
                cleanupAndSettle('reject', new Error(`Failed to read ${originalNameForError} as base64 string.`));
            }
        };

        reader.onerror = () => {
            if (settled || checkCancellationAndAbortReader()) return;
            console.error(`FileReader error for ${originalNameForError}:`, reader.error);
            cleanupAndSettle('reject', new Error(`FileReader error while processing ${originalNameForError}.`));
        };

        reader.onabort = () => {
            if (settled) return;
            cleanupAndSettle('reject', new CancellationError(`Base64 encoding aborted by reader for ${originalNameForError}.`));
        };
        
        if (checkCancellationAndAbortReader()) return;

        reader.readAsDataURL(blobToEncode);
    });
}


export async function convertImageUrlToBase64(
  imageUrl: string,
  isCancellationRequestedRef: React.RefObject<boolean>,
  abortSignal?: AbortSignal 
): Promise<{ base64: string; mimeType: string }> {
  if (isCancellationRequestedRef.current) {
    throw new CancellationError(`Image conversion cancelled for ${imageUrl} before fetch.`);
  }
   if (abortSignal?.aborted) {
    throw new CancellationError(`Image conversion aborted for ${imageUrl} before fetch via AbortSignal.`);
  }

  try {
    const response = await fetch(imageUrl, { signal: abortSignal });
    if (isCancellationRequestedRef.current) {
      throw new CancellationError(`Image conversion cancelled for ${imageUrl} during fetch.`);
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} from ${imageUrl}.`);
    }
    const blob = await response.blob();
    if (isCancellationRequestedRef.current) {
      throw new CancellationError(`Image conversion cancelled for ${imageUrl} after fetch, before blob processing.`);
    }
     if (abortSignal?.aborted) {
      throw new CancellationError(`Image conversion aborted for ${imageUrl} after fetch via AbortSignal.`);
    }
    
    // Original MIME type check from fetch can be less strict now, as processAndEncodeBlob will validate/convert
    // if (!blob.type.startsWith('image/')) {
    //   throw new Error(`Fetched content from ${imageUrl} is not an image. MIME type: ${blob.type}.`);
    // }

    return await processAndEncodeBlob(blob, imageUrl, isCancellationRequestedRef, abortSignal);

  } catch (error) {
    if (error instanceof CancellationError || abortSignal?.aborted) {
      throw error instanceof CancellationError ? error : new CancellationError(`Image conversion process for ${imageUrl} was cancelled/aborted. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.error(`Error processing image URL ${imageUrl}:`, error);
    if (error instanceof Error) {
      let specificCause = `Details: ${error.message}.`;
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        let hostname = 'the image server';
        try {
          hostname = new URL(imageUrl).hostname;
        } catch (e) { /* ignore if URL is invalid */ }
        specificCause = `The browser was blocked from fetching the image. This is often due to the image server's CORS (Cross-Origin Resource Sharing) policy. The server at '${hostname}' may not allow direct access from this app.`;
      }
      throw new Error(`Could not load or process image from ${imageUrl}. ${specificCause} Consider uploading the image directly or using a URL from a host that allows cross-origin requests.`);
    }
    throw new Error(`An unknown error occurred while processing ${imageUrl}.`);
  }
}

export async function convertFileToBase64(
  file: File,
  isCancellationRequestedRef: React.RefObject<boolean>,
  abortSignal?: AbortSignal
): Promise<{ base64: string; mimeType: string; fileName: string }> {
  if (isCancellationRequestedRef.current) {
    throw new CancellationError(`File conversion cancelled for ${file.name} before start.`);
  }
  if (abortSignal?.aborted) {
    throw new CancellationError(`File conversion aborted for ${file.name} before start via AbortSignal.`);
  }

  // Initial quick check, more robust check happens in processAndEncodeBlob
  // if (!file.type.startsWith('image/')) {
  //   throw new Error(`Invalid file type: ${file.type} for file ${file.name}. Please select an image file.`);
  // }
  
  try {
    const { base64, mimeType } = await processAndEncodeBlob(file, file.name, isCancellationRequestedRef, abortSignal);
    return { base64, mimeType, fileName: file.name };
  } catch (error) {
     if (error instanceof CancellationError || abortSignal?.aborted) {
      throw error instanceof CancellationError ? error : new CancellationError(`File conversion process for ${file.name} was cancelled/aborted. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.error(`Error processing file ${file.name}:`, error);
    // Re-throw or wrap error to be handled by the caller
    if (error instanceof Error) {
        throw new Error(`Failed to process file "${file.name}". ${error.message}`);
    }
    throw new Error(`An unknown error occurred while processing file "${file.name}".`);
  }
}
