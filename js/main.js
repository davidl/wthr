// wthr JavaScript
// by David Lantner, http://davidlantner.net/

var wthr = wthr || {};

wthr.units = 'imperial'; // "imperial" or "metric" for OpenWeatherMap API

// Functions:

// Show loading indicator:
wthr.showLoading = function() {
    $('#search').addClass('loading');
};

// Hide loading indicator:
wthr.hideLoading = function() {
    $('#search').removeClass('loading');
};

// Prepare data to pass to wthr.getWeather():
wthr.getWeatherByPlacename = function(placename) {
    wthr.getWeather({ 'q': placename });
};

// Prepare data to pass to wthr.getWeather():
wthr.getWeatherByLatLon = function(position) {
    wthr.getWeather({
        'lat': position.coords.latitude,
        'lon': position.coords.longitude
    });
};

wthr.getWeather = function(queryData) {
    queryData = jQuery.extend(queryData, {
        'units': wthr.units
    });
    jQuery.ajax({
        type: 'GET',
        url: 'http://api.openweathermap.org/data/2.5/weather?callback=?',
        data: queryData,
        dataType: 'jsonp',
        success: function(data){
            // API doesn't change HTTP status code,
            // instead we must check the "cod" value:
            if ( data.cod == '200' ) {
                wthr.processResults(data);
            } else {
                wthr.showError('');
            }
        },
        error: function(e) {
            wthr.showError(e.message);
        }
    });
};

wthr.showError = function(msg) {
    // display an error message:
    var message = '<p class="error">An error occured. Please try again.</p>';
    message += '<p>' + msg + '</p>';
    $('#results').empty().html(message).show();
};

wthr.hideError = function() {
    $('#results').hide().empty();
};

wthr.processResults = function(data) {
    // If cross-browser compatibility was not a high priority,
    // I would consider using the <template> element in HTML5
    // with a polyfill: http://jsfiddle.net/brianblakely/h3EmY/
    var results =  '<h2 data-code="' + data.weather[0].id + '">' + data.name + '</h2>';
        results += '<dl>';
            results += '<dt class="now visuallyhidden">Now</dt>';
            results += '<dd><b class="temp">' + Math.round(data.main.temp) + '</b><span class="deg">°</span></dd>';
            results += '<dt class="low">Low</dt><dd class="temp">' + Math.round(data.main.temp_min) + '</dd>';
            results += '<dt class="high">High</dt><dd class="temp">' + Math.round(data.main.temp_max) + '</dd>';
            results += '<dt class="desc visuallyhidden">Description</dt>';
            results += '<dd title="' + data.weather[0].description + '">' + data.weather[0].main + '</dd>';
        results += '</dl>';
        
        /* Future improvement: include more details in a <details> element
           with a polyfill fallback: http://mathiasbynens.be/demo/html5-details-jquery
        results += '<details open>'; // add open attribute for larger screens
            results += '<dl>';
                results += '<dt>Sunrise</dt>';
                results += '<dd>' + wthr.convertUnixTime(data.sys.sunrise) + '</dd>';
                results += '<dt>Sunset</dt>';
                results += '<dd>' + wthr.convertUnixTime(data.sys.sunset) + '</dd>';
            results += '</dl>';
        results += '</details>';
        */
    wthr.hideLoading();
    jQuery('#results').empty().html(results).show();
}

// Convert Farenheit to Celsius:
wthr.convertUnits = function(unit) {
    // Ensure value is "imperial" or "metric":
    if ( unit !== 'imperial' && unit !== 'metric' ) {
        return;
    }
    if ( $('#results').is(':visible') ) {
        $('.temp').each(function(i, item){
            var value = unit == 'metric' ? 
                Math.round(($(item).text() - 32) * 5 / 9) : // F to C
                Math.round($(item).text() * 9 / 5 + 32); // C to F
            $(item).text(value);
        });
    }
};

// Event handlers:

// Use geolocation if available:
if (Modernizr.geolocation) {
    $('#current').on('click', function(e){
        e.preventDefault();
        wthr.showLoading();
        navigator.geolocation.getCurrentPosition(wthr.getWeatherByLatLon);
    });
} else {
    $('.geolocation').hide(); // should already be hidden by CSS
}

// Unit conversion:
$('input[name=units]').on('change', function(){
    var value = $('input[name=units]:checked').val();
    wthr.units = value;
    wthr.convertUnits(value);
});

// Search by place name (without autocomplete):
$('#search').on('submit', function(e){
    e.preventDefault();
    var placename = $('#place').val();
    if ( placename !== '' ) {
        wthr.showLoading();
        $('#search').removeClass('error');
        wthr.getWeatherByPlacename(placename);
    } else {
        wthr.hideLoading();
        $('#search').addClass('error');
    }
});

// Global Ajax handlers:
$(document).on('ajaxSend', function(){
    wthr.showLoading();
}).on('ajaxComplete', function(){
    wthr.hideLoading();
});

// Autocomplete:
$('#place').autocomplete({
    source: function( request, response ) {
        $.ajax({
            url: 'http://api.geonames.org/searchJSON?callback=?',
            dataType: "jsonp",
            data: {
                country: 'US',
                maxRows: 10,
                fuzzy: 0.8,
                username: 'davidlantner',
                q: request.term
            },
            success: function( data ) {
                response( $.map( data.geonames, function( item ) {
                    return {
                        label: item.name + (item.adminCode1 ? ', ' + item.adminCode1 : 'US'),
                        value: item.name + (item.adminCode1 ? ', ' + item.adminCode1 : 'US')
                    }
                }));
            }
        });
    },
    minLength: 2,
    select: function( event, ui ) {
        if ( ui.item ) {
            $('#search').submit();
        }
    }
});