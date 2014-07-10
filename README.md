CanvasMap
=========

CanvasMap is a simple HTML framework to experiment with projection equations. 
CanvasMap uses JavaScript, HTML5 Canvas, and JQuery.

Sample: http://cartography.oregonstate.edu/ScaleAdaptiveWebMapProjections.html#CanvasMapExample

Programming by Bernhard Jenny and Bojan Savric, College of Earth, Ocean and 
Atmospheric Sciences, Oregon State University, and Mostafa El-Fouly, TU Munich.

Contact: Bernhard Jenny <jennyb@geo.oregonstate.edu>

License: GNU General Public License Version 2: http://www.gnu.org/licenses/gpl-2.0.html

##File structure
CanvasMap contains the core JavaScript files. Code related to the map and projections is
in src/. CanvasMap.js is created by the build.xml ant script. Include this file in the
HTML file.

##Demos
All code specific to an application is included in the UI.js files. These files construct
the HTML GUI, provide event handlers and create the map with a projection.

SimpleMap shows a map with a static projection.
CentralMeridianSlider shows a map and slider to adjust the central meridian.
ProjectionList has a menu to select from various projections.
LambertTransitionSlider illustrates Wagner's transformation applied to the Lambert 
azimuthal projection to create a variety of equal-area projections.
MillerTransformation illustrates a transformation of the Mercator projection suggested
by Miller in 1942.
StrebeTransformation illustrates a transformation method invented by D. Strebe.

##Programming Model
UI.js:
DOM event handlers and construction of the model consisting of a map, one or more layers
and a projection.

layer.js:
A layer loads a shapefile (points, polylines or polygons), and projects and draws the data.
Polygons are not filled. Shapefiles must use 'geographical' coordinates.

map.js:
Contains an array of layers, a projection, and scale factor applied before drawing the map.
After the layer, canvas, projection and scale are created, invoke map.load to load the 
layer geometry.

##Extending CanvasMap with Custom Projections
To extend CanvasMap with an additional projection, duplicate an existing 
projection file in the projections folder and change the function name and the included
toString() and forward() functions.

The forward function receives longitude and latitude values in radians. The projected 
coordinates have to be written to the xy array. The xy parameter is only for returning the
projected coordinates and does not contain valid data when the function is called.


Important: use Apache Ant to concatenate and minify all JavaScript files in the src folder.
The default Ant target creates CanvasMap.js and CanvasMap-min.js. To run Ant, 
cd to CanvasMap, then type ant.

To apply the new projection to the map, change UI.js. 
If you use the "ProjectionList" map, add your projection to the getProjection function in 
UI.js. Also include your projection in the <select> element in index.html. The value for 
the new <option> in the <select> element has to be unique and match the projectionName
parameter of getProjection in UI.js.
