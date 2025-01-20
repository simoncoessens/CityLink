import { cn } from "@/lib/utils";

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-background dark:border-zinc-700",
        className
      )}
    >
      {children}
    </div>
  );
}

function FeatureOne() {
  return (
    <BentoCard className="w-[45rem] h-[50rem]">
      <div className="text-center">Large Card</div>
    </BentoCard>
  );
}

function FeatureTwo() {
  return (
    <BentoCard className="w-[40rem] h-[25rem]">
      <div className="text-center">Small Card 1</div>
    </BentoCard>
  );
}

function FeatureThree() {
  return (
    <BentoCard className="w-[40rem] h-[25rem]">
      <div className="text-center">Small Card 2</div>
    </BentoCard>
  );
}

export default function Three() {
  return (
    <div className="grid grid-cols-3 gap-[1rem] h-screen">
      {/* Large card spanning two columns */}
      <div className="col-span-2 row-span-2 flex items-start justify-center">
        <FeatureOne />
      </div>
      {/* Two smaller cards stacked vertically */}
      <div className="col-span-1 row-span-1 flex items-start justify-center">
        <FeatureTwo />
      </div>
      <div className="col-span-1 row-span-1 flex items-start justify-center">
        <FeatureThree />
      </div>
    </div>
  );
}
