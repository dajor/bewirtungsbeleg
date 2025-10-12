from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg
from reportlab.lib.colors import Color
from reportlab.pdfbase import pdfform

# ===== PROFESSIONAL COLOR SCHEME =====
# DocBits brand blue
PRIMARY_BLUE = Color(0/255, 96/255, 170/255)
# Light blue for section backgrounds
LIGHT_BLUE_BG = Color(230/255, 240/255, 250/255)
# Soft yellow for financial highlights
YELLOW_HIGHLIGHT = Color(255/255, 252/255, 230/255)
# Light gray for secondary sections
LIGHT_GRAY_BG = Color(245/255, 245/255, 245/255)
# Grid lines
GRID_LINE_COLOR = Color(220/255, 220/255, 220/255)
# Dark text
DARK_TEXT = Color(0.2, 0.2, 0.2)
# Medium gray text
MEDIUM_GRAY = Color(0.5, 0.5, 0.5)

def draw_rounded_rect(c, x, y, width, height, radius, fill_color=None, stroke_color=None):
    """Draw a rectangle with rounded corners"""
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
    else:
        c.setStrokeColor(Color(0.9, 0.9, 0.9))

    c.roundRect(x, y, width, height, radius, stroke=1, fill=1 if fill_color else 0)

def draw_section_box(c, x, y, width, height, bg_color, title, title_font_size=13):
    """Draw a professional section box with background and title"""
    # Draw background box with rounded corners
    draw_rounded_rect(c, x, y, width, height, 5, fill_color=bg_color)

    # Draw title inside box
    c.setFillColor(PRIMARY_BLUE)
    c.setFont("Helvetica-Bold", title_font_size)
    c.drawString(x + 15, y + height - 22, title)
    c.setFillColor(DARK_TEXT)

def draw_badge(c, x, y, text, bg_color=PRIMARY_BLUE):
    """Draw a pill-shaped badge"""
    badge_width = 160
    badge_height = 28

    c.setFillColor(bg_color)
    c.roundRect(x, y, badge_width, badge_height, 14, stroke=0, fill=1)

    c.setFillColor(Color(1, 1, 1))  # White text
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + badge_width/2, y + 8, text)
    c.setFillColor(DARK_TEXT)

def draw_form(c):
    width, height = A4
    margin = 50
    line_height = 32  # Increased from 28 for better spacing
    y = height - 100

    # ===== HEADER SECTION =====
    # Logo on left (larger)
    logo_path = "docbits.svg"
    try:
        drawing = svg2rlg(logo_path)
        scale = 0.3  # Increased from 0.2
        drawing.width *= scale
        drawing.height *= scale
        drawing.scale(scale, scale)
        renderPDF.draw(drawing, c, margin, height - 70)
    except Exception as e:
        print("Fehler beim Laden des Logos:", e)

    # Horizontal separator line under header
    c.setStrokeColor(GRID_LINE_COLOR)
    c.setLineWidth(1.5)
    c.line(margin, height - 85, width - margin, height - 85)

    y = height - 110

    # ===== RESTAURANT INFO SECTION =====
    section_height = 130
    draw_section_box(c, margin, y - section_height + 20, width - 2*margin, section_height,
                     LIGHT_BLUE_BG, "Restaurant-Information")

    y_field_start = y - 35  # Position for first field inside box

    # Restaurant Name
    c.setFillColor(DARK_TEXT)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin + 15, y_field_start, "Restaurant:")
    c.setStrokeColor(GRID_LINE_COLOR)
    c.setLineWidth(1)
    c.line(margin + 110, y_field_start - 3, width - margin - 15, y_field_start - 3)

    # Add form field for Restaurant
    form = c.acroForm
    form.textfield(name='Restaurant', tooltip='Restaurant Name',
                   x=margin + 110, y=y_field_start - 12,
                   width=width - 2*margin - 110, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y_field_start -= line_height

    # Datum
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin + 15, y_field_start, "Datum:")
    c.line(margin + 110, y_field_start - 3, width - margin - 15, y_field_start - 3)

    form.textfield(name='Datum', tooltip='Datum',
                   x=margin + 110, y=y_field_start - 12,
                   width=width - 2*margin - 110, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y_field_start -= line_height

    # Ort der Bewirtung
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin + 15, y_field_start, "Ort der Bewirtung:")
    c.line(margin + 190, y_field_start - 3, width - margin - 15, y_field_start - 3)

    form.textfield(name='Ort_der_Bewirtung', tooltip='Ort der Bewirtung',
                   x=margin + 190, y=y_field_start - 12,
                   width=width - 2*margin - 190, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y = y_field_start - line_height - 20

    # ===== ANLASS & TEILNEHMER SECTION =====
    section_height = 200
    draw_section_box(c, margin, y - section_height + 20, width - 2*margin, section_height,
                     LIGHT_GRAY_BG, "Anlass & Teilnehmer")

    y_field_start = y - 35

    # Anlass (multi-line text field)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin + 15, y_field_start, "Anlass der Bewirtung:")
    y_field_start -= line_height

    # Multi-line text field for Anlass
    form.textfield(name='Anlass', tooltip='Anlass der Bewirtung',
                   x=margin + 15, y=y_field_start - 85,
                   width=width - 2*margin - 30, height=80,
                   borderStyle='solid', borderWidth=0.5,
                   borderColor=GRID_LINE_COLOR,
                   fillColor=Color(1, 1, 1),
                   forceBorder=True)

    # Draw lines for visual guidance
    for i in range(3):
        c.setStrokeColor(GRID_LINE_COLOR)
        c.setLineWidth(0.8)
        c.line(margin + 15, y_field_start - 3, width - margin - 15, y_field_start - 3)
        y_field_start -= line_height

    y_field_start -= 10

    # Teilnehmer
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin + 15, y_field_start, "Teilnehmer (Name & Firma):")
    y_field_start -= 6
    c.setStrokeColor(Color(0.85, 0.85, 0.85))
    c.setLineWidth(0.5)
    c.line(margin + 15, y_field_start, width - margin - 15, y_field_start)
    y_field_start -= line_height

    # Teilnehmer text field (multi-line)
    form.textfield(name='Teilnehmer', tooltip='Teilnehmer',
                   x=margin + 15, y=y_field_start - 50,
                   width=width - 2*margin - 30, height=45,
                   borderStyle='solid', borderWidth=0.5,
                   borderColor=GRID_LINE_COLOR,
                   fillColor=Color(1, 1, 1),
                   forceBorder=True)

    # Draw lines for visual guidance
    for i in range(2):
        c.setStrokeColor(GRID_LINE_COLOR)
        c.setLineWidth(0.8)
        c.line(margin + 15, y_field_start - 3, width - margin - 15, y_field_start - 3)
        y_field_start -= line_height

    y = y_field_start - 20

    # ===== FINANCIAL SECTION =====
    section_height = 165
    draw_section_box(c, margin, y - section_height + 20, width - 2*margin, section_height,
                     YELLOW_HIGHLIGHT, "Finanzielle Details")

    y_field_start = y - 35

    # Gesamtkosten (highlighted, bold, larger)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin + 15, y_field_start, "Gesamtkosten €:")
    c.setStrokeColor(PRIMARY_BLUE)
    c.setLineWidth(2)
    c.line(margin + 160, y_field_start - 4, margin + 320, y_field_start - 4)

    form.textfield(name='Gesamtkosten', tooltip='Gesamtkosten',
                   x=margin + 160, y=y_field_start - 15,
                   width=160, height=20,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y_field_start -= line_height + 10

    # Two-column layout for details
    col1_x = margin + 15
    col2_x = width / 2 + 20

    # Netto
    c.setFont("Helvetica-Bold", 13)
    c.setStrokeColor(GRID_LINE_COLOR)
    c.setLineWidth(1)
    c.drawString(col1_x, y_field_start, "Netto:")
    c.line(col1_x + 60, y_field_start - 3, col1_x + 200, y_field_start - 3)

    form.textfield(name='Netto', tooltip='Netto',
                   x=col1_x + 60, y=y_field_start - 12,
                   width=140, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    # MwSt
    c.drawString(col2_x, y_field_start, "MwSt.:")
    c.line(col2_x + 60, y_field_start - 3, width - margin - 15, y_field_start - 3)

    form.textfield(name='MwSt', tooltip='MwSt',
                   x=col2_x + 60, y=y_field_start - 12,
                   width=width - margin - 15 - col2_x - 60, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y_field_start -= line_height + 8

    # Trinkgeld
    c.drawString(col1_x, y_field_start, "Trinkgeld:")
    c.line(col1_x + 80, y_field_start - 3, col1_x + 200, y_field_start - 3)

    form.textfield(name='Trinkgeld', tooltip='Trinkgeld',
                   x=col1_x + 80, y=y_field_start - 12,
                   width=120, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    # MwSt. Trinkgeld
    c.drawString(col2_x, y_field_start, "MwSt. Trinkgeld:")
    c.line(col2_x + 120, y_field_start - 3, width - margin - 15, y_field_start - 3)

    form.textfield(name='MwSt_Trinkgeld', tooltip='MwSt Trinkgeld',
                   x=col2_x + 120, y=y_field_start - 12,
                   width=width - margin - 15 - col2_x - 120, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y = y_field_start - line_height - 20

    # ===== PAYMENT & SIGNATURE SECTION =====
    section_height = 100
    draw_section_box(c, margin, y - section_height + 20, width - 2*margin, section_height,
                     LIGHT_GRAY_BG, "Zahlungsart & Unterschrift")

    y_field_start = y - 35

    # Zahlungsart
    c.setFont("Helvetica-Bold", 13)
    c.setStrokeColor(GRID_LINE_COLOR)
    c.setLineWidth(1)
    c.drawString(margin + 15, y_field_start, "Zahlungsart:")
    c.line(margin + 120, y_field_start - 3, width - margin - 15, y_field_start - 3)

    form.textfield(name='Zahlungsart', tooltip='Zahlungsart',
                   x=margin + 120, y=y_field_start - 12,
                   width=width - 2*margin - 120, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    y_field_start -= line_height + 8

    # Unterschrift fields (two columns)
    c.drawString(col1_x, y_field_start, "Unterschrift:")
    c.line(col1_x + 100, y_field_start - 3, col1_x + 260, y_field_start - 3)

    form.textfield(name='Unterschrift', tooltip='Unterschrift',
                   x=col1_x + 100, y=y_field_start - 12,
                   width=160, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    c.drawString(col2_x, y_field_start, "Ort / Datum:")
    c.line(col2_x + 90, y_field_start - 3, width - margin - 15, y_field_start - 3)

    form.textfield(name='Ort_Datum', tooltip='Ort / Datum',
                   x=col2_x + 90, y=y_field_start - 12,
                   width=width - margin - 15 - col2_x - 90, height=18,
                   borderStyle='underlined', borderWidth=0,
                   fillColor=None, forceBorder=False)

    # ===== FOOTER =====
    c.setFont("Helvetica", 9)
    c.setFillColor(MEDIUM_GRAY)
    c.setStrokeColor(GRID_LINE_COLOR)
    c.setLineWidth(0.75)
    c.line(margin, 50, width - margin, 50)
    c.drawRightString(width - margin, 35, "Dieses Formular wurde mit DocBits erstellt")
    c.setFillColor(DARK_TEXT)

def draw_kundenbewirtung_form(c):
    draw_form(c)
    width, height = A4

    # Draw "Kundenbewirtung" badge in top right corner
    badge_x = width - 50 - 160  # 50 = margin, 160 = badge width
    badge_y = height - 70
    draw_badge(c, badge_x, badge_y, "Kundenbewirtung")

def draw_mitarbeiterbewirtung_form(c):
    draw_form(c)
    width, height = A4

    # Draw "Mitarbeiterbewirtung" badge in top right corner
    badge_x = width - 50 - 160  # 50 = margin, 160 = badge width
    badge_y = height - 70
    draw_badge(c, badge_x, badge_y, "Mitarbeiterbewirtung", bg_color=Color(0.2, 0.6, 0.3))

def create_pdf():
    print("🎨 Generating professional PDF templates with fillable forms...")

    # Create Kundenbewirtung template
    c1 = canvas.Canvas("kundenbewirtung.pdf", pagesize=A4)
    draw_kundenbewirtung_form(c1)
    c1.showPage()
    c1.save()
    print("✅ kundenbewirtung.pdf created with fillable form fields")

    # Create Mitarbeiterbewirtung template
    c2 = canvas.Canvas("mitarbeiterbewirtung.pdf", pagesize=A4)
    draw_mitarbeiterbewirtung_form(c2)
    c2.showPage()
    c2.save()
    print("✅ mitarbeiterbewirtung.pdf created with fillable form fields")

    print("🎉 Professional PDF templates generated successfully!")

if __name__ == "__main__":
    create_pdf()
