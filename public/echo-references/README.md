# Echocardiography reference media

The four TTE files below are redistributed unchanged. Five TEE files are included
as lossless WebM conversions; two ICE topic references have identifying header
fields masked before lossless conversion. Creator, source and
license links appear in the reference panel. Licenses apply to their media.

| File | Creator | Source | License |
|---|---|---|---|
| plax.gif | Patrick J. Lynch and C. Carl Jaffe | [LeftParasternalLongAxis.gif](https://commons.wikimedia.org/wiki/File:LeftParasternalLongAxis.gif) | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5/) |
| a2c.webm | CardioNetworks: Vdbilt | [A2Cnormal](https://commons.wikimedia.org/wiki/File:A2Cnormal_(CardioNetworks_ECGpedia).avi.webm) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| a3c.webm | CardioNetworks: Vdbilt | [A3Cnormal](https://commons.wikimedia.org/wiki/File:A3Cnormal_(CardioNetworks_ECGpedia).avi.webm) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| a4c.webm | CardioNetworks: Vdbilt | [A4C normal](https://commons.wikimedia.org/wiki/File:A4C_normal_(CardioNetworks_ECHOpedia).webm) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |

The videos retain their on-screen credit to the Department of Echocardiography
AMC and I.A.C. van der Bilt, MD. Commons records permission ticket
2011102310008874 for these three files. Source metadata and file checksums are
recorded in src/echo-reference-catalog.js (accessed 2026-10-25).

PLAX is a still composite of an echo image and an anatomical illustration, not a
cine loop. The three apical videos are labeled normal by their original source;
this is not an independent clinical assessment. No source media are registered to
the atlas or synchronized to its simulated cardiac cycle.

## TEE recordings

| Delivered file | Source supplement | Creator | License |
|---|---|---|---|
| tee-me4c.webm | [Rest four-chamber, additional file 5](https://doi.org/10.1186/1476-7120-8-30) | Legault S, Sénéchal M, Bergeron S, Arsenault M, Tessier M, Guimond J, Poirier P | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| tee-me2c.webm | [Rest two-chamber, additional file 1](https://doi.org/10.1186/1476-7120-8-30) | Same authors | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| tee-melax.webm | [Rest three-chamber, additional file 3](https://doi.org/10.1186/1476-7120-8-30) | Same authors | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| tee-tgsax.webm | [Rest mid-papillary short-axis, additional file 7](https://doi.org/10.1186/1476-7120-8-30) | Same authors | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| tee-bicaval.webm | [Bicaval SVC mass case, additional file 1](https://doi.org/10.1186/1757-1626-1-272) | Tzortzis S, Apostolakis S, Xenakis K, Spiropoulos G, Lazaridis K | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |

The first four TEE recordings are resting acquisitions from a TE-DSE study, not
asserted normal controls. The source protocol calls the two-chamber acquisition
60°, unlike this atlas's 105° preset; this difference is visible in the panel.
The bicaval recording is explicitly labeled a pathology case (SVC mass extending
into the RA), with color Doppler. It must not be presented as normal anatomy.

Changes: Ogg/Theora to lossless WebM/VP9, video only, without crop or resizing.
Every decoded frame was compared with the source using FFmpeg framemd5; all
218 frames were identical. No source credits or annotations were removed.
Original files: `research/echo/source-media/`. Exact download URLs, creators,
source descriptions and source SHA-256 values: `research/echo/tee-media-sources.json`.
Output SHA-256 and decoded-frame verification: `research/echo/tee-media-verification.json`.
Source metadata and licenses accessed 2026-10-25.

## ICE topic references

| Delivered file | Source | Creator | License |
|---|---|---|---|
| ice-septal-crossing.webm | [Fossa ovalis puncture, supplementary movie 1](https://doi.org/10.1186/1476-7120-2-20) | Citro R, Ducceschi V, Salustri A, Santoro M, Salierno M, Gregorio G | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| ice-septal-distorted.webm | [Distorted septal anatomy, additional file 2](https://doi.org/10.1186/1476-7120-3-5) | Shalganov T, Paprika D, Borbas S, Temesvari A, Szili-Torok T | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |

Both are 360° mechanical/radial ICE recordings. They are related to the
transseptal topic, not direct matches to the simulator's phased-array sector
plane. The second is a pathological/distorted-anatomy case in which the authors
abandoned the LA procedure, not a normal or safe puncture example. Their choice
does not move the model catheter or synchronize the video to the procedural
stages. The selected recording persists across language and view changes.

Changes: identifying name/ID/date header fields are masked and the Ogg/Theora
video is converted to lossless WebM/VP9. No scaling or cropping is used. All 279
decoded output frames were compared with header-masked source frames; they
match exactly. Source files with identifying headers are not retained in this
repository or redistributed. Source URLs and original hashes are recorded in
`research/echo/ice-media-sources.json`; masking filters and output verification
are recorded in `research/echo/ice-media-verification.json`. Accessed 2026-10-25.
