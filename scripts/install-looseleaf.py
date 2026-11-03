"""Install upstream registry files verbatim when the shadcn CLI proxy is unavailable."""
import concurrent.futures,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
base='https://kevintngo.github.io/looseleaf/r/'
pending={base+n+'.json' for n in ['looseleaf-theme','button','paper','sticker','mascot','doodle','tape','dialog','ink-stickers','ink-doodles','ink-mascots','ink-scenes','ink-props','ink-icons']}
seen=set();packages=set();manifest=[]
def fetch(url):
 p=subprocess.run(['curl','--fail','-sL','--retry','2','--max-time','45',url],capture_output=True,check=True)
 return url,json.loads(p.stdout)
while pending:
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
  batch=list(pool.map(fetch,sorted(pending)))
 pending=set()
 for url,item in batch:
  seen.add(url);manifest.append(item['name']); packages.update(item.get('dependencies',[]))
  for dep in item.get('registryDependencies',[]):
   dep=dep if dep.startswith('http') else base+dep+'.json'
   if dep not in seen: pending.add(dep)
  for f in item.get('files',[]):
   path=f.get('target') or f['path']
   if path.startswith('~/'): path=path[2:]
   for alias,target in [('@lib/','src/lib/'),('@ui/','src/components/ui/'),('@hooks/','src/hooks/')]:
    if path.startswith(alias): path=target+path[len(alias):]
   dest=root/path
   if not dest.resolve().is_relative_to(root):raise ValueError(path)
   dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(f['content'])
  if item.get('cssVars'):
   out=[]
   for section,values in item['cssVars'].items():
    sel={'theme':'@theme inline','light':':root','dark':'.dark'}.get(section,section)
    out.append(sel+' {\n'+'\n'.join('--'+k+': '+v+';' for k,v in values.items())+'\n}')
   (root/'src/looseleaf-tokens.css').write_text('\n'.join(out))
  if item.get('css'):
   (root/'registry-css.json').write_text(json.dumps(item['css'],indent=2))
 print('Installed',len(seen),'registry items',flush=True)
(root/'looseleaf-registry-manifest.json').write_text(json.dumps({'source':base,'items':sorted(manifest),'dependencies':sorted(packages)},indent=2))
def css(d):
 out=[]
 for k,v in d.items():
  if isinstance(v,dict):out.append(k+' {\n'+css(v)+'\n}')
  elif isinstance(v,list):out.extend(k+': '+str(x)+';' for x in v)
  else:out.append(k+': '+str(v)+';')
 return '\n'.join(out)
(root/'src/looseleaf-theme.css').write_text(css(json.loads((root/'registry-css.json').read_text())))
print('PACKAGES', ' '.join(sorted(packages)))
