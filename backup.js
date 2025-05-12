const express = require("express");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const moment = require("moment");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/generate-pdf", (req, res) => {
    const data = req.body;
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    const filename = `worksheet-${Date.now()}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename=\"\${filename}\"`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(14).text("BHAGYALAXMI DAIRY FARMS", { align: "center" });
    doc.fontSize(10).text(`DAILY WORK SHEET (\${data.monthYear})`, { align: "center" });
    doc.text("HQ. PIMPALGOAN BASWANT", { align: "center" });
    doc.moveDown();

    const tableTop = doc.y;
    const columnSpacing = 55;
    const columns = ["Sr.", "Date", "Area", "Work", "In", "Out", "Total", "D.A."];

    columns.forEach((text, i) => {
        doc.text(text, 30 + i * columnSpacing, tableTop);
    });

    let totalKm = 0;
    let totalDA = 0;
    const startY = tableTop + 20;

    data.entries.forEach((entry, i) => {
        const y = startY + i * 20;
        const total = entry.outKm - entry.inKm;
        totalKm += total;
        totalDA += entry.da;

        const row = [
            i + 1,
            entry.date,
            entry.route,
            entry.work,
            entry.inKm,
            entry.outKm,
            total,
            entry.da,
        ];

        row.forEach((text, j) => {
            doc.text(String(text || ""), 30 + j * columnSpacing, y);
        });
    });

    const endY = startY + data.entries.length * 20 + 20;
    doc.moveTo(30, endY).lineTo(550, endY).stroke();

    doc.text(`TOTAL KMS: \${totalKm}`, 30, endY + 10);
    doc.text(`TOTAL D.A.: \${totalDA}`, 30, endY + 30);
    doc.text(`TOTAL KMS * 3: \${totalKm * 3}`, 30, endY + 50);
    doc.text(`Mobile Charges: \${data.mobileCharges}`, 30, endY + 70);

    const grandTotal = totalKm * 3 + totalDA + Number(data.mobileCharges);
    doc.font("Helvetica-Bold").text(`TOTAL AMOUNT: ₹\${grandTotal}`, 30, endY + 100);

    doc.end();
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));