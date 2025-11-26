import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { ReportData } from "../types";

// Helper to sanitize text
const cleanText = (text: string) => text.replace(/\*/g, "").trim();

export const downloadWordDocument = async (report: ReportData) => {
  const lines = report.rawMarkdown.split("\n");
  const docChildren: any[] = [];

  // Title
  docChildren.push(
    new Paragraph({
      text: `Due Diligence Report: ${report.companyName}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            italics: true,
            color: "666666"
        })
      ],
      spacing: { after: 400 },
    })
  );

  // Parse Markdown-ish content line by line
  // This is a basic parser. For a production app, use a dedicated AST parser.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith("### ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace("### ", "")),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
            })
        );
    } else if (line.startsWith("## ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace("## ", "")),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 },
                border: {
                    bottom: { color: "auto", space: 1, value: BorderStyle.SINGLE, size: 6 }
                }
            })
        );
    } else if (line.startsWith("# ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace("# ", "")),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
        docChildren.push(
            new Paragraph({
                text: cleanText(line.replace(/^[-*]\s+/, "")),
                bullet: { level: 0 },
            })
        );
    } else if (line.startsWith("|")) {
        // Simple table detection - Just render as text for safety in this simple parser
        // or attempt to parse if feeling adventurous. 
        // For robustness in this demo, we render table rows as monospaced text
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        font: "Courier New",
                        size: 20
                    })
                ]
            })
        )
    } else {
        // Regular paragraph
        // Handle bolding **text**
        const parts = line.split("**");
        const children = parts.map((part, index) => {
            return new TextRun({
                text: part,
                bold: index % 2 === 1, // Every odd index was inside ** **
            });
        });

        docChildren.push(
            new Paragraph({
                children: children,
                spacing: { after: 120 },
            })
        );
    }
  }

  // Add Sources Section
  if (report.sources.length > 0) {
    docChildren.push(
        new Paragraph({
            text: "Sources & References",
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
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.companyName.replace(/\s+/g, "_")}_DeepDive_Report.docx`);
};