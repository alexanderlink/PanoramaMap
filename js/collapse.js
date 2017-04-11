var COLLECTOR_MIN_PX_DISTANCE = 20;
var collectors = [];

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
    collector.push(loc1);
    collector.push(loc2);
    loc1.collector = collector;
    loc2.collector = collector;
}

function joinCollectors() {
    var countClosed = 0;
    var countCreated = 0;
    collectors.forEach(function(collector) {
        collector.forEach(function(loc) {
            loc.marker.setMap(null);
            countClosed++;
        });
        var marker = new google.maps.Marker({
            map: map,
            position: collector[0].marker.position, //TODO
            title: "MORE",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                strokeWeight: 4,
                fillColor: 'black',
                fillOpacity: 0.7,
                strokeColor: 'yellow',
                strokeOpacity: 0.7
            }
        });
        countCreated++;
		marker.collector = collector;
        collector.marker = marker;
		marker.addListener('click', function() {
            expandCollector(marker);
		});
    });
    console.log("joinCollectors: " + countClosed + " closed, " + countCreated  + " created");
}

function expandCollectors() {
     collectors.forEach(function(collector) {
        expandCollector(collector.marker);
     });
}

function expandCollector(marker) {
    marker.collector.forEach(function(loc) {
        loc.marker.setMap(map);
    });
    marker.setMap(null);
    removeCollector(marker.collector);
    refresh();
    setTimeout(collapseCallback, 2000);
}

function removeCollector(toBeRemoved) {
    var newCollectors = [];
    collectors.forEach(function(collector) {
        if(collector != toBeRemoved) {
            newCollectors.push(collector);
        } else {
            collector.forEach(function(loc) {
                loc.collector = null;
            });
        }
    });
    collectors = newCollectors;
}