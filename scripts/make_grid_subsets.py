"""Cut the two grids this example reads around Manila from where they are published, reading only what is needed.

    python -I scripts/make_grid_subsets.py data/

Neither publisher's server lets a browser read its file by range (no Access-Control-Allow-Origin), so Fieldwork cannot
read them where they are published; it reads these subsets instead, or the whole files once downloaded to a laptop.
EGM2008 needs no subset: cdn.proj.org allows it, and Fieldwork reads it there.

- DTU25MSS (Andersen and Nilsson, DTU Space, doi:10.11583/DTU.29412275, CC BY 4.0): the mean sea surface of 1993-2012
  above the WGS84 ellipsoid, 0.01 degree. Its values sit at grid nodes, and the subset keeps them so (PixelIsPoint).
- DeltaDTM v1.1 (Pronk et al. 2024, doi:10.4121/21997565, CC BY 4.0): bare ground above EGM2008, 1 arcsecond, from
  the two tiles inside Asia.zip that cover the study area. A value of 30 is DeltaDTM's ceiling, not a height.

Both are written unchanged in value, as single-band GeoTIFFs in EPSG:4326, deflate-compressed. Needs h5py, numpy and
rasterio. Reads about 30 MB.
"""
from __future__ import annotations

import io
import sys
import urllib.request
import zipfile

import h5py
import numpy as np
import rasterio
from rasterio.io import MemoryFile
from rasterio.merge import merge
from rasterio.transform import from_origin
from rasterio.windows import from_bounds

DTU = "https://ndownloader.figshare.com/files/55747802"  # DTU25MSS_WGS84.nc, 2,947,503,242 bytes
ASIA = "https://data.4tu.nl/file/1da2e70f-6c4d-4b03-86bd-b53e789cc629/672eba4c-1334-44c6-8119-8879ded25912"
TILES = ["DeltaDTM_v1_1_N14E120.tif", "DeltaDTM_v1_1_N14E121.tif"]
# The study area, 120.93-121.05 E and 14.52-14.68 N, with room around it.
WEST, EAST, SOUTH, NORTH = 120.90, 121.10, 14.50, 14.70


class HTTPRange(io.RawIOBase):
    """A read-only file over HTTP byte ranges, so h5py and zipfile read only the parts they need."""

    def __init__(self, url: str, block: int = 1 << 20):
        self.url, self.block, self.pos, self.cache = url, block, 0, {}
        # The size from a one-byte range, not HEAD: figshare's download link refuses HEAD.
        request = urllib.request.Request(url, headers={"Range": "bytes=0-0", "User-Agent": "fieldwork-example"})
        with urllib.request.urlopen(request, timeout=60) as response:
            self.size = int(response.headers["Content-Range"].split("/")[1])

    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        return self.pos

    def _block(self, i):
        if i not in self.cache:
            a = i * self.block
            b = min(self.size, a + self.block) - 1
            request = urllib.request.Request(self.url, headers={"Range": f"bytes={a}-{b}", "User-Agent": "fieldwork-example"})
            with urllib.request.urlopen(request, timeout=120) as response:
                self.cache[i] = response.read()
        return self.cache[i]

    def readinto(self, buffer):
        n = min(len(buffer), self.size - self.pos)
        if n <= 0:
            return 0
        out = bytearray()
        while len(out) < n:
            i, o = divmod(self.pos + len(out), self.block)
            out += self._block(i)[o:o + n - len(out)]
        buffer[:n] = out
        self.pos += n
        return n


def dtu_subset(path: str) -> None:
    with h5py.File(HTTPRange(DTU), "r") as h:
        lat, lon = h["latitude"][:], h["longitude"][:]
        r0, r1 = int(np.searchsorted(lat, SOUTH - 1e-9)), int(np.searchsorted(lat, NORTH + 1e-9))
        c0, c1 = int(np.searchsorted(lon, WEST - 1e-9)), int(np.searchsorted(lon, EAST + 1e-9))
        mss = h["mss"][r0:r1, c0:c1][::-1]  # north first, as a GeoTIFF is written
        north_node, west_node = float(lat[r1 - 1]), float(lon[c0])
    profile = dict(driver="GTiff", width=mss.shape[1], height=mss.shape[0], count=1, dtype="float64", crs="EPSG:4326",
                   # A node grid: the tie point is the first node. rasterio writes AREA_OR_POINT from the tag below.
                   transform=from_origin(west_node - 0.005, north_node + 0.005, 0.01, 0.01), compress="deflate")
    with rasterio.open(path, "w", **profile) as out:
        out.update_tags(AREA_OR_POINT="Point", SOURCE="DTU25MSS_WGS84.nc, doi:10.11583/DTU.29412275, CC BY 4.0",
                        PERIOD="1993-2012 mean sea surface", UNITS="metres above the WGS84 ellipsoid")
        out.write(mss, 1)
    print(path, mss.shape)


def deltadtm_subset(path: str) -> None:
    zip_file = zipfile.ZipFile(HTTPRange(ASIA, block=4 << 20))
    sources = []
    for name in TILES:
        memory = MemoryFile(zip_file.read(name))
        sources.append(memory.open())
    # CUT ON THE SOURCE'S OWN CELL EDGES. Bounds that fall between them make merge resample, shifting every cell by a
    # fraction of itself: a facility then reads its neighbour's height (found 2026-11-09, one facility across the line).
    t0 = sources[0].transform
    snap = lambda value, origin, step: origin + round((value - origin) / step) * step
    bounds = (snap(WEST, t0.c, t0.a), snap(SOUTH, t0.f, t0.e), snap(EAST, t0.c, t0.a), snap(NORTH, t0.f, t0.e))
    mosaic, transform = merge(sources, bounds=bounds)
    assert abs((transform.c - t0.c) / t0.a - round((transform.c - t0.c) / t0.a)) < 1e-6, "the subset's cells are not the source's"
    profile = dict(driver="GTiff", width=mosaic.shape[2], height=mosaic.shape[1], count=1, dtype="float32",
                   crs="EPSG:4326", transform=transform, nodata=-9999.0, compress="deflate", tiled=True,
                   blockxsize=256, blockysize=256)
    with rasterio.open(path, "w", **profile) as out:
        out.update_tags(AREA_OR_POINT="Area", SOURCE="DeltaDTM v1.1, doi:10.4121/21997565, CC BY 4.0",
                        UNITS="metres above EGM2008", CEILING="30 means above DeltaDTM's range")
        out.write(mosaic[0], 1)
    print(path, mosaic.shape[1:])


if __name__ == "__main__":
    folder = sys.argv[1].rstrip("/")
    dtu_subset(f"{folder}/dtu25mss-manila.tif")
    deltadtm_subset(f"{folder}/deltadtm-manila.tif")
