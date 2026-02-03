const fs = require('fs').promises;
const path = require('path');

async function fixDashboardPages() {
  const dashboardPath = path.join(process.cwd(), 'app/(dashboard)/dashboard');
  
  const pagesToFix = [
    'settings/fees/page.tsx',
    'settings/payments/page.tsx',
    'settings/custom-fees/page.tsx',
    'settings/localization/page.tsx',
    'settings/pos/page.tsx',
    'settings/features/page.tsx',
    'settings/design/page.tsx',
    'settings/location/page.tsx',
    'settings/general/page.tsx',
    'staff/staff-wrapper.tsx',
    'stats/page.tsx',
    'reservations/page.tsx',
    'billing/page.tsx',
    'setup/page.tsx'
  ];

  for (const pageFile of pagesToFix) {
    const filePath = path.join(dashboardPath, pageFile);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Skip if already fixed
      if (content.includes('getSelectedRestaurant')) {
        console.log(`✅ Already fixed: ${pageFile}`);
        continue;
      }
      
      // Add import
      if (!content.includes("import { getSelectedRestaurant }")) {
        const lastImportIndex = content.lastIndexOf('import');
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLineIndex + 1) + 
                  "import { getSelectedRestaurant } from '@/app/actions/restaurants'\n" +
                  content.slice(nextLineIndex + 1);
      }
      
      // Replace findFirst with getSelectedRestaurant
      content = content.replace(
        /const restaurant = await prisma\.restaurant\.findFirst\({[\s\S]*?\}\)/gm,
        'const restaurant = await getSelectedRestaurant()'
      );
      
      // Also handle cases where it's split across lines
      content = content.replace(
        /await prisma\.restaurant\.findFirst\({[\s\S]*?where: \{[\s\S]*?\}[\s\S]*?\}\)/gm,
        'await getSelectedRestaurant()'
      );
      
      await fs.writeFile(filePath, content);
      console.log(`✅ Fixed: ${pageFile}`);
      
    } catch (error) {
      console.log(`❌ Error fixing ${pageFile}:`, error.message);
    }
  }
}

fixDashboardPages().catch(console.error);