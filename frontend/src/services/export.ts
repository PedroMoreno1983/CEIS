import {
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Packer, BorderStyle, ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import type { Instrumento } from "../types";
import { NIVEL_LABELS, TIPO_LABELS } from "../types";

export async function descargarWord(instrumento: Instrumento, conRespuestas = false) {
  const sections: Paragraph[] = [];

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "CEIS MARISTAS", bold: true, size: 24, color: "1e40af" })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: "Batería de Orientación Vocacional",
        italics: true, size: 20, color: "475569",
      })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: instrumento.nombre, bold: true, size: 32, color: "0f172a" })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: TIPO_LABELS[instrumento.tipo],
        size: 22, color: "1e40af",
      })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: `Nivel: ${NIVEL_LABELS[instrumento.nivel]}   ·   Ítems: ${instrumento.items.length}   ·   Tiempo: ${instrumento.tiempo_minutos || "—"} min`,
        size: 20, color: "475569",
      })],
      spacing: { after: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "1e40af" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "1e40af" },
      },
    }),
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Nombre: ", bold: true }),
        new TextRun({ text: "_".repeat(50) }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Curso: ", bold: true }),
        new TextRun({ text: "_".repeat(20) }),
        new TextRun({ text: "    Fecha: ", bold: true }),
        new TextRun({ text: "_".repeat(20) }),
      ],
      spacing: { after: 300 },
    }),
  );

  if (instrumento.instrucciones) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "INSTRUCCIONES", bold: true, size: 22, color: "1e40af" })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: instrumento.instrucciones, size: 22 })],
        spacing: { after: 400 },
        shading: { type: ShadingType.SOLID, color: "f1f5f9", fill: "f1f5f9" },
      }),
    );
  }

  instrumento.items.forEach((item, idx) => {
    if (item.texto_base) {
      sections.push(
        new Paragraph({
          children: [new TextRun({
            text: item.texto_base, size: 22, italics: true, color: "334155",
          })],
          spacing: { before: 200, after: 200 },
          shading: { type: ShadingType.SOLID, color: "f8fafc", fill: "f8fafc" },
        }),
      );
    }
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true, size: 24, color: "1e40af" }),
          new TextRun({ text: item.enunciado, size: 24 }),
        ],
        spacing: { before: 200, after: 100 },
      }),
    );
    if (item.opciones) {
      item.opciones.forEach((op) => {
        const isCorrect = conRespuestas && item.respuesta_correcta === op.clave;
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${op.clave})  `, bold: true, size: 22 }),
              new TextRun({
                text: op.texto + (isCorrect ? "  ✓" : ""),
                size: 22,
                bold: isCorrect,
                color: isCorrect ? "059669" : "1e293b",
              }),
            ],
            indent: { left: 600 },
            spacing: { after: 80 },
          }),
        );
      });
    }
  });

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: `CEIS Maristas · ${new Date().getFullYear()}`,
        size: 16, color: "94a3b8", italics: true,
      })],
      spacing: { before: 600 },
    }),
  );

  const doc = new Document({
    creator: "CEIS Generador de Instrumentos",
    title: instrumento.nombre,
    sections: [{
      properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fname = `${instrumento.nombre.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}.docx`;
  saveAs(blob, fname);
}

export function imprimirPDF() {
  window.print();
}
