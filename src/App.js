import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import './map.css';
import axios from 'axios'; 
import SearchBox from './component/SearchBox/SearchBox';
import ErrorMessage from './component/ErrorMessage/ErrorMessage';

mapboxgl.accessToken = 'pk.eyJ1IjoiZXNwYWNlc2VydmljZSIsImEiOiJjbHZ1dHZjdTQwMDhrMm1uMnoxdWRibzQ4In0.NaprcMBbdX07f4eXXdr-lw';


const App = () => {
  
const [geoJsonData1, setGeoJsonData1] = useState(null);  // storing coordinates for ships in last 2 days
const [geoJsonData2, setGeoJsonData2] = useState(null); // storing coordinates for ships in between2 to 7 days
const [geoJsonData3, setGeoJsonData3] = useState(null); // storing ports name 
const [ports, setPorts] = useState(null);
const [map, setMap] = useState(null); 
const [selectedOption, setSelectedOption] = useState('port'); 
const [visitedShips, setVisitedShips] = useState([]);
const [showVisitedShipsPanel, setShowVisitedShipsPanel] = useState(false);
const [selectedPort, setSelectedPort] = useState(null);
const [errorMessage, setErrorMessage] = useState('');
const [marker, setMarker] = useState(null);
const [showAllPorts, setShowAllPorts] = useState(false); // State to track whether to show all ports





const fetchVisitedShips = async (portName, radius) => {
    try {
        const response = await axios.get(`https://cartographer-server.onrender.com/visited_ships?portName=${portName}&radius=${radius}`);
        const vis_ships = response.data.map(ship => ship.shipName);
        setVisitedShips(vis_ships);
    } catch (error) {
        throw new Error('Error fetching visited ships:', error);
    }
  };



useEffect(() => {
    const fetchData = async () => {
        try {
            const response2 = await axios.get("https://cartographer-server.onrender.com/ports");
            const data2 = response2.data;
            setGeoJsonData3(data2[0]);
            setPorts(data2);
        } catch (error) {
            throw new Error('Error searching:', error);
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
    } else if(showAllPorts && map ) { 
        const newMap = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-96, 37.8],
            zoom: 2
        });

        setMap(newMap); 
    }
}, [geoJsonData1, geoJsonData3, selectedOption]);


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
}, [geoJsonData1, geoJsonData2]);


  const handleShowAllPorts = () => {
    setShowAllPorts(true); // Set state to show all ports when button is clicked
  };

  useEffect(() => {
    if (showAllPorts && ports && map) {
      ports.forEach((port) => {
        const marker = new mapboxgl.Marker()
          .setLngLat(port.geometry.coordinates) // Set marker position based on port coordinates
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // Add a popup with port name
              .setHTML(`<h3>${port.properties.port_name}</h3>`)
          )
          .addTo(map);
      });
      setShowAllPorts(false); // Reset state after adding markers
    }
  }, [showAllPorts, ports, map]);

const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
};


const handleSearch = async (query) => {
    setErrorMessage('');
    try {
        let searchResult = null;
        let adjustedQuery = query;
  
        if (selectedOption === 'port') {
            adjustedQuery += ' port'; // Add a space before 'port'
        }
  
        const isShip = adjustedQuery.toLowerCase().includes('ship');
        const isPort = adjustedQuery.toLowerCase().includes('port');


        if (isShip) {
            const response = await axios.get(`https://cartographer-server.onrender.com/ships/${query}`);
            const data1 = response.data;
            setGeoJsonData1(data1.routes.last2Days);
            setGeoJsonData2(data1.routes.between2And7Days)    
            setShowVisitedShipsPanel(false);    
        } 
        else if (isPort) {
            const response = await axios.get(`https://cartographer-server.onrender.com/ports/${query}`);
            searchResult = response.data;
        } else {
            console.log('Invalid search query. Please enter a ship or port name.');
            return;
        }

        if (isShip && selectedOption === 'port') {
            setErrorMessage('You have selected the "Ship" option, but you are searching for a port. Please select the "Port" option or enter a ship name.');
            return;
        }

        if (searchResult && isPort) {
            const [longitude, latitude] = searchResult.geometry.coordinates;
            map.flyTo({ center: [longitude, latitude], zoom: 10 });

            // Create the marker and store it in the marker variable
            const newmarker = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .setPopup(
                new mapboxgl.Popup({
                offset: 25,
                className: 'custom-popup', // Add a custom class name
                })
                .setHTML(`
                <h3 style="background-color: rgba(255, 255, 255, 0.5); color: #000; padding: 10px; border-radius: 5px; margin: 0; font-size: 16px;">
                    ${searchResult.properties.port_name}
                </h3>
                `)
            )
            .addTo(map);

            newmarker.getElement().addEventListener('click', () => {
                setSelectedPort(searchResult); // Set the selected port when the marker is clicked
                fetchVisitedShips(searchResult.properties.port_name, 1000); // Fetch the visited ships for the selected port
                setShowVisitedShipsPanel(true); // Show the VisitedShipsPanel
            });
            setMarker(newmarker);
        }
        else if(isShip && searchResult){
            setGeoJsonData1(null); // Clear previous route data (part 1)
      setGeoJsonData2(null); // Clear previous route data (part 2)
      setGeoJsonData3(null); // Clear previous route data (part 3)
      if (marker) marker.remove()
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Handle 404 errors (resource not found)
            setErrorMessage('The requested resource was not found. Please enter a valid ship or port name.');
        } else {
            // Handle other errors
            setErrorMessage('An error occurred while processing your request. Please try again later.');
        }
    }
};


  const VisitedShipsPanel = ({ visitedShips, selectedPort }) => {
    return (
        <div
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white background
                padding: '10px',
                borderRadius: '5px',
                position: 'absolute',
                right: '10px',
                top: '90px',
                zIndex: 2,
                backdropFilter: 'blur(5px)', // Applies a blur effect to the background
            }}
        >
            <h3 style={{ margin: 0, marginBottom: '5px', fontSize: '16px' }}>Ships Visited {selectedPort?.properties.port_name}</h3>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {visitedShips.map((shipName, index) => (
                    <li key={index} style={{ marginBottom: '3px', fontSize: '14px' }}>{shipName}</li>
                ))}
            </ul>
        </div>
    );
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
            <button
                className="show-all-ports-btn" // Add a class name for styling
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    zIndex: "3",
                    backgroundColor: "royalblue",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    margin: "5px", // Add margin for spacing
                  }}
                onClick={handleShowAllPorts}
            >
                Show All Ports
            </button>
            </div>
        </nav>
        <div id="map" style={{zIndex:"1"}}/>
        {showVisitedShipsPanel && (
      <VisitedShipsPanel visitedShips={visitedShips} selectedPort={selectedPort} />
      
    )}
    {errorMessage && <ErrorMessage message={errorMessage} />}
    </div>
);
};

export default App;
