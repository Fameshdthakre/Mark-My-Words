
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerationTone } from '../types';

let API_KEY: string | undefined = undefined;

// Check if process and process.env are defined and are objects before trying to access API_KEY
// This is to prevent errors if 'process' or 'process.env' are unexpectedly non-objects (e.g. null)
try {
  if (
    typeof process === 'object' &&
    process !== null &&
    typeof process.env === 'object' &&
    process.env !== null
  ) {
    // Ensure that process.env.API_KEY is accessed safely if it might not exist
    // and also ensure it's treated as a string.
    const apiKeyFromEnv = process.env.API_KEY;
    if (typeof apiKeyFromEnv === 'string') {
      API_KEY = apiKeyFromEnv;
    }
  }
} catch (e) {
  // Defensive catch, though the checks above should prevent most errors.
  console.warn("Error accessing process.env.API_KEY:", e);
}


let ai: GoogleGenAI | null = null;
let apiKeyInitializationError: string | null = null;

// Robust API Key Check
if (typeof API_KEY === 'string' && API_KEY.trim() !== "") {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI. Likely an issue with the API key format or library setup.", e);
    apiKeyInitializationError = e instanceof Error ? e.message : "Failed to initialize GoogleGenAI.";
    ai = null;
  }
} else {
  // This block will be hit if API_KEY is undefined, null, empty string, or not a string after the safe access.
  if (!apiKeyInitializationError) { // Only set if not already set by a try-catch above for example
    apiKeyInitializationError = "API_KEY environment variable not found, is empty, or not a string. Ensure it's properly configured in your execution environment.";
    console.warn(apiKeyInitializationError);
  }
}

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17'; // Ensure this is up-to-date per guidelines

const getPromptForTone = (tone: GenerationTone, finalContext: string): string => {
  let contextInstruction = "No specific product context was provided; rely solely on visual analysis of the image.";
  if (finalContext) {
    contextInstruction = `The product is likely related to: "${finalContext}". Please use this as a strong hint to identify the product and its features visible in the image. Correlate this context with what you see.`;
  }

  const baseInstructions = `
**Product Context Hint:**
${contextInstruction}

**Be Descriptive and Specific:**
- Include exact product name (if identifiable from image or context), color, material, size indicators, and key distinguishing features.
- Avoid generic terms - be precise about what makes this product unique.
- Include relevant context like setting, presentation, or usage scenario.
- **Crucially, do NOT include model numbers, barcodes, SKUs, or similar internal identifiers in the alt text.**
- **Ignore any watermarks or overlay text that is not part of the product itself; describe the underlying product image.**

**Technical Requirements:**
- Alt text should be between 100 and 200 characters for optimal screen reader performance and descriptive detail.
- Use natural, flowing language that sounds good when read aloud.
- Never start with 'Image of', 'Picture of', or similar phrases.
- Check spelling carefully as errors hurt user experience and SEO.
- Do not end with full stop or period.
- Avoid using special characters (e.g., !, @, #, $, %, ^, &, *, (, ), _, +, =, {, }, [, ], |, \\, :, ;, ', <, >, ?, /) unless they are part of a product name or brand. Internal hyphens (e.g., 't-shirt') or apostrophes (e.g., 'men's') are acceptable.

**Accessibility First:**
- Ensure visually impaired users get equivalent information to sighted users.
- Describe what's essential for understanding the product and making purchase decisions.
- Focus on functional details that help users navigate and shop effectively.

**E-commerce Priority:**
- Lead with product name and key identifiers customers recognize (use product context if it helps identify these).
- Include purchase-relevant details: color, style, material, condition, size.
- Mention distinguishing features that differentiate from similar products.

**Example Transformation:**
- Instead of: 'blue shirt'
- Write: 'Navy blue cotton crew neck t-shirt with front pocket showing relaxed fit on model'

**Bad Alt Text Examples:**
- Teacher pointing to a student's computer screen
- Baseball player hitting a ball at a baseball field
- HubSpot office wall Singapore inbound marketing workplace murals orange walls ship it
- Watermark "Sample" over an image of a red dress (Focus should be on the dress, not the watermark)
- Red Sneakers Model XZ-5000 SKU 12345ABC (Model number and SKU should be excluded)


**Good Alt Text Examples:**
- Professor using education software to instruct a business school student
- David Ortiz of the Boston Red Sox batting from home plate at Fenway Park
- Orange mural that says 'ship it' on a wall at HubSpot's Singapore office
- Elegant crimson evening gown with a sweetheart neckline and flowing A-line skirt (if image had a watermark)
- Bright red canvas low-top sneakers with white laces and matching rubber sole (if image had a model number/SKU on it)
`;

  let toneSpecificInstructions = "";
  switch (tone) {
    case 'seo-focused':
      toneSpecificInstructions = `
**SEO Optimization Strategy (Emphasis for this request):**
- STRONGLY prioritize relevant keywords naturally. Focus intensely on terms customers actually search for.
- Actively include semantic keywords and longtail keyword components.
- Remember: optimized alt text can drive significant image traffic.
- Consider the webpage topic and customer search intent.
- Tailor descriptions to match what users are likely searching for.
- Include details that relate to the page's main content and purpose.
`;
      break;
    case 'brief':
      toneSpecificInstructions = `
**Brevity (Emphasis for this request):**
- Be very concise. Focus on the absolute most essential information.
- Aim for significantly shorter than 100 characters if possible, while still being descriptive enough to meet the lower boundary of the 100-200 character requirement.
- Prioritize the primary subject and its most critical attribute.
`; // Adjusted brief to still respect the 100 char minimum
      break;
    case 'default': // also 'descriptive'
    default:
      toneSpecificInstructions = `
**Context and Topic Alignment:**
- Consider the webpage topic and customer search intent.
- Tailor descriptions to match what users are likely searching for.
- Include details that relate to the page's main content and purpose.

**SEO Optimization Strategy:**
- Use relevant keywords naturally without keyword stuffing.
- Focus on terms customers actually search for when looking for this product.
- Include semantic keywords and longtail keyword components when appropriate.
- Remember: optimized alt text can drive significant image traffic and appear in both web and image search results.
`;
      break;
  }

  return `Generate specific, descriptive alt text for this product image optimized for e-commerce SEO and accessibility, considering the requested tone.
${baseInstructions}
${toneSpecificInstructions}
Generate alt text that balances all these elements for maximum accessibility, user experience, and search visibility, according to the tone.`;
};


export const generateAltTextForImage = async (
  base64ImageData: string,
  mimeType: string,
  extractedContext?: string,
  manualContext?: string,
  tone: GenerationTone = 'default'
): Promise<string> => {
  if (!ai) {
    throw new Error(`Gemini API client is not initialized. ${apiKeyInitializationError || "This could be due to a missing or invalid API_KEY environment variable."}`);
  }
  if (!base64ImageData || !mimeType) {
    throw new Error("Base64 image data or MIME type is missing.");
  }

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64ImageData,
    },
  };

  let finalContext = "";
  if (manualContext && manualContext.trim() !== "") {
    finalContext = manualContext.trim();
  } else if (extractedContext && extractedContext.trim() !== "") {
    finalContext = extractedContext.trim();
  }

  const promptText = getPromptForTone(tone, finalContext);

  const textPart = { text: promptText };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, textPart] }, // Corrected: 'parts' is directly under 'contents'
      config: {
        thinkingConfig: { thinkingBudget: 0 }
        // Consider if maxOutputTokens or temperature should be adjusted per tone
      }
    });

    const rawAltText = response.text;
    if (!rawAltText || rawAltText.trim() === "") {
      console.warn("Gemini API returned an empty or whitespace-only alt text.");
      throw new Error("Gemini API returned an empty alt text. The image might not be clear, suitable for description, or the context provided was not helpful.");
    }
    
    // Remove special characters, allowing alphanumeric, spaces, hyphens, and apostrophes.
    // Also removes underscores as per the prompt's example of special characters to avoid.
    let cleanedAltText = rawAltText.replace(/[^a-zA-Z0-9\s'-]/g, '');
    // Normalize multiple spaces (or hyphens/apostrophes if they were somehow doubled by the above) to single space and trim
    cleanedAltText = cleanedAltText.replace(/\s+/g, ' ').trim();
    // A more robust cleanup for consecutive hyphens/apostrophes might be needed if they become an issue,
    // but for now, focusing on general special character removal and space normalization.

    if (!cleanedAltText || cleanedAltText.trim() === "") {
      console.warn("Alt text became empty after cleaning special characters.");
      throw new Error("Generated alt text was stripped of all content after removing special characters. Original may have been only special characters or very short.");
    }

    return cleanedAltText;
  } catch (error) {
    console.error("Error generating alt text from Gemini API:", error);
    if (error instanceof Error) {
      // Check for specific API error messages if possible, e.g., content policy violations
      if (error.message.includes("Candidate was blocked due to SAFETY")) {
         throw new Error("Alt text generation failed due to content safety policies. The image may contain sensitive material.");
      }
      if (error.message.includes("400") && error.message.toLowerCase().includes("contents")) {
         throw new Error(`Gemini API request error: ${error.message}. Ensure the image data and prompt are correctly formatted.`);
      }
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating alt text with Gemini API.");
  }
};

export const isApiKeyConfigured = (): boolean => {
  return !!ai && !apiKeyInitializationError;
};

export const getApiKeyError = (): string | null => {
  return apiKeyInitializationError;
}
