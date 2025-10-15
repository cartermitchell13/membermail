Assets directory for static files served from `/assets/*`.

Subfolders:
- logos: SVG/PNG brand marks and icons
- fonts: custom web fonts (woff2/woff)

Usage examples:
- <img src="/assets/logos/brand.svg" alt="Brand" />
- CSS:
  @font-face {
    font-family: "YourFont";
    src: url("/assets/fonts/YourFont.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
