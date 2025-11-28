const express = require("express");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const moment = require("moment");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/generate-pdf", (req, res) => {
    const data = req.body;
    const doc = new PDFDocument({ margin: 30, size: 'LEGAL' });

    const filename = `worksheet-${Date.now()}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename=\"\${filename}\"`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(14).text("BHAGYALAXMI DAIRY FARMS", { align: "center" });
    doc.fontSize(10).text(`DAILY WORK SHEET ${data.monthYear}`, { align: "center" });
    doc.text("HQ. PIMPALGOAN BASWANT", { align: "center" });
    doc.moveDown();

    const tableTop = doc.y;
    const rowHeight = 20;
    const columnWidths = [30, 60, 140, 140, 40, 40, 50, 40]; // widths for each column
    const startY = 30;
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

    // Draw header row
    let x = startY;
    const columns = ["Sr.", "Date", "Area Name (Route)", "Work Done", "In KM", "Out KM", "Total K.M", "D.A."];

    columns.forEach((text, i) => {
        doc.rect(x, tableTop, columnWidths[i], rowHeight).stroke();
        doc.text(text, x + 2, tableTop + 5, { width: columnWidths[i] - 4 });
        x += columnWidths[i];
    });

    let totalKm = 0;
    let totalDA = 0;

    // Draw data rows
    let currentY = tableTop + rowHeight; // Start after header
    doc.fontSize(8); // Set to 8pt, or try 7 for even smaller

    data.entries.forEach((entry, i) => {
        const row = [
            i + 1,
            entry.date,
            entry.route,
            entry.work,
            entry.inKm,
            entry.outKm,
            entry.totkm,
            entry.da,
        ];

        let rowHeights = [];

        // First, calculate required height for each column
        row.forEach((text, j) => {
            const content = String(text || "");
            const options = {
                width: columnWidths[j] - 4,
                align: "left"
            };

            // Measure wrapped height
            const height = doc.heightOfString(content, options);
            rowHeights.push(height);
        });

        const maxRowHeight = Math.max(...rowHeights, rowHeight); // Fallback to default height
        let x = startY;

        // Draw cells and text
        row.forEach((text, j) => {
            doc.rect(x, currentY, columnWidths[j], maxRowHeight).stroke();

            doc.text(String(text || ""), x + 2, currentY + 2, {
                width: columnWidths[j] - 4,
                align: "left",

            });

            x += columnWidths[j];
        });

        totalKm += row[6]; // total
        totalDA += row[7]; // D.A.

        currentY += maxRowHeight;
    });


    // Summary rows data (columns 3 to 7 will remain split per row)
    const summaryRows = [
        ["", "", "", "TOTAL KMS", "", "", totalKm, ""],
        ["", "", "", "TOTAL D.A.", "", "", totalDA, ""],
        ["", "", "", "TOTAL KMS * 3", "", "", totalKm * 3, ""],
        ["", "", "", "Mobile + TOTAL", "", "", data.mobileCharges, `${totalKm * 3 + totalDA + Number(data.mobileCharges)}`],
    ];

    const summaryRowHeight = 20;
    const mergedHeight = summaryRowHeight * summaryRows.length;
    const mergedWidth = columnWidths.slice(0, 3).reduce((a, b) => a + b, 0);

    // Draw the single merged cell (3 cols × 4 rows)
    doc.rect(startY, currentY, mergedWidth, mergedHeight).stroke();

    // Add name inside the merged cell (centered vertically and horizontally)
    const mergedText = "NAMDEV KSHIRSAGAR\nS.O";
    doc.font("Helvetica-Bold").fontSize(9).text(mergedText, startY, currentY + 15, {
        width: mergedWidth,
        align: "center",
        lineGap: 4,
    });

    // Add signature image below the name
    const signatureImagePath = "./assets/anna_signature.png";
    const signatureWidth = 70; // Large width for clear visibility
    const signatureHeight = 60; // Large height for maximum clarity
    const signatureX = startY + (mergedWidth - signatureWidth) / 2; // Center horizontally
    const signatureY = currentY + 35; // Position below the text

    doc.image(signatureImagePath, signatureX, signatureY, {
        width: signatureWidth,
        height: signatureHeight
    });


    // Draw the rest of the summary rows (columns 3–7)
    summaryRows.forEach((row, i) => {
        let x = startY + mergedWidth;
        const y = currentY + i * summaryRowHeight;

        for (let j = 3; j < row.length; j++) {
            doc.rect(x, y, columnWidths[j], summaryRowHeight).stroke();
            doc.font(j >= 6 ? "Helvetica-Bold" : "Helvetica")
                .text(String(row[j] || ""), x + 2, y + 5, {
                    width: columnWidths[j] - 4,
                    align: "left"
                });
            x += columnWidths[j];
        }
    });

    currentY += mergedHeight;




    doc.end()
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
