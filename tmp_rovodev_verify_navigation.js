// Navigation and sidebar functionality verification
console.log("=== Testing Navigation Functionality ===\n");

// Test 1: Check if sidebar toggle elements exist
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

console.log("✓ Sidebar Toggle Button:", sidebarToggle ? "EXISTS" : "MISSING");
console.log("✓ Sidebar Element:", sidebar ? "EXISTS" : "MISSING");
console.log("✓ Sidebar Overlay:", sidebarOverlay ? "EXISTS" : "MISSING");

// Test 2: Check navigation links
const navLinks = document.querySelectorAll('.nav-link');
console.log("\n✓ Navigation Links Found:", navLinks.length);
navLinks.forEach((link, index) => {
    console.log(`  ${index + 1}. ${link.textContent.trim()} -> ${link.getAttribute('href')}`);
});

// Test 3: Check responsive classes
console.log("\n✓ Checking CSS classes...");
const hasResponsiveCSS = document.styleSheets.length > 0;
console.log("  Stylesheets loaded:", hasResponsiveCSS ? "YES" : "NO");

console.log("\n=== All Navigation Tests Complete ===");
