"""Decode the pinned MEXT workbooks using Python 3's standard library.

Only cell text and cached scalar values are read. Formulas are not evaluated.
Phonetic rPh text is deliberately excluded from names and headings.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def visible_text(element):
    if element is None:
        return ""
    return "".join(t.text or "" for t in element.findall("m:t", NS)
                   + element.findall("m:r/m:t", NS))


def read_workbook(filename):
    with zipfile.ZipFile(filename) as archive:
        if sum(entry.file_size for entry in archive.infolist()) > 128 * 1024 * 1024:
            raise ValueError("Workbook exceeds the source inspection bound")
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = [visible_text(si) for si in ET.fromstring(
                archive.read("xl/sharedStrings.xml")).findall("m:si", NS)]
        sheets = {}
        for name in archive.namelist():
            if not re.fullmatch(r"xl/worksheets/sheet[0-9]+\.xml", name):
                continue
            rows = []
            for row in ET.fromstring(archive.read(name)).findall("m:sheetData/m:row", NS):
                values = {}
                for cell in row.findall("m:c", NS):
                    value = cell.find("m:v", NS)
                    if value is None:
                        text = visible_text(cell.find("m:is", NS))
                    elif cell.get("t") == "s":
                        text = shared[int(value.text)]
                    else:
                        text = value.text or ""
                    if text:
                        values[re.sub(r"[0-9]+$", "", cell.get("r"))] = text
                if values:
                    rows.append(values)
            sheets[name.rsplit("/", 1)[-1]] = rows
        return sheets


if __name__ == "__main__":
    print(json.dumps(read_workbook(sys.argv[1]), ensure_ascii=False))
