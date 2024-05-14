import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { GeoJSONSource } from 'mapbox-gl'
import './map.css';
import axios from 'axios'; 
import SearchBox from './component/SearchBox';

mapboxgl.accessToken = 'pk.eyJ1IjoiZXNwYWNlc2VydmljZSIsImEiOiJjbHZ1dHZjdTQwMDhrMm1uMnoxdWRibzQ4In0.NaprcMBbdX07f4eXXdr-lw';


const App = () => {
  
const [geoJsonData1, setGeoJsonData1] = useState(null);
const [geoJsonData2, setGeoJsonData2] = useState(null);
const [geoJsonData3, setGeoJsonData3] = useState(null);
const [ports, setPorts] = useState(null);
const [map, setMap] = useState(null); 
const [selectedOption, setSelectedOption] = useState(null); 


useEffect(() => {
    const fetchData = async () => {
        try {
            const response2 = await axios.get("https://cartographer-server.onrender.com/ports");
            const data2 = response2.data;
            setGeoJsonData3(data2[0]);
            setPorts(data2);
        } catch (error) {
            console.error(error);
        }
    };

    fetchData();
}, []);

useEffect(() => {
    if (!(geoJsonData1 || geoJsonData3 || ports) && !map) { 
        const newMap = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-96, 37.8],
            zoom: 3
        });

        setMap(newMap); 
    }
}, [geoJsonData1, geoJsonData3]);



useEffect(() => {
  if(geoJsonData1){
    if (selectedOption === 'ship') {
      if (map.getLayer('route_solid')) {
        map.removeLayer('route_solid');
      }
      if (map.getLayer('route_dashed')) {
        map.removeLayer('route_dashed');
      }
      if (map.getSource('route_solid')) {
        map.removeSource('route_solid');
      }
      if (map.getSource('route_dashed')) {
        map.removeSource('route_dashed');
      }
      map.addLayer({
          'id': 'route_solid',
          'type': 'line',
          'source': {
              'type': 'geojson',
              'data': geoJsonData1
          },
          'layout': {
              'line-join': 'round',
              'line-cap': 'round'
          },
          'paint': {
              'line-color': 'black',
              'line-width': 8
          }
      });
      map.addLayer({
          'id': 'route_dashed',
          'type': 'line',
          'source': {
              'type': 'geojson',
              'data': geoJsonData2
          },
          'layout': {
              'line-join': 'round',
              'line-cap': 'round'
          },
          'paint': {
              'line-color': 'red',
              'line-width': 8,
              'line-dasharray': [2, 2] // Setting a dash array for dotted lines
          }
      });
      const combinedCoordinates = [
        ...geoJsonData1.features[0].geometry.coordinates,
        ...geoJsonData2.features[0].geometry.coordinates
      ];
      const bounds = combinedCoordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds());

      map.fitBounds(bounds, { padding: 50 });
      }
  }
}, [geoJsonData1]);


// useEffect(() => {
//     if (ports && map) { 
//         ports.forEach((port) => {
//             const marker = new mapboxgl.Marker()
//             .setLngLat(port.geometry.coordinates) // Set marker position based on port coordinates
//             .setPopup(new mapboxgl.Popup({ offset: 25 }) // Add a popup with port name
//                 .setHTML(`<h3>${port.properties.port_name}</h3>`))
//             .addTo(map);
//         });
//     }
// }, [map, ports]);

const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
};


const handleSearch = async (query) => {
    try {
        let searchResult = null;
        let adjustedQuery = query;
  
        if (selectedOption === 'port') {
            adjustedQuery += ' port';
        } else if (selectedOption === 'ship') {
            adjustedQuery += ' ship';
        }
  
        const isShip = adjustedQuery.toLowerCase().includes('ship');
        const isPort = adjustedQuery.toLowerCase().includes('port');
  
        if (isShip) {
            const response = await axios.get(`https://cartographer-server.onrender.com/ships/${query}`);
            const data1 = response.data;
            setGeoJsonData1(data1.routes.last2Days);
            setGeoJsonData2(data1.routes.between2And7Days)        } else if (isPort) {
          console.log("enetered is port")
            const response = await axios.get(`https://cartographer-server.onrender.com/ports/${query}`);
            searchResult = response.data;
            console.log("searchResult: ", searchResult.geometry.coordinates);
        } else {
            console.log('Invalid search query. Please enter a ship or port name.');
            return;
        }
  
        if (searchResult && isPort) {
            const [longitude, latitude ] = searchResult.geometry.coordinates;
            map.flyTo({ center: [longitude, latitude], zoom: 10 });
            new mapboxgl.Marker().setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup({ offset: 25 }) // Add a popup with port name
            .setHTML(`<h3>${searchResult.properties.port_name}</h3>`))
            .addTo(map);
        } else {
            console.log('No search result found.');
        }
    } catch (error) {
        console.error('Error searching:', error);
    }
  };

return (
    <div className="App bg-dark" style={{height:"100vh",width:"100vw"}}>
        <nav className="navbar bg-body-tertiary" style={{zIndex:"2"}}>
        <div className="container-fluid" style={{}}>
            <a className="navbar-brand">Cartographer's Eye</a>
  

            <SearchBox  onSearch={handleSearch}  />
            
            <div className="options-box" style={{display: "flex",zIndex:"2", width: '10%', height: '100%', paddingRight: "100px", padding: '10px', borderRadius: '5px', justifyContent: 'space-between'}} >
                <label>
                    <input
                        type="radio"
                        value="port"
                        checked={selectedOption === 'port'}
                        onChange={handleOptionChange}
                    />
                    Port
                </label>
                <label >
                    <input
                        type="radio"
                        value="ship"
                        checked={selectedOption === 'ship'}
                        onChange={handleOptionChange}
                    />
                    Ship
                </label>
            </div>
        </div>
        </nav>
        <div id="map" style={{zIndex:"1"}}/>
    </div>
);
};

export default App;
