/* Saving a dashboard as a file: a PNG of the canvas, or that image laid out
   on A4 pages as a PDF. Both libraries are loaded only when an export is
   asked for, so they cost nothing on a dashboard that is just being viewed. */

/** What is left out of the picture: the canvas's own toolbar and controls. */
const keep = (node: Node) => !(node instanceof HTMLElement && node.hasAttribute("data-print-hide"));

const fileName = (name: string, ext: string) => {
  const safe = name.trim().replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").slice(0, 80) || "dashboard";
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${safe} ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
};

async function snapshot(el: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  // The canvas is transparent over the page; the picture needs the page's colour behind it.
  const backgroundColor = getComputedStyle(document.body).backgroundColor || "#ffffff";
  return toPng(el, { pixelRatio: 2, backgroundColor, filter: keep, cacheBust: true });
}

const download = (href: string, name: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export async function exportDashboardImage(el: HTMLElement, name: string): Promise<void> {
  download(await snapshot(el), fileName(name, "png"));
}

export async function exportDashboardPdf(el: HTMLElement, name: string): Promise<void> {
  const dataUrl = await snapshot(el);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The dashboard picture could not be read"));
    img.src = dataUrl;
  });

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const margin = 24;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const width = pageWidth - margin * 2;
  const height = (image.height * width) / image.width;
  const perPage = pageHeight - margin * 2;

  // A dashboard taller than a page continues on the next: the same picture is
  // placed higher on each page, so every page shows the next slice of it.
  for (let offset = 0, page = 0; offset < height; offset += perPage, page++) {
    if (page > 0) pdf.addPage();
    pdf.addImage(dataUrl, "PNG", margin, margin - offset, width, height, undefined, "FAST");
    // White bands over what spills into the margins, so slices do not overlap on paper.
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, margin, "F");
    pdf.rect(0, pageHeight - margin, pageWidth, margin, "F");
  }
  pdf.save(fileName(name, "pdf"));
}
