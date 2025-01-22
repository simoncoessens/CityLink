"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  startLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
}

const RouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  destinationLocation,
}) => {
  const mapRef = useRef<InstanceType<typeof L.Map> | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    (async () => {
      if (!isMounted) return;

      await import("leaflet-routing-machine");

      // Ensure valid locations
      if (!startLocation || !destinationLocation) return;

      // Initialize the map if it doesn't exist
      if (!mapRef.current) {
        mapRef.current = L.map("route-map", {
          zoomControl: false,
        }).setView([47.08, 2.4], 6);

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "",
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(mapRef.current);
      }

      // Remove existing routing control
      if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      // Add new routing control
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(startLocation.lat, startLocation.lng),
          L.latLng(destinationLocation.lat, destinationLocation.lng),
        ],
        createMarker: () => null,
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        lineOptions: {
          styles: [{ color: "#3388ff", weight: 4 }],
        },
      }).addTo(mapRef.current);

      routingControlRef.current?.on("routesfound", (e) => {
        const container = routingControlRef.current?.getContainer();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }

        if (!mapRef.current) return;
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const bounds = L.latLngBounds(routes[0].coordinates);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      });
    })();

    // Cleanup function
    return () => {
      isMounted = false;

      if (routingControlRef.current) {
        routingControlRef.current.getPlan().setWaypoints([]);
        mapRef.current?.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [startLocation, destinationLocation]);

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
