# Sea-level rise at Manila's health facilities

Published sea-level projections for eight Philippine tide gauges, and 194 health facilities in a box over coastal
Manila. Three questions: which gauge's projection applies to each facility, and how far is it; how much is sea level
projected to rise there; and which facilities stand on ground below the sea level projected for 2100.

**This is not a flood model.** The third question compares three numbers: the ground's height, the local sea's, and
the projected rise, measured from one surface. No seawall, drain, pump or connection to the sea is in it. See
[What this does not say](#what-this-does-not-say).

## The files

| File | What it holds |
| --- | --- |
| `data/ar6-projections-philippine-gauges.csv` | 288 projections: 8 gauges × 3 scenarios × with and without vertical land motion × 2050 and 2100 × 3 quantiles, in millimetres |
| `data/ar6-projection-sites.geojson` | The 8 tide gauges, with `site_id` and `name` |
| `data/manila-study-area.geojson` | The study area: a box over coastal Manila, 120.93° to 121.05° E, 14.52° to 14.68° N |
| `data/deltadtm-manila.tif` | DeltaDTM v1.1 around the study area: bare ground above EGM2008, 1 arcsecond, cut on the source's own cells. 30 is its ceiling, not a height |
| `data/dtu25mss-manila.tif` | DTU25MSS around the study area: the 1993–2012 mean sea surface above the WGS84 ellipsoid, 0.01°, values at grid nodes as published |
| `scripts/make_grid_subsets.py` | Makes both from where they are published, reading only what is needed. Neither publisher lets a browser read its file in parts; both whole files can be downloaded instead and chosen in Fieldwork |
| `docs/vertical-datums.svg` | The heights a flood question would need, and how they relate. Not to scale |

### The projections

Columns as the file spells them:

| Column | Holds |
| --- | --- |
| `site_id` | The AR6 site: a tide gauge. All eight match a PSMSL station by number, name and position ([145](https://psmsl.org/data/obtaining/stations/145.php) is Manila, South Harbor), checked 2026-11-09; AR6's own pages do not say so |
| `scenario` | `ssp126`, `ssp245` or `ssp585` |
| `basis` | `medium`: medium confidence. A confidence level, not a model |
| `family` | `with_vlm`: the sea's rise relative to the land, including the land's own rise or sinking. `without_vlm`: the sea's rise alone |
| `year` | `2050` or `2100` |
| `quantile` | `0.17`, `0.5` or `0.83`: the likely range and its middle |
| `value_mm` | The rise above the 1995–2014 average, in millimetres |

At Manila's gauge (145), by 2100 under SSP2-4.5, the middle projection is 1,124 mm with vertical land motion and
602 mm without it. The land sinking there roughly doubles the rise.

### The facilities

Not a file here: each workflow finds them with Fieldwork's **Find health facilities**, from the Humanitarian
OpenStreetMap Team's Philippines export (`hotosm_phl_health_facilities_points_geojson.zip`, 452,007 bytes, rebuilt
2026-05-05), keeping named hospitals and clinics inside the study area: 194. What OpenStreetMap records, not a facility
register, and not complete: an absence is not evidence of absence on the ground. The export is rebuilt from time to
time, so a later retrieval may find a different number; the project records when it retrieved and what it kept.

## Workflows

The project file `fieldwork-project.json.gz` holds the workflows and a write-up of fourteen notes, as it would be
submitted: the question and the datum diagram in the Introduction, sources and methods, the two findings, and in the
Discussion what the land's motion means, why this is not a flood map, and the checks made. Eight works are cited.
`manual.json` builds all of it from an empty canvas.

1. **Which tide gauge's projection applies to each facility, and how far is it?** **Measure distance** finds each
   facility's nearest gauge; all eight have projections. All 194 are nearest Manila's.
2. **How much is sea level projected to rise at each facility's gauge by 2100?** The projections are narrowed to one
   scenario, one family, one year and the middle quantile, and **Relate** brings the rise beside each facility,
   matching its nearest gauge (`nearest_site_id`) to the projections' `site_id`.
3. **Which facilities stand on ground below the sea level projected for 2100?** Raster input keeps three grids around
   the study area: EGM2008 read where PROJ publishes it, and the two subsets here. Sample raster reads the ground at
   each facility and the sea surface and geoid at each gauge. Rules written on the canvas put the ground above the AR6
   baseline, and the published ruleset *Compare a projected rise with an elevation* sets the rise against it:
   **16 of 194**. A check in Python on the source files gives the same.

## What this does not say

- **Which places would flood.** The third workflow compares numbers: no seawall, drain, pump or connection to the sea
  is in it, so it is an upper estimate of exposure. DeltaDTM's mean absolute error, 0.45 m, is a third of the rise, so
  facilities near the line could fall either side. [What a flood question would need](#what-a-flood-question-would-need)
  says how the heights were put in one frame.
- **Anywhere but at Manila's gauge.** The sea's height is the gauge's, applied to facilities up to 13 km away; the
  gauge is read at the sites file's position, 14.58° N 120.97° E, rounded from PSMSL's.
- **That a facility's rise is its gauge's.** A projection is for a gauge. The distance to it is part of the result.
- **Anything about health.** No outcome is here.

## What a flood question would need

From Fieldwork's research note on terrain models and vertical datums, 2026-11-07 to 2026-11-09.

**How the third workflow does it, with no national datum.** A mean sea surface is a height above the ellipsoid; a geoid
is too. At the gauge, DTU25MSS less EGM2008 is the 1993–2012 mean sea level above EGM2008, the surface DeltaDTM measures
from: 0.90 m at the sites file's position. The gauge's own record (PSMSL 145) puts 1995–2014, the AR6 baseline, 0.037 m
higher. So ground DeltaDTM gives as H stands about H − 0.94 m above the baseline there. NAMRIA's geoid fitted to mean
sea level agrees within 10 cm, its stated error, but it does not say which years its mean sea level stands for, which
by the gauge's record matters by up to 0.76 m.

The tables below are what was compared to get there.

![A cross-section of a low coast, not to scale. From the bottom: the WGS84 ellipsoid; the geoid (EGM2008, EGM96); local mean sea level over 1995–2014, the AR6 baseline, above the geoid by an offset; and a projected sea level, the baseline plus the AR6 rise. On land, bare ground and the surface with roofs and trees. At one place, h = H + N, and its height above local sea is H minus the offset.](docs/vertical-datums.svg)

A projected sea level is a height above the **1995–2014 local mean sea level**. An open terrain model gives a height
above a **geoid**. Comparing the two needs the offset between that geoid and local mean sea level at Manila, which can
be tens of centimetres to more than a metre.

**Open terrain models:**

| Model | Heights measured from | Licence | The surface |
| --- | --- | --- | --- |
| DeltaDTM v1.1 ([data record](https://data.4tu.nl/datasets/1da2e70f-6c4d-4b03-86bd-b53e789cc629), doi:10.4121/21997565) | **EGM2008**, as its paper states ([`docs/41597_2024_Article_3091.pdf`](docs/41597_2024_Article_3091.pdf), CC BY 4.0) | CC BY 4.0 | Bare ground, made for low coasts; stated error about 0.43 m |
| Copernicus DEM GLO-30 | EGM2008 geoid | Free, credited "© DLR e.V." | Roofs and trees included |
| NASADEM | EGM96 geoid | NASA data, any use; its archive asks for a login | Roofs and trees included, from 2000 radar |
| FABDEM | EGM2008, by one secondary source | CC BY-NC-SA 4.0: non-commercial | Bare ground |

**The geoid-to-sea-level offset:**

| Source | What it gives | Open? |
| --- | --- | --- |
| PGM2018, NAMRIA's Philippine geoid ([NAMRIA](https://www.namria.gov.ph/projects.aspx); method: Gatchalian, Forsberg and Olesen 2021, [doi:10.3319/TAO.2021.11.15.01](https://doi.org/10.3319/TAO.2021.11.15.01)) | A geoid fitted to each island's mean sea level, and a gravimetric one | Downloadable without sign-in; NAMRIA says the files are for public use |
| DTU22MDT, DTU Space (doi:10.11583/DTU.26947894) | The mean sea surface above a geoid, 1993–2012 | Licence not confirmed |
| CNES-CLS22, AVISO+ | The same, 1993–2012 | Needs an account and a licence agreement: not open |

**At the Manila gauge, 2026-11-09:**

| Surface | Height above the ellipsoid |
| --- | --- |
| EGM2008, which DeltaDTM and Copernicus DEM measure from | 43.009 m |
| PGM2018, gravimetric | 43.011 m |
| PGM2018, fitted to mean sea level (ITRF) | 43.862 m |

So a DeltaDTM height at Manila is about 0.85 m more than the same ground's height above NAMRIA's mean sea level, within
about 10 cm, the fitted model's stated error. This holds on Luzon only: each island has its own mean sea level.

**Not established: which years NAMRIA's mean sea level stands for.** NAMRIA's documents say the network was levelled from
the Manila harbour tide-gauge benchmark, BM-66, from the early 1900s, and that mean sea level is taken over about 19
years; none gives the years. It matters: by PSMSL's record at the gauge, the 1995–2014 mean, AR6's baseline, stands
757 mm above the 1902–1920 mean, 686 mm above 1947–1965 and 104 mm above 1990–2008. Until NAMRIA says which, nothing
here can say that a place lies below a projected sea level.

## Source, terms and credit

**Sea-level projections and sites:** IPCC AR6 Sea Level Projections, version 20210809,
[doi:10.5281/zenodo.5914709](https://doi.org/10.5281/zenodo.5914709). CC BY 4.0. Extracted for eight Philippine
gauges by `validation-lab/scripts/extract_ar6_philippines.py`; values unchanged. Its terms ask for three citations:

- Fox-Kemper, B., et al. 2021: Ocean, Cryosphere and Sea Level Change. In *Climate Change 2021: The Physical Science
  Basis*. IPCC AR6 WG1, Chapter 9. [doi:10.1017/9781009157896.011](https://doi.org/10.1017/9781009157896.011)
- Kopp, R. E., Garner, G. G., et al. 2023. The Framework for Assessing Changes To Sea-Level (FACTS) v1.0.
  *Geoscientific Model Development* 16, 7461–7489. [doi:10.5194/gmd-16-7461-2023](https://doi.org/10.5194/gmd-16-7461-2023)
- Garner, G. G., et al. 2021. IPCC AR6 Sea Level Projections. Version 20210809.
  [doi:10.5281/zenodo.5914709](https://doi.org/10.5281/zenodo.5914709)

**Health facilities:** © OpenStreetMap contributors, prepared by the Humanitarian OpenStreetMap Team. Open Database
License (ODbL) 1.0, [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright).
The project file holds the facilities its workflows retrieved, a database derived from it and offered under the ODbL:
kinds other than hospital and clinic, unnamed facilities and those outside the study area left out.

**Ground:** DeltaDTM v1.1, Pronk, M., et al. 2024. DeltaDTM: A global coastal digital terrain model. *Scientific Data*
11, 273. [doi:10.1038/s41597-024-03091-9](https://doi.org/10.1038/s41597-024-03091-9); data
[doi:10.4121/21997565](https://doi.org/10.4121/21997565). CC BY 4.0. `data/deltadtm-manila.tif` is cut from its two
tiles N14E120 and N14E121, values unchanged. The paper is in `docs/`, under the same licence.

**Mean sea surface:** DTU25MSS, Andersen, O. B., and Nilsson, B. 2025, DTU Space,
[doi:10.11583/DTU.29412275](https://doi.org/10.11583/DTU.29412275). CC BY 4.0. `data/dtu25mss-manila.tif` is cut from
`DTU25MSS_WGS84.nc`, values unchanged.

**Geoid:** EGM2008, US National Geospatial-Intelligence Agency, public domain, read by Fieldwork from PROJ's
`us_nga_egm08_25.tif` on cdn.proj.org.

**Study area, diagram, manual and scripts:** the Fieldwork project, [digital-twin-ph](https://github.com/digital-twin-ph).
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), no rights reserved, as in the rulesets example.
