
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ImageAltProcessingState, ToastMessage, ToastType, GenerationTone } from './types';
import { convertImageUrlToBase64, convertFileToBase64 } from './utils/imageUtils';
import { generateAltTextForImage, isApiKeyConfigured, getApiKeyError } from './services/geminiService';
import { exportImageAltsToCsv } from './utils/csvUtils';
import { extractProductContext } from './utils/textUtils';
import ImageAltCard from './components/ImageAltCard';
import LoadingSpinner from './components/LoadingSpinner';
import Alert from './components/Alert';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import ThemeToggleButton from './components/ThemeToggleButton';

const MAX_CONCURRENT_JOBS = 3;
const FREE_GENERATION_LIMIT = 5;
const LOCAL_STORAGE_AUTH_KEY = 'imageAltGeneratorAuth';
const LOCAL_STORAGE_THEME_KEY = 'imageAltGeneratorTheme';
const PREVIEW_GENERATION_BATCH_SIZE = 5; 

interface StoredAuthState {
  isLoggedIn: boolean;
  generationCount: number;
}

interface ProcessingProgressState {
  current: number;
  total: number;
  action?: 'processing' | 'regenerating';
}

interface JobBatchToProcess {
  jobs: ImageAltProcessingState[];
  action: 'processing' | 'regenerating';
}

class CancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CancellationError";
  }
}

type Theme = 'light' | 'dark';


const App: React.FC = () => {
  const [urlsInput, setUrlsInput] = useState<string>('');
  const [imageJobs, setImageJobs] = useState<ImageAltProcessingState[]>([]);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [apiKeyErrorState, setApiKeyErrorState] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isCancellationRequestedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [dragOver, setDragOver] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgressState | null>(null);
  const [previewProgress, setPreviewProgress] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const activeJobPromises = useRef<Set<Promise<any>>>(new Set());

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [globalProductContext, setGlobalProductContext] = useState<string>('');
  const [generationTone, setGenerationTone] = useState<GenerationTone>('seo-focused');

  const fileProcessingQueueRef = useRef<Map<string, File>>(new Map());

  const [jobBatchToProcess, setJobBatchToProcess] = useState<JobBatchToProcess | null>(null);

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
    } catch (e) {
      console.warn("Failed to access localStorage for theme. Defaulting to 'dark'.", e);
    }
    return 'dark'; 
  });

  const imageJobsRef = useRef(imageJobs);
  useEffect(() => {
    imageJobsRef.current = imageJobs;
  }, [imageJobs]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  }, []);

  useEffect(() => {
    try {
      const htmlElement = document.documentElement;
      if (theme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch (e) {
      console.warn("Failed to save theme to localStorage:", e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);


  useEffect(() => {
    if (!isApiKeyConfigured()) {
      const errorMsg = getApiKeyError() || "The Gemini API key (API_KEY) is not configured correctly or is missing. This application cannot function without it.";
      setApiKeyErrorState(errorMsg);
    }
    try {
      const storedAuth = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (storedAuth) {
        try {
          const authState: StoredAuthState = JSON.parse(storedAuth);
          setIsLoggedIn(authState.isLoggedIn);
          setGenerationCount(authState.isLoggedIn ? 0 : authState.generationCount);
        } catch (parseError) {
          console.error("Failed to parse stored auth state:", parseError);
          try {
            localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
          } catch (removeError) {
            console.warn("Failed to remove corrupted auth state from localStorage:", removeError);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to access localStorage for auth state. Using default auth state.", e);
    }
  }, []);

  useEffect(() => {
    if (apiKeyErrorState) {
      addToast(apiKeyErrorState, 'error', 5000);
    }
  }, [apiKeyErrorState, addToast]);

  useEffect(() => {
    try {
      const authState: StoredAuthState = {
        isLoggedIn,
        generationCount: isLoggedIn ? 0 : generationCount,
      };
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(authState));
    } catch (e) {
      console.warn("Failed to save auth state to localStorage:", e);
    }
  }, [isLoggedIn, generationCount]);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const updateJobState = useCallback((jobId: string, updates: Partial<ImageAltProcessingState>) => {
    setImageJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j));
  }, []);

  useEffect(() => {
    const totalFileJobsForProgress = imageJobs.filter(j => j.isFileInput && (j.status === 'preview-queued' || j.status === 'preview-loading' || j.status === 'preview-ready' || (j.status === 'error-image-load' && fileProcessingQueueRef.current.has(j.id))) ).length;
    const previewsCompletedOrFailed = imageJobs.filter(j =>
        j.isFileInput &&
        (j.status === 'preview-ready' || (j.status === 'error-image-load' && !fileProcessingQueueRef.current.has(j.id) && !isCancellationRequestedRef.current))
    ).length;

    const currentLoadingCount = imageJobs.filter(j => j.status === 'preview-loading').length;
    const queuedForPreviewCount = imageJobs.filter(j => j.status === 'preview-queued').length;

    if (currentLoadingCount === 0 && queuedForPreviewCount === 0 && fileProcessingQueueRef.current.size === 0) {
        if (previewProgress !== null && !isCancellationRequestedRef.current) setPreviewProgress(null);
    } else if (totalFileJobsForProgress > 0 && !isCancellationRequestedRef.current) {
        const newProgressMsg = `Preparing previews: ${previewsCompletedOrFailed}/${totalFileJobsForProgress} (Loading: ${currentLoadingCount}, Queued: ${queuedForPreviewCount})`;
        if (previewProgress !== newProgressMsg) setPreviewProgress(newProgressMsg);
    } else if (previewProgress !== null && totalFileJobsForProgress === 0 && !isCancellationRequestedRef.current) {
        setPreviewProgress(null);
    }

    if (isCancellationRequestedRef.current) return;

    const availableSlots = PREVIEW_GENERATION_BATCH_SIZE - currentLoadingCount;
    if (availableSlots <= 0) return;

    const jobsQueued = imageJobs.filter(j => j.status === 'preview-queued' && j.isFileInput);
    const jobsToStartThisCycle = jobsQueued.slice(0, availableSlots);

    if (jobsToStartThisCycle.length === 0) return;

    const jobIdsToStart = jobsToStartThisCycle.map(j => j.id);
    setImageJobs(prevJobs =>
      prevJobs.map(job =>
        jobIdsToStart.includes(job.id) ? { ...job, status: 'preview-loading' } : job
      )
    );

    jobsToStartThisCycle.forEach(jobToPreview => {
      if (isCancellationRequestedRef.current) {
        updateJobState(jobToPreview.id, { status: 'cancelled', errorMessage: 'Preview generation stopped by user.' });
        fileProcessingQueueRef.current.delete(jobToPreview.id);
        return;
      }
      const fileForJob = fileProcessingQueueRef.current.get(jobToPreview.id);
      if (!fileForJob) {
        updateJobState(jobToPreview.id, { status: 'error-image-load', errorMessage: 'File data missing for preview. Re-add file.' });
        fileProcessingQueueRef.current.delete(jobToPreview.id);
        return;
      }

      const previewPromise = convertFileToBase64(fileForJob, isCancellationRequestedRef, abortControllerRef.current?.signal)
        .then(({ base64, mimeType }) => {
            if (isCancellationRequestedRef.current) throw new CancellationError('Preview cancelled during conversion.');
            updateJobState(jobToPreview.id, { base64, mimeType, status: 'preview-ready' });
        })
        .catch(error => {
          if (isCancellationRequestedRef.current || error instanceof CancellationError) {
            updateJobState(jobToPreview.id, { status: 'cancelled', errorMessage: 'Preview generation cancelled.' });
          } else {
            const message = error instanceof Error ? error.message : "Unknown file preview error";
            updateJobState(jobToPreview.id, { status: 'error-image-load', errorMessage: `Preview error: ${message}` });
          }
        })
        .finally(() => {
            activeJobPromises.current.delete(previewPromise);
            fileProcessingQueueRef.current.delete(jobToPreview.id);
        });
      activeJobPromises.current.add(previewPromise);
    });
  }, [imageJobs, updateJobState, previewProgress]);

  const processImageJob = useCallback(async (jobToProcess: ImageAltProcessingState): Promise<void> => {
    const jobId = jobToProcess.id;
    
    if (isCancellationRequestedRef.current) {
      updateJobState(jobId, { status: 'cancelled', errorMessage: 'Generation cancelled before start.' });
      throw new CancellationError('Generation cancelled before start.');
    }
    
    if (!isLoggedIn && generationCount >= FREE_GENERATION_LIMIT && jobToProcess.altText === undefined) {
        updateJobState(jobId, { status: 'error-alt-text', errorMessage: 'Free generation limit reached.' });
        if (setShowAuthModal) setShowAuthModal(true);
        return; 
    }
    
    let base64Data = jobToProcess.base64;
    let mimeTypeData = jobToProcess.mimeType;

    if ((!base64Data || !mimeTypeData) && !jobToProcess.isFileInput) {
      if (isCancellationRequestedRef.current) {
        updateJobState(jobId, { status: 'cancelled', errorMessage: 'Image fetch cancelled.' });
        throw new CancellationError('Image fetch cancelled.');
      }
      updateJobState(jobId, { status: 'loading-image' });
      try {
        const { base64, mimeType } = await convertImageUrlToBase64(jobToProcess.url, isCancellationRequestedRef, abortControllerRef.current?.signal);
        if (isCancellationRequestedRef.current) throw new CancellationError('Image fetch cancelled during conversion.');
        base64Data = base64;
        mimeTypeData = mimeType;
        updateJobState(jobId, { base64, mimeType }); 
      } catch (fetchError) {
        if (isCancellationRequestedRef.current || fetchError instanceof CancellationError) {
            updateJobState(jobId, { status: 'cancelled', errorMessage: 'Image fetch cancelled.' });
            throw fetchError instanceof CancellationError ? fetchError : new CancellationError('Image fetch cancelled.');
        }
        const message = fetchError instanceof Error ? fetchError.message : "Unknown image fetch error";
        updateJobState(jobId, { status: 'error-image-load', errorMessage: message });
        throw fetchError; 
      }
    }

    if (isCancellationRequestedRef.current) {
      updateJobState(jobId, { status: 'cancelled', errorMessage: 'Generation cancelled after image load.' });
      throw new CancellationError('Generation cancelled after image load.');
    }
    
    if (!base64Data || !mimeTypeData) {
        const errorMsg = 'Image data unavailable for alt text generation.';
        updateJobState(jobId, { status: 'error-alt-text', errorMessage: errorMsg });
        throw new Error(errorMsg);
    }

    updateJobState(jobId, { status: 'processing-alt-text' });
    try {
      if (isCancellationRequestedRef.current) {
        throw new CancellationError('Alt text generation cancelled before API call.');
      }
      const altTextResult = await generateAltTextForImage(base64Data, mimeTypeData, jobToProcess.extractedContext, jobToProcess.manualProductContext, generationTone);
      
      if (isCancellationRequestedRef.current) {
        throw new CancellationError('Alt text generation cancelled after API call.');
      }

      updateJobState(jobId, { altText: altTextResult, status: 'completed' });
      if (!isLoggedIn && jobToProcess.altText === undefined) { 
            setGenerationCount(prev => prev + 1);
      }
    } catch (geminiError) {
      if (isCancellationRequestedRef.current || geminiError instanceof CancellationError) {
          updateJobState(jobId, { status: 'cancelled', errorMessage: 'Alt text generation cancelled.' });
          throw geminiError instanceof CancellationError ? geminiError : new CancellationError('Alt text generation cancelled.');
      }
      const message = geminiError instanceof Error ? geminiError.message : "Unknown Gemini API error";
      updateJobState(jobId, { status: 'error-alt-text', errorMessage: message });
      throw geminiError; 
    }
  }, [updateJobState, isLoggedIn, generationCount, generationTone, setShowAuthModal, setGenerationCount]);


  const processJobQueue = useCallback(async (
    jobsToRun: ImageAltProcessingState[],
    action: 'processing' | 'regenerating',
    currentImageJobsSnapshot: ImageAltProcessingState[] // Snapshot of jobs at the beginning of this batch
  ) => {
    if (apiKeyErrorState || jobsToRun.length === 0) {
      setGlobalLoading(false);
      setProcessingProgress(null);
      return;
    }
    
    let processedInBatch = 0;
    let activeWorkers = 0; 
    const totalJobsInThisBatch = jobsToRun.length;
    setProcessingProgress({ current: 0, total: totalJobsInThisBatch, action });

    const queue = [...jobsToRun]; // Use the snapshot to create the queue for this batch

    const checkCompletionAndFinalize = () => {
      if (isCancellationRequestedRef.current) {
        setGlobalLoading(false); 
        setProcessingProgress(null);
      } else {
        if (processedInBatch === totalJobsInThisBatch && activeWorkers === 0) {
          setGlobalLoading(false); 
          setProcessingProgress(null);
          if (!isLoggedIn && generationCount >= FREE_GENERATION_LIMIT) {
            if (setShowAuthModal) setShowAuthModal(true);
          }
        }
      }
    };
    
    const processNextJob = async () => {
      if (isCancellationRequestedRef.current) {
        checkCompletionAndFinalize();
        return;
      }

      const jobFromQueue = queue.shift(); // Job from the initial snapshot for this batch

      if (!jobFromQueue) {
        checkCompletionAndFinalize();
        return;
      }
      
      activeWorkers++;
      let jobPromise: Promise<any> | undefined;

      try {
        if (isCancellationRequestedRef.current) {
            updateJobState(jobFromQueue.id, { status: 'cancelled', errorMessage: 'Cancelled before processing in batch.' });
            throw new CancellationError('Cancelled before processing in batch.');
        }

        const latestJobVersion = imageJobsRef.current.find(j => j.id === jobFromQueue.id);

        if (!latestJobVersion) {
            console.warn(`[ProcessNextJob] Job ${jobFromQueue.id} (from snapshot) not found in latest imageJobsRef.current. Skipping.`);
        } else if (jobFromQueue.status === 'pending') { // Decision to process is based on snapshot's 'pending' status
            if (latestJobVersion.status === 'pending') {
                // Snapshot said pending, latest says pending: Process with latest data.
                jobPromise = processImageJob(latestJobVersion);
                activeJobPromises.current.add(jobPromise);
                await jobPromise;
            } else if (latestJobVersion.status === 'cancelled') {
                // Snapshot said pending, but latest is cancelled: Update main state to ensure consistency.
                updateJobState(latestJobVersion.id, { status: 'cancelled', errorMessage: latestJobVersion.errorMessage || 'Job cancelled during batch.' });
            } else {
                // Snapshot said pending, but latest is something else (e.g., completed/error by other means): Skip.
                console.warn(`[ProcessNextJob] Job ${jobFromQueue.id} was 'pending' in snapshot, but is now '${latestJobVersion.status}'. Skipping processing.`);
            }
        } else if (jobFromQueue.status === 'cancelled' && !isCancellationRequestedRef.current) {
            // Snapshot said it was already cancelled (and not by global stop): ensure it's still marked.
            updateJobState(jobFromQueue.id, { status: 'cancelled', errorMessage: jobFromQueue.errorMessage || 'Job was already cancelled.' });
        }
        // If jobFromQueue.status was other than 'pending' or 'cancelled' (e.g. completed, error), it's skipped by this logic.

      } catch (e) {
         if (!(e instanceof CancellationError)) {
            console.error("[ProcessNextJob] Error processing job:", jobFromQueue.id, e);
         }
      } finally {
        if (jobPromise) {
            activeJobPromises.current.delete(jobPromise);
        }
        activeWorkers--; 
        processedInBatch++;
        
        setProcessingProgress(prev => ({ 
            current: processedInBatch, 
            total: totalJobsInThisBatch, 
            action: prev?.action || action 
        }));

        if (!isCancellationRequestedRef.current) {
            processNextJob(); 
        } else {
            checkCompletionAndFinalize();
        }
      }
    };

    for (let i = 0; i < Math.min(MAX_CONCURRENT_JOBS, jobsToRun.length); i++) {
      if (isCancellationRequestedRef.current) break; 
      processNextJob(); 
    }

    if (jobsToRun.length === 0 || Math.min(MAX_CONCURRENT_JOBS, jobsToRun.length) === 0) { 
        checkCompletionAndFinalize();
    }

  }, [apiKeyErrorState, processImageJob, isLoggedIn, generationCount, setShowAuthModal, updateJobState, setGenerationCount, setGlobalLoading]); 


  useEffect(() => {
    if (globalLoading || !!apiKeyErrorState || !!jobBatchToProcess || isCancellationRequestedRef.current) {
      return;
    }

    const pendingJobs = imageJobs.filter(job => job.status === 'pending');
    if (pendingJobs.length === 0) {
      return;
    }

    let jobsToActuallyProcessThisBatch: ImageAltProcessingState[] = [];
    let actionType: 'processing' | 'regenerating' = 'processing';

    if (!isLoggedIn) {
      const alreadyProcessingCount = activeJobPromises.current.size; 
      const availableSlots = Math.max(0, FREE_GENERATION_LIMIT - generationCount - alreadyProcessingCount);
      
      if (pendingJobs.length > availableSlots && availableSlots === 0) {
         addToast(`Free limit reached. Log in to process more jobs.`, "warning");
         if (setShowAuthModal) setShowAuthModal(true);
      } else if (pendingJobs.length > availableSlots && availableSlots > 0) {
         addToast(`Processing limited to ${availableSlots} new job(s) due to free tier. Some jobs may not be processed immediately.`, "info");
      }
      jobsToActuallyProcessThisBatch = pendingJobs.slice(0, availableSlots);
    } else {
      jobsToActuallyProcessThisBatch = pendingJobs;
    }

    if (jobsToActuallyProcessThisBatch.length > 0) {
      const isRegenerationBatch = jobsToActuallyProcessThisBatch.every(job => {
        // Find the job in the main imageJobs state to check its original altText property
        const mainJobInstance = imageJobs.find(oj => oj.id === job.id);
        return mainJobInstance?.altText !== undefined; 
      });
      actionType = isRegenerationBatch ? 'regenerating' : 'processing';
      
      setGlobalLoading(true); 
      isCancellationRequestedRef.current = false; 
      abortControllerRef.current = new AbortController(); 
      // Pass a snapshot of the jobs to be processed to setJobBatchToProcess
      setJobBatchToProcess({ jobs: jobsToActuallyProcessThisBatch.map(j => ({...j})), action: actionType });
      
      const urlJobIdsInBatch = new Set(jobsToActuallyProcessThisBatch.filter(j => !j.isFileInput).map(j => j.id));
      if (urlsInput.trim() !== '' && imageJobs.some(j => urlJobIdsInBatch.has(j.id))) {
           setUrlsInput(''); 
      }

    } else if (pendingJobs.length > 0 && !isLoggedIn) {
        addToast("No free slots to process pending jobs. Please log in.", "warning");
        if (setShowAuthModal) setShowAuthModal(true);
    }
  }, [imageJobs, globalLoading, apiKeyErrorState, isLoggedIn, generationCount, jobBatchToProcess, addToast, setShowAuthModal, setJobBatchToProcess, urlsInput, setGlobalLoading]);


  useEffect(() => {
    if (jobBatchToProcess && jobBatchToProcess.jobs.length > 0) {
        // Pass the snapshot of imageJobs that was current when the batch was initiated
        processJobQueue(jobBatchToProcess.jobs, jobBatchToProcess.action, imageJobsRef.current);
        setJobBatchToProcess(null); 
    } else if (jobBatchToProcess && jobBatchToProcess.jobs.length === 0) {
        setJobBatchToProcess(null); 
        setGlobalLoading(false);
    }
  }, [jobBatchToProcess, processJobQueue, setGlobalLoading]);


  const handleGenerate = useCallback(() => {
    if (apiKeyErrorState) {
      addToast("API Key error. Cannot process jobs.", "error");
      return;
    }
    if (isCancellationRequestedRef.current) isCancellationRequestedRef.current = false; 

    const currentUrlsInputValue = urlsInput; // Capture current urlsInput
    let newUrlJobsCountInThisAction = 0;
    
    setImageJobs(currentJobs => {
        let updatedJobs = [...currentJobs];
        const urlStrings = currentUrlsInputValue.split('\n').map(url => url.trim()).filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
        const existingUrlJobUrls = new Set(updatedJobs.filter(j => !j.isFileInput).map(j => j.url));
        
        let tempNewUrlJobs: ImageAltProcessingState[] = [];
        let newUrlJobsAddedInUpdater = 0;

        if (urlStrings.length > 0) {
            for (const url of urlStrings) {
                // Correctly calculate jobs already pending or active for limit check
                const pendingOrActiveCount = currentJobs.filter(j => j.status === 'pending' || j.status === 'loading-image' || j.status === 'processing-alt-text').length + activeJobPromises.current.size;
                if (!isLoggedIn && (generationCount + newUrlJobsAddedInUpdater + pendingOrActiveCount) >= FREE_GENERATION_LIMIT) {
                    break;
                }
                if (!existingUrlJobUrls.has(url)) {
                    tempNewUrlJobs.push({
                        id: crypto.randomUUID(), url, status: 'pending', isFileInput: false,
                        extractedContext: extractProductContext(url), manualProductContext: globalProductContext,
                        showContextInput: false, selected: false, createdAt: Date.now(),
                    });
                    newUrlJobsAddedInUpdater++;
                }
            }
            if (tempNewUrlJobs.length > 0) {
                updatedJobs = [...tempNewUrlJobs, ...updatedJobs];
                newUrlJobsCountInThisAction = newUrlJobsAddedInUpdater; // Store how many were actually added
            }
        }
        
        let fileJobsTransitionedInUpdater = 0;
        updatedJobs = updatedJobs.map(job => {
            if (job.isFileInput && job.status === 'preview-ready') {
                const pendingOrActiveCount = updatedJobs.filter(j => (j.status === 'pending' || j.status === 'loading-image' || j.status === 'processing-alt-text') && j.id !== job.id).length + activeJobPromises.current.size + newUrlJobsAddedInUpdater;
                 if (!isLoggedIn && (generationCount + fileJobsTransitionedInUpdater + pendingOrActiveCount) >= FREE_GENERATION_LIMIT) {
                    return job;
                }
                fileJobsTransitionedInUpdater++;
                return { ...job, status: 'pending', manualProductContext: job.manualProductContext || globalProductContext };
            }
            return job;
        });
        
        if (newUrlJobsAddedInUpdater === 0 && fileJobsTransitionedInUpdater === 0) {
            if (urlStrings.length > 0 || currentJobs.some(j => j.isFileInput && j.status === 'preview-ready')) {
                 addToast("No new URLs to add or files ready to process. Check input or free limit.", 'info');
            }
        }
        return updatedJobs;
    });

    // Clear urlsInput if URLs were present in the input and new jobs were actually added from them
    // This check is now outside setImageJobs updater
    if (currentUrlsInputValue.trim() !== '' && newUrlJobsCountInThisAction > 0) {
        setUrlsInput('');
    }

  }, [apiKeyErrorState, urlsInput, isLoggedIn, generationCount, globalProductContext, addToast, setImageJobs, setUrlsInput]);


  const addFileJobs = useCallback((files: FileList | File[]) => {
    const filesArray = Array.from(files);
    if (filesArray.length === 0) return;
    if (isCancellationRequestedRef.current) isCancellationRequestedRef.current = false; 

    if (!isLoggedIn && generationCount >= FREE_GENERATION_LIMIT) {
      addToast(`Free limit reached. Log in to add files.`, "warning");
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }
    
    const currentFileRelatedJobsCount = imageJobs.filter(j => j.isFileInput || fileProcessingQueueRef.current.has(j.id)).length;
    const currentApiConsumingOperations = activeJobPromises.current.size + imageJobs.filter(j => j.status === 'pending').length;
    
    let filesToProcess = filesArray;

    if (!isLoggedIn) {
      const availableSlots = FREE_GENERATION_LIMIT - generationCount - currentFileRelatedJobsCount - currentApiConsumingOperations;
      if (filesArray.length > availableSlots) {
        addToast(`Can add ${Math.max(0,availableSlots)} more image(s) on free plan. ${filesArray.length - Math.max(0,availableSlots)} file(s) not added.`, "info");
        filesToProcess = filesArray.slice(0, Math.max(0, availableSlots));
      }
    }
     if (filesToProcess.length === 0 && filesArray.length > 0) {
        addToast("No free slots to add new files. Log in or wait for current jobs.", "info");
        return;
    }

    const newJobsForState: ImageAltProcessingState[] = [];
    filesToProcess.forEach(file => {
      const isDuplicate = imageJobs.some(job => job.url === file.name && job.isFileInput) || 
                          Array.from(fileProcessingQueueRef.current.values()).some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
          addToast(`File "${file.name}" is a duplicate and was not added.`, "info");
          return;
      }
      const jobId = crypto.randomUUID();
      newJobsForState.push({
        id: jobId, url: file.name, status: 'preview-queued', isFileInput: true,
        extractedContext: extractProductContext(file.name), manualProductContext: globalProductContext,
        showContextInput: false, selected: false, createdAt: Date.now(),
      });
      fileProcessingQueueRef.current.set(jobId, file);
    });
    if (newJobsForState.length > 0) setImageJobs(prev => [...newJobsForState, ...prev]);
  }, [isLoggedIn, generationCount, addToast, globalProductContext, imageJobs, setShowAuthModal, setImageJobs]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFileJobs(event.target.files);
      event.target.value = '';
    }
  };

  const handleStopGeneration = async () => {
    addToast("Stopping generation...", "warning");
    isCancellationRequestedRef.current = true;
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null; 
    }
    
    setGlobalLoading(false); 
    setProcessingProgress(null); 
    setPreviewProgress(null); 
    setJobBatchToProcess(null); 
    
    fileProcessingQueueRef.current.clear(); 

    const promisesToWaitFor = Array.from(activeJobPromises.current);
    activeJobPromises.current.clear(); 
    await Promise.allSettled(promisesToWaitFor);


    setImageJobs(prevJobs =>
      prevJobs.map(job => {
        if (['pending', 'loading-image', 'processing-alt-text', 'preview-loading', 'preview-queued'].includes(job.status)) {
          return { ...job, status: 'cancelled' as const, errorMessage: 'Stopped by user.' };
        }
        return job;
      })
    );
    addToast("Generation stopped.", "info");
  };

  const handleClear = () => {
    if (imageJobs.length > 0 || urlsInput.trim() !== '' || globalProductContext.trim() !== '') {
      if (!window.confirm("Clear all inputs, results, and global settings? This will stop any ongoing processes.")) return;
    }
    
    const clearAllState = () => {
        setUrlsInput('');
        setGlobalProductContext('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImageJobs([]);
        setGenerationTone('seo-focused');
        fileProcessingQueueRef.current.clear(); 
        isCancellationRequestedRef.current = false; 
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); 
            abortControllerRef.current = null;
        }
        activeJobPromises.current.clear();
        setGlobalLoading(false);
        setProcessingProgress(null);
        setPreviewProgress(null);
        setJobBatchToProcess(null);
        addToast("All cleared.", "info");
    };

    if (globalLoading || previewProgress || jobBatchToProcess || activeJobPromises.current.size > 0) {
        handleStopGeneration().then(clearAllState);
    } else {
        clearAllState();
    }
  };

  const handleExportCsv = () => {
    if (imageJobs.length === 0) {
      addToast("No jobs to export.", "info");
      return;
    }
    try {
      const csvData = exportImageAltsToCsv(imageJobs);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'alt_texts_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      addToast("Results exported to CSV.", "success");
    } catch (e) {
      addToast("Failed to export CSV.", "error");
    }
  };

  const handleAltTextUpdate = useCallback((jobId: string, newAltText: string) => {
    updateJobState(jobId, { altText: newAltText, userModified: true });
  }, [updateJobState]);

  const handleRetryJob = useCallback((jobId: string) => {
    const jobToRetry = imageJobs.find(j => j.id === jobId);
    if (!jobToRetry) return;

    if (isCancellationRequestedRef.current) isCancellationRequestedRef.current = false; 
    if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
      abortControllerRef.current = new AbortController();
    }

    let canRetry = false;
    if (['completed', 'error-alt-text', 'error-image-load', 'cancelled'].includes(jobToRetry.status)) {
        canRetry = true;
    }


    if (!canRetry) {
        addToast("This job cannot be retried in its current state.", "warning");
        return;
    }
    
    const isRetryingFailedImageLoadForUrl = jobToRetry.status === 'error-image-load' && !jobToRetry.isFileInput;

    if (!isLoggedIn && (generationCount + activeJobPromises.current.size + imageJobs.filter(j => j.status === 'pending' && j.id !== jobId).length) >= FREE_GENERATION_LIMIT) {
        addToast("Free limit reached. Log in to retry/regenerate.", "warning");
        if (setShowAuthModal) setShowAuthModal(true);
        return;
    }

    const updatedJobData: Partial<ImageAltProcessingState> = {
        status: 'pending',
        errorMessage: undefined,
        userModified: false,
        altText: (jobToRetry.status === 'error-image-load' && jobToRetry.altText) ? jobToRetry.altText : undefined, 
    };

    if (isRetryingFailedImageLoadForUrl) {
        updatedJobData.base64 = undefined;
        updatedJobData.mimeType = undefined;
    }
    
    setImageJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updatedJobData } : j));

  }, [imageJobs, isLoggedIn, generationCount, addToast, setShowAuthModal, setImageJobs]);

  const handleBatchRegenerate = useCallback((target: 'selected' | 'allCompletedOrError') => {
    const jobsToConsider = target === 'selected'
      ? imageJobs.filter(j => j.selected)
      : imageJobs;

    if (isCancellationRequestedRef.current) isCancellationRequestedRef.current = false; 
    if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
      abortControllerRef.current = new AbortController();
    }


    const eligibleJobsForRegen = jobsToConsider.filter(j =>
      (j.status === 'completed' || (j.status === 'error-alt-text' && j.base64)) && j.base64 
    );

    if (eligibleJobsForRegen.length === 0) {
      addToast(target === 'selected' ? "No selected items eligible for regeneration." : "No jobs eligible for regeneration.", "info");
      return;
    }

    let jobsToMarkPendingCount = 0;
    if (!isLoggedIn) {
      const alreadyProcessingCount = activeJobPromises.current.size + imageJobs.filter(j => j.status === 'pending' && !eligibleJobsForRegen.find(ej => ej.id === j.id)).length;
      const availableSlots = Math.max(0, FREE_GENERATION_LIMIT - generationCount - alreadyProcessingCount);
      
      if (eligibleJobsForRegen.length > availableSlots && availableSlots === 0) {
         addToast(`Free limit reached. Log in to regenerate jobs.`, "warning");
         if (setShowAuthModal) setShowAuthModal(true);
         return; 
      } else if (eligibleJobsForRegen.length > availableSlots && availableSlots > 0) {
         addToast(`Regeneration limited to ${availableSlots} job(s) due to free tier.`, "info");
      }
      jobsToMarkPendingCount = Math.min(eligibleJobsForRegen.length, availableSlots);
    } else {
      jobsToMarkPendingCount = eligibleJobsForRegen.length;
    }

    if (jobsToMarkPendingCount === 0 && eligibleJobsForRegen.length > 0) { 
      addToast("No jobs can be marked for regeneration (possibly due to free limit or ongoing operations).", "info");
      return;
    }
    
    const idsToUpdate = eligibleJobsForRegen.slice(0, jobsToMarkPendingCount).map(j => j.id);

    setImageJobs(prev => {
        return prev.map(j => {
          if (idsToUpdate.includes(j.id)) {
            return {
              ...j,
              status: 'pending' as const,
              altText: undefined,
              errorMessage: undefined,
              userModified: false,
            };
          }
          return j;
        });
    });
    
    addToast(`Marked ${idsToUpdate.length} job(s) for regeneration.`, "success");

  }, [imageJobs, isLoggedIn, generationCount, addToast, setShowAuthModal, setImageJobs]);


  const handleRemovePreviewJob = useCallback((jobId: string) => {
    fileProcessingQueueRef.current.delete(jobId); 
    setImageJobs(prev => prev.filter(job => job.id !== jobId));
  }, [setImageJobs]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); event.stopPropagation();
    if (!dragOver) setDragOver(true);
  }, [dragOver]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); event.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      addFileJobs(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  }, [addFileJobs]);

  const handleCopyAllResults = () => {
    const completedTexts = imageJobs.filter(j => j.status === 'completed' && j.altText).map(j => `${j.url}\t${j.altText}`).join('\n');
    if (completedTexts) {
      navigator.clipboard.writeText(completedTexts)
        .then(() => addToast("All alt texts (URL + text) copied!", "success"))
        .catch(() => addToast("Failed to copy alt texts.", "error"));
    } else {
      addToast("No completed alt texts to copy.", "info");
    }
  };

  const handleToggleContextInput = useCallback((jobId: string) => {
    updateJobState(jobId, { showContextInput: !imageJobs.find(j => j.id === jobId)?.showContextInput });
  }, [imageJobs, updateJobState]);

  const handleContextChange = useCallback((jobId: string, newContext: string) => {
    updateJobState(jobId, { manualProductContext: newContext });
  }, [updateJobState]);

  const handleLogin = () => {
    setIsLoggedIn(true); 
    setGenerationCount(0); 
    setShowAuthModal(false);
    addToast("Logged in (simulated).", "success");
    if (isCancellationRequestedRef.current) isCancellationRequestedRef.current = false; 
    if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
      abortControllerRef.current = new AbortController();
    }
    
    setImageJobs(prev => {
        const jobsErroredDueToLimit = prev.filter(j => 
            j.status === 'error-alt-text' && 
            j.errorMessage?.toLowerCase().includes('free generation limit')
        ).map(j => j.id);
        
        if (jobsErroredDueToLimit.length === 0) return prev;
         addToast("Retrying jobs affected by previous free limit.", "info");
        return prev.map(j => {
            if (jobsErroredDueToLimit.includes(j.id)) {
                return {...j, status: 'pending' as const, errorMessage: undefined, altText: undefined, userModified: false};
            }
            return j;
        });
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setGenerationCount(imageJobs.filter(j => j.status === 'completed' && j.altText !== undefined).length); 
    addToast("Logged out.", "info");
  };

  const handleToggleSelectJob = useCallback((jobId: string) => {
    setImageJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, selected: !j.selected } : j));
  }, [setImageJobs]);

  const selectedJobIds = useMemo(() => new Set(imageJobs.filter(job => job.selected).map(job => job.id)), [imageJobs]);
  const sortedImageJobs = useMemo(() => [...imageJobs].sort((a, b) => b.createdAt - a.createdAt), [imageJobs]);

  const handleSelectAllJobs = useCallback(() => setImageJobs(prev => prev.map(j => ({ ...j, selected: true }))), [setImageJobs]);
  const handleDeselectAllJobs = useCallback(() => setImageJobs(prev => prev.map(j => ({ ...j, selected: false }))), [setImageJobs]);

  const handleBatchTextModify = useCallback((type: 'prepend' | 'append') => {
    const text = prompt(`Enter text to ${type}:`, "");
    if (text === null || text.trim() === "") return; 
    let modifiedCount = 0;
    setImageJobs(prevJobs => prevJobs.map(job => {
      if (selectedJobIds.has(job.id) && job.status === 'completed' && job.altText) {
        modifiedCount++;
        return { ...job, altText: type === 'prepend' ? `${text} ${job.altText}`.trim() : `${job.altText} ${text}`.trim(), userModified: true };
      }
      return job;
    }));
    addToast(modifiedCount > 0 ? `${type === 'prepend' ? 'Prepended' : 'Appended'} text to ${modifiedCount} item(s).` : "No applicable items selected or text not modifiable.", "info");
  }, [selectedJobIds, addToast, setImageJobs]);

  const hasAnyJobs = imageJobs.length > 0;
  const hasCompletedJobs = useMemo(() => imageJobs.some(job => job.status === 'completed' && job.altText), [imageJobs]);
  
  const generationsRemainingText = useMemo(() => {
    if (isLoggedIn) return "Unlimited generations";
    const pendingApiConsumingJobsCount = imageJobs.filter(j => j.status === 'pending' && j.altText === undefined).length;
    const consumedOrActiveOrQueuedForApi = generationCount + activeJobPromises.current.size + pendingApiConsumingJobsCount;
    const remaining = Math.max(0, FREE_GENERATION_LIMIT - consumedOrActiveOrQueuedForApi);
    return `${remaining} free API call(s) remaining`;
  }, [isLoggedIn, generationCount, imageJobs]); 


  const canInitiateNewGenerations = useMemo(() => {
    if (apiKeyErrorState || globalLoading || previewProgress || jobBatchToProcess) return false;
    const hasNewUrlInputs = urlsInput.split('\n').map(url => url.trim()).filter(Boolean).length > 0;
    const hasFilePreviewsReady = imageJobs.some(j => j.isFileInput && j.status === 'preview-ready');
    
    if (!(hasNewUrlInputs || hasFilePreviewsReady)) return false;

    if (!isLoggedIn) {
        const pendingApiConsumingJobsCount = imageJobs.filter(j => j.status === 'pending' && j.altText === undefined).length;
        const potentialNewCallsFromInput = 
          (hasNewUrlInputs ? urlsInput.split('\n').map(url => url.trim()).filter(Boolean).filter(u => !imageJobs.some(j => j.url === u && !j.isFileInput && j.altText === undefined)).length : 0) + 
          imageJobs.filter(j => j.isFileInput && j.status === 'preview-ready').length;
        
        return (generationCount + activeJobPromises.current.size + pendingApiConsumingJobsCount + potentialNewCallsFromInput) <= FREE_GENERATION_LIMIT && potentialNewCallsFromInput > 0;
    }
    return true; 
  }, [apiKeyErrorState, globalLoading, previewProgress, jobBatchToProcess, urlsInput, imageJobs, isLoggedIn, generationCount]);

  const isLoadingSomething = globalLoading || !!previewProgress || (!!jobBatchToProcess && jobBatchToProcess.jobs.length > 0); 

  const processingProgressText = useMemo(() => {
    if (!processingProgress && globalLoading && !previewProgress) return "Preparing to process..."; 
    if (!processingProgress || !globalLoading) return "Processing..."; 
    const actionText = processingProgress.action === 'regenerating' ? 'Regenerating' : 'Processing';
    return `${actionText} ${processingProgress.current} of ${processingProgress.total}...`;
  }, [processingProgress, globalLoading, previewProgress]);

  const canRegenerateSelected = useMemo(() => {
    if (isLoadingSomething || selectedJobIds.size === 0) return false;
    const eligibleForRegen = imageJobs.some(j => j.selected && (j.status === 'completed' || (j.status === 'error-alt-text' && j.base64)));
    if (!eligibleForRegen) return false;
    if (!isLoggedIn) {
      const pendingNonSelectedApiJobs = imageJobs.filter(j => j.status === 'pending' && !j.altText && !j.selected).length;
      return (generationCount + activeJobPromises.current.size + pendingNonSelectedApiJobs) < FREE_GENERATION_LIMIT;
    }
    return true;
  }, [isLoadingSomething, selectedJobIds, imageJobs, isLoggedIn, generationCount]);

  const canRegenerateAll = useMemo(() => {
    if (isLoadingSomething || imageJobs.length === 0) return false;
    const eligibleForRegen = imageJobs.some(j => (j.status === 'completed' || (j.status === 'error-alt-text' && j.base64)));
     if (!eligibleForRegen) return false;
    if (!isLoggedIn) {
      const pendingApiJobs = imageJobs.filter(j => j.status === 'pending' && !j.altText).length;
      return (generationCount + activeJobPromises.current.size + pendingApiJobs) < FREE_GENERATION_LIMIT;
    }
    return true;
  }, [isLoadingSomething, imageJobs, isLoggedIn, generationCount]);

  const toastRootElement = useMemo(() => document.getElementById('toast-root'), []);
  const modalRootElement = useMemo(() => document.getElementById('modal-root'), []);

  return (
    <>
      {toastRootElement && ReactDOM.createPortal(
        <div className="toast-container">
          {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />)}
        </div>,
        toastRootElement
      )}
      {showAuthModal && modalRootElement && ReactDOM.createPortal(
        <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />,
        modalRootElement
      )}
      <div className="min-h-screen bg-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-100 p-4 sm:p-8 flex flex-col items-center selection:bg-sky-500 selection:text-white">
        <header className="w-full max-w-4xl mb-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 dark:from-sky-400 to-cyan-400 dark:to-cyan-300">
              AI Image Alt Text Generator
            </h1>
            <div className="flex items-center gap-4">
               <ThemeToggleButton currentTheme={theme} onToggle={toggleTheme} />
              {isLoggedIn ? (
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md transition">Logout</button>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md transition">Login / Sign Up</button>
              )}
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base text-center sm:text-left">Bulk generate alt text. Provide URLs or upload/drag & drop images.</p>
          {!isLoggedIn && (
             <p className="text-xs text-sky-600 dark:text-sky-300 mt-1 text-center sm:text-left" aria-live="polite">
              Generations used: {generationCount} / {FREE_GENERATION_LIMIT}. ({generationsRemainingText})
            </p>
          )}
           <div className="mt-4">
            <Alert 
              type="info" 
              title="Supported Image Formats"
              message={
                <>
                  <p>
                    The AI can directly process images in <strong>PNG, JPEG, WEBP, HEIC, and HEIF</strong> formats.
                  </p>
                  <p className="mt-1">
                    Images in <strong>AVIF and BMP</strong> formats will be automatically converted to JPEG in your browser before processing. This conversion relies on your browser's capabilities.
                  </p>
                  <p className="mt-1">
                    If an image format is not listed or conversion fails, an error will be shown for that specific image.
                  </p>
                </>
              } 
            />
          </div>
        </header>

        <main className="w-full max-w-4xl space-y-8">
          {apiKeyErrorState && !isApiKeyConfigured() && (
            <Alert type="error" title="API Key Configuration Error" message={apiKeyErrorState} />
          )}

          <section className="bg-white dark:bg-slate-800/70 dark:backdrop-blur-md p-6 rounded-xl shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="globalProductContext" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Global Product Context (Optional)</label>
                <input type="text" id="globalProductContext" value={globalProductContext} onChange={(e) => setGlobalProductContext(e.target.value)} placeholder="e.g., Summer Collection" className="w-full p-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm" disabled={isLoadingSomething} />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Applied to new jobs. Can be overridden per image.</p>
              </div>
              <div>
                <label htmlFor="generationTone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Generation Tone</label>
                <select id="generationTone" value={generationTone} onChange={(e) => setGenerationTone(e.target.value as GenerationTone)} className="w-full p-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100 text-sm" disabled={isLoadingSomething}>
                  <option value="default">Default (Descriptive)</option>
                  <option value="seo-focused">SEO-Focused</option>
                  <option value="brief">Brief</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Adjusts AI-generated text style.</p>
              </div>
            </div>

            <div>
              <label htmlFor="imageUrls" className="block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Enter Image URLs</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">One URL per line. Added when "Generate" is clicked.</p>
              <textarea id="imageUrls" value={urlsInput} onChange={(e) => setUrlsInput(e.target.value)} placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png" rows={3} className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100 resize-y shadow-inner placeholder-slate-400 dark:placeholder-slate-500" disabled={isLoadingSomething || !!apiKeyErrorState || (!isLoggedIn && (generationCount + activeJobPromises.current.size + imageJobs.filter(j=>j.status === 'pending' && !j.altText).length >= FREE_GENERATION_LIMIT) && urlsInput.trim() === '' && imageJobs.filter(j => j.isFileInput && j.status === 'preview-ready').length === 0)} aria-label="Image URLs input" />
            </div>

            <div className={`pt-6 border-t border-slate-300 dark:border-slate-700 ${dragOver ? 'border-sky-500 ring-2 ring-sky-500 bg-slate-200/50 dark:bg-slate-700/30' : 'border-slate-300 dark:border-slate-700'} rounded-lg p-4 transition-all`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <label htmlFor="fileUploadInput" className="block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Upload or Drag & Drop Images</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Previews appear below. {!isLoggedIn && `(${Math.max(0, FREE_GENERATION_LIMIT - generationCount - (imageJobs.filter(j => j.isFileInput && ['preview-queued', 'preview-loading', 'preview-ready'].includes(j.status)).length + fileProcessingQueueRef.current.size) - activeJobPromises.current.size - (imageJobs.filter(j=>j.status === 'pending' && !j.altText).length) )} slots for new files)`}</p>
              <input type="file" id="fileUploadInput" multiple accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} disabled={isLoadingSomething || !!apiKeyErrorState || (!isLoggedIn && (generationCount + activeJobPromises.current.size + (imageJobs.filter(j=>j.status === 'pending' && !j.altText).length) + fileProcessingQueueRef.current.size + imageJobs.filter(j => j.isFileInput && ['preview-queued', 'preview-loading', 'preview-ready'].includes(j.status)).length >= FREE_GENERATION_LIMIT))} aria-labelledby="fileUploadLabel" />
              <button id="fileUploadLabel" type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoadingSomething || !!apiKeyErrorState || (!isLoggedIn && (generationCount + activeJobPromises.current.size + (imageJobs.filter(j=>j.status === 'pending' && !j.altText).length) + fileProcessingQueueRef.current.size + imageJobs.filter(j => j.isFileInput && ['preview-queued', 'preview-loading', 'preview-ready'].includes(j.status)).length >= FREE_GENERATION_LIMIT))} className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-100 dark:text-slate-200 font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.493 0 4.5 4.5 0 0 1-1.41 8.775H6.75Z" /></svg>
                Select Files
              </button>
              {dragOver && <p className="mt-2 text-sm text-sky-500 dark:text-sky-300 text-center">Drop images here!</p>}
              {previewProgress && <div className="mt-3 flex items-center text-sm text-sky-600 dark:text-sky-300"><LoadingSpinner className="w-4 h-4 mr-2" />{previewProgress}</div>}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              {!globalLoading || isCancellationRequestedRef.current ? ( 
                <button onClick={handleGenerate} disabled={!canInitiateNewGenerations || !!apiKeyErrorState || (!!previewProgress && !isCancellationRequestedRef.current) || (globalLoading && !isCancellationRequestedRef.current)} className="flex-grow basis-full sm:basis-auto bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center" aria-live="polite">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L24 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L17.25 12l2.846.813a4.5 4.5 0 0 0 3.09 3.09L24 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L18.25 12Z" /></svg>
                  Generate Alt Texts
                </button>
              ) : (
                <button onClick={handleStopGeneration} className="flex-grow basis-full sm:basis-auto bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center justify-center" aria-live="polite">
                  <LoadingSpinner className="w-5 h-5 mr-2" /> {processingProgressText} (Stop)
                </button>
              )}
              <button onClick={() => handleBatchRegenerate('allCompletedOrError')} disabled={!canRegenerateAll || !!apiKeyErrorState || (globalLoading && !isCancellationRequestedRef.current)} className="flex-grow basis-full sm:basis-auto bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Regenerate All (Completed/Error)
              </button>
              <button onClick={handleClear} disabled={globalLoading && !isCancellationRequestedRef.current} className="flex-grow basis-full sm:basis-auto bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-100 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                Clear All
              </button>
              <button onClick={handleCopyAllResults} disabled={(globalLoading && !isCancellationRequestedRef.current) || !hasCompletedJobs || !!apiKeyErrorState} className="flex-grow basis-full sm:basis-auto bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Copy all alt texts">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>
                Copy All Results
              </button>
              <button onClick={handleExportCsv} disabled={(globalLoading && !isCancellationRequestedRef.current) || !hasAnyJobs || !!apiKeyErrorState} className="flex-grow basis-full sm:basis-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Export to CSV">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export All to CSV
              </button>
            </div>
          </section>

          {hasAnyJobs ? (
            <section aria-labelledby="results-heading">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 id="results-heading" className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Image Jobs ({imageJobs.length})</h2>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                  <button onClick={handleSelectAllJobs} disabled={(globalLoading && !isCancellationRequestedRef.current) || imageJobs.length === 0} className="px-3 py-2 text-xs bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-md disabled:opacity-50">Select All</button>
                  <button onClick={handleDeselectAllJobs} disabled={(globalLoading && !isCancellationRequestedRef.current) || selectedJobIds.size === 0} className="px-3 py-2 text-xs bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-md disabled:opacity-50">Deselect All</button>
                </div>
              </div>

              {selectedJobIds.size > 0 && (
                <div className="my-4 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-wrap gap-2 items-center justify-center sm:justify-start">
                  <span className="text-sm text-slate-700 dark:text-slate-300 mr-2">{selectedJobIds.size} item(s) selected.</span>
                  <button onClick={() => handleBatchTextModify('prepend')} disabled={(globalLoading && !isCancellationRequestedRef.current)} className="px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white rounded-md disabled:opacity-50">Prepend Text...</button>
                  <button onClick={() => handleBatchTextModify('append')} disabled={(globalLoading && !isCancellationRequestedRef.current)} className="px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white rounded-md disabled:opacity-50">Append Text...</button>
                  <button onClick={() => handleBatchRegenerate('selected')} disabled={!canRegenerateSelected || (globalLoading && !isCancellationRequestedRef.current)} className="px-3 py-1.5 text-xs bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-md disabled:opacity-50 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    Regenerate Selected
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedImageJobs.map(job => (
                  <ImageAltCard
                    key={job.id}
                    job={job}
                    onAltTextChange={handleAltTextUpdate}
                    onRetry={handleRetryJob}
                    onRemovePreview={job.isFileInput && (job.status === 'preview-ready' || job.status === 'preview-queued' || job.status === 'preview-loading' || job.status === 'error-image-load' || job.status === 'cancelled' && !job.altText) ? handleRemovePreviewJob : undefined}
                    onToggleContextInput={handleToggleContextInput}
                    onContextChange={handleContextChange}
                    onToggleSelect={handleToggleSelectJob}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-slate-400 dark:text-slate-600 mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 text-lg">No images processed yet.</p>
              <p className="text-slate-400 dark:text-slate-500">Add URLs or upload images to get started.</p>
            </div>
          )}
        </main>

        <footer className="w-full max-w-4xl mt-12 pt-8 border-t border-slate-300 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Powered by Gemini API. &copy; {new Date().getFullYear()} Your Company Name.
          </p>
        </footer>
      </div>
    </>
  );
};

export default App;
