"""Build the public resume variants from the shared content file.

Run with reportlab==5.0.1 and pypdf==6.16.2 installed.
"""

from collections import defaultdict
from hashlib import sha256
from html import escape
from io import BytesIO
import json
from pathlib import Path

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, BooleanObject, DictionaryObject, NameObject, NumberObject, TextStringObject

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/data/resumeContent.json'
OUTPUT = ROOT / 'public/resumes'
DATA = json.loads(SOURCE.read_text())
PERSON = DATA['person']
FONT_DIRECTORY = Path(reportlab.__file__).parent / 'fonts'
for name, filename in [('Resume', 'Vera.ttf'), ('Resume-Bold', 'VeraBd.ttf'), ('Resume-Italic', 'VeraIt.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIRECTORY / filename)))
pdfmetrics.registerFontFamily('Resume', normal='Resume', bold='Resume-Bold', italic='Resume-Italic', boldItalic='Resume-Bold')


class TaggedParagraph(Paragraph):
    def __init__(self, *arguments, tag='P', **keywords):
        self.resume_tag = tag
        super().__init__(*arguments, **keywords)

    def draw(self):
        canvas = self.canv
        if not hasattr(canvas, 'resume_tags'):
            canvas.resume_tags = defaultdict(list)
        entries = canvas.resume_tags[canvas.getPageNumber()]
        index = len(entries)
        entries.append(self.resume_tag)
        canvas._code.append(f'/{self.resume_tag} <</MCID {index}>> BDC')
        super().draw()
        canvas._code.append('EMC')


def text(value):
    return escape(value).replace('\n', '<br/>')


def pdf_dictionary(values):
    return DictionaryObject({NameObject(key): value for key, value in values.items()})


def tagged_document(raw, tags, variant):
    reader = PdfReader(BytesIO(raw))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    structure = pdf_dictionary({'/Type': NameObject('/StructTreeRoot')})
    structure_ref = writer._add_object(structure)
    document = pdf_dictionary({'/Type': NameObject('/StructElem'), '/S': NameObject('/Document'), '/P': structure_ref})
    document_ref = writer._add_object(document)
    children = ArrayObject()
    numbers = ArrayObject()
    for page_index, page in enumerate(writer.pages):
        page[NameObject('/StructParents')] = NumberObject(page_index)
        parents = ArrayObject()
        for index, tag in enumerate(tags[page_index + 1]):
            element = pdf_dictionary({
                '/Type': NameObject('/StructElem'), '/S': NameObject('/' + tag),
                '/P': document_ref, '/Pg': page.indirect_reference, '/K': NumberObject(index),
            })
            reference = writer._add_object(element)
            children.append(reference)
            parents.append(reference)
        numbers.extend([NumberObject(page_index), writer._add_object(parents)])
    document[NameObject('/K')] = children
    structure[NameObject('/K')] = document_ref
    structure[NameObject('/ParentTree')] = writer._add_object(pdf_dictionary({'/Nums': numbers}))
    structure[NameObject('/ParentTreeNextKey')] = NumberObject(len(writer.pages))
    writer._root_object[NameObject('/StructTreeRoot')] = structure_ref
    writer._root_object[NameObject('/MarkInfo')] = pdf_dictionary({'/Marked': BooleanObject(True)})
    writer._root_object[NameObject('/Lang')] = TextStringObject('en-US')
    writer._root_object[NameObject('/ViewerPreferences')] = pdf_dictionary({'/DisplayDocTitle': BooleanObject(True)})
    date = 'D:' + DATA['updated'].replace('-', '') + '000000Z'
    writer.add_metadata({
        '/Title': f"Vraj Patel - {variant['label']}", '/Author': PERSON['name'],
        '/Subject': variant['headline'], '/Creator': 'Resume builder',
        '/CreationDate': date, '/ModDate': date,
    })
    result = BytesIO()
    writer.write(result)
    return result.getvalue()


def build(variant):
    master = variant['id'] == 'master'
    size = 9.5 if not master else 9.7
    leading = 11.6 if not master else 12.4
    ink = colors.HexColor('#17212d')
    muted = colors.HexColor('#465261')
    accent = colors.HexColor('#3148da')
    styles = {
        'body': ParagraphStyle('body', fontName='Resume', fontSize=size, leading=leading, textColor=ink, spaceAfter=1.8),
        'bullet': ParagraphStyle('bullet', fontName='Resume', fontSize=size, leading=leading, textColor=ink, leftIndent=9, firstLineIndent=-9, spaceAfter=1.8),
        'name': ParagraphStyle('name', fontName='Resume-Bold', fontSize=22, leading=25, textColor=ink, spaceAfter=3),
        'headline': ParagraphStyle('headline', fontName='Resume-Bold', fontSize=10, leading=13.5, textColor=accent, spaceAfter=4),
        'contact': ParagraphStyle('contact', fontName='Resume', fontSize=8.3, leading=11, textColor=muted, spaceAfter=5),
        'section': ParagraphStyle('section', fontName='Resume-Bold', fontSize=10.2, leading=13, textColor=accent, spaceBefore=6.5, spaceAfter=3.5, keepWithNext=True),
        'entry': ParagraphStyle('entry', fontName='Resume-Bold', fontSize=size, leading=leading, textColor=ink, keepWithNext=True),
        'date': ParagraphStyle('date', fontName='Resume', fontSize=8.3, leading=leading, textColor=muted, alignment=TA_RIGHT),
        'organization': ParagraphStyle('organization', fontName='Resume-Italic', fontSize=8.7, leading=11.3, textColor=muted, spaceAfter=3, keepWithNext=True),
    }
    paragraph = lambda value, style='body', tag='P': TaggedParagraph(value, styles[style], tag=tag)
    story = [paragraph(text(PERSON['name']), 'name', 'H1'), paragraph(text(variant['headline']), 'headline')]
    story.append(paragraph(
        f"{text(PERSON['location'])} | {text(PERSON['citizenship'])} | "
        '<link href="https://www.vrajmpatel.com" color="#3148da">vrajmpatel.com</link> | '
        '<link href="https://www.linkedin.com/in/vrajmp/" color="#3148da">linkedin.com/in/vrajmp</link><br/>'
        'GitHub: <link href="https://github.com/basechildren" color="#3148da">basechildren</link> | '
        '<link href="https://github.com/PatVraj" color="#3148da">PatVraj</link>', 'contact'))
    if master:
        story.append(paragraph(text(variant['summary'])))

    def section(label):
        story.append(paragraph(label.upper(), 'section', 'H2'))

    def entry(title, date=None, organization=None):
        if date:
            row = Table([[paragraph(text(title), 'entry', 'H3'), paragraph(text(date), 'date')]], colWidths=[383, 145])
            row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
            row.keepWithNext = True
            story.append(row)
        else:
            story.append(paragraph(text(title), 'entry', 'H3'))
        if organization:
            story.append(paragraph(text(organization), 'organization'))

    section('Experience')
    experiences = {item['id']: item for item in DATA['experience']}
    for selection in variant['experience']:
        item = experiences[selection['id']]
        entry(item['title'], item['period'], item['organization'])
        for key in selection['bullets']:
            story.append(paragraph('&#8226; ' + text(item['bullets'][key]), 'bullet'))
        story.append(Spacer(1, 3))
    if master:
        story.append(PageBreak())

    section('Selected projects' if not master else 'Projects')
    projects = {item['id']: item for item in DATA['projects']}
    for selection in variant['projects']:
        item = projects[selection['id']]
        entry(item['title'], organization=item['tech'])
        for key in selection['bullets']:
            story.append(paragraph('&#8226; ' + text(item['bullets'][key]), 'bullet'))
        story.append(Spacer(1, 2))

    section('Education')
    for item in DATA['education']:
        entry(item['degree'], item['date'])
        story.append(paragraph(text(item['detail']), 'organization'))

    section('Technical skills')
    for key in variant['skillGroups']:
        story.append(paragraph(f'<b>{text(key)}:</b> {text(DATA["skills"][key])}'))

    def footer(canvas, _doc):
        canvas._code.append('/Artifact BMC')
        canvas.setStrokeColor(colors.HexColor('#d4d9e1'))
        canvas.setLineWidth(0.4)
        canvas.line(42, 27, 570, 27)
        canvas.setFont('Resume', 7.1)
        canvas.setFillColor(muted)
        canvas.drawString(42, 16, 'Vraj Patel | ' + variant['label'])
        canvas.drawRightString(570, 16, f'{canvas.getPageNumber()} / {variant["pages"]}')
        canvas._code.append('EMC')

    stream = BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=letter, leftMargin=42, rightMargin=42,
                            topMargin=31, bottomMargin=36, title='Vraj Patel', author=PERSON['name'],
                            allowSplitting=True, pageCompression=1, invariant=1)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    result = tagged_document(stream.getvalue(), doc.canv.resume_tags, variant)
    check = PdfReader(BytesIO(result))
    if len(check.pages) != variant['pages']:
        raise ValueError(f'{variant["id"]}: expected {variant["pages"]} pages, got {len(check.pages)}; overflow: {check.pages[-1].extract_text()[:450]}')
    assert check.trailer['/Root']['/StructTreeRoot']['/K']
    assert check.metadata['/Author'] == PERSON['name']
    extracted = '\n'.join(page.extract_text() for page in check.pages)
    assert extracted.startswith(PERSON['name'])
    assert 'Expected May 2028' in extracted
    assert '@' not in extracted
    path = OUTPUT / (variant['id'] + '.pdf')
    path.write_bytes(result)
    print(f'{path.relative_to(ROOT)}: {len(check.pages)} page(s), {len(extracted.split())} words, tagged')
    return {'variant': variant['id'], 'pages': len(check.pages), 'words': len(extracted.split()), 'sha256': sha256(result).hexdigest()}


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    reports = [build(variant) for variant in DATA['variants']]
    (ROOT / 'public/resume.pdf').write_bytes((OUTPUT / 'software.pdf').read_bytes())
    print(json.dumps(reports, indent=2))
