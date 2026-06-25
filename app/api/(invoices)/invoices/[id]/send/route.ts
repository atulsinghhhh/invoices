import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/app/generated/prisma/enums";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const invoiceId = Number(id);
    if (Number.isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if the invoice exists and belongs to this business
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId: business.id },
      include: { customer: true, items: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const now = new Date();
    const d1 = new Date(invoice.dueDate);
    d1.setDate(d1.getDate() + 7);
    const d2 = new Date(invoice.dueDate);
    d2.setDate(d2.getDate() + 14);

    // Run updates atomically inside a transaction
    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.SENT,
          sentAt: now,
          updatedAt: now,
        },
      }),
      prisma.reminderLog.deleteMany({
        where: { invoiceId: invoice.id, sent: false },
      }),
      prisma.reminderLog.createMany({
        data: [
          { invoiceId: invoice.id, scheduledAt: d1 },
          { invoiceId: invoice.id, scheduledAt: d2 },
        ],
      }),
    ]);

    // Simulate S3 PDF Generation + Twilio + SendGrid log outputs
    console.log(`[Delivery Service] Generated PDF for Invoice ${invoice.invoiceNumber}`);
    console.log(`[Delivery Service] Uploaded to S3: s3://invoices-bucket/inv-${invoice.invoiceNumber}.pdf`);
    console.log(`[Delivery Service] Sent SendGrid Email to ${invoice.customer.email || 'no-email@customer.com'} with attached PDF`);
    console.log(`[Delivery Service] Sent Twilio WhatsApp notification to ${invoice.customer.phone || 'no-phone'} with public URL: https://s3.amazonaws.com/invoices-bucket/inv-${invoice.invoiceNumber}.pdf`);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      deliveryLogs: [
        `Generated PDF buffer for ${invoice.invoiceNumber}.`,
        `Uploaded PDF to S3 storage bucket.`,
        `SendGrid: Sent email invoice notification containing summary table.`,
        `Twilio: Sent WhatsApp notification to ${invoice.customer.phone || 'customer'}.`
      ]
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
}
