Morobe Department of Works and Highways — Bridge and Culvert WebGIS
===================================================================

This prototype includes bridge and culvert records supplied in the original coordinate CSV files and a QGIS2Web OpenLayers map.

How to run:
1. Extract this ZIP file.
2. Open the extracted folder.
3. For best compatibility, serve the folder using a local web server (for example, VS Code Live Server).
4. Open index.html in your browser.
5. Use search and filters, select dashboard markers or table rows, and inspect asset details.

CSV upload and export:
- Use “Upload new CSV” above the asset register to import a new bridge-only CSV, culvert-only CSV, or combined CSV with an “Asset Type” column containing Bridge/Culvert values.
- CSV needs decimal Latitude and Longitude columns (for example, Latitude and Longitude, or Lat and Lon). Projected Easting/Northing values are not converted automatically.
- Useful recognized columns include Asset ID/ID, Name/Bridge Name, Road, Chainage, Condition, Length, Priority, Blockage, Inspection, Cost/Repair Cost, Action, and Remarks. Column headings may vary in spacing/case.
- Uploading a bridge-only file replaces bridge records for the current browser session; a culvert-only file replaces culvert records. A combined file replaces both types.
- “Export filtered CSV” downloads the records currently shown after filters. “Export all CSV” downloads all current dashboard records.
- Uploaded records are held in browser memory only. They are not written back to this project, a server, or a shared database. Export a CSV if you want to keep the uploaded dataset. Reloading the page restores the original bundled records.
- CSV upload updates the dashboard marker map, asset register, counts, and detail panel. It does not update the separately exported QGIS2Web map layers. To update the detailed QGIS map, update the source data in QGIS and export QGIS2Web again.

Map and data notes:
- QGIS2Web is embedded in the Asset location map card. Use “Detailed QGIS map” and “Dashboard markers” to switch between map views.
- Keep the qgis-map folder and all subfolders together; its index.html depends on the resources, layers, styles, and webfonts folders.
- Internet access is needed for the Leaflet library, OpenStreetMap tiles, and any remote resources used by the exported map.
- Coordinates and attributes are shown as supplied or imported. Verify all records before using them for official operational decisions.
- Culvert blockage values are expected as percentages (for example 70). If the source contains fractions such as 0.70, convert them to 70 before upload for correct display.
- This is a front-end prototype. It does not provide shared multi-user editing or database persistence.


LATEST UPDATE — ASSET DETAILS PANEL
- The Asset details panel now sits beside the map instead of leaving a blank area.
- The dashboard marker map is selected by default.
- Click a bridge or culvert marker to list its available attributes in the Asset details panel.
- Clicking a row in the asset register also loads that asset's attributes in the panel and zooms the map.
- Use the Detailed QGIS map button to return to the QGIS2Web map. QGIS2Web popups show attributes configured in that export; the side panel is currently populated by dashboard marker/table selections.


LATEST UPDATE — ASSET-SPECIFIC ATTRIBUTES
- Bridge selection displays bridge-relevant fields (Bridge ID/name, road, chainage, coordinates, condition, bridge length/type, year, priority, inspection, estimated cost, action, remarks where available).
- Culvert selection displays culvert-relevant fields (Culvert ID/name, road, chainage, coordinates, condition, culvert length/type, blockage, priority, inspection, estimated cost, action, remarks where available).
- Empty values are omitted. Culvert-only fields such as blockage are not displayed for bridges.
