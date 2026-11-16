import pypdf

def extract_snippets(pdf_path, keywords):
    try:
        reader = pypdf.PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ''
            for kw in keywords:
                if kw.lower() in text.lower():
                    print(f"=== {pdf_path} Page {i+1} [Keyword: {kw}] ===")
                    # print paragraphs containing kw
                    for para in text.split('\n\n'):
                        if kw.lower() in para.lower():
                            print(para[:500])
                            print("---")
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")

print("--- MD DOCUMENT ---")
extract_snippets('erp complete documentation/erp complete documentation/ERP Documentation – 6. MD (Managing Director).pdf', ['file room', 'camera room', 'cctv', 'footage', 'pro ', 'government'])

print("--- AUDIT DOCUMENT ---")
extract_snippets('erp complete documentation/erp complete documentation/ERP Documentation – 5. Audit Department (1).pdf', ['hostel', 'cctv', 'file room'])

print("--- ADMIN SOP ---")
extract_snippets('erp complete documentation/support document/Admin SOP - Google Drive Links - 17.10.24.pdf', ['pro', 'file room', 'cctv'])

print("--- AUDIT SOP ---")
extract_snippets('erp complete documentation/support document/Audit SOP-17.08.25.pdf', ['hostel', 'cctv', 'file room', 'lost'])
