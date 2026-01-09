const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  // MongoDB Connection String
  const uri = "mongodb+srv://info_db_user:ZTEM1jMEwLw1Ovgt@oriido.bpmadyc.mongodb.net/ordero?retryWrites=true&w=majority&appName=oriido";
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Verbunden mit MongoDB Atlas");

    const db = client.db("ordero");
    const usersCollection = db.collection("User");

    // Hash das Passwort
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Admin User Daten
    const adminUser = {
      email: "admin@oriido.de",
      password: hashedPassword,
      name: "Admin",
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Prüfe ob User bereits existiert
    const existingUser = await usersCollection.findOne({ email: adminUser.email });
    
    if (existingUser) {
      console.log("⚠️  Admin-User existiert bereits");
      // Update das Passwort für den existierenden User
      await usersCollection.updateOne(
        { email: adminUser.email },
        { 
          $set: { 
            password: hashedPassword,
            role: "SUPER_ADMIN",
            updatedAt: new Date()
          }
        }
      );
      console.log("✅ Admin-Passwort wurde aktualisiert");
    } else {
      // Erstelle neuen User
      const result = await usersCollection.insertOne(adminUser);
      console.log("✅ Admin-User erstellt mit ID:", result.insertedId);
    }

    console.log("\n📧 Admin Login Daten:");
    console.log("   Email: admin@oriido.de");
    console.log("   Passwort: admin123");
    console.log("\n⚠️  WICHTIG: Ändere das Passwort nach dem ersten Login!");

  } catch (error) {
    console.error("❌ Fehler:", error);
  } finally {
    await client.close();
    console.log("\n✅ Verbindung geschlossen");
  }
}

// Führe die Funktion aus
createAdminUser();