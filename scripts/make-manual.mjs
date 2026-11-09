// Writes manual.json: the steps that build this example's workflows in Fieldwork from an empty canvas.
// Nothing is random; running it again gives the same file. Usage: node scripts/make-manual.mjs <data commit>
import {writeFileSync} from 'node:fs';

const COMMIT=process.argv[2];
if(!/^[0-9a-f]{40}$/.test(COMMIT??''))throw new Error('Give the full commit the data files are read from.');
const RAW=`https://raw.githubusercontent.com/digital-twin-ph/example-2026-sea-level-rise-philippines/${COMMIT}/data/`;
const KEYS=['site_id','scenario','basis','family','year','quantile'];
const SELECT='Select rows by value',RELATE='Relate a column from another table';

const steps={
  newProject:()=>[
    {click:'#new-project',label:'New project',opens:'New project'},
    {fill:'project-name-input',label:'Name',value:'Sea-level rise at Manila’s health facilities',dialog:'New project'},
    {fill:'project-subject-input',label:'Subject',value:'Published sea-level projections, and which applies to each facility',dialog:'New project'},
    {click:'#project-create',label:'Create project',dialog:'New project'}],
  newWorkflow:()=>[{click:'#add-workflow',label:'Add workflow',view:'workflow'}],
  name:question=>[{fill:'workflow-name-edit',view:'project',label:'This workflow’s name — the question it answers',value:question}],
  // A POINT LAYER FROM A FILE OF THIS REPOSITORY.
  points:(as,path,label)=>[
    {add:'point_input',as},{select:as},
    {click:'#edit-input-data',label:'Prepare input data',opens:'Input data'},
    {choose:'input-mode',label:'Input method',value:'geojson',shown:'Import GeoJSON'},
    {file:'input-file',label:'Local file · 5 MB maximum',path},
    {click:'#input-apply',label:'Save Edits'},
    {fill:'source-label',label:'Source label',value:label},
    {click:'[data-label-form="source-label"] button',label:'Apply label'}],
  // THE STUDY AREA, the box the facilities were retrieved in, from its file.
  area:as=>[
    {add:'study_area',as},{select:as},
    {click:'#edit-study-area',label:'Select area on map',opens:'Choose your study area'},
    {click:'#area-file-source summary',label:'Use a boundary file you already have',dialog:'Choose your study area'},
    {fill:'area-file-name-key',label:'Property holding each boundary’s name',value:'name',dialog:'Choose your study area'},
    {file:'area-file-input',label:'Choose a GeoJSON file…',path:'data/manila-study-area.geojson',dialog:'Choose your study area'},
    {pick:'area-boundary-pick',label:'Units',values:['Manila coastal study area'],dialog:'Choose your study area'},
    {click:'#area-boundary-use',label:'Use the selected units',dialog:'Choose your study area'},
    {click:'#area-apply',label:'Apply study area',dialog:'Choose your study area'}],
  // THE PROJECTIONS, one row per gauge, scenario, family, year and quantile, fetched at a fixed commit.
  projections:as=>[
    {add:'table_input',as},{select:as},
    {click:'#open-table',label:'Configure…',opens:'Tabular data'},
    {click:'#table-remote summary',label:'Or fetch from a URL',dialog:'Tabular data'},
    {fill:'table-url',label:'URL of a CSV, Stata file or zip',value:RAW+'ar6-projections-philippine-gauges.csv',dialog:'Tabular data'},
    {click:'#table-fetch',label:'Fetch',dialog:'Tabular data'},
    {choose:'table-shape',label:'Shape of the file',value:'long',shown:'Long',dialog:'Tabular data'},
    {choose:'table-value',label:'Value column',value:'value_mm',dialog:'Tabular data'},
    {tick:'table-keys',label:'Key columns',values:KEYS,dialog:'Tabular data'},
    {fill:'table-unit',label:'Unit of the value (entered by you)',value:'millimetre',dialog:'Tabular data'},
    {click:'#table-save',label:'Apply',dialog:'Tabular data'}],
  // THE AR6 CONTRACT, a published ruleset: the dataset, its baseline, its unit and its three citations.
  contract:(as,from)=>[
    {add:'apply_ruleset',as},{select:as},
    {click:'#configure-step',label:'Configure…',opens:'Apply ruleset'},
    {choose:'ruleset-choice',label:'Ruleset',value:'urn:fieldwork:ruleset:extract-contract@1.0.0',dialog:'Apply ruleset'},
    {click:'#ruleset-config #config-apply',label:'Apply',dialog:'Apply ruleset'},
    {connect:{from,to:as,port:'projections'}}],
  // THE NEAREST GAUGE AND HOW FAR, by Measure distance: every gauge here has projections, so every one is eligible.
  nearest:(as,{points,sites})=>[
    {add:'measure_distance',as},
    {connect:{from:points,to:as,port:'points'}},
    {connect:{from:sites,to:as,port:'candidates'}}],
  keep:(as,from,column,value)=>[
    {add:'select_rows',as},{connect:{from,to:as,port:'records'}},{select:as},
    {click:'#configure-step',label:'Configure…',opens:SELECT},
    {choose:'select-key',label:'Key column to choose by',value:column,dialog:SELECT},
    {click:`label:has([data-select-value="${value}"])`,label:value,dialog:SELECT},
    {click:'#config-apply',label:'Apply',dialog:SELECT}],
};


// A NOTE OF THE WRITE-UP: its words, its function, whose words and argument where it draws on works, and each work it
// cites, entered through the note's citation builder so every one is checked as it is added.
const writeNote=({section,text,fn,words,argument,works=[]})=>[
  {click:`[data-add-note="${section}"]`,view:'notes',label:'note'},
  {fill:'note-text',label:'The note',value:text},
  {choose:'note-function',label:'Function',value:fn},
  ...(words?[{choose:'note-words',label:'Whose words?',value:words}]:[]),
  ...(argument?[{choose:'note-argument',label:'Whose argument?',value:argument}]:[]),
  ...(works.length?[{click:'[data-note-tab="cite"]',label:'Citations'}]:[]),
  ...works.flatMap(w=>[
    {choose:'cite-type',label:'Kind of work',value:w.type},
    {fill:'cite-authors',label:'Authors, one per line',value:w.authors},
    ...(w.etAl?[{click:'label:has(#cite-et-al)',label:'The work names more authors than these (et al.)'}]:[]),
    {fill:'cite-title',label:'Title',value:w.title},
    {fill:'cite-published',label:'Published',value:w.published},
    ...(w.container?[{fill:'cite-container',label:'Journal or containing work',value:w.container}]:[]),
    ...(w.volume?[{fill:'cite-volume',label:'Volume',value:w.volume}]:[]),
    ...(w.pages?[{fill:'cite-pages',label:'Pages',value:w.pages}]:[]),
    ...(w.publisher?[{fill:'cite-publisher',label:'Publisher',value:w.publisher}]:[]),
    ...(w.doi?[{fill:'cite-doi',label:'DOI',value:w.doi}]:[]),
    ...(w.url?[{fill:'cite-url',label:'URL',value:w.url}]:[]),
    ...(w.retrieved?[{fill:'cite-retrieved',label:'Accessed',value:w.retrieved}]:[]),
    {click:'#cite-add',label:'Add citation'}]),
  {click:'#note-save',label:'Add note'}];
const WORKS={
  ar6chapter:{type:'chapter',authors:'Fox-Kemper, B.',etAl:true,title:'Ocean, Cryosphere and Sea Level Change',published:'2021',
    container:'Climate Change 2021: The Physical Science Basis. Contribution of Working Group I to the Sixth Assessment Report of the Intergovernmental Panel on Climate Change',
    pages:'1211–1362',publisher:'Cambridge University Press',doi:'10.1017/9781009157896.011'},
  ar6data:{type:'dataset',authors:'Garner, Gregory G.',etAl:true,title:'IPCC AR6 Sea Level Projections, version 20210809',published:'2021-08-09',
    publisher:'Zenodo',doi:'10.5281/zenodo.5914709'},
  facts:{type:'article',authors:'Kopp, Robert E.',etAl:true,title:'The Framework for Assessing Changes To Sea-level (FACTS) v1.0',published:'2023',
    container:'Geoscientific Model Development',volume:'16',pages:'7461–7489',doi:'10.5194/gmd-16-7461-2023'},
  psmsl:{type:'webpage',authors:'Permanent Service for Mean Sea Level',title:'Manila, South Harbor: station 145',published:'2026-10-19',
    url:'https://psmsl.org/data/obtaining/stations/145.php',retrieved:'2026-11-09'},
  tao:{type:'article',authors:'Gatchalian, Ronaldo Cruz\nForsberg, René\nOlesen, Arne Vestergaard',title:'A new Philippine geoid model from airborne and terrestrial gravity data',
    published:'2021',container:'Terrestrial, Atmospheric and Oceanic Sciences',volume:'32',pages:'913–920',doi:'10.3319/TAO.2021.11.15.01'},
  namria:{type:'dataset',authors:'National Mapping and Resource Information Authority',title:'Philippine Geoid Model 2018 (PhilGeoidApp2019)',published:'2019',
    url:'https://www.namria.gov.ph/projects.aspx',retrieved:'2026-11-09'},
};
// THE WRITE-UP, as it would be submitted: what was asked, how, what was found, and what it does not say.
const WRITE_UP=[
  {section:'Introduction',fn:'context',words:'points',argument:'reports',works:[WORKS.ar6chapter],
    text:'Health facilities on low coasts are among the services a rising sea reaches first, and planning for them starts from a projection that applies to the place. IPCC AR6 publishes projections of relative sea-level change at tide gauges and on a grid, for several emissions scenarios. We asked which published projection applies to each of 194 health facilities in coastal Manila, how far from the facility it is measured, and how much sea level is projected to rise there by 2100.'},
  {section:'Methods',fn:'source',words:'points',argument:'reports',works:[WORKS.ar6data,WORKS.facts],
    text:'**Projections.** IPCC AR6 Sea Level Projections, version 20210809, medium confidence, extracted for the eight Philippine sites that are tide gauges: 288 values, for SSP1-2.6, SSP2-4.5 and SSP5-8.5, with and without vertical land motion, for 2050 and 2100, at the 0.17, 0.5 and 0.83 levels, in millimetres above the 1995–2014 mean. The middle level is reported as the median and the outer two as the likely range.'},
  {section:'Methods',fn:'source',
    text:'**Facilities.** 194 named hospitals (17) and clinics (177) from OpenStreetMap, retrieved on 2026-10-10 from the Humanitarian OpenStreetMap Team’s Philippines export and kept where they fall in a box over coastal Manila, 120.93° to 121.05° E and 14.52° to 14.68° N. © OpenStreetMap contributors, Open Database License 1.0. OpenStreetMap states no completeness, so this is what is mapped, not a register.'},
  {section:'Methods',fn:'method',
    text:'**Nearest gauge and its projection.** Each facility’s nearest gauge, and the great-circle distance to it on a sphere of 6,371.0088 km, came from Measure distance. Select rows narrowed the projections to one scenario, SSP2-4.5; one family, with vertical land motion; one year, 2100; and the median. Relate then brought that value beside each facility, matching its nearest gauge to the projections’ site.'},
  {section:'Methods',fn:'rationale',
    text:'**Why these choices.** SSP2-4.5 is an intermediate scenario, not a forecast. The family with vertical land motion is the change relative to the land, which is the change a building on that land meets; the family without it is reported beside it to show how much of the change is the land’s own motion. The median is reported with its likely range.'},
  {section:'Results',fn:'finding',
    text:'All 194 facilities are nearest the Manila, South Harbor gauge, PSMSL 145, at 0.9 to 13.4 km; the median distance is 6.5 km, and 61 are within 5 km.'},
  {section:'Results',fn:'finding',
    text:'By 2100 under SSP2-4.5, relative sea level at the Manila gauge is projected to rise 1,124 mm above the 1995–2014 mean (likely range 963 to 1,366 mm), including vertical land motion. Without it, the same projection is 602 mm (442 to 841 mm), so the land’s motion accounts for about 520 mm of the median.'},
  {section:'Discussion',fn:'context',words:'points',argument:'own',works:[WORKS.psmsl],
    text:'The land’s own motion roughly doubles the projected rise at Manila. The tide gauge’s record at PSMSL notes a rising trend “suspected to be due to deposition from the river discharges and excessive reclamation although subsidence not totally discarded”. A projection that left out vertical land motion would understate the change facilities here meet.'},
  {section:'Discussion',fn:'limitation',works:[WORKS.namria,WORKS.tao],words:'points',argument:'own',
    text:'**Not a flood map.** A rise at a gauge does not say which ground it would reach: that needs the ground’s height and the local sea’s, measured from the same surface. At the Manila gauge, EGM2008, which DeltaDTM and other open terrain models measure from, and NAMRIA’s gravimetric geoid agree within 2 mm (43.009 and 43.011 m above the ellipsoid), and NAMRIA’s geoid fitted to mean sea level stands 0.85 m above both, within about 10 cm. Which years that mean sea level stands for is not stated by NAMRIA, and it matters: the gauge’s 1995–2014 mean, the AR6 baseline, stands 104 to 757 mm above the means of earlier 19-year periods. No facility is said to lie below a projected sea level.'},
  {section:'Discussion',fn:'limitation',
    text:'**One projection for all.** Every facility takes the Manila gauge’s projection, from 0.9 to 13.4 km away. A projection is for its gauge, and how much the change varies across the city is not known from these data. The facilities are what OpenStreetMap maps, and an absence among them is not an absence on the ground.'},
  {section:'Discussion',fn:'verification',
    text:'**Checks.** The eight AR6 site numbers were compared with PSMSL’s station pages: number, name and position agree for all eight, although AR6’s own pages do not state the numbering. Both workflows were built by performing this repository’s manual from an empty canvas, and the published project is the result of that run.'},
];

const workflows=[];

// 1. WHICH GAUGE, AND HOW FAR: each facility's nearest gauge, by Measure distance, and the distance.
workflows.push({name:'Which tide gauge’s projection applies to each facility, and how far is it?',steps:[
  ...steps.newProject(),
  ...steps.name('Which tide gauge’s projection applies to each facility, and how far is it?'),
  {note:'A published sea-level projection is for a tide gauge, not for every place. Before reading one for a facility, find which gauge it is nearest and how far away that is.'},
  ...steps.area('area'),
  {note:'194 named hospitals and clinics in the box, as OpenStreetMap records them (ODbL). Not a register and not complete: an absence is not evidence of absence.'},
  ...steps.points('facilities','data/manila-health-facilities.geojson','Manila health facilities'),
  {note:'The eight Philippine tide gauges the projections cover.'},
  ...steps.points('sites','data/ar6-projection-sites.geojson','AR6 projection sites'),
  {note:'Find each facility’s nearest gauge and how far it is. Every one of the eight has projections.'},
  ...steps.nearest('nearest',{points:'facilities',sites:'sites'}),
  {add:'map_output',as:'map'},
  {connect:{from:'area',to:'map',port:'area'}},
  {connect:{from:'facilities',to:'map',port:'points'}},
  {select:'map'},
  {click:'#add-point-input',label:'Add point input'},
  {connect:{from:'sites',to:'map',port:'points_2'}},
  {select:'map'},
  {fill:'map-label',label:'Results tab name',value:'Facilities and gauges'},
  {add:'table_output',as:'table'},
  {connect:{from:'nearest',to:'table',port:'table'}},
  {run:true},
  {see:'every facility’s nearest gauge, Manila’s, 145, with its distance in kilometres',check:'145'}]});

// 2. HOW MUCH: the projections narrowed to one scenario, family, year and quantile, and the rise brought beside each
// facility, matched on its nearest gauge.
workflows.push({name:'How much is sea level projected to rise at each facility’s gauge by 2100?',steps:[
  ...steps.newWorkflow(),
  ...steps.name('How much is sea level projected to rise at each facility’s gauge by 2100?'),
  {note:'The same facilities, gauges and projections. Then one projection for each gauge, so it can be brought beside each facility.'},
  ...steps.area('area'),
  ...steps.points('facilities','data/manila-health-facilities.geojson','Manila health facilities'),
  ...steps.points('sites','data/ar6-projection-sites.geojson','AR6 projection sites'),
  ...steps.nearest('nearest',{points:'facilities',sites:'sites'}),
  {note:'The projections, in millimetres above the 1995–2014 average.'},
  ...steps.projections('projections'),
  {note:'Declare what the projections are: the AR6 dataset, its baseline, its unit and the three citations its licence asks for. A published ruleset holds them.'},
  ...steps.contract('extract','projections'),
  {note:'Narrow the projections to one of each: a middle-of-the-road scenario, SSP2-4.5; the rise relative to the land, which counts the land’s own sinking; 2100; and the middle of the likely range. Each is a choice you state; the file holds the others.'},
  ...steps.keep('scenario','extract','scenario','ssp245'),
  ...steps.keep('family','scenario','family','with_vlm'),
  ...steps.keep('year','family','year','2100'),
  ...steps.keep('median','year','quantile','0.5'),
  {note:'Bring each gauge’s rise beside each facility, matched on the gauge: Measure distance names it nearest_site_id, the projections site_id.'},
  {add:'relate_table',as:'rise'},
  {connect:{from:'nearest',to:'rise',port:'records'}},
  {connect:{from:'median',to:'rise',port:'related'}},
  {select:'rise'},
  {click:'#configure-step',label:'Configure…',opens:RELATE},
  {choose:'relate-on',label:'Matched on, in the first table',value:'nearest_site_id',dialog:RELATE},
  {choose:'relate-right-on',label:'The same, in the second table',value:'site_id',dialog:RELATE},
  {choose:'relate-bring',label:'Bring across',value:'value_mm',dialog:RELATE},
  {click:'#config-apply',label:'Apply',dialog:RELATE},
  {add:'table_output',as:'table'},
  {connect:{from:'rise',to:'table',port:'table'}},
  {run:true},
  {see:'each facility, its gauge, its distance, and the rise there: 1,124 mm by 2100 under SSP2-4.5, the middle projection, with vertical land motion',check:'1124'},
  // THE DIAGRAM, AS A NOTE OF THE PROJECT: why a rise at a gauge is not a flood map, in the Introduction of the write-up.
  {note:'In Notes, add a note to the Introduction saying why a rise at a gauge does not say which ground would flood, with the vertical-datum diagram from this repository.'},
  {click:'[data-add-note="Introduction"]',view:'notes',label:'note'},
  {fill:'note-text',label:'The note',value:'A projected rise is a change in the sea’s level at a tide gauge. Saying which ground it would reach needs the height of the ground and the height of the local sea measured from the same surface, and open terrain models measure from a geoid, not from the local sea.'},
  {click:'[data-note-tab="image"]',label:'Image'},
  {file:'note-image-file',label:'Picture: PNG, JPEG, WebP or SVG',path:'docs/vertical-datums.svg'},
  {fill:'note-image-alt',label:'Alt text: what the picture shows',value:'A cross-section of a low coast, not to scale. From the bottom: the WGS84 ellipsoid; the geoid; local mean sea level over 1995–2014, the AR6 baseline, above the geoid by an offset; and a projected sea level above that. On land, bare ground and the surface with roofs and trees.'},
  {fill:'note-image-caption',label:'Caption: what a reader is to take from it',value:'Heights and the surfaces they are measured from. A terrain model gives H above the geoid; a projection is a rise above local mean sea level; comparing them needs the offset between the two. Not to scale.'},
  {click:'#note-save',label:'Add note'},
  {see:'the diagram above the note, with its caption',within:'.notes-part[data-section="Introduction"]',check:'Heights and the surfaces they are measured from'},
  {note:'Then the write-up as it would be submitted: what was asked, the sources and methods, what was found, and what it does not say. Each work is cited through the note’s citation builder and numbered in References.'},
  ...WRITE_UP.flatMap(writeNote),
  {see:'eleven authored notes across the four parts, and References listing the five works cited',within:'.notes-part[data-section="References"]',check:'Kopp'}]});

writeFileSync(new URL('../manual.json',import.meta.url),JSON.stringify({
  schema:'fieldwork/worked-example-manual/1',example:'urn:fieldwork:example:sea-level-rise-philippines',
  intro:'Each workflow reads the files of this repository: the projections fetched at a fixed commit, the points and the study area chosen from a downloaded copy. Start from an empty canvas: Project, then New project.',
  workflows},null,1)+'\n');
console.log('wrote manual.json:',workflows.map(w=>`${w.name} (${w.steps.length} steps)`).join('; '));
