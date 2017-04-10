var debug = true;
var isMobile = false;

var popups = [];
var map;
var overlay, projection;

var locations = [];
var routes = [];

var debugRoute = []; //debug
function appendDebugRoute(map, latlng) {
	debugRoute.push(latlng);

	var flightPath = new google.maps.Polyline({
		path: debugRoute,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	flightPath.setMap(map);
}

function closeAllPopups() {
	popups.forEach(function(popup) {
		popup.close();
	});
}

function addRoute(map, route) {
	var path = new google.maps.Polyline({
		path: route,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 0.7,
		strokeWeight: 2
	});
	path.setMap(map);
}

function preparePopup(map, loc) {
	var infoContent = "<div>";
	if(loc.title) infoContent += "<h4>" + loc.title + "</h4>";
	if(loc.embedUrl) infoContent += "<iframe src=\"" + loc.embedUrl + "\" class=\"popup" + (isMobile ? "-mobile" : "") + "\" allowfullscreen></iframe><br>";
	if(loc.images && loc.images.length > 0) {
		loc.images.forEach(function(img) {
			infoContent += ("<a target='_blank' href='" + img + "'>Image</a> | ");
		});
	}
	if(loc.url) infoContent += "<a target='_blank' href=\"" + loc.url + "\">Open Panorama</a> ";
	infoContent += "</div>";
	var infowindow = new google.maps.InfoWindow({
		content: infoContent			
	});
	return infowindow;
}

function addLocation(map, loc) {
	if(!loc.url) return;
	var match = /.*@([\-0-9.]*),([\-0-9.]*).*/.exec(loc.url);
	var lat = match[1];
	var lng = match[2];
	var myLatLng = {lat: parseFloat(lat), lng: parseFloat(lng)};
	
	loc.marker = new google.maps.Marker({
		map: map,
		position: myLatLng,
		title: loc.title,
		icon: {
			path: google.maps.SymbolPath.CIRCLE,
			scale: 4,
			strokeWeight: 3,
			fillColor: 'black',
			fillOpacity: 0.7,
			strokeColor: 'red',
			strokeOpacity: 0.7
		}
	});

	var popup = preparePopup(map, loc);
	popups.push(popup);
	loc.marker.addListener('click', function() {
		closeAllPopups();
		popup.open(map, loc.marker);
	});
}

function detectBrowser() {
	var useragent = navigator.userAgent;
	var mapdiv = document.getElementById("map");
	if(debug) $('#output').val(useragent);
	if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1 ) {
		mapdiv.style.width = '100%';
		mapdiv.style.height = '100%';
		isMobile = true;
	} else {
		mapdiv.style.width = '100%';
		mapdiv.style.height = '100%';
		//mapdiv.style.width = '600px';
		//mapdiv.style.height = '800px';
		isMobile = false;
	}
}

function init() {
	if(!debug) $('#output').remove();
	detectBrowser();
	initMap();
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 28.2915147, lng: -16.6104693},
		scrollwheel: true,
		zoom: 10,
		scaleControl: true,
		zoomControl: true,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		mapTypeControl: true,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DEFAULT,
			mapTypeIds: [
				google.maps.MapTypeId.ROADMAP,
				google.maps.MapTypeId.TERRAIN,
				google.maps.MapTypeId.SATELLITE,
				google.maps.MapTypeId.HYBRID
			]
		}
	});

	map.addListener('rightclick', function(e) {
		if(debug) $('#output').val(JSON.stringify(debugRoute));
	});

	map.addListener('click', function(e) {
		closeAllPopups();
		if(debug) appendDebugRoute(map, e.latLng);
	});

	locations.forEach(function(loc) {
		addLocation(map, loc);
	});

	routes.forEach(function(route) {
		addRoute(map, route);
	});

	// Wait for map loaded
	google.maps.event.addListener(map, 'tilesloaded', collapseCallback);
}
