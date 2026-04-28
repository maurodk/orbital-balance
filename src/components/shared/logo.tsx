import Image from "next/image";
import logoImg from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 32, showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-semibold tracking-[0.18em] text-orbital-white text-sm">
            ORBITAL
          </span>
          <span className="font-normal tracking-[0.3em] text-orbital-gold text-[0.65rem] mt-0.5">
            BALANCE
          </span>
        </span>
      )}
    </div>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      src={logoImg}
      alt="Orbital Balance"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  );
}
