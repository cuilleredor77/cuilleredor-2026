# Génère ../catalogue-site (dossier à déposer sur Cloudflare Pages) depuis index.merged.html :
# index.html + bouton de téléchargement PDF, images utilisées, PDF, _headers.
import re,os,shutil,glob
OUT='../catalogue-site'
s=open('index.merged.html',encoding='utf8').read()
btn=r'''<div class="pdf-menu" id="pdf-menu">
  <div class="pdf-panel" id="pdf-panel" hidden>
    <a id="pdf-dl" href="pdf/Catalogue-Cuillere-dOr-2027-2028-FR.pdf?v=7" download><b id="pdf-full-t">Catalogue complet</b><small id="pdf-full-s">PDF vierge</small></a>
    <a id="pdf-hd" href="pdf/Catalogue-Cuillere-dOr-2027-2028-FR-HD-impression.pdf?v=7" download><b id="pdf-hd-t">Version impression (HD)</b><small id="pdf-hd-s">PDF haute d&eacute;finition, 18 Mo</small></a>
    <button type="button" id="pdf-sel"><b id="pdf-sel-t">Ma s&eacute;lection</b><small id="pdf-sel-s">PDF avec mes cases coch&eacute;es</small></button>
    <button type="button" id="pdf-mail"><b id="pdf-mail-t">Envoyer ma s&eacute;lection</b><small id="pdf-mail-s">Par e-mail &agrave; Cuill&egrave;re d&rsquo;Or, pour un devis</small></button>
  </div>
  <button type="button" class="pdf-dl" id="pdf-btn" aria-expanded="false" aria-controls="pdf-panel">&#8681; <span id="pdf-btn-t">PDF &amp; ma s&eacute;lection</span> <span aria-hidden="true">&#9652;</span></button>
</div>
<div class="pdf-toast" id="pdf-toast" role="status" hidden></div>
<style>
  .pdf-menu{ position:fixed; left:18px; bottom:18px; z-index:101; font-family:Arial,Helvetica,sans-serif; }
  .pdf-dl{ display:flex; align-items:center; gap:8px; cursor:pointer;
    background:#1a1a1acc; backdrop-filter:blur(6px); color:#f7f4ec;
    font-weight:700; font-size:13px; letter-spacing:.04em;
    padding:10px 16px; border-radius:999px; border:1px solid #d4af37; box-shadow:0 6px 20px rgba(0,0,0,.28); }
  .pdf-dl:hover{ background:#d4af37; color:#1a1a1a; }
  .pdf-panel{ position:absolute; left:0; bottom:calc(100% + 10px); width:270px; background:#1a1a1af2; backdrop-filter:blur(8px);
    border:1px solid #d4af37; border-radius:16px; padding:6px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
  .pdf-panel[hidden]{ display:none; }
  .pdf-panel a, .pdf-panel button{ display:block; width:100%; text-align:left; box-sizing:border-box; text-decoration:none; cursor:pointer;
    background:transparent; border:0; color:#f7f4ec; font-family:inherit; padding:10px 12px; border-radius:10px; }
  .pdf-panel a:hover, .pdf-panel button:hover{ background:rgba(212,175,55,.2); }
  .pdf-panel b{ display:block; font-size:13px; color:#e8cf8a; }
  .pdf-panel small{ display:block; font-size:12px; opacity:.8; margin-top:2px; }
  .pdf-toast{ position:fixed; left:50%; bottom:80px; transform:translateX(-50%); z-index:200; max-width:min(92vw,420px);
    background:#1a1a1a; color:#f7f4ec; border:1px solid #d4af37; border-radius:14px; padding:12px 16px; font:14px/1.4 Arial,Helvetica,sans-serif; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,.4); }
  .pdf-toast[hidden]{ display:none; }
  @media print{ .pdf-menu, .pdf-toast{ display:none !important; } input:focus, input:focus-visible{ outline:none !important; box-shadow:none !important; }
    *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }
  @media (max-width:560px){ .pdf-menu{ left:10px; bottom:10px; } .pdf-dl{ padding:9px 12px; font-size:12px; } .pdf-panel{ width:min(270px,calc(100vw - 20px)); } }
  /* sélecteur de langue */
  .lang-switcher-label{ font-family:Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#d4af37; padding:0 2px; }
  .lang-switcher{ right:18px !important; bottom:18px !important; }
  @media (max-width:560px){ .lang-switcher{ right:10px !important; bottom:10px !important; } }
</style>
<script>
(function(){
  var L={fr:{btn:'PDF & ma sélection',full:'Catalogue complet',fulls:'PDF vierge',sel:'Ma sélection',sels:'PDF avec mes cases cochées',n:function(n){return n+' case'+(n>1?'s':'')+' cochée'+(n>1?'s':'')+' · PDF personnalisé';},hint:'Dans la fenêtre qui s’ouvre, choisissez « Enregistrer au format PDF ».',hd:'Version impression (HD)',hds:'PDF haute définition, 18 Mo',mail:'Envoyer ma sélection',mails:'Par e-mail à Cuillère d’Or, pour un devis',mailn:function(n){return n+' plat'+(n>1?'s':'')+' · à envoyer par e-mail';},none:'Cochez d’abord quelques plats dans le catalogue.',copied:'Votre sélection est très longue : elle a été copiée, collez-la dans le message (Ctrl/Cmd + V).',paste:'Ma sélection complète a été copiée dans votre presse-papiers : collez-la ici (Ctrl/Cmd + V).',subj:'Demande de devis – catalogue 2027-2028',hello:'Bonjour,\n\nJe souhaite recevoir un devis. Voici ma sélection issue du catalogue 2027-2028 :\n',guests:'Convives',ad:'adultes',ch:'enfants',pr:'prestataires',foot:'\nDate de l’événement :\nLieu (ville) :\nFormule souhaitée :\nNombre de convives :\nMes coordonnées (nom, téléphone) :\n\nMerci !',title:'Catalogue Cuillère d’Or 2027-2028 – ma sélection'},
         en:{btn:'PDF & my selection',full:'Full catalogue',fulls:'Blank PDF',sel:'My selection',sels:'PDF with my ticked boxes',n:function(n){return n+' box'+(n>1?'es':'')+' ticked · personalised PDF';},hint:'In the window that opens, choose “Save as PDF”.',hd:'Print version (HD)',hds:'High-definition PDF, 18 MB',mail:'Send my selection',mails:'By e-mail to Cuillère d’Or, for a quote',mailn:function(n){return n+' dish'+(n>1?'es':'')+' · ready to e-mail';},none:'Please tick a few dishes in the catalogue first.',copied:'Your selection is long: it was copied, paste it into the message (Ctrl/Cmd + V).',paste:'My full selection has been copied to your clipboard: paste it here (Ctrl/Cmd + V).',subj:'Quote request – catalogue 2027-2028',hello:'Hello,\n\nI would like to receive a quote. Here is my selection from the 2027-2028 catalogue:\n',guests:'Guests',ad:'adults',ch:'children',pr:'service providers',foot:'\nEvent date:\nVenue (city):\nPreferred formula:\nNumber of guests:\nMy contact details (name, phone):\n\nThank you!',title:'Cuillère d’Or Catalogue 2027-2028 – my selection'}};
  var lang='fr', state=null, KEY='cdo-catalogue-selection';
  try{ var raw=localStorage.getItem(KEY); if(raw){ var o=JSON.parse(raw); if(o&&o.c&&o.v) state=o; } }catch(e){}
  function $(id){return document.getElementById(id);}
  function boxes(){return Array.prototype.slice.call(document.querySelectorAll('#stage input[type=checkbox]'));}
  function fields(){return Array.prototype.slice.call(document.querySelectorAll('#stage .cv-in'));}
  function count(){return boxes().filter(function(b){return b.checked;}).length;}
  function ui(){var t=L[lang],n=count(), dn0=dishes().length;
    $('pdf-btn-t').textContent=t.btn+(dn0>0?' · '+dn0+' '+(lang==='en'?'dish'+(dn0>1?'es':''):'plat'+(dn0>1?'s':'')):''); $('pdf-full-t').textContent=t.full; $('pdf-full-s').textContent=t.fulls;
    $('pdf-sel-t').textContent=t.sel; $('pdf-sel-s').textContent=n>0?t.n(n):t.sels;
    $('pdf-hd-t').textContent=t.hd; $('pdf-hd-s').textContent=t.hds;
    var dn=dishes().length; $('pdf-mail-t').textContent=t.mail; $('pdf-mail-s').textContent=dn>0?t.mailn(dn):t.mails;}
  // plats cochés (cartes .pc), regroupés par page du catalogue
  function dishes(){return Array.prototype.slice.call(document.querySelectorAll('#stage input[type=checkbox]')).filter(function(b){return b.checked && !b.closest('[id^=carnet]');});}
  function sheetTitle(b){var sh=b.closest('.sheet'),h=sh&&sh.querySelector('h1,h2,h3');return h?h.innerText.replace(/\s+/g,' ').replace(/[.\s]+$/,''):'';}
  function buildMail(){
    var t=L[lang],groups=[],idx={};
    dishes().forEach(function(b){var k=sheetTitle(b)||'—',n=b.getAttribute('aria-label')||'';if(!(k in idx)){idx[k]=groups.length;groups.push({k:k,items:[]});}groups[idx[k]].items.push(n);});
    var g=Array.prototype.slice.call(document.querySelectorAll('#tarifs .cv-in')).map(function(f){return parseInt(f.value,10);});
    var guests=(g.length>=3&&g.some(function(x){return !isNaN(x);}))?'\n'+t.guests+' : '+(g[0]||0)+' '+t.ad+', '+(g[1]||0)+' '+t.ch+', '+(g[2]||0)+' '+t.pr+'\n':'';
    var full=t.hello+groups.map(function(x){return '\n• '+x.k+' : '+x.items.join(', ');}).join('')+'\n'+guests+t.foot;
    var compact=t.hello+groups.map(function(x){return '\n• '+x.k+' : '+x.items.length;}).join('')+'\n'+guests+t.foot;
    return {full:full,compact:compact,subj:t.subj};
  }
  window.__cdoUi=function(l){lang=l; ui();};
  function save(){state={c:boxes().map(function(b){return b.checked;}),v:fields().map(function(f){return f.value;})}; try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  document.addEventListener('change',function(e){ if(e.target.closest&&e.target.closest('#stage')){save();ui();} });
  document.addEventListener('input',function(e){ if(e.target.closest&&e.target.closest('#stage')){save();} });
  // conserve les cases cochées quand on change de langue (même structure FR/EN)
  function restore(){ if(!state) return; var b=boxes(),f=fields();
    if(b.length===state.c.length) b.forEach(function(x,i){x.checked=state.c[i];});
    if(f.length===state.v.length) f.forEach(function(x,i){ if(state.v[i]!==''){ x.value=state.v[i]; x.dispatchEvent(new Event('input',{bubbles:true})); } });
    ui(); }
  var st=$('stage'); if(st&&window.MutationObserver) new MutationObserver(function(){restore();}).observe(st,{childList:true});
  var btn=$('pdf-btn'), panel=$('pdf-panel');
  function close(){panel.hidden=true;btn.setAttribute('aria-expanded','false');}
  btn.addEventListener('click',function(e){e.stopPropagation();var open=panel.hidden;panel.hidden=!open;btn.setAttribute('aria-expanded',open?'true':'false');});
  document.addEventListener('click',function(e){ if(!panel.hidden && !e.target.closest('#pdf-menu')) close(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  $('pdf-mail').addEventListener('click',function(){
    close(); var t=L[lang], toast=$('pdf-toast');
    if(!dishes().length){ toast.textContent=t.none; toast.hidden=false; setTimeout(function(){toast.hidden=true;},3500); return; }
    var m=buildMail(), body=m.full, long=encodeURIComponent(body).length>6000;
    if(long){ body=t.paste+'\n\n'+m.compact; try{navigator.clipboard.writeText(m.full);}catch(e){} toast.textContent=t.copied; toast.hidden=false; setTimeout(function(){toast.hidden=true;},6000); }
    var ml=document.createElement('a'); ml.href='mailto:contact@cuilleredor.fr?subject='+encodeURIComponent(m.subj)+'&body='+encodeURIComponent(body); document.body.appendChild(ml); ml.click(); ml.remove();
  });
  var oldTitle=document.title;
  $('pdf-sel').addEventListener('click',function(){
    close(); var t=L[lang], toast=$('pdf-toast'); toast.textContent=t.hint; toast.hidden=false;
    setTimeout(function(){ toast.hidden=true; oldTitle=document.title; document.title=t.title; window.print(); },1300);
  });
  window.addEventListener('afterprint',function(){ document.title=oldTitle; });
})();
</script>
'''
a='<div class="lang-switcher" role="group"'
assert s.count(a)==1
s=s.replace(a,btn+a,1)
old="      var bk=document.getElementById('cdo-book'); if(bk) bk.setAttribute('data-style',style);\n"
assert s.count(old)==1
new=old+"""      var d=document.getElementById('pdf-dl'); if(d){ d.href='pdf/Catalogue-Cuillere-dOr-2027-2028-'+(lang==='en'?'EN':'FR')+'.pdf?v=7'; var h=document.getElementById('pdf-hd'); if(h){ h.href='pdf/Catalogue-Cuillere-dOr-2027-2028-'+(lang==='en'?'EN-HD-print':'FR-HD-impression')+'.pdf?v=7'; } }
      if(window.__cdoUi) window.__cdoUi(lang,style);
"""
s=s.replace(old,new,1)
old2="    if(sv==='a'||sv==='b'||sv==='c'||sv==='d') style=sv;\n"
assert s.count(old2)==1
s=s.replace(old2,"    style='c';\n",1)
t0="<title>Catalogue Cuillère d'Or</title>"
assert s.count(t0)==1
s=s.replace(t0,t0+'\n<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">',1)
import re as _re
# pas de sélecteur de charte sur le site public : on retire le bloc HTML, le CSS et les appels JS
s,n=_re.subn(r'<div class="style-switcher".*?</div>\n','',s,count=1,flags=_re.S); assert n==1
s=s.replace('class="style-switcher-label" id="lang-label"','class="lang-switcher-label" id="lang-label"')
s=s.replace("{fr:{style:'Charte',lang:'Langue',sa:'Choisir une charte graphique',la:","{fr:{lang:'Langue',la:").replace("en:{style:'Style',lang:'Language',sa:'Choose a design style',la:","en:{lang:'Language',la:")
s=s.replace("document.getElementById('style-label').textContent=L[l].style; ","")
s=s.replace("document.querySelector('.style-switcher').setAttribute('aria-label',L[l].sa); ","")
s=_re.sub(r"    document\.querySelectorAll\('\.style-switcher button'\)\.forEach\(function\(b\)\{ b\.addEventListener.*?\}\); \}\);\n","",s,count=1,flags=_re.S)
s=_re.sub(r"      document\.querySelectorAll\('\.style-switcher button'\)\.forEach\(function\(b\)\{ b\.setAttribute.*?\}\);\n","",s,count=1,flags=_re.S)
s=s.replace(", .style-switcher button:hover","").replace(", .style-switcher button[aria-pressed=\"true\"]","").replace(".lang-switcher button, .style-switcher button{",".lang-switcher button{")
s=_re.sub(r"\n  \.style-switcher(?:-label)?\{[^}]*\}","",s)
s=s.replace("  @media print{ .style-switcher{ display:none !important; } }\n","").replace("  @media (max-width: 480px){ .style-switcher{ right:10px; bottom:10px; } }\n","")
# lien profond depuis le site principal (ex. /#buffet) : le catalogue est injecté par JS, on fait défiler après le rendu
s=s.rstrip('\n')+"\n<script>window.addEventListener('load',function(){var h=location.hash.slice(1);if(!h)return;var e=document.getElementById(h);if(e)e.scrollIntoView();});</script>\n"
shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT+'/pdf')
open(OUT+'/index.html','w',encoding='utf8').write(s)
for f in sorted(set(re.findall(r'images/[A-Za-z0-9_./-]+\.(?:jpg|png|jpeg|webp|svg)',s))):
    if os.path.isfile(f):
        os.makedirs(os.path.dirname(OUT+'/'+f),exist_ok=True); shutil.copy(f,OUT+'/'+f)
    else: print('MISSING',f)
for f in ['favicon.ico','favicon-32.png','icon-192.png','apple-touch-icon.png']: shutil.copy('icons/'+f,OUT+'/'+f)
# PDF : les fichiers finaux (FR/EN, allégés et haute définition) vivent dans ../public/catalogue/
PDFS='../public/catalogue/'
# nouveaux noms (Cloudflare garde les anciens PDF en cache 24 h) ; les anciens noms restent servis avec le même contenu
NAMES={'Cuillere-dOr-Catalogue-2027-2028-FR.pdf':'Catalogue-Cuillere-dOr-2027-2028-FR.pdf','Cuillere-dOr-Catalogue-2027-2028-EN.pdf':'Catalogue-Cuillere-dOr-2027-2028-EN.pdf','Cuillere-dOr-Catalogue-2027-2028-FR-HD-impression.pdf':'Catalogue-Cuillere-dOr-2027-2028-FR-HD-impression.pdf','Cuillere-dOr-Catalogue-2027-2028-EN-HD-print.pdf':'Catalogue-Cuillere-dOr-2027-2028-EN-HD-print.pdf'}
for old,new_ in NAMES.items():
    shutil.copy(PDFS+old,OUT+'/pdf/'+new_); shutil.copy(PDFS+old,OUT+'/pdf/'+old)
open(OUT+'/_headers','w').write('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/images/*\n  Cache-Control: public, max-age=2592000\n/pdf/*\n  Cache-Control: public, max-age=86400\n')
open(OUT+'/LISEZ-MOI.txt','w',encoding='utf8').write("Catalogue Cuillère d'Or 2027-2028 — site statique\nDéposer ce dossier entier sur Cloudflare Pages (Workers & Pages > Create > Pages > Upload assets).\nindex.html = catalogue ; images/ ; pdf/ = téléchargements ; _headers = cache.\n")

# supprime les fichiers parasites macOS (._*, .DS_Store) créés par le volume externe
for r,_,fs in os.walk(OUT):
    for f in fs:
        if f.startswith('._') or f=='.DS_Store': os.remove(os.path.join(r,f))
