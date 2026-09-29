import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const ELEMENT_WIDTH_PX = 794;
const ELEMENT_HEIGHT_PX = 1123;

const SCALE = 2;

export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  if (!element) {
    throw new Error("PDF render element not found");
  }

  const originalStyles = {
    position: element.style.position,
    top: element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height,
    minHeight: element.style.minHeight,
    transform: element.style.transform,
    zIndex: element.style.zIndex,
    background: element.style.background,
    visibility: element.style.visibility,
    overflow: element.style.overflow,
  };

  try {
    /*
     * IMPORTANT
     * Render the invoice as a real A4 canvas.
     *
     * 794 x 1123 px is the logical A4 size used
     * by InvoicePreview.
     */
    element.style.position = "fixed";
    element.style.top = "0px";
    element.style.left = "0px";

    element.style.width = `${ELEMENT_WIDTH_PX}px`;

    /*
     * Do NOT use height:auto here.
     * This was causing the PDF layout to shrink/collapse.
     */
    element.style.height = `${ELEMENT_HEIGHT_PX}px`;
    element.style.minHeight = `${ELEMENT_HEIGHT_PX}px`;

    element.style.transform = "none";
    element.style.zIndex = "99999";
    element.style.background = "#ffffff";
    element.style.visibility = "visible";

    /*
     * Don't hide overflowing content.
     * If the invoice becomes longer than A4,
     * we will handle it as multiple pages.
     */
    element.style.overflow = "visible";

    await waitForRender();
    await waitForImages(element);

    /*
     * Calculate actual element dimensions.
     */
    const rect = element.getBoundingClientRect();

    const renderWidth = Math.max(ELEMENT_WIDTH_PX, Math.ceil(rect.width));

    const renderHeight = Math.max(
      ELEMENT_HEIGHT_PX,
      Math.ceil(element.scrollHeight),
    );

    console.log("PDF render dimensions:", {
      width: renderWidth,
      height: renderHeight,
      scrollHeight: element.scrollHeight,
    });

    /*
     * Render invoice.
     */
    const canvas = await html2canvas(element, {
      scale: SCALE,

      useCORS: true,
      allowTaint: false,

      backgroundColor: "#ffffff",

      logging: false,

      width: renderWidth,
      height: renderHeight,

      windowWidth: renderWidth,
      windowHeight: renderHeight,

      scrollX: 0,
      scrollY: 0,

      imageTimeout: 15000,

      removeContainer: true,

      /*
       * Better text rendering.
       */
      foreignObjectRendering: false,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("Generated canvas has invalid dimensions");
    }

    /*
     * JPEG avoids the jsPDF "wrong PNG signature" issue.
     */
    const fullImage = canvas.toDataURL("image/jpeg", 0.95);

    if (!fullImage.startsWith("data:image/jpeg")) {
      throw new Error("Failed to generate JPEG image");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    /*
     * Logical pixels -> PDF millimeters.
     */
    const mmPerPixel = A4_WIDTH_MM / ELEMENT_WIDTH_PX;

    /*
     * One A4 page in canvas pixels.
     */
    const pageHeightLogicalPx = A4_HEIGHT_MM / mmPerPixel;

    const pageHeightCanvasPx = Math.floor(pageHeightLogicalPx * SCALE);

    /*
     * --------------------------------------------------
     * SINGLE PAGE
     * --------------------------------------------------
     */
    if (canvas.height <= pageHeightCanvasPx + 5) {
      /*
       * IMPORTANT:
       *
       * Force the complete invoice to exactly
       * A4 dimensions.
       *
       * This removes the large blank area problem
       * caused by the previous cropping logic.
       */
      pdf.addImage(
        fullImage,
        "JPEG",
        0,
        0,
        A4_WIDTH_MM,
        A4_HEIGHT_MM,
        undefined,
        "FAST",
      );

      pdf.save(filename);

      return;
    }

    /*
     * --------------------------------------------------
     * MULTI PAGE
     * --------------------------------------------------
     */

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const remainingHeight = canvas.height - sourceY;

      /*
       * Ignore tiny trailing rendering artifacts.
       */
      if (remainingHeight <= 10) {
        break;
      }

      const sliceHeight = Math.min(pageHeightCanvasPx, remainingHeight);

      const pageCanvas = document.createElement("canvas");

      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const context = pageCanvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create page canvas context");
      }

      /*
       * White page background.
       */
      context.fillStyle = "#ffffff";

      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      /*
       * Copy the current A4 section.
       */
      context.drawImage(
        canvas,

        0,
        sourceY,

        canvas.width,
        sliceHeight,

        0,
        0,

        pageCanvas.width,
        sliceHeight,
      );

      /*
       * Convert page to JPEG.
       */
      const pageImage = pageCanvas.toDataURL("image/jpeg", 0.95);

      if (!pageImage.startsWith("data:image/jpeg")) {
        throw new Error(`Failed to generate JPEG for page ${pageIndex + 1}`);
      }

      if (pageIndex > 0) {
        pdf.addPage();
      }

      /*
       * If this is a full page,
       * render exactly A4.
       *
       * For the final shorter page,
       * preserve its actual height.
       */
      const pageHeightMm =
        sliceHeight === pageHeightCanvasPx
          ? A4_HEIGHT_MM
          : (sliceHeight / SCALE) * mmPerPixel;

      pdf.addImage(
        pageImage,
        "JPEG",
        0,
        0,
        A4_WIDTH_MM,
        pageHeightMm,
        undefined,
        "FAST",
      );

      /*
       * Release memory.
       */
      pageCanvas.width = 1;
      pageCanvas.height = 1;

      sourceY += sliceHeight;
      pageIndex++;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("PDF generation error:", error);

    throw error;
  } finally {
    /*
     * Restore original styles.
     */
    Object.assign(element.style, originalStyles);
  }
}

/**
 * Wait until browser layout/rendering is complete.
 */
function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 150);
      });
    });
  });
}

/**
 * Wait for invoice images.
 */
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));

  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map((image) => {
      /*
       * Already loaded.
       */
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        let completed = false;

        const done = () => {
          if (completed) return;

          completed = true;

          image.removeEventListener("load", done);

          image.removeEventListener("error", done);

          resolve();
        };

        image.addEventListener("load", done);

        image.addEventListener("error", done);

        setTimeout(done, 15000);
      });
    }),
  );
}
