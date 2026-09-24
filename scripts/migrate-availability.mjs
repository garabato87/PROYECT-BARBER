import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Setup admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    fs.readFileSync(path.resolve('./firebase-service-account.json'), 'utf8')
  );
} catch (err) {
  console.log('Skipping migrator dry run, no service account found locally.');
  process.exit(0);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrate() {
  console.log('--- Starting Availability Migration (Dry Run) ---');
  let migratedCount = 0;
  
  const businesses = await db.collection('businesses').get();
  
  for (const shop of businesses.docs) {
    const apps = await shop.ref.collection('appointments').get();
    
    if (apps.empty) continue;
    
    console.log(`Processing shop ${shop.id} - ${apps.size} appointments`);
    const batch = db.batch();
    let shopUpdates = 0;
    
    apps.forEach(app => {
      const data = app.data();
      const availabilityRef = shop.ref.collection('availability').doc(app.id);
      
      const payload = {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        professionalId: data.professionalId,
        status: data.status
      };
      
      // In dry-run mode, we just log. In real mode we do batch.set
      // batch.set(availabilityRef, payload);
      shopUpdates++;
    });
    
    console.log(`Prepared ${shopUpdates} availability slots for shop ${shop.id}`);
    migratedCount += shopUpdates;
  }
  
  console.log(`Migration plan completed. Total slots to migrate: ${migratedCount}`);
  // Uncomment to execute
  // await batch.commit();
}

migrate().catch(console.error);
