//Declaring Global variables
var map, locationMarker, defaultIcon, highlightedIcon, infoWindow, bounds;
var ClientID, clientSecret;
var markers = []

// google maps init - map must be declared outside the function
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {lat: 46.204391, lng: 6.143158},
        mapTypeControl: false

    });

    bounds = new google.maps.LatLngBounds();
    infoWindow = new google.maps.InfoWindow();

    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', function() {
          hideListings(markers);
        });

    ko.applyBindings(new ViewModel());

}

// Reading location data and calling Foursquare API
locationMarker = function(data) {
  var self = this;
  this.title = data.title;
  this.position = data.location;
  this.lat = data.location.lat;
  this.lng = data.location.lng;
  this.url = '';
  this.street = '';
  this.phone = '';

  this.visible = ko.observable(true);

  // Style the markers a bit. This will be our listing marker icon.
  defaultIcon = makeMarkerIcon('0091ff');
  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  highlightedIcon = makeMarkerIcon('FFFF24');

  // #######################
  // foursquare places api
  // #######################
  clientID = 'NIBXA2LBIWD3I5OJMG1QJRC1Q0C2MWHMFIF0CL1DR2JBOCB0';
  clientSecret = '25B1GK0FBG55GIJGVISITVAGRCT5EW5O0O4LE1N4253ZGXAE';

  var frsq_url = 'https://api.foursquare.com/v2/venues/search?ll=' +
            this.position.lat + ',' + this.position.lng + '&client_id=' +
            clientID + '&client_secret=' + clientSecret + '&v=20180323' +
            '&query=' + this.title + '&limit=1';

  $.getJSON(frsq_url).done(function(data) {
    var results = data.response.venues[0];
    self.street = results["location"]["formattedAddress"][0] || 'N/A';
    self.city = results["location"]["formattedAddress"][1]  || 'N/A';
    }).fail(function() {
        alert('Something went wrong with foursquare');

  });

  // Create a markers
  this.marker = new google.maps.Marker({
      position: this.position,
      map: map,
      title: this.title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon

    });

  markers.push(this.marker);

  this.showMarkers = ko.computed(function() {
    if(this.visible() === true) {
      this.marker.setMap(map);
    } else {
      this.marker.setMap(null);
    }
  }, this);


  // Create an onclick even to open an indowindow at each marker
    this.marker.addListener('click', function() {
      self.contentString = '<div class="infowindow-content"><div class="title"><b>' +
          self.title + "</b></div>" +
          '<div class="content">' + self.street + "</div>" +
          '<div class="content">' + self.city + "</div>" +
          "</div></div>";

        self.infoWindow.setContent(self.contentString);
        self.infoWindow.open(map, this);

    		self.marker.setAnimation(google.maps.Animation.BOUNCE);
          	setTimeout(function() {
          		self.marker.setAnimation(null);
         	}, 2100);

    	});

    this.marker.addListener('closeclick', function() {
        self.infoWindow.close(map, this);
        self.marker.setMap(null);
      });

    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });

    // show item info when selected from list
    this.show = function(locations) {
        google.maps.event.trigger(self.marker, 'click');
    };

   // creates bounce effect when item selected
    this.bounce = function(locations) {
		google.maps.event.trigger(self.marker, 'click');
	};



  // Create infoWindow
  this.contentString = '<div class="infowindow-content">' +
            '<div class="title"><b>'  + self.title + '</b></div>' +
            '<div class="content">' + self.street + '</div>' +
            '<div class="content">' + self.city + '</div></div>';

  this.infoWindow = new google.maps.InfoWindow({content:self.contentString});


};

// Google Maps API == ViewModel
var ViewModel = function() {
    var self = this;
    this.searchItem = ko.observable('');
    this.mapList = ko.observableArray([]);

    // add location markers for each location
    locations.forEach(function(location) {
        self.mapList.push( new locationMarker(location) );
    });

    this.locationList = ko.computed(function() {
        var searchFilter = self.searchItem().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapList(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
				        return result;
			           });
                }
        self.mapList().forEach(function(location) {
            location.visible(true);
        });
        return self.mapList();
    }, self);


};



      // This function will loop through the markers array and display them all.
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

function hideListings(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1400);
  }
}


// Source: Udacity Understanding API services
// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// handle map error
function googleMapsError() {
    alert('Google Maps error!');
}
