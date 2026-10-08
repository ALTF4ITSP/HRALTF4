/* Shared fleet routes and basemap configuration for both traslado maps. */
(() => {
  'use strict';

  // Demonstration routes follow Montevideo's principal street corridors. These
  // are display geometries, not turn-by-turn routing or operational dispatch data.
  const transfers = [
    {
      id: 1, name: 'TRASLADO 1', ambulance: 'A-12', origin: 'Hospital de Clínicas',
      destination: 'Sanatorio de la Valentín', eta: '14:52', status: 'EN CURSO', color: '#8b5cf6',
      coordinates: [
        [-34.8910, -56.1524], [-34.8897, -56.1528], [-34.8885, -56.1535],
        [-34.8864, -56.1552], [-34.8845, -56.1598], [-34.8827, -56.1644],
        [-34.8810, -56.1690], [-34.8793, -56.1738], [-34.8774, -56.1788],
        [-34.8757, -56.1831], [-34.8754, -56.1878]
      ],
      currentPosition: [-34.8810, -56.1690]
    },
    {
      id: 2, name: 'TRASLADO 2', ambulance: 'B-07', origin: 'Médica Uruguaya',
      destination: 'Hospital Maciel', eta: '15:08', status: 'EN CURSO', color: '#3b82f6',
      coordinates: [
        [-34.8943, -56.1635], [-34.8956, -56.1653], [-34.8969, -56.1691],
        [-34.8983, -56.1733], [-34.9003, -56.1781], [-34.9020, -56.1826],
        [-34.9039, -56.1879], [-34.9057, -56.1929], [-34.9067, -56.1981],
        [-34.9061, -56.2017], [-34.9050, -56.2055], [-34.9065, -56.2090],
        [-34.9078, -56.2123]
      ],
      currentPosition: [-34.9020, -56.1826]
    },
    {
      id: 3, name: 'TRASLADO 3', ambulance: 'C-03', origin: 'Centro de Salud Carrasco',
      destination: 'Hospital Pasteur', eta: '16:15', status: 'PROGRAMADO', color: '#06b6d4',
      coordinates: [
        [-34.8771, -56.0610], [-34.8794, -56.0671], [-34.8820, -56.0741],
        [-34.8850, -56.0833], [-34.8855, -56.0929], [-34.8864, -56.1026],
        [-34.8871, -56.1127], [-34.8825, -56.1179], [-34.8796, -56.1256],
        [-34.8761, -56.1304], [-34.8729, -56.1358]
      ],
      currentPosition: [-34.8855, -56.0929]
    },
    {
      id: 4, name: 'TRASLADO 4', ambulance: 'D-15', origin: 'Centro de Salud del Prado',
      destination: 'Casmu', eta: '14:45', status: 'EN CURSO', color: '#10b981',
      coordinates: [
        [-34.8578, -56.2065], [-34.8598, -56.1995], [-34.8627, -56.1923],
        [-34.8653, -56.1850], [-34.8679, -56.1777], [-34.8706, -56.1704],
        [-34.8730, -56.1632], [-34.8755, -56.1561], [-34.8780, -56.1490],
        [-34.8795, -56.1435]
      ],
      currentPosition: [-34.8653, -56.1850]
    },
    {
      id: 5, name: 'TRASLADO 5', ambulance: 'E-09', origin: 'Policlínica Punta Carretas',
      destination: 'Sanatorio Americano', eta: '15:30', status: 'DEMORADO', color: '#f97316',
      coordinates: [
        [-34.9235, -56.1591], [-34.9208, -56.1602], [-34.9177, -56.1615],
        [-34.9148, -56.1627], [-34.9117, -56.1642], [-34.9086, -56.1656],
        [-34.9055, -56.1668], [-34.9020, -56.1664], [-34.8991, -56.1626],
        [-34.8962, -56.1597], [-34.8932, -56.1568], [-34.8906, -56.1561]
      ],
      currentPosition: [-34.9117, -56.1642]
    }
  ];


  function createBasemap(map, { onLoad = () => {}, onFallback = () => {}, onError = () => {} } = {}) {
    const config = window.TRACE_MAP_CONFIG || {};
    const key = config.cartoApiKey || document.querySelector('meta[name="carto-basemap-key"]')?.content.trim();
    const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
    const osm = () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: osmAttribution, className: 'osm-dark-tiles', keepBuffer: 2
    });
    const useCarto = Boolean(key) && !config.tileUrl;
    let layer = config.tileUrl ? L.tileLayer(config.tileUrl, {
      maxZoom: 19, attribution: config.attribution || osmAttribution,
      className: config.tileClassName || ''
    }) : useCarto ? L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`, {
      maxZoom: 20, attribution: `${osmAttribution}, &copy; <a href="https://carto.com/attribution/" target="_blank" rel="noopener">CARTO</a>`
    }) : osm();
    let failures = 0;
    let loadedTiles = 0;
    function monitor(currentLayer, canFallback) {
      currentLayer.on('tileload', () => {
        loadedTiles += 1;
        onLoad();
      });
      currentLayer.on('tileerror', () => {
        failures += 1;
        if (canFallback && failures >= 3 && map.hasLayer(currentLayer)) {
          map.removeLayer(currentLayer);
          layer = osm();
          failures = 0;
          monitor(layer, false);
          layer.addTo(map);
          onFallback();
        } else if (!canFallback && failures >= 4 && loadedTiles === 0) {
          onError();
        }
      });
    }
    monitor(layer, Boolean(key || config.tileUrl));
    layer.addTo(map);
    return layer;
  }


  function copyTransfer(transfer) {
    return {
      ...transfer,
      coordinates: transfer.coordinates.map((point) => [...point]),
      currentPosition: [...transfer.currentPosition]
    };
  }

  window.TraceMapShared = Object.freeze({
    getTransfers: () => transfers.map(copyTransfer),
    getTransfer(id) {
      const transfer = transfers.find((item) => item.id === id);
      return transfer ? copyTransfer(transfer) : null;
    },
    createBasemap
  });
})();
