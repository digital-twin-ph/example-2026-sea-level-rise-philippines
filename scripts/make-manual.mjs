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
  {see:'the diagram above the note, with its caption',within:'.notes-part[data-section="Introduction"]',check:'Heights and the surfaces they are measured from'}]});

writeFileSync(new URL('../manual.json',import.meta.url),JSON.stringify({
  schema:'fieldwork/worked-example-manual/1',example:'urn:fieldwork:example:sea-level-rise-philippines',
  intro:'Each workflow reads the files of this repository: the projections fetched at a fixed commit, the points and the study area chosen from a downloaded copy. Start from an empty canvas: Project, then New project.',
  workflows},null,1)+'\n');
console.log('wrote manual.json:',workflows.map(w=>`${w.name} (${w.steps.length} steps)`).join('; '));
