import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element and exports it as a multi-page PDF.
 * @param {HTMLElement} element - the dashboard container to capture
 * @param {string} fileName - output file name, e.g. "dashboard-report.pdf"
 */
export async function exportElementAsPdf(
  element,
  fileName = "dashboard-report.pdf",
) {
  const canvas = await html2canvas(element, {
    scale: 2, // sharper output
    backgroundColor: "#f8fafc",
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Additional pages if content is taller than one page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}
