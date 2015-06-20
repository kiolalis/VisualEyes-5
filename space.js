////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SPACE.JS 
//
// Provides mapping component
// Requires: popup.js
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Space(div, pop)														// CONSTRUCTOR
{

/* 
 	@param {string} div	Div ro attach map to.
 	@param {object} pop	Points to popup library in popup.js.
 	@constructor
*/

	this.div="#"+div;														// Current div selector
  	this.pop=pop;															// Point at popup lib
  	this.controlKey=this.shiftKey=false;									// Shift/control key flags
	this.showBoxes=false;													// Show boxes
	this.showRoads=false;													// Hide Roads/borders
	this.showScale=true;													// Show scale
	this.timeFormat="Mon Day, Year";										// Default time format
	this.overlays=[];														// Holds overlay layers
}


Space.prototype.UpdateMap=function(curTime, timeFormat)					// UPDATE MAP
{

/*
	Update the current time and set layer visibilities accordingly.
	@param {number} curTime 	Current project time in mumber of mins += 1/1/1970
	@param {string} timeFormat	Format to use when making time human readable	
*/

	this.timeFormat=timeFormat;												// Set format
	this.curTime=curTime-0;													// Set current timet
	this.DrawMapLayers();													// Redraw map
}


Space.prototype.DrawMapLayers=function(indices, mode)							// DRAW OVERLAY LAYERS							
{

/* 
 	Draws or shows overlay elements based on the current time.
  	if .start != 0 marker is turned on at the .start time
	if .start != 0 marker is turned off at the .end time
 	If indices is set, the layers spec'd are turned on/off regardless of time
 	@param {array} 		indices An array of indices specifying the marker(s) how.
	@param {boolean} 	Whether.
*/

	var i,j,o,a,vis,sty;
	if (this.canvasContext) {  												// If a canvas up      
		this.canvasContext.clearRect(0,0,this.canvasWidth,this.canvasHeight); // Clear canvas
   		for (i=0;i<this.overlays.length;i++) {								// For each overlay layer
            o=this.overlays[i];												// Get ptr  to layer
    		
    		if (!o.start && !o.end)	vis=true;								// Both start/end 0, make it visible
    		else if (o.start) 		vis=false;								// If only a start set, hide until it comes up
    		else if (o.end) 		vis=true;								// If only an end set, show until until it comes down
    		else 					vis=false;								// Both set, hide until it comes up
 
	      	if (o.start && (this.curTime >= o.start))	vis=true;			// If past start and start defined, show it
	      	if (o.end && (this.curTime > o.end))		vis=false;			// If past end and end defined, hide it
	        a=(o.opacity != undefined) ? o.opacity : 1						// Use defined opacity or 1
            if (indices) {													// If indices spec'd
            	if (mode == undefined)	mode=true;							// Default to showing marker
            	for (j=0;j<indices.length;++j) 								// For each index					
            		if (i == indices[j])									// This is one to set
            			vis=mode;											// Hide or show it
           		}
            if (vis && (o.type == "image"))									// If a visible image 
           		o.src.drawMapImage(vis,this);   							// Draw it   
        	else if (o.type == "kml") {										// If a kml 
       			o.src.set('visible',vis);									// Show/hide it
            	o.src.set("opacity",a);										// Set opacity								
             	}
        	else if (o.type == "icon") {									// If an icon 
				sty=o.src.getStyle();  										// Point at style
				sty.getImage().setOpacity(vis ? 1: 0);						// Set icon opacity
				sty.getText().setScale(vis ? 1 : 0);						// Set text opacity
              	}
	       	else if (o.type == "path") 										// If a path
         		this.DrawPath(o.src, o.dots, this.curTime, o.end, o.show)	// Show it
          }
        }
}


Space.prototype.InitMap=function()										// INIT OPENLAYERS MAP
{
/* 
  	Init map library.
 
*/
	this.controlKey=this.shiftKey=false;									// Shift/control key flags
	this.showBoxes=false;													// Show boxes
	this.showRoads=false;													// Hide Roads/borders
	this.showScale=true;													// Hide or show scale
	this.curProjection="EPSG:3857";											// Current projection
	
	this.layers=[															// Hold layers
		new ol.layer.Tile({													// Sat 
				visible: false,												// Invisible
				source: new ol.source.MapQuest({layer: 'sat'}),				// MapQuest sat
				projection: this.curProjection,								// Default projection
				title: "Satellite"											// Set name
				}),
		new ol.layer.Tile({													// Terrain
				visible: false,												// Invisible
				source: new ol.source.TileWMS({								// WMS
 						url: 'http://demo.opengeo.org/geoserver/wms',		// Url
 						params: { 'LAYERS': 'ne:NE1_HR_LC_SR_W_DR' }		// Params
						}),
				projection: this.curProjection,								// Default projection
				title: "Terrain"											// Set name
				}),
		new ol.layer.Tile({													// Watercolor
				visible: false,												// Invisible
				source: new ol.source.Stamen({layer: 'watercolor'}),		// Stamen watercolor
				projection: this.curProjection,								// Default projection
				title: "Watercolor"											// Set name
				}),
		new ol.layer.Tile({													// Toner
				visible: false,												// Invisible
				source: new ol.source.Stamen({layer: 'toner-lite'}),		// Stamen toner
				projection: this.curProjection,								// Default projection
				title: "B&W"												// Set name
				}),
		new ol.layer.Tile({													// Earth
				visible: false,												// Invisible
				source: new ol.source.TileJSON({
    				url: 'http://api.tiles.mapbox.com/v3/' +
        			'mapbox.natural-earth-hypso-bathy.jsonp',
    				crossOrigin: 'anonymous'
					}),
				projection: this.curProjection,								// Default projection
				title: "Earth"												// Set name
				}),
		
		new ol.layer.Tile({													// Roadmap
				visible:false,												// Hide it
				source: new ol.source.MapQuest({layer: 'osm'}),				// MapQuest roads
				projection: this.curProjection,								// Default projection
				title: "Roadmap"											// Set name
				}),
		];

    this.map=new ol.Map( { target: this.div.substr(1),						// Alloc OL
        layers:this.layers,													// Layers array									
        controls: ol.control.defaults({										// Controls
				}).extend([ new ol.control.ScaleLine() ]),					// Add scale
        view: new ol.View({													// Views
          		center: ol.proj.transform( [-77,34],'EPSG:4326',this.curProjection),
          		minZoom: 2, maxZoom: 16, zoom: 3 })
		});

	this.SetBaseMap("Roadmap");												// Set basemap
  	this.CreateOverlayLayer();												// Canvas and vector layer for map overlays
  	this.InitPopups();														// Init popup layer
  	var _this=this;															// Save context for callback
   	
	this.map.on('moveend', function(e) {									// On end of move
      	_this.DrawMapLayers();												// Redraw maps in new extent, if moved
		var o=_this.map.getView();											// Point at view
		var c=ol.proj.transform(o.getCenter(),_this.curProjection,'EPSG:4326');	// Get center
		var pos=Math.floor(c[1]*10000)/10000+"|"+Math.floor(c[0]*10000)/10000+"|"+o.getResolution()+"|";	
		pos+=Math.floor((o.getRotation()*180/Math.PI)*1000)/-1000;			// Rotation
		$("#setwhere").val(Math.floor(c[0]*10000)/10000+","+Math.floor(c[1]*10000)/10000+","+Math.round(o.getResolution()));
		_this.SendMessage("move",pos+"|scroll");							// Send that view has changed
		});
	}	


Space.prototype.UpdateMapSize=function() 								// UPDATE MAP SIZE
{

/* 
  	Update Openlayers map to match container div's size.
  
*/
	if (this.map)															// If OL initted
		mps.map.updateSize();												// Update map
}


Space.prototype.SetBaseMap=function(newMap) 							// SET BASE MAP
{

/* 
  	Set base map
  	@param {string} 	newMap	Name of map layer to show
  
*/

	if (this.map)															// If OL initted
   		for (i=0;i<this.layers.length;++i) 									// For each layer
	    	this.layers[i].set('visible',this.layers[i].get("title") == newMap); // Set visibility
}




Space.prototype.Goto=function(pos)										// SET VIEWPOINT
{

/* 
  	Set map center, resolution, and rotation
  	@param {string} pos	Position to got to in this format:
  						longitude,latitude[,resolution,rotation]
  
*/
	var speed=1;															// Default speed
	if ((!pos) || (pos.length < 5))											// No where to go
		return;																// Quit
	pos=pos.replace(/"/g,"");												// Remove quotes
	var v=pos.split(",");													// Split up
	var o=this.map.getView();												// Point at view
	var c=ol.proj.transform([v[0]-0,""+v[1].replace(/\*/,"")-0],'EPSG:4326',this.curProjection);	// Get center
	var fc=o.getCenter();													// Get from center
	var fr=o.getRotation();													// Get from rotation		
	var fs=o.getResolution();												// Get from resolution
	var r=-v[4]*Math.PI/180;												// Get to rotation	
	if ((Math.abs(fc[0]-c[0]) < 2) && (Math.abs(fc[1]-c[1]) < 2)			// Center match
			&& (Math.abs(fs-v[2]) < 2) && (Math.abs(fs-v[2]) < 2)			// Resolution  match
			&& (Math.abs(fr-r) < 1) && (Math.abs(fr-r) < 1)					// Rotation  match
			)																// Already there
		return;																// Quit
var duration=0;														// Duration
	var start=+new Date();													// Start time
start=0;	
	var pan=ol.animation.pan({												// Pan
	    duration: duration,													// Duration
	    source: fc,															// Start value
	    start: start														// Starting time
	  	});
	var rotate=ol.animation.rotate({										// Rotate
	    duration: duration,													// Duration
	    rotation: fr,														// Start value
	    start: start														// Starting time
	  	});
	 var bounce=ol.animation.bounce({										// Fly bounce
	    duration: duration,													// Duration
	    resolution: 2*o.getResolution(),									// End value
	    start: start														// Starting time
	  });
  	this.map.beforeRender(pan,rotate);										// Pan, rotate
	o.setResolution(v[2]);													// Set resolution								
	o.setCenter(c);															// Set center
	if (v[3] != undefined)													// If set
		o.setRotation(v[3]);												// Set rotation								
	}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMAGE OVERLAY
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Space.prototype.CreateOverlayLayer=function()							// CREATE CANVAS/VECTOR OVERLAY LAYERS				
{        
   
 /* 
  	Creates the canvas layer needed to show images and the
  	vector layer to show markers
 */
   	var _this=this;															// Save context for callback
 
    this.canvasLayer=new ol.layer.Image( {									// Make new image layer
        source: new ol.source.ImageCanvas( {								// Add canvas sourcw
            canvasFunction: function(extent, res, pixelRatio, size, proj) { // Render function
				if (!_this.canvasCanvas) 									// If no canvas yet
			        _this.canvasCanvas=document.createElement('canvas');	// Alloc canvas
		       	_this.canvasWidth=size[0];									// Get width
			    _this.canvasHeight=size[1];									// Hgt
		    	_this.canvasCanvas.setAttribute('width',size[0]);			// Set canvas width
			    _this.canvasCanvas.setAttribute('height',size[1]);			// Hgt
	    		_this.canvasContext=_this.canvasCanvas.getContext('2d');	// Get context
           		_this.canvasExtent=extent;									// Set extent
		        _this.canvasRes=res;										// Set res
				_this.DrawMapLayers();										// Make images
	        	return _this.canvasCanvas 									// Return canvas reference
	            }, 
	        projection: this.curProjection									// Projection
	        })
	    }); 
   	this.map.addLayer(this.canvasLayer);									// Add image layer to map
    this.markerLayer=new ol.layer.Vector( {									// Make new vector layer
        source: new ol.source.Vector({}),									// Add source
	    projection: this.curProjection										// Projection
	   })
    this.map.addLayer(this.markerLayer);									// Add layer to map
}


Space.prototype.MarkerLayerToTop=function()								// MOVE MARKER LAYER ON TOP OF OTHER LAYERS
{
	
 /* 
  	Moves the marker layer on top of all other layer
 */

	var layer=this.map.getLayers().remove(this.markerLayer);				// Remove marker layer
	var n=this.map.getLayers().getArray().length;							// Last index
	this.map.getLayers().insertAt(n,layer);									// Place on top
}

Space.prototype.AddPathLayer=function(dots, col, wid, opacity, start, end, show) 	// ADD PATH LAYER TO MAP						
{

/* 	
 	Add path to marker layer.
 	@param {array} 	dots 	Array of lat/long,time triplets separated by commas ie. [[-77,40,-4526267], ...]
 	@param {string} col 	Color of path
 	@param {number} wid 	Width of path in pixels
 	@param {number} opacity Opacity of path 0-1
 	@param {number} start 	Starting time of marker in number of mins += 1/1/1970
	@param {number} end 	Ending time of marker in number of mins += 1/1/1970
*/

	var i,v,o={};
	o.type="path";															// Path
  	o.start=start;	o.end=end;	o.show=show;								// Save start, end, show
	this.overlays.push(o);													// Add to overlay
  	o.src=new ol.Feature({ geometry: new ol.geom.LineString(dots)});		// Create line
  	o.id="Path-"+this.markerLayer.getSource().getFeatures().length;			// Make path id
   	o.src.setId(o.id);														// Set id of path
  	o.dots=dots;															// Save dots
   	if (!col)				col="#990000";									// Default color
   	if (!wid)				wid=2;											// Default wid
  	if (!opacity)			opacity=1;										// Default opacity
  	if (col.length == 4) 	col+col.substr(1,3);							// Turn #555 into #55555
  	var r=parseInt("0x"+col.substr(1,2),16);								// R
	var g=parseInt("0x"+col.substr(3,2),16);								// G
	var b=parseInt("0x"+col.substr(5,2),16);								// B
   	var sty=new ol.style.Style({											// Make style
   			stroke: new ol.style.Stroke({ color: [r,g,b,opacity], width: wid
			})
		});
	o.src.setStyle(sty);													// Set style
	this.markerLayer.getSource().addFeature(o.src);							// Add it
}

Space.prototype.DrawPath=function(feature, dots, time, end, show) 		// DRAW PATH						
{

/* 	
 	Add path to marker layer.
  	@param {object} id 		Pointer to feature.
 	@param {array} 	dots 	Array of lat, long, & time triplets separated by commas. i.e. [[-77,40,-4526267], ...].
  	@param {number} time 	Current time in number of mins += 1/1/1970.
 	@param {string} show 	Display modes: a == animate.
 
*/
	
	var s,e,pct,v=[],animate=false;
	if (show && show.match(/a/i))	animate=true;						// Set animation mode
	v.push([dots[0][0],dots[0][1]]);									// Add moveto dot
	for (e=1;e<dots.length;++e) {										// For each lineto dot
		s=e-1;															// Point at start of line
		if ((time >= dots[s][2]) && (time < end)) {						// This one's active
			v.push([dots[e][0],dots[e][1]]);							// Add end dot
			if ((time < dots[e][2]) && animate){						// If before end of end dot and animating
				pct=(time-dots[s][2])/(dots[e][2]-dots[s][2]);			// Get pct
				v[e][0]=dots[s][0]+((dots[e][0]-dots[s][0])*pct);		// Interpolate x
				v[e][1]=dots[s][1]+((dots[e][1]-dots[s][1])*pct);		// Interpolate y
				}
			}
		}
	feature.setGeometry(new ol.geom.LineString(v));						// Set new dots
}

Space.prototype.SetMarkerTexStyle=function(color, font ) 			// CHANGE LABEL TEXT STYLE					
{
/*
 *	@param {array} 	indices An array of indices specifying the marker(s) to style

 */
	var i,o;
	o=this.markerLayer.getSource().getFeatures();						// Poiht at marker features
	for (i=0;i<o.length;++i) {											// For each layer
		sty=o[i].getStyle();											// Get style
		if (sty.getText()) {											// If a text element
			if (color)	sty.getText().getFill().setColor(color);		// Set color
			if (font)	sty.getText().setFont(font);					// Set font
			}
		sty=o[i].setStyle(sty);											// Set style
	}
}


Space.prototype.AddMarkerLayer=function(pos, style, id, start, end) 	// ADD MARKER LAYER TO MAP						
{

/* 	
 	Add marker to marker layer.
 	@param {string} pos 	Contains bounds for the image "latitude,longitude".
  					    	Rotation is optional and defaults to 0 degrees.				
	@param {object} style 	Consists of a style object :
						a: {number} opacity (0-1)
						f: {string} fill color "#rrggbb"
						s: {string} stroke color "#rrggbb"
						r: {number} rotation
						w: {number} width
						d: {string} description for popup
						m: {string} type
						t: {string} label
						tc: {string} text color
						ts: {string} text format
	@param {number} start 	Starting time of marker in number of mins += 1/1/1970
	@param {number} end 	Ending time of marker in number of mins += 1/1/1970

*/

	var o={};
	o.type="icon";															// Icon
  	o.start=start;	o.end=end;												// Save start, end
	this.overlays.push(o);													// Add to overlay
  	var v=pos.split(",");													// Split into parts
	var c=ol.proj.transform([v[0]-0,""+v[1]-0],'EPSG:4326',this.curProjection);	// Transform
	o.src=new ol.Feature({ geometry: new ol.geom.Point(c) });				// Create feature at coord
 	var index=this.markerLayer.getSource().getFeatures().length;			// Index of feature
 	o.src.setId("Mob-"+id);													// Set id of mob
 	this.markerLayer.getSource().addFeature(o.src);							// Add it
 	this.StyleMarker([index],style);										// Style marker
}


Space.prototype.StyleMarker=function(indices, sty)						// STYLE MARKERS(s)			
{
	
/* 
 	@param {array} 	indices An array of indices specifying the marker(s) to hide or show.
	@param {object} style 	Consists of a style object :
						a: {number} opacity (0-1)
						f: {string} fill color "#rrggbb"
						s: {string} stroke color "#rrggbb"
						r: {number} rotation
						w: {number} width
						d: {string} description for popup
						m: {string} type
						t: {string} label
						tc: {string} text color
						tf: {string} text format
 */

	var i;
	var w2=sty.w ? sty.w*.6667 : 8;											// Set size
	if (sty.f) {															// If fill spec'd
	  	if (sty.f.length == 4) sty.f+=sty.f.substr(1,3);					// Turn #555 into #55555
	  	r=parseInt("0x"+sty.f.substr(1,2),16);								// R
		g=parseInt("0x"+sty.f.substr(3,2),16);								// G
		b=parseInt("0x"+sty.f.substr(5,2),16);								// B
  		var fill=new ol.style.Fill({ color: [r,g,b,sty.a ? sty.a : 1]});	// Create fill with alpha
  		}
  	if (sty.s) {															// If stroke spec'd	
	  	if (sty.s.length == 4) sty.s+=sty.s.substr(1,3);					// Turn #555 into #55555
	  	r=parseInt("0x"+sty.s.substr(1,2),16);								// R
		g=parseInt("0x"+sty.s.substr(3,2),16);								// G
		b=parseInt("0x"+sty.s.substr(5,2),16);								// B
  		var stroke=new ol.style.Stroke({ color: [r,g,b,sty.a ? sty.a : 1], width:1 });	// Create stroke with alpha & width
		}	

 	if (sty.w)	w2=sty.w/2;													// If spec'd use it																

	switch(sty.m.toLowerCase()) {											// Route on marker style
 		case "dot":
			var image=new ol.style.Circle({									
	    		radius: w2*3/4, fill: fill, stroke:stroke
	  			});
	  		break;
		case "square":
			var image=new ol.style.RegularShape({								
		    	radius: w2, fill: fill, stroke:stroke, points: 4, angle: Math.PI/4
	  			});
	  		break;
		case "star":
			var image=new ol.style.RegularShape({								
  	  			radius: w2, fill: fill, stroke:stroke, points: 5, radius2: w2/2
  				});
 	  		break;
		case "diamond":
			var image=new ol.style.RegularShape({								
	    		radius: w2, fill: fill, stroke:stroke, points: 4
	  			});
	  		break;
		case "triu":
			var image=new ol.style.RegularShape({								
	    		radius: w2, fill: fill, stroke:stroke, points: 3
	   			});
	  		break;
		case "trid":
			var image=new ol.style.RegularShape({								
	    		radius: w2, fill: fill, stroke:stroke, points: 3,angle: Math.PI
	 			});
	  		break;
		case "trir":
			var image=new ol.style.RegularShape({								
	    		radius: w2, fill: fill, stroke:stroke, points: 3,angle: Math.PI/2
	 			});
	  		break;
		case "tril":
			var image=new ol.style.RegularShape({								
	    		radius: w2, fill: fill, stroke:stroke, points: 3,angle: -Math.PI/2
	 			});
	  		break;
	  		}
	if (sty.m && sty.m.match(/\//))	 										// Must be an image file
		var image=new ol.style.Icon({ src: sty.m });						// Add icon
	
	var text=new ol.style.Text( {											// Text style
		textAlign: "center", textBaseline: "top",							// Set alignment
		font: sty.tf,														// Set font
		text: sty.t,														// Get label
		fill: new ol.style.Fill({color: sty.tc }),							// Set color
		stroke: new ol.style.Stroke({color: "#666", width:1 }),				// Outline
		offsetY: w2,														// Set offset
		});  
   	var s=new ol.style.Style({												// Create new style
		image: image, text: text											// Add icon, text
		});
	for (i=0;i<indices.length;++i)											// For each layer
		this.markerLayer.getSource().getFeatures()[indices[i]].setStyle(s);	// Set style
}

Space.prototype.AddKMLLayer=function(url, opacity, start, end) 			// ADD KML LAYER TO MAP						
{

/* 	
 	Add kml file to map as a new layer
   	@param {string} 		url URL of kml file
 	@param {number} start 	Starting time of marker in number of mins += 1/1/1970
	@param {number} end 	Ending time of marker in number of mins += 1/1/1970
 	@return {number}		index of new layer added to overlays array.
*/

	var o={};
   	var _this=this;															// Save context for callback
	if (url && url.match(/\/\//)) 											// If cross-domain
		url="proxy.php?url="+url;											// Add proxy

	var index=this.overlays.length;											// Get index
 	o.type="kml";															// KML
  	o.start=start;	o.end=end;												// Save start, end
	o.opacity=opacity;														// Initial opacity
	
	o.src=new ol.layer.Vector({  source: new ol.source.Vector({				// New layer
							title: "LAYER-"+this.overlays.length,			// Set name
				   			projection: ol.proj.get(this.curProjection),	// Set KML projection
				    		format: new ol.format.KML(),					// KML format
				    		url: url										// URL
				  			})
						});
	
	o.src.set('visible',false)												// Hide it
	this.overlays.push(o);													// Add to overlay
	mps.loadCounter++;														// Add to count
	this.map.addLayer(o.src);												// Add to map	
 	return index;															// Return layer ID
 
	this.overlays[index].getSource().once("change",function(){				// WHEN KML IS LOADED						
 		this.ShowProgress();												// Update loading progress
 		this.forEachFeature(function(f) {									// For each feature in KML
			if ((f.getGeometry().getType() == "Point") && f.get("name")){	// If a marker with a label
				var sty=new ol.style.Style({								// Add style
			      image: new ol.style.Icon( { src: "img/marker.png"	}),		// Add icon
			      text:	new ol.style.Text( {								// Text style
				    	textAlign: "left", textBaseline: "middle",			// Set alignment
				    	font: "bold 14px Arial",							// Set font
				    	text: f.get("name"),								// Get label
				   	 	fill: new ol.style.Fill({color: "#fff" }),			// Set color
						stroke: new ol.style.Stroke( { color: "#000",width: 1 }),	// Set edge		   
				    	offsetX: 16											// Set offset
				 		})
					});
					f.setStyle(sty);										// Set style to show label	
					}
				});
		});

}


Space.prototype.StyleKMLFeatures=function(num, styles)					// STYLE KML FEATURE(s)		  
{ 
	
/* 
 	@param {number} num The index of the KML overlay to color.
	@param {array} 	styles An array of objects specifying the style to set any given feature to set
 					Each element in the array consists of a style object to set a particular feature index:
						n: {string} spec's feature index,or "*" for all
						a: {number} opacity (0-1)
						f: {string} fill color "#rrggbb"
						s: {string} stroke color "#rrggbb"
						w: {number} stroke width
*/
	
	var i,r,g,b,a;
	if ((num < 0) || (num >= this.overlays.length) || (this.overlays[num].type != "kml"))	// If not a valid KML
		return;																// Quit
	var features=this.overlays[num].src.getSource().getFeatures();			// Get KML feature array
	var n=styles.length;													// Number of features to style
	var last=n-1;															// Last style possible
	if (styles[0].n == "*")
		n=features.length;
	for (i=0;i<n;++i) {														// For each feature to style
		var s=styles[Math.min(i,last)];										// Point at style
	  	if (s.f) {															// If fill spec'd
		  	if (s.f.length == 4) s.f+=s.f.substr(1,3);						// Turn #555 into #55555
		  	r=parseInt("0x"+s.f.substr(1,2),16);							// R
			g=parseInt("0x"+s.f.substr(3,2),16);							// G
			b=parseInt("0x"+s.f.substr(5,2),16);							// B
	  		var fill=new ol.style.Fill({ color: [r,g,b,s.a ? s.a : 1]});	// Create fill with alpha
	  		}
	  	if (s.s) {															// If stroke spec'd	
		  	if (s.s.length == 4) s.s+=s.s.substr(1,3);						// Turn #555 into #55555
		  	r=parseInt("0x"+s.s.substr(1,2),16);							// R
			g=parseInt("0x"+s.s.substr(3,2),16);							// G
			b=parseInt("0x"+s.s.substr(5,2),16);							// B
	  		var stroke=new ol.style.Stroke({ color: [r,g,b,s.a ? s.a : 1], width:s.w });	// Create stroke with alpha & width
			}
		sty=new ol.style.Style({ fill:fill,stroke:stroke });				// Create style
		if (s.n == "*")														// If styling them all
			features[i].setStyle(sty);										// Set next feature's style
		else																// Justb styling on spec's bu s.n
			features[s.n].setStyle(sty);									// Set particular feature's style
		}
}


Space.prototype.AddImageLayer=function(url, geoRef, alpha, start, end) 	// ADD MAP IMAGE TO PROJECT
{    

/* 
  	@param {string} url 	URL of image file (jpeg, png or gif)
 	@param {string} geoRef 	Contains bounds for the image "north,south,east,west,rotation".
  							Rotation is optional and defaults to 0 degrees.				
 	@param {number} start 	Starting time of marker in number of mins += 1/1/1970
	@param {number} end 	Ending time of marker in number of mins += 1/1/1970
 	@return {number}index of new layer added to overlays array.
*/

	var o={};
	var index=this.overlays.length;											// Get index
 	o.type="image";															// Image
 	o.start=start;	o.end=end;												// Save start, end
    o.src=new MapImage(url,geoRef,this);									// Alloc mapimage obj
	o.alpha=alpha;															// Save alpha
	this.overlays.push(o);													// Add layer
	mps.loadCounter++;														// Add to count

	function MapImage(url, geoRef, _this) 								// MAPIMAGE CONSTRUCTOR
	{    

	/* 
	 	@constructor
	 	@param {string} url URL of image file (jpeg, png or gif)
	 	@param {string} geoReg Contains bounds for the image "north,south,east,west,rotation".
	 					rotation is optional and defaults to 0 degrees.				
	 	@param {object} 	_this Context of the Space object
	*/
	
	    this.img=new Image();												// Alloc image
	    this.img.onload=_this.ShowProgress;									// Add handler to remove from count after loaded
        this.img.onerror=_this.ShowProgress;								// Add handler to remove from count if error
        this.imgWidth;	 this.imgHeight;									// Set size, if any
        var v=geoRef.split(",");											// Split into parts
        this.n=v[0]-0;														// Set bounds
        this.s=v[1]-0;
        this.e=v[2]-0;
        this.w=v[3]-0;
        var ne = ol.proj.transform([this.e, this.n], 'EPSG:4326', _this.curProjection);	// Project
        var sw = ol.proj.transform([this.w, this.s], 'EPSG:4326', _this.curProjection);
        this.north = ne[1];
        this.south = sw[1];
        this.east = ne[0];
        this.west = sw[0];
        this.centerXCoord = this.w + (Math.abs(this.e - this.w) / 2);
        this.centerYCoord = this.s + (Math.abs(this.n - this.s) / 2);
        this.center=ol.proj.transform([this.centerXCoord, this.centerYCoord], 'EPSG:4326', _this.curProjection);	// Get center
        this.rotation=v[4]*-1;												// Reverse direction
		this.img.src=url;													// Set url
 	}
	
	MapImage.prototype.drawMapImage=function(opacity, _this)               	// DRAW IMAGE
	{ 
		if (!this.imgWidth) {
			this.imgWidth=this.img.width;
			this.imgHeight=this.img.height;
			this.imgWidthMeters=Math.abs(this.east - this.west);            
			this.imgHeightMeters=Math.abs(this.north - this.south);
			}
		var canvasExtentWidth = _this.canvasExtent[2] - _this.canvasExtent[0];
		var canvasExtentHeight = _this.canvasExtent[3] - _this.canvasExtent[1];
		var xCenterOffset = _this.canvasWidth * (this.center[0]-_this.canvasExtent[0]) / canvasExtentWidth;
		var yCenterOffset = _this.canvasHeight * (_this.canvasExtent[3]-this.center[1]) / canvasExtentHeight;
		var drawWidth = _this.canvasWidth * (this.imgWidthMeters / canvasExtentWidth);
		var drawHeight = _this.canvasHeight * (this.imgHeightMeters / canvasExtentHeight);
		var ctx=_this.canvasContext;
		if (ctx) {
			ctx.globalAlpha = opacity;
			ctx.translate(xCenterOffset,yCenterOffset);
			ctx.rotate(this.rotation * (Math.PI/180));
			ctx.translate(-(drawWidth / 2), -(drawHeight / 2));
			ctx.drawImage(this.img, 0, 0, drawWidth, drawHeight);
			ctx.translate((drawWidth / 2), (drawHeight / 2));
			ctx.rotate(-(this.rotation * (Math.PI / 180)));
			ctx.translate(-xCenterOffset,-yCenterOffset);
			ctx.globalAlpha=1;
			}                  
		}
	return index;															// Return layer ID
}



Space.prototype.InitPopups=function()									// HANDLE POPUPS ON FEATURES						
{

/* 
 	Init the handing of marker and kml feature popups.
 	Controls cursor on hover over feature/marker.
*/

  	var _this=this;															// Save context for callbacks

 	this.map.on('click', function(evt) {									// ON MAP CLICK
  			var feature=_this.map.forEachFeatureAtPixel(evt.pixel,			// Look through features
      			function(feature, layer) {									// On match to location
        			return feature;											// Return feature
      			});
			if (feature) {													// If one found
  				var id=feature.getId()+"";
    				if (id.match(/Mob-/)) {
  					o=sd.mobs[id.substr(4)];
 					if (o.title) 		var title=o.title;					// Lead with title
  					if (o.spaceTitle) 	var title=o.spaceTitle;				// Space over-rides
 					if (o.desc) 		var desc=o.desc;					// Lead with desc
  					if (o.spaceDesc) 	var desc=o.spaceDesc;				// Space over-rides
  					if (o.pic) 			var pic=o.pic;						// Lead with pic
  					if (o.spacePic) 	var title=o.spacePic;				// Space over-rides
       				_this.pop.ShowPopup(_this.div,_this.timeFormat,evt.pixel[0],evt.pixel[1],title,desc,pic,o.start,o.end);
					_this.SendMessage("time",o.start);						// Send new time
					if (o.goto)												// If a goto defined
						_this.Goto(o.goto);									// Go there
					}
			  	} 
			else 															// No feature found
				_this.pop.ShowPopup();										// Kill any existing pop
			});

	this.map.on('pointermove', function(e) {								// ON MOUSE MOVE
		if (e.dragging) {													// If dragging
			_this.pop.ShowPopup();											// Kill any existing pop
	    	return;															// Quit
	  		}
	  	var pixel=_this.map.getEventPixel(e.originalEvent);					// Get pos
	  	var hit=_this.map.hasFeatureAtPixel(pixel);							// Anything there?
	  	$(_this.div).css("cursor",hit ? "pointer" : "");					// Change cursor
		});
}


Space.prototype.ShowProgress=function()									// SHOW RESORCE LOAD PROGRESS
{

/* 
 	Shows progress of resource loading.
 	Set the contents of a div with id "#SloadProgress" 
*/

 	var str="";
 	this.loadCounter--; 													// Dec
	if (this.loadCounter)													// If stuff to load
		str=this.loadCounter+" resources to load";							// Set progress
	$("#SloadProgress").text(str);											// Show status
 }	
 
				
Space.prototype.SendMessage=function(cmd, msg) 							// SEND MESSAGE
{
	
/* 
 	Semd HTML5 message to parent.
*/
	
	var str="Space="+cmd;													// Add src and window						
	if (msg)																// If more to it
		str+="|"+msg;														// Add it
	if (window.parent)														// If has a parent
		window.parent.postMessage(str,"*");									// Send message to parent wind
	else																	// Local	
		window.postMessage(str,"*");										// Send message to wind
}
