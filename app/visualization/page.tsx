"use client";

import React, { useState } from "react";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
} from "@tabler/icons-react";
import { BentoGridItem } from "@/components/ui/bento-grid";
import D3Map from "@/components/D3map";
import FlipCard from "@/components/animata/card/flip-card";
import { TransitionPanel } from "@/components/core/transition-panel";
import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselItem,
} from "@/components/core/carousel";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

export default function BentoGridDemo() {
  const [maxHours, setMaxHours] = useState(4);
  const [startHour, setStartHour] = useState(9);
  const [activeInputTab, setActiveInputTab] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState(0);

  const [startLocation, setStartLocation] = useState({
    lat: 48.8566, // Paris
    lng: 2.3522,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    lat: 44.8378, // Bordeaux
    lng: -0.5792,
  });

  // Route Map Component
  const RouteMap = () => {
    const mapRef = React.useRef(null);

    React.useEffect(() => {
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
            L.latLng(startLocation.lat, startLocation.lng), // Starting point
            L.latLng(destinationLocation.lat, destinationLocation.lng), // Destination
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

  // Tabs for User Input
  const INPUT_TABS = [
    { title: "Time", state: maxHours, setState: setMaxHours, min: 1, max: 9 },
    {
      title: "Money",
      state: startHour,
      setState: setStartHour,
      min: 0,
      max: 24,
    },
    { title: "CO2", state: 50, setState: () => {}, min: 0, max: 500 },
  ];

  // Tabs for Info Cards
  const INFO_TABS = [
    {
      title: "Destination",
      content: (
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Carousel */}
          <div className="relative w-full max-w-lg">
            <Carousel>
              <CarouselContent className="basis-1/3">
                <CarouselItem className="basis-1/3 flex justify-center">
                  <div className="w-[150px] h-[150px]">
                    <img
                      src="/images/paris_2.jpg"
                      alt="Paris Night"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-1/3">
                  <div className="w-[150px] h-[150px]">
                    <img
                      src="/images/paris_1.jpg"
                      alt="Eiffel Tower"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-1/3">
                  <div className="w-[150px] h-[150px]">
                    <img
                      src="/images/paris_3.jpg"
                      alt="Louvre Museum"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-1/3">
                  <div className="w-[150px] h-[150px]">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/c/c0/Paris_Eiffel_Tower_and_Seine.jpg"
                      alt="Sacré-Cœur"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselNavigation />
            </Carousel>
          </div>

          {/* Information */}
          <div className="overflow-y-auto max-h-72 px-4 text-center">
            {/* Title */}
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Paris
            </h2>
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Paris, the capital of France, is a global hub for art, fashion,
              gastronomy, and culture. Known as the{" "}
              <strong>"City of Light"</strong>, it is home to iconic landmarks
              and attractions:
            </p>
            <ul className="list-disc list-inside mt-4 text-sm text-neutral-600 dark:text-neutral-400 text-left md:text-center">
              <li>
                <a
                  href="https://www.toureiffel.paris/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Eiffel Tower
                </a>
                : The most famous symbol of Paris, offering stunning views from
                its observation decks.
              </li>
              <li>
                <a
                  href="https://www.louvre.fr/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Louvre Museum
                </a>
                : The world's largest art museum, home to masterpieces like the
                Mona Lisa and the Venus de Milo.
              </li>
              <li>
                <a
                  href="https://www.notredamedeparis.fr/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Notre-Dame Cathedral
                </a>
                : A masterpiece of Gothic architecture and a symbol of Parisian
                heritage.
              </li>
              <li>
                <a
                  href="https://en.musee-orsay.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Musée d'Orsay
                </a>
                : An art museum housed in a former railway station, featuring
                works from Impressionist masters.
              </li>
              <li>
                <a
                  href="https://www.sacre-coeur-montmartre.com/english/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sacré-Cœur Basilica
                </a>
                : Located at the highest point in Paris, offering breathtaking
                panoramic views of the city.
              </li>
              <li>
                <a
                  href="https://www.chateauversailles.fr/homepage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Palace of Versailles
                </a>
                : A short trip from the city, this opulent palace showcases
                French royal history and gardens.
              </li>
            </ul>
            <p className="text-center mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Discover hidden gems like the quaint streets of{" "}
              <strong>Montmartre</strong>, the bustling charm of the{" "}
              <strong>Latin Quarter</strong>, and the serene beauty of the{" "}
              <strong>Jardin des Tuileries</strong>. Paris is not just a city
              but an unforgettable experience waiting for you to explore.
            </p>
          </div>
        </div>
      ),
    },
    { title: "Route", content: <RouteMap /> },
    { title: "Info", content: "info" },
  ];

  // User Input Tab Panel
  const userInputPanel = (
    <div>
      <div className="mb-4 flex space-x-2">
        {INPUT_TABS.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveInputTab(index)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              activeInputTab === index
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700">
        <TransitionPanel
          activeIndex={activeInputTab}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          variants={{
            enter: { opacity: 0, y: -50, filter: "blur(4px)" },
            center: { opacity: 1, y: 0, filter: "blur(0px)" },
            exit: { opacity: 0, y: 50, filter: "blur(4px)" },
          }}
        >
          {INPUT_TABS.map((tab, index) => (
            <div key={index} className="py-2">
              <label className="block text-sm font-medium">
                {tab.title}: {tab.state}
              </label>
              <input
                type="range"
                min={tab.min}
                max={tab.max}
                value={tab.state}
                onChange={(e) => tab.setState(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </TransitionPanel>
      </div>
    </div>
  );

  // Info Cards Tab Panel
  const infoCardsPanel = (
    <div>
      <div className="mb-4 flex space-x-2">
        {INFO_TABS.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveInfoTab(index)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              activeInfoTab === index
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700">
        <TransitionPanel
          activeIndex={activeInfoTab}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          variants={{
            enter: { opacity: 0, y: -50, filter: "blur(4px)" },
            center: { opacity: 1, y: 0, filter: "blur(0px)" },
            exit: { opacity: 0, y: 50, filter: "blur(4px)" },
          }}
        >
          {INFO_TABS.map((tab, index) => (
            <div key={index} className="py-2">
              {tab.content}
            </div>
          ))}
        </TransitionPanel>
      </div>
    </div>
  );

  // Main Grid Items
  const items = [
    {
      title: "Map",
      description: "Explore the birth of groundbreaking ideas and inventions.",
      header: (
        <div className="relative h-full w-full">
          <div className="absolute top-[60%] left-[40%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-[700px] h-[700px]">
              <D3Map maxHours={maxHours} startHour={startHour} />
            </div>
          </div>
        </div>
      ),
      icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "",
      description: "",
      header: userInputPanel,
      icon: <></>,
    },
    {
      title: "",
      description: "",
      header: infoCardsPanel,
      icon: <></>,
    },
  ];

  return (
    <div className="flex flex-col justify-between max-w-7xl px-4 mx-auto mt-8 h-[calc(100vh-50px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        <div className="flex flex-col h-full">
          <BentoGridItem
            title={items[0].title}
            description={items[0].description}
            header={items[0].header}
            icon={items[0].icon}
            className="h-full"
          />
        </div>

        <div className="grid grid-rows-3 gap-6 h-full">
          <div className="row-span-1 flex flex-col">
            <BentoGridItem
              title={items[1].title}
              description={items[1].description}
              header={items[1].header}
              icon={items[1].icon}
              className="h-full"
            />
          </div>
          <div className="row-span-2 flex flex-col">
            <BentoGridItem
              title={items[2].title}
              description={items[2].description}
              header={items[2].header}
              icon={items[2].icon}
              className="h-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <p className="text-center text-sm text-neutral-500">CityLink</p>
      </div>
    </div>
  );
}
