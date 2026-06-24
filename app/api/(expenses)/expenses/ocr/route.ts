import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Stub OCR — replace body with a call to Google Vision / AWS Textract / similar.
// Expected POST: multipart/form-data with field `image` (File/Blob).
// Returns: { vendorName, amount, date, gstNumber, gstPaid, category }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // --- Real OCR would go here ---
    // const bytes = await image.arrayBuffer();
    // const result = await callOcrService(bytes);
    // return NextResponse.json(result);
    // --- End real OCR ---

    // Deterministic stub: vary output based on file size so it feels live
    const seed = image.size % 5;
    const stubs = [
      { vendorName: "Reliance Digital", amount: 4250.00, gstNumber: "27AAACR5055K1Z5", gstPaid: 649.83, category: "EQUIPMENT" },
      { vendorName: "Swiggy", amount: 680.00, gstNumber: null, gstPaid: null, category: "FOOD_BEVERAGE" },
      { vendorName: "Indian Oil Corporation", amount: 2100.00, gstNumber: "07AAACI1681G1ZK", gstPaid: 320.34, category: "TRAVEL" },
      { vendorName: "Amazon India", amount: 1450.00, gstNumber: "29AAGCA8719H1Z3", gstPaid: 221.19, category: "OFFICE_SUPPLIES" },
      { vendorName: "Airtel", amount: 999.00, gstNumber: "07AABBA0510C1Z9", gstPaid: 152.39, category: "UTILITIES" },
    ];

    const stub = stubs[seed];
    const today = new Date().toISOString().split("T")[0];

    return NextResponse.json({
      vendorName: stub.vendorName,
      amount: stub.amount,
      date: today,
      gstNumber: stub.gstNumber,
      gstPaid: stub.gstPaid,
      category: stub.category,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
