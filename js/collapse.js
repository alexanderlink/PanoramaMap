var COLLECTOR_MIN_PX_DISTANCE = 20;
var ZOOM_DELTA = 2;
var collectors = [];
var collectorMarkers = [];

function collapseCallback() {
    console.log("collapseCallback");
    //if(overlay) overlay.setMap(null);
    overlay = new google.maps.OverlayView();
    overlay.draw = function() {};
    overlay.setMap(map);
    projection = overlay.getProjection();
    if(!projection) {
        console.log('Projection : ' + projection);
		setTimeout(collapseCallback, 10);
        return;
    }
	collectorMarkers.forEach(function(marker) {
		marker.setMap(null);
	});
    collectPixelPositions();
    collectCloseLocations();
    joinCollectors();
	refresh();
	setTimeout(refresh, 2000);
}

function refresh() {
    //Refresh
    google.maps.event.trigger(map, 'resize');
    //map.setZoom( map.getZoom() );
}

function collectPixelPositions() {
    var count = 0;
    locations.forEach(function(loc) {
        var px = null;
        if(loc.marker && loc.marker.position) {
            px = getPoint(loc.marker.position);
            loc.marker.position.px = px;
            count++;
        }
    });
    console.log("collectPixelPositions: " + count);
}

function getPoint(latLng) {
    if(!projection) return null;
    var point = projection.fromLatLngToContainerPixel(latLng);
    return point;
}

function collectCloseLocations() {
    var found = 0;
    locations.forEach(function(loc1) {
        locations.forEach(function(loc2) {
            if(!loc1.marker || !loc2.marker) return; //Corrupt location
            if(!loc1.marker.map || !loc2.marker.map) return; //Not visible
            if(!loc1.marker.position.px || !loc2.marker.position.px) return; //Not visible
			if(loc1.collector && loc2.collector) return; //Already collected
            var diffPx = getLatLngPixelDiff(loc1.marker.position, loc2.marker.position);
            if(!diffPx) {
                //console.log("No diff results")
            } else if(diffPx.len < COLLECTOR_MIN_PX_DISTANCE) {
                //console.log("FOUND " + loc1.marker + ' / ' + loc2.marker);
                found++;
                collectMarkers(loc1, loc2);
            }
        });
    });
    console.log("collectCloseLocations " + found);
}

function getLatLngPixelDiff(latLng1, latLng2) {
    if(latLng1 == latLng2) return null;
    var result = {};
    result.p1 = latLng1.px;
    result.p2 = latLng2.px;
    if(!result.p1 || !result.p2) return null;
    result.dx = result.p2.x - result.p1.x;
    result.dy = result.p2.y - result.p1.y;
    result.len = Math.sqrt(Math.pow(result.dx, 2) + Math.pow(result.dy, 2));
    return result;
}

function collectMarkers(loc1, loc2) {
    var collector = null;
    if(!collector && loc1.collector) collector = loc1.collector;
    if(!collector && loc2.collector) collector = loc2.collector;
    if(!collector) {
        collector = [];
        collectors.push(collector);
    }
	addLocationToCollector(collector, loc1);
	addLocationToCollector(collector, loc2);
    loc1.collector = collector;
    loc2.collector = collector;
}

function addLocationToCollector(collector, loc) {
	if(collector.indexOf(loc) < 0) {
		collector.push(loc);
	}
}

function joinCollectors() {
    var countClosed = 0;
    var countCreated = 0;
    collectors.forEach(function(collector) {
        collector.forEach(function(loc) {
            loc.marker.setMap(null);
            countClosed++;
        });
		createCollectorMarker(collector);
		countCreated++;
    });
    console.log("joinCollectors: " + countClosed + " closed, " + countCreated  + " created");
}

function createCollectorMarker(collector) {
	var cMarker = new google.maps.Marker({
		map: map,
		position: collector[0].marker.position, //TODO
		title: "Collection",
		label: {
			text: ''+collector.length,
			color: 'white',
			fontSize: '10pt'
		},
		icon: {
			path: google.maps.SymbolPath.CIRCLE,
			scale: 10,
			strokeWeight: 4,
			fillColor: 'black',
			fillOpacity: 0.7,
			strokeColor: 'red',
			strokeOpacity: 0.7
		}
	});
	cMarker.collector = collector;
	collector.marker = cMarker;
	cMarker.addListener('click', function() {
		map.setZoom(map.getZoom()+ZOOM_DELTA);
		map.setCenter(cMarker.position);
		expandCollector(cMarker);
	});
	cMarker.addListener('rightclick', function() {
		alert(cMarker.collector.length);
	});
	collectorMarkers.push(cMarker);
}

function expandCollectors() {
     collectors.forEach(function(collector) {
        expandCollector(collector.marker);
     });
}

function expandCollector(cMarker) {
    cMarker.collector.forEach(function(loc) {
        loc.marker.setMap(map);
		loc.marker.collector = null;
    });
    cMarker.setMap(null);
    removeCollector(cMarker);
    setTimeout(refresh, 500);
    setTimeout(collapseCallback, 2000);
}

function removeCollector(cMarker) {
    var newCollectors = [];
    collectors.forEach(function(collector) {
        if(collector != cMarker.collector) {
            newCollectors.push(collector);
        } else {
            collector.forEach(function(loc) {
                loc.collector = null;
            });
        }
    });
	var oldCollector = cMarker.collector;
	cMarker.collector = null;
	oldCollector.marker = null;
	collectors = newCollectors;
}