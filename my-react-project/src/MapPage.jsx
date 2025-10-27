// Substitua todo o conteúdo de: src/MapPage.jsx

import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import './MapPage.css';

const containerStyle = { width: '100%', height: '100%' };
const initialCenter = { lat: 41.1579, lng: -8.6291 };

function MapPage({ onGoHome }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [numClients, setNumClients] = useState('');
  const [isNumSet, setIsNumSet] = useState(false);
  const [targetNum, setTargetNum] = useState(0);
  
  const [markers, setMarkers] = useState([]);
  const [resultPoint, setResultPoint] = useState(null);
  const [resultAddress, setResultAddress] = useState('');
  const [error, setError] = useState('');

  const autocompleteRefs = useRef([]);

  useEffect(() => {
    if (resultPoint) {
      setResultAddress('A obter morada do ponto ótimo...');
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: resultPoint }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setResultAddress(results[0].formatted_address);
        } else {
          setResultAddress('Não foi possível encontrar uma morada para o ponto ótimo.');
        }
      });
    }
  }, [resultPoint]);

  const handleNumChange = (e) => setNumClients(e.target.value);

  const handleGenerate = () => {
    const num = parseInt(numClients);
    if (isNaN(num) || num <= 0) { setError('Por favor, insira um número inteiro e positivo.'); return; }
    setTargetNum(num); setIsNumSet(true); setMarkers([]); setResultPoint(null); setError('');
  };

  const updateMarker = (index, field, value) => {
    setMarkers(current => current.map((marker, i) => i === index ? { ...marker, [field]: value } : marker));
  };

  const getAddressFromCoords = (lat, lng, index) => {
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) { updateMarker(index, 'address', 'Erro: Serviço Geocoder não carregado'); return; }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) { updateMarker(index, 'address', results[0].formatted_address); } 
      else { updateMarker(index, 'address', `Falha no Geocode: ${status}`); }
    });
  };

  const handleMapClick = (event) => {
    if (isNumSet && markers.length < targetNum) {
      const newMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        w: '1',
        address: 'A obter morada...',
      };
      const newIndex = markers.length;
      setMarkers(currentMarkers => [...currentMarkers, newMarker]);
      getAddressFromCoords(newMarker.lat, newMarker.lng, newIndex);
    }
  };

  const handleCoordChange = (index, field, value) => {
    const newCoord = parseFloat(value);
    if (!isNaN(newCoord)) {
      updateMarker(index, field, newCoord);
      const updatedMarker = markers.find((_, i) => i === index);
      if (updatedMarker) {
        const newLat = field === 'lat' ? newCoord : updatedMarker.lat;
        const newLng = field === 'lng' ? newCoord : updatedMarker.lng;
        setTimeout(() => getAddressFromCoords(newLat, newLng, index), 1000);
      }
    } else { updateMarker(index, field, value); }
  };

  const handleWeightChange = (index, value) => {
    updateMarker(index, 'w', value);
  };

  const onPlaceChanged = (index) => {
    if (autocompleteRefs.current[index]) {
      const place = autocompleteRefs.current[index].getPlace();
      if (place.geometry) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        const newAddress = place.formatted_address;
        setMarkers(current => current.map((marker, i) => i === index ? { ...marker, lat: newLat, lng: newLng, address: newAddress } : marker));
      }
    }
  };

  const handleCalculate = async () => {
    setResultPoint(null);
    setError('');
    try {
      // --- MUDANÇA AQUI ---
      const response = await fetch("https://centroide-backend.onrender.com/calculate-geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: markers.map(marker => ({ ...marker, w: parseFloat(marker.w) || 0 }))
        }),
      });
      if (!response.ok) throw new Error('A resposta do servidor não foi OK');
      const data = await response.json();
      setResultPoint(data.final_point);
    } catch (err) {
      console.error("Erro ao chamar o backend:", err);
      setError("Não foi possível comunicar com o servidor.");
    }
  };

  const handleReset = () => {
    setNumClients(''); setIsNumSet(false); setTargetNum(0);
    setMarkers([]); setResultPoint(null); setResultAddress(''); setError('');
    autocompleteRefs.current = [];
  };

  if (loadError) return <div>Erro ao carregar o mapa.</div>;
  if (!isLoaded) return <div style={{ color: 'white' }}>A carregar o mapa...</div>;

  return (
    <div className="map-page-container">
      <div className="map-panel">
        <GoogleMap mapContainerStyle={containerStyle} center={initialCenter} zoom={12} onClick={handleMapClick} options={{ disableDefaultUI: true, zoomControl: true, fullscreenControl: true }}>
          {markers.map((marker, index) => (<Marker key={`client-${index}`} position={{ lat: marker.lat, lng: marker.lng }} />))}
          {resultPoint && (<Marker position={{ lat: resultPoint.lat, lng: resultPoint.lng }} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />)}
        </GoogleMap>
      </div>
      <div className="sidebar-panel">
        <h2>Configuração</h2>
        {!isNumSet ? (
          <div className="input-group">
            <label htmlFor="num-clients">Número de clientes (num):</label>
            <input type="number" id="num-clients" value={numClients} onChange={handleNumChange} placeholder="Ex: 3" />
            {error && <p className="error-message">{error}</p>}
            <button onClick={handleGenerate}>Generate</button>
          </div>
        ) : (
          <div>
            <div className="user-guidance">
              <p>Número de clientes a adicionar: <strong>{targetNum}</strong></p>
              {markers.length < targetNum ? (<p>Clique no mapa para adicionar os <strong>{targetNum - markers.length}</strong> restantes.</p>) : (<p>Todos os clientes foram adicionados.</p>)}
            </div>
            <ul className="points-list interactive-list">
              {markers.map((marker, index) => (
                <li key={index} className="marker-editor">
                  <strong>Cliente {index + 1}</strong>
                  <div className="numeric-inputs">
                    <div className="input-wrapper"><label>Latitude</label><input type="number" step="0.000001" value={marker.lat} onChange={(e) => handleCoordChange(index, 'lat', e.target.value)} /></div>
                    <div className="input-wrapper"><label>Longitude</label><input type="number" step="0.000001" value={marker.lng} onChange={(e) => handleCoordChange(index, 'lng', e.target.value)} /></div>
                    <div className="input-wrapper weight-wrapper"><label>Peso (w)</label><input type="text" pattern="[0-9]*\.?[0-9]*" value={marker.w} onChange={(e) => handleWeightChange(index, e.target.value)} /></div>
                  </div>
                  <Autocomplete onLoad={(autocomplete) => autocompleteRefs.current[index] = autocomplete} onPlaceChanged={() => onPlaceChanged(index)}>
                    <input type="text" placeholder="Escreva uma morada..." value={marker.address} onChange={(e) => updateMarker(index, 'address', e.target.value)} className="address-input" />
                  </Autocomplete>
                </li>
              ))}
            </ul>
            {resultPoint && (
              <div className="result-card">
                <h3>Ponto Ótimo Encontrado</h3>
                <div className="result-item"><span>Coordenadas:</span><p>{resultPoint.lat.toFixed(6)}, {resultPoint.lng.toFixed(6)}</p></div>
                <div className="result-item"><span>Morada Aprox.:</span><p>{resultAddress}</p></div>
              </div>
            )}
          </div>
        )}
        <div className="button-group">
          {isNumSet && (<button onClick={handleCalculate} disabled={markers.length !== targetNum || markers.length === 0}>Calcular Ponto Ótimo</button>)}
          {isNumSet && <button onClick={handleReset}>Começar de Novo</button>}
          <button onClick={onGoHome}>Voltar à Home</button>
        </div>
      </div>
    </div>
  );
}

export default MapPage;