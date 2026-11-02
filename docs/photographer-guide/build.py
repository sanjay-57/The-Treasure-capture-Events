"""Builds docs/photographer-guide/photographer-guide.pdf.

Screenshots: drop PNG/JPG files into docs/photographer-guide/screenshots/ named
after the slot ids below (e.g. 01-export-dialog.png) and re-run:
    python3 docs/photographer-guide/build.py
Any slot without a file renders as a labelled dashed box.

Every Lightroom label here was checked against Adobe help and Julieanne Kost's
(Adobe) tutorials. Covers Lightroom Classic only, not Lightroom (cloud).
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Flowable, Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
    Spacer, Table, TableStyle,
)

HERE = Path(__file__).parent
SHOTS = HERE / "screenshots"
OUT = HERE / "photographer-guide.pdf"

INK = colors.HexColor("#0a0a0b")
GOLD = colors.HexColor("#a8791c")
GOLD_DEEP = colors.HexColor("#6f4f0e")
GOLD_SOFT = colors.HexColor("#fbf3df")
MUTED = colors.HexColor("#5b5b60")
WARN = colors.HexColor("#fdecea")
WARN_INK = colors.HexColor("#8a1c12")

W, H = A4
CONTENT_W = W - 36 * mm

s = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=26, leading=31, textColor=INK),
    "sub": ParagraphStyle("sub", fontName="Helvetica", fontSize=12.5, leading=18, textColor=MUTED),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, leading=22, textColor=GOLD_DEEP, spaceBefore=6, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=17, textColor=INK, spaceBefore=10, spaceAfter=4),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=9, leading=13, textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Helvetica-Bold", fontSize=9.5, leading=13.5, textColor=INK),
    "slot": ParagraphStyle("slot", fontName="Helvetica", fontSize=9, leading=13, textColor=MUTED, alignment=TA_CENTER),
    "num": ParagraphStyle("num", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=colors.white, alignment=TA_CENTER),
}


def P(text, style="body"):
    return Paragraph(text, s[style])


def k(label):
    """A Lightroom UI label, shown bold so it matches what's on screen."""
    return f"<b>{label}</b>"


class Slot(Flowable):
    """Dashed placeholder for a screenshot that hasn't been taken yet."""

    def __init__(self, sid, what, height=60 * mm):
        super().__init__()
        self.sid, self.what, self.h = sid, what, height

    def wrap(self, aw, ah):
        self.w = aw
        return aw, self.h

    def draw(self):
        c = self.canv
        c.setStrokeColor(GOLD)
        c.setFillColor(GOLD_SOFT)
        c.setDash(4, 3)
        c.roundRect(0, 0, self.w, self.h, 6, stroke=1, fill=1)
        c.setDash()
        p = Paragraph(f"<b>SCREENSHOT TO ADD</b> &nbsp;·&nbsp; {self.sid}<br/>{self.what}", s["slot"])
        pw, ph = p.wrap(self.w - 20 * mm, self.h)
        p.drawOn(c, 10 * mm, (self.h - ph) / 2)


def shot(sid, what, height=60 * mm):
    for ext in (".png", ".jpg", ".jpeg"):
        f = SHOTS / f"{sid}{ext}"
        if f.exists():
            iw, ih = ImageReader(str(f)).getSize()
            w = min(CONTENT_W, iw)
            h = w * ih / iw
            if h > 110 * mm:
                h = 110 * mm
                w = h * iw / ih
            return [Spacer(1, 3), Image(str(f), width=w, height=h), P(what, "small"), Spacer(1, 6)]
    return [Spacer(1, 3), Slot(sid, what, height), Spacer(1, 8)]


def step(n, text):
    badge = Table([[P(str(n), "num")]], colWidths=[7 * mm], rowHeights=[7 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [3.5 * mm] * 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    t = Table([[badge, P(text)]], colWidths=[10 * mm, CONTENT_W - 10 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def callout(text, warn=False):
    t = Table([[P(text)]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WARN if warn else GOLD_SOFT),
        ("LINEBEFORE", (0, 0), (0, -1), 3, WARN_INK if warn else GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return [Spacer(1, 4), t, Spacer(1, 8)]


def settings_table(rows):
    data = [[P("Panel", "cellb"), P("Setting", "cellb"), P("Set it to", "cellb")]]
    data += [[P(a, "cell"), P(b, "cell"), P(c, "cell")] for a, b, c in rows]
    t = Table(data, colWidths=[32 * mm, 50 * mm, CONTENT_W - 82 * mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GOLD_SOFT),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e4dccb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def on_page(c, doc):
    c.saveState()
    c.setFillColor(GOLD)
    c.rect(0, H - 4, W, 4, stroke=0, fill=1)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(MUTED)
    c.drawString(18 * mm, 11 * mm, "The Treasure Capture Events  ·  Photographer guide: proofs & RAW selection")
    c.drawRightString(W - 18 * mm, 11 * mm, str(doc.page))
    c.restoreState()


story = []
add = story.extend

# ---------------------------------------------------------------- Cover
add([
    Spacer(1, 30 * mm),
    P("PHOTOGRAPHER GUIDE", "small"),
    Spacer(1, 4),
    P("From the shoot to the couple's picks, without uploading a single RAW", "title"),
    Spacer(1, 8),
    P("How to send light JPG proofs to the Treasure Capture website, and how to find exactly the "
      "photos the couple chose among your RAW files in Lightroom Classic.", "sub"),
    Spacer(1, 14 * mm),
    P("How it works", "h2"),
])
flow = Table([
    [P("<b>1. You export</b><br/>small JPGs from Lightroom (about 1 MB each)", "cell"),
     P("<b>2. You upload</b><br/>the JPGs to the event on our website", "cell"),
     P("<b>3. The couple picks</b><br/>their favourites in the online gallery", "cell"),
     P("<b>4. You filter</b><br/>Lightroom with their filename list and edit those RAWs", "cell")],
], colWidths=[CONTENT_W / 4] * 4)
flow.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), GOLD_SOFT),
    ("LINEAFTER", (0, 0), (-2, -1), 1, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
add([flow, Spacer(1, 10)])
add(callout(
    "<b>Your RAW files never leave your computer.</b> The website only ever holds the JPG proofs. "
    "The link between a proof and its RAW is the <b>filename</b>: <font face='Courier'>DSC_4821.jpg</font> on the "
    "website is <font face='Courier'>DSC_4821.NEF</font> on your drive. Everything in this guide is about keeping "
    "that name the same."))
add([
    P("What you need", "h2"),
    P("Adobe <b>Lightroom Classic</b> (the version with the Library and Develop modules). "
      "The newer cloud app called just \"Lightroom\" has different menus, and this guide does not cover it."),
    P("Shortcuts are written <b>Mac / Windows</b>, e.g. <b>Cmd+Shift+E / Ctrl+Shift+E</b>.", "small"),
    PageBreak(),
])

# ---------------------------------------------------------------- Part A
add([P("Part A: Make the export preset (one time only)", "h1"),
     P("You set this up once. After that, exporting proofs for any event is two clicks.")])
add([
    step(1, f"In the {k('Library')} module, select any one photo. Choose {k('File > Export...')} "
            f"or press {k('Cmd+Shift+E / Ctrl+Shift+E')}. The Export dialog opens."),
    Spacer(1, 4),
    step(2, f"At the very top of the dialog, make sure {k('Export To')} says {k('Hard Drive')}."),
    Spacer(1, 4),
    step(3, "Go down the panels on the right and set them as in the table below. "
            "Anything not listed can stay as it is."),
    Spacer(1, 6),
])
add(shot("01-export-dialog", "The whole Export dialog: preset list on the left, panels on the right, Export To: Hard Drive at the top.", 75 * mm))
add([settings_table([
    ("Export Location", "Export To", f"{k('Choose folder later (useful for presets)')}, so Lightroom asks where to save each time"),
    ("Export Location", "Add to This Catalog", "Unticked (the proofs don't need to be in your catalog)"),
    ("File Naming", "Rename To", f"<b>Unticked.</b> This is the most important setting in this guide."),
    ("File Settings", "Image Format", k("JPEG")),
    ("File Settings", "Quality", "80"),
    ("File Settings", "Color Space", k("sRGB")),
    ("File Settings", "Limit File Size To", "Unticked (see the note below)"),
    ("Image Sizing", "Resize to Fit", f"Ticked, choose {k('Long Edge')}, type <b>2048</b>, pixels"),
    ("Image Sizing", "Don't Enlarge", "Ticked"),
    ("Output Sharpening", "Sharpen For / Amount", f"{k('Screen')} / {k('Standard')}"),
    ("Metadata", "Include", f"{k('Copyright &amp; Contact Info Only')} (keeps your copyright; drops GPS and camera details)"),
    ("Watermark", "Watermark", "Unticked"),
    ("Post-Processing", "After Export", k("Do nothing")),
]), Spacer(1, 8)])
add(callout(
    f"<b>Why {k('Rename To')} must stay unticked:</b> if Lightroom renames the JPGs on export "
    "(e.g. to <font face='Courier'>Wedding-001.jpg</font>), the couple's picks will no longer match your RAW "
    "filenames and Part D will find nothing.", warn=True))
add(shot("02-file-naming-settings", "File Naming panel with Rename To unticked, and File Settings: JPEG, Quality 80, sRGB.", 55 * mm))
add(shot("03-image-sizing", "Image Sizing: Resize to Fit ticked, Long Edge, 2048 pixels, Don't Enlarge ticked.", 40 * mm))
add([P("About file size", "h2"),
     P("At 2048 px on the long edge and quality 80, most proofs come out at around 1 MB or less. "
       "The exact size depends on the photo: busy, detailed scenes are bigger than plain backgrounds. "
       f"We leave {k('Limit File Size To')} off on purpose, because a tight limit makes Lightroom lower the quality "
       "unevenly across the set.")])
add([
    step(4, f"Save these settings: at the bottom of the {k('Preset')} list on the left, click {k('Add')}. "
            f"Name the preset <b>Treasure Capture Proofs</b> and click {k('Create')}."),
    Spacer(1, 4),
    step(5, f"Close the dialog with {k('Cancel')} (nothing needs exporting yet). The preset is saved."),
    Spacer(1, 6),
])
add(shot("04-add-preset", "The Add button under the preset list, and the New Preset box with the name typed in.", 50 * mm))
add([PageBreak()])

# ---------------------------------------------------------------- Part B
add([P("Part B: After the event, export and upload the proofs", "h1")])
add([
    step(1, "Import the shoot into Lightroom Classic as you normally do. Remove the obvious rejects "
            "(blinks, misfires, test shots) so the couple only sees real options."),
    Spacer(1, 4),
    step(2, f"In {k('Library')}, open the event's folder and press {k('Cmd+A / Ctrl+A')} to select all its photos."),
    Spacer(1, 4),
    step(3, f"Choose {k('File > Export with Preset > Treasure Capture Proofs')}. "
            "Lightroom asks where to save. Make a new empty folder (e.g. <i>Sharma-Wedding-proofs</i>) and choose it."),
    Spacer(1, 4),
    step(4, "Wait for the progress bar at the top left of Lightroom to finish."),
    Spacer(1, 6),
])
add(shot("05-export-with-preset", "The File > Export with Preset menu showing the Treasure Capture Proofs preset.", 50 * mm))
add([
    step(5, "Open the folder and check a few files: names should be exactly like your RAWs "
            "(e.g. <font face='Courier'>DSC_4821.jpg</font>), and sizes around 1 MB."),
    Spacer(1, 4),
    step(6, "On the Treasure Capture website, open the event and upload everything in the proofs folder."),
    Spacer(1, 6),
])
add(shot("06-website-upload", "Treasure Capture website: the event's upload screen.", 45 * mm))
add(callout(
    "<b>Two cameras on one event?</b> Both can produce a file called <font face='Courier'>DSC_0001</font>. "
    f"Before Step 2, rename one camera's files in Lightroom with {k('Library > Rename Photos')} "
    "(e.g. add a <font face='Courier'>B_</font> prefix), so every filename in the event is unique."))
add([PageBreak()])

# ---------------------------------------------------------------- Part C
add([P("Part C: The couple picks, and you copy their list", "h1"),
     P("The couple opens their gallery on the website and marks their favourites. When they confirm, "
       "the event shows you their picks as a list of filenames in this format:"),
     Spacer(1, 4)])
example = Table([[Paragraph("DSC_4821, DSC_4830, DSC_4902, B_DSC_0112, B_DSC_0140", ParagraphStyle(
    "code", fontName="Courier", fontSize=10, leading=14, textColor=INK))]], colWidths=[CONTENT_W])
example.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f3f3f4")),
    ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
add([example, Spacer(1, 6),
     P("One line, names separated by a comma and a space, <b>no file extensions</b>. That's exactly what "
       "Lightroom's search box needs, so don't edit it. Copy the whole list "
       f"({k('Cmd+C / Ctrl+C')}). Note the number of photos the website says were picked."),
     Spacer(1, 4)])
add(shot("07-website-selection-list", "Treasure Capture website: the couple's picks and the copy-list button.", 45 * mm))

# ---------------------------------------------------------------- Part D
add([P("Part D: Find those exact RAWs in Lightroom Classic", "h1")])
add([
    step(1, f"Go to the {k('Library')} module (press {k('G')}). In the left panel, click the event's folder "
            f"under {k('Folders')} (or {k('All Photographs')} under {k('Catalog')} if the event spans several folders)."),
    Spacer(1, 4),
    step(2, f"Show the filter bar above the photos: {k('View > Show Filter Bar')}, or press the <b>backslash ( \\ )</b> key."),
    Spacer(1, 4),
    step(3, f"In the filter bar, click {k('Text')}. Set the first drop-down to {k('Filename')} and the second to {k('Contains')}."),
    Spacer(1, 4),
    step(4, f"Click in the search box and paste the list ({k('Cmd+V / Ctrl+V')}). "
            "The grid now shows only the couple's picks."),
    Spacer(1, 6),
])
add(shot("08-filter-bar-text", "Library filter bar: Text selected, Filename, Contains, with the pasted list in the search box.", 50 * mm))
add([
    step(5, "Check the count. The bar above the filmstrip at the bottom shows how many photos are displayed. "
            "It should match the number on the website. If not, see Troubleshooting."),
    Spacer(1, 4),
    step(6, f"Keep these picks together: press {k('Cmd+A / Ctrl+A')}, then {k('Library > New Collection...')}. "
            f"Name it (e.g. <i>Sharma Wedding: couple picks</i>), tick {k('Include selected photos')}, and click {k('Create')}."),
    Spacer(1, 4),
    step(7, f"Turn the filter off by clicking {k('None')} in the filter bar. Otherwise it stays on and hides photos elsewhere."),
    Spacer(1, 4),
    step(8, f"Open the new collection and edit those RAWs in {k('Develop')} as usual. Export your finals for the album."),
    Spacer(1, 6),
])
add(shot("09-filmstrip-count", "The filmstrip bar showing the number of photos displayed after filtering.", 30 * mm))
add(shot("10-new-collection", "The Create Collection box with 'Include selected photos' ticked.", 45 * mm))
add([PageBreak()])

# ---------------------------------------------------------------- Troubleshooting
add([P("Troubleshooting", "h1")])
rows = [
    ("Nothing shows up after pasting",
     "Usually one of these:<br/>• The list has line breaks. Paste it into Notes first and make it one line.<br/>"
     "• The list has <font face='Courier'>.jpg</font> extensions. Remove them.<br/>"
     "• One or more filenames contain a <b>space</b>. Lightroom's search doesn't handle spaces in a pasted list. "
     f"Rename the files with {k('Library > Rename Photos')} using underscores instead of spaces, then re-export the proofs.<br/>"
     "• You're in the wrong folder or collection on the left. Try All Photographs."),
    ("More photos show up than were picked",
     f"{k('Contains')} also matches part of a name, so <font face='Courier'>DSC_482</font> would also match "
     "<font face='Courier'>DSC_4821</font>. It also happens when two cameras made the same filename. "
     "Unique names (Part B, two cameras) prevent both."),
    ("Fewer photos show up than were picked",
     "A proof was renamed after export, or its RAW is in a folder you didn't select. Check the missing names one by one."),
    ("Photos are missing in other folders later",
     f"The text filter is still on. Click {k('None')} in the filter bar."),
    ("Proofs are much bigger than 1 MB",
     f"Check the preset: {k('Long Edge')} 2048 and Quality 80. Very detailed photos can still be a little over 1 MB, and that's fine."),
]
t = Table([[P(a, "cellb"), P(b, "cell")] for a, b in rows], colWidths=[48 * mm, CONTENT_W - 48 * mm])
t.setStyle(TableStyle([
    ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e4dccb")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
add([t, Spacer(1, 14)])
add([KeepTogether([
    P("Checklist for every event", "h2"),
    P("[  ] Rejects removed &nbsp;&nbsp; [  ] Unique filenames (two cameras?) &nbsp;&nbsp; [  ] Exported with the "
      "<b>Treasure Capture Proofs</b> preset &nbsp;&nbsp; [  ] Names match the RAWs &nbsp;&nbsp; [  ] Uploaded to the event "
      "&nbsp;&nbsp; [  ] After the couple picks: filter, check the count, make a collection, filter off"),
])])

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                        topMargin=18 * mm, bottomMargin=20 * mm,
                        title="Photographer guide: proofs and RAW selection",
                        author="The Treasure Capture Events")
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"wrote {OUT}")
