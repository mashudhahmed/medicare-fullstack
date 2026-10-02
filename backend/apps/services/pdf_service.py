import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

TEAL = HexColor('#0D9488')
TEAL_LIGHT = HexColor('#F0FDFA')
DARK = HexColor('#0F172A')
GRAY = HexColor('#64748B')
LIGHT_GRAY = HexColor('#F8FAFC')
BORDER_COLOR = HexColor('#CBD5E1')
GREEN = HexColor('#16A34A')
ORANGE = HexColor('#EA580C')


def generate_prescription_pdf(prescription) -> bytes:
    """Generate a clean, high-resolution official medical prescription PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    hospital_title_style = ParagraphStyle(
        'HospitalTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=TEAL,
        spaceAfter=2,
    )
    hospital_sub_style = ParagraphStyle(
        'HospitalSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=GRAY,
    )
    header_right_style = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        alignment=2,
        textColor=GRAY,
    )
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=DARK,
        spaceBefore=4,
        spaceAfter=4,
    )
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=DARK,
    )
    body_text = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK,
    )
    rx_symbol_style = ParagraphStyle(
        'RxSymbol',
        parent=styles['Heading1'],
        fontName='Times-BoldItalic',
        fontSize=24,
        leading=26,
        textColor=TEAL,
    )

    story = []

    # 1. Header Banner
    presc_date = prescription.created_at.strftime('%B %d, %Y') if getattr(prescription, 'created_at', None) else datetime.now().strftime('%B %d, %Y')
    header_data = [
        [
            Paragraph("<b>MediCare Health System</b>", hospital_title_style),
            Paragraph("<b>Official Medical Prescription</b><br/>Emergency: +880 1234-567890<br/>support@medicare.local", header_right_style)
        ],
        [
            Paragraph("Accredited Multi-Specialty Hospital & Telemedicine Services", hospital_sub_style),
            Paragraph(f"Issued: {presc_date}", header_right_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceBefore=4, spaceAfter=12))

    # 2. Doctor & Patient Info Grid
    doc_user = prescription.doctor.user if prescription.doctor and hasattr(prescription.doctor, 'user') else None
    patient_user = prescription.patient.user if prescription.patient and hasattr(prescription.patient, 'user') else None

    doc_name = doc_user.get_full_name() if doc_user else 'Consulting Physician'
    patient_name = patient_user.get_full_name() if patient_user else 'Patient'

    doctor_info = [
        Paragraph(f"<b>Prescribing Doctor:</b> Dr. {doc_name}", bold_label),
        Paragraph(f"<b>Specialty:</b> {prescription.doctor.specialty if prescription.doctor else 'General Medicine'}", body_text),
        Paragraph(f"<b>Qualification:</b> {prescription.doctor.qualification if prescription.doctor and prescription.doctor.qualification else 'MBBS'}", body_text),
        Paragraph(f"<b>BMDC / License No:</b> {prescription.doctor.license_number if prescription.doctor and prescription.doctor.license_number else 'REG-N/A'}", body_text),
    ]

    patient_gender = prescription.patient.gender.capitalize() if prescription.patient and hasattr(prescription.patient, 'gender') else 'N/A'
    patient_blood = prescription.patient.blood_group if prescription.patient and prescription.patient.blood_group else 'N/A'
    patient_id_str = str(prescription.patient.id)[:8] if prescription.patient else 'N/A'

    patient_info = [
        Paragraph(f"<b>Patient Name:</b> {patient_name}", bold_label),
        Paragraph(f"<b>Patient ID:</b> #{patient_id_str}", body_text),
        Paragraph(f"<b>Gender / Blood Group:</b> {patient_gender} | {patient_blood}", body_text),
        Paragraph(f"<b>Prescription Ref:</b> #{str(prescription.id)[:8].upper()}", body_text),
    ]

    meta_table_data = [
        [doctor_info, patient_info]
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (0, 0), LIGHT_GRAY),
        ('BACKGROUND', (1, 0), (1, 0), TEAL_LIGHT),
        ('BOX', (0, 0), (0, 0), 1, BORDER_COLOR),
        ('BOX', (1, 0), (1, 0), 1, HexColor('#99F6E4')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Rx Symbol & Medications Table
    story.append(Paragraph("Rx", rx_symbol_style))
    story.append(Spacer(1, 6))

    header_bold_white = ParagraphStyle(
        'HeaderWhite',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white,
    )

    table_headers = [
        Paragraph("<b>#</b>", header_bold_white),
        Paragraph("<b>Medication Name</b>", header_bold_white),
        Paragraph("<b>Dosage</b>", header_bold_white),
        Paragraph("<b>Frequency</b>", header_bold_white),
        Paragraph("<b>Duration</b>", header_bold_white),
    ]

    table_row = [
        Paragraph("1", body_text),
        Paragraph(f"<b>{prescription.medication_name}</b>", body_text),
        Paragraph(prescription.dosage or '-', body_text),
        Paragraph(prescription.frequency or '-', body_text),
        Paragraph(f"{prescription.duration_days} Days", body_text),
    ]

    med_table_data = [table_headers, table_row]
    med_table = Table(med_table_data, colWidths=[30, 210, 90, 120, 90])
    med_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ]))
    story.append(med_table)
    story.append(Spacer(1, 14))

    # 4. Special Instructions & Refills
    instructions_content = prescription.instructions or "Take medications as prescribed. Drink plenty of water and complete the prescribed dosage."
    instructions_box = [
        Paragraph("<b>Instructions & Advice:</b>", section_title_style),
        Paragraph(instructions_content, body_text),
        Spacer(1, 4),
        Paragraph(f"<b>Authorized Refills:</b> {prescription.refills_allowed} refill(s) permitted.", body_text),
    ]
    inst_table = Table([[instructions_box]], colWidths=[540])
    inst_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(inst_table)
    story.append(Spacer(1, 40))

    # 5. Doctor Signature & Verification Footer
    sig_data = [
        [
            Paragraph("<i>Electronically verified via MediCare Telehealth Platform.<br/>Valid without physical seal where permitted.</i>", hospital_sub_style),
            Paragraph(f"____________________________<br/><b>Dr. {doc_name}</b><br/>Registered Medical Practitioner", header_right_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[320, 220])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(KeepTogether(sig_table))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY, spaceBefore=4, spaceAfter=6))
    footer_text = Paragraph(
        f"MediCare Hospital Management System • Printed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} • This is an official electronic medical document.",
        ParagraphStyle('FooterText', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=GRAY, alignment=1)
    )
    story.append(footer_text)

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf


def generate_invoice_pdf(billing) -> bytes:
    """Generate an official hospital invoice and payment receipt PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    hospital_title_style = ParagraphStyle(
        'HospitalTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=TEAL,
        spaceAfter=2,
    )
    header_right_style = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        alignment=2,
        textColor=GRAY,
    )
    invoice_title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=DARK,
    )
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=DARK,
    )
    body_text = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK,
    )

    story = []

    # 1. Header
    created_date = billing.created_at.strftime('%B %d, %Y') if getattr(billing, 'created_at', None) else datetime.now().strftime('%B %d, %Y')
    header_data = [
        [
            Paragraph("<b>MediCare Health System</b>", hospital_title_style),
            Paragraph("<b>OFFICIAL RECEIPT / INVOICE</b><br/>Emergency: +880 1234-567890<br/>billing@medicare.local", header_right_style)
        ],
        [
            Paragraph("Official Hospital Billing & Accounts Department", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=GRAY)),
            Paragraph(f"Date: {created_date}", header_right_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceBefore=4, spaceAfter=12))

    # 2. Invoice Meta & Status Banner
    is_paid = (billing.status == 'paid')
    status_color = GREEN if is_paid else ORANGE
    status_bg = HexColor('#DCFCE7') if is_paid else HexColor('#FFEDD5')
    status_text = "PAID - OFFICIAL RECEIPT" if is_paid else "PENDING PAYMENT"

    patient_user = billing.patient.user if billing.patient and hasattr(billing.patient, 'user') else None
    patient_name = patient_user.get_full_name() if patient_user else 'Patient'
    patient_email = patient_user.email if patient_user else 'N/A'

    due_str = billing.due_date.strftime('%B %d, %Y') if getattr(billing, 'due_date', None) else 'Immediate'

    txn_ref = getattr(billing, 'transaction_id', None) or f"TXN-{str(billing.id)[:8].upper()}"
    invoice_meta = [
        Paragraph(f"<b>Invoice #:</b> {billing.invoice_number}", invoice_title_style),
        Paragraph(f"<b>Due Date:</b> {due_str}", body_text),
        Paragraph(f"<b>Payment Method:</b> {billing.payment_method.upper() if getattr(billing, 'payment_method', None) else 'CASH / DESK'}", body_text),
        Paragraph(f"<b>Transaction Ref:</b> {txn_ref}", body_text),
    ]

    patient_meta = [
        Paragraph(f"<b>Billed To (Patient):</b>", bold_label),
        Paragraph(f"<b>Name:</b> {patient_name}", body_text),
        Paragraph(f"<b>Email:</b> {patient_email}", body_text),
        Paragraph(f"<b>Patient ID:</b> #{str(billing.patient.id)[:8] if billing.patient else 'N/A'}", body_text),
    ]

    meta_table_data = [[invoice_meta, patient_meta]]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (0, 0), LIGHT_GRAY),
        ('BACKGROUND', (1, 0), (1, 0), TEAL_LIGHT),
        ('BOX', (0, 0), (0, 0), 1, BORDER_COLOR),
        ('BOX', (1, 0), (1, 0), 1, HexColor('#99F6E4')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Status Badge Banner
    status_box = Table(
        [[Paragraph(f"<b>STATUS: {status_text}</b>", ParagraphStyle('StatusStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=status_color, alignment=1))]],
        colWidths=[540]
    )
    status_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), status_bg),
        ('BOX', (0, 0), (-1, -1), 1.5, status_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(status_box)
    story.append(Spacer(1, 16))

    # 3. Itemized Charges Table
    header_bold_white = ParagraphStyle(
        'HeaderWhite',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white,
    )

    charges_header = [
        Paragraph("<b>#</b>", header_bold_white),
        Paragraph("<b>Service / Item Description</b>", header_bold_white),
        Paragraph("<b>Department / Ref</b>", header_bold_white),
        Paragraph("<b>Amount</b>", header_bold_white),
    ]

    item_desc = billing.description or "General Medical Consultation & Clinical Care"
    doc_name = ""
    if billing.appointment and billing.appointment.doctor and billing.appointment.doctor.user:
        doc_name = f" (Attending: Dr. {billing.appointment.doctor.user.get_full_name()})"

    charges_row = [
        Paragraph("1", body_text),
        Paragraph(f"{item_desc}{doc_name}", body_text),
        Paragraph("Clinical OPD", body_text),
        Paragraph(f"${billing.total_amount}", body_text),
    ]

    total_row = [
        Paragraph("", body_text),
        Paragraph("<b>TOTAL DUE / PAID</b>", bold_label),
        Paragraph("", body_text),
        Paragraph(f"<b>${billing.total_amount}</b>", ParagraphStyle('Tot', parent=bold_label, textColor=TEAL, fontSize=11)),
    ]

    charges_table_data = [charges_header, charges_row, total_row]
    charges_table = Table(charges_table_data, colWidths=[30, 270, 120, 120])
    charges_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('BACKGROUND', (0, 2), (-1, 2), LIGHT_GRAY),
    ]))
    story.append(charges_table)
    story.append(Spacer(1, 35))

    # 4. Authorized Stamp & Footer
    stamp_data = [
        [
            Paragraph("<i>Thank you for choosing MediCare.<br/>For billing queries, visit Desk 1 or email billing@medicare.local</i>", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=8, textColor=GRAY)),
            Paragraph("____________________________<br/><b>Accounts & Billing Officer</b><br/>MediCare Health Services", header_right_style)
        ]
    ]
    stamp_table = Table(stamp_data, colWidths=[320, 220])
    stamp_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(KeepTogether(stamp_table))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY, spaceBefore=4, spaceAfter=6))
    footer_text = Paragraph(
        f"MediCare Official Receipt • Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} • Keep this document for your insurance and medical records.",
        ParagraphStyle('FooterText', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=GRAY, alignment=1)
    )
    story.append(footer_text)

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
