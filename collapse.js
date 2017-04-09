function collapseCallback() {
    console.log("IDLE");
    //if(overlay) overlay.setMap(null);
    overlay = new google.maps.OverlayView();
    overlay.draw = function() {};
    overlay.setMap(map);
    projection = overlay.getProjection();
    collapseCloseLocations();
}

function collapseCloseLocations() {
    var found = 0;
    locations.forEach(function(loc1) {
        locations.forEach(function(loc2) {
            if(!loc1.marker || !loc2.marker) return; //Corrupt location
            if(!loc1.marker.map || !loc2.marker.map) return; //Not visible
            var diffPx = getLatLngPixelDiff(loc1.marker.position, loc2.marker.position);
            if(!diffPx) {
                console.log("No diff results")
            } else if(diffPx.len < 50) {
                console.log("FOUND " + loc1.marker + ' / ' + loc2.marker);
                found++;
                joinMarkers(loc1, loc2);
            }
        });
    });
    if(found > 0) {
        //Refresh
        google.maps.event.trigger(map, 'resize');
        //map.setZoom( map.getZoom() );
    }
    return found;
}

function joinMarkers(loc1, loc2) {
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
}

function getLatLngPixelDiff(latLng1, latLng2) {
    if(latLng1 == latLng2) return null;
    var result = {};
    result.p1 = getPoint(latLng1);
    result.p2 = getPoint(latLng2);
    if(!result.p1 || !result.p2) return null;
    result.dx = result.p2.x - result.p1.x;
    result.dy = result.p2.y - result.p1.y;
    result.len = Math.sqrt(Math.pow(result.dx, 2) + Math.pow(result.dy, 2));
    return result;
}

function getPoint(latLng) {
    if(!projection) return null;
    var point = projection.fromLatLngToContainerPixel(latLng);
    return point;
}