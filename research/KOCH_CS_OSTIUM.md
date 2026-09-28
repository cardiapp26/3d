# Coronary sinus ostium and triangle of Koch: measured placement

Date: 2026-09-28. Scope: the EP landmark overlay in `src/ep-landmarks.js` (ablation lesson, step 2) and the helper `coronarySinusOstium` in `src/mesh-utils.js`. Educational schematic on the intact atlas; not a patient model.

## Problem

The atlas coronary sinus mesh ends in the atrioventricular groove exactly on the tricuspid hinge (its proximal open loop lies 0.03 atlas units from the RA/RV orifice rim) and has no intra-atrial mouth. The Koch base was anchored to that open loop, so the base sat on the hinge line: the septal isthmus had zero width, the triangle degenerated into a strip along the annulus, and the tendon of Todaro rose from a point on the valve ring.

## Rule now used

Atlas axes: +x patient left, +y superior, +z anterior; 1 unit is about 3.6 cm (tricuspid annulus diameter about 1 unit).

The ostium is the right atrial endocardial vertex that
- lies on the atrial side of the tricuspid annulus plane (depth below the plane at least 0.05 units),
- is one septal isthmus from the hinge (target 0.3 units, about 1 cm),
- is closest to the sinus termination and to the interatrial wall (paraseptal),
- is about Koch-triangle height (target 0.5 units) from the compact AV node.

These are combined as a weighted least-squares cost over RA vertices within two isthmus widths of the sinus termination. The posterior lip (Eustachian/Thebesian commissure side, where Todaro rises) is the wall vertex half an isthmus beyond the mouth, away from the hinge. A ring of radius 0.135 units (about 5 mm) marks the mouth, facing the cavity.

Measured result on the shipped atlas: mouth centre near (-0.61, -0.09, -0.50), 0.27 units from the hinge, 0.16 units from the LA wall, 0.66 units from the AV node (about 2.3 cm, upper end of the reported 1.5 to 2.5 cm triangle height), 0.49 units below and anterior to the oval fossa. The Koch base now runs hinge point, mouth, posterior lip; Todaro runs from the lip to the apex; the slow-pathway target stays on the isthmus between hinge and mouth.

## Coronary sinus vessel reseated (revision 2)

Revision 1 moved only the Koch overlay; the atlas sinus mesh itself still ended under the annulus, which is what a viewer sees outside the ablation lesson. At load, `seatCoronarySinus` in `src/heart.js` now bends the proximal end of the sinus mesh onto the measured mouth (`seatVesselEnd` in `src/mesh-utils.js`): the terminal loop is rotated to face the RA cavity and translated to 0.02 units outside the endocardium, with the change fading out over 0.7 units along the vessel so the AV-groove course is untouched. Measured: sinus end centre at depth -0.09 on the atrial side of the tricuspid plane, 0.33 units from the tricuspid ring (was about 0.03, ventricular side). Because every consumer measures from the mesh, the Koch base, the CS catheters, the CRT lead route, the unroofed-sinus defect site and the cardiac venous flow route now start at the atrial mouth without further changes.

## Bundle branches (revision 2)

The left bundle trunk started at the measured His end, but the fascicles and Purkinje fans kept hand-placed coordinates, so the trunk ran horizontally across the septum and the fascicles dropped away at about 60 degrees. The right bundle also kept hand-placed points and left the His at about 95 degrees. `src/conduction-paths.js` now measures both:

- Left bundle: trunk from inside the His (continuous tangent) down the LV septal subendocardium toward the middle of the fascicular fan; anterior and posterior fascicles continue from inside the trunk toward the posteromedial papillary base (measured) and its mirror across the septal-apical plane (anterolateral base); Purkinje fans from the fascicle ends toward the apex.
- Right bundle: from inside the His down the RV septal subendocardium to the moderator band septal insertion (60 percent toward the RV apex), then across the band to the base of the anterior papillary muscle; RV Purkinje fan from the band insertion toward the apex.

The mitral centre is taken from the LA/LV shared rim because the annulus meshes are built after the conduction system. Largest turn between successive samples of the drawn tubes is now about 15 to 19 degrees; the junction elbows are gone. Fascicle geometry varies between hearts; the paths are schematic.

## Sources

Same as the ablation lesson: Tretter et al., Europace 2022;24:455–463 (triangle borders, inferior pyramidal space, septal isthmus) and Ho et al. 2003 (AV node at the apex, membranous septum). Isthmus width and triangle height are typical adult ranges from those texts, not patient measurements.

## Verification

`scripts/test-conduction-paths.mjs` (synthetic septum and ventricles: trunk starts inside the His and descends on the LV side, fascicles leave the trunk end and fan to opposite sides, no drawn-curve step above 25 degrees, RBB band insertion on the RV mid-apical septum). `scripts/test-cs-ostium.mjs` (synthetic sphere atrium, planar LA wall, seamless open sinus tube on the rim): the mouth lies on the wall, on the atrial side, 0.2 to 0.4 units from the hinge, paraseptal; the sinus termination is the rim-side loop; the lip lies beyond the mouth on the wall; missing atrium or degenerate rim yields null. `npm run check`, `npm test` and `npm run build` pass. Headless Chrome renders (RAO 55 CAU 10, RAO 85) inspected with tissue faded: apex on the superior septal annulus, mouth posteroinferior and paraseptal, base one isthmus wide.

## Note on the isolated right atrium view

The "double contour" seen at the RA cut edges in mode 10 is not a rendering defect. Rays through the RA mesh cross the surface four times in most places and the mesh is a single connected component, so the atlas atrium is modelled with wall thickness (outer and inner surface joined at the rims). The second line is the inner surface at the cut edge. Normals are smooth (no duplicated-vertex seams with mismatched normals), the material is opaque with depth write, and front-face-only rendering gives the same image.
