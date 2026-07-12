import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export interface ReportSection {
  title: string;
  summary?: { label: string; value: string | number }[];
  table?: { headers: string[]; rows: (string | number)[][] };
}

export interface ReportDocument {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
}

export function renderPdf(doc: ReportDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    pdf.on('data', (chunk) => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    pdf.fontSize(18).text(doc.title, { align: 'left' });
    if (doc.subtitle) {
      pdf.moveDown(0.25).fontSize(11).fillColor('gray').text(doc.subtitle);
      pdf.fillColor('black');
    }
    pdf.moveDown();

    for (const section of doc.sections) {
      pdf.fontSize(14).text(section.title);
      pdf.moveDown(0.25);

      if (section.summary) {
        pdf.fontSize(10);
        for (const { label, value } of section.summary) {
          pdf.text(`${label}: ${value}`);
        }
        pdf.moveDown(0.5);
      }

      if (section.table) {
        pdf.fontSize(10).text(section.table.headers.join('  |  '), { underline: true });
        for (const row of section.table.rows) {
          pdf.text(row.join('  |  '));
        }
        pdf.moveDown(0.5);
      }

      pdf.moveDown();
    }

    pdf.end();
  });
}

export async function renderExcel(doc: ReportDocument): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EcoSphere ESG Platform';
  workbook.created = new Date();

  for (const section of doc.sections) {
    const sheet = workbook.addWorksheet(section.title.slice(0, 31) || 'Report');
    sheet.addRow([doc.title]);
    if (doc.subtitle) sheet.addRow([doc.subtitle]);
    sheet.addRow([]);

    if (section.summary) {
      for (const { label, value } of section.summary) {
        sheet.addRow([label, value]);
      }
      sheet.addRow([]);
    }

    if (section.table) {
      const headerRow = sheet.addRow(section.table.headers);
      headerRow.font = { bold: true };
      for (const row of section.table.rows) {
        sheet.addRow(row);
      }
      sheet.columns.forEach((col) => {
        col.width = 20;
      });
    }
  }

  if (doc.sections.length === 0) {
    workbook.addWorksheet('Report').addRow([doc.title]);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
