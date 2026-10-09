# Generate flat "sticker" food illustrations for the Eat It! prototype.
# Each sticker = white die-cut outline layer + coloured art, 120x120 viewBox.
import re, os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

HL = 'fill="#FFFFFF" opacity="0.45"'  # highlight

F = {}

F['beef'] = '''
<rect x="14" y="34" width="92" height="58" rx="14" fill="#EDE7DD"/>
<rect x="20" y="39" width="80" height="48" rx="10" fill="#F7F3EC"/>
<path d="M28 70c-4-14 8-26 22-24 6-10 24-10 30 0 12 0 18 12 12 22-2 8-10 12-18 10-8 6-22 6-30 0-8 2-14-2-16-8z" fill="#D9473B"/>
<circle cx="44" cy="62" r="3" fill="#F29486"/><circle cx="60" cy="56" r="3.4" fill="#F29486"/><circle cx="74" cy="64" r="3" fill="#F29486"/><circle cx="54" cy="72" r="2.6" fill="#F29486"/><circle cx="68" cy="73" r="2.4" fill="#B5352B"/><circle cx="38" cy="70" r="2.2" fill="#B5352B"/><circle cx="82" cy="58" r="2.2" fill="#B5352B"/>
<path d="M24 44h40" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
'''

F['beefbag'] = '''
<rect x="18" y="20" width="84" height="84" rx="12" fill="#E3EEF7"/>
<rect x="18" y="20" width="84" height="12" rx="6" fill="#B9D0E4"/>
<rect x="28" y="42" width="64" height="50" rx="12" fill="#D9473B"/>
<circle cx="42" cy="56" r="3" fill="#F29486"/><circle cx="60" cy="64" r="3.4" fill="#F29486"/><circle cx="76" cy="52" r="3" fill="#F29486"/><circle cx="50" cy="78" r="2.6" fill="#B5352B"/><circle cx="74" cy="78" r="2.6" fill="#F29486"/>
<path d="M26 40l8 6M86 40l-6 8M30 96l6-6" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
<rect x="24" y="36" width="10" height="50" rx="5" fill="#FFFFFF" opacity="0.5"/>
'''

F['chicken'] = '''
<rect x="12" y="38" width="96" height="54" rx="14" fill="#E9EEF2"/>
<rect x="18" y="43" width="84" height="44" rx="10" fill="#F6F8FA"/>
<path d="M26 74c-4-16 10-26 24-22 10 2 14 14 8 24-6 8-28 8-32-2z" fill="#F4B3A0"/>
<path d="M58 70c-2-16 14-24 28-18 10 4 10 18 2 24-8 6-28 6-30-6z" fill="#F7C0AE"/>
<path d="M34 64c6-4 14-4 18 2M66 60c6-4 14-2 18 4" stroke="#E58B76" stroke-width="3" stroke-linecap="round" fill="none"/>
<ellipse cx="36" cy="60" rx="5" ry="3" fill="#FFFFFF" opacity="0.5"/><ellipse cx="70" cy="58" rx="5" ry="3" fill="#FFFFFF" opacity="0.5"/>
'''

F['chickenbag'] = '''
<rect x="18" y="20" width="84" height="84" rx="12" fill="#E3EEF7"/>
<rect x="18" y="20" width="84" height="12" rx="6" fill="#B9D0E4"/>
<path d="M30 80c-6-22 14-36 32-30 14 4 22 18 14 32-8 12-40 12-46-2z" fill="#F4B3A0"/>
<path d="M40 66c8-6 20-6 26 2" stroke="#E58B76" stroke-width="3" stroke-linecap="round" fill="none"/>
<path d="M26 40l8 6M86 40l-6 8" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
<rect x="24" y="36" width="10" height="50" rx="5" fill="#FFFFFF" opacity="0.5"/>
'''

F['milk'] = '''
<rect x="48" y="10" width="24" height="12" rx="4" fill="#3E8BD8"/>
<path d="M44 22h32l6 14v66a8 8 0 0 1-8 8H46a8 8 0 0 1-8-8V36z" fill="#FFFFFF"/>
<path d="M44 22h32l6 14v66a8 8 0 0 1-8 8H46a8 8 0 0 1-8-8V36z" fill="none" stroke="#D5DEE6" stroke-width="2"/>
<path d="M82 44h6a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-6" fill="none" stroke="#D5DEE6" stroke-width="5"/>
<rect x="38" y="56" width="44" height="30" fill="#CFE3F7"/>
<path d="M38 56h44" stroke="#3E8BD8" stroke-width="3"/>
<rect x="44" y="40" width="5" height="56" rx="2.5" fill="#EEF3F7"/>
'''

F['eggs'] = '''
<path d="M12 56h96l-6 34a8 8 0 0 1-8 7H26a8 8 0 0 1-8-7z" fill="#D8C7AA"/>
<ellipse cx="34" cy="54" rx="14" ry="17" fill="#F6E3C8"/><ellipse cx="60" cy="50" rx="14" ry="17" fill="#FBEBD5"/><ellipse cx="86" cy="54" rx="14" ry="17" fill="#F6E3C8"/>
<ellipse cx="29" cy="46" rx="4" ry="6" fill="#FFFFFF" opacity="0.6"/><ellipse cx="55" cy="42" rx="4" ry="6" fill="#FFFFFF" opacity="0.6"/><ellipse cx="81" cy="46" rx="4" ry="6" fill="#FFFFFF" opacity="0.6"/>
<path d="M12 58h96" stroke="#C4B08F" stroke-width="4"/>
<path d="M30 70v18M50 70v18M70 70v18M90 70v18" stroke="#C4B08F" stroke-width="3" stroke-linecap="round"/>
'''

F['spinach'] = '''
<path d="M60 108c0-20 2-34 0-48" stroke="#8CBF4A" stroke-width="6" stroke-linecap="round"/>
<path d="M58 70C36 70 20 52 24 26c22 2 36 18 34 44z" fill="#3F8F2A"/>
<path d="M62 70c22 0 38-18 34-44-22 2-36 18-34 44z" fill="#4FA233"/>
<path d="M60 62C46 46 48 24 60 10c12 14 14 36 0 52z" fill="#5DB33D"/>
<path d="M40 48l16 18M80 48L64 66M60 22v34" stroke="#A5D46A" stroke-width="2.5" stroke-linecap="round"/>
<rect x="50" y="84" width="20" height="8" rx="3" fill="#E9D6A0"/>
'''

F['tomato'] = '''
<circle cx="60" cy="66" r="40" fill="#E8452F"/>
<path d="M60 26c-4 10-14 14-24 12 6 6 8 12 6 18 8-4 14-6 18-4 4-2 10 0 18 4-2-6 0-12 6-18-10 2-20-2-24-12z" fill="#4FA233"/>
<rect x="57" y="14" width="6" height="16" rx="3" fill="#3F8F2A"/>
<ellipse cx="40" cy="58" rx="8" ry="12" fill="#FFFFFF" opacity="0.4"/>
<path d="M88 88a40 40 0 0 1-50 12" stroke="#C93522" stroke-width="5" fill="none" stroke-linecap="round"/>
'''

F['carrot'] = '''
<path d="M74 34c8 0 14 8 12 16L50 106c-4 6-12 2-10-4l20-58c2-6 8-10 14-10z" fill="#F28C28"/>
<path d="M62 54l10 4M56 70l10 4M50 86l8 3" stroke="#D86F12" stroke-width="3" stroke-linecap="round"/>
<path d="M76 34C72 20 76 10 84 6c2 10 0 20-8 28zM80 36c8-12 18-16 26-14-4 10-14 16-26 14zM74 32c-8-10-8-20-2-26 6 8 6 18 2 26z" fill="#4FA233"/>
<path d="M66 48l-6 18" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
'''

F['springonion'] = '''
<path d="M50 70C46 50 40 26 30 8M58 70c0-22 2-44 8-62M64 72c6-20 18-40 32-54" stroke="#4FA233" stroke-width="9" stroke-linecap="round" fill="none"/>
<path d="M50 70C46 50 40 26 30 8M58 70c0-22 2-44 8-62" stroke="#6DBF45" stroke-width="3" stroke-linecap="round" fill="none"/>
<path d="M44 70h28l-2 22c-1 8-6 12-12 12s-11-4-12-12z" fill="#F7F5EA"/>
<path d="M50 74v16M58 74v20M66 74v16" stroke="#E2DEC8" stroke-width="2.5" stroke-linecap="round"/>
<path d="M52 104l-4 8M58 106v8M64 104l4 8" stroke="#D9D2B4" stroke-width="2" stroke-linecap="round"/>
<path d="M44 70h28" stroke="#A5D46A" stroke-width="6"/>
'''

F['broccoli'] = '''
<path d="M50 70l-4 34h28l-4-34z" fill="#8CBF4A"/>
<circle cx="40" cy="50" r="20" fill="#3F8F2A"/><circle cx="80" cy="50" r="20" fill="#3F8F2A"/><circle cx="60" cy="34" r="22" fill="#4FA233"/><circle cx="60" cy="60" r="18" fill="#4FA233"/>
<circle cx="52" cy="28" r="5" fill="#6DBF45"/><circle cx="34" cy="46" r="4" fill="#6DBF45"/><circle cx="76" cy="44" r="4" fill="#6DBF45"/><circle cx="62" cy="56" r="4" fill="#6DBF45"/>
<path d="M56 80v18" stroke="#B4DA7C" stroke-width="3" stroke-linecap="round"/>
'''

F['apple'] = '''
<path d="M60 36c-10-8-36-8-40 18-4 28 16 54 30 54 6 0 8-3 10-3s4 3 10 3c14 0 34-26 30-54-4-26-30-26-40-18z" fill="#E2483A"/>
<path d="M60 36c0-10 2-18 8-24" stroke="#7A4A2A" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M64 28c6-12 20-14 28-10-6 10-18 14-28 10z" fill="#4FA233"/>
<ellipse cx="38" cy="58" rx="7" ry="13" fill="#FFFFFF" opacity="0.4"/>
<path d="M86 86c-6 12-14 18-20 20" stroke="#C3352A" stroke-width="5" stroke-linecap="round" fill="none"/>
'''

F['banana'] = '''
<path d="M24 34c-4 34 20 66 60 66 10 0 16-4 18-8-24-2-48-22-58-54-2-6-6-12-12-12-4 0-7 3-8 8z" fill="#F7CF3A"/>
<path d="M34 40c8 26 28 46 54 52" stroke="#E2AE1C" stroke-width="4" stroke-linecap="round" fill="none"/>
<path d="M28 26l-6-8" stroke="#6B4A2A" stroke-width="7" stroke-linecap="round"/>
<path d="M100 90l6 2" stroke="#6B4A2A" stroke-width="6" stroke-linecap="round"/>
<path d="M30 46c4 16 12 28 22 36" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/>
'''

F['avocado'] = '''
<path d="M60 10c-16 0-22 22-30 40-8 18-6 58 30 58s38-40 30-58C82 32 76 10 60 10z" fill="#3E6B1F"/>
<path d="M60 18c-12 0-17 18-24 34-6 15-5 48 24 48s30-33 24-48C77 36 72 18 60 18z" fill="#D7EA8C"/>
<circle cx="60" cy="72" r="16" fill="#8A5A34"/>
<circle cx="55" cy="67" r="5" fill="#B07A4E"/>
'''

F['yoghurt'] = '''
<path d="M22 40h76l-8 60a8 8 0 0 1-8 7H38a8 8 0 0 1-8-7z" fill="#FFFFFF"/>
<path d="M22 40h76l-8 60a8 8 0 0 1-8 7H38a8 8 0 0 1-8-7z" fill="none" stroke="#DCE2E8" stroke-width="2"/>
<rect x="16" y="28" width="88" height="14" rx="7" fill="#C9E77A"/>
<rect x="30" y="56" width="60" height="30" rx="6" fill="#F1F7E1"/>
<circle cx="50" cy="71" r="7" fill="#E2483A"/><circle cx="64" cy="68" r="6" fill="#7B4FC2"/><circle cx="74" cy="76" r="5" fill="#E2483A"/>
<rect x="34" y="46" width="5" height="50" rx="2.5" fill="#F0F3F6"/>
'''

F['cheese'] = '''
<path d="M14 66l70-38 22 16v40H14z" fill="#F6C944"/>
<path d="M14 66l70-38 22 16L36 66z" fill="#FBDD72"/>
<path d="M14 66h92v18H14z" fill="#F2BC2E"/>
<circle cx="42" cy="76" r="5" fill="#E3A51E"/><circle cx="70" cy="72" r="4" fill="#E3A51E"/><circle cx="88" cy="78" r="3.5" fill="#E3A51E"/><circle cx="74" cy="48" r="4" fill="#EBB935"/>
'''

F['bread'] = '''
<path d="M18 52c0-22 20-30 42-30s42 8 42 30c0 6-4 10-8 10v36a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6V62c-4 0-8-4-8-10z" fill="#E3A35A"/>
<path d="M28 54c0-16 14-22 32-22s32 6 32 22v44H28z" fill="#F7DDB0"/>
<path d="M40 40c4-4 8-6 12-6M64 34c4 0 8 2 12 6" stroke="#F3C989" stroke-width="3" stroke-linecap="round"/>
<circle cx="46" cy="64" r="2" fill="#E8C690"/><circle cx="68" cy="72" r="2" fill="#E8C690"/><circle cx="56" cy="84" r="2" fill="#E8C690"/>
'''

F['rice'] = '''
<path d="M32 20h56l6 12v68a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8V32z" fill="#F4F1E8"/>
<path d="M32 20h56l-4 10H36z" fill="#DCD5C2"/>
<rect x="34" y="48" width="52" height="34" rx="8" fill="#C9E77A"/>
<ellipse cx="48" cy="62" rx="3" ry="5" fill="#FFFFFF" transform="rotate(-25 48 62)"/><ellipse cx="60" cy="66" rx="3" ry="5" fill="#FFFFFF" transform="rotate(15 60 66)"/><ellipse cx="72" cy="60" rx="3" ry="5" fill="#FFFFFF" transform="rotate(-10 72 60)"/><ellipse cx="54" cy="74" rx="3" ry="5" fill="#FFFFFF" transform="rotate(30 54 74)"/><ellipse cx="68" cy="74" rx="3" ry="5" fill="#FFFFFF"/>
<rect x="32" y="34" width="5" height="64" rx="2.5" fill="#FFFFFF" opacity="0.7"/>
'''

F['tofu'] = '''
<rect x="16" y="34" width="88" height="60" rx="12" fill="#D7E9F4"/>
<rect x="24" y="44" width="72" height="44" rx="8" fill="#FBFAF4"/>
<path d="M24 56h72" stroke="#EDEADD" stroke-width="2"/>
<path d="M60 44v44" stroke="#EDEADD" stroke-width="2"/>
<rect x="16" y="34" width="88" height="14" rx="7" fill="#9FC8E2" opacity="0.7"/>
<path d="M30 52h14" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
'''

F['pb'] = '''
<rect x="28" y="16" width="64" height="18" rx="6" fill="#C9502F"/>
<path d="M30 34h60v62a12 12 0 0 1-12 12H42a12 12 0 0 1-12-12z" fill="#A86A36"/>
<rect x="30" y="50" width="60" height="36" fill="#F6E8CC"/>
<circle cx="60" cy="68" r="11" fill="#C98B4E"/>
<path d="M55 64c3-3 7-3 10 0M55 72c3 3 7 3 10 0" stroke="#8F5A2C" stroke-width="2" stroke-linecap="round" fill="none"/>
<rect x="36" y="38" width="5" height="60" rx="2.5" fill="#FFFFFF" opacity="0.35"/>
'''

F['yuzu'] = '''
<rect x="32" y="12" width="56" height="16" rx="5" fill="#F4F2EC"/>
<path d="M30 30h60l4 8v58a12 12 0 0 1-12 12H38a12 12 0 0 1-12-12V38z" fill="#F4A62A"/>
<rect x="26" y="54" width="68" height="28" fill="#FFF6DE"/>
<circle cx="46" cy="44" r="4" fill="#F9C55A"/><circle cx="72" cy="42" r="3" fill="#F9C55A"/><circle cx="58" cy="96" r="4" fill="#F9C55A"/><circle cx="80" cy="92" r="3" fill="#F9C55A"/>
<rect x="44" y="62" width="32" height="5" rx="2.5" fill="#E0B95A"/><rect x="50" y="71" width="20" height="4" rx="2" fill="#E8D19A"/>
<rect x="32" y="34" width="5" height="64" rx="2.5" fill="#FFFFFF" opacity="0.4"/>
'''

F['lemon'] = '''
<ellipse cx="60" cy="62" rx="42" ry="32" fill="#F7D94A" transform="rotate(-20 60 62)"/>
<path d="M18 74l-8 4M100 46l8-6" stroke="#F7D94A" stroke-width="10" stroke-linecap="round"/>
<path d="M98 44c-2-10-8-18-14-20 8 0 16 6 18 14z" fill="#4FA233"/>
<ellipse cx="44" cy="54" rx="10" ry="6" fill="#FFFFFF" opacity="0.45" transform="rotate(-20 44 54)"/>
'''

F['strawberry'] = '''
<path d="M60 108C34 92 18 70 22 50c4-16 20-20 38-14 18-6 34-2 38 14 4 20-12 42-38 58z" fill="#E8394A"/>
<path d="M60 38c-8-4-18-4-24 0 4-10 12-14 18-12 0-6 4-12 6-14 2 2 6 8 6 14 6-2 14 2 18 12-6-4-16-4-24 0z" fill="#4FA233"/>
<g fill="#FFD9A8"><ellipse cx="42" cy="56" rx="2" ry="3"/><ellipse cx="58" cy="54" rx="2" ry="3"/><ellipse cx="76" cy="56" rx="2" ry="3"/><ellipse cx="48" cy="72" rx="2" ry="3"/><ellipse cx="66" cy="70" rx="2" ry="3"/><ellipse cx="80" cy="70" rx="2" ry="3"/><ellipse cx="58" cy="88" rx="2" ry="3"/><ellipse cx="70" cy="84" rx="2" ry="3"/></g>
<ellipse cx="38" cy="62" rx="5" ry="9" fill="#FFFFFF" opacity="0.35"/>
'''

F['dumplings'] = '''
<rect x="16" y="20" width="88" height="84" rx="12" fill="#E3EEF7"/>
<rect x="16" y="20" width="88" height="12" rx="6" fill="#B9D0E4"/>
<path d="M28 74c0-14 12-22 22-22s22 8 22 22z" fill="#FBF6EA"/>
<path d="M56 86c0-14 12-22 22-22s16 8 16 22z" fill="#F7F0DE"/>
<path d="M36 64c2 4 4 4 6 0M46 60c2 4 4 4 6 0M56 64c2 4 4 4 6 0M66 76c2 4 4 4 6 0M76 72c2 4 4 4 6 0" stroke="#E2D7BD" stroke-width="2" stroke-linecap="round" fill="none"/>
<path d="M24 40l8 6M92 40l-6 8" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
'''

F['leftovers'] = '''
<rect x="14" y="38" width="92" height="16" rx="7" fill="#C9E77A"/>
<path d="M18 54h84l-4 40a10 10 0 0 1-10 9H32a10 10 0 0 1-10-9z" fill="#EEF4F7"/>
<path d="M24 62h72l-3 30a7 7 0 0 1-7 6H34a7 7 0 0 1-7-6z" fill="#F0A33C"/>
<circle cx="44" cy="74" r="5" fill="#FFFFFF"/><circle cx="58" cy="80" r="5" fill="#FFFFFF"/><circle cx="72" cy="72" r="4" fill="#4FA233"/><circle cx="80" cy="84" r="4" fill="#D9473B"/><circle cx="50" cy="88" r="4" fill="#4FA233"/>
<rect x="22" y="58" width="5" height="34" rx="2.5" fill="#FFFFFF" opacity="0.6"/>
'''

def outline(body):
    # White die-cut layer: every shape repainted white with a thick round stroke.
    def fix(m):
        tag, attrs, end = m.group(1), m.group(2), m.group(3)
        fill_none = 'fill="none"' in attrs
        sw = re.search(r'stroke-width="([\d.]+)"', attrs)
        w = (float(sw.group(1)) if sw else 0) + 14
        attrs = re.sub(r'\s(fill|stroke|stroke-width|opacity|stroke-linecap|stroke-linejoin)="[^"]*"', '', attrs)
        fill = 'none' if fill_none else '#FFFFFF'
        if tag == 'g':
            return f'<g{attrs} fill="#FFFFFF" stroke="#FFFFFF" stroke-width="14"{end}'
        return f'<{tag}{attrs} fill="{fill}" stroke="#FFFFFF" stroke-width="{w:g}" stroke-linejoin="round" stroke-linecap="round"{end}'
    return re.sub(r'<(path|rect|circle|ellipse|g)(\s[^>]*?)?(\s*/?>)', lambda m: fix(type('M', (), {'group': lambda self, i: (m.group(i) or '')})()), body)

for k, body in F.items():
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 132 132" width="264" height="264">'
           f'<g>{outline(body)}</g><g>{body}</g></svg>')
    open(os.path.join(OUT, f'{k}.svg'), 'w').write(svg)
print(len(F))
