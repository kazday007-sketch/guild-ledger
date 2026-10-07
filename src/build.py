# Builds ../index.html (the public web game) from ui.html + engine.js + config.json.
# config.json holds the Google Form that receives run reports.
import json, os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda p: open(os.path.join(here, p), encoding='utf-8').read()
page = read('ui.html').replace('/*ENGINE*/', read('engine.js'))
cfg = json.loads(read('config.json'))
marker = "const REPORT = { url: '', entry: '' }; /*REPORT_CONFIG*/"
assert marker in page
page = page.replace(marker, 'const REPORT = ' + json.dumps({'url': cfg['form_url'], 'entry': cfg['entry']}) + ';')
doc = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}img{max-width:100%}</style>'
       '</head><body>\n' + page + '\n</body></html>\n')
open(os.path.join(here, '..', 'index.html'), 'w', encoding='utf-8').write(doc)
print('built index.html', 'with form' if cfg['form_url'] else '(no form configured: reports are off)')
