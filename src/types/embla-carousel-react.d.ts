// Minimal type stubs for `embla-carousel-react` to satisfy TypeScript during build
// This avoids explicit `any` to keep ESLint happy.

declare module "embla-carousel-react" {
  export interface EmblaApi {
    canScrollPrev(): boolean;
    canScrollNext(): boolean;
    scrollPrev(): void;
    scrollNext(): void;
    on(event: "select" | "reInit", handler: (api: EmblaApi) => void): void;
    off(event: "select" | "reInit", handler: (api: EmblaApi) => void): void;
  }

  export type UseEmblaCarouselType = [
    (node: HTMLDivElement | null) => void,
    EmblaApi | undefined
  ];

  export default function useEmblaCarousel(
    options?: {
      axis?: "x" | "y";
      [key: string]: unknown;
    },
    plugins?: unknown
  ): UseEmblaCarouselType;
}