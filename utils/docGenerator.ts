import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Header, Footer } from "docx";
import { saveAs } from "file-saver";
import { ReportData } from "../types";

// Helper to sanitize text
const cleanText = (text: string) => text.replace(/\*/g, "").trim();

export const downloadWordDocument = async (report: ReportData) => {
  const lines = report.rawMarkdown.split("\n");
  const docChildren: any[] = [];

  // Parse Markdown-ish content line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith("### ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace("### ", "")),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 240, after: 120 },
            })
        );
    } else if (line.startsWith("## ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace("## ", "")).toUpperCase(),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
                border: {
                    // Fix: Changed 'value' to 'style' as per docx IBorderOptions interface
                    bottom: { color: "333333", space: 4, style: BorderStyle.SINGLE, size: 12 }
                }
            })
        );
    } else if (line.startsWith("# ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace("# ", "")),
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 },
            })
        );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace(/^[-*]\s+/, "")),
                bullet: { level: 0 },
                spacing: { after: 100 },
            })
        );
    } else if (line.startsWith("|")) {
        // Render as Monospace text block to preserve table look in Word without complex parsing
        // (Complex table parsing from markdown to docx is error prone without a heavy library)
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        font: "Courier New",
                        size: 18 // 9pt
                    })
                ],
                spacing: { after: 0, before: 0 }
            })
        )
    } else {
        // Regular paragraph
        const parts = line.split("**");
        const children = parts.map((part, index) => {
            return new TextRun({
                text: part,
                bold: index % 2 === 1, // Every odd index was inside ** **
                font: "Calibri",
                size: 22 // 11pt
            });
        });

        docChildren.push(
            new Paragraph({
                children: children,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 160 },
            })
        );
    }
  }

  // Add Sources Section
  if (report.sources.length > 0) {
    docChildren.push(
        new Paragraph({
            text: "Primary Sources",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        })
    );
    report.sources.forEach(source => {
        docChildren.push(
            new Paragraph({
                text: source,
                bullet: { level: 0 },
                style: "Hyperlink", 
            })
        );
    });
  }

  const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                run: { font: "Calibri" }
            }
        ]
    },
    sections: [
      {
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: "CONFIDENTIAL INFORMATION MEMORANDUM", bold: true, size: 16, color: "666666" })
                        ],
                        alignment: AlignmentType.RIGHT
                    })
                ]
            })
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Strictly Private & Confidential - ${report.companyName}`, size: 16, color: "999999" })
                        ],
                        alignment: AlignmentType.CENTER
                    })
                ]
            })
        },
        properties: {},
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.companyName.replace(/\s+/g, "_")}_IM_Report.docx`);
};