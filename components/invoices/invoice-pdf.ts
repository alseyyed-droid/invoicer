import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const UNSUPPORTED_COLOR_FUNCTION_NAMES = ['color-mix', 'color', 'oklch', 'oklab', 'lch', 'lab'] as const;

function serializeError(error: unknown) {
  if (error instanceof DOMException) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    value: error
  };
}

function createColorNormalizer(doc: Document) {
  const canvas = doc.createElement('canvas');
  const context = canvas.getContext('2d');
  const view = doc.defaultView;
  const tempElement =
    doc.body || doc.documentElement
      ? doc.createElement('span')
      : null;

  if (tempElement) {
    tempElement.setAttribute('aria-hidden', 'true');
    tempElement.style.position = 'fixed';
    tempElement.style.inset = '0';
    tempElement.style.width = '1px';
    tempElement.style.height = '1px';
    tempElement.style.opacity = '0';
    tempElement.style.pointerEvents = 'none';
    tempElement.style.visibility = 'hidden';
    (doc.body || doc.documentElement)?.append(tempElement);
  }

  const normalizeWithCanvas = (value: string) => {
    if (!context) {
      return null;
    }

    try {
      context.clearRect(0, 0, 1, 1);
      context.globalCompositeOperation = 'copy';
      context.fillStyle = 'rgba(0, 0, 0, 0)';
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);

      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
      const opacity = Number((alpha / 255).toFixed(3));

      if (opacity <= 0) {
        return 'rgba(0, 0, 0, 0)';
      }

      if (opacity >= 1) {
        return `rgb(${red}, ${green}, ${blue})`;
      }

      return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    } catch {
      return null;
    }
  };

  const normalizeWithComputedStyle = (value: string) => {
    if (!tempElement || !view) {
      return null;
    }

    try {
      tempElement.style.color = '';
      tempElement.style.color = value;

      const computedColor = view.getComputedStyle(tempElement).color;

      if (!computedColor || computedColor === value) {
        return null;
      }

      return computedColor;
    } catch {
      return null;
    }
  };

  return (value: string) => {
    if (!value) {
      return value;
    }

    const normalizedWithCanvas = normalizeWithCanvas(value);

    if (normalizedWithCanvas) {
      return normalizedWithCanvas;
    }

    const normalizedWithComputedStyle = normalizeWithComputedStyle(value);

    if (normalizedWithComputedStyle) {
      return normalizeUnsupportedColorValue(normalizedWithComputedStyle);
    }

    return normalizeUnsupportedColorValue(value);
  };
}

function sanitizeStyleValue(value: string, normalizeColor: (value: string) => string) {
  if (!value) {
    return value;
  }

  return replaceUnsupportedColorFunctions(value, normalizeColor);
}

function sanitizeCloneForHtml2Canvas(doc: Document, root: HTMLElement) {
  const view = doc.defaultView;

  if (!view) {
    return;
  }

  const normalizeColor = createColorNormalizer(doc);
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  for (const element of elements) {
    const computedStyle = view.getComputedStyle(element);

    for (let index = 0; index < computedStyle.length; index += 1) {
      const propertyName = computedStyle[index];

      if (!propertyName || propertyName.startsWith('--')) {
        continue;
      }

      const propertyValue = computedStyle.getPropertyValue(propertyName);

      if (!propertyValue || !hasUnsupportedColorFunction(propertyValue)) {
        continue;
      }

      const sanitizedValue = sanitizeStyleValue(propertyValue, normalizeColor);

      if (sanitizedValue !== propertyValue) {
        element.style.setProperty(propertyName, sanitizedValue, computedStyle.getPropertyPriority(propertyName));
      }
    }
  }
}

function hasUnsupportedColorFunction(value: string) {
  const normalizedValue = value.toLowerCase();

  return UNSUPPORTED_COLOR_FUNCTION_NAMES.some((functionName) => normalizedValue.includes(`${functionName}(`));
}

function isIdentifierCharacter(value: string) {
  return /[a-z0-9-]/i.test(value);
}

function findClosingParenthesis(value: string, openIndex: number) {
  let depth = 0;

  for (let index = openIndex; index < value.length; index += 1) {
    const character = value[index];

    if (character === '(') {
      depth += 1;
      continue;
    }

    if (character === ')') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function replaceUnsupportedColorFunctions(value: string, replacer: (token: string) => string) {
  let result = '';
  let index = 0;

  while (index < value.length) {
    const matchedFunctionName = UNSUPPORTED_COLOR_FUNCTION_NAMES.find((functionName) => {
      const candidate = value.slice(index, index + functionName.length);
      const nextCharacter = value[index + functionName.length];
      const previousCharacter = index > 0 ? value[index - 1] : '';

      return (
        candidate.toLowerCase() === functionName &&
        nextCharacter === '(' &&
        (!previousCharacter || !isIdentifierCharacter(previousCharacter))
      );
    });

    if (!matchedFunctionName) {
      result += value[index];
      index += 1;
      continue;
    }

    const openIndex = index + matchedFunctionName.length;
    const closeIndex = findClosingParenthesis(value, openIndex);

    if (closeIndex === -1) {
      result += value.slice(index);
      break;
    }

    const token = value.slice(index, closeIndex + 1);
    result += replacer(token);
    index = closeIndex + 1;
  }

  return result;
}

function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let depth = 0;
  let buffer = '';

  for (const character of value) {
    if (character === '(') {
      depth += 1;
      buffer += character;
      continue;
    }

    if (character === ')') {
      depth -= 1;
      buffer += character;
      continue;
    }

    if (depth === 0 && character === separator) {
      parts.push(buffer.trim());
      buffer = '';
      continue;
    }

    buffer += character;
  }

  parts.push(buffer.trim());

  return parts;
}

function tokenizeTopLevel(value: string) {
  const tokens: string[] = [];
  let depth = 0;
  let buffer = '';

  for (const character of value.trim()) {
    if (character === '(') {
      depth += 1;
      buffer += character;
      continue;
    }

    if (character === ')') {
      depth -= 1;
      buffer += character;
      continue;
    }

    if (depth === 0 && /\s/.test(character)) {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      continue;
    }

    buffer += character;
  }

  if (buffer) {
    tokens.push(buffer);
  }

  return tokens;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseRgbChannel(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === 'none') {
    return 0;
  }

  if (normalizedValue.endsWith('%')) {
    const numericValue = Number.parseFloat(normalizedValue.slice(0, -1));

    if (Number.isNaN(numericValue)) {
      return null;
    }

    return Math.round(clamp((numericValue / 100) * 255, 0, 255));
  }

  const numericValue = Number.parseFloat(normalizedValue);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  if (numericValue <= 1) {
    return Math.round(clamp(numericValue * 255, 0, 255));
  }

  return Math.round(clamp(numericValue, 0, 255));
}

function parseAlphaChannel(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === 'none') {
    return 1;
  }

  if (normalizedValue.endsWith('%')) {
    const numericValue = Number.parseFloat(normalizedValue.slice(0, -1));

    if (Number.isNaN(numericValue)) {
      return null;
    }

    return clamp(numericValue / 100, 0, 1);
  }

  const numericValue = Number.parseFloat(normalizedValue);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return clamp(numericValue, 0, 1);
}

function normalizeUnsupportedColorValue(value: string) {
  const match = value.trim().match(/^color\(\s*([a-z0-9-]+)\s+(.+)\)$/i);

  if (!match) {
    return value;
  }

  const [, , colorBody] = match;
  const [channelSection, alphaSection] = splitTopLevel(colorBody, '/');
  const channels = tokenizeTopLevel(channelSection);

  if (channels.length < 3) {
    return value;
  }

  const red = parseRgbChannel(channels[0]);
  const green = parseRgbChannel(channels[1]);
  const blue = parseRgbChannel(channels[2]);
  const alpha = alphaSection ? parseAlphaChannel(alphaSection) : 1;

  if (red === null || green === null || blue === null || alpha === null) {
    return value;
  }

  if (alpha >= 1) {
    return `rgb(${red}, ${green}, ${blue})`;
  }

  return `rgba(${red}, ${green}, ${blue}, ${Number(alpha.toFixed(3))})`;
}

export async function generateInvoicePdfBlob(element: HTMLElement) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[InvoiceShare] pdf:start width=${element.scrollWidth} height=${element.scrollHeight} images=${element.querySelectorAll('img').length}`
      );
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: process.env.NODE_ENV !== 'production',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (doc, clonedElement) => {
        sanitizeCloneForHtml2Canvas(doc, clonedElement as HTMLElement);
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[InvoiceShare] pdf:canvas_ready width=${canvas.width} height=${canvas.height}`);
    }

    let imageData: string;

    try {
      imageData = canvas.toDataURL('image/png');
    } catch (error) {
      console.error(`[InvoiceShare] pdf:toDataURL_failed ${JSON.stringify(serializeError(error))}`);
      throw error;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[InvoiceShare] pdf:image_ready bytes=${imageData.length}`);
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    let remainingHeight = imageHeight;
    let offsetY = 0;

    try {
      pdf.addImage(imageData, 'PNG', 0, offsetY, pageWidth, imageHeight, undefined, 'FAST');
    } catch (error) {
      console.error(`[InvoiceShare] pdf:addImage_failed ${JSON.stringify(serializeError(error))}`);
      throw error;
    }

    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      offsetY = remainingHeight - imageHeight;
      pdf.addPage();
      try {
        pdf.addImage(imageData, 'PNG', 0, offsetY, pageWidth, imageHeight, undefined, 'FAST');
      } catch (error) {
        console.error(`[InvoiceShare] pdf:addImage_page_failed ${JSON.stringify(serializeError(error))}`);
        throw error;
      }
      remainingHeight -= pageHeight;
    }

    try {
      const blob = pdf.output('blob');

      if (process.env.NODE_ENV !== 'production') {
        console.info(`[InvoiceShare] pdf:output_ready size=${blob.size} type=${blob.type}`);
      }

      return blob;
    } catch (error) {
      console.error(`[InvoiceShare] pdf:output_failed ${JSON.stringify(serializeError(error))}`);
      throw error;
    }
  } catch (error) {
    console.error(
      `[InvoiceShare] pdf:generation_failed width=${element.scrollWidth} height=${element.scrollHeight} images=${element.querySelectorAll('img').length} error=${JSON.stringify(serializeError(error))}`
    );
    throw error;
  }
}

export function getInvoicePdfFilename(invoiceNumber: string) {
  return `${invoiceNumber || 'invoice'}.pdf`;
}
