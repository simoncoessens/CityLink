import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { BackgroundLines } from "@/components/ui/background-lines";

export default function BackgroundLinesDemo() {
  return (
    <>
      {/* Set metadata for the browser tab */}
      <Head>
        <title>CityLink: Discover Your Next Weekend Getaway in France</title>
        <meta
          name="CityLink"
          content="Explore the best weekend travel destinations in France with CityLink. Plan your trips with ease and sustainability in mind."
        />
        <meta
          name="keywords"
          content="CityLink, travel, weekend trips, France, SNCF, FlixBus, sustainable travel, travel planning"
        />
      </Head>
      <div className="relative min-h-screen flex flex-col items-center px-4">
        {/* Top-right Logo */}
        <div className="absolute top-4 right-4">
          <Image
            src="/images/logo_centrale.svg.png" // Replace with the path to your second logo
            alt="Secondary Logo"
            width={100} // Adjust the width as needed
            height={100} // Adjust the height as needed
          />
        </div>

        {/* Top-left Names */}
        <div className="absolute top-4 left-4 text-neutral-700 dark:text-neutral-300 text-md font-bold">
          <p>Simon Coessens</p>
          <p>Gabriël Lozano</p>
        </div>

        {/* Main Heading and Description */}
        <BackgroundLines className="flex items-center justify-center w-full flex-col">
          <Image
            src="/images/map.jpg" // Replace with the path to your logo image
            alt="CityLink Logo"
            width={300} // Set the width of the logo
            height={300} // Set the height of the logo
          />
          <div className="flex items-center space-x-3">
            {/* CityLink Text */}
            <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
              CityLink
            </h2>
          </div>
          <br></br>
          <br></br>
          <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
            Discover your next weekend getaway in <strong>France</strong> with
            ease.
          </p>
        </BackgroundLines>
        {/* Button with Link */}
        <Link
          href="/intro" // Replace "/another-page" with your target route
          className="absolute px-6 py-2 bg-black text-white rounded-lg font-bold transform hover:-translate-y-1 transition duration-400"
          style={{ top: "90%" }}
        >
          Get Started
        </Link>
      </div>
    </>
  );
}
