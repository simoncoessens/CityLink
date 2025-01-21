"use client";

import React, { useEffect, useRef } from "react";

const RouteMap: React.FC = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Ensure the map logic only runs in the client-side
    if (typeof window === "undefined") return;

    // Dynamically import Leaflet and its plugins
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet-routing-machine");

      if (!mapRef.current) {
        const map = L.map("route-map", {
          zoomControl: false,
        }).setView([47.08, 2.4], 6); // Center map between Paris and Bordeaux

        // Minimalist map tiles
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "",
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(map);

        // Routing control
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(48.8566, 2.3522), // Paris
            L.latLng(44.8378, -0.5792), // Bordeaux
          ],
          createMarker: () => null, // No markers
          routeWhileDragging: false,
          show: false, // No textual route info
          addWaypoints: false,
          lineOptions: {
            styles: [{ color: "#3388ff", weight: 4 }], // Route line style
          },
          formatter: new L.Routing.Formatter({
            itineraryBuilder: null, // Disable textual directions
          }),
        }).addTo(map);

        routingControl.on("routesfound", function () {
          const container = routingControl.getContainer();
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });

        mapRef.current = map;
      }
    })();
  }, []);

  return (
    <div
      id="route-map"
      style={{
        height: "400px",
        width: "100%",
        border: "1px solid #ccc",
      }}
    ></div>
  );
};

export default RouteMap;
