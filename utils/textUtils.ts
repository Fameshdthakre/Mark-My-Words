
export function extractProductContext(source: string): string {
  let name = source;

  try {
    // Attempt to parse as URL to handle query params and hash, and get pathname
    const url = new URL(source);
    // Use the last segment of the pathname
    const pathnameParts = url.pathname.split('/').filter(part => part.length > 0);
    if (pathnameParts.length > 0) {
      name = pathnameParts[pathnameParts.length - 1];
    } else if (url.searchParams.toString() || url.hash) {
      // If path is '/' but there are query params or hash, it's likely not a filename context
      // but we've already stripped those parts by taking `name = source` initially if URL parse fails.
      // If source was a full URL and pathname was empty, use original source and let filename logic handle.
      // This case is tricky; for now, if no path parts, we return empty or let filename logic proceed.
      return ""; // No useful context from an empty path.
    }
    // If it's a valid URL but no path parts (e.g. "https://example.com"), then there's no filename context
  } catch (e) {
    // Not a valid URL, assume 'name' (which is 'source') is a filename
  }

  // Remove common image and web extensions
  // Order matters if extensions can be substrings of others (e.g. .tar.gz) - not an issue here
  const extensions = [
    '.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.avif', '.heic', '.heif', // Image extensions first
    '.html', '.htm', '.php', '.aspx', '.jsp', '.asp' // Common web extensions
  ];

  const lowerName = name.toLowerCase();
  for (const ext of extensions) {
    if (lowerName.endsWith(ext)) {
      name = name.substring(0, name.length - ext.length);
      break;
    }
  }

  // Replace common separators (hyphens, underscores) with spaces
  name = name.replace(/[-_]+/g, ' ');

  // Remove characters that are not alphanumeric or spaces to clean up
  // This also helps remove potential remnants of query parameters if URL parsing was incomplete
  name = name.replace(/[^a-zA-Z0-9\s]/g, '');

  // Normalize multiple spaces to single space and trim
  name = name.replace(/\s+/g, ' ').trim();

  // Convert to lowercase for consistent input to AI
  name = name.toLowerCase();

  // Filter out very short or generic names
  if (name.length < 3 || ["image", "img", "photo", "picture", "product", "icon", "logo", "file"].includes(name)) {
    return "";
  }

  return name;
}
