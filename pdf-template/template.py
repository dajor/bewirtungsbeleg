from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg

def draw_form(c):
    width, height = A4
    margin = 40
    line_height = 28
    y = height - 90

    # ===== Logo oben rechts =====
    logo_path = "docbits.svg"  # <- Pfad zu deinem Logo
    try:
        drawing = svg2rlg(logo_path)
        scale = 0.2  # ggf. anpassen
        drawing.width *= scale
        drawing.height *= scale
        drawing.scale(scale, scale)

        renderPDF.draw(drawing, c, 40, height - 60)  # Position oben links
    except Exception as e:
        print("Fehler beim Laden des Logos:", e)

    # Titel
    c.setFont("Helvetica", 18)
    c.setFillColorRGB(1, 1, 1)
    c.drawCentredString(width / 2, height - 45, "Bewirtungsformular")
    c.setFillColorRGB(0, 0, 0)
    y -= 10

    # Firma / Mitarbeiter
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica", 12)
    c.drawString(margin, y, "Firma / Mitarbeiter:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 150, y - 2, width - margin, y - 2)
    y -= line_height
    y -= 10

    # Datum (ohne Uhrzeit)
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawString(margin, y, "Datum:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 50, y - 2, width - margin, y - 2)
    c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück
    y -= line_height
    y -= 10

    # Ort
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawString(margin, y, "Ort der Bewirtung:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 130, y - 2, width - margin, y - 2)
    c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück
    y -= line_height
    y -= 10

    # Anlass (mehrzeilig!)
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawString(margin, y, "Anlass der Bewirtung:")
    y -= line_height
    for _ in range(3):
        c.setStrokeColorRGB(0.85, 0.85, 0.85)
        c.setLineWidth(1)
        c.line(margin, y - 2, width - margin, y - 2)
        c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück
        y -= line_height
    y -= line_height / 2
    y -= 10

    # Teilnehmer
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica", 12)
    c.drawString(margin, y, "Teilnehmer (Name & Firma):")
    y -= 10
    c.setStrokeColorRGB(0.9, 0.9, 0.9)
    c.setLineWidth(0.5)
    c.line(margin, y - 6, width - margin, y - 6)
    y -= line_height

    for _ in range(5):
        c.setStrokeColorRGB(0.85, 0.85, 0.85)
        c.setLineWidth(1)
        c.line(margin, y - 2, width - margin, y - 2)
        c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück
        y -= line_height

    y -= line_height / 2
    y -= 10

    # Betrag
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawString(margin, y, "Gesamtkosten €:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 120, y - 2, margin + 250, y - 2)
    c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück
    y -= line_height * 1.5
    y -= 10

    # Zusätzliche Felder
    c.drawString(margin, y, "Netto:")
    c.line(margin + 50, y - 2, margin + 180, y - 2)
    c.drawString(margin + 250, y, "MwSt.:")
    c.line(margin + 300, y - 2, width - margin, y - 2)
    y -= line_height
    y -= 10

    c.drawString(margin, y, "Trinkgeld:")
    c.line(margin + 70, y - 2, margin + 180, y - 2)
    c.drawString(margin + 250, y, "MwSt. Trinkgeld:")
    c.line(margin + 370, y - 2, width - margin, y - 2)
    y -= line_height
    y -= 10

    # Zahlungsart
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawString(margin, y, "Zahlungsart:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 150, y - 2, width - margin, y - 2)
    c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück
    y -= line_height
    y -= 10

    # Unterschrift
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawString(margin, y, "Unterschrift:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 90, y - 2, margin + 250, y - 2)
    c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück

    c.drawString(margin + 300, y, "Ort / Datum:")
    c.setStrokeColorRGB(0.85, 0.85, 0.85)
    c.setLineWidth(1)
    c.line(margin + 380, y - 2, width - margin, y - 2)
    c.setStrokeColorRGB(0, 0, 0)  # danach wieder zurück

    # Fußzeile
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.setStrokeColorRGB(0.9, 0.9, 0.9)
    c.setLineWidth(0.75)
    c.line(margin, 50, width - margin, 50)
    c.drawRightString(width - 40, 40, "Dieses Formular wurde mit DocBits erstellt")
    c.setFillColorRGB(0, 0, 0)

def draw_kundenbewirtung_form(c):
    draw_form(c)
    width, height = A4
    c.setFont("Helvetica-Oblique", 14)
    c.setFillColorRGB(0.2, 0.45, 0.75)
    c.drawRightString(width - 40, height - 40, "Kundenbewirtung")
    c.setFillColorRGB(0, 0, 0)

def draw_mitarbeiterbewirtung_form(c):
    draw_form(c)
    width, height = A4
    c.setFont("Helvetica-Oblique", 14)
    c.setFillColorRGB(0.2, 0.45, 0.75)
    c.drawRightString(width - 40, height - 40, "Mitarbeiterbewirtung")
    c.setFillColorRGB(0, 0, 0)

def create_pdf():
    c1 = canvas.Canvas("kundenbewirtung.pdf", pagesize=A4)
    draw_kundenbewirtung_form(c1)
    c1.showPage()
    c1.save()

    c2 = canvas.Canvas("mitarbeiterbewirtung.pdf", pagesize=A4)
    draw_mitarbeiterbewirtung_form(c2)
    c2.showPage()
    c2.save()

create_pdf()