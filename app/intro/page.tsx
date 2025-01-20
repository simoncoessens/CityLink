"use client";
import React from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { TracingBeam } from "@/components/ui/tracing-beam";
import Link from "next/link";

export default function TracingBeamDemo() {
  return (
    <>
      <TracingBeam className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-3xl mx-auto antialiased pt-4 relative text-center">
          {contentSections.map((item, index) => (
            <div key={`content-${index}`} className="mb-16">
              <p
                className={twMerge(
                  "font-sans text-3xl md:text-4xl font-bold mb-6"
                )}
              >
                {item.title}
              </p>

              <div className="text-base md:text-lg prose prose-lg dark:prose-invert">
                {item?.image && (
                  <Image
                    src={item.image}
                    alt="visualization example"
                    height="600"
                    width="600"
                    className="rounded-lg mb-10 object-cover mx-auto"
                  />
                )}
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </TracingBeam>
      {/* Button at the Bottom */}
      <div className="flex justify-center my-6">
        <Link
          href="/visualization" // Replace "/another-page" with your desired route
          className="px-6 py-2 bg-black text-white rounded-lg font-bold transform hover:-translate-y-1 transition duration-400"
        >
          Next
        </Link>
      </div>
    </>
  );
}

const contentSections = [
  {
    title: "Find travel destinations in France",
    description: (
      <>
        <p>
          <b>Which cities in France are best suited for weekend trips?</b>
          This research delves into understanding the most viable destinations
          for short-term travel using public transport, with a focus on
          efficiency, accessibility, and sustainability.
        </p>
        <p>
          Using data from popular transport providers like <b>SNCF</b> (train)
          and <b>FlixBus</b>, we aim to uncover patterns in travel times and
          environmental impact across various cities in France.
        </p>
      </>
    ),
    image: "/images/intro_1.jpg",
  },
  {
    title: "Find your ideal travel route",
    description: (
      <>
        <p>
          Data visualizations are at the heart of this project. Using tools like{" "}
          <b>Tableau</b>, we explore:
        </p>
        <ul>
          <li>Busiest travel hubs in France and their connections.</li>
          <li>
            Heatmaps of CO<sub>2</sub> emissions for travel originating from key
            cities like Paris.
          </li>
          <li>Travel times visualized against city population sizes.</li>
        </ul>
        <p>
          These visualizations allow us to tell the story of France's public
          transport system and its role in supporting sustainable, short-term
          travel.
        </p>
      </>
    ),
    image: "/images/intro_2.jpeg",
  },
  {
    title: "The Climate Perspective",
    description: (
      <>
        <p>
          Climate change is a pressing issue, and transportation plays a
          significant role. This project integrates a{" "}
          <b>
            CO<sub>2</sub> emissions
          </b>{" "}
          analysis, providing insights into the environmental impact of
          different modes of travel.
        </p>
        <p>
          By comparing trains and buses, we help identify greener travel options
          for students, encouraging informed decisions for more sustainable
          weekend trips. Visualizing this data fosters awareness and empowers
          individuals to minimize their carbon footprint.
        </p>
      </>
    ),
    image: "/images/intro_3.jpeg",
  },
  {
    title: "Insights for Students",
    description: (
      <>
        <p>
          Students often look for quick, affordable, and exciting weekend trips.
          Our project bridges this need by analyzing:
        </p>
        <ul>
          <li>Top destinations reachable within 3-5 hours.</li>
          <li>Cost-effective routes using buses and trains.</li>
          <li>Carbon emissions compared to city distances.</li>
        </ul>
        <p>
          The data-driven approach ensures students can find the perfect getaway
          while staying conscious of time, cost, and sustainability.
        </p>
      </>
    ),
    image: "/images/intro_4.jpg",
  },
];
