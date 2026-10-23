const map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
let bridgeRecords = bridgeData.map(a=>({...a}));
let culvertRecords = culvertData.map(a=>({...a}));
let allAssets = [];
let markers = [];
let bounds = L.latLngBounds([]);
const money = n => 'K' + Number(n || 0).toLocaleString('en-US', {maximumFractionDigits:0});
const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const conditionClass = c => ['Good','Fair','Poor'].includes(c) ? c : '';
function markerIcon(type) { return L.divIcon({className:'custom-marker',html:`<div style="width:15px;height:15px;border-radius:50%;border:2px solid white;box-shadow:0 1px 5px #333;background:${type==='bridge'?'#222':'#f5c400'}"></div>`,iconSize:[15,15],iconAnchor:[7,7]}); }
function rebuildAssets() {
  markers.forEach(m=>map.removeLayer(m)); markers=[];
  allAssets=[...bridgeRecords.map(a=>({...a,assetType:'bridge'})),...culvertRecords.map(a=>({...a,assetType:'culvert'}))]
    .filter(a=>Number.isFinite(Number(a.lat))&&Number.isFinite(Number(a.lon))&&a.lat!==''&&a.lon!=='');
  allAssets.forEach(asset=>{const marker=L.marker([Number(asset.lat),Number(asset.lon)],{icon:markerIcon(asset.assetType)}).addTo(map);
    marker.bindTooltip(`${asset.assetType==='bridge'?'Bridge':'Culvert'}: ${asset.name||asset.id}`);
    marker.on('click',()=>showDetails(asset, marker)); marker.asset=asset; markers.push(marker);});
  bounds=L.latLngBounds(allAssets.map(a=>[Number(a.lat),Number(a.lon)]));
  if(bounds.isValid()) map.fitBounds(bounds.pad(0.12));
  updateKpis(); renderTable();
}
function updateKpis(){
  const filter=document.getElementById('type')?.value||'all';
  document.getElementById('bridge-count').textContent=bridgeRecords.length;
  document.getElementById('culvert-count').textContent=culvertRecords.length;
  const visibleAssets=filter==='all'?allAssets:allAssets.filter(a=>a.assetType===filter);
  document.getElementById('poor-count').textContent=visibleAssets.filter(a=>String(a.condition||'').toLowerCase()==='poor').length;
  document.querySelector('#poor-kpi small').textContent=filter==='bridge'?'Poor bridge assets':filter==='culvert'?'Poor culvert assets':'Poor bridge and culvert assets';
  // Overview shows both totals; asset-specific views show that asset total and its poor-condition count.
  document.getElementById('bridge-kpi').style.display=(filter==='all'||filter==='bridge')?'':'none';
  document.getElementById('culvert-kpi').style.display=(filter==='all'||filter==='culvert')?'':'none';
  document.getElementById('poor-kpi').style.display='';
}
function showDetails(a, marker=null) {
  const isBridge=a.assetType==='bridge';
  const title=isBridge?(a.name||a.id||'Bridge'):(a.name||a.id||'Culvert');
  const labels={id:isBridge?'Bridge ID':'Culvert ID',name:isBridge?'Bridge name':'Culvert name',road:'Road',chainage:'Chainage',lat:'Latitude',lon:'Longitude',condition:'Condition',length:isBridge?'Bridge length (m)':'Culvert length (m)',year:'Year built',priority:'Maintenance priority',action:'Recommended action',type:isBridge?'Bridge type':'Culvert type',blockage:'Blockage (%)',inspection:'Last inspection',cost:'Estimated repair cost (PGK)',remarks:'Remarks'};
  const commonKeys=['id','name','road','chainage','lat','lon','condition','length','year','priority','action','inspection','remarks','type','cost','blockage'];
  // Show the standard fields plus every other populated attribute supplied for this asset.
  // Keep bridge-only and culvert-only fields separate, and omit internal metadata/empty values.
  const excluded=new Set(['assetType','geometry','geom','the_geom','fid','id_']);
  if(isBridge) excluded.add('blockage');
  else excluded.add('year');
  const keys=[...commonKeys.filter(k=>Object.prototype.hasOwnProperty.call(a,k)),
    ...Object.keys(a).filter(k=>!commonKeys.includes(k)&&!excluded.has(k))];
  const fields=keys.filter(key=>!excluded.has(key)&&a[key]!==''&&a[key]!==null&&a[key]!==undefined)
    .map(key=>{
      const label=labels[key]||key.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/^./,c=>c.toUpperCase());
      let value=a[key];
      if(key==='cost') value=money(value);
      else if(typeof value==='object') value=JSON.stringify(value);
      return [label,value];
    });
  const fieldRows=fields.map(([label,value])=>`<tr><th>${safe(label)}</th><td>${safe(value)}</td></tr>`).join('');
  const popupHtml=`<div class="asset-popup"><h4>${safe(title)}</h4><div class="asset-popup-type">${isBridge?'Bridge asset':'Culvert asset'}</div><table><tbody>${fieldRows||'<tr><td>No attribute information available.</td></tr>'}</tbody></table></div>`;
  const details=document.getElementById('asset-details-content');
  if(details) details.innerHTML=`<div class="detail-title">${safe(title)}</div><div class="detail-sub">${isBridge?'Bridge asset':'Culvert asset'} · ${fields.length} available attributes</div><table class="detail-attributes"><tbody>${fieldRows||'<tr><td>No attribute information available.</td></tr>'}</tbody></table>`;
  const lat=Number(a.lat),lon=Number(a.lon);
  if(Number.isFinite(lat)&&Number.isFinite(lon)){
    L.popup({maxWidth:360,maxHeight:320}).setLatLng([lat,lon]).setContent(popupHtml).openOn(map);
    if(marker) map.panTo([lat,lon]);
  }
}

function currentFilter(){return {search:document.getElementById('search').value.trim().toLowerCase(),condition:document.getElementById('condition').value,type:document.getElementById('type').value};}
function filteredAssets(){const f=currentFilter();return allAssets.filter(a=>{const haystack=[a.id,a.name,a.road,a.chainage,a.type,a.priority].join(' ').toLowerCase();return (!f.search||haystack.includes(f.search))&&(f.condition==='all'||String(a.condition||'').toLowerCase()===f.condition.toLowerCase())&&(f.type==='all'||a.assetType===f.type);});}
function renderTable(){const assets=filteredAssets();const type=document.getElementById('type').value;document.getElementById('table-subtitle').textContent=type==='all'?'Bridges and culverts from current data':(type==='bridge'?'Bridge records':'Culvert records');
 document.getElementById('table-head').innerHTML='<tr><th>TYPE</th><th>ASSET ID</th><th>NAME / ROAD</th><th>CHAINAGE</th><th>CONDITION</th><th>PRIORITY / BLOCKAGE</th></tr>';
 document.getElementById('table-body').innerHTML=assets.map((a,i)=>`<tr data-index="${i}"><td>${a.assetType==='bridge'?'Bridge':'Culvert'}</td><td><strong>${safe(a.id)}</strong></td><td>${safe(a.name||a.road||a.id)}</td><td>${safe(a.chainage)}</td><td><span class="badge ${conditionClass(a.condition)}">${safe(a.condition||'—')}</span></td><td>${a.assetType==='bridge'?safe(a.priority||'—'):(a.blockage==null?'—':safe(a.blockage+'% blockage'))}</td></tr>`).join('')||'<tr><td colspan="6">No records match these filters.</td></tr>';
 document.getElementById('record-count').textContent=`${assets.length} of ${allAssets.length} records`;
 document.querySelectorAll('#table-body tr[data-index]').forEach(row=>row.addEventListener('click',()=>{const a=assets[Number(row.dataset.index)];const marker=markers.find(m=>m.asset.id===a.id&&m.asset.assetType===a.assetType);showDetails(a,marker);}));
}
['search','condition','type'].forEach(id=>document.getElementById(id).addEventListener(id==='search'?'input':'change',()=>{if(id==='type')updateKpis();renderTable();}));
document.getElementById('reset').addEventListener('click',()=>{if(bounds.isValid())map.fitBounds(bounds.pad(0.12));});
function setQgisAssetLayers(filter='all'){
  try {
    const frame=document.getElementById('qgis-map-frame');
    const win=frame.contentWindow;
    if(!win || !win.lyr_MorobeBridge_1 || !win.lyr_MorobeCulverts_2) return;
    win.lyr_MorobeBridge_1.setVisible(filter==='all'||filter==='bridge');
    win.lyr_MorobeCulverts_2.setVisible(filter==='all'||filter==='culvert');
  } catch (err) { console.warn('Could not update QGIS asset layer visibility:', err); }
}
document.querySelectorAll('.sidebar .nav[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.sidebar .nav').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const filter=btn.dataset.filter;document.getElementById('type').value=filter;updateKpis();document.getElementById('view-title').textContent=({all:'Bridge & culvert overview',bridge:'Bridge assets',culvert:'Culvert assets'})[filter];renderTable();setQgisAssetLayers(filter);setTimeout(()=>map.invalidateSize(),50);}));
const qgisFrame=document.getElementById('qgis-map-frame');
qgisFrame.addEventListener('load',()=>setQgisAssetLayers(document.getElementById('type').value||'all'));
function csvCell(v){return `"${String(v??'').replace(/"/g,'""')}"`;}
function downloadCsv(rows,filename){const headers=['Asset Type','Asset ID','Name','Road','Chainage','Latitude','Longitude','Condition','Length (m)','Priority','Blockage (%)','Estimated Repair Cost (PGK)','Recommended Action / Remarks'];const lines=[headers.map(csvCell).join(','),...rows.map(a=>[a.assetType,a.id,a.name||'',a.road||'',a.chainage||'',a.lat,a.lon,a.condition||'',a.length??'',a.priority||'',a.blockage??'',a.cost??'',a.action||a.remarks||''].map(csvCell).join(','))];const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.getElementById('export').addEventListener('click',()=>downloadCsv(filteredAssets(),'DoWH-filtered-asset-register.csv'));
document.getElementById('export-all').addEventListener('click',()=>downloadCsv(allAssets,'DoWH-all-assets.csv'));
function parseCsv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field.replace(/\r$/,''));if(row.some(v=>v.trim()!==''))rows.push(row);row=[];field='';}else field+=c;}if(field.length||row.length){row.push(field.replace(/\r$/,''));if(row.some(v=>v.trim()!==''))rows.push(row);}if(rows.length<2)throw new Error('The CSV appears to be empty or has no data rows.');const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,'').trim());return rows.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??'']))).filter(o=>Object.values(o).some(v=>String(v).trim()!==''));}
function normalizedKey(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,'');}
function pick(obj,aliases){const entries=Object.entries(obj);for(const alias of aliases){const found=entries.find(([k,v])=>normalizedKey(k)===alias&&String(v).trim()!=='');if(found)return found[1];}return '';}
function parseNumber(v){if(v===null||v===undefined||String(v).trim()==='')return '';const n=Number(String(v).replace(/[,%$K\s]/g,''));return Number.isFinite(n)?n:'';}
function normalizeRecord(row,assetType){const id=pick(row,['assetid','id','bridgeid','culvertid','structureid','assetno','assetnumber','code']);const lat=parseNumber(pick(row,['latitude','lat','ycoord','ycoordinate']));const lon=parseNumber(pick(row,['longitude','lon','long','xcoord','xcoordinate']));if(lat===''||lon===''||lat < -90||lat > 90||lon < -180||lon > 180)throw new Error(`Record "${id||'(no ID)'}" needs decimal Latitude and Longitude columns (not projected Easting/Northing).`);const value=(aliases)=>pick(row,aliases);const out={...row,id:id||`${assetType==='bridge'?'B':'C'}-UPLOAD-${Math.random().toString(36).slice(2,7).toUpperCase()}`,lat,lon,name:value(['name','assetname','bridgename','location','sitename']),road:value(['road','roadname']),chainage:value(['chainage','chainagekm','km']),condition:value(['condition','assetcondition','physicalcondition']),length:parseNumber(value(['length','lengthm','structurelength'])),priority:value(['priority','maintenancepriority']),action:value(['action','recommendedaction','maintenanceaction']),type:value(['culverttype','structuretype','type']),blockage:parseNumber(value(['blockage','blockagepercent','blockagepct'])),inspection:value(['inspection','lastinspection','inspectiondate']),cost:parseNumber(value(['cost','repaircost','estimatedrepaircost','repairestimate','estimatedrepaircostpgk'])),remarks:value(['remarks','comment','notes'])};if(assetType==='bridge'&&!out.name)out.name=id||'Unnamed bridge';return out;}
document.getElementById('csv-upload').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;const status=document.getElementById('upload-status');try{const rows=parseCsv(await file.text());const typed=rows.map(row=>{const raw=pick(row,['assettype','assetcategory','structurecategory']);let type=String(raw).toLowerCase();if(type.includes('bridge'))return {row,type:'bridge'};if(type.includes('culvert'))return {row,type:'culvert'};const id=String(pick(row,['assetid','id','bridgeid','culvertid','assetno','assetnumber'])).toLowerCase();if(id.startsWith('b')||normalizedKey(Object.keys(row).find(k=>normalizedKey(k)==='bridgename')||''))return {row,type:'bridge'};if(id.startsWith('c')||normalizedKey(Object.keys(row).find(k=>normalizedKey(k)==='culvertid')||''))return {row,type:'culvert'};return {row,type:''};});let newBridges=[],newCulverts=[];const hasCombined=typed.some(x=>x.type==='bridge')&&typed.some(x=>x.type==='culvert');const unknown=typed.filter(x=>!x.type);if(unknown.length&&!hasCombined&&typed.every(x=>!x.type)){throw new Error('Could not identify asset type. Use a bridge-only CSV, a culvert-only CSV, or include an Asset Type column with Bridge/Culvert values.');}if(unknown.length)throw new Error('Some rows could not be identified as Bridge or Culvert. Add an Asset Type column to the CSV.');typed.forEach(x=>{const record=normalizeRecord(x.row,x.type);(x.type==='bridge'?newBridges:newCulverts).push(record);});if(hasCombined){bridgeRecords=newBridges;culvertRecords=newCulverts;}else if(typed.every(x=>x.type==='bridge'))bridgeRecords=newBridges;else if(typed.every(x=>x.type==='culvert'))culvertRecords=newCulverts;else throw new Error('Please upload one asset type at a time or use a combined CSV with Asset Type values.');rebuildAssets();status.textContent=`Loaded ${rows.length} record(s) from ${file.name}. This update is temporary for this browser session; export CSV to save a copy.`;status.classList.add('success');}catch(err){status.textContent=`Upload failed: ${err.message}`;status.classList.remove('success');}finally{event.target.value='';}});
// Use only the detailed QGIS2Web map; dashboard marker mode is removed from the interface.
const qgisWrap=document.getElementById('qgis-map-wrap');
const dashboardMap=document.getElementById('map');
qgisWrap.style.display='block';
dashboardMap.style.display='none';
function setMapMode(){qgisWrap.style.display='block';dashboardMap.style.display='none';}
document.getElementById('go-asset-map').addEventListener('click',()=>{document.querySelectorAll('.sidebar .nav').forEach(b=>b.classList.remove('active'));document.getElementById('go-asset-map').classList.add('active');document.querySelector('.map-card').scrollIntoView({behavior:'smooth',block:'start'});setMapMode();});
rebuildAssets();setMapMode();
