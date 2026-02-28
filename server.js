import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Base de connaissances complète pour le RAG local
const KNOWLEDGE_BASE = {
  inscriptions: {
    keywords: ['inscription', 'réinscription', 'réinscri', 'inscri', 'documents', 'frais', 'paiement', 'carte', 'immatriculation'],
    response: `📋 **INSCRIPTIONS & RÉINSCRIPTIONS**

**Documents requis :**
• CIN ou passeport
• Baccalauréat original
• 4 photos d'identité
• Attestation de résidence
• Reçu de paiement

**Frais d'inscription :**
• Licence : 20 DT
• Master : 30 DT
• Doctorat : 50 DT

**Période de réinscription :**
• Du 1er au 30 septembre chaque année

**Procédure :**
1. Connectez-vous au portail étudiant
2. Remplissez le formulaire en ligne
3. Uploadez les documents requis
4. Payez les frais d'inscription
5. Récupérez votre carte d'étudiant

**Délai de traitement :** 5 jours ouvrables

📞 Contact : 71 000 001`
  },
  attestations: {
    keywords: ['attestation', 'certificat', 'scolarité', 'relevé', 'notes', 'diplôme', 'diplome', 'provisoire'],
    response: `📄 **ATTESTATIONS & CERTIFICATS**

**Attestation de scolarité :**
• Prix : Gratuite
• Délai : 48h
• Demande : En ligne ou secrétariat

**Relevé de notes :**
• Prix : 1 DT par exemplaire
• Délai : 3 jours ouvrables
• Retrait : Secrétariat

**Diplôme original :**
• Prix : 50 DT
• Délai : 30 jours après le jury
• Retrait : Secrétariat (pièce d'identité requise)

**Attestation provisoire :**
• Prix : Gratuite
• Disponible : Immédiatement après les résultats
• Retrait : En ligne

📞 Contact : 71 000 001`
  },
  bourses: {
    keywords: ['bourse', 'bourses', 'sociale', 'excellence', 'crous', 'aide', 'revenu', 'financier'],
    response: `🎓 **BOURSES & AIDES**

**Bourse sociale :**
• Montant : 90 DT/mois
• Date limite : 15 octobre
• Conditions : Revenu familial modeste
• Dossier à déposer avant le 15 octobre

**Bourse d'excellence :**
• Condition : Moyenne ≥ 14/20
• Attribution : Automatique (pas de demande écrite)
• Montant : Selon critères

**Aides CROUS :**
• Logement en résidence universitaire
• Restaurant universitaire : 0.5 DT/repas
• Bourses d'études

📞 Contact Service Bourses : 71 000 002`
  },
  absences: {
    keywords: ['absence', 'absences', 'rattrapage', 'rattra', 'justificatif', 'examen', 'échec', 'echec'],
    response: `📅 **ABSENCES & RATTRAPAGE**

**Taux d'absence maximum :**
• 30% par matière
• Au-delà de 30% : Interdiction de passer l'examen

**Justificatif d'absence :**
• À fournir dans les 72 heures
• Document accepté : Certificat médical
• Déposer au secrétariat

**Session de rattrapage :**
• Date : 2 semaines après la session principale
• Inscription : Automatique
• Épreuves : Matières échouées

📞 Contact Scolarité : 71 000 004`
  },
  stages: {
    keywords: ['stage', 'stages', 'convention', 'entreprise', 'rapport', 'professionnel'],
    response: `🏢 **STAGES PROFESSIONNELS**

**Convention de stage :**
• Obligatoire avant le début du stage
• Formulaire à télécharger sur le portail universitaire
• Signature : Université + Entreprise

**Durée minimale du stage :**
• Licence : 4 semaines
• Master : 8 semaines

**Rapport de stage :**
• À remettre dans les 15 jours après la fin du stage
• Dépôt : En ligne
• Soutenance : Possible

📞 Contact Service Stages : 71 000 003`
  },
  contacts: {
    keywords: ['contact', 'téléphone', 'telephone', 'email', 'secrétariat', 'secretariat', 'adresse', 'bureau', 'horaires', 'ouvert'],
    response: `📞 **CONTACTS & SECRÉTARIATS**

**Secrétaire central :**
• Téléphone : 71 000 001
• Email : secretariat@uc-tunis.tn
• Bureau : Bâtiment A, Bureau 101

**Service des Bourses :**
• Téléphone : 71 000 002
• Email : bourses@uc-tunis.tn
• Bureau : Bâtiment B, Bureau 205

**Service des Stages :**
• Téléphone : 71 000 003
• Email : stages@uc-tunis.tn
• Bureau : Bâtiment A, Bureau 118

**Scolarité & Examens :**
• Téléphone : 71 000 004
• Email : scolarite@uc-tunis.tn
• Bureau : Bâtiment C, Bureau 302

🕐 **Horaires :** Lundi - Vendredi, 8h30 - 16h00`
  },
  calendrier: {
    keywords: ['calendrier', 'date', 'rentrée', 'rentree', 'examen', 'examens', 'session', 'vacances'],
    response: `📆 **CALENDRIER 2024-2025**

**Événements importants :**
• Rentrée universitaire : 15 septembre 2024
• Examens S1 : 15 janvier - 5 février 2025
• Rattrapage S1 : 20 février - 5 mars 2025
• Examens S2 : 15 juin - 5 juillet 2025
• Rattrapage S2 : 20-31 juillet 2025

**Sessions d'examen :**
• Session principale : Janvier-Février / Juin-Juillet
• Session rattrapage : 2 semaines après la session principale`
  },
  courriers: {
    keywords: ['courrier', 'demande', 'générer', 'generer', 'formulaire', 'réclamation', 'reclamation', 'écrire', 'ecrire'],
    response: `✉️ **GÉNÉRATION DE COURRIERS**

Je peux générer les courriers suivants pour vous :

**1. Demande d'attestation de scolarité**
Cliquez sur "Demande attestation" pour générer le courrier.

**2. Demande de bourse sociale**
Cliquez sur "Demande bourse" pour générer le courrier.

**3. Réclamation de notes**
Cliquez sur "Réclamation notes" pour générer le courrier.

Les courriers générés sont au format officiel et peuvent être copiés ou imprimés.`
  }
};

// Fonction de recherche RAG locale
function searchKnowledgeBase(query) {
  const q = query.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;
  
  for (const [topic, data] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    
    // Calculer le score de correspondance
    for (const keyword of data.keywords) {
      if (q.includes(keyword)) {
        score += keyword.length;
      }
      // Vérifier les mots partiels
      if (keyword.includes(q) || q.includes(keyword)) {
        score += 5;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = data.response;
    }
  }
  
  // Si pas de correspondance, retourne un message d'aide
  if (maxScore === 0 || bestMatch === null) {
    return `Je suis **UniHelp**, l'assistant virtuel de l'Université Centrale de Tunis.

Pourriez-vous reformuler votre question ou choisir un sujet parmi :

📋 **Inscriptions & Réinscriptions**
📄 **Attestations & Certificats**  
🎓 **Bourses & Aides**
📅 **Absences & Rattrapage**
🏢 **Stages Professionnels**
✉️ **Courriers Administratifs**

Vous pouvez aussi contacter le secrétariat au **71 000 001** pour plus d'aide.`;
  }
  
  return bestMatch;
}

// Endpoint pour générer une réponse
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }

  // Utiliser le RAG local pour trouver la réponse
  const reply = searchKnowledgeBase(message);
  
  res.json({ reply });
});

// Endpoint de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
