import { chromium } from 'playwright';
import { jsPDF } from 'jspdf';

type GeneratePdfFromUrlInput = {
  cookies?: Array<{ name: string; value: string }>;
  selector?: string;
  url: string;
};

export async function generatePdfFromUrl(input: GeneratePdfFromUrlInput) {
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const pageUrl = new URL(input.url);
    const context = await browser.newContext({
      colorScheme: 'light',
      deviceScaleFactor: 1,
      locale: pageUrl.pathname.includes('/ar/') ? 'ar-JO' : 'en-US',
      viewport: {
        width: 1440,
        height: 2200
      }
    });

    if (input.cookies?.length) {
      await context.addCookies(
        input.cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          url: pageUrl.origin
        }))
      );
    }

    const page = await context.newPage();
    await page.emulateMedia({ media: 'screen' });
    await page.goto(input.url, {
      waitUntil: 'networkidle'
    });
    await page.addStyleTag({
      content: `
        html, body {
          background: #ffffff !important;
        }

        .print-hidden {
          display: none !important;
        }
      `
    });
    const rootLocator = page.locator(input.selector ?? '.invoice-document');
    await rootLocator.waitFor({
      state: 'visible'
    });
    await page.evaluate(async () => {
      if ('fonts' in document) {
        await document.fonts.ready;
      }
    });

    const screenshot = await rootLocator.screenshot({
      animations: 'disabled',
      type: 'png'
    });
    const imageData = `data:image/png;base64,${screenshot.toString('base64')}`;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const imageProperties = pdf.getImageProperties(imageData);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (imageProperties.height * pageWidth) / imageProperties.width;
    let remainingHeight = imageHeight;
    let offsetY = 0;

    pdf.addImage(imageData, 'PNG', 0, offsetY, pageWidth, imageHeight, undefined, 'FAST');
    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      offsetY = remainingHeight - imageHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, offsetY, pageWidth, imageHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
    }

    await context.close();

    return Buffer.from(pdf.output('arraybuffer'));
  } finally {
    await browser.close();
  }
}
