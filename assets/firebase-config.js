// ============================================================================
// FIREBASE KONFIGURÁCIÓ ÉS EMAIL-ÉRTESÍTÉS BEÁLLÍTÁSAI
// ============================================================================
// Ezt a fájlt kell kitöltened a saját Firebase- és EmailJS-projekted
// adataival, mielőtt a foglalási rendszer élesben működne.
//
// 1) FIREBASE_CONFIG kitöltése:
//    - Menj a https://console.firebase.google.com oldalra, hozz létre egy
//      új projektet (ingyenes "Spark" csomag bőven elég).
//    - A projektben kapcsold be a "Firestore Database"-t (production mode,
//      bármelyik régió jó, pl. europe-west3).
//    - Kapcsold be az "Authentication"-t, és engedélyezd az
//      "Email/Password" bejelentkezési módot. Hozz létre egy admin
//      felhasználót (a te email-ed + egy jelszó) — ezzel léphetsz be az
//      admin.html dashboardra.
//    - Project settings (fogaskerék ikon) → "Your apps" → Web app (</>)
//      hozzáadása → onnan kimásolod a firebaseConfig objektumot, és
//      berakod ide lent a FIREBASE_CONFIG helyére.
//
// 2) EMAIL-ÉRTESÍTÉS:
//    Az emaileket NEM ez a fájl kezeli, hanem a szerveroldali
//    api/send-booking.js függvény (Brevo API-val). A beállítás lépései
//    annak a fájlnak a fejlécében vannak leírva. Ide email-kulcs nem kerül.
//
// 3) FIRESTORE SECURITY RULES beállítása:
//    - Firebase konzol → Firestore Database → Rules fül.
//    - Illeszd be a projekt gyökerében lévő firestore.rules fájl
//      tartalmát, majd kattints Publish-ra.
// ============================================================================

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC38243VZXRQ-UNHqqkYbSEsCZk-j3deR8",
  authDomain: "loftofbeauty-2bd70.firebaseapp.com",
  projectId: "loftofbeauty-2bd70",
  storageBucket: "loftofbeauty-2bd70.firebasestorage.app",
  messagingSenderId: "939878579400",
  appId: "1:939878579400:web:5470f35924f74386e479fd"
};

// Ha még nincs kitöltve a Firebase-konfiguráció, a foglalási oldal
// figyelmeztetést ír ki a konzolra és a foglalás gomb nem fog működni,
// de az oldal nem törik el.
export const FIREBASE_CONFIGURED =
  FIREBASE_CONFIG.apiKey !== "IDE_JÖN_A_SAJÁT_API_KEY";
