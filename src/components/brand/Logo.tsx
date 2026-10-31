import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={className ? `logo-stage ${className}` : "logo-stage"} data-mark>
      <span className="logo-plate">
        <Image
          src="/brand/logo.jpg"
          alt="Elleboro Giardini"
          width={1024}
          height={558}
          priority
          sizes="(min-width: 900px) 36rem, 100vw"
          className="logo-image"
        />
        <span className="logo-grain" aria-hidden="true" />
      </span>
    </span>
  );
}
