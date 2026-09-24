import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Script de migración (Dry-Run y Ejecución)
// Inicializa la app. (Usa FIRESTORE_EMULATOR_HOST si está seteado).
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  const isRollback = process.argv.includes('--rollback');
  console.log(`Iniciando migración. Modo Dry-Run: ${isDryRun}. Modo Rollback: ${isRollback}`);

  const snapshot = await db.collectionGroup('appointments').get();
  let affected = 0;
  
  const batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    let updatePayload = {};

    if (isRollback) {
      if (data.revision !== undefined) {
        needsUpdate = true;
        updatePayload = {
          revision: require('firebase-admin/firestore').FieldValue.delete()
        };
      }
    } else {
      if (data.revision === undefined) {
        needsUpdate = true;
        updatePayload = {
          revision: 1
        };
      }
    }

    if (needsUpdate) {
      affected++;
      if (!isDryRun) {
        batch.update(doc.ref, updatePayload);
        opsInBatch++;
        if (opsInBatch === 500) {
          await batch.commit();
          opsInBatch = 0;
        }
      }
    }
  }

  if (!isDryRun && opsInBatch > 0) {
    await batch.commit();
  }

  console.log(`Migración completada. Documentos afectados: ${affected}`);
}

run().catch(console.error);
