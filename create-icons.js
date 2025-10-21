// Simple script to create app icons
import fs from 'fs';

// Create SVG icon
const svgContent = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#7c3aed" rx="80"/>
  <text x="256" y="256" fill="white" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle">SMARTSELLER</text>
  <circle cx="256" cy="380" r="20" fill="#fbbf24"/>
</svg>
`;

// Save SVG
fs.writeFileSync('./public/icons/icon.svg', svgContent.trim());

console.log('SVG icon created at public/icons/icon.svg');
console.log('To create PNG icons, you can use online SVG to PNG converters or install ImageMagick');
console.log('For now, the PWA will work with placeholder icons.');
