
import React, { useState, useEffect, useRef } from 'react';
import { ImageAltProcessingState } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ImageAltCardProps {
  job: ImageAltProcessingState;
  onAltTextChange: (jobId: string, newAltText: string) => void;
  onRetry: (jobId: string) => void;
  onRemovePreview?: (jobId: string) => void;
  onToggleContextInput: (jobId: string) => void;
  onContextChange: (jobId: string, newContext: string) => void;
  onToggleSelect: (jobId: string) => void;
}

const ImageAltCard: React.FC<ImageAltCardProps> = ({
  job,
  onAltTextChange,
  onRetry,
  onRemovePreview,
  onToggleContextInput,
  onContextChange,
  onToggleSelect
}) => {
  const { id, url, base64, mimeType, altText, status, errorMessage, userModified, isFileInput, manualProductContext, showContextInput, extractedContext, selected } = job;
  const [copied, setCopied] = useState(false);
  const [editText, setEditText] = useState(altText || '');
  const [editContext, setEditContext] = useState(manualProductContext || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditText(altText || '');
  }, [altText]);

  useEffect(() => {
    setEditContext(manualProductContext || '');
  }, [manualProductContext]);

  useEffect(() => {
    if (showContextInput && contextInputRef.current) {
      contextInputRef.current.focus();
    }
  }, [showContextInput]);

  const handleCopyAltText = () => {
    if (editText) {
      navigator.clipboard.writeText(editText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy alt text: ', err);
          alert('Failed to copy alt text.');
        });
    }
  };

  const handleAltTextBlur = () => {
    if (altText !== editText) {
      onAltTextChange(id, editText);
    }
  };

  const handleContextBlur = () => {
    if (manualProductContext !== editContext) {
      onContextChange(id, editContext);
    }
  };

  const handleContextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleContextBlur();
      onToggleContextInput(id); // Optionally close on enter
    } else if (e.key === 'Escape') {
      setEditContext(manualProductContext || ''); // Revert on escape
      onToggleContextInput(id); // Close on escape
    }
  };

  const handleRetryClick = () => {
    onRetry(id);
  };
  
  const handleGenerateAgainClick = () => {
    onRetry(id); // Retry logic handles regeneration
  };

  const handleRemoveClick = () => {
    if (onRemovePreview) {
      onRemovePreview(id);
    }
  };

  const renderStatus = () => {
    let statusTextElement: React.ReactNode;
    // Added animate-pulse to baseLoadingClasses for active processing states
    const baseLoadingClasses = "flex items-center text-xs text-sky-600 dark:text-sky-400 animate-pulse";
    const defaultTextClasses = "text-xs text-slate-500 dark:text-slate-400";

    switch (status) {
      case 'preview-queued':
        statusTextElement = <p className={defaultTextClasses}>Queued for preview...</p>;
        break;
      case 'preview-loading':
        statusTextElement = <div className={baseLoadingClasses}><LoadingSpinner className="w-4 h-4 mr-2" /> Reading file for preview...</div>;
        break;
      case 'preview-ready':
        statusTextElement = <p className="text-xs text-blue-600 dark:text-blue-400">Ready to generate</p>;
        break;
      case 'pending':
        statusTextElement = <p className={defaultTextClasses}>Queued for AI...</p>;
        break;
      case 'loading-image':
        statusTextElement = <div className={baseLoadingClasses}><LoadingSpinner className="w-4 h-4 mr-2" /> Fetching image...</div>;
        break;
      case 'processing-alt-text':
        statusTextElement = <div className={baseLoadingClasses}><LoadingSpinner className="w-4 h-4 mr-2" /> Generating alt text...</div>;
        break;
      case 'completed':
        statusTextElement = <p className="text-xs text-green-600 dark:text-green-400">Completed {userModified && "(Edited)"}</p>;
        break;
      case 'cancelled':
        statusTextElement = <p className="text-xs text-yellow-600 dark:text-yellow-400 truncate" title={errorMessage || "Cancelled"}>Cancelled: {errorMessage || "User action."}</p>;
        break;
      case 'error-image-load':
      case 'error-alt-text':
        statusTextElement = <p className="text-xs text-red-600 dark:text-red-400 truncate" title={errorMessage || "Error occurred"}>Error: {errorMessage || "An unknown error occurred"}</p>;
        break;
      default:
        return <div className="min-h-[20px]"><p className={defaultTextClasses}>Unknown status</p></div>;
    }
    return <div className="min-h-[20px]">{statusTextElement}</div>;
  };

  const imageSrc = base64 && mimeType ? `data:${mimeType};base64,${base64}` : (isFileInput ? undefined : url);
  const showPreview = base64 || (status !== 'error-image-load' && status !== 'pending' && status !== 'cancelled' && status !== 'preview-loading' && status !== 'preview-queued');
  const isPreviewStage = status === 'preview-queued' || status === 'preview-loading' || status === 'preview-ready' || (status === 'error-image-load' && isFileInput && !altText);

  const currentContext = manualProductContext || extractedContext;
  const contextDisplayType = manualProductContext ? "(manual)" : (extractedContext ? "(auto)" : "");

  const cardBaseClasses = "bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl flex flex-col gap-3 transition-all duration-300 relative border border-transparent dark:border-slate-700";
  const cardSelectedClasses = selected ? "ring-2 ring-sky-500 dark:ring-sky-400 shadow-sky-500/40 dark:shadow-sky-400/30 border-sky-500 dark:border-sky-400" : "hover:shadow-md dark:hover:shadow-slate-600/50";


  return (
    <div className={`${cardBaseClasses} ${cardSelectedClasses}`}>
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect(id)}
          className="form-checkbox h-5 w-5 text-sky-600 bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 rounded focus:ring-sky-500 dark:focus:ring-sky-400 focus:ring-offset-white dark:focus:ring-offset-slate-800 cursor-pointer"
          aria-label={`Select job ${url}`}
        />
      </div>
      {isPreviewStage && onRemovePreview && (
        <button
          onClick={handleRemoveClick}
          className="absolute top-2 right-2 z-10 p-1 bg-slate-300/50 dark:bg-slate-600/50 hover:bg-red-500/70 dark:hover:bg-red-600/70 rounded-full text-red-500 dark:text-red-300 hover:text-white dark:hover:text-white transition-colors"
          aria-label="Remove image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="w-full h-48 rounded-md bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center mt-4">
        {status === 'preview-queued' || status === 'preview-loading' || status === 'loading-image' || (status === 'processing-alt-text' && !base64) ? (
          <div className="animate-pulse"><LoadingSpinner className="w-10 h-10" /></div>
        ) : showPreview && imageSrc ? (
          <img
            src={imageSrc}
            alt={status === 'completed' && editText ? editText : `Preview for ${url}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text/css%22%3E%23holder_158bd69307c%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C/style%3E%3C/defs%3E%3Cg%20id%3D%22holder_158bd69307c%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C/rect%3E%3Cg%3E%3Ctext%20x%3D%2274.4296875%22%20y%3D%22104.5%22%3EFailed%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E';
              (e.target as HTMLImageElement).alt = 'Image failed to load';
            }}
          />
        ) : status === 'error-image-load' || status === 'cancelled' ? (
          <div className={`text-center p-2 text-sm ${status === 'error-image-load' ? 'text-red-500 dark:text-red-400' : 'text-yellow-500 dark:text-yellow-400'}`}>
            <p>{status === 'error-image-load' ? 'Could not load image preview.' : 'Preview cancelled.'}</p>
            {status === 'cancelled' && errorMessage && <p className="text-xs">{errorMessage}</p>}
            {!isFileInput && url.startsWith('http') && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-500 dark:text-sky-400 hover:text-sky-300 dark:hover:text-sky-200 text-xs underline break-all">Original Source</a>}
            {isFileInput && <p className="text-xs text-slate-500 dark:text-slate-400 break-all">File: {url}</p>}
          </div>
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 p-2 text-sm">
            {isFileInput ? `File: ${url}` : 'Image preview will appear here.'}
          </div>
        )}
      </div>

      {renderStatus()}

      {(status === 'completed' || status === 'preview-ready' || status === 'pending' || status === 'error-alt-text') && (
        <div className="mt-1 space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={`context-${id}`} className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                Product Context {contextDisplayType}:
              </label>
              <button
                onClick={() => onToggleContextInput(id)}
                className="p-1 text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
                aria-label={showContextInput ? "Hide context input" : "Edit product context"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  {showContextInput ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  )}
                </svg>
              </button>
            </div>
            {showContextInput ? (
              <input
                id={`context-${id}`}
                ref={contextInputRef}
                type="text"
                value={editContext}
                onChange={(e) => setEditContext(e.target.value)}
                onBlur={handleContextBlur}
                onKeyDown={handleContextKeyDown}
                className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded text-sm text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400"
                placeholder="Enter manual product context..."
                aria-label="Manual product context input"
              />
            ) : (
              currentContext && <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded truncate" title={currentContext}>{currentContext}</p>
            )}
            {!showContextInput && !currentContext && <p className="text-xs text-slate-400 dark:text-slate-500 italic">No context provided or extracted.</p>}
          </div>
        </div>
      )}


      {status === 'completed' && (
        <div className="mt-1">
          <label htmlFor={`altText-${id}`} className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Generated Alt Text {userModified && "(Edited)"}:</label>
          <textarea
            id={`altText-${id}`}
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleAltTextBlur}
            rows={3}
            className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded text-sm text-slate-800 dark:text-slate-200 resize-none border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400"
            aria-label="Generated alt text, editable"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleCopyAltText}
              className="flex-1 bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-semibold py-2 px-3 rounded-md transition duration-150 ease-in-out flex items-center justify-center"
              aria-label={copied ? "Alt text copied" : "Copy alt text"}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 4.625-2.25-2.25m0 0L15.75 12m2.25 2.25L15.75 12M18 15l-2.25-2.25" />
                  </svg>
                  Copy Alt Text
                </>
              )}
            </button>
            <button
              onClick={handleGenerateAgainClick}
              className="flex-1 bg-teal-500 hover:bg-teal-600 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-xs font-semibold py-2 px-3 rounded-md transition duration-150 ease-in-out flex items-center justify-center"
              aria-label="Generate alt text again"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Generate Again
            </button>
          </div>
        </div>
      )}

      {(status === 'error-image-load' || status === 'error-alt-text') && (
        <button
          onClick={handleRetryClick}
          className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-yellow-900 text-xs font-semibold py-2 px-3 rounded-md transition duration-150 ease-in-out flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Retry
        </button>
      )}
      {(status !== 'completed' && status !== 'pending' && !isPreviewStage) && (
        <div className="mt-1">
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Original Source:</p>
          <a href={url.startsWith('http') ? url : undefined} target="_blank" rel="noopener noreferrer" className={`text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 text-xs underline break-all ${!url.startsWith('http') ? 'cursor-default no-underline text-slate-400 dark:text-slate-400' : ''}`}>
            {url}
          </a>
        </div>
      )}
      {(status === 'pending' || status === 'preview-loading' || status === 'preview-ready' || status === 'preview-queued') && !showContextInput && !currentContext && (
        <div className="mt-1">
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">{status === 'pending' ? 'Queued Source:' : 'File Source:'}</p>
          <span className="text-sky-600 dark:text-sky-400 text-xs break-all">{url}</span>
        </div>
      )}
    </div>
  );
};

export default ImageAltCard;
