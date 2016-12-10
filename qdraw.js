////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// QDRAW.JS 
// Drawing tool
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function QDraw(dockSide, dockPos, parent)									// CONSTRUCTOR
{
	var _this=this;																// Save context
	parent=parent ? parent : "body";											// If a parent div spec'd use it
	if (parent != "body")  parent="#"+parent;									// Add #
	this.parent=parent;		this.dockSide=dockSide;	this.dockPos=dockPos;		// Save settings

	this.cVolume=100;		this.gridSnap=0;	this.simplify=0;				// General settings
	this.curUndo=0;			this.curRedo=0;										// Undo/redo

	this.curCol="#e6550d";														// Default drawing settings
	this.curDrop=0;		this.curShape=0;	this.curAlpha=100;					// Common options
	this.curEwid=1;		this.curEcol="#000000";	this.curEtip=0;					// Edge options
	this.curTsiz=24;	this.curTsty=0;			this.curTfon=0;					// Text options
	this.segs=[];																// Drawing data
	var str="<div id='pamenu' class='pa-main unselectable'>";					// Main shell
	str+="<div id='pacoldot' class='pa-dot unselectable'>";						// Color dot
	$(parent).append(str);														// Add to DOM														

	var ops={id:"qdraw",x:330,y:334,wid:150,ang:45,slices:[]};
	ops.dial="img/piback.png";													// Dial background
	ops.hilite="img/philite.png";												// Slice highlight
	ops.slices[0]={ type:"but", ico:"img/gear-icon.png" };						// Center 
	ops.slices[1]={ type:"col", ico:"img/color-icon.png", def:this.curCol+",0,"+this.curDrop };	// Color slice 
	ops.slices[2]={ type:"edg", ico:"img/edge-icon.png", def:this.curEcol+","+this.curEwid+","+this.curDrop+","+this.curEtip };	// Edge 
	ops.slices[3]={ type:"sli", ico:"img/alpha-icon.png", def:100 };			// Alpha slice 
	ops.slices[4]={ type:"but", ico:"img/redo-icon.png", options:["Redo"]};		// Redo slice 
	ops.slices[5]={ type:"but", ico:"img/undo-icon.png",options:["Undo"]};		// Undo slice 
	ops.slices[6]={ type:"men", ico:"img/save-icon.png", options:["Save","Save-As","Load","Clear"]};	// Save slice 
	ops.slices[7]={ type:"but", ico:"img/gear-icon.png" };						// Center 
	ops.slices[8]={ type:"ico", ico:"img/draw-icon.png", def:this.curShape };	// Blank slice 
	ops.slices[8].options=["img/point-icon.png","img/line-icon.png","img/curve-icon.png","img/box-icon.png","img/circle-icon.png","img/text-icon.png"] ;

	this.gd=new Gdrive();														// Google drive access
	Sound("click",true);														// Init sound
	Sound("ding",true);															// Init sound
	Sound("delete",true);														// Init sound

	this.pie=new PieMenu(ops,this);												// Init pie menu
	this.DrawMenu();															// Draw it
	sessionStorage.clear();														// Clear session storage
	this.Do();																	// Add starting undo
	document.onkeyup=$.proxy(this.onKeyUp,this);								// Keyup listener
	document.onkeydown==$.proxy(this.onKeyDown,this);							// Keydown listener
	
	$("#pamenu").draggable({													// Make it draggable
		 containment: "parent",
		 start:function(e,ui) {													// On start
			$(this).css({"border-radius":"100px"});								// Make into dot
			_this.pie.ShowPieMenu(false);										// Hide menu
			},
		stop:function(e,ui) {													// On stop
			var l=$(_this.parent).width()*.1;									// L
			var r=$(_this.parent).width()*.8;									// R
			var t=$(_this.parent).height()*.1;									// T
			var b=$(_this.parent).height()*.9;									// B
			if (e.clientX < l)			_this.dockSide="left";					// Left
			else if (e.clientX > r)		_this.dockSide="right";					// Right
			else if (e.clientY < t)		_this.dockSide="top";					// Top
			else if (e.clientY > b)		_this.dockSide="bottom";				// Bottom
			else						_this.dockSide="float";					// Float
			_this.dockPos=null;													// Set y
			_this.DrawMenu();													// Redraw it
			Sound("click");														// Click
			}
		});

		$("#pamenu").on("click", function(e) {									// CLICK ITEM
			var x=$("#pamenu").position().left+25;								// Get cx
			var y=$("#pamenu").position().top+25;								// Get cy
			var w=_this.pie.ops.wid/2;											// Get width/2
			if (_this.dockSide == "left") {										// Dock left
				_this.pie.ops.x=x+40;											// Place to the right
				_this.pie.ops.y=y-w;											// Center
				}
			else if (_this.dockSide == "right") {								// Dock right
				_this.pie.ops.x=x-w-w-108;										// Place to the left
				_this.pie.ops.y=y-w;											// Center
				}
			else if (_this.dockSide == "top") {									// Dock top
				_this.pie.ops.y=y+60;											// Place down
				_this.pie.ops.x=x-w;											// Center
				}
			else if (_this.dockSide == "bottom") {								// Dock bottom
				_this.pie.ops.y=y-w-w-40;										// Place up
				_this.pie.ops.x=x-w;											// Center
				}
			else if (_this.dockSide == "float") {								// Floating
				_this.pie.ops.y=y-w;											// Center
				_this.pie.ops.x=x-w;											// Center
				}
			_this.pie.ops.sx=x;		_this.pie.ops.sy=y;							// Start point
			_this.pie.ShowPieMenu(!_this.pie.active);							// Toggle
			_this.DrawMenu();	
			});
	
	$(parent).on("mousedown",function(e) { 										// CLICK ON BACKGROUND
		if (e.target.id == "containerDiv")	{									// If on background
			_this.pie.ShowPieMenu(false);										// Hide it
			_this.DrawMenu();	
			}
		}); 
}

QDraw.prototype.DrawMenu=function()											// SHOW DRAWING TOOL MENU
{
	var col=this.curCol;														// Set color
	var icons=["point","line","curve","box","circle","text"];					// Names of icons
	var x=$(this.parent).position().left+$(this.parent).width()-50;				// Right side
	var y=$(this.parent).position().top+$(this.parent).height()-50;				// Bottom side
	if (!col || (col == "None"))												// If a null color
		col="transparent";														// Make transparent
	$("#pacoldot").css({"background":col+" url('img/"+icons[this.curShape]+"-icon.png') no-repeat center center" });
	$("#pacoldot").css({"background-size":"20px 20px","opacity":this.curAlpha/100});// Size it
	
	col=(this.curEcol == "None") ? this.curCol : this.curEcol					// Set edge
	$("#pacoldot").css({"border":"2px solid "+col} );							// Edge color
	
	if (this.pie.active) 														// If pie menu is visible
		$("#pamenu").css({"border-radius":"100px"});							// Make it round
	else{																		// Pie hidden
		if (this.dockSide == "left")
			$("#pamenu").css({"border-radius":"0px","left":"0px",
				"border-top-right-radius":"100px",
				"border-bottom-right-radius":"100px"
				});								
		else if (this.dockSide == "right")
			$("#pamenu").css({"border-radius":"0px","left":x+"px",
				"border-top-left-radius":"100px",
				"border-bottom-left-radius":"100px"
				});								
		else if (this.dockSide == "top")
			$("#pamenu").css({"border-radius":"0px","top":"0px",
				"border-bottom-left-radius":"100px",
				"border-bottom-right-radius":"100px"
				});								
		else if (this.dockSide == "bottom")
			$("#pamenu").css({"border-radius":"0px","top":y+"px",
				"border-top-left-radius":"100px",
				"border-top-right-radius":"100px"
				});								
		$("#pamenu").css({"top":this.dockPos+"%"});
		this.pie.sx=$("#pamenu").position().left;
		this.pie.sy=$("#pamenu").position().top;
	}
}

QDraw.prototype.HandleMessage=function(msg)									// REACT TO DRAW EVENT
{
	var _this=this;																// Save context
	var vv,v=msg.split("|");													// Split into parts
	if ((v[1] == "qdraw") && (v[0] == "click")) {								// A click in main menu
		if (v[2] == 8) {														// Setting shape
			if (v[3] == 5)														// If text
				this.pie.SetSlice(2,{type:"edg", ico:"img/font-icon.png", def:this.curCol+","+this.curTsiz+","+this.curDrop+","+this.curTfon+","+this.curTSty});// Text menu 
			else																// If shape
				this.pie.SetSlice(2,{type:"edg", ico:"img/edge-icon.png", def:this.curEcol+","+this.curEwid+","+this.curDrop+","+this.curEtip});	// Edge menu
			}
		if (v[2])																// If not center
			this.pie.ops.slices[v[2]].def=v[3];									// Set new default
		if (v[3])
			vv=v[3].split(",");													// Split into sub parts
		switch(v[2]-0) {														// Route on slice
			case 1:																// Color
				this.curCol=vv[0];												// Set color
				break;
			case 2:																// Edge or text styling 
				if (this.curShape == 5) {										// If text
					this.curCol=vv[0];											// Set color
					this.curTsiz=vv[1];											// Set size
					this.curDrop=vv[2];											// Set drop 
					this.curTfon=vv[3];											// Set font
					this.curTsty=vv[4];											// Set style
					}
				else{															// Edge													
					this.curEcol=vv[0];											// Set color
					this.curEwid=vv[1];											// Set width
					this.curDrop=vv[2];											// Set drop 
					this.curEtip=vv[3];											// Set tip
					}
				break;
			case 3:																// Alpha
				this.curAlpha=vv[0];											// Set alpha
				break;
			case 4:																// Redo
				this.ReDo();													// Do it
				break;
			case 5:																// Undo
				this.UnDo();													// Undo it
				break;
			case 6:
				var data="<!-- This is the raw seg data -->\n";
				data+='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle r="32" cx="35" cy="65" fill="#F00" opacity="0.5"/><circle r="32" cx="65" cy="65" fill="#0F0" opacity="0.5"/><circle r="32" cx="50" cy="35" fill="#00F" opacity="0.5"/></svg>'
				if ((v[3] == 1) || ((v[3] == 0) && !_this.gd.lastId))	{		// Save to new file
					if (this.GetTextBox("Type name of new drawing","","",function(name) {	// Type name
							_this.gd.AccessAPI(function() {
							 	_this.gd.CreateFolder(_this.gd.folderName,function(res) {	// Make sure there's a folder
									_this.gd.Upload(name,data, null,function(res) {
										 trace(res); 
										 }); 
									});
								});
						}));
					}
				else if (v[3] == 0) {											// Save to existing file
					this.gd.AccessAPI(function() {
					 	_this.gd.CreateFolder(_this.gd.folderName,function(res) { // Make sure there's a folder
								_this.gd.Upload($("#myName").val(),data,_this.gd.lastId ? _this.gd.lastId : "",function(res) {
							 	 trace(res); 
							 	 }); 
						 	 }); 
						 });
					}
				else if (v[3] == 2) {											// Load
				 	 _this.gd.AccessAPI(function() {
						 _this.gd.CreateFolder(_this.gd.folderName,function(res) {
							 _this.gd.Picker(true,function(res) {
									 	 _this.gd.AccessAPI(function() {
									 	 	 _this.gd.Download(_this.gd.lastId,function(res) {
									 	 	 	 trace(res); 
									 	 	 	 }); 
									 	 	 }); 
									 	 }); 
						 	 	 	 }); 
						 	 	 }); 
						}
				else if (v[3] == 3)	{											// Clear
					if (this.ConfirmBox("Are you sure?", function() {			// Are you sure?
							_this.gd.lastId=null;								// Clear last id
							_this.gd.lastName="";								// Clear last name
							Sound("delete");									// Delete sound
							}));
					}
				break;
			case 7:																// Settings
				this.Settings();
				break;
			case 8:																// Shape
				this.curShape=vv[0];											// Set shape
				this.Do();
				break;
			}
		this.DrawMenu();														// Redraw menu
		}
}

QDraw.prototype.Settings=function()											// SETTINGS MENU
{
	var _this=this;																// Save context
	var str="<table style='font-size:10px;color:#666'>";
	str+="<tr style='height:18px'><td><b>Click volume&nbsp;&nbsp;&nbsp;&nbsp;</b></td>";
	str+="<td><div id='cvol' class='unselectable' style='width:80px;display:inline-block'></div>&nbsp;&nbsp;&nbsp;&nbsp;"
	str+="<div id='cvolt' class='unselectable' style='display:inline-block'>"+this.cVolume+"</div></td></tr>";
	str+="<tr style='height:18px'><td><b>Grid snap</b></td>";
	str+="<td><div id='gsnap' class='unselectable' style='width:80px;display:inline-block'></div>&nbsp;&nbsp;&nbsp;"
	str+="<div id='gsnapt' class='unselectable' style='display:inline-block'>"+this.gridSnap+"</div></td></tr>";
	str+="<tr style='height:18px'><td><b>Line simplify</b></td>";
	str+="<td><div id='gsimp' class='unselectable' style='width:80px;display:inline-block'></div>&nbsp;&nbsp;&nbsp;"
	str+="<div id='gsimpt' class='unselectable' style='display:inline-block'>"+(this.simplify ? this.simplify : "Off")+"</div></td></tr>";
	str+="<tr><td><b>This drawing</b></td><td>"+(this.gd.lastName ? this.gd.lastName : "None")+"</td></tr>";
	str+="<tr><td><br></td></tr>";
	str+="<tr><td><b>Help</b></td><td><a href='https://docs.google.com/document/d/1oTbVfuBwFQvgo8EZogyuoXBu7ErCK0oAH3Ny8N_E_Mg/edit?usp=sharing' target='_blank'>";
	str+="<img src='img/helpicon.gif' style='vertical-align:bottom' title='Show help'></a></td></tr>";
	str+="</table>";

	this.Dialog("Settings",str,270, function() {
		_this.cVolume=$("#cvolt").text();
		_this.gridSnap=$("#gsnapt").text();
		});
		
	$("#cvol").slider({															// Init volume slider
		min:0, max:100, value: _this.cVolume,									// Params
		slide: function(e,ui) { $("#cvolt").text(ui.value)},					// On slide
		});	
	$("#gsnap").slider({														// Init snap slider
		min:0, max:100, step:5, value: _this.gridSnap,							// Params
		slide: function(e,ui) { $("#gsnapt").text(ui.value)},					// On slide
		});	
	$("#gsimp").slider({														// Init simplify slider
		min:0, max:100, value: _this.simplify,									// Params
		slide: function(e,ui) { $("#gsimpt").text(ui.value ? ui.value : "Off" )}, // On slide
		});	


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UNDO / REDO
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


QDraw.prototype.Do=function()												// SAVE DRAWING IN SESSION STORAGE
{

//if (this.segs[0] == undefined) this.segs.push("")
//else this.segs[0]+=String.fromCharCode(65+this.segs[0].length)

	var o={};
	o.date=new Date().toString().substr(0,21);									// Get date
	o.script=this.segs;															// Get drawing data
	sessionStorage.setItem("do-"+this.curUndo++,JSON.stringify(o));				// Add new do												
	this.curRedo=0;																// Stop any redos
	this.SetUndoStatus();														// Set undo/reco icons
//	trace("do",this.segs,this.curUndo);
}
	
QDraw.prototype.UnDo=function()												// GET DRAWING FROM SESSION STORAGE
{
	if (this.curUndo < 2)														// Nothing to undo
		return;																	// Quit
	var key=sessionStorage.key(this.curUndo-2);									// Get key for undo
	var o=$.parseJSON(sessionStorage.getItem(key));								// Get undo from local storage
	this.segs=o.script;															// Get data
	Sound("delete");															// Delete
	this.curRedo++;																// Inc redo count
	this.curUndo--;																// Dec undo count
	this.SetUndoStatus();														// Set undo/reco icons
//	trace("undo",this.segs,this.curUndo+":"+this.curRedo);
}

QDraw.prototype.ReDo=function()												// REDO DRAWING FROM UNDO
{
	if (!this.curRedo)															// Nothing to redo
		return;																	// Quit
	var key=sessionStorage.key(this.curUndo);									// Get key for redo
	var o=$.parseJSON(sessionStorage.getItem(key));								// Get undo from local storage
	this.segs=o.script;															// Get data
	Sound("ding");																// Click
	this.curUndo++;																// Inc undo count
	this.curRedo--;																// Dec redo count
	this.SetUndoStatus();														// Set undo/reco icons
//	trace("redo",this.segs,this.curUndo+":"+this.curRedo);
}

QDraw.prototype.SetUndoStatus=function()									// SET UNDO/REDO ICONS
{
	$("#sliceicon5").css("opacity",(this.curUndo > 1) ? 1 : .33);
	$("#sliceicon4").css("opacity",(this.curRedo > 0) ? 1 : .33);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EVENTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

QDraw.prototype.onKeyUp=function(e)											// KEY UP HANDLER
{
	if ((e.key == "z") && e.ctrlKey)											// Control z
		this.UnDo();															// Undo
	else if ((e.key == "Z") && e.ctrlKey)										// Control-shift Z
		this.ReDo();															// Undo
	else if ((e.key == "y") && e.ctrlKey)										// Control y
		this.ReDo();															// Redo
}

QDraw.prototype.onKeyDown=function(e)										// KEY DOWN HANDLER
{
	if ((e.keyCode == 8) &&													// Look for Del key
        (e.target.tagName != "TEXTAREA") && 								// In text area
        (e.target.tagName != "INPUT")) { 									// or input
		e.stopPropagation();												// Trap it
     	return false;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GOOGLE DRIVE ACCESS 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Gdrive()															// CONSTRUCTOR
{
	this.clientId="81792849751-1c76v0vunqu0ev9fgqsfgg9t2sehcvn2.apps.googleusercontent.com";	// Google client id
	this.scope="https://www.googleapis.com/auth/drive";							// Scope of access
	this.key="AIzaSyAVjuoRt0060MnK_5_C-xenBkgUaxVBEug";							// Google API key
	this.contentType="image/svg+xml";											// SVG mime type
	this.folderName="QDrawings";												// Name of drawings folder
	this.folderId="";															// Id of drawings folder
	this.lastId="";																// Id of last drawing saved/loaded
	this.lastName="";															// Name of last file
}

Gdrive.prototype.AccessAPI=function(apiCall, callback)						// CHECK FOR AUTHORIZATION and ACCESS API
{
	gapi.auth.authorize(														// Get logged-in status
		{"client_id": this.clientId, "scope": this.scope, 						// Client info
		"immediate": true},handleAuthResult										// Immediate
		);
		
	function handleAuthResult(authResult) {										// ON GDRIVE RESPONSE
        if (authResult && !authResult.error)  									// If logged in
	 		gapi.client.load('drive', 'v2', function() {						// Load API
 	 			apiCall(callback);												// Run API callback
	 		});
	 	else																	// Not logged in
			gapi.auth.authorize(												// Ask for auth
				{"client_id": this.clientId, "scope": this.scope, 				// Client info
				"immediate": false},handleAuthResult							// Force looking for auth
				);
		}
 }

Gdrive.prototype.Download=function(id, callback)							// DOWNLOAD DATA FROM G-DRIVE
{
	var request = gapi.client.drive.files.get({ 'fileId': id });				// Request file
	request.execute(function(resp) {											// Get data
		if (resp.downloadUrl) {													// If a link
		    var accessToken=gapi.auth.getToken().access_token;					// Get access token
		    var xhr=new XMLHttpRequest();										// Ajax
		    xhr.open("GET",resp.downloadUrl);									// Set open url
		    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);		// Set header
		    xhr.onload = function()  {  callback(xhr.responseText);   };		// On load
		    xhr.send();															// Do it
		  	}
		});
}

Gdrive.prototype.CreateFolder=function(folderName, callback)				// CREATE NEW FOLDER ON G-DRIVE
{
	var _this=this;																// Save context
	var token=gapi.auth.getToken().access_token;								// Get access token

	var request=gapi.client.drive.files.list({									// Make request object
	  	q:"title='"+folderName+"' and mimeType='application/vnd.google-apps.folder' and trashed = false" // Look for name and folder mimetype
	 	});
	request.execute(function(resp) {											// Get data
  		if (resp.items.length) {												// If folder exists
  			_this.folderId=resp.items[0].id;									// Get folder's id									
 			callback(_this.folderId);											// Run callback with id
 			}
		else{																	// Need to create it
		 	var request2=gapi.client.request({									// Make request object
				path: "/drive/v2/files/",
				method: "POST",
		       	headers: {
		           	"Content-Type": "application/json",
		           	"Authorization": "Bearer "+token,             
		      		},
		       body:{
		           	title: folderName,
		          	mimeType: "application/vnd.google-apps.folder",
		  	     	}
		  	 	});
			request2.execute(function(resp) {									// Get data
		      	_this.folderId=resp.id;											// Save last id set
	 			callback(_this.folderId);										// Run callback with id
				});	
			}	
  		});

}

Gdrive.prototype.Upload=function(name, data, id, callback)					// UPLOAD DATA TO G-DRIVE
{
	const boundary = '-------314159265358979323846264';							// Bounds	
    const delimiter = "\r\n--" + boundary + "\r\n";								// Opener
    const close_delim = "\r\n--" + boundary + "--";								// Closer
	var metadata={ 																// Set metadata
		'title': name, 'mimeType': this.contentType, 							// Name and mimetype							
		parents:[{ id: this.folderId}]											// Folder to place it in
		};
	var base64Data=btoa(data); 													// Encode to base-64 Stringify if JSON
	var _this=this;																// Save context
	id=id ? "/"+id : "";														// Add id if set
    var multipartRequestBody =													// Multipart request
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + this.contentType + '\r\n' +							// Set content type
        'Content-Transfer-Encoding: base64\r\n' +								// Base 64
        '\r\n' +
        base64Data +															// Add metadate
        close_delim;															// Closer
    var request = gapi.client.request({											// Create request
        'path': '/upload/drive/v2/files'+id,									// Service
        'method': id ? 'PUT' : 'POST',											// Method based on update or create mode
   		'params': id ? {'uploadType': 'multipart', 'alt': 'json'} : {'uploadType': 'multipart'},
        'headers': {'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'},
        'body': multipartRequestBody});
  
   request.execute(function(arg) {												// Run request
       	_this.lastId=arg.id;													// Save last id set
      	_this.lastName=arg.title;												// Save last name set
      	callback(arg);															// Run callback
    	});
}

Gdrive.prototype.Picker=function(allFiles, callback)						// RUN G-DRIVE PICKER
{
	var _this=this;																// Save context
	LoadPicker(allFiles, function(s) {											// Load picker
		callback(s.url);
		});
	
 	function LoadPicker(allFiles, callback)									// LOAD G-DRIVE PICKER
	{
	  	var pickerApiLoaded=false;
		var oauthToken;
		gapi.load('auth', { 'callback': function() {
				window.gapi.auth.authorize( {
	              	'client_id': _this.clientId,
	             	'scope': [ _this.scope,],
	              	'immediate': false }, function(authResult) {
							if (authResult && !authResult.error) {
	          					oauthToken=authResult.access_token;
	          					createPicker();
	          					}
	          				});
				}
			});
		
		gapi.load('picker', {'callback': function() {
				pickerApiLoaded=true;
		        createPicker();
	    	   	}
			});
	
		function createPicker() {
	        if (pickerApiLoaded && oauthToken) {
	           	var view=new google.picker.DocsView().
	           		setOwnedByMe(allFiles).
	           		setParent(_this.folderId).
					setIncludeFolders(true);
	          	var picker=new google.picker.PickerBuilder().
	          		addView(view).
					setOAuthToken(oauthToken).
					setDeveloperKey(_this.key).
					setCallback(pickerCallback).
					setSelectableMimeTypes(_this.contentType).
					build();
				picker.setVisible(true);
	       		}
	    	}
	
		function pickerCallback(data) {
	        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
         		var doc=data[google.picker.Response.DOCUMENTS][0];
	      		_this.lastId=doc.id;
		     	_this.lastName=doc.name;
	      		callback(doc)
	       		}
			}
	   
	}	// End closure
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

QDraw.prototype.GetTextBox=function (title, content, def, callback)		// GET TEXT LINE BOX
{
	$("#alertBoxDiv").remove();												// Remove any old ones
	$("body").append("<div class='unselectable' id='alertBoxDiv'></div>");														
	var str="<p><img src='img/shantilogo32.png' style='vertical-align:-10px'/>&nbsp;&nbsp;";								
	str+="<span id='gtBoxTi'style='font-size:18px;text-shadow:1px 1px #ccc;color:#666'><b>"+title+"</b></span><p>";
	str+="<div style='font-size:14px;margin:14px'>"+content;
	str+="<p><input class='is' type='text' id='gtBoxTt' value='"+def+"'></p></div>";
	$("#alertBoxDiv").append(str);	
	$("#alertBoxDiv").dialog({ width:400, buttons: {
				            	"OK": 		function() { Sound("click");  callback($("#gtBoxTt").val()); $(this).remove(); },
				            	"Cancel":  	function() { Sound("delete"); $(this).remove(); }
								}});	
	$("#alertBoxDiv").dialog("option","position",{ my:"center", at:"center", of:this.parent });
	$(".ui-dialog-titlebar").hide();
	$(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix").css("border","none");
	$(".ui-dialog").css({"border-radius":"14px", "box-shadow":"4px 4px 8px #ccc"});
	$(".ui-button").css({"border-radius":"30px","outline":"none"});
}

QDraw.prototype.Dialog=function (title, content, width, callback, callback2) // DIALOG BOX
{
	$("#dialogDiv").remove();											// Remove any old ones
	$("body").append("<div class='unselectable' id='dialogDiv'></div>");														
	var str="<p><img src='img/shantilogo32.png' style='vertical-align:-10px'/>&nbsp;&nbsp;";								
	str+="<span id='gtBoxTi'style='font-size:18px;text-shadow:1px 1px #ccc;color:#666'><b>"+title+"</b></span><p>";
	str+="<div style='font-size:14px;margin:14px'>"+content+"</div>";
	$("#dialogDiv").append(str);	
	$("#dialogDiv").dialog({ width:width, buttons: {
				            	"OK": 		function() { Sound("click"); if (callback)
				            								callback(); 
				            								$(this).remove();  
				            								},
				            	"Cancel":  	function() { Sound("delete"); if (callback2)	            		
				            								callback2();
				            								$(this).remove(); }
								}});	
	$("#dialogDiv").dialog("option","position",{ my:"center", at:"center", of:this.parent });
	$(".ui-dialog-titlebar").hide();
	$(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix").css("border","none");
	$(".ui-dialog").css({"border-radius":"14px", "box-shadow":"4px 4px 8px #ccc"});
	$(".ui-button").css({"border-radius":"30px","outline":"none"});
}

QDraw.prototype.ConfirmBox=function(content, callback)					// CONFIRMATION BOX
{
	$("body").append("<div class='unselectable' id='confirmBoxDiv'></div>");														
	var str="<p><img src='images/qlogo32.png' style='vertical-align:-10px'/>&nbsp;&nbsp;";								
	str+="<span style='font-size:18px;text-shadow:1px 1px #ccc;color:#666'><b>Are you sure?</b></span><p>";
	str+="<div style='font-size:14px;margin:14px'>"+content+"</div>";
	$("#confirmBoxDiv").append(str);	
	$("#confirmBoxDiv").dialog({ width:400, buttons: {
				            	"Yes": function() { Sound("click"); $(this).remove(); callback() },
				            	"No":  function() { Sound("delete"); $(this).remove(); }
								}});	
	Sound("ding");															
	$("#confirmBoxDiv").dialog("option","position",{ my:"center", at:"center", of:this.parent });
	$(".ui-dialog-titlebar").hide();
	$(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix").css("border","none");
	$(".ui-dialog").css({"border-radius":"14px", "box-shadow":"4px 4px 8px #ccc"});
	$(".ui-button").css({"border-radius":"30px","outline":"none"});
}