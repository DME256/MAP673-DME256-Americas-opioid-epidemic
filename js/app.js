(function () {

  const map = L.map('map', {
    center: [39.8283, -98.5795],
      zoom: 4,
      minZoom: 4,
      maxZoom: 6,
      scrollWheelZoom: true,
      zoomSnap: .1,
      dragging: true,
      zoomControl: true
  });
  

  const accessToken = 'pk.eyJ1IjoiZG1lMjU2IiwiYSI6ImNrMDh5ajZhaTAzOHEzb293NGl1dGJyMDYifQ.ulN1IYya6BL917CGdf5OIA'

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + accessToken, {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.dark',
    accessToken: accessToken
  }).addTo(map);

  

  // use omnivore to load the CSV data
  omnivore.csv('data/opioid_deaths_new.csv')
    .on('ready', function (e) {
      drawMap(e.target.toGeoJSON());
      drawLegend(e.target.toGeoJSON()); // add this statement
    })
     .on('error', function (e) {
       console.log(e.error[0].message);
    
     });

  function drawMap(data) {
    console.log(data);

    const options = {
      pointToLayer: function (feature, ll) {
        return L.circleMarker(ll, {
          opacity: 1,
          weight: 2,
          fillOpacity: 0,
        })
      }
    }

    // create 4 separate layers from GeoJSON data
    const heroinLayer = L.geoJson(data, options).addTo(map),
    methadoneLayer = L.geoJson(data, options).addTo(map),
    naturalLayer = L.geoJson(data, options).addTo(map),
    syntheticLayer = L.geoJson(data, options).addTo(map);

    // fit the bounds of the map to one of the layers
    map.fitBounds(syntheticLayer.getBounds());

    // adjust zoom level of map
    map.setZoom(map.getZoom() - .4);

    naturalLayer.setStyle({
      color: '#BCA9F5',
    });
    syntheticLayer.setStyle({
      color: '#58FAF4',
    });
    methadoneLayer.setStyle({
      color: '#D96D02',
    });
    heroinLayer.setStyle({
      color: '#FF0000',
    });

    const sourceLayers = {
		 "<b style='color:#BCA9F5'>Natural Opiods</b>": naturalLayer,
			"<b style='color:#58FAF4'>Synthetic Opiods</b>": syntheticLayer,
      "<b style='color:#D96D02'>Methadone</b>": methadoneLayer,
      "<b style='color:#FF0000'>Heroin</b>": heroinLayer

		}

		L.control.layers(null, sourceLayers, {
			collapsed: false

		}).addTo(map);
    // pass the correct argument for current year
    resizeCircles(naturalLayer, syntheticLayer, methadoneLayer, heroinLayer,2006);
    sequenceUI(naturalLayer, syntheticLayer, methadoneLayer, heroinLayer);

  } // end drawMap()

  function calcRadius(val) {

    var radius = Math.sqrt(val / Math.PI);
    return radius * 1.5; // adjust .5 as a scale factor

  } // end calcRadius()

  function resizeCircles(naturalLayer, syntheticLayer, methadoneLayer, heroinLayer, currentYear) {

    naturalLayer.eachLayer(function (layer) {
      console.log(layer.feature.properties)
      var radius = calcRadius(Number(layer.feature.properties['NATURAL' + currentYear]));
      layer.setRadius(radius);
    });
    syntheticLayer.eachLayer(function (layer) {
      var radius = calcRadius(Number(layer.feature.properties['SYNTHETIC' + currentYear]));
      layer.setRadius(radius);
    });
    methadoneLayer.eachLayer(function (layer) {
      var radius = calcRadius(Number(layer.feature.properties['METHADONE' + currentYear]));
      layer.setRadius(radius);
    });
    heroinLayer.eachLayer(function (layer) {
      var radius = calcRadius(Number(layer.feature.properties['HEROIN' + currentYear]));
      layer.setRadius(radius);
    });

    // update the hover window with current year
    retrieveInfo(syntheticLayer, currentYear);

    // good solution for lab
    // update year legend
    updateYear(currentYear);

  } // end resizeCircles()

  function sequenceUI(naturalLayer, syntheticLayer, methadoneLayer, heroinLayer) {

    // create Leaflet control for the slider
    const sliderControl = L.control({
      position: 'bottomleft'
    });

    sliderControl.onAdd = function (map) {

      const controls = L.DomUtil.get("slider");

      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);

      return controls;
    }

    // add UI control to map
    sliderControl.addTo(map);

    // create Leaflet control for the year legend
    const yearControl = L.control({
      position: 'bottomleft'
    });

    yearControl.onAdd = function (map) {

      const controls = L.DomUtil.get("year");

      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);

      return controls;
    }

    // add year legend to map
    yearControl.addTo(map);

    //select the slider's input and listen for change
    $('#slider input[type=range]')
      .on('input', function () {

        // current value of slider is current year
        var currentYear = this.value;

        // resize the circles with updated year
        resizeCircles(naturalLayer, syntheticLayer, methadoneLayer, heroinLayer, currentYear);

      });
  } // end sequenceUI()

  function drawLegend(data) {

    // create Leaflet control for the legend
    const legendControl = L.control({
      position: 'topright'
    });

    // when the control is added to the map

    legendControl.onAdd = function (map) {

      // select the legend using id attribute of legend
      const legend = L.DomUtil.get("legend");
      
      // disable scroll and click functionality 
      L.DomEvent.disableScrollPropagation(legend);
      L.DomEvent.disableClickPropagation(legend);

      // return the selection
      return legend;

    }

    // // empty array to hold values
    // const dataValues = [];

    // // loop through all features (i.e., the states)
    // data.features.forEach(function (state) {
    //   console.log(data)
    //   // for each year in a state
    //   // use correct variable name
    //   for (let opiodType in state.properties) {
    //     // shorthand to each value
    //     // use correct variable name
    //     const value = state.properties[opiodType];
    //     // if the value can be converted to a number 
    //     // the + operator in front of a number returns a number
    //     if (+value) {
    //       //return the value to the array
    //       dataValues.push(+value);
    //     }
    //   }
    // });
    // // verify your results!
    // console.log(dataValues);


    // // sort our array
    // const sortedValues = dataValues.sort(function (a, b) {
    //   return b - a;
    // });

    // // round the highest number and use as our large circle diameter
    // const maxValue = Math.round(sortedValues[0] / 1000) * 1000;


    // // calc the diameters
    // const largeDiameter = calcRadius(maxValue) * 2,
    //   smallDiameter = largeDiameter / 2;

    // // select our circles container and set the height
    // $(".legend-circles").css('height', largeDiameter.toFixed());

    // // set width and height for large circle
    // $('.legend-large').css({
    //   'width': largeDiameter.toFixed(),
    //   'height': largeDiameter.toFixed()
    // });
    // // set width and height for small circle and position
    // $('.legend-small').css({
    //   'width': smallDiameter.toFixed(),
    //   'height': smallDiameter.toFixed(),
    //   'top': largeDiameter - smallDiameter,
    //   'left': smallDiameter / 2
    // })

    // // label the max and median value
    // $(".legend-large-label").html(maxValue.toLocaleString());
    // $(".legend-small-label").html((maxValue / 2).toLocaleString());

    // // adjust the position of the large based on size of circle
    // $(".legend-large-label").css({
    //   'top': -11,
    //   'left': largeDiameter + 30,
    // });

    // // adjust the position of the large based on size of circle
    // $(".legend-small-label").css({
    //   'top': smallDiameter - 11,
    //   'left': largeDiameter + 30
    // });

    // // insert a couple hr elements and use to connect value label to top of each circle
    // $("<hr class='large'>").insertBefore(".legend-large-label")
    // $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);
    // // Select the legend button and wait for click event
    // $('#legend button').click(function () {
    //   // Select all div elements in #legend and toggle the none class on click
    //   $('#legend > div').toggleClass('none');
    // });

    legendControl.addTo(map);

  } // end drawLegend()

  function retrieveInfo(syntheticLayer,currentYear ) {

    // select the element and reference with variable
    // and hide it from view initially
    const info = $('#info').hide();

    // since naturalLayer is on top, use to detect mouseover events
    syntheticLayer.on('mouseover', function (e) {

      // remove the none class to display and show
      info.show();

      // access properties of target layer
      const props = e.layer.feature.properties;

      // // // populate HTML elements with relevant info
      $('#info span').html(props.STATE);
      $(".year span:first-child").html('(YEAR' + currentYear + ')')
      $(".natural span:first-child").html('(NATURAL' + currentYear );
      $(".synthetic span:first-child").html('(SYNTHETIC' + currentYear + ')');
      $(".methadone span:first-child").html('(METHADONE ' + currentYear + ')');
      $(".heroin span:first-child").html('(HEROIN' + currentYear + ')');
      
      
    
      $(".year span:last-child").html(Number(props['YEAR' + currentYear]).toLocaleString());
      $(".natural span:last-child").html(Number(props['NATURAL ' + currentYear]).toLocaleString());
      $(".synthetic span:last-child").html(Number(props['SYNTHETIC ' + currentYear]).toLocaleString());
      $(".methadone span:last-child").html(Number(props['SYNTHETIC ' + currentYear]).toLocaleString());
      $(".heroin span:last-child").html(Number(props['HEROIN' + currentYear]).toLocaleString());
     
      
      
      
      
      // raise opacity level as visual affordance
      e.layer.setStyle({
        fillOpacity: .6
      });

      // empty arrays for opioid death values
      const heroinValues = [],
        methadoneValues = [],
        naturalValues = [],
        syntheticValues = [];
        
        

      // loop through the year levels and push values into those arrays
      for (let i = 2006; i <= 2018; i++) {
        heroinValues.push(props['HEROIN' + i]);
        methadoneValues.push(props['METHADONE' + i]);
        naturalValues.push(props['NATURAL' + i]);
        syntheticValues.push(props['SYNTHETIC' + i]);
      }

      
      $('.naturalspark').sparkline(naturalValues, {
        width: '200px',
        height: '30px',
        lineColor: '#5F04B4',
        fillColor: '#BCA9F5 ',
        spotRadius: 0,
        lineWidth: 2
      });

      $('.syntheticspark').sparkline(syntheticValues, {
        width: '200px',
        height: '30px',
        lineColor: '#6E77B0',
        fillColor: '#58FAF4',
        spotRadius: 0,
        lineWidth: 2
      });
      $('.methadonespark').sparkline(methadoneValues, {
        width: '200px',
        height: '30px',
        lineColor: '#FFD500',
        fillColor: '#D96D02',
        spotRadius: 0,
        lineWidth: 2
      });
      $('.heroinspark').sparkline(heroinValues, {
        width: '200px',
        height: '30px',
        lineColor: '#8a0808',
        fillColor: '#FF0000',
        spotRadius: 0,
        lineWidth: 2
      });
    });

    // hide the info panel when mousing off layergroup and remove affordance opacity
    syntheticLayer.on('mouseout', function (e) {

      // hide the info panel
      info.hide();

      // reset the layer style
      e.layer.setStyle({
        fillOpacity: 0
      });
    });

    // On window resize unset any position properties
    $(window).resize(function () {
      info.css({
        "left": "unset",
        "right": "unset",
        "top": "unset"
      });
    })

    // when the mouse moves on the document
    $(document).mousemove(function (e) {
      // Check document size, if less than 800...
      if ($(document).width() < 800) {

        // ...position the info window in the upper-right corner.
        info.css({
          "right": 10,
          "top": 45,
        });

      } else {
        // first offset from the mouse position of the info window
        info.css({
          "left": e.pageX + 6,
          "top": e.pageY - info.height() - 25
        });

        // if it crashes into the top, flip it lower right
        if (info.offset().top < 4) {
          info.css({
            "top": e.pageY + 15
          });
        }
        // if it crashes into the right, flip it to the left
        if (info.offset().left + info.width() >= $(document).width() - 40) {
          info.css({
            "left": e.pageX - info.width() - 80
          });
        }
      }
    });

  } // end retrieveInfo()

  function updateYear(currentYear) {

    //select the slider's input and listen for change
    $('#year span').html(currentYear);

  } // end updateYear()

})();