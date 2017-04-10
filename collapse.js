var collectors;

function collapseCallback() {
    console.log("tilesloaded");
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
    locations.forEach(function(loc) {
        var px = null;
        if(loc.marker && loc.marker.position) {
            px = getPoint(loc.marker.position);
            loc.marker.position.px = px;
        }
    });
}

function getPoint(latLng) {
    if(!projection) return null;
    var point = projection.fromLatLngToContainerPixel(latLng);
    return point;
}

function collectCloseLocations() {
    var found = 0;
    collectors = [];
    locations.forEach(function(loc1) {
        locations.forEach(function(loc2) {
            if(!loc1.marker || !loc2.marker) return; //Corrupt location
            if(!loc1.marker.map || !loc2.marker.map) return; //Not visible
            if(!loc1.marker.position.px || !loc2.marker.position.px) return; //Not visible
            var diffPx = getLatLngPixelDiff(loc1.marker.position, loc2.marker.position);
            if(!diffPx) {
                console.log("No diff results")
            } else if(diffPx.len < 50) {
                console.log("FOUND " + loc1.marker + ' / ' + loc2.marker);
                found++;
                collectMarkers(loc1, loc2);
            }
        });
    });
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
    collectors.forEach(function(collector) {
        collector.forEach(function(loc) {
            loc.marker.setMap(null);
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
		marker.collector = collector;
		marker.addListener('click', function() {
			collector.forEach(function(loc) {
				loc.marker.setMap(map);
			});
			marker.setMap(null);
			setTimeout(collapseCallback, 2000);
		});
    });
}

/*function joinMarkers(loc1, loc2) {
    //loc1.marker.icon.strokeColor = 'yellow';
    //loc2.marker.icon.strokeColor = 'yellow';
    loc1.marker.setMap(null);
    loc2.marker.setMap(null);

    var lat = (loc1.marker.position.lat() + loc2.marker.position.lat()) / 2;
    var lng = (loc1.marker.position.lng() + loc2.marker.position.lng()) / 2;
    var newLoc = {};
    newLoc.marker = new google.maps.Marker({
        map: map,
        position: {lat: lat, lng: lng},
        title: "2",
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
    //locations.push(newLoc);
}*/
