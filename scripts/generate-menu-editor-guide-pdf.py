#!/usr/bin/env python3

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "guida-editor-menu-hawaii.md"
OUTPUT = ROOT / "output" / "pdf" / "hawaii-guida-editor-menu.pdf"
LOGO = ROOT / "web" / "public" / "media" / "hawaii" / "brand" / "logo-lockup-white.png"
COVER_IMAGE = ROOT / "web" / "public" / "media" / "hawaii" / "seafront-aerial.jpg"

TEAL = colors.HexColor("#142a2e")
INK = colors.HexColor("#223033")
SAND = colors.HexColor("#d7b57f")
CREAM = colors.HexColor("#f7f2e9")
MUTED = colors.HexColor("#657170")
LINE = colors.HexColor("#d9d4ca")


def register_fonts() -> tuple[str, str, str, str]:
    font_dir = Path("/System/Library/Fonts/Supplemental")
    font_paths = {
        "GeorgiaGuide": font_dir / "Georgia.ttf",
        "GeorgiaGuideBold": font_dir / "Georgia Bold.ttf",
        "GeorgiaGuideItalic": font_dir / "Georgia Italic.ttf",
        "GeorgiaGuideBoldItalic": font_dir / "Georgia Bold Italic.ttf",
    }
    if all(path.exists() for path in font_paths.values()):
        for name, path in font_paths.items():
            pdfmetrics.registerFont(TTFont(name, str(path)))
        pdfmetrics.registerFontFamily(
            "GeorgiaGuide",
            normal="GeorgiaGuide",
            bold="GeorgiaGuideBold",
            italic="GeorgiaGuideItalic",
            boldItalic="GeorgiaGuideBoldItalic",
        )
        return (
            "GeorgiaGuide",
            "GeorgiaGuideBold",
            "GeorgiaGuideItalic",
            "GeorgiaGuideBoldItalic",
        )
    return ("Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic")


SERIF, SERIF_BOLD, SERIF_ITALIC, _ = register_fonts()


def inline_markup(text: str) -> str:
    escaped = html.escape(text, quote=False)
    escaped = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<link href="\2" color="#8a6332"><u>\1</u></link>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"`([^`]+)`", r'<font name="Courier" color="#6c4f2c">\1</font>', escaped)
    return escaped


def make_styles():
    styles = getSampleStyleSheet()
    return {
        "body": ParagraphStyle(
            "BodyGuide",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=13.8,
            textColor=INK,
            spaceAfter=3 * mm,
        ),
        "h2": ParagraphStyle(
            "H2Guide",
            parent=styles["Heading1"],
            fontName=SERIF,
            fontSize=22,
            leading=25,
            textColor=TEAL,
            spaceBefore=3 * mm,
            spaceAfter=5 * mm,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3Guide",
            parent=styles["Heading2"],
            fontName=SERIF_BOLD,
            fontSize=13,
            leading=16,
            textColor=TEAL,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
            keepWithNext=False,
        ),
        "list": ParagraphStyle(
            "ListGuide",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=13.1,
            textColor=INK,
            leftIndent=0,
        ),
        "callout": ParagraphStyle(
            "CalloutGuide",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=14,
            textColor=TEAL,
        ),
        "code": ParagraphStyle(
            "CodeGuide",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.5,
            leading=12,
            textColor=TEAL,
            backColor=CREAM,
            borderPadding=4 * mm,
            spaceAfter=4 * mm,
        ),
    }


STYLES = make_styles()


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=18 * mm,
            title="Guida all'editor dei menu - Hawaii Urban Village",
            author="Hawaii Urban Village",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="content",
        )
        self.addPageTemplates(
            [PageTemplate(id="guide", frames=[frame], onPage=self.draw_page)]
        )

    def draw_page(self, canvas, doc):
        if doc.page == 1:
            return
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(20 * mm, 14 * mm, A4[0] - 20 * mm, 14 * mm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 9 * mm, "HAWAII URBAN VILLAGE - GUIDA EDITOR MENU")
        canvas.drawRightString(A4[0] - 20 * mm, 9 * mm, str(doc.page))
        canvas.restoreState()


def cover_story():
    logo = Image(str(LOGO), width=54 * mm, height=20.5 * mm)
    logo.hAlign = "CENTER"
    photo = Image(str(COVER_IMAGE), width=170 * mm, height=66 * mm)
    photo.hAlign = "CENTER"
    title = Paragraph(
        "Guida all'editor<br/>dei menu",
        ParagraphStyle(
            "CoverTitle",
            fontName=SERIF,
            fontSize=34,
            leading=36,
            alignment=TA_CENTER,
            textColor=colors.white,
        ),
    )
    subtitle = Paragraph(
        "Hawaii Urban Village &nbsp;|&nbsp; MUULab Riviera",
        ParagraphStyle(
            "CoverSubtitle",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=SAND,
            tracking=1.2,
        ),
    )
    version = Paragraph(
        "Accesso, modifica, allergeni e pubblicazione<br/><font size=8>Versione operativa - 31 luglio 2026</font>",
        ParagraphStyle(
            "CoverVersion",
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#dce4e2"),
        ),
    )
    cover = Table(
        [[logo], [Spacer(1, 9 * mm)], [title], [Spacer(1, 4 * mm)], [subtitle], [Spacer(1, 13 * mm)], [photo], [Spacer(1, 12 * mm)], [version]],
        colWidths=[A4[0]],
        rowHeights=None,
    )
    cover.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TEAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 20 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 20 * mm),
                ("TOPPADDING", (0, 0), (-1, 0), 24 * mm),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 23 * mm),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    return [cover, PageBreak()]


def callout(text: str):
    content = Paragraph(inline_markup(text), STYLES["callout"])
    table = Table([[content]], colWidths=[166 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#edf1ed")),
                ("BOX", (0, 0), (-1, -1), 0.6, SAND),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    return KeepTogether([table, Spacer(1, 4 * mm)])


def flush_list(story, items, ordered):
    if not items:
        return
    list_items = [
        ListItem(Paragraph(inline_markup(item), STYLES["list"]), leftIndent=4 * mm)
        for item in items
    ]
    story.append(
        ListFlowable(
            list_items,
            bulletType="1" if ordered else "bullet",
            start="1" if ordered else None,
            leftIndent=6 * mm,
            bulletFontName="Helvetica-Bold",
            bulletFontSize=8,
            bulletColor=SAND,
            spaceAfter=3 * mm,
        )
    )


def markdown_story(markdown: str):
    lines = markdown.splitlines()
    story = []
    paragraph = []
    list_items = []
    ordered = False
    in_code = False
    code_lines = []
    first_h1_skipped = False

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            story.append(Paragraph(inline_markup(" ".join(paragraph)), STYLES["body"]))
            paragraph = []

    def flush_active_list():
        nonlocal list_items
        flush_list(story, list_items, ordered)
        list_items = []

    for raw_line in lines:
        line = raw_line.rstrip()
        if line.startswith("```"):
            flush_paragraph()
            flush_active_list()
            if in_code:
                story.append(Paragraph("<br/>".join(html.escape(value) for value in code_lines), STYLES["code"]))
                code_lines = []
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(line)
            continue
        if line.startswith("# "):
            flush_paragraph()
            flush_active_list()
            if not first_h1_skipped:
                first_h1_skipped = True
            continue
        if line.startswith("## "):
            flush_paragraph()
            flush_active_list()
            title = line[3:]
            if title.startswith("6. "):
                story.append(PageBreak())
            if story and not title.startswith("1."):
                story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(inline_markup(title), STYLES["h2"]))
            continue
        if line.startswith("### "):
            flush_paragraph()
            flush_active_list()
            title = line[4:]
            if title == "Ho pubblicato un prezzo errato":
                story.append(PageBreak())
            story.append(Paragraph(inline_markup(title), STYLES["h3"]))
            continue
        if line.startswith("> "):
            flush_paragraph()
            flush_active_list()
            story.append(callout(line[2:]))
            continue
        unordered_match = re.match(r"^- (.+)$", line)
        ordered_match = re.match(r"^\d+\. (.+)$", line)
        if unordered_match or ordered_match:
            flush_paragraph()
            next_ordered = bool(ordered_match)
            if list_items and ordered != next_ordered:
                flush_active_list()
            ordered = next_ordered
            list_items.append((ordered_match or unordered_match).group(1))
            continue
        if not line.strip():
            flush_paragraph()
            flush_active_list()
            continue
        paragraph.append(line.strip())

    flush_paragraph()
    flush_active_list()
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    doc = GuideDocTemplate(str(OUTPUT))
    story = cover_story() + markdown_story(markdown)
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()
