# Génère ../catalogue-site/liseuse/ : liseuse « feuilletage » du catalogue (StPageFlip, licence MIT).
# Chaque page des PDF FR/EN est convertie en deux images WebP (m = affichage, l = zoom).
# Le dossier des images porte une empreinte du PDF : un PDF modifié = nouvelles URL, pas de souci de cache.
# Nécessite PyMuPDF (pip install pymupdf) et Pillow.
import hashlib,io,json,os,shutil
import fitz
from PIL import Image

OUT='../catalogue-site/liseuse'
PDFS={'fr':'../public/catalogue/Cuillere-dOr-Catalogue-2027-2028-FR.pdf',
      'en':'../public/catalogue/Cuillere-dOr-Catalogue-2027-2028-EN.pdf'}
SIZES={'m':(1000,78),'l':(1800,80)}  # largeur en px, qualité WebP

def render(lang,pdf):
    h=hashlib.sha1(open(pdf,'rb').read()).hexdigest()[:8]
    rel='pages/%s-%s'%(lang,h); d=OUT+'/'+rel; os.makedirs(d,exist_ok=True)
    doc=fitz.open(pdf); r=doc[0].rect
    for i,page in enumerate(doc):
        for k,(w,q) in SIZES.items():
            f='%s/%02d-%s.webp'%(d,i+1,k)
            if os.path.exists(f): continue
            pix=page.get_pixmap(matrix=fitz.Matrix(w/page.rect.width,w/page.rect.width),alpha=False)
            Image.open(io.BytesIO(pix.tobytes('png'))).save(f,'WEBP',quality=q,method=4)
    return {'dir':rel,'n':len(doc),'w':round(r.width),'h':round(r.height)}

def build():
    os.makedirs(OUT,exist_ok=True)
    m={lang:render(lang,pdf) for lang,pdf in PDFS.items()}
    s=open('liseuse/index.html',encoding='utf8').read()
    assert s.count('__MANIFEST__')==1
    open(OUT+'/index.html','w',encoding='utf8').write(s.replace('__MANIFEST__',json.dumps(m)))
    for f in ['page-flip.browser.js','LICENSE-page-flip.txt']: shutil.copy('liseuse/'+f,OUT+'/'+f)
    shutil.copy('images/logo-site.png',OUT+'/logo.png')
    kb=sum(os.path.getsize(os.path.join(r,f)) for r,_,fs in os.walk(OUT) for f in fs)//1024
    print('liseuse :',', '.join('%s %d pages'%(k,v['n']) for k,v in m.items()),'·',kb,'Ko')

if __name__=='__main__': build()
