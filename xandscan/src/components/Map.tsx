'use client';

import { useEffect, useMemo, useState } from 'react';
import { Map, Source, Layer, Popup, Marker } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Node } from '@/types';
import { Globe } from 'lucide-react';

const TOKEN = 'pk.eyJ1IjoieWFzaHB1bm1peWEiLCJhIjoiY21neGd5bGJzMDRzeDJsc2luNG05MXJ3ZiJ9.WZ1Cf-C37MJDCIUwIfszqw';

// Helper for country mapping to flag codes
const getCountryCode = (country: string) => {
  const mapping: Record<string, string> = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Germany': 'de',
    'France': 'fr',
    'Netherlands': 'nl',
    'Canada': 'ca',
    'China': 'cn',
    'Japan': 'jp',
    'Russia': 'ru',
    'India': 'in',
    'Brazil': 'br',
    'Australia': 'au',
    'Sweden': 'se',
    'Norway': 'no',
    'Finland': 'fi',
    'Spain': 'es',
    'Italy': 'it',
    'Poland': 'pl',
    'Singapore': 'sg',
    'South Korea': 'kr',
    'Switzerland': 'ch',
    'Hong Kong': 'hk',
    'Taiwan': 'tw',
    'Israel': 'il',
    'Ukraine': 'ua',
    'Romania': 'ro',
    'Austria': 'at',
    'Belgium': 'be',
    'Ireland': 'ie',
    'New Zealand': 'nz',
    'Denmark': 'dk',
    'Portugal': 'pt',
    'Czech Republic': 'cz',
    'Turkey': 'tr',
    'South Africa': 'za',
    'Mexico': 'mx'
  };
  return mapping[country] || country.slice(0, 2).toLowerCase();
};

export default function GlobeMap({ nodes }: { nodes: Node[] }) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<{ lat: number; lng: number; country: string; count: number } | null>(null);

  // Aggregate nodes by country
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach(node => {
      if (node.country && node.country !== 'Unknown') {
        counts[node.country] = (counts[node.country] || 0) + 1;
      }
    });
    return counts;
  }, [nodes]);

  // Safe array for countries that have nodes, to speed up checking
  const activeCountries = Object.keys(countryCounts);

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{
          longitude: -30,
          latitude: 25,
          zoom: 1.5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: 'globe' } as any}
        fog={{
          range: [1.0, 8.0],
          color: '#1a1a1a',
          'horizon-blend': 0.1,
          'high-color': '#242424',
          'space-color': '#000000',
          'star-intensity': 0.6
        } as any}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      >
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />

        {/* Country boundaries source - using Mapbox Admin boundaries if available or a public vector tile */}
        {/* Ideally we use a public source like mapbox://mapbox.country-boundaries-v1 if we have access, 
            but standard streets style 'country-label' and fills often work. 
            For simplicity and robustness without paying for extra tilesets, we can use the 'admin' boundaries in the standard style 
            and filter/style them. 
        */}



        {/* 
           Fallback: If composite source-layer is tricky without inspection, 
           we can use a GeoJSON source of world boundaries if we had one. 
           Since we don't, let's try styling the existing administration layers if possible.
           Another trick: use a circle layer at the lat/long of the country center (calculated from average of nodes).
        */}

        {activeCountries.map(country => {
          // Calculate center roughly based on nodes in that country
          const countryNodes = nodes.filter(n => n.country === country);
          const lat = countryNodes.reduce((sum, n) => sum + (n.latitude || 0), 0) / countryNodes.length;
          const lng = countryNodes.reduce((sum, n) => sum + (n.longitude || 0), 0) / countryNodes.length;

          return (
            <Marker
              key={country}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={(e: any) => {
                e.originalEvent?.stopPropagation();
                setPopupInfo({ lat, lng, country, count: countryCounts[country] });
              }}
            >
              <div className="group relative flex items-center justify-center cursor-pointer">
                {/* Outer Glow */}
                <div className="h-6 w-6 rounded-full bg-primary/20 blur-md animate-pulse absolute" />

                {/* Core Dot */}
                <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_rgba(34,197,94,0.8)] border border-white/20 z-10" />

                {/* Persistent Count Badge */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-primary/30 text-primary shadow-[0_0_10px_rgba(0,0,0,0.5)] whitespace-nowrap z-20 transition-transform group-hover:scale-110">
                  {countryCounts[country]}
                </div>

                {/* Hover Details (Country Name) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 scale-90 transition-all group-hover:opacity-100 group-hover:scale-100 bg-black/80 text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap z-50 pointer-events-none text-white">
                  {country}
                </div>
              </div>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            className="text-black"
          >
            <div className="p-1">
              <div className="font-bold">{popupInfo.country}</div>
              <div className="text-sm">{popupInfo.count} Nodes Active</div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-black/50 p-2 text-xs text-muted-foreground backdrop-blur-md border border-white/5 pointer-events-none">
        Scroll to zoom • Drag to rotate globe
      </div>

      <div className="absolute bottom-12 right-2 z-10 w-32 rounded-xl border border-white/5 bg-black/90 backdrop-blur-xl p-2 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 mb-2 px-0.5">
          <Globe className="w-2.5 h-2.5 text-primary animate-pulse" />
          <h3 className="text-[9px] font-black text-white/70 uppercase tracking-widest">Global</h3>
        </div>
        
        <div className="flex flex-col gap-0.5 max-h-[82px] overflow-y-auto pr-1 scrollbar-hide hover:scrollbar-default transition-all">
          {Object.entries(countryCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([country, count]) => (
              <div key={country} className="flex items-center justify-between py-1 group cursor-default">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={`https://flagcdn.com/w20/${getCountryCode(country)}.png`}
                    alt={country}
                    className="h-2 w-3 rounded-[1px] object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w20/un.png' }}
                  />
                  <span className="text-[10px] font-medium text-gray-500 group-hover:text-white transition-colors truncate" title={country}>
                    {country}
                  </span>
                </div>
                <div className="text-[10px] font-mono font-bold text-primary/70">
                  {count}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
