"""Builds the Obsidian Cinema User Guide PDF.

Screenshots: drop PNG/JPG files named after a placeholder id (e.g. 01-installer.png)
into /app/docs/guide_screenshots/ and re-run; matching placeholders are replaced.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, Image, KeepTogether, NextPageTemplate)
from reportlab.platypus.tableofcontents import TableOfContents

VERSION = "1.7.3"
OUT = "/app/frontend/public/Obsidian-Cinema-User-Guide.pdf"
SHOTS = "/app/docs/guide_screenshots"

F = "/usr/share/fonts/truetype/liberation/"
pdfmetrics.registerFont(TTFont("Sans", F + "LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", F + "LiberationSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Italic", F + "LiberationSans-Italic.ttf"))
pdfmetrics.registerFont(TTFont("Mono", F + "LiberationMono-Regular.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Sans", normal="Sans", bold="Sans-Bold", italic="Sans-Italic", boldItalic="Sans-Bold")

CRIMSON = colors.HexColor("#E11D48")
INK = colors.HexColor("#111318")
GREY = colors.HexColor("#5B616E")
LIGHT = colors.HexColor("#F4F5F7")

S = {
    "h1": ParagraphStyle("h1", fontName="Sans-Bold", fontSize=20, leading=25, textColor=INK, spaceBefore=4, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Sans-Bold", fontSize=13, leading=17, textColor=CRIMSON, spaceBefore=12, spaceAfter=5),
    "body": ParagraphStyle("body", fontName="Sans", fontSize=10, leading=14.5, textColor=INK, spaceAfter=6),
    "bullet": ParagraphStyle("bullet", fontName="Sans", fontSize=10, leading=14.5, textColor=INK, leftIndent=14, bulletIndent=3, spaceAfter=3),
    "step": ParagraphStyle("step", fontName="Sans", fontSize=10, leading=14.5, textColor=INK, leftIndent=18, bulletIndent=2, spaceAfter=3),
    "note": ParagraphStyle("note", fontName="Sans", fontSize=9.5, leading=13.5, textColor=INK),
    "small": ParagraphStyle("small", fontName="Sans", fontSize=8.5, leading=11, textColor=GREY),
    "toc1": ParagraphStyle("toc1", fontName="Sans", fontSize=10.5, leading=17, leftIndent=0, textColor=INK),
}

story = []
chapter_no = [0]


def h1(text):
    chapter_no[0] += 1
    p = Paragraph(f"{chapter_no[0]}. {text}", S["h1"])
    p._toc = f"{chapter_no[0]}. {text}"
    story.append(p)


def h2(text):
    story.append(Paragraph(text, S["h2"]))


def p(text):
    story.append(Paragraph(text, S["body"]))


def bullets(items):
    for t in items:
        story.append(Paragraph(t, S["bullet"], bulletText="\u2022"))
    story.append(Spacer(1, 4))


def steps(items):
    for i, t in enumerate(items, 1):
        story.append(Paragraph(t, S["step"], bulletText=f"{i}."))
    story.append(Spacer(1, 4))


def box(text, kind="tip"):
    tint = {"tip": colors.HexColor("#ECFDF5"), "warn": colors.HexColor("#FFF7ED"), "info": colors.HexColor("#EFF6FF")}[kind]
    edge = {"tip": colors.HexColor("#10B981"), "warn": colors.HexColor("#F59E0B"), "info": colors.HexColor("#3B82F6")}[kind]
    label = {"tip": "Tip", "warn": "Important", "info": "Note"}[kind]
    t = Table([[Paragraph(f"<b>{label}:</b> {text}", S["note"])]], colWidths=[170 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), tint), ("LINEBEFORE", (0, 0), (0, -1), 3, edge),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story.append(t)
    story.append(Spacer(1, 8))


def shot(sid, caption):
    for ext in (".png", ".jpg", ".jpeg"):
        path = os.path.join(SHOTS, sid + ext)
        if os.path.exists(path):
            from PIL import Image as PILImage
            src = PILImage.open(path).convert("RGB")
            src.thumbnail((1800, 1800))
            tmp = os.path.join("/tmp", sid + "-guide.jpg")
            src.save(tmp, "JPEG", quality=82, optimize=True)
            img = Image(tmp)
            ratio = img.imageHeight / float(img.imageWidth)
            w = 170 * mm
            h = w * ratio
            if h > 125 * mm:
                h = 125 * mm
                w = h / ratio
            img.drawWidth, img.drawHeight = w, h
            frame = Table([[img]], colWidths=[w + 2])
            frame.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#C9CDD4")),
                                       ("LEFTPADDING", (0, 0), (-1, -1), 1), ("RIGHTPADDING", (0, 0), (-1, -1), 1),
                                       ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
            story.append(KeepTogether([frame, Spacer(1, 3), Paragraph(caption, S["small"]), Spacer(1, 8)]))
            return
    t = Table([[Paragraph(f"<b>SCREENSHOT {sid}</b><br/>{caption}", ParagraphStyle("ph", parent=S["small"], alignment=1))]],
              colWidths=[170 * mm], rowHeights=[38 * mm])
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#C9CDD4"), None, (4, 3)),
                           ("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(t)
    story.append(Spacer(1, 10))


def table(rows, widths):
    th = ParagraphStyle("th", parent=S["note"], textColor=colors.white, fontName="Sans-Bold")
    data = [[Paragraph(c, th if i == 0 else S["note"]) for c in r] for i, r in enumerate(rows)]
    t = Table(data, colWidths=[w * mm for w in widths], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), INK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                           ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9DCE1")),
                           ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story.append(t)
    story.append(Spacer(1, 8))


# ───────────────────────── Content ─────────────────────────

h1("Welcome")
p("Obsidian Cinema is a Windows desktop app that turns the movie and TV files you already own into a beautiful, "
  "searchable library with posters, cast, ratings and one-click playback. Instead of scrolling through endless folders "
  "in Windows Explorer, you browse your collection as a poster wall.")
box("Obsidian Cinema does not supply, stream or download any movies. It organizes and plays the video files that are "
    "already on your own drives, USB disks or network storage (NAS).", "info")
h2("What you need")
bullets(["A Windows 10 or Windows 11 PC.",
         "Your own video files (MP4, MKV, AVI, MOV, WMV, FLV, WEBM, M4V, MPG, MPEG, 3GP or TS).",
         "A free TMDB API key, used to fetch posters, cast and ratings (chapter 3).",
         "A video player such as the Windows Media Player, VLC or MPC-HC. Obsidian Cinema opens files in your default player."])
h2("Free and Pro")
table([["", "Free", "Pro (one-time $25)"],
       ["Library size", "Organize up to 500 of your own files", "No limit on library size"],
       ["Collections", "Up to 3", "Unlimited"],
       ["All other features", "Included", "Included, plus priority support"]], [40, 62, 68])

h1("Installing Obsidian Cinema")
steps(["Download the installer from the Obsidian Cinema website (Download for Windows).",
       "Run the downloaded <b>.exe</b> file. If Windows SmartScreen shows \u201cWindows protected your PC\u201d, click "
       "<b>More info</b> and then <b>Run anyway</b>.",
       "Follow the installer. Obsidian Cinema opens when it finishes and adds a Start menu and desktop shortcut."])
shot("01-installer", "First launch: the welcome guide on an empty library.")
box("Open Obsidian Cinema normally. Avoid \u201cRun as administrator\u201d: Windows hides mapped network drives from "
    "programs run as administrator, so your NAS drives may not appear.", "warn")
h2("Updates")
p("The app checks for updates automatically and tells you when a new version is ready. You can also check at any time "
  "in <b>Settings \u203a App Updates \u203a Check for Updates</b>. After an update, a <b>What\u2019s New</b> window lists the changes.")

h1("Getting a free TMDB API key")
p("The Movie Database (TMDB) provides the posters, plots, cast, genres and ratings shown in your library. A personal key "
  "is free and takes a couple of minutes.")
steps(["Create a free account at <b>themoviedb.org</b> and sign in.",
       "Open your account <b>Settings \u203a API</b> and request an API key (choose \u201cDeveloper\u201d, personal use).",
       "Copy the <b>API Key</b> (the short key, not the long \u201cRead Access Token\u201d).",
       "In Obsidian Cinema open <b>Settings \u203a TMDB API Key</b>, paste the key and save."])
shot("02-tmdb-key", "Settings \u203a TMDB API Key with a key saved.")
p("Until a key is added, the library shows an \u201cAdd your TMDB API key\u201d banner and titles appear without posters.")

h1("Adding your collection")
p("When your library is empty, the Library page shows a three-step welcome guide. There are three ways to add files:")
table([["Method", "Best for", "Rescanned by Update Library?"],
       ["<b>Add Folder</b> (top of the Library)", "Your movie or TV folders \u2013 one, or several at once", "Yes"],
       ["<b>Drag and drop</b> a folder onto the window", "Quick adding from Windows Explorer", "Yes"],
       ["<b>Tools \u203a Add files\u2026</b> (or drop single files)", "A few loose files, e.g. one film in Downloads", "No"]], [62, 62, 46])
h2("Add Folder, step by step")
steps(["Click <b>Add Folder</b>.",
       "<b>Step 1 \u2013 choose what the folder contains</b>: Movies, TV Shows, Documentaries or Animations. "
       "The Scan button stays greyed out until you choose.",
       "<b>Step 2 \u2013 pick the folder</b>: click a drive and open folders, or type a path such as <font face='Mono'>E:\\TV Shows</font> "
       "or <font face='Mono'>\\\\NAS\\Media</font> and press <b>Enter</b>. You can also click <b>Choose with Windows\u2026</b> "
       "to use the normal Windows folder picker.",
       "To add more folders of the same type, click <b>Add another folder</b> and pick the next one. "
       "<b>Choose with Windows\u2026</b> also lets you tick several folders at once.",
       "Click <b>Scan</b>. Every subfolder, such as seasons and extras, is included.",
       "Posters, cast and ratings are fetched automatically in the background."])
shot("03-add-folder", "The Add Folder window: Step 1 type picker, path box, drive list and Scan button.")
box("Add the top folder of a collection (for example <font face='Mono'>E:\\TV Shows</font>) rather than single seasons. "
    "Update Library then finds new episodes and seasons for you.", "tip")
h2("Recommended folder layout")
p("Obsidian Cinema reads names like <font face='Mono'>Movie Title (2010).mkv</font> and "
  "<font face='Mono'>Show Name\\Season 1\\S01E01.mkv</font> most reliably.")
table([["Type", "Example"],
       ["Movies", "<font face='Mono'>E:\\Movies\\Inception (2010)\\Inception (2010).mkv</font>"],
       ["TV Shows", "<font face='Mono'>E:\\TV Shows\\Severance\\Season 1\\Severance S01E01.mkv</font>"],
       ["Multi-part films", "<font face='Mono'>Film (1999) Part 1.mkv</font>, <font face='Mono'>Film (1999) Part 2.mkv</font>"]], [36, 134])

h1("Folder types and categories")
p("Every library folder has a type: <b>Movies</b>, <b>TV Shows</b>, <b>Documentaries</b> or <b>Animations</b>. "
  "The type decides which category its titles appear in and how files are grouped (TV shows become one card per show).")
bullets(["The coloured category buttons in the library bar filter by type; each opens a list of its folders.",
         "The header shows a count per category, e.g. \u201c18,000 Movies \u00b7 1,240 TV Shows \u00b7 6 folders\u201d.",
         "Change a folder\u2019s type in <b>Manage Directories</b> (the gear icon next to the category buttons)."])
h2("Moving a single title to another category")
steps(["Hover a poster and click the <b>\u22ee</b> button in its top-right corner.",
       "Choose <b>Move to</b> Movies, TV Shows, Documentaries or Animations.",
       "To move many at once, open <b>Tools \u203a Select titles</b>, click the posters, then use <b>Move to\u2026</b> in the bar at the bottom."])
p("Your choice sticks, even after Update Library. Choose <b>Back to folder\u2019s type</b> to undo it.")

h1("Browsing the library")
shot("04-library", "The Library page: header with counts, Add Folder / Update Library / Tools, and the library bar.")
h2("The header")
p("Shows the category counts and three main buttons: <b>Add Folder</b>, <b>Update Library</b> and <b>Tools</b>. "
  "The Tools button shows an amber badge when something needs your attention.")
h2("The library bar")
bullets(["<b>Search</b> by title, year or actor.",
         "<b>All</b> and the category buttons filter by type or folder.",
         "<b>Genre</b> and <b>Sort</b> (Recently Added, Title, Year, Rating, by Directory and more).",
         "Status chips appear while tasks run (e.g. \u201cEnriching 34%\u201d with a Pause button) or when drives are offline.",
         "The bar stays at the top of the screen as you scroll."])
h2("Quick Filters (sidebar)")
p("Favorites, No Poster, No Rating, No Year, No Genre, Recently Added and, when a drive is missing, Offline Drives.")
h2("Posters and favourites")
bullets(["Click a poster to open its details. Hover and click <b>Play</b> to start it straight away.",
         "Click the star to add a favourite.",
         "Hovering a poster tilts it and tints the background with its colours. Large libraries use lighter effects automatically "
         "(see Settings \u203a Library Visual Effects)."])

h1("Title details and playback")
shot("05-details", "The details window with poster, plot, cast, ratings and Play button.")
bullets(["<b>Play (Default Player)</b> opens the file in your default video player.",
         "Click any actor or the director to see their films in your library and films you don\u2019t have yet.",
         "<b>Reset Metadata</b> clears the match so the title can be matched again.",
         "Ratings show where they came from (TMDB, or IMDb via Wikidata when TMDB has no rating)."])
box("If a title shows the wrong movie, open <b>Tools \u203a Check uncertain matches</b>. It lists titles the app was unsure about so you can "
    "pick the right match.", "tip")

h1("TV shows, seasons and multi-part titles")
bullets(["In a TV Shows folder each show becomes one card. Open it to see seasons and episodes and play any of them.",
         "Files named Part 1, Part 2 (or CD1, CD2) are combined into one card; Play asks which part to start.",
         "Extras and bonus folders are kept with their show or film.",
         "<b>Tools \u203a Combine multi-part titles</b> suggests files that belong together. After Update Library, new episodes "
         "for existing shows are offered for merging."])
shot("06-tv-show", "A TV show\u2019s details window, scrolled to its seasons and episodes \u2013 each one can be played.")

h1("Keeping your library up to date")
p("Whenever you copy new films or episodes into a library folder, click <b>Update Library</b>. It rescans every library "
  "folder, including subfolders, then:")
bullets(["adds new video files and matches them with TMDB;",
         "removes titles whose files you deleted;",
         "offers to merge new episodes into the shows you already have."])
box("Files added with <b>Add files\u2026</b> are not inside a library folder, so Update Library does not look next to them. "
    "If you added TV seasons one at a time, add the show\u2019s main folder once with <b>Add Folder</b>. Existing "
    "titles are not duplicated.", "warn")
p("If a drive or NAS can\u2019t be reached during Update Library, its titles are kept and a message says which folder was "
  "skipped. Connect it and click Update Library again.")
h2("Metadata tools (Tools menu)")
table([["Tool", "What it does"],
       ["Fetch posters", "Downloads posters for titles that don\u2019t have one."],
       ["Enrich details", "Adds cast, director, runtime and genres to titles missing them."],
       ["Fix missing info", "Fills missing ratings, years or genres (from TMDB, with Wikidata as a backup)."],
       ["Auto-fill missing info", "Turns background filling on or off."],
       ["Check uncertain matches", "Shows titles the app was unsure about so you can confirm them."],
       ["File names with a different year", "Offers to rename files whose year differs from TMDB. You confirm before anything is renamed."],
       ["Export list as PDF", "Creates a printable list of the titles currently shown."]], [52, 118])

h1("Drives, network storage and offline drives")
bullets(["Add Folder lists every drive letter, including USB, external and mapped network drives.",
         "Network shares can be typed directly, e.g. <font face='Mono'>\\\\NAS\\Media</font>.",
         "The app checks your drives when it opens, every minute and after Update Library."])
h2("When a drive is disconnected")
bullets(["Its titles stay in the library, dimmed, with a <b>Drive offline</b> badge. Play waits until the drive is back.",
         "An amber chip such as \u201c2 drives offline\u201d appears in the library bar, and <b>Offline Drives</b> appears under Quick Filters. "
         "Both show the missing titles grouped by drive.",
         "When the drive returns, the badges clear and a \u201cback online\u201d message appears."])
h2("Drive nicknames")
p("Give drives friendly names such as \u201cBlue USB\u201d or \u201cLiving-room NAS\u201d using the pencil next to a drive in the "
  "Offline Drives view or in <b>Manage Directories \u203a Drives</b>. Names follow the drive letter or share path.")
shot("07-drives", "Manage Directories: folders with their types, and the Drives list with nicknames (E:\\ is offline).")

h1("Collections, Stats and insights")
h2("Collections")
p("Group titles into your own collections (for example \u201cChristmas\u201d or \u201cKids\u201d) from the <b>Collections</b> page or a "
  "title\u2019s details. Free accounts can create up to 3 collections; Pro is unlimited.")
h2("Stats")
p("The <b>Stats</b> page shows counts and running time per type, library growth, ratings, decades, file formats and "
  "titles per folder, plus <b>Director Insights</b> and <b>Cast Insights</b> with clickable filmographies.")
shot("08-stats", "The Stats page with type statistics and Director Insights.")

h1("Settings")
table([["Section", "What you can change"],
       ["TMDB API Key", "Add or replace your key."],
       ["Appearance", "Choose an accent colour theme (Crimson, Ocean Blue, Emerald and more)."],
       ["Library Visual Effects", "Auto (lighter effects above 3,000 titles), Full or Lite."],
       ["Library Management", "Backups, restore and library maintenance."],
       ["Duplicate Detection", "Find files that appear more than once."],
       ["License", "Activate or check your Pro license."],
       ["App Updates", "Check for and install updates."]], [52, 118])

h1("Backups and restoring")
p("Your library (titles, matches, favourites and collections) is saved on your PC. Make a backup regularly, and always "
  "before reinstalling Windows or moving to a new PC.")
steps(["Open <b>Settings \u203a Library Management</b> and click <b>Export to File</b>. The backup is saved to your Downloads folder as "
       "<font face='Mono'>obsidian-cinema-backup-YYYY-MM-DD.json</font>. Copy it somewhere safe, such as a USB stick or cloud folder.",
       "To restore, click <b>Import from File</b>, pick the backup file, review what it contains and confirm."])
p("Titles removed from the library go to <b>Recently Deleted</b> and can be restored for 30 days. Your video files on disk are "
  "never deleted by removing a title.")
box("Drive nicknames and visual-effect choices are stored on the PC and are not part of the backup file.", "info")

h1("Pro license")
steps(["Buy Pro on the website (one-time $25). Your license key is emailed to you and shown in your account dashboard.",
       "In the app open <b>Settings \u203a License</b> (or the activation page) and enter the key.",
       "The free limits are removed immediately."])
p("Each license is linked to one PC. To move it to a new PC, deactivate it on the old PC first, or contact support.")

h1("Troubleshooting")
def faq(q, a):
    story.append(KeepTogether([Paragraph(f"<b>{q}</b>", S["body"]), Paragraph(a, S["body"]), Spacer(1, 2)]))
faq("Only some of my drives appear in Add Folder.",
    "Update to version 1.7.3 or later, which lists every drive letter. Open the app normally rather than with \u201cRun as "
    "administrator\u201d, and make sure USB and network drives are connected. You can also type the path or use <b>Choose with Windows\u2026</b>.")
faq("Typing a path says the folder can\u2019t be found or opened.",
    "Press <b>Enter</b> or <b>Go</b> after typing. Check the spelling and that the drive is connected. For network storage use the "
    "full path, e.g. <font face='Mono'>\\\\NAS\\Media</font>. \u201cAccess denied\u201d means Windows won\u2019t let the app read that folder.")
faq("The Scan button is greyed out.",
    "Choose the folder type in Step 1 (Movies, TV Shows, Documentaries or Animations) and make sure a folder is selected.")
faq("New episodes don\u2019t appear after Update Library.",
    "Update Library only rescans library folders. Add the show\u2019s main folder with <b>Add Folder</b>, then run it again.")
faq("Update Library says some folders couldn\u2019t be opened, but all my drives are connected.",
    "Click <b>Show which</b> on the message, or the amber <b>folders skipped</b> chip in the library bar, to see each folder and why. "
    "\u201cAccess denied\u201d usually means a protected or private folder \u2013 if it holds media, right-click it in Explorer \u203a "
    "Properties \u203a Security and give your account Read access; otherwise it\u2019s safe to ignore. Nothing is removed from your library "
    "because of these folders.")
faq("Titles have no posters.",
    "Add your TMDB API key (chapter 3), then use <b>Tools \u203a Fetch posters</b>. Check your internet connection.")
faq("A title is matched to the wrong movie.",
    "Open its details and use <b>Reset Metadata</b>, or <b>Tools \u203a Check uncertain matches</b>. Renaming the file to "
    "<font face='Mono'>Title (Year).ext</font> gives the best results.")
faq("A title shows \u201cDrive offline\u201d.",
    "Connect the drive or wake your NAS. The badge clears within about a minute, or straight away after Update Library.")
faq("Play does nothing or opens the wrong program.",
    "Obsidian Cinema uses your Windows default app for the file type. Right-click a video in Explorer \u203a Open with \u203a "
    "Choose another app, pick your player and tick \u201cAlways use this app\u201d.")
faq("The library feels slow with a very large collection.",
    "Set <b>Settings \u203a Library Visual Effects</b> to Lite or Auto. Auto already lightens effects above 3,000 titles.")
faq("I reinstalled Windows or moved to a new PC.",
    "Install Obsidian Cinema, restore your backup file (chapter 13) and re-activate Pro after deactivating it on the old PC.")

h1("Getting help")
p("Visit the Obsidian Cinema website for the FAQ and the latest version. If you need help, email support with your app version "
  "(shown in the status bar at the bottom right), a short description of the problem and, if possible, a screenshot.")

# ───────────────────────── Layout ─────────────────────────

PAGES = {}
KEYS = ["welcome", "install", "tmdb", "adding", "types", "browsing", "details", "tv", "updating", "drives",
        "collections", "settings", "backups", "pro", "troubleshooting", "help"]


class Doc(BaseDocTemplate):
    def afterFlowable(self, f):
        if hasattr(f, "_toc"):
            PAGES[KEYS[int(f._toc.split(".")[0]) - 1]] = self.page
            key = "ch%d" % id(f)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(f._toc, key, 0)
            self.notify("TOCEntry", (0, f._toc, self.page, key))


def cover(c, d):
    c.saveState()
    c.setFillColor(INK); c.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    c.setFillColor(CRIMSON); c.rect(0, A4[1] * 0.52, 8 * mm, 60 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont("Sans-Bold", 34)
    c.drawString(25 * mm, A4[1] * 0.62, "Obsidian Cinema")
    c.setFont("Sans", 18); c.setFillColor(colors.HexColor("#E5E7EB"))
    c.drawString(25 * mm, A4[1] * 0.62 - 13 * mm, "User Guide")
    c.setFont("Sans", 11); c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawString(25 * mm, A4[1] * 0.62 - 24 * mm, f"For version {VERSION} \u00b7 Windows desktop app")
    c.drawString(25 * mm, 25 * mm, "A movie collection manager for the video files you already own.")
    c.restoreState()


def page(c, d):
    c.saveState()
    c.setStrokeColor(colors.HexColor("#E5E7EB")); c.line(20 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
    c.setFont("Sans", 8); c.setFillColor(GREY)
    c.drawString(20 * mm, 10 * mm, f"Obsidian Cinema User Guide \u00b7 v{VERSION}")
    c.drawRightString(A4[0] - 20 * mm, 10 * mm, str(d.page))
    c.restoreState()


def build():
    doc = Doc(OUT, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=22 * mm,
              title="Obsidian Cinema User Guide", author="Obsidian Cinema")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate("cover", [frame], onPage=cover), PageTemplate("page", [frame], onPage=page)])
    toc = TableOfContents()
    toc.levelStyles = [S["toc1"]]
    flow = [NextPageTemplate("page"), PageBreak(), Paragraph("Contents", S["h1"]), toc, PageBreak()]
    # Each chapter starts on a new page
    for f in story:
        if hasattr(f, "_toc") and not f._toc.startswith("1. "):
            flow.append(PageBreak())
        flow.append(f)
    doc.multiBuild(flow)
    import json
    with open("/app/frontend/src/lib/guidePages.json", "w") as fh:
        json.dump(PAGES, fh, indent=1)


if __name__ == "__main__":
    os.makedirs(SHOTS, exist_ok=True)
    build()
    print("Wrote", OUT)
