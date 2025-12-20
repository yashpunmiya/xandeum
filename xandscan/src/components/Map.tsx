'use client';

import { useEffect, useMemo, useState } from 'react';
import { Map, Source, Layer, Popup, Marker } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Node } from '@/types';


const TOKEN = 'pk.eyJ1IjoieWFzaHB1bm1peWEiLCJhIjoiY21neGd5bGJzMDRzeDJsc2luNG05MXJ3ZiJ9.WZ1Cf-C37MJDCIUwIfszqw';

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
      <div className="absolute bottom-4 left-4 rounded-lg bg-black/50 p-2 text-xs text-muted-foreground backdrop-blur-md border border-white/5">
        Scroll to zoom • Drag to rotate globe
      </div>
    </div>
  );
}
