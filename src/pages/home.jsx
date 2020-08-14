import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'unistore/react';
import { actions } from '../store';
import axios from 'axios';
import { Grid, Input, Form, Button, Modal, Icon } from 'semantic-ui-react';
import { Navbar, Nav, Button as ReactButton } from 'react-bootstrap';
import '../styles/testPage.css';
import '../styles/beranda.css';
import '../styles/geosearch.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import CodeLogo from '../images/Code.png';
import MapsLogo from '../images/logomaps.png';
import OSMLogo from '../images/OSMLogo.png';
import SateliteLogo from '../images/satelite2.png';
import GMapsLogo from '../images/GoogleMaps.png';
import CartoLogo from '../images/CartoLogo.png';
import CartoLogoGs from '../images/carto_gs.png';
import LoadingLogo from '../images/loading1.gif';
import DirectLogo from '../images/direct.png';
import InputLogo from '../images/input.png';

// import logo for controlBar
import controlPolygon from '../images/polygonremove.png';
import controlPolyline from '../images/polylineremove.png';
import controlCircle from '../images/circleremove.png';
import controlPoint from '../images/pointremove.png';

import { UnControlled as CodeMirror } from 'react-codemirror2';
import swal from 'sweetalert';
import ReactSnackBar from 'react-js-snackbar';
import { AiFillCheckCircle } from 'react-icons/ai';

// Start Openlayers imports
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource, XYZ as XYZSource } from 'ol/source';
import {
  ScaleLine,
  OverviewMap,
  defaults as DefaultControls,
} from 'ol/control';
import Draw from 'ol/interaction/Draw';
import {
  Modify,
  Select,
  defaults as defaultInteractions,
} from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Geocoder from 'ol-geocoder';
import OSM from 'ol/source/OSM';

var map;
var draw;

var layer = new TileLayer({
  source: new OSM(),
});

var mapView = new View({
  projection: 'EPSG:4326',
  center: [117.50976562500001, -2.5040852618529215],
  zoom: 5,
  maxZoom: 22,
});

var select = new Select({
  wrapX: false,
});
var modify = new Modify({
  features: select.getFeatures(),
});

var image = new CircleStyle({
  radius: 5,
  fill: null,
  stroke: new Stroke({ color: 'red', width: 1 }),
});

var styles = {
  Point: new Style({
    image: image,
  }),
  LineString: new Style({
    stroke: new Stroke({
      color: 'green',
      width: 1,
    }),
  }),
  MultiLineString: new Style({
    stroke: new Stroke({
      color: 'green',
      width: 1,
    }),
  }),
  MultiPoint: new Style({
    image: image,
  }),
  MultiPolygon: new Style({
    stroke: new Stroke({
      color: 'grey',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 0, 0.1)',
    }),
  }),
  Polygon: new Style({
    stroke: new Stroke({
      color: 'blue',
      // lineDash: [4],
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    }),
  }),
  GeometryCollection: new Style({
    stroke: new Stroke({
      color: 'magenta',
      width: 2,
    }),
    fill: new Fill({
      color: 'magenta',
    }),
    image: new CircleStyle({
      radius: 10,
      fill: null,
      stroke: new Stroke({
        color: 'magenta',
      }),
    }),
  }),
  Circle: new Style({
    stroke: new Stroke({
      color: 'red',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(255,0,0,0.2)',
    }),
  }),
};

var styleFunction = function (feature) {
  return styles[feature.getGeometry().getType()];
};

var features;

var vectorSource = new VectorSource({
  features: features,
});

var vector = new VectorLayer({
  source: vectorSource,
  style: styleFunction,
});

class Home extends Component {
  state = {
    inputLat: -2.5040852618529215,
    inputLong: 117.50976562500001,
    inputZoom: 5,
    continuousId: 1,
    geojsonListFeature: [],
    geojsonfile: {
      type: 'FeatureCollection',
      features: [],
    },
    openDownloadGeojson: false,
    openDownloadGeoTiff: false,
    namaFileGeojson: '',
    namaFileGeoTiff: '',
    listLatLngPolygon: [],
    listLatLngLineString: [],
    dataImportGeojson: [],
    updateGeojson: false,
    mapTileLayer: 'osm',
    openModalGeojson: false,
    openModalMaps: false,
    openModalInputProcess: false,
    imageProcessing: false,
    showSnakeBar: false,
    show: false,
    showing: false,
    directProcess: true,
    inputBase64: '',
    namaFilePng: '',
    inputCenterJson: {},
    namaFileJson: '',
    mapCenter: {},
    onDrawing: 'None',
  };

  componentDidMount = async () => {
    map = await new Map({
      //  Display the map in the div with the id of map
      target: 'mapContainer',
      interactions: defaultInteractions().extend([select, modify]),
      layers: [layer, vector],
      // Add in the following map controls
      controls: DefaultControls().extend([new ScaleLine(), new OverviewMap()]),
      // Render the tile layers in a map view with a Mercator projection
      view: mapView,
    });

    await map.on('moveend', this.onMoveEnd);

    // Fitur Box Search location
    var geocoder = await new Geocoder('nominatim', {
      provider: 'osm',
      lang: 'id',
      placeholder: 'Search for ...',
      limit: 5,
      debug: false,
      autoComplete: true,
      keepOpen: true,
    });
    await map.addControl(geocoder);

    geocoder.on('addresschosen', function (evt) {
      var myView = new View({
        projection: 'EPSG:4326',
        center: [evt.coordinate[0], evt.coordinate[1]],
        zoom: 12,
        maxZoom: 22,
      });
      map.setView(myView);
      geocoder.getSource().clear();
    });

    var a = await document.getElementById('controlSearch');
    var htmlObject = await document.getElementById('gcd-container');
    await a.appendChild(htmlObject);

    // Fitur Edit Polygon
    var newThis = await this;
    await modify.on('modifyend', async function (e) {
      var writer = await new GeoJSON();
      var updatedGeoJSON = await [];

      for (let k = 0; k < vectorSource.getFeatures().length; k++) {
        var arrayCurrentFeature = await JSON.parse(
          writer.writeFeatures([vectorSource.getFeatures()[k]])
        );
        if (
          arrayCurrentFeature.features[0].geometry.type !== 'GeometryCollection'
        ) {
          var updatedFeature = await {
            type: arrayCurrentFeature.features[0].type,
            properties: {},
            geometry: {
              type: arrayCurrentFeature.features[0].geometry.type,
              coordinates: arrayCurrentFeature.features[0].geometry.coordinates,
            },
          };
          await updatedGeoJSON.push(updatedFeature);
        }
      }

      await newThis.setState({
        geojsonfile: {
          type: 'FeatureCollection',
          features: updatedGeoJSON,
        },
      });
    });
  };

  onMoveEnd = (evt) => {
    var map = evt.map;
    var myView = new View({
      projection: 'EPSG:4326',
      center: [map.getView().getCenter()[0], map.getView().getCenter()[1]],
      zoom: Math.floor(map.getView().getZoom()),
      maxZoom: 22,
    });
    map.setView(myView);

    var extent = map.getView().calculateExtent(map.getSize());
    var mapCenterInfo = {
      map_type: this.state.mapTileLayer,
      latitude_min: extent[3],
      latitude_max: extent[1],
      longitude_min: extent[0],
      longitude_max: extent[2],
      zoom: map.getView().getZoom(),
      center: {
        latitude: map.getView().getCenter()[1],
        longitude: map.getView().getCenter()[0],
      },
    };
    this.setState({
      mapCenter: mapCenterInfo,
      inputLat: map.getView().getCenter()[1],
      inputLong: map.getView().getCenter()[0],
      inputZoom: map.getView().getZoom(),
    });
  };

  // Fungsi untuk mendapatkan data inputan latitude dan longitude
  changeInputLatLong = async (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  // Fungsi untuk mendapatkan data inputan zoom level
  changeInputZoom = async (e) => {
    await this.setState({
      [e.target.name]: e.target.value,
    });
  };

  // Fungsi untuk redirect map ke LatLong yang diinginkan
  handleSubmit = (event) => {
    event.preventDefault();
    if (this.state.inputZoom > 22 || this.state.inputZoom < 0) {
      swal('Error!', 'input zoom level hanya dalam interval 0-22', 'warning');
    } else {
      var myView = new View({
        projection: 'EPSG:4326',
        center: [this.state.inputLong, this.state.inputLat],
        zoom: this.state.inputZoom,
        maxZoom: 22,
      });
      map.setView(myView);
    }
  };

  // Fungsi untuk mengganti tile layer menjadi OSM
  handleChangeLayerOSM = (e) => {
    var newLayer = new OSM();
    layer.setSource(newLayer);
    this.setState({
      mapTileLayer: 'osm',
    });
  };

  // Fungsi untuk mengganti tile layer menjadi Google Maps
  handleChangeLayerGMaps = async (e) => {
    var newLayer = new XYZSource({
      url: 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&s=Ga',
      crossOrigin: 'anonymous',
      maxZoom: 22,
    });
    layer.setSource(newLayer);
    this.setState({
      mapTileLayer: 'google',
    });
  };

  // Fungsi untuk mengganti tile layer menjadi Satelite
  handleChangeLayerSatelite = (e) => {
    var newLayer = new XYZSource({
      url:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
      crossOrigin: 'anonymous',
      maxZoom: 22,
    });
    layer.setSource(newLayer);
    this.setState({
      mapTileLayer: 'satellite',
    });
  };

  // Fungsi untuk mengganti tile layer menjadi Carto
  handleChangeLayerCarto = async (e) => {
    var newLayer = new XYZSource({
      url:
        'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      crossOrigin: 'anonymous',
      maxZoom: 22,
    });
    layer.setSource(newLayer);
    this.setState({
      mapTileLayer: 'carto',
    });
  };

  // Fungsi untuk mengganti tile layer menjadi Carto (GrayScale)
  handleChangeLayerCartoGs = async (e) => {
    var newLayer = new XYZSource({
      url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      crossOrigin: 'anonymous',
      maxZoom: 22,
    });
    layer.setSource(newLayer);
    this.setState({
      mapTileLayer: 'carto_gs',
    });
  };

  // Fungsi untuk mengimport data geojson ke map
  handleImportGeojson = async (event) => {
    var input, file, fr;

    input = await document.getElementById('importGeojsonDrop');

    file = await input.files[0];
    fr = await new FileReader();
    fr.onload = await this.receivedText;
    await fr.readAsText(file);
  };

  // Bagian dari fungsi untuk mengimport data geojson ke map
  receivedText = async (e) => {
    let lines = await e.target.result; // type = String
    var newArr = await JSON.parse(lines); // convert string to JSON

    await this.setState({
      dataImportGeojson: newArr,
      geojsonfile: newArr,
    });

    var newFeatures = await new GeoJSON().readFeatures(newArr, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326',
    });

    for (let h = 0; h < newFeatures.length; h++) {
      await vectorSource.addFeature(newFeatures[h]);
    }

    var pointDistance;
    var zoomCenter;

    // Fungsi untuk redirect center map ke salah satu koordinat pada geojson
    if (newArr.features[0].geometry.type === 'MultiPolygon') {
      await this.setState({
        inputLat: newArr.features[0].geometry.coordinates[0][0][0][1],
        inputLong: newArr.features[0].geometry.coordinates[0][0][0][0],
      });
      pointDistance = Math.abs(
        newArr.features[0].geometry.coordinates[0][0][0][1] -
          newArr.features[0].geometry.coordinates[0][0][1][1]
      );
    } else if (newArr.features[0].geometry.type === 'Polygon') {
      await this.setState({
        inputLat: newArr.features[0].geometry.coordinates[0][0][1],
        inputLong: newArr.features[0].geometry.coordinates[0][0][0],
      });
      pointDistance = Math.abs(
        newArr.features[0].geometry.coordinates[0][0][1] -
          newArr.features[0].geometry.coordinates[0][1][1]
      );
    } else if (newArr.features[0].geometry.type === 'LineString') {
      await this.setState({
        inputLat: newArr.features[0].geometry.coordinates[0][1],
        inputLong: newArr.features[0].geometry.coordinates[0][0],
      });
      pointDistance = Math.abs(
        newArr.features[0].geometry.coordinates[0][1] -
          newArr.features[0].geometry.coordinates[1][1]
      );
    }

    if (pointDistance > 0.1) {
      zoomCenter = await 5;
    } else if (pointDistance > 0.01) {
      zoomCenter = await 10;
    } else {
      zoomCenter = await 17;
    }

    var myView = await new View({
      projection: 'EPSG:4326',
      center: [this.state.inputLong, this.state.inputLat],
      zoom: zoomCenter,

      maxZoom: 22,
    });
    await map.setView(myView);
  };

  handleDrawControl = async (value) => {
    map.removeInteraction(draw);
    if (value !== 'None') {
      var oldGeojson = this.state.geojsonfile.features;
      var newthis = this;
      draw = new Draw({
        source: vectorSource,
        type: value,
      });
      draw.on('drawend', async function (e) {
        if (value !== 'Circle') {
          var writer = await new GeoJSON();
          //pass the feature as an array
          var geojsonStr = await writer.writeFeatures([e.feature]);
          await console.log('ondraw end', vectorSource.getFeatures());
          var newFeature = await {
            type: JSON.parse(geojsonStr).features[0].type,
            properties: {},
            geometry: {
              type: JSON.parse(geojsonStr).features[0].geometry.type,
              coordinates: JSON.parse(geojsonStr).features[0].geometry
                .coordinates,
            },
          };

          await oldGeojson.push(newFeature);
          await newthis.setState({
            geojsonfile: {
              type: 'FeatureCollection',
              features: oldGeojson,
            },
          });
        }
      });
      map.addInteraction(draw);
      this.setState({
        onDrawing: value,
      });
    }
  };

  handleCancelDraw = () => {
    map.removeInteraction(draw);
    this.setState({
      onDrawing: this.state.onDrawing + 'Dis',
    });
    setTimeout(() => {
      this.setState({ onDrawing: 'None' });
    }, 2000);
  };

  // Fungsi untuk mengeluarkan alert input nama file
  handleFailedDownload = (event) => {
    swal('Error!', 'Mohon isi nama file terlebih dahulu!', 'warning');
  };

  // Fungsi untuk menutup modal export GeoJSON/Maps
  closeModal = () => {
    this.setState({
      openModalGeojson: false,
      openModalMaps: false,
      openModalInputProcess: false,
    });
  };

  // Fungsi untuk mengeluarkan modal export Maps
  showModalMaps = async () => {
    var myView = await new View({
      projection: 'EPSG:4326',
      center: [this.state.inputLong, this.state.inputLat],
      zoom: Math.floor(this.state.inputZoom),

      maxZoom: 22,
    });
    await map.setView(myView);
    await this.setState({ openModalMaps: true });
  };

  // Fungsi untuk mendapatkan data inputan nama file GeoTiff
  changeNamaGeoTiff = async (event) => {
    await this.setState({
      namaFileGeoTiff: event.target.value,
    });
  };

  // Fungsi untuk mendownload file GeoTiff
  handleDownloadGeoTiff = async () => {
    var namaFile = this.state.namaFileGeoTiff;
    map.once('rendercomplete', function () {
      var mapCanvas = document.createElement('canvas');
      var size = map.getSize();
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      var mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        document.querySelectorAll('.ol-layer canvas'),
        function (canvas) {
          if (canvas.width > 0) {
            var opacity = canvas.parentNode.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            var transform = canvas.style.transform;
            // Get the transform parameters from the style's transform matrix
            var matrix = transform
              .match(/^matrix\(([^(]*)\)$/)[1]
              .split(',')
              .map(Number);
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(
              mapContext,
              matrix
            );
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );
      if (navigator.msSaveBlob) {
        // link download attribuute does not work on MS browsers
        navigator.msSaveBlob(mapCanvas.msToBlob(), 'map.png');
      } else {
        var a = document.createElement('a'); //Create <a>
        a.href = mapCanvas.toDataURL(); //Image Base64 Goes here
        a.download = namaFile + '.png'; //File name Here
        a.click(); //Downloaded file
      }
    });
    map.renderSync();

    // Fungsi untuk download map center info dalam format json
    const json = await JSON.stringify(this.state.mapCenter, null, '  ');
    const blob = await new Blob([json], {
      type: 'application/json',
    });
    const href = await URL.createObjectURL(blob);
    const linkJson = await document.createElement('a');
    linkJson.href = href;
    linkJson.download = this.state.namaFileGeoTiff + '.json';
    document.body.appendChild(linkJson);
    linkJson.click();
    document.body.removeChild(linkJson);

    await this.setState({
      openModalMaps: false,
    });
  };

  // Fungsi untuk melakukan Direct Image Processing
  handleImageProcess = async () => {
    await this.setState({
      imageProcessing: true,
    });

    var base64Image = await '';

    var mapCanvas = document.createElement('canvas');
    var size = map.getSize();
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];
    var mapContext = mapCanvas.getContext('2d');
    Array.prototype.forEach.call(
      document.querySelectorAll('.ol-layer canvas'),
      function (canvas) {
        if (canvas.width > 0) {
          var opacity = canvas.parentNode.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          var transform = canvas.style.transform;
          // Get the transform parameters from the style's transform matrix
          var matrix = transform
            .match(/^matrix\(([^(]*)\)$/)[1]
            .split(',')
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix
          );
          mapContext.drawImage(canvas, 0, 0);
        }
      }
    );
    if (navigator.msSaveBlob) {
      // link download attribuute does not work on MS browsers
      navigator.msSaveBlob(mapCanvas.msToBlob(), 'map.png');
    } else {
      base64Image = mapCanvas.toDataURL();
    }

    await axios
      .post(
        'https://nisaetus-api.sumpahpalapa.com/api/v1/geo/building-locator',
        {
          map_type: this.state.mapCenter.map_type,
          image_base64: base64Image,
          coordinates: {
            latitude_min: this.state.mapCenter.latitude_min,
            latitude_max: this.state.mapCenter.latitude_max,
            longitude_min: this.state.mapCenter.longitude_min,
            longitude_max: this.state.mapCenter.longitude_max,
            zoom: this.state.mapCenter.zoom,
            center: {
              latitude: this.state.mapCenter.center.latitude,
              longitude: this.state.mapCenter.center.longitude,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(async (response) => {
        var newListFeature = await this.state.geojsonfile.features;

        var newFeatures = await new GeoJSON().readFeatures(response.data.data, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326',
        });

        for (let h = 0; h < newFeatures.length; h++) {
          await vectorSource.addFeature(newFeatures[h]);
        }

        for (let j = 0; j < response.data.data.features.length; j++) {
          await newListFeature.push(response.data.data.features[j]);
        }

        await this.setState({
          dataImportGeojson: response.data.data,
          geojsonfile: {
            type: 'FeatureCollection',
            features: newListFeature,
          },
          updateGeojson: true,
          imageProcessing: false,
          showSnakeBar: true,
        });

        await setTimeout(() => {
          this.setState({ showSnakeBar: false });
        }, 2000);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Fungsi untuk mengeluarkan modal export GeoJSON
  showModalGeo = () => {
    this.setState({ openModalGeojson: true });
  };

  // Fungsi untuk mendapatkan data inputan nama file geojson
  changeNamaGeojson = async (event) => {
    await this.setState({
      namaFileGeojson: event.target.value,
    });
  };

  // Fungsi untuk mendownload file geojson
  handleDownloadGeo = async (event) => {
    const fileName = await this.state.namaFileGeojson;
    const json = await JSON.stringify(this.state.geojsonfile, null, '  ');
    const blob = await new Blob([json], {
      type: 'application/json',
    });
    const href = await URL.createObjectURL(blob);
    const link = await document.createElement('a');
    link.href = href;
    link.download = fileName + '.geojson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await this.setState({ openModalGeojson: false });
  };

  // Fungsi untuk mengeluarkan modal Image Processing with input
  showModalInputProcess = () => {
    this.setState({ openModalInputProcess: true });
  };

  // Fungsi untuk input map Image (PNG)
  getInputMapImage = async () => {
    var input, file, fr;

    input = await document.getElementById('inputMap');

    file = await input.files[0];

    await this.setState({
      namaFilePng: file.name,
    });

    fr = await new FileReader();
    await fr.readAsDataURL(file);
    fr.onload = await this.receivedMap;
  };

  // Bagian dari fungsi untuk input data map image (PNG)
  receivedMap = async (e) => {
    await this.setState({
      inputBase64: e.target.result,
    });
  };

  // Fungsi untuk mereset input center map image (PNG)
  handleResetInputMap = async () => {
    await this.setState({
      namaFilePng: '',
      inputBase64: '',
    });
  };

  // Fungsi untuk input data map center (JSON)
  getInputMapJson = async () => {
    var input, file, fr;

    input = await document.getElementById('inputMapDetails');

    file = await input.files[0];

    await this.setState({
      namaFileJson: file.name,
    });

    fr = await new FileReader();
    fr.onload = await this.receivedJson;
    await fr.readAsText(file);
  };

  // Bagian dari fungsi untuk input data map center (JSON)
  receivedJson = async (e) => {
    let lines = await e.target.result; // type = String
    var newArr = await JSON.parse(lines); // convert string to JSON

    var myView = await new View({
      projection: 'EPSG:4326',
      center: [newArr.center.longitude, newArr.center.latitude],
      zoom: newArr.zoom,

      maxZoom: 22,
    });
    await map.setView(myView);

    await this.setState({
      inputCenterJson: newArr,
      mapTileLayer: newArr.map_type,
    });

    var newLayer;

    if (this.state.mapTileLayer === 'osm') {
      newLayer = new XYZSource({
        url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        crossOrigin: 'anonymous',
      });
      layer.setSource(newLayer);
      this.setState({
        mapTileLayer: 'osm',
      });
    } else if (this.state.mapTileLayer === 'satellite') {
      newLayer = new XYZSource({
        url:
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
        crossOrigin: 'anonymous',
      });
      layer.setSource(newLayer);
      this.setState({
        mapTileLayer: 'satellite',
      });
    } else if (this.state.mapTileLayer === 'google') {
      newLayer = new XYZSource({
        url: 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&s=Ga',
        crossOrigin: 'anonymous',
      });
      layer.setSource(newLayer);
      this.setState({
        mapTileLayer: 'google',
      });
    } else if (this.state.mapTileLayer === 'carto') {
      newLayer = new XYZSource({
        url:
          'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
        crossOrigin: 'anonymous',
      });
      layer.setSource(newLayer);
      this.setState({
        mapTileLayer: 'carto',
      });
    } else if (this.state.mapTileLayer === 'carto_gs') {
      newLayer = new XYZSource({
        url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        crossOrigin: 'anonymous',
      });
      layer.setSource(newLayer);
      this.setState({
        mapTileLayer: 'carto_gs',
      });
    }
  };

  // Fungsi untuk mereset input center map (JSON)
  handleResetInputJson = async () => {
    await this.setState({
      namaFileJson: '',
      inputCenterJson: {},
    });
  };

  // Fungsi untuk melakukan Image Processing with input
  handleProcessInput = async () => {
    this.setState({
      imageProcessing: true,
    });

    await axios
      .post(
        'https://nisaetus-api.sumpahpalapa.com/api/v1/geo/building-locator',
        {
          map_type: this.state.inputCenterJson.map_type,
          image_base64: this.state.inputBase64,
          coordinates: {
            latitude_min: this.state.inputCenterJson.latitude_min,
            latitude_max: this.state.inputCenterJson.latitude_max,
            longitude_min: this.state.inputCenterJson.longitude_min,
            longitude_max: this.state.inputCenterJson.longitude_max,
            zoom: this.state.inputCenterJson.zoom,
            center: {
              latitude: this.state.inputCenterJson.center.latitude,
              longitude: this.state.inputCenterJson.center.longitude,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(async (response) => {
        var newListFeature = await this.state.geojsonfile.features;

        var newFeatures = await new GeoJSON().readFeatures(response.data.data, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326',
        });

        for (let h = 0; h < newFeatures.length; h++) {
          await vectorSource.addFeature(newFeatures[h]);
        }

        for (let j = 0; j < response.data.data.features.length; j++) {
          await newListFeature.push(response.data.data.features[j]);
        }

        await this.setState({
          dataImportGeojson: response.data.data,
          geojsonfile: {
            type: 'FeatureCollection',
            features: newListFeature,
          },
          updateGeojson: true,
          imageProcessing: false,
          showSnakeBar: true,
          openModalInputProcess: false,
        });

        await setTimeout(() => {
          this.setState({ showSnakeBar: false });
        }, 2000);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    const codeString = JSON.stringify(this.state.geojsonfile, null, '  ');
    return (
      <Grid>
        <Grid.Row className='containerRowHome' columns={2}>
          <Grid.Column className='colMaps' width={12}>
            <div className='checkSnackBar'>
              <ReactSnackBar
                Icon={<AiFillCheckCircle />}
                Show={this.state.showSnakeBar}
              >
                Image Processing Success!
              </ReactSnackBar>
            </div>
            <div className='divNavbar'>
              <Navbar expand='lg'>
                <Navbar.Brand className='TitleNavbar' href='#home'>
                  Spartech-Nisaetus
                </Navbar.Brand>
                <Navbar.Toggle aria-controls='basic-navbar-nav' />
                <Navbar.Collapse id='basic-navbar-nav'>
                  <Nav className='justify-content-end'>
                    {/* Import */}
                    <div className='dropdown'>
                      <span
                        className='btn dropdown-toggle dropdown-navbar'
                        role='button'
                        id='dropdownMenuLink'
                        data-toggle='dropdown'
                      >
                        Import
                      </span>
                      <div
                        className='dropdown-menu dropdownMenu'
                        aria-labelledby='dropdownMenuLink'
                      >
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <div className='dropdown-item dropdownImport'>
                            <div id='divImportGeojsonDrop'>
                              <Button
                                as='label'
                                htmlFor='importGeojsonDrop'
                                className='buttonImportGeojsonDrop'
                                type='button'
                              >
                                <img
                                  src={CodeLogo}
                                  width='25px'
                                  height='25px'
                                  alt=''
                                  style={{
                                    marginRight: '15px',
                                    marginLeft: '0px',
                                  }}
                                />
                                GeoJSON
                              </Button>
                              <Input
                                type='file'
                                ref={this.fileInputRef}
                                id='importGeojsonDrop'
                                name='importGeojsonDrop'
                                accept='.geojson, .json'
                                hidden
                                onChange={this.handleImportGeojson}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Export */}
                    <div className='dropdown'>
                      <span
                        className='btn dropdown-toggle dropdown-navbar'
                        role='button'
                        id='dropdownMenuLink'
                        data-toggle='dropdown'
                      >
                        Export
                      </span>
                      <div
                        className='dropdown-menu dropdownMenu'
                        aria-labelledby='dropdownMenuLink'
                      >
                        {/* Export GeoJSON */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <div className='dropdown-item dropdownExport'>
                            <div id='divExportGeojsonDrop'>
                              <Button
                                className='buttonExport'
                                onClick={this.showModalGeo}
                              >
                                <img
                                  src={CodeLogo}
                                  width='25px'
                                  height='25px'
                                  alt=''
                                  style={{
                                    marginRight: '15px',
                                    marginLeft: '0px',
                                  }}
                                />
                                GeoJSON
                              </Button>
                              <Modal
                                size='tiny'
                                open={this.state.openModalGeojson}
                                onClose={this.closeModal}
                              >
                                <Modal.Header>Export File GeoJSON</Modal.Header>
                                <Modal.Content>
                                  <div
                                    style={{
                                      display: 'flex',
                                      margin: 'auto 20%',
                                    }}
                                  >
                                    <p style={{ margin: 'auto 10px' }}>
                                      Nama File :
                                    </p>
                                    <Input
                                      className='downloadGeoDrop'
                                      name='downloadGeo'
                                      value={this.state.namaFileGeojson}
                                      placeholder='Input nama'
                                      onChange={(e) =>
                                        this.changeNamaGeojson(e)
                                      }
                                    />
                                  </div>
                                </Modal.Content>
                                <Modal.Actions>
                                  <Button onClick={this.closeModal} negative>
                                    Batal
                                  </Button>
                                  {this.state.namaFileGeojson === '' ? (
                                    <Button
                                      positive
                                      icon='checkmark'
                                      labelPosition='right'
                                      content='Simpan'
                                      onClick={this.handleFailedDownload}
                                    />
                                  ) : (
                                    <Button
                                      positive
                                      icon='checkmark'
                                      labelPosition='right'
                                      content='Simpan'
                                      onClick={this.handleDownloadGeo}
                                    />
                                  )}
                                </Modal.Actions>
                              </Modal>
                            </div>
                          </div>
                        </div>
                        {/* Export Map */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <div className='dropdown-item dropdownExport'>
                            <div id='divExportGeotiffDrop'>
                              <Button
                                className='buttonExport'
                                onClick={this.showModalMaps}
                              >
                                <img
                                  src={MapsLogo}
                                  width='25px'
                                  height='25px'
                                  alt=''
                                  style={{
                                    marginRight: '15px',
                                    marginLeft: '0px',
                                  }}
                                />
                                Maps
                              </Button>
                              <Modal
                                size='tiny'
                                open={this.state.openModalMaps}
                                onClose={this.closeModal}
                              >
                                <Modal.Header>Export Gambar Map</Modal.Header>
                                <Modal.Content>
                                  <div
                                    style={{
                                      display: 'flex',
                                      margin: 'auto 20%',
                                    }}
                                  >
                                    <p style={{ margin: 'auto 10px' }}>
                                      Nama File :
                                    </p>
                                    <Input
                                      className='downloadTiffDrop'
                                      name='downloadTiff'
                                      value={this.state.namaFileGeoTiff}
                                      placeholder='Input nama'
                                      onChange={(e) =>
                                        this.changeNamaGeoTiff(e)
                                      }
                                    />
                                  </div>
                                </Modal.Content>
                                <Modal.Actions>
                                  <Button onClick={this.closeModal} negative>
                                    Batal
                                  </Button>
                                  {this.state.namaFileGeoTiff === '' ? (
                                    <Button
                                      positive
                                      icon='checkmark'
                                      labelPosition='right'
                                      content='Simpan'
                                      onClick={this.handleFailedDownload}
                                    />
                                  ) : (
                                    <Button
                                      positive
                                      icon='checkmark'
                                      labelPosition='right'
                                      content='Simpan'
                                      onClick={this.handleDownloadGeoTiff}
                                    />
                                  )}
                                </Modal.Actions>
                              </Modal>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Tile Layer */}
                    <div className='dropdown'>
                      <span
                        className='btn dropdown-toggle dropdown-navbar'
                        role='button'
                        id='dropdownMenuLink'
                        data-toggle='dropdown'
                      >
                        Tile Layer
                      </span>
                      <div
                        className='dropdown-menu dropdownMenu'
                        aria-labelledby='dropdownMenuLink'
                      >
                        {/* OSM Tile Layer */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <span
                            className={
                              this.state.mapTileLayer === 'osm'
                                ? 'dropdown-item active'
                                : 'dropdown-item'
                            }
                            value='OSM'
                            onClick={this.handleChangeLayerOSM}
                          >
                            <img
                              src={OSMLogo}
                              width='25px'
                              height='25px'
                              alt=''
                              style={{ marginRight: '15px', marginLeft: '0px' }}
                            />
                            OSM
                          </span>
                        </div>
                        {/* Google Maps Tile Layer */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <span
                            className={
                              this.state.mapTileLayer === 'google'
                                ? 'dropdown-item active'
                                : 'dropdown-item'
                            }
                            onClick={this.handleChangeLayerGMaps}
                          >
                            <img
                              src={GMapsLogo}
                              width='25px'
                              height='25px'
                              alt=''
                              style={{ marginRight: '15px', marginLeft: '0px' }}
                            />
                            Google Maps
                          </span>
                        </div>
                        {/* Satelite (GIS) Tile Layer */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <span
                            className={
                              this.state.mapTileLayer === 'satellite'
                                ? 'dropdown-item active'
                                : 'dropdown-item'
                            }
                            onClick={this.handleChangeLayerSatelite}
                          >
                            <img
                              src={SateliteLogo}
                              width='25px'
                              height='25px'
                              alt=''
                              style={{ marginRight: '15px', marginLeft: '0px' }}
                            />
                            Satelite
                          </span>
                        </div>
                        {/* Carto Tile Layer */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <span
                            className={
                              this.state.mapTileLayer === 'carto'
                                ? 'dropdown-item active'
                                : 'dropdown-item'
                            }
                            onClick={this.handleChangeLayerCarto}
                          >
                            <img
                              src={CartoLogo}
                              width='25px'
                              height='25px'
                              alt=''
                              style={{ marginRight: '15px', marginLeft: '0px' }}
                            />
                            Carto
                          </span>
                        </div>
                        {/* Carto Tile Layer (GrayScale) */}
                        <div style={{ display: 'flex', padding: '0px' }}>
                          <span
                            className={
                              this.state.mapTileLayer === 'carto_gs'
                                ? 'dropdown-item active'
                                : 'dropdown-item'
                            }
                            onClick={this.handleChangeLayerCartoGs}
                          >
                            <img
                              src={CartoLogoGs}
                              width='25px'
                              height='25px'
                              alt=''
                              style={{ marginRight: '15px', marginLeft: '0px' }}
                            />
                            Carto (GrayScale)
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Button Image Processing */}
                    <div className='buttonProcess'>
                      {this.state.imageProcessing ? (
                        <ReactButton
                          className='buttonLoadingProcess'
                          variant='outline-secondary'
                        >
                          <img
                            src={LoadingLogo}
                            width='25px'
                            height='25px'
                            alt=''
                          />
                        </ReactButton>
                      ) : (
                        <div className='dropdown'>
                          <span
                            className='btn dropdown-toggle dropdown-navbar dropdownSetting'
                            role='button'
                            id='dropdownMenuLink'
                            data-toggle='dropdown'
                          >
                            <ReactButton
                              className='buttonImageProcess'
                              variant='outline-secondary'
                            >
                              Process
                            </ReactButton>
                          </span>
                          <div
                            className='dropdown-menu dropdownMenu dropdownSettingMenu'
                            aria-labelledby='dropdownMenuLink'
                          >
                            {/* Direct Process Mode */}
                            <div style={{ display: 'flex', padding: '0px' }}>
                              <span
                                className='dropdown-item dropdownItemDirect'
                                onClick={this.handleImageProcess}
                              >
                                <img
                                  src={DirectLogo}
                                  width='40px'
                                  height='40px'
                                  alt=''
                                  style={{
                                    marginRight: '6px',
                                    marginLeft: '0px',
                                  }}
                                />
                                Direct Process
                              </span>
                            </div>
                            {/* Input Process Mode */}
                            <div style={{ display: 'flex', padding: '0px' }}>
                              <span
                                className='dropdown-item'
                                onClick={this.showModalInputProcess}
                              >
                                <img
                                  src={InputLogo}
                                  width='25px'
                                  height='25px'
                                  alt=''
                                  style={{
                                    marginRight: '15px',
                                    marginLeft: '0px',
                                  }}
                                />
                                Input Process
                              </span>
                              <Modal
                                size='tiny'
                                open={this.state.openModalInputProcess}
                                onClose={this.closeModal}
                              >
                                <Modal.Header>
                                  Image Processing with Input
                                </Modal.Header>
                                <Modal.Content>
                                  <div
                                    style={{
                                      display: 'flex',
                                      margin: 'auto 20%',
                                    }}
                                  >
                                    <p style={{ margin: 'auto 10px' }}>
                                      Map Image (PNG) :
                                    </p>
                                    <div id='divInputMap'>
                                      <Input
                                        type='file'
                                        ref={this.fileInputRef}
                                        id='inputMap'
                                        name='inputMap'
                                        accept='.png'
                                        hidden
                                        onChange={this.getInputMapImage}
                                      />

                                      {this.state.inputBase64 !== '' ? (
                                        <span
                                          style={{
                                            marginLeft: '0px',
                                            marginBottom: '0px',
                                          }}
                                        >
                                          {this.state.namaFilePng}
                                          <Icon
                                            name='refresh'
                                            color='red'
                                            style={{
                                              cursor: 'pointer',
                                              position: 'absolute',
                                              right: '15%',
                                            }}
                                            onClick={this.handleResetInputMap}
                                          />
                                        </span>
                                      ) : (
                                        <Button
                                          icon='image'
                                          content='Pilih File'
                                          labelPosition='left'
                                          as='label'
                                          htmlFor='inputMap'
                                          className='buttonInputMap'
                                          type='button'
                                        ></Button>
                                      )}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      margin: '5% 5% 0% 17.5%',
                                    }}
                                  >
                                    <p style={{ margin: 'auto 10px' }}>
                                      Map Center (JSON) :
                                    </p>
                                    <div id='divInputMapDetails'>
                                      <Input
                                        type='file'
                                        ref={this.fileInputRef}
                                        id='inputMapDetails'
                                        name='inputMapDetails'
                                        accept='.json'
                                        hidden
                                        onChange={this.getInputMapJson}
                                      />
                                      {this.state.namaFileJson !== '' ? (
                                        <span
                                          style={{
                                            marginLeft: '0px',
                                            marginBottom: '0px',
                                          }}
                                        >
                                          {this.state.namaFileJson}
                                          <Icon
                                            name='refresh'
                                            color='red'
                                            style={{
                                              cursor: 'pointer',
                                              position: 'absolute',
                                              right: '15%',
                                            }}
                                            onClick={this.handleResetInputJson}
                                          />
                                        </span>
                                      ) : (
                                        <Button
                                          icon='code'
                                          content='Pilih File'
                                          labelPosition='left'
                                          as='label'
                                          htmlFor='inputMapDetails'
                                          className='buttonInputMapDetails'
                                          type='button'
                                        ></Button>
                                      )}
                                    </div>
                                  </div>
                                </Modal.Content>
                                <Modal.Actions>
                                  <Button onClick={this.closeModal} negative>
                                    Batal
                                  </Button>
                                  {this.state.inputBase64 === '' ? (
                                    <Button
                                      positive
                                      icon='checkmark'
                                      labelPosition='right'
                                      content='Proses'
                                      onClick={this.handleFailedDownloadFile}
                                    />
                                  ) : (
                                    <Button
                                      positive
                                      icon='checkmark'
                                      labelPosition='right'
                                      content='Proses'
                                      onClick={this.handleProcessInput}
                                    />
                                  )}
                                </Modal.Actions>
                              </Modal>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Nav>
                </Navbar.Collapse>
              </Navbar>
            </div>
            <div className='divMaps'>
              <div id='mapContainer'></div>
              {/* Form untuk mengganti latitude maps */}{' '}
              <Form className='formInputLat' onSubmit={this.handleSubmit}>
                <Form.Group>
                  <Form.Field>
                    <Input
                      className='inputLat'
                      label='Lat'
                      name='inputLat'
                      // value={this.state.inputLat}
                      value={this.state.inputLat}
                      onChange={(e) => this.changeInputLatLong(e)}
                    />{' '}
                  </Form.Field>{' '}
                </Form.Group>{' '}
              </Form>
              {/* Form untuk mengganti longitude maps */}{' '}
              <Form className='formInputLong' onSubmit={this.handleSubmit}>
                <Form.Group>
                  <Form.Field>
                    <Input
                      className='inputLong'
                      label='Long'
                      name='inputLong'
                      // value={this.state.inputLong}
                      value={this.state.inputLong}
                      onChange={(e) => this.changeInputLatLong(e)}
                    />{' '}
                  </Form.Field>{' '}
                </Form.Group>{' '}
              </Form>
              {/* Form untuk mengganti Zoom level maps */}{' '}
              <Form className='formInputZoom' onSubmit={this.handleSubmit}>
                <Form.Group>
                  <Form.Field>
                    <Input
                      className='inputZoom'
                      action={{ icon: 'zoom-in' }}
                      actionPosition='left'
                      name='inputZoom'
                      value={this.state.inputZoom}
                      onChange={(e) => this.changeInputZoom(e)}
                    />{' '}
                  </Form.Field>{' '}
                </Form.Group>{' '}
              </Form>
              <div className='olControlBar'>
                <div
                  className='drawPolyline'
                  onClick={() => this.handleDrawControl('LineString')}
                  title='Draw a polyline'
                >
                  <img
                    src={controlPolyline}
                    width='30px'
                    height='30px'
                    alt=''
                  />
                </div>
                <div
                  className='drawPolygon'
                  onClick={() => this.handleDrawControl('Polygon')}
                  title='Draw a polygon'
                >
                  <img src={controlPolygon} width='30px' height='30px' alt='' />
                </div>
                <div
                  className='drawCircle'
                  onClick={() => this.handleDrawControl('Circle')}
                  title='Draw a circle'
                >
                  <img src={controlCircle} width='30px' height='30px' alt='' />
                </div>
                <div
                  className='drawPoint'
                  onClick={() => this.handleDrawControl('Point')}
                  title='Draw a point'
                >
                  <img src={controlPoint} width='30px' height='30px' alt='' />
                </div>
              </div>
              <div
                className={this.state.onDrawing}
                onClick={this.handleCancelDraw}
                title='cancel drawing'
              >
                <span className='cancelClick'>Cancel</span>
              </div>
              <div id='controlSearch'></div>
            </div>
          </Grid.Column>{' '}
          <Grid.Column className='colCode' width={4}>
            <CodeMirror
              className='codeDisplay'
              value={codeString}
              options={{
                mode: 'xml',
                theme: 'material',
                lineNumbers: true,
              }}
              onChange={(editor, data, value) => {}}
            />{' '}
          </Grid.Column>{' '}
        </Grid.Row>{' '}
      </Grid>
    );
  }
}

export default connect(
  'currentLat, currentLong, currentZoom, base64Image',
  actions
)(withRouter(Home));
