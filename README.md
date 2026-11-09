# Sea-level rise at Manila's health facilities

Published sea-level projections for eight Philippine tide gauges, and 194 health facilities in a box over coastal
Manila. Two questions: which gauge's projection applies to each facility, and how far is it; and how much is sea level
projected to rise there.

**This is not a flood model.** A projected rise is a change in the sea's level relative to land, at a gauge. It
does not say which ground the sea would reach. That needs the height of the ground and the height of the local sea
measured from the same surface, and this repository holds neither. See [What this does not say](#what-this-does-not-say).

## The files

| File | What it holds |
| --- | --- |
| `data/ar6-projections-philippine-gauges.csv` | 288 projections: 8 gauges × 3 scenarios × with and without vertical land motion × 2050 and 2100 × 3 quantiles, in millimetres |
| `data/ar6-projection-sites.geojson` | The 8 tide gauges, with `site_id` and `name` |
| `data/manila-health-facilities.geojson` | 194 named hospitals and clinics from OpenStreetMap, inside the study area |
| `data/manila-study-area.geojson` | The study area: a box over coastal Manila, 120.93° to 121.05° E, 14.52° to 14.68° N |
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

What OpenStreetMap records, not a facility register, and not complete. An absence here is not evidence of absence on
the ground. Retrieved on 2026-10-10 by Fieldwork's **Find health facilities** from the Humanitarian OpenStreetMap
Team's Philippines export (`hotosm_phl_health_facilities_points_geojson.geojson`, 452,007 bytes), kinds hospital and
clinic, named, clipped to the study area: 194 kept. **Find health facilities** retrieves them again, live.

## Workflows

The project file `fieldwork-project.json.gz` holds the workflows and a write-up of twelve notes, as it would be
submitted: the question and the datum diagram in the Introduction, sources and methods, the two findings, and in the
Discussion what the land's motion means, why this is not a flood map, and the checks made. Five works are cited.
`manual.json` builds all of it from an empty canvas.

1. **Which tide gauge's projection applies to each facility, and how far is it?** **Measure distance** finds each
   facility's nearest gauge; all eight have projections. All 194 are nearest Manila's.
2. **How much is sea level projected to rise at each facility's gauge by 2100?** The projections are narrowed to one
   scenario, one family, one year and the middle quantile, and **Relate** brings the rise beside each facility,
   matching its nearest gauge (`nearest_site_id`) to the projections' `site_id`.

## What this does not say

- **Which places would flood.** That needs the ground's height and the local sea's height measured from the same
  surface. Open terrain models give heights above a geoid, not above the local sea, and the offset between the two
  at Manila is not in this repository. [What a flood question would need](#what-a-flood-question-would-need) says
  what is known.
- **That a facility's rise is its gauge's.** A projection is for a gauge. The distance to it is part of the result.
- **Anything about health.** No outcome is here.

## What a flood question would need

Read on 2026-11-07 and 2026-11-08 for Fieldwork's research note on terrain models and vertical datums. Nothing was
downloaded and nothing here is built.

![A cross-section of a low coast, not to scale. From the bottom: the WGS84 ellipsoid; the geoid (EGM2008, EGM96); local mean sea level over 1995–2014, the AR6 baseline, above the geoid by an offset; and a projected sea level, the baseline plus the AR6 rise. On land, bare ground and the surface with roofs and trees. At one place, h = H + N, and its height above local sea is H minus the offset.](docs/vertical-datums.svg)

A projected sea level is a height above the **1995–2014 local mean sea level**. An open terrain model gives a height
above a **geoid**. Comparing the two needs the offset between that geoid and local mean sea level at Manila, which can
be tens of centimetres to more than a metre.

**Open terrain models:**

| Model | Heights measured from | Licence | The surface |
| --- | --- | --- | --- |
| DeltaDTM v1.1 ([data record](https://data.4tu.nl/datasets/1da2e70f-6c4d-4b03-86bd-b53e789cc629), doi:10.4121/21997565) | Not stated in its data record; EGM2008 is likely, an inference | CC BY 4.0 | Bare ground, made for low coasts; stated error about 0.43 m |
| Copernicus DEM GLO-30 | EGM2008 geoid | Free, credited "© DLR e.V." | Roofs and trees included |
| NASADEM | EGM96 geoid | NASA data, any use; its archive asks for a login | Roofs and trees included, from 2000 radar |
| FABDEM | EGM2008, by one secondary source | CC BY-NC-SA 4.0: non-commercial | Bare ground |

**The geoid-to-sea-level offset:**

| Source | What it gives | Open? |
| --- | --- | --- |
| PGM2018, NAMRIA's Philippine geoid ([ISG](https://isgeoid.polimi.it/Geoid/Asia/Philippines/philippines18_g.html)) | A geoid fitted to the Philippine datum; its difference from EGM2008 would be the offset | Served without sign-in; **no licence stated** |
| DTU22MDT, DTU Space (doi:10.11583/DTU.26947894) | The mean sea surface above a geoid, 1993–2012 | Licence not confirmed |
| CNES-CLS22, AVISO+ | The same, 1993–2012 | Needs an account and a licence agreement: not open |

**Not established:** DeltaDTM's datum (its methods paper was not read); PGM2018's licence; the correction from the
Philippine datum's epoch to 1995–2014; whether a levelled tide gauge at Manila gives the offset directly. Until the
datum and the offset are both sourced, nothing here can say that a place lies below a projected sea level.

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
`data/manila-health-facilities.geojson` is a database derived from it and is offered under the ODbL. It was changed
from the source: kinds other than hospital and clinic, unnamed facilities and those outside the study area left out.

**Study area, diagram, manual and scripts:** the Fieldwork project, [digital-twin-ph](https://github.com/digital-twin-ph).
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), no rights reserved, as in the rulesets example.
