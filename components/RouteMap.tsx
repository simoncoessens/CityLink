"use client";

import React, { useEffect, useRef } from "react";

interface RouteMapProps {
  startLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
}

const RouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  destinationLocation,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    // Ensure the map logic only runs in the client-side
    if (typeof window === "undefined") return;

    // Dynamically import Leaflet and its plugins
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet-routing-machine");
      await import("leaflet/dist/leaflet.css");

      // Initialize the map if it doesn't exist
      if (!mapRef.current) {
        mapRef.current = L.map("route-map", {
          zoomControl: false,
        }).setView([47.08, 2.4], 6); // Default center position

        // Add tile layer
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "",
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(mapRef.current);
      }

      // Remove the existing routing control if present
      if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
      }

      // Add routing control with updated waypoints
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(startLocation.lat, startLocation.lng), // Start location
          L.latLng(destinationLocation.lat, destinationLocation.lng), // Destination
        ],
        createMarker: () => null, // No markers
        routeWhileDragging: false,
        show: false, // No textual route info
        addWaypoints: false,
        lineOptions: {
          styles: [{ color: "#3388ff", weight: 4 }], // Route line style
        },
      }).addTo(mapRef.current);

      // Clean up unwanted UI elements
      routingControlRef.current.on("routesfound", function () {
        const container = routingControlRef.current?.getContainer();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    })();
  }, [startLocation, destinationLocation]); // Watch for changes in locations

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
