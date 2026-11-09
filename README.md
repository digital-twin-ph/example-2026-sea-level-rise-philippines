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
| `site_id` | The AR6 site: a tide gauge, by its PSMSL number |
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

The project file `fieldwork-project.json.gz` holds the workflows; `manual.json` builds them from an empty canvas.

1. **Which tide gauge's projection applies to each facility, and how far is it?** Each facility is assigned its
   nearest gauge that has a projection. All 194 are nearest Manila's.
2. **How much is sea level projected to rise at each facility's gauge by 2100?** The projections are narrowed to one
   scenario, one family, one year and the middle quantile, and the rise is brought beside each facility.

## What this does not say

- **Which places would flood.** That needs the ground's height and the local sea's height measured from the same
  surface. Open terrain models give heights above a geoid, not above the local sea, and the offset between the two
  at Manila is not in this repository. `docs/vertical-datums.svg` draws the relation.
- **That a facility's rise is its gauge's.** A projection is for a gauge. The distance to it is part of the result.
- **Anything about health.** No outcome is here.

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
