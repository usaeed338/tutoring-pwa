import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const { invoice } = await request.json()

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()
    let yPosition = height - 50

    // Title
    page.drawText('INVOICE', {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.15, 0.38, 0.90),
    })

    yPosition -= 40

    // Invoice Details
    page.drawText(`Invoice Number: ${invoice.invoice_number}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    yPosition -= 20

    page.drawText(`Date: ${new Date().toLocaleDateString('en-AU')}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 20

    page.drawText(`Student: ${invoice.students?.student_name || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 20

    page.drawText(`Period: ${invoice.start_date} to ${invoice.end_date}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 40

    // Line separator
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    yPosition -= 30

    // Invoice Summary
    page.drawText('Invoice Summary', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })

    yPosition -= 30

    page.drawText(`Total Amount:`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    })

    page.drawText(`$${Number(invoice.total_amount).toFixed(2)}`, {
      x: width - 150,
      y: yPosition,
      size: 11,
      font: font,
    })

    yPosition -= 25

    page.drawText(`Amount Paid:`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    })

    page.drawText(`$${Number(invoice.paid_amount).toFixed(2)}`, {
      x: width - 150,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0.5, 0),
    })

    yPosition -= 25

    page.drawText(`Balance Due:`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    page.drawText(`$${Number(invoice.balance).toFixed(2)}`, {
      x: width - 150,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: invoice.balance > 0 ? rgb(0.8, 0, 0) : rgb(0, 0.5, 0),
    })

    yPosition -= 50

    // Footer
    page.drawText('Thank you for your business!', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
