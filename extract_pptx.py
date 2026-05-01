import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text_from_pptx(pptx_path):
    namespaces = {
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'
    }
    
    text_content = []
    
    with zipfile.ZipFile(pptx_path, 'r') as archive:
        slide_names = [f for f in archive.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
        
        # Sort slides by number
        try:
            slide_names.sort(key=lambda x: int(x.split('slide')[1].split('.xml')[0]))
        except ValueError:
            pass
            
        for slide_name in slide_names:
            xml_content = archive.read(slide_name)
            root = ET.fromstring(xml_content)
            
            slide_text = []
            for node in root.findall('.//a:t', namespaces):
                text = node.text
                if text and text.strip():
                    slide_text.append(text.strip())
            
            if slide_text:
                text_content.append(f"--- Slide {slide_name} ---")
                # Group text loosely by concatenating
                text_content.append("\n".join(slide_text))
                
    return "\n".join(text_content)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python extract.py <path_to_pptx>")
        sys.exit(1)
        
    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"File not found: {path}")
        sys.exit(1)
        
    with open('extracted_pptx.txt', 'w', encoding='utf-8') as f:
        f.write(extract_text_from_pptx(path))
    print("Done. Saved to extracted_pptx.txt")
