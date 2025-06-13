import { ImageAltProcessingState } from '../types';

function escapeCsvField(field: string | undefined | null): string {
  if (field === undefined || field === null) {
    return '';
  }
  let strField = String(field);
  // If the field contains a comma, newline, or double quote, enclose it in double quotes.
  // Also, any double quote within the field must be escaped by another double quote.
  if (strField.includes(',') || strField.includes('\n') || strField.includes('"')) {
    strField = `"${strField.replace(/"/g, '""')}"`;
  }
  return strField;
}

export function exportImageAltsToCsv(imageJobs: ImageAltProcessingState[]): string {
  if (imageJobs.length === 0) {
    return '';
  }

  const headers = ['Image Source', 'Generated Alt Text'];

  const rows = imageJobs.map(job => {
    let altTextOutput = '';
    switch (job.status) {
      case 'completed':
        altTextOutput = job.altText || '';
        break;
      case 'error-image-load':
        altTextOutput = `Error (Image Load): ${job.errorMessage || 'Failed to load image.'}`;
        break;
      case 'error-alt-text':
        altTextOutput = `Error (Alt Text Gen): ${job.errorMessage || 'Failed to generate alt text.'}`;
        break;
      case 'cancelled':
        altTextOutput = `Cancelled: ${job.errorMessage || 'Operation cancelled.'}`;
        break;
      case 'pending':
        altTextOutput = 'Pending processing.';
        break;
      case 'loading-image':
        altTextOutput = 'Currently loading image.';
        break;
      case 'processing-alt-text':
        altTextOutput = 'Currently generating alt text.';
        break;
      default:
        altTextOutput = 'Unknown status.';
    }
    return [
      escapeCsvField(job.url), // job.url contains the original URL or filename
      escapeCsvField(altTextOutput),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}