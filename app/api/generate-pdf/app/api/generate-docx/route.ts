import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'

export async function POST(request: NextRequest) {
  try {
    const { invoice } = await request.json()

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'INVOICE',
              heading: 'Heading1',
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Invoice Number: ${invoice.invoice_number}`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Date: ${new Date().toLocaleDateString('en-AU')}`,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Student: ${invoice.students?.student_name || 'N/A'}`,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Period: ${invoice.start_date} to ${invoice.end_date}`,
                  size: 22,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Invoice Summary',
              heading: 'Heading2',
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Total Amount: $${Number(invoice.total_amount).toFixed(2)}`,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Amount Paid: $${Number(invoice.paid_amount).toFixed(2)}`,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Balance Due: $${Number(invoice.balance).toFixed(2)}`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Thank you for your business!',
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.docx"`,
      },
    })
  } catch (error) {
    console.error('DOCX Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 })
  }
}
