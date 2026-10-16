import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutGrid, Table2, Users, Gauge, Plus, X, Search, Filter,
  MapPin, Phone, ChevronDown, ChevronUp, ChevronRight, Calendar, Save, Trash2, Send, FileSignature, Archive, Car,
  FolderOpen, AlertCircle, CheckCircle2, Lock, KeyRound, Eye, EyeOff,
  Check, Ban, Clock3, CalendarDays, LayoutList, ShieldAlert, CircleDashed,
  Star, UserCog, ClipboardList, Briefcase, LogOut, UserCircle, Percent,
  ArrowLeft, ArrowRight, HeartHandshake, MessageSquare,
  ChevronLeft, PlaneTakeoff, PenLine, AlertTriangle, ListChecks,
  PieChart as PieChartIcon, BarChart3, Printer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";

/* ============================================================
   TOKENS — CHARTE GRAPHIQUE OFFICIELLE INSTITUT PASTEUR DE LILLE
   ------------------------------------------------------------
   Couleurs et typographies reprises du Brandboard fourni :
   - Dark Teal #035D72, Turquoise #55CEB7, Carbon Black #18191A,
     Azure Mist #EAF4F4, Frozen Water #CAF0E9, White, et les accents
     Deep Pink, Dark Raspberry, Pastel Petal, Lime Yellow, Forest
     Moss, Cream, Majorelle Blue, Midnight Blue, Periwinkle.
   - Police principale : Livvic (Bold/Semi-Bold) — titres.
   - Police secondaire : Poppins (Regular) — texte courant.
   Les couleurs de STATUT (violet/orange/vert/rouge) sont conservées
   telles que définies avec l'utilisateur ; seul le violet est
   aligné sur le Majorelle Blue de la charte pour rester cohérent.
   ============================================================ */
const INK = "#035D72";          // Dark Teal — fond, en-tête
const INK_SOFT = "#0C7A93";     // Dark Teal éclairci — boutons d'en-tête
const PAPER = "#EAF4F4";        // Azure Mist — fond général
const PAPER_DARK = "#D8ECEA";   // dérivé Frozen Water — fonds de section
const CARE = "#035D72";         // Dark Teal — accent primaire (boutons, actifs)
const CARE_DARK = "#023C4A";    // Dark Teal foncé — liens, texte accentué
const MUTED = "#4C6169";        // texte secondaire teinté teal, contraste suffisant
const LINE = "#C9DFDD";         // bordures teintées teal

const AMBER = "#C97D30";        // statut : prévisionnel (validé)
const GREEN = "#2E8B57";        // statut : réalisé
const RED = "#C0392B";          // statut : annulé
const PURPLE = "#6357F2";       // statut : prévisionnel (non validé) — Majorelle Blue

// Couleurs secondaires de la charte, utilisées pour les rôles et
// les codes intervenant·es.
const TURQUOISE = "#55CEB7";
const CARBON_BLACK = "#18191A";
const DEEP_PINK = "#FF4DA2";
const DARK_RASPBERRY = "#832750";
const FRESH_GREEN = "#2FA84F"; // vert franc et chaleureux, bien distinct du teal Intervenant
const MIDNIGHT_BLUE = "#302B77";
const MAJORELLE_BLUE = "#6357F2";

// Hiérarchie de texte sur fond Dark Teal (écrans de connexion, en-tête),
// teintée teal plutôt que bleu marine pour rester cohérente avec la charte.
const INK_TEXT_MUTED = "#A9D9D4";   // kickers, petits libellés
const INK_TEXT_BODY = "#D7EEEC";    // paragraphes
const INK_TEXT_FOOTER = "#8FC4C0";  // mentions discrètes
const INK_BORDER = "#0F6A7F";       // bordures de champs
const ERROR_ON_DARK = "#F3A99C";    // messages d'erreur sur fond sombre

/* ============================================================
   SYSTÈME VISUEL — profondeur, rayons, signal turquoise
   ------------------------------------------------------------
   Le Turquoise #55CEB7 de la charte devient le « signal de vie »
   de l'interface : onglet actif, focus clavier, barres de
   progression, survols. C'est la couleur des deux anneaux
   entrelacés de l'emblème IPL — la plus vivante de la charte,
   jusqu'ici inexploitée.
   Les ombres sont teintées Dark Teal plutôt que grises : sur un
   fond Azure Mist, une ombre neutre paraît sale, une ombre
   teintée paraît intentionnelle.
   ============================================================ */
const SIGNAL = TURQUOISE;            // accent « vivant »
const SIGNAL_DEEP = "#2FB89B";       // turquoise assombri, lisible sur blanc
const SHADOW_SM = "0 1px 2px rgba(3,93,114,.06)";
const SHADOW_MD = "0 1px 2px rgba(3,93,114,.05), 0 6px 16px -4px rgba(3,93,114,.10)";
const SHADOW_LG = "0 2px 4px rgba(3,93,114,.06), 0 16px 32px -8px rgba(3,93,114,.16)";
const RADIUS_CARD = 14;
const RADIUS_CTRL = 10;
const STATUS_META = {
  previsionnel: { label: "Prévisionnel (non validé)", color: PURPLE, Icon: CircleDashed },
  en_cours: { label: "Prévisionnel (Validé)", color: AMBER, Icon: Clock3 },
  realise: { label: "Réalisé", color: GREEN, Icon: Check },
  annule: { label: "Annulé", color: RED, Icon: Ban },
};
const STATUS_ORDER = ["previsionnel", "en_cours", "realise", "annule"];
// Compatibilité : les évènements existants utilisaient l'ancien code
// "a_valider" — on les fait pointer vers "prévisionnel non validé".
const STATUS_ALIASES = { a_valider: "previsionnel" };
function normalizeStatut(statut) {
  return STATUS_ALIASES[statut] || statut || "previsionnel";
}

const PALETTE = [
  "#035D72", "#832750", "#6357F2", "#1E9E6B", "#302B77", "#FF4DA2", "#18191A",
  "#0C7A93", "#9B5346", "#3D6B8C", "#B8862E", "#2C7A4B", "#7B3F61", "#1D8A96",
];
// Éclaircit une couleur hex d'un certain montant (0-255), pour dériver
// une variante « douce » utilisable sur les éléments internes d'un
// en-tête coloré (badges, onglets inactifs…) quel que soit le rôle.
function lighten(hex, amt) {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
// Mélange deux couleurs hex (t = 0 → couleur a, t = 1 → couleur b).
// Sert à ramener la couleur de chaque rôle vers le teal institutionnel.
function mixHex(a, b, t) {
  const pa = parseInt(a.replace("#", ""), 16), pb = parseInt(b.replace("#", ""), 16);
  const ar = pa >> 16, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
  const br = pb >> 16, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return "#" + (0x1000000 + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
function colorFor(code) {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = code.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
// Couleur d'un·e intervenant·e : sa couleur personnalisée si elle a été
// choisie, sinon une couleur par défaut dérivée de son code.
function getIntervenantColor(code, intervenants) {
  const meta = intervenants?.find((i) => i.code === code);
  if (meta?.couleur) return meta.couleur;
  return colorFor(code);
}
// Choisit une couleur de la palette pas encore utilisée par un·e autre
// intervenant·e, pour garantir que chacun·e reste bien distinct·e.
function pickUnusedColor(intervenants) {
  const used = new Set((intervenants || []).map((i) => i.couleur).filter(Boolean));
  const free = PALETTE.find((c) => !used.has(c));
  return free || PALETTE[(intervenants?.length || 0) % PALETTE.length];
}

/* ============================================================
   TEMPS DE TRAVAIL — suivi par nature d'activité
   ------------------------------------------------------------
   Réservé aux chef·fes de projet et au·à la chef·fe d'équipe :
   permet de ventiler son temps par catégorie (terrain, pédagogie,
   administratif, management…) pour nourrir un pilotage individuel
   et collectif, en macro (global) comme en micro (par personne).
   ============================================================ */
const TEMPS_TRAVAIL_CATEGORIES = [
  { id: "intervention", label: "Temps opérationnel face public", color: "#035D72" },
  { id: "support", label: "Temps opérationnel de création pédagogique", color: "#1E9E6B" },
  { id: "preparation", label: "Temps opérationnel de préparation d'action", color: "#55CEB7" },
  { id: "administratif", label: "Temps opérationnel administratif", color: "#9B5346" },
  { id: "ingenierie", label: "Ingénierie / Réunion", color: "#6357F2" },
  { id: "management", label: "Management de projet", color: "#3D6B8C" },
  { id: "chefferie", label: "Temps chefferie de projet et de management", color: "#832750" },
  { id: "terrain", label: "Opérationnel terrain", color: "#B8862E" },
  { id: "autre", label: "Autre", color: "#5B6672" },
];
// Sous-ensemble proposé aux intervenant·es depuis « Mon espace » — les
// catégories les plus pertinentes pour leur quotidien de terrain.
const INTERVENANT_TT_CATEGORY_IDS = ["intervention", "support", "administratif", "preparation", "chefferie"];
const TEMPS_TRAVAIL_ROLES = new Set(["chef_projet", "chef_equipe"]);
// Suivi financier : chef d'équipe, secrétariat et chefs de projet peuvent
// déclarer et consulter — pas les chargé·es de projet ni les intervenant·es.
const FINANCE_ROLES = new Set(["chef_equipe", "secretariat", "chef_projet"]);
// Regroupements utilisés par le·la chef·fe d'équipe pour le repère
// « chefferie de projet » vs « terrain » demandé pour le pilotage.
const TT_CHEFFERIE_IDS = new Set(["chefferie", "management"]);
const TT_TERRAIN_IDS = new Set(["terrain", "intervention"]);
function ttCategorieMeta(id) {
  return TEMPS_TRAVAIL_CATEGORIES.find((c) => c.id === id) || TEMPS_TRAVAIL_CATEGORIES[TEMPS_TRAVAIL_CATEGORIES.length - 1];
}
// Calcule, pour un code intervenant donné, les heures des actions déjà
// planifiées dans l'agenda sur la période choisie — la « reliure »
// entre le planning et le temps de travail. Toute action planifiée est
// par nature un temps opérationnel face public.
function autoPlannedEntry(events, code, period, refMonth, refYear) {
  if (!code) return null;
  const mine = events.filter((e) => e.intervenants.includes(code) && matchesPeriodTT(e, period, refMonth, refYear));
  const hours = mine.reduce((s, e) => s + (getEventHours(e) || 0), 0);
  if (hours <= 0) return null;
  return {
    id: `auto-${code}-${period}-${refMonth || ""}-${refYear || ""}`, categorieId: "intervention",
    duree: Math.round(hours * 100) / 100, date: today, projetId: null,
    note: `Calculé automatiquement depuis l'agenda (${mine.length} action${mine.length > 1 ? "s" : ""} planifiée${mine.length > 1 ? "s" : ""})`,
    proprietaire: null, auto: true,
  };
}

/* ============================================================
   SUIVI FINANCIER — CA en cours, déclaration, suivi et pilotage
   ------------------------------------------------------------
   Repris du tableau de suivi de l'Institut Pasteur de Lille
   (Expertises, Projets subventionnés, Utilisation nom/logo,
   Mécénat). Accessible au chef d'équipe, au secrétariat et aux
   chefs de projet : ils peuvent déclarer les montants mensuels,
   suivre l'avancement et consulter le tableau de bord — les
   chiffres qui en ressortent sont ceux à transmettre au contrôle
   de gestion de l'IPL.
   ============================================================ */
const FINANCE_CATEGORIES = [
  { id: "expertise", label: "Expertises", color: "#035D72" },
  { id: "subvention", label: "Projets subventionnés", color: "#6357F2" },
  { id: "nom_logo", label: "Utilisation nom et logo", color: "#B8862E" },
  { id: "mecenat", label: "Mécénat", color: "#832750" },
];
// Pour les lignes « Expertises » uniquement : le domaine sur lequel porte
// la prestation — utile pour savoir combien de volume d'affaires vient de
// chaque champ d'expertise, indépendamment du client.
const TYPES_EXPERTISE = [
  "Santé mentale", "Activité physique", "Alimentation", "Nutrition", "Santé globale", "Autre",
];
function financeCategorieMeta(id) {
  return FINANCE_CATEGORIES.find((c) => c.id === id) || FINANCE_CATEGORIES[0];
}

/* ============================================================
   DEVIS — reprend très exactement la grille tarifaire interne
   « Feuille_de_calcul_devis_2026.xlsm » (feuilles CALCUL et
   Récapitulatif) et la trame Word R3-EN-02 (devis de prestation
   d'expertise en Éducation Santé, CPSL/CEPS).
   ============================================================ */
// Tarif journalier par profil — repris tel quel de la feuille CALCUL.
const DEVIS_TARIFS_JOUR = {
  "EMS": 750,
  "Diététicienne": 750,
  "EMS + Sophrologue": 790,
  "Responsable département": 950,
  "Ingénieur en Nutrition / CDP / NP": 920,
  "Médecin": 1350,
  "Dr Lecerf": 2100,
};
const DEVIS_PROFILS = Object.keys(DEVIS_TARIFS_JOUR);
// Les 4 phases de prestation de la feuille CALCUL — chaque profil peut
// intervenir sur n'importe laquelle, avec son propre nombre de journées.
const DEVIS_PHASES = ["Préparation", "Présentiel", "Temps déplacement", "Autre"];
// Paliers de marge et de sécurité déplacement — identiques dans le
// classeur (0 %, 10 %, 20 %, 30 %).
const DEVIS_PALIERS_PCT = [0, 0.1, 0.2, 0.3];
const DEVIS_TARIF_KM = 0.9;
const DEVIS_TARIF_REPAS = 18;
const DEVIS_TARIF_HOTEL = 120;
const DEVIS_TVA = 0.2; // 20 %, TTC = HT × 1.2 dans le classeur
const DEVIS_CODE_DOCUMENT = "CPSL/CEPS/R3-EN-02"; // code qualité fixe de la trame
const DEVIS_STATUT_META = {
  brouillon: { label: "Brouillon", color: MUTED, Icon: PenLine },
  en_cours_validation: { label: "En cours de validation", color: PURPLE, Icon: CircleDashed },
  valide: { label: "Validé", color: GREEN, Icon: Check },
  refuse: { label: "Refusé", color: RED, Icon: X },
};
const DEVIS_STATUT_ORDER = ["brouillon", "en_cours_validation", "valide", "refuse"];

// Calcule très exactement ce que fait le classeur Excel (feuilles CALCUL
// + Récapitulatif), pour ne jamais dériver du modèle de référence.
function calculDevis(d) {
  const lignesCout = (d.lignesPersonnel || []).reduce((s, l) => {
    const tarif = DEVIS_TARIFS_JOUR[l.profil] || 0;
    return s + tarif * (Number(l.nombreJournees) || 0);
  }, 0); // = CALCUL!E42

  const dep = d.deplacement || {};
  const totalDeplacementBrut =
    (Number(dep.km) || 0) * DEVIS_TARIF_KM +
    (Number(dep.peages) || 0) +
    (Number(dep.trainAvion) || 0) +
    (Number(dep.metroBusTaxi) || 0) +
    (Number(dep.autre) || 0) +
    (Number(dep.nombreRepas) || 0) * DEVIS_TARIF_REPAS +
    (Number(dep.nombreNuitsHotel) || 0) * DEVIS_TARIF_HOTEL; // = CALCUL!E66

  const margePct = DEVIS_PALIERS_PCT[d.margeIndex ?? 0] ?? 0;
  const securitePct = DEVIS_PALIERS_PCT[d.securiteIndex ?? 0] ?? 0;

  const interventionHT = Math.round((lignesCout + lignesCout * margePct) * 100) / 100; // Récap!E8
  const deplacementHT = Math.round((totalDeplacementBrut + totalDeplacementBrut * securitePct) * 100) / 100; // Récap!E13
  const totalHT = Math.round((interventionHT + deplacementHT) * 100) / 100; // Récap!E16
  const totalTTC = Math.round(totalHT * (1 + DEVIS_TVA) * 100) / 100; // Récap!G16

  const duree = Number(d.dureeSessionJours) || 0;
  const moyenneJournaliereHT = duree > 0 ? Math.round((totalHT / duree) * 100) / 100 : null;

  return {
    lignesCoutHT: Math.round(lignesCout * 100) / 100,
    totalDeplacementBrutHT: Math.round(totalDeplacementBrut * 100) / 100,
    margePct, securitePct,
    interventionHT, interventionTTC: Math.round(interventionHT * 1.2 * 100) / 100,
    deplacementHT, deplacementTTC: Math.round(deplacementHT * 1.2 * 100) / 100,
    totalHT, totalTTC,
    moyenneJournaliereHT,
  };
}
const FINANCE_MONTHS = [
  { key: "jan", label: "Janv." }, { key: "fev", label: "Févr." }, { key: "mar", label: "Mars" },
  { key: "avr", label: "Avr." }, { key: "mai", label: "Mai" }, { key: "juin", label: "Juin" },
  { key: "juil", label: "Juil." }, { key: "aout", label: "Août" }, { key: "sep", label: "Sept." },
  { key: "oct", label: "Oct." }, { key: "nov", label: "Nov." }, { key: "dec", label: "Déc." },
];
// Un montant peut être "-" (non applicable) dans les données d'origine :
// on le traite comme 0 dans les totaux sans jamais planter dessus.
function financeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function financeRealise(entry) {
  return Math.round(FINANCE_MONTHS.reduce((s, m) => s + financeNum(entry[m.key]), 0) * 100) / 100;
}
function financeEcart(entry) {
  return Math.round((financeNum(entry.prev) - financeRealise(entry)) * 100) / 100;
}
// « Atterrissage » (jargon reporting budgétaire) : la meilleure estimation
// du total sur l'année pour une ligne — le réalisé à date, plus ce qui
// reste en prévisionnel. Sert à anticiper où on va finir l'année, pas
// seulement où on en est aujourd'hui.
function financeAtterrissage(entry) {
  return Math.round((financeRealise(entry) + Math.max(0, financeEcart(entry))) * 100) / 100;
}
// Une ligne de suivi financier précise son année via le champ « annee »,
// qui peut être une année seule ("2026") ou une plage ("2024-2026") pour
// les financements pluriannuels. On la fait correspondre à l'année du
// tableau sélectionné (N-1 / N / N+1) — une ligne sans année précisée
// reste toujours visible, par prudence, plutôt que de disparaître.
function financeEntryMatchesYear(entry, year) {
  const raw = (entry.annee || "").toString().trim();
  if (!raw) return true;
  const nums = raw.match(/\d{4}/g);
  if (!nums || nums.length === 0) return true;
  const values = nums.map(Number);
  const lo = Math.min(...values), hi = Math.max(...values);
  return year >= lo && year <= hi;
}
// Objectifs par défaut (modifiables depuis le tableau de bord) — repris
// des objectifs 2026 du tableau d'origine.
const FINANCE_OBJECTIFS_DEFAULT = { ceps: 550000, educ: 485000, expertise: 50000 };

const FINANCE_SEED = [
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "Lactalis", type: "Expertise annuelle margarine Primevere + veille", prev: 10000, mar: 1000, avr: 1000, mai: 1000, juin: 1000, juil: 1000 },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "CETAF", type: "Formation AP", base: 550, prev: 2200, juin: 550, facture: 550, refFacture: "EDU0010" },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "Béthanie", type: "REP + ateliers", base: 7499, prev: 3750, fev: 1875, mar: 1000 },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "CS Marcq", type: "Conférences", base: 3000, n1: 1000, prev: 2000, jan: 0, mar: 1000, facture: 2000, refFacture: "EDU0008" },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "CIIL", type: "Conférence et mise en pratique", base: 675, prev: 675 },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "Ville de Laon", type: "Flash Forme et Expert Game", base: 2321, prev: 2321, avr: 2321, facture: 2321, refFacture: "EDU 004" },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "VIlle d'Ecaillon", type: "Cycle 7 ateliers ALAP dans le cadre de leur financement Phosphor'âge", base: 5220, prev: 5220, juil: 500 },
  { categorie: "expertise", theme: "Nutrition (alimentation et activité physique)", client: "Formation", type: "nutrition" },
  { categorie: "expertise", theme: "Santé mentale", client: "France Travail", type: "Webinaires santé mentale", base: 22500, n1: 2700, prev: 17500, jan: 1800, fev: 1800, mar: 1800, avr: 1800, mai: 1800, facture: 11700, refFacture: "EDU 003-EDU 006" },
  { categorie: "expertise", theme: "Santé mentale", client: "DRFIP", type: "Conférence \"Gestion du stress et santé mentale\"", base: 1012, prev: 1012 },
  { categorie: "expertise", theme: "Addictions", client: "CENTRALE LILLE", type: "CONFERENCE ADICTION", base: 3036, prev: 3036, avr: 3036, facture: 3036, refFacture: "EDU 004" },
  { categorie: "subvention", theme: null, client: "Programme Nutrissimo Junior", financeur: "Fondation des Lumières via Fondation de France", annee: "2024-2026", base: 48700, n1: 21000, prev: 27700, jan: 2240, fev: "-", mar: 500, mai: 2290, juin: 1500, juil: 1500, encaissement: 48700, solde: 0 },
  { categorie: "subvention", theme: null, client: "MRDVA", financeur: "ARS Vieillissement", annee: "2026", base: 61421, prev: 20473.67, juil: 500 },
  { categorie: "subvention", theme: null, client: "SAS", base: 15000, prev: 15000, juil: 500 },
  { categorie: "subvention", theme: null, client: "Nutrissimo Santé", financeur: "ARS Vieillissement", base: 29461, n1: 29461, prev: 0, fev: 0, encaissement: 29461, solde: 0 },
  { categorie: "subvention", theme: null, client: "Nutrissimo Santé", financeur: "AG2R La Mondiale", base: 80000, n1: 12229, prev: 67771, fev: 3000, mar: 1000, avr: 33750, mai: 500, juin: 1000 },
  { categorie: "subvention", theme: null, client: "Nutrissimo Santé", financeur: "Autofinancement IPL", base: 49500, n1: 2000, prev: 47500, mar: 500, avr: 500, mai: 2000, juin: 1000, juil: 3500 },
  { categorie: "subvention", theme: null, client: "IPL opérateur support en nutrition", financeur: "ARS DPPS", annee: "2025", base: 264000, n1: 236728, prev: 27272, jan: 13036, fev: 14236, encaissement: 203500, solde: 60500 },
  { categorie: "subvention", theme: null, client: "IPL opérateur support en nutrition", annee: "2026", base: 264000, prev: 264000, mar: 14694, avr: 26042, mai: 38833, juin: 72154, juil: 0, solde: 264000 },
  { categorie: "subvention", theme: null, client: "QPV Lille POPS", financeur: "Préfecture", annee: "2026", base: 5000, prev: 7589, mar: 500, encaissement: 7250, solde: 339 },
  { categorie: "subvention", theme: null, client: "QPV Lille POPS", financeur: "Ville de Lille", base: 2589 },
  { categorie: "subvention", theme: null, client: "QPV Villeneuve d'Ascq", financeur: "Préfecture 2026", annee: "2026", base: 9000, prev: 9000, fev: 1000, mar: 500, avr: 1000, mai: 1250, juin: 1000, juil: 500, solde: 18000 },
  { categorie: "subvention", theme: null, client: "QPV Villeneuve d'Ascq", financeur: "Ville de Villeneuve d'Ascq 2026", base: 9000, prev: 9000, mar: 500, avr: 1000, mai: 1250, juin: 1000, juil: 500 },
  { categorie: "subvention", theme: null, client: "AMI CALL", financeur: "Agglo de la CALL", annee: "2026", base: 6709.5, prev: 6709.5, mar: "-", mai: 500 },
  { categorie: "subvention", theme: null, client: "Journée Cœur des femmes", financeur: "Lille", annee: "2026", base: 13500, prev: 13500, mar: 1000, avr: 240, mai: 1000, juin: 6000, juil: 850, solde: 13500 },
  { categorie: "subvention", theme: null, client: "Journée Cœur des femmes", financeur: "Autofinancement IPL", base: 1120, prev: 1120, mar: 300, avr: 300, juin: 240, juil: 80 },
  { categorie: "subvention", theme: null, client: "Printemps de la Prévention", financeur: "Sponsoring Mutuelle GSMC", annee: "2026", base: 15000, prev: 15000, avr: 10000, mai: 2500, juin: 2500 },
  { categorie: "subvention", theme: null, client: "LA DREAL", annee: "2026", base: 10000, prev: 10000, juin: 500 },
  { categorie: "nom_logo", theme: null, client: "Lactalis", type: "Utilisation références jusque 2026", base: 130000, prev: 130000, jan: 10833.33, fev: 10833.33, mar: 10833.33, avr: 10833.33, mai: 10833.33, juin: 10834.33, juil: 10832.33 },
  { categorie: "mecenat", theme: null, client: "Lactalis", type: "Convention de mécénat 2018/2021" },
];

// Suggestions rapides pour « Gérer mon temps » — tâches récurrentes
// courantes en coordination de projets de prévention santé, pour éviter
// de tout ressaisir à la main à chaque fois.
const TACHE_SUGGESTIONS = [
  "Relancer un partenaire sans retour",
  "Préparer la réunion d'équipe",
  "Mettre à jour le planning des actions",
  "Vérifier les préinscriptions d'une session",
  "Rédiger le bilan d'une action",
  "Envoyer les convocations",
  "Préparer une mallette à outils",
  "Contacter un·e intervenant·e",
  "Valider un budget de projet",
  "Répondre aux mails en attente",
  "Préparer un COPIL / COTECH",
  "Mettre à jour un contact au secrétariat",
];

const PROFESSIONS = [
  "Chef·fe de projet",
  "Assistant·e chef·fe de projet",
  "Éducateur·rice médico-sportif·ve",
  "Diététicien·ne",
  "Ingénieur·e en nutrition",
  "Neuropsychologue",
  "Psychologue",
  "Sophrologue",
  "Coordination / administratif",
  "Équipe (collectif)",
  "À définir",
];
// Un·e intervenant·e peut exercer plusieurs métiers (ex. EMS ET
// sophrologue). On stocke désormais une liste `metiers`, tout en
// continuant de lire l'ancien champ `metier` (une seule valeur) pour
// ne rien perdre des données déjà saisies.
function intervenantMetiers(meta) {
  if (!meta) return [];
  if (Array.isArray(meta.metiers) && meta.metiers.length > 0) return meta.metiers;
  return meta.metier ? [meta.metier] : [];
}
function intervenantMetiersLabel(meta) {
  const list = intervenantMetiers(meta).filter((m) => m !== "À définir");
  return list.length > 0 ? list.join(" · ") : "À définir";
}

// Mode de déplacement pour se rendre à une action — utile pour savoir
// qui utilise un véhicule IPL, une location, ou son véhicule personnel
// (indemnités kilométriques à traiter différemment selon le cas).
const MODES_TRANSPORT = [
  "Véhicule IPL",
  "Location de véhicule",
  "Véhicule personnel",
  "Train / Avion",
  "Transports en commun",
  "Autre",
];
function transportMeta(mode) {
  const map = {
    "Véhicule IPL": { color: CARE, Icon: Car },
    "Location de véhicule": { color: PURPLE, Icon: Car },
    "Véhicule personnel": { color: AMBER, Icon: Car },
    "Train / Avion": { color: INK, Icon: PlaneTakeoff },
    "Transports en commun": { color: GREEN, Icon: Send },
    "Autre": { color: MUTED, Icon: Car },
  };
  return map[mode] || null;
}

const TYPES = [
  "REP", "Journée AP", "Journée Ali", "Journée SG", "Mallette à outils",
  "COTECH", "COPIL", "Réunion", "Réunion d'info", "Sensibilisation",
  "Coaching individuel", "Coaching collectif", "Évènement", "Suivi",
  "Échange", "Bilan", "Accompagnement", "Temps d'ingénierie",
  "Création de contenu", "Formation interne", "Communication",
  "Congé payé", "RTT", "JNT", "Congés / Vacances",
  "Jour férié / Fermeture", "Autre",
];

// Types "période / absence" pouvant s'étendre sur plusieurs jours
// (une date de fin peut alors être renseignée).
const TYPES_PERIODE = new Set(["Congés / Vacances", "Jour férié / Fermeture", "Congé payé", "RTT", "JNT"]);
// Types pour lesquels le lieu n'a pas de sens (absences, travail de fond).
const TYPES_SANS_LIEU = new Set([...TYPES_PERIODE, "Création de contenu"]);
// Types qui ne concernent personne en particulier (fermeture de structure).
const TYPES_SANS_INTERVENANT = new Set(["Jour férié / Fermeture"]);
// Conservé pour compatibilité de nommage historique.
const TYPES_SANS_LIEU_INTERVENANT = TYPES_SANS_LIEU;

const CATEGORIES = [
  "Form'action DDPP",
  "Journées de suivi",
  "ARS DOMS",
  "Sessions Printemps",
  "Accompagnement long",
  "Accompagnement court",
  "Soutien ARS",
  "Journées thématiques",
  "QPV",
  "Absences & congés",
];

/* ============================================================
   PROGRAMMES — regroupement de dossiers au-dessus des thématiques
   ------------------------------------------------------------
   Form'action DDPP, Journées de suivi, Accompagnement long/court
   et Soutien ARS relèvent tous du même programme financé par
   l'ARS. On les affiche sous une bannière commune pour que ce
   lien soit immédiatement lisible, en particulier pour les
   chargé·es/chef·fes de projet. (Nom du programme à confirmer —
   « ARS DDPP » est repris du libellé « Form'action DDPP » déjà
   présent dans les données d'origine.)
   ============================================================ */
const PROGRAMMES = [
  {
    id: "ars_dpps",
    label: "Programme ARS DPPS",
    description: "Form'action, journées de suivi, accompagnements long/court et soutien ARS — un même programme, financé par l'ARS.",
    categories: ["Form'action DDPP", "Journées de suivi", "Accompagnement long", "Accompagnement court", "Soutien ARS"],
  },
];
const programmeForCategorie = (cat) => PROGRAMMES.find((pr) => pr.categories.includes(cat)) || null;

const DEFAULT_ACCESS_CODE = "CEPS2026!";

/* ============================================================
   RÔLES D'ACCÈS
   ------------------------------------------------------------
   Chaque rôle a un mot de passe partagé de départ (pour rejoindre
   l'espace la première fois) ; chaque personne crée ensuite son
   propre profil (nom + mot de passe personnel), stocké dans
   « coord-accounts ». Comme pour le code d'accès précédent, ceci
   protège l'usage courant mais ne constitue pas un chiffrement :
   c'est un outil côté client, pas un vrai serveur d'authentification.
   ============================================================ */
const ROLES = [
  {
    id: "intervenant", label: "Intervenant·e", masterPassword: "CEPS2026!",
    tagline: "Éducateurs médico-sportifs, diététicien·nes, psychologues, sophrologues…",
    Icon: HeartHandshake, landingTab: "mon_espace", color: INK_SOFT,
  },
  {
    id: "charge_projet", label: "Chargé·e de projet", masterPassword: "CHARGER2026CEPS",
    tagline: "Suivi et mise à jour des actions au quotidien",
    Icon: Briefcase, landingTab: "mes_projets", color: FRESH_GREEN,
  },
  {
    id: "secretariat", label: "Secrétariat", masterPassword: "CEPSSECRETARIAT2026",
    tagline: "Contacts, logistique et informations administratives",
    Icon: ClipboardList, landingTab: "secretariat", color: MIDNIGHT_BLUE,
  },
  {
    id: "chef_projet", label: "Chef·fe de projet", masterPassword: "CEPSCHEF2026",
    tagline: "Pilotage et mise en avant de ses projets",
    Icon: Star, landingTab: "mes_projets", color: DARK_RASPBERRY,
  },
  {
    id: "chef_equipe", label: "Chef·fe d'équipe", masterPassword: "CEPSPILOTAGE2026",
    tagline: "Vue globale et pilotage de l'ensemble des projets",
    Icon: UserCog, landingTab: "pilotage", color: CARBON_BLACK,
  },
];
const roleMeta = (id) => ROLES.find((r) => r.id === id);
// Disposition de l'écran d'accueil : une rangée du "quotidien", et les
// deux rôles de responsabilité ("chef·fe de...") sur une rangée en dessous.
const ROLES_ROW_1 = ["intervenant", "charge_projet", "chef_projet"];
const ROLES_ROW_2 = ["secretariat", "chef_equipe"];
// Le plan de charge (heures/jours par intervenant·e) est réservé aux
// rôles qui pilotent l'équipe — pas besoin pour les intervenant·es
// ni les chargé·es de projet au quotidien.
// ============================================================
// INTERRUPTEUR TEMPORAIRE — désactive toutes les restrictions par
// rôle (onglets, édition de la planification, périmètre de projets)
// à la demande de l'utilisateur, le temps de tester/parcourir
// librement l'application. Remettre à `true` pour réactiver les
// verrous d'origine.
// ============================================================
const LOCKS_ENABLED = true;

const WORKLOAD_ROLES = new Set(["chef_projet", "chef_equipe", "secretariat"]);
// L'annuaire des intervenant·es (création de codes, métiers) est réservé
// au·à la chef·fe d'équipe. Les intervenant·es se rattachent elles/eux-mêmes
// à un code lors de la création de leur profil (ou depuis « Mon compte »),
// sans avoir besoin d'accéder à cet onglet de gestion.
const PEOPLE_ROLES = new Set(["chef_equipe"]);
// Rôles pouvant se rattacher à un code intervenant existant : les
// intervenant·es bien sûr, mais aussi les chef·fes de projet/d'équipe
// qui interviennent eux-mêmes sur le terrain — ce lien permet de
// relier automatiquement leurs actions planifiées à leur temps de travail.
const CAN_LINK_INTERVENANT_CODE = new Set(["intervenant", "chef_projet", "chef_equipe"]);

/* ============================================================
   REFERENTIEL PROJETS (dossiers)
   ============================================================ */
const PROJECTS_SEED = [
  { id: "P1", categorie: "Form'action DDPP", nom: "ML NPdC — Session 8", chargeDeProjet: "Olivier", structure: "ML NPdC", contact: "David Malbrancq — 07.80.90.10.10 / Olivier Meignotte — 06.66.88.88.62", notes: "7-8 préinscrits" },
  { id: "P2", categorie: "Form'action DDPP", nom: "Beuvry — Session 2", chargeDeProjet: "Léa", structure: "Beuvry", contact: "Mme Lemoine Delphine — 03.21.61.91.95", notes: "" },
  { id: "P3", categorie: "Form'action DDPP", nom: "ML Pays Picards — Session 9", chargeDeProjet: "Olivier", structure: "ML Pays Picards + autres structures ?", contact: "Sylvain Boitel — 07.49.22.74.70", notes: "6 préinscrits + attente retour de 4 personnes" },
  { id: "P4", categorie: "Form'action DDPP", nom: "CCFL (Flandres-Lys) — Session 14", chargeDeProjet: "Olivier (ARS)", structure: "CCFL, 500 rue de la Lys, 59253 La Gorgue", contact: "Hélène Boëns — 06.07.58.03.42 / 03.28.50.14.90", notes: "" },
  { id: "P5", categorie: "Form'action DDPP", nom: "Suite PSHdF Lens — Session 10", chargeDeProjet: "Olivier", structure: "Bruay-la-Buissière", contact: "Virginie Pourchez — 03.21.64.56.00 poste 6161 / 07.64.36.21.32", notes: "12/13 préinscrits" },
  { id: "P6", categorie: "Form'action DDPP", nom: "Suite PSHdF Château-Thierry — Session 12", chargeDeProjet: "Olivier", structure: "Château-Thierry", contact: "Mme Didier Audrey — 06.70.46.63.39", notes: "14 préinscrits" },
  { id: "P7", categorie: "Form'action DDPP", nom: "CS Arrageois — Session 7", chargeDeProjet: "Olivier", structure: "CS Arrageois", contact: "Jean-Marc Cachot — 03.21.59.41.37", notes: "Proposition en attente de retours" },
  { id: "P8", categorie: "Form'action DDPP", nom: "Boulogne-sur-Mer — Session 13", chargeDeProjet: "Olivier", structure: "Boulogne S/Mer", contact: "Charlotte Bonte (CLS) — 03.21.92.07.20 / 06.32.53.29.28", notes: "" },
  { id: "P9", categorie: "Journées de suivi", nom: "Journées de suivi partenaires", chargeDeProjet: "—", structure: "PEP, CCAS Amiens, CLS LHL, Oise, ML, Bénévoles BM, CS Audomarois, CLS Amiens, CS Froissy", contact: "voir chaque ligne", notes: "" },
  { id: "P10", categorie: "ARS DOMS", nom: "ARS DOMS - SAS (RIE + Sensibilisation)", chargeDeProjet: "AS", structure: "SAS", contact: "—", notes: "Prévisionnel au 27/07/26" },
  { id: "P11", categorie: "ARS DOMS", nom: "ARS DOMS - MRDVA CRT/PFR", chargeDeProjet: "AS", structure: "MRDVA CRT/PFR", contact: "—", notes: "Prévisionnel au 27/07/2026 — inclut les 8 packs AE" },
  { id: "P12", categorie: "Sessions Printemps", nom: "Sessions Printemps 2026 (1 à 6)", chargeDeProjet: "—", structure: "Compiègne, Lens, Château-Thierry, Aulnoye, Roye", contact: "—", notes: "" },
  { id: "P13a", categorie: "Accompagnement long", nom: "Acc. long — CLS LHL (3 structures)", chargeDeProjet: "Léa ou Aurélien", structure: "CLS LHL", contact: "—", notes: "Pas de réunion tripartite" },
  { id: "P13b", categorie: "Accompagnement long", nom: "Acc. long — Marly CS", chargeDeProjet: "Olivier", structure: "Marly CS", contact: "Stéphanie Moreau (ARS)", notes: "" },
  { id: "P13c", categorie: "Accompagnement long", nom: "Acc. long — ML Wattrelos", chargeDeProjet: "Léa", structure: "ML Wattrelos", contact: "Audrey Thomas (OM)", notes: "" },
  { id: "P14a", categorie: "Accompagnement court", nom: "Acc. court — CS Wasquehal", chargeDeProjet: "Aurélien", structure: "CS Wasquehal", contact: "—", notes: "" },
  { id: "P14b", categorie: "Accompagnement court", nom: "Acc. court — Lomme MD Solidarités", chargeDeProjet: "Aurélien", structure: "Lomme — MD Solidarités", contact: "—", notes: "À partir de septembre" },
  { id: "P14c", categorie: "Accompagnement court", nom: "Acc. court — EVS Caudry", chargeDeProjet: "Julie", structure: "EVS Caudry", contact: "—", notes: "" },
  { id: "P14d", categorie: "Accompagnement court", nom: "Acc. court — CS Marlière CR", chargeDeProjet: "Olivier → Julie", structure: "CS Marlière CR", contact: "—", notes: "" },
  { id: "P14e", categorie: "Accompagnement court", nom: "Acc. court — Impulsions MS", chargeDeProjet: "Olivier", structure: "Impulsions MS", contact: "—", notes: "" },
  { id: "P14f", categorie: "Accompagnement court", nom: "Acc. court — Lens (volet AP)", chargeDeProjet: "Olivier", structure: "Lens", contact: "—", notes: "" },
  { id: "P14g", categorie: "Accompagnement court", nom: "Acc. court — Raismes", chargeDeProjet: "Léa", structure: "Raismes", contact: "—", notes: "" },
  { id: "P14h", categorie: "Accompagnement court", nom: "Acc. court — Beuvry", chargeDeProjet: "Léa", structure: "Beuvry", contact: "—", notes: "" },
  { id: "P15a", categorie: "Soutien ARS", nom: "Soutien ARS — ERéCA", chargeDeProjet: "Olivier + Eric", structure: "Douaisis / Prisme", contact: "—", notes: "" },
  { id: "P15b", categorie: "Soutien ARS", nom: "Soutien ARS — Outils cancers", chargeDeProjet: "Olivier + Eric", structure: "CRCDC / ARS", contact: "—", notes: "" },
  { id: "P15c", categorie: "Soutien ARS", nom: "Soutien ARS — ANDES", chargeDeProjet: "Aurélien + Eric", structure: "ANDES / IPL", contact: "—", notes: "" },
  { id: "P15d", categorie: "Soutien ARS", nom: "Soutien ARS — Veille / Newsletter", chargeDeProjet: "Léa", structure: "—", contact: "—", notes: "4 envois en 2026" },
  { id: "P15e", categorie: "Soutien ARS", nom: "Soutien ARS — Accompagnement chargé·es mission ARS", chargeDeProjet: "Olivier", structure: "—", contact: "—", notes: "" },
  { id: "P16", categorie: "Journées thématiques", nom: "Journées du cœur des femmes 2026 — Lille", chargeDeProjet: "—", structure: "MDQ Les Moulins / MDQ Wazemmes", contact: "Barbara Crozes 03 20 53 45 05 / Manon Beauvisage 03 20 54 60 80", notes: "" },
  { id: "P17", categorie: "QPV", nom: "QPV Villeneuve d'Ascq 2026", chargeDeProjet: "Aurélien (+ Valentine)", structure: "CCAS / TER", contact: "—", notes: "Prévisionnel au 13 janvier 2026" },
  { id: "ABSENCES", categorie: "Absences & congés", nom: "Absences & congés de l'équipe", chargeDeProjet: "—", structure: "", contact: "—", notes: "Congés payés, RTT, JNT et autres absences déclarées par chacun·e depuis « Mon espace »." },
].map((p) => ({ featured: false, ...p }));

/* ============================================================
   REFERENTIEL INTERVENANTS
   ------------------------------------------------------------
   Les codes utilisés dans les tableaux correspondent à des
   personnes précises. Certaines correspondances ont été
   confirmées ; d'autres restent à préciser (nomComplet vide).
   ============================================================ */
const INTERVENANTS_SEED = [
  { code: "OM", nomComplet: "Olivier" },
  { code: "JP", nomComplet: "Julie" },
  { code: "LT", nomComplet: "Léa" },
  { code: "VM", nomComplet: "Valentine" },
  { code: "AS", nomComplet: "Aurélien" },
  { code: "EG", nomComplet: "Eric" },
  { code: "YY", nomComplet: "Younès" },
  { code: "MC", nomComplet: "" },
  { code: "ML", nomComplet: "" },
  { code: "Équipe", nomComplet: "Équipe" },
].map((i, idx) => ({ ...i, metier: i.code === "Équipe" ? "Équipe (collectif)" : "À définir", couleur: PALETTE[idx % PALETTE.length] }));

/* ============================================================
   EVENEMENTS — extraits des 6 photos de tableaux
   ============================================================ */
let _id = 1;
const nid = () => `E${_id++}`;
const ev = (o) => ({
  id: nid(), notes: "", intervenants: [], preinscrits: null, incertain: false,
  statut: "previsionnel", dureeHeures: null, commentaireIntervenant: "", dateFin: "",
  alerte: null, // { message, auteur, date } — signalée par un·e intervenant·e
  ...o,
});

const EVENTS_SEED = [
  // ---- P1 : ML NPdC — Session 8 ----
  ev({ projetId: "P1", categorie: "Form'action DDPP", type: "REP", date: "2026-07-09", horaire: "10h-11h30", lieu: "Visio", intervenants: ["OM", "JP"] }),
  ev({ projetId: "P1", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-08-27", horaire: "9h30-16h30", lieu: "MEM — 13 Ter Bd Schuman, 62000 Arras", intervenants: ["OM"] }),
  ev({ projetId: "P1", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-09-03", horaire: "9h30-16h30", lieu: "Salle Citadelle - IPL", intervenants: ["JP"] }),
  ev({ projetId: "P1", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-09-10", horaire: "9h30-16h30", lieu: "Salle Citadelle - IPL", intervenants: ["OM", "VM"] }),
  ev({ projetId: "P1", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-09-17", horaire: "9h30-16h30", lieu: "MEM — 13 Ter Bd Schuman, 62000 Arras", intervenants: ["OM", "JP"] }),

  // ---- P2 : Beuvry — Session 2 ----
  ev({ projetId: "P2", categorie: "Form'action DDPP", type: "REP", date: "2026-09-02", horaire: "14h-16h", lieu: "Visio", intervenants: ["OM", "LT"] }),
  ev({ projetId: "P2", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-09-16", horaire: "9h30-16h30", lieu: "Visio", intervenants: ["OM"] }),
  ev({ projetId: "P2", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-09-09", horaire: "9h30-16h30", lieu: "Visio", intervenants: ["LT"] }),
  ev({ projetId: "P2", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-09-23", horaire: "9h30-16h30", lieu: "Visio", intervenants: ["YY", "LT"] }),
  ev({ projetId: "P2", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-10-14", horaire: "9h30-16h30", lieu: "Visio", intervenants: ["OM", "LT"] }),

  // ---- P3 : ML Pays Picards — Session 9 ----
  ev({ projetId: "P3", categorie: "Form'action DDPP", type: "REP", date: "2026-08-31", horaire: "14h-15h30", lieu: "Visio", intervenants: ["OM"], notes: "Lien OK — envoyé le 11/08" }),
  ev({ projetId: "P3", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-10-08", horaire: "9h30-16h30", lieu: "27 route d'Hirson, Fontaine-les-Vervins", intervenants: ["OM"] }),
  ev({ projetId: "P3", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-10-01", horaire: "9h30-16h30", lieu: "Fontaine-les-Vervins", intervenants: ["VM"] }),
  ev({ projetId: "P3", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-09-24", horaire: "9h30-16h30", lieu: "Fontaine-les-Vervins", intervenants: ["OM", "VM"] }),
  ev({ projetId: "P3", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-10-15", horaire: "9h30-16h30", lieu: "Fontaine-les-Vervins", intervenants: ["OM", "VM"] }),

  // ---- P4 : CCFL (Flandres-Lys) — Session 14 ----
  ev({ projetId: "P4", categorie: "Form'action DDPP", type: "REP", date: "2026-09-08", horaire: "9h30-11h30", lieu: "Visio", intervenants: ["MC", "OM"], notes: "Lien OK — à envoyer" }),
  ev({ projetId: "P4", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-09-24", horaire: "9h30-16h30", lieu: "CCFL, 500 rue de la Lys, 59253 La Gorgue", intervenants: ["MC"] }),
  ev({ projetId: "P4", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-10-01", horaire: "9h30-16h30", lieu: "CCFL, La Gorgue", intervenants: ["JP"] }),
  ev({ projetId: "P4", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-10-08", horaire: "9h30-16h30", lieu: "CCFL, La Gorgue", intervenants: ["MC", "JP"] }),
  ev({ projetId: "P4", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-10-15", horaire: "9h30-16h30", lieu: "CCFL, La Gorgue", intervenants: ["MC", "JP"] }),

  // ---- P5 : Suite PSHdF Lens — Session 10 ----
  ev({ projetId: "P5", categorie: "Form'action DDPP", type: "REP", date: "2026-10-13", horaire: "—", lieu: "Visio", intervenants: ["MC", "JP"] }),
  ev({ projetId: "P5", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-11-12", horaire: "9h30-16h30", lieu: "Salle Damiens, 597 rue Émile Basly, 62700 Bruay-la-Buissière", intervenants: ["MC"] }),
  ev({ projetId: "P5", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-11-05", horaire: "9h30-16h30", lieu: "Salle Damiens, Bruay-la-Buissière", intervenants: ["JP"] }),
  ev({ projetId: "P5", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-11-19", horaire: "9h30-16h30", lieu: "Salle Damiens, Bruay-la-Buissière", intervenants: ["MC", "JP"] }),
  ev({ projetId: "P5", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-11-26", horaire: "9h30-16h30", lieu: "Salle Damiens, Bruay-la-Buissière", intervenants: ["MC", "JP"] }),

  // ---- P6 : Suite PSHdF Château-Thierry — Session 12 ----
  ev({ projetId: "P6", categorie: "Form'action DDPP", type: "REP", date: "2026-10-05", horaire: "10h-11h30", lieu: "Visio", intervenants: ["OM", "JP"], notes: "Lien OK — à envoyer" }),
  ev({ projetId: "P6", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-11-02", horaire: "9h30/10h-16h30", lieu: "Château-Thierry", intervenants: ["OM"] }),
  ev({ projetId: "P6", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-11-09", horaire: "9h30/10h-16h30", lieu: "Château-Thierry", intervenants: ["LT"] }),
  ev({ projetId: "P6", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-11-16", horaire: "9h30/10h-16h30", lieu: "Château-Thierry", intervenants: ["JP", "LT"] }),
  ev({ projetId: "P6", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-11-23", horaire: "9h30/10h-16h30", lieu: "Château-Thierry", intervenants: ["OM", "JP"] }),

  // ---- P7 : CS Arrageois — Session 7 ----
  ev({ projetId: "P7", categorie: "Form'action DDPP", type: "REP", date: "2026-09-29", horaire: "14h-15h30", lieu: "Visio", intervenants: ["MC", "JP"] }),
  ev({ projetId: "P7", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-11-10", horaire: "9h30-16h30", lieu: "CS Arrageois", intervenants: ["MC"] }),
  ev({ projetId: "P7", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-11-17", horaire: "9h30-16h30", lieu: "CS Arrageois", intervenants: ["JP"] }),
  ev({ projetId: "P7", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-11-24", horaire: "9h30-16h30", lieu: "CS Arrageois", intervenants: ["MC", "JP"] }),
  ev({ projetId: "P7", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-12-01", horaire: "9h30-16h30", lieu: "CS Arrageois", intervenants: ["MC", "LT"], notes: "MC + LT ou JP" }),

  // ---- P8 : Boulogne-sur-Mer — Session 13 ----
  ev({ projetId: "P8", categorie: "Form'action DDPP", type: "REP", date: "2026-11-03", horaire: "10h-12h", lieu: "Visio", intervenants: ["OM", "VM"], notes: "Lien OK — à envoyer" }),
  ev({ projetId: "P8", categorie: "Form'action DDPP", type: "Journée AP", date: "2026-11-17", horaire: "9h30-16h30", lieu: "Boulogne-sur-Mer", intervenants: ["OM"] }),
  ev({ projetId: "P8", categorie: "Form'action DDPP", type: "Journée Ali", date: "2026-11-24", horaire: "9h30-16h30", lieu: "Boulogne-sur-Mer", intervenants: ["VM"] }),
  ev({ projetId: "P8", categorie: "Form'action DDPP", type: "Journée SG", date: "2026-12-01", horaire: "9h30-16h30", lieu: "Boulogne-sur-Mer", intervenants: ["OM", "VM"], notes: "OM ou JP + VM" }),
  ev({ projetId: "P8", categorie: "Form'action DDPP", type: "Mallette à outils", date: "2026-12-08", horaire: "9h30-16h30", lieu: "Boulogne-sur-Mer", intervenants: ["OM", "VM"], notes: "OM ou JP + VM" }),

  // ---- P9 : Journées de suivi ----
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-09-09", horaire: "9h30-16h", lieu: "Laon, Aisne — 34 rue du Bouloir", intervenants: ["OM"], notes: "PEP — contact Pascal Kraft", preinscrits: 5 }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-09-22", horaire: "—", lieu: "", intervenants: ["OM", "LT"], notes: "CCAS Amiens — 22 ou 29/09/2026 — contact Ludovic Cornière 06.11.44.65.05", incertain: true }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-10-06", horaire: "—", lieu: "Salle Citadelle - IPL", intervenants: ["AS", "LT"], notes: "CLS LHL — contact Virginie Mouronval 06.85.42.98.43", preinscrits: 2 }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-10-13", horaire: "—", lieu: "", intervenants: ["OM", "LT"], notes: "Oise — 13/10 ou 12/11 — contact Olivier Meignotte 06.66.88.88.62 — 3 sur chacune des dates", incertain: true }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-11-24", horaire: "9h30-16h30", lieu: "Salle Citadelle - IPL", intervenants: ["OM", "LT"], notes: "ML — contact Olivier Meignotte 06.66.88.88.62", preinscrits: 9 }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-11-30", horaire: "9h30-16h", lieu: "Centre social Vachala, Lens", intervenants: ["AS", "LT"], notes: "Bénévoles BM — contact Valérie Fornies 06.80.75.51.75" }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-12-10", horaire: "—", lieu: "", intervenants: ["JP", "VM"], notes: "CS Audomarois — 10/12, 15/12 ou 17/12 — contact Valérie Fornies 06.80.75.51.75", incertain: true }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "2026-12-18", horaire: "—", lieu: "Espace Danièle Rousseau (?)", intervenants: ["OM", "LT"], notes: "CLS Amiens — 18/12 ou 12/01/2027 — contact Axelle Sueur 03.22.97.12.34", incertain: true }),
  ev({ projetId: "P9", categorie: "Journées de suivi", type: "Suivi", date: "", horaire: "—", lieu: "", intervenants: ["JP"], notes: "CS Froissy — JP par tél. ou associé au suivi de l'Oise", incertain: true }),

  // ---- P10 : ARS DOMS - SAS ----
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Réunion d'info", date: "2026-09-22", horaire: "10h-12h", lieu: "Visio", intervenants: ["AS", "JP"], notes: "RIE — réunion d'info pour SAS" }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Réunion d'info", date: "2026-09-22", horaire: "14h-16h", lieu: "Visio", intervenants: ["AS", "JP"], notes: "RIE — réunion d'info pour SAS" }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Réunion d'info", date: "2026-09-28", horaire: "10h-12h", lieu: "Visio", intervenants: ["AS", "JP"], notes: "RIE — réunion d'info pour SAS" }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Réunion d'info", date: "2026-09-28", horaire: "14h-16h", lieu: "Visio", intervenants: ["AS", "JP"], notes: "RIE — réunion d'info pour SAS" }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Réunion d'info", date: "2026-10-05", horaire: "10h-12h", lieu: "Visio", intervenants: ["AS"], notes: "RIE — réunion d'info pour SAS" }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Réunion d'info", date: "2026-10-05", horaire: "14h-16h", lieu: "Visio", intervenants: ["AS"], notes: "RIE — réunion d'info pour SAS" }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Sensibilisation", date: "2026-10-12", horaire: "13h30-16h30", lieu: "", intervenants: ["AS", "JP"] }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Sensibilisation", date: "2026-11-03", horaire: "13h30-16h30", lieu: "", intervenants: ["AS", "VM"] }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Sensibilisation", date: "2026-11-12", horaire: "13h30-16h30", lieu: "", intervenants: ["AS", "JP"] }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Sensibilisation", date: "2026-11-19", horaire: "13h30-16h30", lieu: "", intervenants: ["AS", "VM"] }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Sensibilisation", date: "2026-11-26", horaire: "13h30-16h30", lieu: "", intervenants: ["AS", "VM"] }),
  ev({ projetId: "P10", categorie: "ARS DOMS", type: "Sensibilisation", date: "2026-12-03", horaire: "13h30-16h30", lieu: "Visio", intervenants: ["AS", "JP"] }),

  // ---- P11 : ARS DOMS - MRDVA CRT/PFR ----
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "COTECH", date: "2026-11-25", horaire: "10h-12h", lieu: "Visio", intervenants: ["AS"], notes: "COPIL & COTECH — 25 ou 27 novembre 2026", incertain: true }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Réunion", date: "2027-01-18", horaire: "14h-16h", lieu: "", intervenants: ["AS", "LT"], notes: "RIEP" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Réunion", date: "2027-01-21", horaire: "14h-16h", lieu: "", intervenants: ["AS", "JP"], notes: "RIEP" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Réunion", date: "2027-01-26", horaire: "14h-16h", lieu: "", intervenants: ["AS", "VM"], notes: "RIEP" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Réunion", date: "2027-01-28", horaire: "14h-16h", lieu: "", intervenants: ["AS", "JP"], notes: "RIEP" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Réunion", date: "2027-02-01", horaire: "14h-16h", lieu: "Visio", intervenants: ["AS", "LT"], notes: "RIEP" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Réunion", date: "2027-02-15", horaire: "10h-12h", lieu: "", intervenants: ["Équipe"], notes: "SC en équipe" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-03-08", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 1 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-03-15", horaire: "9h30-16h30", lieu: "AE", intervenants: ["JP"], notes: "Pack 1 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-03-11", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 2 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-03-18", horaire: "9h30-16h30", lieu: "AE", intervenants: ["LT"], notes: "Pack 2 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-04-05", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 3 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-04-12", horaire: "9h30-16h30", lieu: "AE", intervenants: ["JP"], notes: "Pack 3 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-04-08", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 4 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-04-15", horaire: "9h30-16h30", lieu: "AE", intervenants: ["VM"], notes: "Pack 4 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-04-06", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 5 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-04-13", horaire: "9h30-16h30", lieu: "AE", intervenants: ["LT"], notes: "Pack 5 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-05-03", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 6 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-05-10", horaire: "9h30-16h30", lieu: "AE", intervenants: ["JP"], notes: "Pack 6 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-05-04", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 7 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-05-11", horaire: "9h30-16h30", lieu: "AE", intervenants: ["VM"], notes: "Pack 7 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée AP", date: "2027-05-27", horaire: "9h30-16h30", lieu: "AE", intervenants: ["AS"], notes: "Pack 8 AE" }),
  ev({ projetId: "P11", categorie: "ARS DOMS", type: "Journée Ali", date: "2027-06-03", horaire: "9h30-16h30", lieu: "AE", intervenants: ["VM"], notes: "Pack 8 AE" }),

  // ---- P12 : Sessions Printemps 2026 ----
  ev({ projetId: "P12", categorie: "Sessions Printemps", type: "Autre", date: "2026-03-24", horaire: "—", lieu: "Compiègne", intervenants: ["EG", "LT"], notes: "Session 1" }),
  ev({ projetId: "P12", categorie: "Sessions Printemps", type: "Autre", date: "2026-03-26", horaire: "—", lieu: "Lens", intervenants: ["OM", "JP"], notes: "Session 2" }),
  ev({ projetId: "P12", categorie: "Sessions Printemps", type: "Autre", date: "2026-03-31", horaire: "—", lieu: "Château-Thierry", intervenants: [], notes: "Session 3" }),
  ev({ projetId: "P12", categorie: "Sessions Printemps", type: "Autre", date: "2026-04-02", horaire: "—", lieu: "Aulnoye-Aymeries", intervenants: ["EG", "LT"], notes: "Session 4" }),
  ev({ projetId: "P12", categorie: "Sessions Printemps", type: "Autre", date: "2026-04-07", horaire: "—", lieu: "Lens", intervenants: ["OM", "JP"], notes: "Session 5" }),
  ev({ projetId: "P12", categorie: "Sessions Printemps", type: "Autre", date: "2026-04-09", horaire: "—", lieu: "Roye", intervenants: ["OM", "LT"], notes: "Session 6" }),

  // ---- P13a : Acc long — CLS LHL ----
  ev({ projetId: "P13a", categorie: "Accompagnement long", type: "Échange", date: "2026-02-13", horaire: "—", lieu: "", intervenants: ["LT"], notes: "Journée méthodo commune à 3 structures (pas de réunion tripartite)" }),

  // ---- P13b : Acc long — Marly CS ----
  ev({ projetId: "P13b", categorie: "Accompagnement long", type: "Réunion", date: "2026-04-17", horaire: "—", lieu: "Visio", intervenants: ["OM"], notes: "1ère réunion tripartite, avec ARS (Stéphanie Moreau)" }),
  ev({ projetId: "P13b", categorie: "Accompagnement long", type: "Échange", date: "2026-05-06", horaire: "13h45-16h15", lieu: "", intervenants: ["OM", "EG"], notes: "2ème échange" }),
  ev({ projetId: "P13b", categorie: "Accompagnement long", type: "Échange", date: "2026-05-29", horaire: "9h-12h", lieu: "", intervenants: ["OM"], notes: "3ème échange" }),
  ev({ projetId: "P13b", categorie: "Accompagnement long", type: "Échange", date: "2026-06-11", horaire: "10h-13h", lieu: "", intervenants: ["JP"], notes: "4ème échange" }),

  // ---- P13c : Acc long — ML Wattrelos ----
  ev({ projetId: "P13c", categorie: "Accompagnement long", type: "Échange", date: "2026-05-12", horaire: "—", lieu: "Téléphone", intervenants: ["LT"], notes: "1er échange tél. + envoi mail récap + échange en parallèle avec Audrey Thomas (OM), transmission du projet à Léa" }),
  ev({ projetId: "P13c", categorie: "Accompagnement long", type: "Échange", date: "2026-06-09", horaire: "13h30-16h30", lieu: "", intervenants: ["LT"], notes: "1ère rencontre physique entre LT et ML" }),

  // ---- P14a : Acc court — CS Wasquehal ----
  ev({ projetId: "P14a", categorie: "Accompagnement court", type: "REP", date: "2026-03-12", horaire: "après-midi", lieu: "", intervenants: ["AS"], notes: "1er échange (réunion tripartite ?)" }),
  ev({ projetId: "P14a", categorie: "Accompagnement court", type: "Échange", date: "2026-04-22", horaire: "—", lieu: "", intervenants: ["AS", "LT"], notes: "2ème échange — journée méthodo + travail AS et LT de prépa" }),
  ev({ projetId: "P14a", categorie: "Accompagnement court", type: "Journée Ali", date: "2026-06-02", horaire: "—", lieu: "", intervenants: ["LT"], notes: "3ème échange — journée Ali" }),
  ev({ projetId: "P14a", categorie: "Accompagnement court", type: "Bilan", date: "2026-07-01", horaire: "—", lieu: "", intervenants: ["LT"], notes: "4ème échange — journée évaluation" }),

  // ---- P14b : Acc court — Lomme MD Solidarités ----
  ev({ projetId: "P14b", categorie: "Accompagnement court", type: "Échange", date: "2026-09-01", horaire: "—", lieu: "", intervenants: [], notes: "1er échange, à partir de septembre", incertain: true }),

  // ---- P14c : Acc court — EVS Caudry ----
  ev({ projetId: "P14c", categorie: "Accompagnement court", type: "Échange", date: "2026-04-10", horaire: "—", lieu: "", intervenants: ["JP"], notes: "1er échange" }),

  // ---- P14d : Acc court — CS Marlière CR ----
  ev({ projetId: "P14d", categorie: "Accompagnement court", type: "Échange", date: "2026-04-16", horaire: "—", lieu: "Téléphone", intervenants: ["OM"], notes: "1er échange, par tél." }),
  ev({ projetId: "P14d", categorie: "Accompagnement court", type: "Échange", date: "2026-06-08", horaire: "9h30-11h30", lieu: "", intervenants: ["OM", "JP"], notes: "2ème échange" }),
  ev({ projetId: "P14d", categorie: "Accompagnement court", type: "Échange", date: "2026-06-29", horaire: "9h30-11h30", lieu: "", intervenants: [], notes: "3ème échange" }),

  // ---- P14e : Acc court — Impulsions MS ----
  ev({ projetId: "P14e", categorie: "Accompagnement court", type: "Échange", date: "2026-06-02", horaire: "—", lieu: "", intervenants: [], notes: "1er échange" }),

  // ---- P14h : Acc court — Beuvry (accompagnement) ----
  ev({ projetId: "P14h", categorie: "Accompagnement court", type: "Réunion", date: "2026-04-30", horaire: "—", lieu: "Visio", intervenants: [], notes: "1er échange — visio n°1" }),
  ev({ projetId: "P14h", categorie: "Accompagnement court", type: "Échange", date: "2026-06-03", horaire: "—", lieu: "", intervenants: ["LT"], notes: "2ème échange" }),
  ev({ projetId: "P14h", categorie: "Accompagnement court", type: "Échange", date: "2026-06-29", horaire: "—", lieu: "", intervenants: ["LT"], notes: "3ème échange" }),

  // ---- P15a : Soutien ARS — ERéCA ----
  ev({ projetId: "P15a", categorie: "Soutien ARS", type: "Réunion", date: "2026-03-10", horaire: "matin", lieu: "", intervenants: ["OM", "EG"], notes: "Présentation CLS et CLSM Douai" }),
  ev({ projetId: "P15a", categorie: "Soutien ARS", type: "Autre", date: "2026-03-17", horaire: "—", lieu: "", intervenants: ["YY"], notes: "Travail interne (17/03 au 30/04)" }),
  ev({ projetId: "P15a", categorie: "Soutien ARS", type: "Réunion", date: "2026-04-30", horaire: "matin", lieu: "", intervenants: ["OM", "EG"], notes: "Travail avec Prisme" }),
  ev({ projetId: "P15a", categorie: "Soutien ARS", type: "Réunion", date: "2026-06-16", horaire: "matin", lieu: "", intervenants: ["OM", "EG"], notes: "Présentation structures Douaisis" }),
  ev({ projetId: "P15a", categorie: "Soutien ARS", type: "Réunion", date: "2026-06-26", horaire: "après-midi", lieu: "", intervenants: ["OM", "EG"], notes: "Présentation ARS" }),

  // ---- P15c : Soutien ARS — ANDES ----
  ev({ projetId: "P15c", categorie: "Soutien ARS", type: "COPIL", date: "", horaire: "—", lieu: "", intervenants: ["AS", "EG"], notes: "COPIL début d'année, création journée AP, création journée outils spécifique AP, travail commun diét. ANDES & IPL, 3 webinaires AP, animation journée mallette à outils, COPIL fin" }),

  // ---- P15d : Soutien ARS — Veille / Newsletter ----
  ev({ projetId: "P15d", categorie: "Soutien ARS", type: "Autre", date: "2026-03-13", horaire: "—", lieu: "", intervenants: ["LT"], notes: "Envoi 1" }),
  ev({ projetId: "P15d", categorie: "Soutien ARS", type: "Autre", date: "2026-06-12", horaire: "—", lieu: "", intervenants: ["LT"], notes: "Envoi 2" }),
  ev({ projetId: "P15d", categorie: "Soutien ARS", type: "Autre", date: "2026-09-11", horaire: "—", lieu: "", intervenants: ["LT"], notes: "Envoi 3" }),
  ev({ projetId: "P15d", categorie: "Soutien ARS", type: "Autre", date: "2026-12-15", horaire: "—", lieu: "", intervenants: ["LT"], notes: "Envoi 4" }),

  // ---- P15e : Soutien ARS — Accompagnement chargé·es mission ARS ----
  ev({ projetId: "P15e", categorie: "Soutien ARS", type: "Accompagnement", date: "2026-06-18", horaire: "—", lieu: "", intervenants: ["OM"], notes: "Outils pour tous" }),

  // ---- P16 : Journées du cœur des femmes — Session 1 (Moulins) ----
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-05-13", horaire: "14h-16h", lieu: "MDQ Les Moulins — Local Tévise, 27A rue Jean Jaurès, Porte 002", intervenants: ["OM"], notes: "AP / Sédentarité — Session 1" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-06-03", horaire: "14h-16h", lieu: "MDQ Les Moulins", intervenants: ["JP"], notes: "Alimentation — Session 1" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-06-17", horaire: "14h-16h", lieu: "MDQ Les Moulins", intervenants: ["ML"], notes: "Stress / Sommeil — Session 1" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-06-24", horaire: "14h-16h", lieu: "MDQ Les Moulins", intervenants: ["OM", "JP"], notes: "Fixation objectifs — Session 1" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Suivi", date: "2026-10-07", horaire: "14h-16h", lieu: "MDQ Les Moulins", intervenants: ["OM", "JP"], notes: "Suivi à 3 mois — Session 1" }),

  // ---- P16 : Journées du cœur des femmes — Session 2 (Wazemmes) ----
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-06-08", horaire: "14h-16h", lieu: "MDQ Wazemmes — Local Bien-être, 162 rue de Wazemmes", intervenants: ["OM"], notes: "AP / Sédentarité — Session 2" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-06-29", horaire: "14h-16h", lieu: "MDQ Wazemmes", intervenants: ["JP"], notes: "Alimentation — Session 2" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-06-15", horaire: "14h-16h", lieu: "MDQ Wazemmes", intervenants: ["ML"], notes: "Stress / Sommeil — Session 2" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Coaching collectif", date: "2026-07-06", horaire: "14h-16h", lieu: "MDQ Wazemmes", intervenants: ["OM", "JP"], notes: "Fixation objectifs — Session 2" }),
  ev({ projetId: "P16", categorie: "Journées thématiques", type: "Suivi", date: "2026-10-05", horaire: "14h-16h", lieu: "MDQ Wazemmes", intervenants: ["OM", "JP"], notes: "Suivi à 3 mois — Session 2" }),

  // ---- P17 : QPV Villeneuve d'Ascq — COTECH ----
  ev({ projetId: "P17", categorie: "QPV", type: "COTECH", date: "2026-03-10", horaire: "14h-16h30", lieu: "CCAS", intervenants: ["AS", "VM"], notes: "COTECH 1 — Orga partie CBEC + carto" }),
  ev({ projetId: "P17", categorie: "QPV", type: "COTECH", date: "2026-03-24", horaire: "14h-16h30", lieu: "CCAS", intervenants: ["AS"], notes: "COTECH 2 — orga CBEI + AE" }),
  ev({ projetId: "P17", categorie: "QPV", type: "COTECH", date: "2026-05-05", horaire: "14h-16h30", lieu: "CCAS", intervenants: ["AS", "VM"], notes: "COTECH 3 — Pour FFBE" }),

  // ---- P17 : QPV — Cycle 1 ----
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching individuel", date: "2026-03-31", horaire: "9h-16h30", lieu: "CCAS", intervenants: ["AS"], notes: "TER 1 — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching individuel", date: "2026-04-28", horaire: "9h-16h30", lieu: "CCAS", intervenants: ["VM"], notes: "TER 2 — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching individuel", date: "2026-05-12", horaire: "9h-16h30", lieu: "CCAS", intervenants: ["VM"], notes: "TER 3 — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-05-13", horaire: "9h30-11h", lieu: "CCAS", intervenants: ["AS", "VM"], notes: "Atelier 1 — Représentation AP + tests — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-05-20", horaire: "9h30-11h", lieu: "CCAS", intervenants: ["VM"], notes: "Atelier 2 — Renfo musculaire — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-06-27", horaire: "9h30-11h", lieu: "CCAS", intervenants: ["VM"], notes: "Atelier 3 — Marche / glanage — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-06-10", horaire: "9h30-11h", lieu: "CCAS", intervenants: ["VM"], notes: "Atelier 4 — ALI 1 — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-06-17", horaire: "9h30-11h", lieu: "CCAS", intervenants: ["VM"], notes: "Atelier 5 — ALI 2 — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Bilan", date: "2026-06-24", horaire: "9h30-11h", lieu: "CCAS", intervenants: ["AS", "VM"], notes: "Atelier 6 — Bilan collectif — Cycle 1" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Évènement", date: "2026-09-30", horaire: "13h-17h", lieu: "CCAS", intervenants: ["Équipe"], notes: "Évènement FFBE — Cycle 1" }),

  // ---- P17 : QPV — Cycle 2 ----
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching individuel", date: "2026-06-19", horaire: "9h-16h30", lieu: "CCAS", intervenants: ["AS"], notes: "TER 4 — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching individuel", date: "2026-09-11", horaire: "9h-16h30", lieu: "CCAS", intervenants: ["AS"], notes: "TER 5 — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching individuel", date: "2026-09-18", horaire: "9h-16h30", lieu: "CCAS", intervenants: ["AS"], notes: "TER 6 — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-09-25", horaire: "14h-15h30", lieu: "CCAS", intervenants: ["AS", "VM"], notes: "Atelier 1 — Représentation AP + tests — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-10-02", horaire: "14h-15h30", lieu: "CCAS", intervenants: ["AS"], notes: "Atelier 2 — Renfo musculaire — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-10-09", horaire: "14h-15h30", lieu: "CCAS", intervenants: ["AS"], notes: "Atelier 3 — Marche / glanage — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-10-16", horaire: "14h-15h30", lieu: "CCAS", intervenants: ["VM"], notes: "Atelier 4 — ALI 1 — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Coaching collectif", date: "2026-11-06", horaire: "14h-15h30", lieu: "CCAS", intervenants: ["VM"], notes: "Atelier 5 — ALI 2 — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Bilan", date: "2026-11-13", horaire: "14h-15h30", lieu: "CCAS", intervenants: ["AS"], notes: "Atelier 6 — Bilan collectif — Cycle 2" }),
  ev({ projetId: "P17", categorie: "QPV", type: "Évènement", date: "2026-09-30", horaire: "13h-17h", lieu: "CCAS", intervenants: ["Équipe"], notes: "Évènement FFBE — Cycle 2" }),

  // ---- P17 : QPV — Accompagnement éducatif ----
  ev({ projetId: "P17", categorie: "QPV", type: "Accompagnement", date: "2026-09-10", horaire: "9h30-16h30", lieu: "CCAS", intervenants: [], notes: "Accompagnement éducatif (AE)" }),
];

/* ============================================================
   HELPERS
   ============================================================ */
const monthLabel = (iso) => {
  if (!iso) return "Sans date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtDateRange = (e) => {
  if (!e.date) return "—";
  if (!e.dateFin || e.dateFin === e.date) return fmtDate(e.date);
  const d1 = new Date(e.date + "T00:00:00");
  const d2 = new Date(e.dateFin + "T00:00:00");
  const sameYear = d1.getFullYear() === d2.getFullYear();
  const start = d1.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: sameYear ? undefined : "numeric" });
  return `${start} → ${fmtDate(e.dateFin)}`;
};
const dow = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short" });
};
const today = new Date().toISOString().slice(0, 10);

function parseTimeToken(tok) {
  if (!tok) return null;
  const m = tok.match(/(\d{1,2})\s*h\s*(\d{1,2})?/i);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(min) ? 0 : min);
}
function parseHoraireHours(horaire) {
  if (!horaire) return null;
  const clean = horaire.replace(/–|—/g, "-");
  const parts = clean.split("-").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const startTok = parts[0].split("/")[0];
  const endTok = parts[parts.length - 1];
  const start = parseTimeToken(startTok);
  const end = parseTimeToken(endTok);
  if (start === null || end === null) return null;
  const diff = end - start;
  if (diff <= 0) return null;
  return Math.round((diff / 60) * 100) / 100;
}
function isMissingInfo(e) {
  const missing = [];
  if (!TYPES_SANS_LIEU.has(e.type) && (!e.lieu || e.lieu.trim() === "" || e.lieu.trim() === "—")) missing.push("lieu");
  if (!TYPES_SANS_INTERVENANT.has(e.type) && (!e.intervenants || e.intervenants.length === 0)) missing.push("intervenant");
  return missing;
}
// Durée d'un évènement : priorité à une durée saisie directement en heures
// (utile pour les absences ou le temps de création de contenu, où il n'y a
// pas d'horaire de type "9h30-16h30"), sinon on tente de la déduire du
// champ horaire.
function getEventHours(e) {
  if (e.dureeHeures !== null && e.dureeHeures !== undefined && e.dureeHeures !== "") {
    const n = Number(e.dureeHeures);
    if (Number.isFinite(n)) return n;
  }
  return parseHoraireHours(e.horaire);
}
// Taux de réalisation d'un ensemble d'évènements : les annulés sont
// exclus du dénominateur (ils ne comptent pas comme "à faire").
function computeCompletion(events) {
  const total = events.length;
  const realise = events.filter((e) => normalizeStatut(e.statut) === "realise").length;
  const annule = events.filter((e) => normalizeStatut(e.statut) === "annule").length;
  const denom = total - annule;
  const pct = denom > 0 ? Math.round((realise / denom) * 100) : null;
  return { total, realise, annule, pct };
}
// Rapprochement souple entre un nom de personne et le champ texte libre
// "chargé de projet" (ex. "Léa ou Aurélien", "Olivier → Julie").
function matchesPerson(chargeDeProjetText, nom) {
  if (!chargeDeProjetText || !nom) return false;
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const first = norm(nom).split(" ")[0];
  if (!first) return false;
  return norm(chargeDeProjetText).includes(first);
}
// Liste des mois (YYYY-MM) couverts par un évènement, en tenant compte
// d'une éventuelle date de fin (congés, formations sur plusieurs jours...).
function monthsSpanned(e) {
  if (!e.date) return [];
  const start = new Date(e.date + "T00:00:00");
  const end = e.dateFin ? new Date(e.dateFin + "T00:00:00") : start;
  if (end < start) return [e.date.slice(0, 7)];
  const months = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}
// Nombre de jours couverts par un évènement (utile pour les absences).
function daysCount(e) {
  if (!e.date) return 0;
  if (!e.dateFin || e.dateFin === e.date) return 1;
  const d1 = new Date(e.date + "T00:00:00");
  const d2 = new Date(e.dateFin + "T00:00:00");
  const diff = Math.round((d2 - d1) / 86400000) + 1;
  return diff > 0 ? diff : 1;
}
const shiftMonth = (key, delta) => {
  const d = new Date(key + "-01T00:00:00");
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* ============================================================
   PETITS COMPOSANTS UI
   ============================================================ */
function Pill({ children, color, outline }) {
  return (
    <span
      style={{
        background: outline ? "transparent" : color + "22",
        border: `1px solid ${color}55`,
        color: outline ? color : INK,
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
    >
      {children}
    </span>
  );
}

// Petite étiquette indiquant le programme financeur d'une thématique
// (ex. « ARS DPPS »), affichée partout où la thématique apparaît.
function ProgrammeTag({ categorie }) {
  const pr = programmeForCategorie(categorie);
  if (!pr) return null;
  return (
    <span
      title={pr.description}
      className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ background: CARE, color: "#fff" }}
    >
      {pr.label.replace("Programme ", "")}
    </span>
  );
}

function IntervenantChip({ code, intervenants }) {
  const meta = intervenants.find((i) => i.code === code);
  const c = getIntervenantColor(code, intervenants);
  const label = meta?.nomComplet ? `${code} — ${meta.nomComplet}` : code;
  return (
    <span
      title={meta ? `${label}${intervenantMetiersLabel(meta) !== "À définir" ? " · " + intervenantMetiersLabel(meta) : ""}` : code}
      style={{ background: c, color: "#fff" }}
      className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded text-[10px] font-bold tracking-wide"
    >
      {code}
    </span>
  );
}

// Barre d'onglets réorganisable au glisser-déposer — fonctionne aussi
// bien à la souris qu'au doigt (Pointer Events, pas l'API HTML5 Drag&Drop
// qui ne fonctionne pas de façon fiable sur mobile). Un simple clic
// (sans déplacement notable) navigue normalement ; un déplacement au-delà
// d'un petit seuil déclenche le réordonnancement.
function SortableTabBar({ tabs, activeId, onSelect, onReorder, activeColor, inactiveColor, activeTextColor, inactiveTextColor }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const dragInfo = useRef({ id: null, startX: 0, startY: 0, dragging: false });
  const btnRefs = useRef({});

  const handlePointerDown = (e, id) => {
    dragInfo.current = { id, startX: e.clientX, startY: e.clientY, dragging: false };
  };

  useEffect(() => {
    const handleMove = (e) => {
      const info = dragInfo.current;
      if (!info.id) return;
      const dx = Math.abs(e.clientX - info.startX);
      const dy = Math.abs(e.clientY - info.startY);
      if (!info.dragging && (dx > 6 || dy > 6)) {
        info.dragging = true;
        setDragId(info.id);
      }
      if (info.dragging) {
        let found = null;
        for (const [id, el] of Object.entries(btnRefs.current)) {
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            found = id;
            break;
          }
        }
        setOverId(found);
      }
    };
    const handleUp = () => {
      const info = dragInfo.current;
      if (info.dragging && info.id && overId && info.id !== overId) {
        const ids = tabs.map((t) => t.id);
        const from = ids.indexOf(info.id);
        const to = ids.indexOf(overId);
        if (from !== -1 && to !== -1) {
          const next = [...ids];
          next.splice(from, 1);
          next.splice(to, 0, info.id);
          onReorder(next);
        }
      } else if (!info.dragging && info.id) {
        onSelect(info.id);
      }
      dragInfo.current = { id: null, startX: 0, startY: 0, dragging: false };
      setDragId(null);
      setOverId(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [overId, tabs, onReorder, onSelect]);

  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map((n) => {
        const Icon = n.icon;
        const active = activeId === n.id;
        const isDragging = dragId === n.id;
        const isOver = overId === n.id && dragId && dragId !== n.id;
        const bg = n.color ? (active ? n.color : n.color + "cc") : (active ? activeColor : "rgba(255,255,255,0.11)");
        const fg = n.color ? "#fff" : (active ? activeTextColor : inactiveTextColor);
        // L'onglet actif porte un rail turquoise en tête : le repère
        // « vous êtes ici », dans la couleur signal de la charte.
        const activeRail = active && !n.color ? `inset 0 3px 0 ${SIGNAL}` : "";
        return (
          <button
            key={n.id}
            ref={(el) => { btnRefs.current[n.id] = el; }}
            onPointerDown={(e) => handlePointerDown(e, n.id)}
            className={`nav-tab${active ? " nav-tab-active" : ""} flex items-center gap-1.5 text-[13px] px-3.5 py-2 rounded-t-lg`}
            style={{
              background: bg,
              color: fg,
              fontWeight: active ? 700 : 500,
              opacity: isDragging ? 0.45 : 1,
              boxShadow: isOver
                ? `inset 0 0 0 2px #fff, inset 0 0 0 4px ${activeColor}`
                : (n.color && active ? `inset 0 -3px 0 #fff` : activeRail),
              touchAction: "none",
              cursor: "grab",
              userSelect: "none",
            }}
          >
            <Icon size={14} /> {n.label}
          </button>
        );
      })}
    </div>
  );
}

// Emblème inspiré du logo Institut Pasteur de Lille (deux anneaux
// entrelacés, Dark Teal + Turquoise) — une interprétation simplifiée
// en SVG, pas une reproduction exacte du fichier vectoriel officiel.
// Emblème officiel Institut Pasteur de Lille, extrait du Brandboard fourni.
const BRAND_EMBLEM_SRC = "data:image/png;base64,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";
function BrandEmblem({ size = 32 }) {
  return (
    <img
      src={BRAND_EMBLEM_SRC} alt="Institut Pasteur de Lille"
      style={{ width: size, height: size * (213 / 240), objectFit: "contain", display: "block" }}
    />
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <span className="w-1 h-3.5 rounded-full shrink-0" style={{ background: SIGNAL }} />
      <span className="text-[11px] font-mono uppercase tracking-[0.16em] font-semibold" style={{ color: CARE_DARK }}>
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${LINE}, transparent)` }} />
    </div>
  );
}

// Carte d'indicateur. Le chiffre est le héros ; une colonne verticale
// turquoise (la « colonne » reprise du logo IPL) marque la donnée et
// reprend la couleur sémantique quand il y en a une. Ce même geste
// vertical structure aussi les titres de section : une seule grammaire
// visuelle, répétée partout.
function StatCard({ label, value, color }) {
  const accent = color || INK;
  return (
    <div className="bg-white rounded-lg border stat-card" style={{ borderColor: LINE }}>
      <div className="flex items-stretch gap-3 px-4 py-3.5">
        <span className="w-[3px] rounded-full shrink-0" style={{ background: accent, opacity: 0.85 }} />
        <div className="min-w-0">
          <div
            className="disp stat-value"
            style={{ fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}
          >
            {value}
          </div>
          <div className="text-[10.5px] muted uppercase tracking-[0.11em] mt-0.5 font-semibold leading-snug">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Petit indicateur de statut (pastille colorée)
function StatusDot({ statut, size = 9 }) {
  const meta = STATUS_META[normalizeStatut(statut)] || STATUS_META.previsionnel;
  return (
    <span
      title={meta.label}
      style={{ width: size, height: size, background: meta.color, borderRadius: "50%", display: "inline-block", flexShrink: 0 }}
    />
  );
}

// Contrôle à 3 boutons pour changer le statut d'un évènement
function StatusControl({ statut, onChange, size = "sm" }) {
  const current = normalizeStatut(statut);
  const dims = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const iconSize = size === "sm" ? 12 : 13;
  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      {STATUS_ORDER.map((key) => {
        const meta = STATUS_META[key];
        const active = current === key;
        const Icon = meta.Icon;
        return (
          <button
            key={key}
            type="button"
            title={meta.label}
            onClick={() => onChange(key)}
            className={`${dims} rounded-md flex items-center justify-center transition`}
            style={{
              background: active ? meta.color : "transparent",
              border: `1px solid ${active ? meta.color : LINE}`,
              color: active ? "#fff" : meta.color,
            }}
          >
            <Icon size={iconSize} />
          </button>
        );
      })}
    </div>
  );
}

// Statut de financement d'un projet — même logique que le statut des
// évènements (4 boutons colorés), mais pour suivre le dépôt d'un projet
// auprès d'un financeur. Choisir un statut demande aussi sa date.
const PROJECT_STATUT_META = {
  depot: { label: "En cours de dépôt (attente de retour)", color: PURPLE, Icon: CircleDashed },
  valide: { label: "Validé", color: GREEN, Icon: Check },
  refuse: { label: "Refusé", color: RED, Icon: X },
  annule: { label: "Annulé", color: MUTED, Icon: Ban },
};
const PROJECT_STATUT_ORDER = ["depot", "valide", "refuse", "annule"];

function ProjectStatutControl({ statut, date, onChange }) {
  const [editingDateFor, setEditingDateFor] = useState(null);
  const dateInputRef = useRef(null);
  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      {PROJECT_STATUT_ORDER.map((key) => {
        const meta = PROJECT_STATUT_META[key];
        const active = statut === key;
        const Icon = meta.Icon;
        return (
          <button
            key={key} type="button" title={meta.label}
            onClick={() => setEditingDateFor(key)}
            className="w-6 h-6 rounded-md flex items-center justify-center transition"
            style={{
              background: active ? meta.color : "transparent",
              border: `1px solid ${active ? meta.color : LINE}`,
              color: active ? "#fff" : meta.color,
            }}
          >
            <Icon size={12} />
          </button>
        );
      })}
      {statut && (
        <span className="text-[10px] mono muted ml-0.5">{date ? fmtDate(date) : ""}</span>
      )}
      {editingDateFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}
          onClick={() => setEditingDateFor(null)}
        >
          <div className="bg-white rounded-lg p-4 w-full max-w-xs shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: PROJECT_STATUT_META[editingDateFor].color }}>
              {React.createElement(PROJECT_STATUT_META[editingDateFor].Icon, { size: 14 })}
              {PROJECT_STATUT_META[editingDateFor].label}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Date de ce statut</label>
              <input
                ref={dateInputRef}
                type="date" autoFocus defaultValue={date || today}
                className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingDateFor(null)} className="text-xs font-medium px-3 py-1.5 rounded-md">Annuler</button>
              <button
                onClick={() => {
                  onChange(editingDateFor, dateInputRef.current?.value || today);
                  setEditingDateFor(null);
                }}
                className="text-xs font-semibold text-white px-3 py-1.5 rounded-md" style={{ background: PROJECT_STATUT_META[editingDateFor].color }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MissingBadge({ missing }) {
  if (!missing || missing.length === 0) return null;
  return (
    <span
      title={`Information(s) manquante(s) : ${missing.join(", ")}`}
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ background: AMBER + "22", color: "#8A5620", border: `1px solid ${AMBER}55` }}
    >
      <ShieldAlert size={11} /> {missing.join(" · ")}
    </span>
  );
}

// Alerte levée par un·e intervenant·e (indisponibilité, conflit…),
// affichée partout où l'évènement apparaît pour l'équipe de coordination.
function AlertBadge({ alerte }) {
  if (!alerte) return null;
  return (
    <span
      title={`${alerte.auteur} (${fmtDate(alerte.date)}) : ${alerte.message}`}
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded max-w-[180px]"
      style={{ background: RED + "1f", color: RED, border: `1px solid ${RED}66` }}
    >
      <AlertTriangle size={11} className="shrink-0" />
      <span className="truncate">{alerte.message}</span>
    </span>
  );
}

// Fond + bordure d'une ligne selon le statut de l'évènement, pour que
// toute la ligne soit colorée (et pas seulement une pastille).
function statusRowStyle(statut) {
  const meta = STATUS_META[normalizeStatut(statut)] || STATUS_META.previsionnel;
  return {
    background: meta.color + "17",
    borderLeft: `4px solid ${meta.color}`,
  };
}

/* ============================================================
   ÉCRAN D'ACCÈS — SÉLECTION DE RÔLE + AUTHENTIFICATION
   ------------------------------------------------------------
   Pas de <form>/onSubmit nulle part ici : les artefacts React
   tournent dans un iframe sécurisé où la soumission native de
   formulaire est bloquée. Toute validation passe par onClick et
   la touche Entrée (onKeyDown).
   ============================================================ */
function RoleCard({ role, onClick }) {
  const Icon = role.Icon;
  return (
    <button
      onClick={onClick}
      className="group w-full sm:w-40 rounded-xl flex flex-col items-start gap-1.5 text-left p-3.5 transition-all duration-200 hover:-translate-y-1"
      style={{
        background: role.color,
        boxShadow: "0 2px 4px rgba(0,0,0,.12), 0 12px 28px -8px rgba(0,0,0,.35)",
      }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition"
        style={{ background: "rgba(255,255,255,0.16)" }}
      >
        <Icon size={16} color="#fff" />
      </span>
      <span className="disp text-white text-sm font-bold leading-tight">{role.label}</span>
      <span className="text-white text-[11px] leading-snug" style={{ opacity: 0.82 }}>{role.tagline}</span>
      <span className="flex items-center gap-1 text-[10px] font-semibold mt-0.5" style={{ color: SIGNAL }}>
        Entrer <ArrowRight size={10} />
      </span>
    </button>
  );
}

function RoleAuthScreen({ role, accountsForRole, onBack, onCreateAccount, onLogin, intervenants }) {
  const [mode, setMode] = useState(accountsForRole.length ? "select" : "join");
  // Sur le site déployé (Supabase), la liste des profils arrive après un
  // vrai aller-retour réseau — elle peut donc être encore vide au tout
  // premier rendu, ce qui verrouillait ce composant en mode « créer un
  // nouveau profil » pour de bon, même une fois les profils chargés.
  // On rattrape ça dès qu'ils arrivent, sauf si la personne a déjà changé
  // le mode elle-même ou commencé à saisir un nom.
  const modeTouchedRef = useRef(false);
  useEffect(() => {
    if (!modeTouchedRef.current && accountsForRole.length > 0 && mode === "join" && !nom.trim()) {
      setMode("select");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsForRole.length]);
  const [error, setError] = useState("");

  // mode "select" — un profil existe déjà pour ce rôle
  const [pickedId, setPickedId] = useState(accountsForRole[0]?.id || "");
  // Même souci qu'au-dessus : si la liste arrive après ce premier rendu,
  // on la pré-sélectionne dès qu'elle est là plutôt que de laisser le
  // menu vide.
  useEffect(() => {
    if (!pickedId && accountsForRole.length > 0) setPickedId(accountsForRole[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsForRole.length]);
  const [pw, setPw] = useState("");

  // mode "join" — première connexion avec le mot de passe partagé
  const [masterPw, setMasterPw] = useState("");
  const [masterOk, setMasterOk] = useState(false);
  const [nom, setNom] = useState("");
  const [intervCode, setIntervCode] = useState("");
  const [intervCodeCustom, setIntervCodeCustom] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");

  const submitSelect = () => {
    const acc = accountsForRole.find((a) => a.id === pickedId);
    if (!acc) { setError("Choisis ton profil."); return; }
    if (pw !== acc.password) { setError("Mot de passe incorrect."); return; }
    setError("");
    onLogin(acc);
  };

  const submitMaster = () => {
    if (masterPw.trim() !== role.masterPassword) { setError("Mot de passe d'équipe incorrect."); return; }
    setError("");
    setMasterOk(true);
  };

  const submitCreate = () => {
    if (!nom.trim()) { setError("Indique ton nom."); return; }
    if (newPw.trim().length < 4) { setError("Choisis un mot de passe personnel d'au moins 4 caractères."); return; }
    if (newPw !== newPwConfirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    const code = CAN_LINK_INTERVENANT_CODE.has(role.id)
      ? (intervCode === "__new__" ? intervCodeCustom.trim() : intervCode)
      : null;
    setError("");
    onCreateAccount({ role: role.id, nom: nom.trim(), password: newPw.trim(), intervenantCode: code || null });
  };

  const handleEnter = (fn) => (e) => { if (e.key === "Enter") fn(); };

  return (
    <div style={{ background: INK, fontFamily: "'Poppins', system-ui, sans-serif" }} className="min-h-screen flex items-center justify-center px-4 py-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Livvic:wght@600;700&family=Poppins:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .disp { font-family: 'Livvic', sans-serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      <div className="w-full max-w-sm text-white">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-5" style={{ color: INK_TEXT_MUTED }}>
          <ArrowLeft size={14} /> Changer de rôle
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: role.color }}>
            <role.Icon size={20} />
          </div>
          <h1 className="disp text-2xl" style={{ fontWeight: 600 }}>{role.label}</h1>
          <p className="text-sm mt-2" style={{ color: INK_TEXT_BODY }}>{role.tagline}</p>
        </div>

        {mode === "select" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: INK_TEXT_MUTED }}>Qui es-tu ?</label>
              <select
                value={pickedId} onChange={(e) => setPickedId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 text-white"
                style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
              >
                {accountsForRole.map((a) => <option key={a.id} value={a.id} style={{ color: INK }}>{a.nom}</option>)}
              </select>
            </div>
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              onKeyDown={handleEnter(submitSelect)}
              placeholder="Ton mot de passe personnel"
              className="w-full text-sm rounded-md px-3 py-2.5 text-white"
              style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
            />
            {error && <div className="flex items-center gap-1.5 text-xs" style={{ color: ERROR_ON_DARK }}><AlertCircle size={13} /> {error}</div>}
            <button type="button" onClick={submitSelect} style={{ background: CARE }} className="w-full text-sm font-semibold py-2.5 rounded-md hover:brightness-110 transition">
              Se connecter
            </button>
            <button type="button" onClick={() => { modeTouchedRef.current = true; setMode("join"); setError(""); }} className="w-full text-xs text-center pt-1" style={{ color: INK_TEXT_MUTED }}>
              Nouveau·elle dans cet espace ? Rejoindre avec le mot de passe d'équipe
            </button>
          </div>
        )}

        {mode === "join" && !masterOk && (
          <div className="space-y-3">
            <input
              autoFocus type="password" value={masterPw} onChange={(e) => setMasterPw(e.target.value)}
              onKeyDown={handleEnter(submitMaster)}
              placeholder="Mot de passe d'équipe"
              className="w-full text-sm rounded-md px-3 py-2.5 text-white"
              style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
            />
            {error && <div className="flex items-center gap-1.5 text-xs" style={{ color: ERROR_ON_DARK }}><AlertCircle size={13} /> {error}</div>}
            <button type="button" onClick={submitMaster} style={{ background: CARE }} className="w-full text-sm font-semibold py-2.5 rounded-md hover:brightness-110 transition">
              Continuer
            </button>
            {accountsForRole.length > 0 && (
              <button type="button" onClick={() => { modeTouchedRef.current = true; setMode("select"); setError(""); }} className="w-full text-xs text-center pt-1" style={{ color: INK_TEXT_MUTED }}>
                ← Retour à la liste des profils
              </button>
            )}
          </div>
        )}

        {mode === "join" && masterOk && (
          <div className="space-y-3">
            <p className="text-xs text-center mb-1" style={{ color: INK_TEXT_MUTED }}>
              Crée ton profil personnel pour la prochaine fois.
            </p>
            <input
              autoFocus value={nom} onChange={(e) => setNom(e.target.value)}
              onKeyDown={handleEnter(submitCreate)}
              placeholder="Ton nom / prénom"
              className="w-full text-sm rounded-md px-3 py-2.5 text-white"
              style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
            />
            {CAN_LINK_INTERVENANT_CODE.has(role.id) && (
              <div className="space-y-2">
                {role.id !== "intervenant" && (
                  <p className="text-[11px] text-center" style={{ color: INK_TEXT_MUTED }}>
                    Si tu interviens aussi sur le terrain, relie ton code pour que tes actions planifiées comptent dans ton temps de travail.
                  </p>
                )}
                <select
                  value={intervCode} onChange={(e) => setIntervCode(e.target.value)}
                  className="w-full text-sm rounded-md px-3 py-2.5 text-white"
                  style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
                >
                  <option value="" style={{ color: INK }}>Mon code intervenant (optionnel)</option>
                  {intervenants.map((i) => (
                    <option key={i.code} value={i.code} style={{ color: INK }}>
                      {i.code}{i.nomComplet ? ` — ${i.nomComplet}` : ""}
                    </option>
                  ))}
                  <option value="__new__" style={{ color: INK }}>+ Nouveau code…</option>
                </select>
                {intervCode === "__new__" && (
                  <input
                    value={intervCodeCustom} onChange={(e) => setIntervCodeCustom(e.target.value)}
                    placeholder="Nouveau code (ex : SP)"
                    className="w-full text-sm rounded-md px-3 py-2.5 text-white"
                    style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
                  />
                )}
              </div>
            )}
            <input
              type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              onKeyDown={handleEnter(submitCreate)}
              placeholder="Choisis ton mot de passe personnel"
              className="w-full text-sm rounded-md px-3 py-2.5 text-white"
              style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
            />
            <input
              type="password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)}
              onKeyDown={handleEnter(submitCreate)}
              placeholder="Confirme ton mot de passe"
              className="w-full text-sm rounded-md px-3 py-2.5 text-white"
              style={{ background: INK_SOFT, border: `1px solid ${INK_BORDER}` }}
            />
            {error && <div className="flex items-center gap-1.5 text-xs" style={{ color: ERROR_ON_DARK }}><AlertCircle size={13} /> {error}</div>}
            <button type="button" onClick={submitCreate} style={{ background: CARE }} className="w-full text-sm font-semibold py-2.5 rounded-md hover:brightness-110 transition">
              Créer mon accès
            </button>
          </div>
        )}

        <p className="text-[11px] text-center mt-6 leading-relaxed" style={{ color: INK_TEXT_FOOTER }}>
          Ces mots de passe protègent l'accès à l'interface sur cet appareil. Il ne s'agit pas d'un chiffrement des données.
        </p>
      </div>
    </div>
  );
}

// Écran affiché pendant le tout premier chargement des données partagées
// (comptes, évènements…) depuis la base — avant ça, personne ne doit
// pouvoir créer un compte ou agir, sous peine d'écraser ce que d'autres
// ont déjà enregistré avec une copie locale incomplète.
function LoadingGate() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(150deg, ${lighten(INK, 8)} 0%, ${INK} 55%, ${lighten(INK, -12)} 100%)` }}
    >
      <div className="flex flex-col items-center text-center text-white">
        <div className="bg-white rounded-2xl p-3 mb-5" style={{ boxShadow: `0 8px 28px -6px rgba(0,0,0,.4), 0 0 0 1px rgba(85,206,183,.3)` }}>
          <BrandEmblem size={40} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 mb-3" style={{ borderColor: "rgba(255,255,255,0.25)", borderTopColor: SIGNAL, animation: "spin 0.8s linear infinite" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>Chargement de l'espace…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RoleGate({ accounts, intervenants, onCreateAccount, onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);

  if (!selectedRole) {
    return (
      <div
        style={{
          background: `radial-gradient(120% 80% at 50% -10%, ${lighten(INK, 26)} 0%, ${INK} 45%, ${lighten(INK, -18)} 100%)`,
          fontFamily: "'Poppins', system-ui, sans-serif",
        }}
        className="min-h-screen flex items-center justify-center px-4 py-10"
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Livvic:wght@600;700&family=Poppins:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          .disp { font-family: 'Livvic', sans-serif; letter-spacing: -0.02em; }
          .mono { font-family: 'IBM Plex Mono', monospace; }
          button:focus-visible { outline: 2px solid ${SIGNAL}; outline-offset: 3px; }
        `}</style>
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center text-center mb-10 text-white">
            <div className="bg-white rounded-2xl p-3 mb-5" style={{ boxShadow: `0 8px 28px -6px rgba(0,0,0,.4), 0 0 0 1px rgba(85,206,183,.3)` }}>
              <BrandEmblem size={44} />
            </div>
            <div className="text-[11px] mono uppercase tracking-[0.22em]" style={{ color: SIGNAL }}>
              Institut Pasteur de Lille — Coordination de projets
            </div>
            <h1 className="disp text-2xl sm:text-3xl mt-2 max-w-xl leading-tight" style={{ fontWeight: 700 }}>Application d'organisation et de pilotage de projet</h1>
            <p className="text-sm mt-3" style={{ color: INK_TEXT_BODY }}>Choisis ton espace pour continuer.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-3">
              {ROLES.filter((r) => ROLES_ROW_1.includes(r.id)).map((role) => (
                <RoleCard key={role.id} role={role} onClick={() => setSelectedRole(role.id)} />
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {ROLES.filter((r) => ROLES_ROW_2.includes(r.id)).map((role) => (
                <RoleCard key={role.id} role={role} onClick={() => setSelectedRole(role.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const role = roleMeta(selectedRole);
  const accountsForRole = accounts.filter((a) => a.role === role.id);
  return (
    <RoleAuthScreen
      role={role}
      accountsForRole={accountsForRole}
      intervenants={intervenants}
      onBack={() => setSelectedRole(null)}
      onCreateAccount={onCreateAccount}
      onLogin={onLogin}
    />
  );
}

/* ============================================================
   CONFIRMATION DE SUPPRESSION (remplace window.confirm, bloqué
   dans l'iframe sécurisé des artefacts)
   ============================================================ */
function ConfirmDialog({ message, onCancel, onConfirm, confirmLabel = "Supprimer" }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-xs shadow-2xl p-5 text-center">
        <AlertCircle size={26} style={{ color: RED }} className="mx-auto mb-3" />
        <p className="text-sm font-medium mb-4">{message}</p>
        <div className="flex justify-center gap-2">
          <button onClick={onCancel} className="text-sm font-medium px-4 py-2 rounded-md border" style={{ borderColor: LINE }}>Annuler</button>
          <button onClick={onConfirm} style={{ background: RED }} className="text-sm font-semibold text-white px-4 py-2 rounded-md">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODALE — MON COMPTE (nom + mot de passe personnel)
   ============================================================ */
/* ============================================================
   MODALE — CHOISIR SES PROJETS (case à cocher)
   ------------------------------------------------------------
   Utilisée par les chargé·es/chef·fes de projet pour cibler
   précisément les projets qu'iels gèrent, et par le·la chef·fe
   d'équipe comme filtre optionnel dans Pilotage.
   ============================================================ */
function ProjectPickerModal({ projects, allCategories, selected, onSave, onClose, title, hint }) {
  const [sel, setSel] = useState(new Set(selected || []));
  const [search, setSearch] = useState("");
  const byCat = useMemo(() => {
    const m = {};
    projects.forEach((p) => { (m[p.categorie] = m[p.categorie] || []).push(p); });
    return m;
  }, [projects]);
  const toggle = (id) => setSel((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const matches = (p) => !search.trim() || p.nom.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: LINE }}>
          {hint && <p className="text-xs muted mb-2">{hint}</p>}
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet…"
            className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }}
          />
          <div className="flex items-center gap-3 mt-2 text-xs">
            <button type="button" onClick={() => setSel(new Set(projects.map((p) => p.id)))} className="font-medium" style={{ color: CARE_DARK }}>Tout cocher</button>
            <button type="button" onClick={() => setSel(new Set())} className="font-medium" style={{ color: MUTED }}>Tout décocher</button>
            <span className="ml-auto muted">{sel.size} sélectionné{sel.size > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {allCategories.filter((c) => byCat[c]).map((cat) => {
            const list = byCat[cat].filter(matches);
            if (list.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-xs font-semibold muted uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  {cat}<ProgrammeTag categorie={cat} />
                </div>
                <div className="space-y-0.5">
                  {list.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm py-1.5 px-1.5 rounded hover:bg-[#FAFBFC] cursor-pointer">
                      <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} />
                      <span className="flex-1 min-w-0 truncate">{p.nom}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0" style={{ borderColor: LINE }}>
          <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button type="button" onClick={() => onSave(Array.from(sel))} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountModal({ account, intervenants, onClose, onSave }) {
  const [nom, setNom] = useState(account.nom);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [intervCode, setIntervCode] = useState(account.intervenantCode || "");
  const [intervCodeCustom, setIntervCodeCustom] = useState("");

  const submit = () => {
    if (!nom.trim()) { setError("Le nom ne peut pas être vide."); return; }
    if (newPw || confirm || oldPw) {
      if (oldPw !== account.password) { setError("Mot de passe actuel incorrect."); return; }
      if (newPw.trim().length < 4) { setError("Le nouveau mot de passe doit contenir au moins 4 caractères."); return; }
      if (newPw !== confirm) { setError("Les deux nouveaux mots de passe ne correspondent pas."); return; }
    }
    setError("");
    const code = intervCode === "__new__" ? intervCodeCustom.trim() : intervCode;
    onSave({ nom: nom.trim(), password: newPw.trim() || account.password, intervenantCode: CAN_LINK_INTERVENANT_CODE.has(account.role) ? (code || null) : account.intervenantCode });
  };
  const handleEnter = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Mon compte</h2>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Nom / prénom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
          {CAN_LINK_INTERVENANT_CODE.has(account.role) && (
            <div>
              <label className="text-xs font-medium block mb-1">
                Mon code intervenant
                {!intervCode && account.role === "intervenant" && <span style={{ color: AMBER }}> (à renseigner pour activer « Mon espace »)</span>}
                {!intervCode && account.role !== "intervenant" && <span className="muted"> (optionnel — relie tes actions de terrain à ton temps de travail)</span>}
              </label>
              <select
                value={intervCode} onChange={(e) => setIntervCode(e.target.value)}
                className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
              >
                <option value="">Aucun</option>
                {intervenants.map((i) => (
                  <option key={i.code} value={i.code}>{i.code}{i.nomComplet ? ` — ${i.nomComplet}` : ""}</option>
                ))}
                <option value="__new__">+ Nouveau code…</option>
              </select>
              {intervCode === "__new__" && (
                <input
                  value={intervCodeCustom} onChange={(e) => setIntervCodeCustom(e.target.value)}
                  placeholder="Nouveau code (ex : SP)"
                  className="w-full text-sm border rounded-md px-2.5 py-2 mt-2" style={{ borderColor: LINE }}
                />
              )}
            </div>
          )}
          <div className="pt-2" style={{ borderTop: `1px solid ${LINE}` }}>
            <p className="text-[11px] muted mb-2 pt-2">Laisse les champs ci-dessous vides si tu ne veux pas changer de mot de passe.</p>
            <label className="text-xs font-medium block mb-1">Mot de passe actuel</label>
            <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2 mb-2" style={{ borderColor: LINE }} />
            <label className="text-xs font-medium block mb-1">Nouveau mot de passe</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2 mb-2" style={{ borderColor: LINE }} />
            <label className="text-xs font-medium block mb-1">Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
          {error && <div className="flex items-center gap-1.5 text-xs" style={{ color: RED }}><AlertCircle size={13} /> {error}</div>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: LINE }}>
          <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button type="button" onClick={submit} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [events, setEvents] = useState(EVENTS_SEED);
  const [intervenants, setIntervenants] = useState(INTERVENANTS_SEED);
  const [projects, setProjects] = useState(PROJECTS_SEED);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState("");

  // filtres (onglet "Tous les évènements")
  const [fProjet, setFProjet] = useState("all");
  const [fCategorie, setFCategorie] = useState("all");
  const [fType, setFType] = useState("all");
  const [fIntervenant, setFIntervenant] = useState("all");
  const [fStatut, setFStatut] = useState("all");
  const [fSearch, setFSearch] = useState("");
  const [fUpcoming, setFUpcoming] = useState(false);
  const [fTransport, setFTransport] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  // accès protégé — comptes par rôle (voir RoleGate). "session" représente
  // la personne actuellement connectée ; elle reste vide tant qu'aucun
  // rôle n'a été choisi, sans dépendre du réseau pour s'afficher.
  const [accounts, setAccounts] = useState([]);
  const [session, setSession] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [taches, setTaches] = useState([]);
  const [tempsTravail, setTempsTravail] = useState([]);
  const [financeEntries, setFinanceEntries] = useState(() => FINANCE_SEED.map((e, i) => ({ id: `FIN${i + 1}`, ...e })));
  const [devisListe, setDevisListe] = useState([]);
  const [selectedDevisId, setSelectedDevisId] = useState(null);
  const [financeObjectifs, setFinanceObjectifs] = useState(FINANCE_OBJECTIFS_DEFAULT);
  // Capacité ETP (équivalent temps plein) que le·la chef·fe d'équipe
  // déclare avoir à disposition, par métier — sert de référence pour
  // comparer la charge planifiée et les besoins prévisionnels des projets.
  const [etpParMetier, setEtpParMetier] = useState({});
  // Vrai seulement une fois le chargement initial terminé (comptes,
  // évènements, etc.). Tant que ce n'est pas le cas, on évite de laisser
  // qui que ce soit créer un compte ou modifier des données partagées :
  // sur le site déployé (Supabase), ce chargement passe par un vrai
  // aller-retour réseau, et agir avant qu'il se termine reviendrait à
  // écraser les données déjà enregistrées par les autres avec une copie
  // locale incomplète (c'est ce qui causait la demande de recréer son
  // profil à chaque connexion).
  const [dataReady, setDataReady] = useState(false);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  /* ---------- persistance (chargement en arrière-plan, non bloquant) ---------- */
  useEffect(() => {
    (async () => {
      try {
        const e = await window.storage?.get("coord-events");
        const iv = await window.storage?.get("coord-intervenants");
        const pr = await window.storage?.get("coord-projects");
        if (e?.value) setEvents(JSON.parse(e.value).map((ev) => ({ ...ev, statut: normalizeStatut(ev.statut) })));
        if (iv?.value) setIntervenants(JSON.parse(iv.value));
        if (pr?.value) setProjects(JSON.parse(pr.value).map((p) => ({ featured: false, ...p })));
      } catch (err) { /* pas de données sauvegardées -> on garde le seed */ }
      try {
        const acc = await window.storage?.get("coord-accounts");
        if (acc?.value) setAccounts(JSON.parse(acc.value));
      } catch (err) { /* pas encore de comptes */ }
      try {
        const sess = await window.storage?.get("coord-session");
        if (sess?.value) setSession(JSON.parse(sess.value));
      } catch (err) { /* pas de session en cours */ }
      try {
        const tc = await window.storage?.get("coord-taches");
        if (tc?.value) setTaches(JSON.parse(tc.value));
      } catch (err) { /* pas encore de tâches */ }
      try {
        const tt = await window.storage?.get("coord-temps-travail");
        if (tt?.value) setTempsTravail(JSON.parse(tt.value));
      } catch (err) { /* pas encore de temps de travail enregistrés */ }
      try {
        const fin = await window.storage?.get("coord-finance-entries");
        if (fin?.value) setFinanceEntries(JSON.parse(fin.value));
        const finObj = await window.storage?.get("coord-finance-objectifs");
        if (finObj?.value) setFinanceObjectifs(JSON.parse(finObj.value));
        const etp = await window.storage?.get("coord-etp-metier");
        if (etp?.value) setEtpParMetier(JSON.parse(etp.value));
        const dv = await window.storage?.get("coord-devis");
        if (dv?.value) setDevisListe(JSON.parse(dv.value));
      } catch (err) { /* pas encore de suivi financier personnalisé -> on garde le seed */ }
      setDataReady(true);
    })();
  }, []);

  const persistTaches = useCallback((next) => {
    setTaches(next);
    window.storage?.set("coord-taches", JSON.stringify(next)).catch(() => {});
  }, []);
  const addTache = (texte) => {
    if (!session || !texte.trim()) return;
    const t = { id: `T${Date.now()}`, texte: texte.trim(), urgent: false, important: false, fait: false, proprietaire: session.accountId, createdAt: today };
    persistTaches([...taches, t]);
  };
  const updateTache = (id, patch) => {
    persistTaches(taches.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  // Déléguer une tâche à un·e intervenant·e : elle lui apparaît aussitôt
  // en attente de réponse sur son Tableau de bord (peu importe son
  // propre rôle, tant que son compte est relié à ce code).
  const delegateTache = (id, code) => {
    persistTaches(taches.map((t) => (t.id === id ? {
      ...t, delegueA: code, delegueStatut: "en_attente", delegueCommentaire: "", delegueDate: today,
    } : t)));
    flash(`Tâche déléguée à ${code}`);
  };
  const respondDelegation = (id, statut, commentaire) => {
    persistTaches(taches.map((t) => (t.id === id ? { ...t, delegueStatut: statut, delegueCommentaire: commentaire || "" } : t)));
    flash(statut === "accepte" ? "Délégation acceptée" : statut === "refuse" ? "Délégation refusée" : "Réponse envoyée");
  };
  const [confirmDeleteTacheId, setConfirmDeleteTacheId] = useState(null);
  const requestDeleteTache = (id) => setConfirmDeleteTacheId(id);
  const confirmDeleteTache = () => {
    persistTaches(taches.filter((t) => t.id !== confirmDeleteTacheId));
    setConfirmDeleteTacheId(null);
  };

  const persistTempsTravail = useCallback((next) => {
    setTempsTravail(next);
    window.storage?.set("coord-temps-travail", JSON.stringify(next)).catch(() => {});
  }, []);
  const addTempsTravail = ({ categorieId, duree, date, projetId, note }) => {
    if (!session) return;
    const n = Number(duree);
    if (!n || n <= 0) return;
    const t = {
      id: `TT${Date.now()}`, categorieId, duree: n, date: date || today,
      projetId: projetId || null, note: (note || "").trim(),
      proprietaire: session.accountId, createdAt: today,
    };
    persistTempsTravail([...tempsTravail, t]);
    flash("Temps de travail enregistré");
  };
  const [confirmDeleteTempsId, setConfirmDeleteTempsId] = useState(null);
  const requestDeleteTemps = (id) => setConfirmDeleteTempsId(id);
  const confirmDeleteTemps = () => {
    persistTempsTravail(tempsTravail.filter((t) => t.id !== confirmDeleteTempsId));
    setConfirmDeleteTempsId(null);
  };

  const persistFinanceEntries = useCallback((next) => {
    setFinanceEntries(next);
    window.storage?.set("coord-finance-entries", JSON.stringify(next)).catch(() => {});
  }, []);

  const addFinanceEntry = (payload) => {
    const id = `FIN${Date.now()}`;
    persistFinanceEntries([...financeEntries, { id, ...payload }]);
    flash("Ligne ajoutée au suivi financier");
  };
  const updateFinanceEntry = (id, patch) => {
    // Dès qu'un·e chef·fe de projet/d'équipe déclare un montant mensuel
    // sur une ligne Expertises, on prévient automatiquement le secrétariat
    // qu'une facturation est à réaliser pour ce projet.
    const touchesAMonth = Object.keys(patch).some((k) => FINANCE_MONTHS.some((m) => m.key === k) && patch[k] != null && Number(patch[k]) > 0);
    const isChefRole = session && (session.role === "chef_projet" || session.role === "chef_equipe");
    persistFinanceEntries(financeEntries.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, ...patch };
      if (touchesAMonth && e.categorie === "expertise" && isChefRole) {
        next.alerteFacturation = {
          message: `Nouveau montant déclaré (${e.client}) — facturation à réaliser`,
          auteur: session.nom, date: today,
        };
      }
      return next;
    }));
  };
  const clearFinanceAlert = (id) => {
    persistFinanceEntries(financeEntries.map((e) => (e.id === id ? { ...e, alerteFacturation: null } : e)));
    flash("Facturation marquée comme traitée");
  };
  const [confirmDeleteFinanceId, setConfirmDeleteFinanceId] = useState(null);
  const [confirmDeleteDevisId, setConfirmDeleteDevisId] = useState(null);
  const requestDeleteFinance = (id) => setConfirmDeleteFinanceId(id);
  const confirmDeleteFinance = () => {
    persistFinanceEntries(financeEntries.filter((e) => e.id !== confirmDeleteFinanceId));
    setConfirmDeleteFinanceId(null);
  };
  const updateFinanceObjectifs = (next) => {
    setFinanceObjectifs(next);
    window.storage?.set("coord-finance-objectifs", JSON.stringify(next)).catch(() => {});
    flash("Objectifs mis à jour");
  };
  const updateEtpMetier = (metier, valeur) => {
    const next = { ...etpParMetier, [metier]: valeur === "" || valeur === null ? undefined : Number(valeur) };
    setEtpParMetier(next);
    window.storage?.set("coord-etp-metier", JSON.stringify(next)).catch(() => {});
  };

  /* ---------- Devis (prestations d'expertise) ---------- */
  const persistDevisListe = useCallback((next) => {
    setDevisListe(next);
    window.storage?.set("coord-devis", JSON.stringify(next)).catch(() => {});
  }, []);

  const createDevis = (payload) => {
    const id = `DEV${Date.now()}`;
    const devis = {
      id, numeroDevis: payload.numeroDevis || "", version: 1,
      statut: "brouillon", statutDate: today,
      dateEmission: today, auteur: session?.nom || "—",
      destinataire: payload.destinataire || {}, contexteDemande: "",
      lignesPersonnel: [], deplacement: {}, margeIndex: 0, securiteIndex: 0,
      dureeSessionJours: "", typeExpertise: payload.typeExpertise || "",
      conditionsFinancieres: { mode: "totalite" },
      coordonneesFacturation: {},
      historique: [{ auteur: session?.nom || "—", date: today, version: 1, modifications: "Création du devis" }],
      financeEntryId: null,
      ...payload,
    };
    persistDevisListe([...devisListe, devis]);
    flash("Devis créé");
    return id;
  };

  const updateDevis = (id, patch, note) => {
    persistDevisListe(devisListe.map((d) => {
      if (d.id !== id) return d;
      const next = { ...d, ...patch };
      // Toute modification de contenu après le premier envoi ouvre une
      // nouvelle version, tracée dans l'historique — comme sur la trame
      // Word d'origine (colonne « Version » du tableau Historique).
      if (note && d.statut !== "brouillon") {
        next.version = (d.version || 1) + 1;
        next.historique = [...(d.historique || []), { auteur: session?.nom || "—", date: today, version: next.version, modifications: note }];
      }
      return next;
    }));
  };

  const requestDeleteDevis = (id) => setConfirmDeleteDevisId(id);
  const confirmDeleteDevis = () => {
    persistDevisListe(devisListe.filter((d) => d.id !== confirmDeleteDevisId));
    setConfirmDeleteDevisId(null);
    flash("Devis supprimé");
  };

  // Le changement de statut porte les effets attendus : un devis validé
  // vient enrichir tout de suite le Suivi financier (plus un simple
  // prévisionnel, un montant réellement en cours de réalisation) ; un
  // devis refusé n'y touche jamais et reste consultable dans les
  // « Dossiers refusés ».
  const updateDevisStatut = (id, statut) => {
    const d = devisListe.find((x) => x.id === id);
    if (!d) return;
    const calc = calculDevis(d);
    let financeEntryId = d.financeEntryId;

    if (statut === "valide" && !financeEntryId) {
      const monthKey = FINANCE_MONTHS[Number(today.slice(5, 7)) - 1]?.key;
      const entry = {
        id: `FIN-DEV-${d.id}`,
        categorie: "expertise",
        client: d.destinataire?.entreprise || "Client à préciser",
        financeur: undefined,
        type: d.contexteDemande ? d.contexteDemande.slice(0, 60) : "Expertise CEPS",
        typeExpertise: d.typeExpertise || undefined,
        annee: d.dateEmission ? d.dateEmission.slice(0, 4) : today.slice(0, 4),
        base: calc.totalHT, prev: calc.totalHT,
        [monthKey]: calc.totalHT,
        devisId: d.id,
      };
      persistFinanceEntries([...financeEntries, entry]);
      financeEntryId = entry.id;
      flash(`Devis validé — ${calc.totalHT}€ HT ajoutés au Suivi financier`);
    }
    if (statut === "refuse" && financeEntryId) {
      persistFinanceEntries(financeEntries.filter((e) => e.id !== financeEntryId));
      financeEntryId = null;
      flash("Devis refusé — retiré du prévisionnel financier");
    }

    persistDevisListe(devisListe.map((x) => (x.id === id ? {
      ...x, statut, statutDate: today, financeEntryId,
      historique: [...(x.historique || []), { auteur: session?.nom || "—", date: today, version: x.version, modifications: `Statut → ${DEVIS_STATUT_META[statut].label}` }],
    } : x)));
    if (statut !== "valide" && statut !== "refuse") flash(`Statut mis à jour : ${DEVIS_STATUT_META[statut].label}`);
  };

  const persistAccounts = useCallback((next) => {
    setAccounts(next);
    window.storage?.set("coord-accounts", JSON.stringify(next)).catch(() => {});
  }, []);
  const persistSession = useCallback((next) => {
    setSession(next);
    if (next) window.storage?.set("coord-session", JSON.stringify(next)).catch(() => {});
    else window.storage?.delete("coord-session").catch(() => {});
  }, []);

  const handleCreateAccount = ({ role, nom, password, intervenantCode }) => {
    const id = `ACC${Date.now()}`;
    const acc = { id, role, nom, password, intervenantCode: intervenantCode || null };
    persistAccounts([...accounts, acc]);
    persistSession({ accountId: id, role, nom, intervenantCode: acc.intervenantCode });
    // si un code intervenant a été choisi et n'existe pas encore, on l'ajoute au référentiel
    if (intervenantCode && !intervenants.some((i) => i.code === intervenantCode)) {
      persistIntervenants([...intervenants, { code: intervenantCode, metier: "À définir", nomComplet: nom, couleur: pickUnusedColor(intervenants) }]);
    }
    flash(`Bienvenue, ${nom} !`);
  };
  const handleLogin = (acc) => {
    persistSession({ accountId: acc.id, role: acc.role, nom: acc.nom, intervenantCode: acc.intervenantCode || null });
    flash(`Bon retour, ${acc.nom} !`);
  };
  const handleLogout = () => {
    persistSession(null);
  };
  const handleSaveAccount = ({ nom, password, intervenantCode }) => {
    if (!session) return;
    persistAccounts(accounts.map((a) => (a.id === session.accountId ? { ...a, nom, password, intervenantCode: intervenantCode ?? a.intervenantCode ?? null } : a)));
    persistSession({ ...session, nom, intervenantCode: intervenantCode ?? session.intervenantCode ?? null });
    // si un nouveau code intervenant a été saisi, on l'ajoute au référentiel
    if (intervenantCode && !intervenants.some((i) => i.code === intervenantCode)) {
      persistIntervenants([...intervenants, { code: intervenantCode, metier: "À définir", nomComplet: nom, couleur: pickUnusedColor(intervenants) }]);
    }
    setShowAccountModal(false);
    flash("Profil mis à jour");
  };
  const currentAccount = session ? accounts.find((a) => a.id === session.accountId) : null;

  // Ordre personnalisé des onglets, glissé-déposé directement sur la
  // barre de navigation et mémorisé sur le compte de la personne.
  const updateTabOrder = (ids) => {
    if (!session) return;
    persistAccounts(accounts.map((a) => (a.id === session.accountId ? { ...a, tabOrder: ids } : a)));
  };

  // Sélection explicite des projets qu'un·e chargé·e/chef·fe de projet
  // gère : si iels n'ont rien choisi, on retombe sur la correspondance
  // automatique par nom (comme avant). Une fois choisie, la sélection
  // reste enregistrée sur le compte.
  const updateProjetsSelectionnes = useCallback((ids) => {
    if (!session) return;
    persistAccounts(accounts.map((a) => (a.id === session.accountId ? { ...a, projetsSelectionnes: ids } : a)));
  }, [session, accounts]);

  // Même principe, mais pour le Suivi financier : un·e chef·fe de projet
  // peut filtrer les lignes financières affichées sur son propre écran.
  // C'est un filtre d'affichage personnel uniquement — les montants et
  // les totaux restent partagés et intacts pour tout le monde, y compris
  // le·la chef·fe d'équipe qui continue de voir l'ensemble sans filtre.
  const updateFinanceSelection = useCallback((ids) => {
    if (!session) return;
    persistAccounts(accounts.map((a) => (a.id === session.accountId ? { ...a, financeSelectionnes: ids } : a)));
  }, [session, accounts]);

  const persistEvents = useCallback((next) => {
    setEvents(next);
    window.storage?.set("coord-events", JSON.stringify(next)).catch(() => {});
  }, []);
  const persistIntervenants = useCallback((next) => {
    setIntervenants(next);
    window.storage?.set("coord-intervenants", JSON.stringify(next)).catch(() => {});
  }, []);
  const persistProjects = useCallback((next) => {
    setProjects(next);
    window.storage?.set("coord-projects", JSON.stringify(next)).catch(() => {});
  }, []);

  // Restauration à partir d'une sauvegarde générée par « Sauvegarder les
  // données ». Ne touche jamais aux comptes (mots de passe retirés des
  // sauvegardes par sécurité) : seules les données opérationnelles sont
  // remplacées, pour ne jamais bloquer les connexions de l'équipe.
  const restoreFromBackup = useCallback((data) => {
    if (Array.isArray(data.events)) persistEvents(data.events);
    if (Array.isArray(data.projects)) persistProjects(data.projects);
    if (Array.isArray(data.intervenants)) persistIntervenants(data.intervenants);
    if (Array.isArray(data.tempsTravail)) persistTempsTravail(data.tempsTravail);
    if (Array.isArray(data.taches)) persistTaches(data.taches);
    if (Array.isArray(data.financeEntries)) persistFinanceEntries(data.financeEntries);
    if (data.financeObjectifs && typeof data.financeObjectifs === "object") {
      setFinanceObjectifs(data.financeObjectifs);
      window.storage?.set("coord-finance-objectifs", JSON.stringify(data.financeObjectifs)).catch(() => {});
    }
    flash("Sauvegarde restaurée avec succès");
  }, [persistEvents, persistProjects, persistIntervenants, persistTempsTravail, persistTaches, persistFinanceEntries]);

  // Créer un nouveau projet, le valider une fois confirmé par un financeur,
  // ou modifier son budget : réservé aux chef·fes de projet et à la
  // chef·fe d'équipe — pas aux chargé·es de projet, qui suivent le
  // quotidien mais ne pilotent pas ces décisions-là.
  const PROJECT_MANAGE_ROLES = new Set(["chef_projet", "chef_equipe"]);
  const canManageProjects = !LOCKS_ENABLED ? !!session : (!!session && PROJECT_MANAGE_ROLES.has(session.role));

  const createProject = useCallback((nom, categorie, chargeDeProjet, extra = {}) => {
    const id = `C${Date.now()}`;
    const projet = {
      id, nom: nom.trim(), categorie: categorie.trim() || "Autre",
      chargeDeProjet: chargeDeProjet?.trim() || "—", structure: extra.structure?.trim() || "", contact: extra.contact?.trim() || "—", notes: extra.notes?.trim() || "", featured: false,
      // Un nouveau projet démarre « en cours de dépôt » auprès du financeur.
      statutFinancement: "depot", statutFinancementDate: today,
      budget: extra.budget != null && extra.budget !== "" ? Number(extra.budget) : null,
      // Détail des moyens humains prévus pour ce projet, par métier —
      // ex. [{ metier: "Psychologue", nombre: 2 }] — purement indicatif,
      // ne crée pas d'intervenant·es automatiquement.
      moyensHumains: Array.isArray(extra.moyensHumains) ? extra.moyensHumains.filter((m) => m.metier && m.nombre) : [],
    };
    persistProjects([...projects, projet]);
    return id;
  }, [projects, persistProjects]);

  const updateProjectMeta = useCallback((projectId, patch) => {
    persistProjects(projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)));
  }, [projects, persistProjects]);

  // Validation par le financeur et budget : réservés à canManageProjects,
  // vérifiés une seconde fois ici (pas seulement dans l'UI) par sécurité.
  const updateProjectStatutFinancement = useCallback((projectId, statut, date) => {
    if (!canManageProjects) return;
    persistProjects(projects.map((p) => (p.id === projectId ? { ...p, statutFinancement: statut, statutFinancementDate: date || today } : p)));
  }, [projects, persistProjects, canManageProjects]);
  const updateProjectBudget = useCallback((projectId, budget) => {
    if (!canManageProjects) return;
    persistProjects(projects.map((p) => (p.id === projectId ? { ...p, budget: budget === "" || budget === null ? null : Number(budget) } : p)));
  }, [projects, persistProjects, canManageProjects]);

  const toggleFeatured = useCallback((projectId) => {
    persistProjects(projects.map((p) => (p.id === projectId ? { ...p, featured: !p.featured } : p)));
  }, [projects, persistProjects]);

  /* ---------- données dérivées ---------- */
  const allIntervenantCodes = useMemo(() => {
    const s = new Set(intervenants.map((i) => i.code));
    events.forEach((e) => e.intervenants.forEach((c) => s.add(c)));
    return Array.from(s).sort();
  }, [events, intervenants]);

  const allCategories = useMemo(() => {
    const s = new Set(CATEGORIES);
    projects.forEach((p) => { if (p.categorie) s.add(p.categorie); });
    return Array.from(s);
  }, [projects]);

  // Périmètre d'un·e chargé·e/chef·fe de projet : les projets qu'iel a
  // explicitement choisis (case à cocher, voir « Choisir mes projets »),
  // ou à défaut une correspondance automatique par nom. Ce périmètre
  // s'applique aux vues générales (Vue d'ensemble, Planning, Tous les
  // évènements, Par projet, Plan de charge) — l'onglet « Mes projets »
  // garde son propre bouton pour voir temporairement tout le reste.
  const myProjectIds = useMemo(() => {
    if (!LOCKS_ENABLED) return null;
    if (!session) return null;
    const sel = currentAccount?.projetsSelectionnes;
    if (["charge_projet", "chef_projet"].includes(session.role)) {
      if (Array.isArray(sel)) return new Set(sel);
      return new Set(projects.filter((p) => matchesPerson(p.chargeDeProjet, session.nom)).map((p) => p.id));
    }
    // Le·la chef·fe d'équipe n'a pas de correspondance automatique par
    // nom (il/elle ne « possède » pas des projets) : pas de filtre tant
    // qu'aucune sélection explicite n'a été choisie.
    if (session.role === "chef_equipe" && Array.isArray(sel) && sel.length > 0) return new Set(sel);
    return null;
  }, [session, currentAccount, projects]);
  // Un·e intervenant·e relié·e à un code ne doit voir, dans le Tableau de
  // bord, le Calendrier, la Recherche d'actions et les Dossiers projets,
  // QUE les actions où son propre code apparaît — y compris en binôme ou
  // plus (le filtre regarde juste si son code est dans la liste, pas s'il
  // y est seul). Sans code relié, on ne restreint rien (mieux vaut montrer
  // trop que planter/masquer par erreur).
  const myIntervenantCode = session?.role === "intervenant" ? (currentAccount?.intervenantCode || session.intervenantCode) : null;
  // Pour les délégations de tâches : peu importe le rôle, si le compte
  // est relié à un code intervenant, il doit voir ce qui lui est délégué.
  const linkedIntervenantCode = currentAccount?.intervenantCode || session?.intervenantCode || null;
  const scopedProjects = myProjectIds
    ? projects.filter((p) => myProjectIds.has(p.id))
    : myIntervenantCode
      ? projects.filter((p) => events.some((e) => e.projetId === p.id && e.intervenants.includes(myIntervenantCode)))
      : projects;
  const scopedEvents = myProjectIds
    ? events.filter((e) => myProjectIds.has(e.projetId))
    : myIntervenantCode
      ? events.filter((e) => e.intervenants.includes(myIntervenantCode))
      : events;

  const filtered = useMemo(() => {
    return scopedEvents
      .filter((e) => fProjet === "all" || e.projetId === fProjet)
      .filter((e) => fCategorie === "all" || e.categorie === fCategorie)
      .filter((e) => fType === "all" || e.type === fType)
      .filter((e) => fIntervenant === "all" || e.intervenants.includes(fIntervenant))
      .filter((e) => fStatut === "all" || e.statut === fStatut)
      .filter((e) => fTransport === "all" || e.modeTransport === fTransport)
      .filter((e) => !fUpcoming || (e.date && e.date >= today))
      .filter((e) => {
        if (!fSearch.trim()) return true;
        const proj = scopedProjects.find((p) => p.id === e.projetId);
        const hay = [e.type, e.lieu, e.notes, proj?.nom, proj?.structure, proj?.contact]
          .filter(Boolean).join(" ").toLowerCase();
        return hay.includes(fSearch.toLowerCase());
      })
      .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  }, [scopedEvents, fProjet, fCategorie, fType, fIntervenant, fStatut, fSearch, fUpcoming, scopedProjects]);

  const projectStats = useMemo(() => {
    const map = {};
    scopedProjects.forEach((p) => (map[p.id] = { ...p, count: 0, next: null }));
    scopedEvents.forEach((e) => {
      const m = map[e.projetId];
      if (!m) return;
      m.count += 1;
      if (e.date && e.date >= today && (!m.next || e.date < m.next)) m.next = e.date;
    });
    return Object.values(map);
  }, [scopedEvents, scopedProjects]);

  const missingInfoEvents = useMemo(
    () => scopedEvents.map((e) => ({ e, missing: isMissingInfo(e) })).filter((x) => x.missing.length > 0),
    [scopedEvents]
  );

  /* ---------- CRUD évènements ---------- */
  const emptyForm = {
    projetId: projects[0]?.id || "", type: TYPES[0], date: "", dateFin: "", horaire: "", dureeHeures: "",
    lieu: "", intervenants: [], notes: "", commentaireIntervenant: "", preinscrits: "", incertain: false, statut: "previsionnel",
    tempsTrajetMin: "", kilometres: "", modeTransport: "",
  };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openNewForProject = (projetId) => { setForm({ ...emptyForm, projetId }); setEditingId(null); setShowForm(true); };
  const openEdit = (e) => {
    setForm({ ...e, preinscrits: e.preinscrits ?? "", dureeHeures: e.dureeHeures ?? "", tempsTrajetMin: e.tempsTrajetMin ?? "", kilometres: e.kilometres ?? "", modeTransport: e.modeTransport ?? "" });
    setEditingId(e.id);
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);

  const submitForm = () => {
    if (!form.projetId || !form.type) { flash("Projet et type requis"); return; }
    const proj = projects.find((p) => p.id === form.projetId);
    const payload = {
      ...form,
      categorie: proj?.categorie || "Autre",
      preinscrits: form.preinscrits === "" ? null : Number(form.preinscrits),
      dureeHeures: form.dureeHeures === "" ? null : Number(form.dureeHeures),
      tempsTrajetMin: form.tempsTrajetMin === "" ? null : Number(form.tempsTrajetMin),
      kilometres: form.kilometres === "" ? null : Number(form.kilometres),
    };
    if (editingId) {
      persistEvents(events.map((e) => (e.id === editingId ? { ...payload, id: editingId } : e)));
      flash("Évènement mis à jour");
    } else {
      persistEvents([...events, { ...payload, id: `E${Date.now()}` }]);
      flash("Évènement ajouté");
    }
    setShowForm(false);
  };

  // Les artefacts React tournent dans un iframe sécurisé où window.confirm()
  // est bloqué silencieusement (pas de permission "allow-modals") : on
  // utilise donc une confirmation intégrée à l'interface plutôt qu'une
  // boîte de dialogue native.
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const requestDeleteEvent = (id) => setConfirmDeleteId(id);
  const confirmDeleteEvent = () => {
    if (!confirmDeleteId) return;
    persistEvents(events.filter((e) => e.id !== confirmDeleteId));
    flash("Évènement supprimé");
    setConfirmDeleteId(null);
  };

  const setEventStatut = (id, statut) => {
    persistEvents(events.map((e) => (e.id === id ? { ...e, statut } : e)));
  };

  const updateEventComment = (id, commentaireIntervenant) => {
    persistEvents(events.map((e) => (e.id === id ? { ...e, commentaireIntervenant } : e)));
  };

  // Alerte levée par un·e intervenant·e (indisponibilité, conflit d'agenda…)
  // — visible par toute l'équipe de coordination, pas seulement lui/elle.
  const raiseAlert = (id, message) => {
    if (!session) return;
    persistEvents(events.map((e) => (e.id === id ? { ...e, alerte: { message, auteur: session.nom, date: today } } : e)));
    flash("Alerte envoyée à l'équipe");
  };
  const clearAlert = (id) => {
    persistEvents(events.map((e) => (e.id === id ? { ...e, alerte: null } : e)));
  };

  // Les intervenant·es suivent et commentent leurs actions mais ne
  // modifient pas la planification elle-même (date, lieu, projet…) —
  // cela reste le rôle des chargé·es/chef·fes de projet et du secrétariat.
  // Créer/modifier/supprimer des actions planifiées : réservé aux
  // chargé·es et chef·fes de projet, et au·à la chef·fe d'équipe — pas
  // le secrétariat (logistique/contacts uniquement), ni les intervenant·es.
  const EVENT_EDIT_ROLES = new Set(["charge_projet", "chef_projet", "chef_equipe"]);
  const canEditPlanning = !LOCKS_ENABLED ? !!session : (!!session && EVENT_EDIT_ROLES.has(session.role));
  // Couleur du rôle connecté, reprise dans tout l'en-tête pour que la
  // navigation indique clairement dans quel espace on se trouve.
  const roleColor = session ? (roleMeta(session.role)?.color || INK) : INK;
  const roleColorSoft = lighten(roleColor, 35);

  // Ajout rapide depuis « Mon espace » (absence ou temps de création de
  // contenu) : construit un évènement complet sans passer par le formulaire
  // détaillé, avec le statut "réalisé" pour les temps déjà effectués.
  const quickAddEvent = (partial) => {
    const proj = projects.find((p) => p.id === partial.projetId);
    const payload = {
      id: `E${Date.now()}`,
      projetId: partial.projetId,
      categorie: proj?.categorie || "Autre",
      type: partial.type,
      date: partial.date || "",
      dateFin: partial.dateFin || "",
      horaire: "",
      dureeHeures: partial.dureeHeures ?? null,
      lieu: "",
      intervenants: partial.intervenants || [],
      notes: "",
      commentaireIntervenant: partial.commentaireIntervenant || "",
      preinscrits: null,
      incertain: false,
      statut: partial.statut || "previsionnel",
    };
    persistEvents([...events, payload]);
    flash("Ajouté à ton planning");
  };

  const toggleFormIntervenant = (code) => {
    setForm((f) => ({
      ...f,
      intervenants: f.intervenants.includes(code)
        ? f.intervenants.filter((c) => c !== code)
        : [...f.intervenants, code],
    }));
  };

  const updateIntervenantMetier = (code, metier) => {
    const exists = intervenants.some((i) => i.code === code);
    const next = exists
      ? intervenants.map((i) => (i.code === code ? { ...i, metier } : i))
      : [...intervenants, { code, metier, nomComplet: "" }];
    persistIntervenants(next);
  };

  // Plusieurs métiers pour une même personne — on met à jour la liste
  // `metiers` et on garde `metier` synchronisé sur le premier choisi,
  // pour que tout ce qui lit encore l'ancien champ reste cohérent.
  const updateIntervenantMetiers = (code, metiers) => {
    const patch = { metiers, metier: metiers[0] || "À définir" };
    const exists = intervenants.some((i) => i.code === code);
    const next = exists
      ? intervenants.map((i) => (i.code === code ? { ...i, ...patch } : i))
      : [...intervenants, { code, nomComplet: "", ...patch }];
    persistIntervenants(next);
  };

  const updateIntervenantNom = (code, nomComplet) => {
    const exists = intervenants.some((i) => i.code === code);
    const next = exists
      ? intervenants.map((i) => (i.code === code ? { ...i, nomComplet } : i))
      : [...intervenants, { code, metier: "À définir", nomComplet }];
    persistIntervenants(next);
  };

  const updateIntervenantCouleur = (code, couleur) => {
    const exists = intervenants.some((i) => i.code === code);
    const next = exists
      ? intervenants.map((i) => (i.code === code ? { ...i, couleur } : i))
      : [...intervenants, { code, metier: "À définir", nomComplet: "", couleur }];
    persistIntervenants(next);
  };

  // Bloquer/débloquer un·e intervenant·e (arrêt maladie, démission,
  // autre) — réservé au·à la chef·fe d'équipe via l'onglet Intervenants.
  const updateIntervenantBlocage = (code, patch) => {
    const exists = intervenants.some((i) => i.code === code);
    const next = exists
      ? intervenants.map((i) => (i.code === code ? { ...i, ...patch } : i))
      : [...intervenants, { code, metier: "À définir", nomComplet: "", ...patch }];
    persistIntervenants(next);
    flash(patch.statutActivite === "bloque" ? `${code} marqué·e comme bloqué·e` : `${code} débloqué·e`);
  };

  // Renommer les initiales (code) d'un·e intervenant·e : répercuté sur
  // le référentiel, sur toutes les actions déjà planifiées et sur les
  // comptes reliés à cet ancien code, pour que rien ne se perde.
  const renameIntervenantCode = (oldCode, rawNewCode) => {
    const newCode = (rawNewCode || "").trim();
    if (!newCode) { flash("Indique de nouvelles initiales avant de valider"); return; }
    if (newCode === oldCode) return;
    if (allIntervenantCodes.includes(newCode)) { flash("Ces initiales sont déjà utilisées par quelqu'un d'autre"); return; }

    persistIntervenants(intervenants.map((i) => (i.code === oldCode ? { ...i, code: newCode } : i)));
    persistEvents(events.map((e) => (
      e.intervenants.includes(oldCode)
        ? { ...e, intervenants: e.intervenants.map((c) => (c === oldCode ? newCode : c)) }
        : e
    )));
    persistAccounts(accounts.map((a) => (a.intervenantCode === oldCode ? { ...a, intervenantCode: newCode } : a)));
    flash(`Initiales changées : ${oldCode} → ${newCode}`);
  };

  const addIntervenant = (code, nomComplet) => {
    if (!code.trim()) { flash("Indique un code avant d'ajouter"); return; }
    if (intervenants.some((i) => i.code === code.trim())) { flash("Code déjà existant"); return; }
    persistIntervenants([...intervenants, { code: code.trim(), metier: "À définir", nomComplet: (nomComplet || "").trim(), couleur: pickUnusedColor(intervenants) }]);
    flash("Intervenant ajouté");
  };

  const resetFilters = () => {
    setFProjet("all"); setFCategorie("all"); setFType("all");
    setFIntervenant("all"); setFStatut("all"); setFSearch(""); setFUpcoming(false); setFTransport("all");
  };

  const NAV_BASE = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutGrid },
    { id: "planning", label: "Calendrier", icon: CalendarDays },
    { id: "events", label: "Recherche d'actions", icon: Table2 },
    { id: "projects", label: "Dossiers projets", icon: FolderOpen },
    { id: "appels_projet", label: "Appels à projet en cours", icon: Send },
    { id: "finance", label: "Suivi financier", icon: PieChartIcon },
    { id: "devis", label: "Devis", icon: FileSignature },
    { id: "dossiers_refuses", label: "Dossiers refusés", icon: Archive },
    { id: "people", label: "Intervenants", icon: Users },
    { id: "workload", label: "Plan de charge", icon: Gauge },
  ];
  const NAV_ROLE = {
    intervenant: [{ id: "mon_espace", label: "Mon espace", icon: HeartHandshake }],
    charge_projet: [
      { id: "mes_projets", label: "Mes projets", icon: Briefcase },
      { id: "mon_temps", label: "Gérer mon temps", icon: ListChecks },
    ],
    chef_projet: [
      { id: "mes_projets", label: "Mes projets", icon: Star },
      { id: "mon_temps", label: "Gérer mon temps", icon: ListChecks },
    ],
    secretariat: [
      { id: "secretariat", label: "Secrétariat", icon: ClipboardList },
    ],
    chef_equipe: [
      { id: "pilotage", label: "Pilotage", icon: UserCog },
      { id: "gestion_humaine", label: "Gestion humaine", icon: Users },
      { id: "mon_temps", label: "Gérer mon temps", icon: ListChecks },
      { id: "backup", label: "Sauvegarder les données", icon: Save, color: RED },
    ],
  };
  // Avec les verrous désactivés, on additionne les onglets de tous les
  // rôles (sans doublons) pour que chacun puisse tout parcourir.
  const roleExtra = !session ? [] : (!LOCKS_ENABLED
    ? Object.values(NAV_ROLE).flat().filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i)
    : (NAV_ROLE[session.role] || []));
  const canSeeWorkload = !LOCKS_ENABLED ? !!session : (session && WORKLOAD_ROLES.has(session.role));
  const canSeePeople = !LOCKS_ENABLED ? !!session : (session && PEOPLE_ROLES.has(session.role));
  const canSeeFinance = !LOCKS_ENABLED ? !!session : (session && FINANCE_ROLES.has(session.role));
  const navBase = NAV_BASE.filter((n) => (n.id !== "workload" || canSeeWorkload) && (n.id !== "people" || canSeePeople) && (n.id !== "finance" || canSeeFinance) && (n.id !== "devis" || canSeeFinance) && (n.id !== "dossiers_refuses" || canSeeFinance));
  // « Gérer mon temps » et « Sauvegarder les données » restent toujours
  // en toute dernière position par défaut, pour que les onglets de
  // pilotage/planning collectif passent en premier.
  const NAV_BEFORE_ORDER = [
    ...roleExtra.filter((n) => n.id !== "mon_temps" && n.id !== "backup"),
    ...navBase,
    ...roleExtra.filter((n) => n.id === "mon_temps"),
    ...roleExtra.filter((n) => n.id === "backup"),
  ];
  const savedTabOrder = currentAccount?.tabOrder;
  const NAV = Array.isArray(savedTabOrder) && savedTabOrder.length > 0
    ? [
        ...savedTabOrder.map((id) => NAV_BEFORE_ORDER.find((n) => n.id === id)).filter(Boolean),
        ...NAV_BEFORE_ORDER.filter((n) => !savedTabOrder.includes(n.id)),
      ]
    : NAV_BEFORE_ORDER;

  // au premier chargement d'une session, on atterrit sur l'onglet dédié au rôle
  useEffect(() => {
    if (session) {
      const r = roleMeta(session.role);
      if (r) setTab(r.landingTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accountId]);

  return (
    <div style={{ background: PAPER, minHeight: "100vh", color: INK, fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Livvic:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body, .base-text { font-size: 15px; line-height: 1.55; }

        /* — Typographie : le display porte la personnalité, le mono porte les chiffres — */
        .disp { font-family: 'Livvic', sans-serif; letter-spacing: -0.015em; }
        .disp.text-2xl, .disp.text-xl { letter-spacing: -0.025em; }
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .muted { color: ${MUTED}; }

        /* — Indicateurs : le chiffre est le héros, la colonne le qualifie — */
        .stat-value { font-size: 27px; line-height: 1.05; }
        @media (min-width: 640px) { .stat-value { font-size: 30px; } }
        .stat-card { transition: transform .2s cubic-bezier(.4,0,.2,1), box-shadow .2s ease; }
        main .stat-card:hover { transform: translateY(-2px); }

        /* — Onglets : rail compact, l'actif se détache en relief — */
        .nav-tab { transition: background .18s ease, color .18s ease, transform .12s ease; }
        .nav-tab:not(.nav-tab-active):hover { background: rgba(255,255,255,0.22) !important; }
        .nav-tab:active { transform: translateY(1px); }

        /* — Profondeur : les cartes flottent sur l'Azure Mist au lieu d'être cernées — */
        main .bg-white.rounded-lg,
        main .bg-white.rounded-xl,
        main .bg-white.rounded-md {
          border-radius: ${RADIUS_CARD}px;
          border-color: rgba(3,93,114,.07) !important;
          box-shadow: ${SHADOW_MD};
          transition: box-shadow .22s ease, transform .22s ease;
        }
        /* Les cartes cliquables réagissent ; les cartes d'information restent stables */
        main .bg-white.rounded-lg:hover { box-shadow: ${SHADOW_LG}; }

        /* Une carte dans une carte se lit comme une ligne de liste, pas
           comme une carte concurrente : on retire l'élévation imbriquée. */
        main .bg-white.rounded-lg .bg-white.rounded-lg,
        main .bg-white.rounded-xl .bg-white.rounded-lg {
          box-shadow: none;
          border-color: rgba(3,93,114,.11) !important;
        }
        main .bg-white.rounded-lg .bg-white.rounded-lg:hover,
        main .bg-white.rounded-xl .bg-white.rounded-lg:hover {
          box-shadow: ${SHADOW_SM};
          border-color: rgba(85,206,183,.55) !important;
        }

        /* — Contrôles : rayon cohérent et respiration — */
        main button.rounded-md, main .rounded-md input, main select, main textarea { border-radius: ${RADIUS_CTRL}px; }
        main input[type="text"], main input[type="number"], main input[type="date"],
        main input:not([type]), main select, main textarea {
          border-radius: ${RADIUS_CTRL}px;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        /* — Signal turquoise : focus, survol, éléments actifs — */
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${SIGNAL_DEEP} !important;
          box-shadow: 0 0 0 3px rgba(85,206,183,.28);
        }
        button:focus-visible, [tabindex]:focus-visible, label:focus-within {
          outline: 2px solid ${SIGNAL_DEEP};
          outline-offset: 2px;
          border-radius: 4px;
        }
        ::selection { background: rgba(85,206,183,.32); }

        /* — Boutons : lift discret au survol, jamais tape-à-l'œil — */
        main button:not(:disabled) { transition: filter .18s ease, transform .18s ease, box-shadow .18s ease; }
        main button:not(:disabled):hover { filter: brightness(1.06); }
        main button:not(:disabled):active { transform: translateY(1px); }

        /* — Barres de progression : le turquoise signale l'avancement — */
        .h-1\\.5 > div, .h-2 > div, .h-2\\.5 > div { transition: width .5s cubic-bezier(.4,0,.2,1); }

        table { border-collapse: collapse; }
        input, select, textarea { font-family: inherit; }
        .row-status { transition: filter .15s ease; }
        .row-status:hover { filter: brightness(0.96); }

        ::-webkit-scrollbar { height: 9px; width: 9px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(3,93,114,.18); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(3,93,114,.3); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
        }
      `}</style>

      {!dataReady ? (
        <LoadingGate />
      ) : !session ? (
        <RoleGate
          accounts={accounts}
          intervenants={intervenants}
          onCreateAccount={handleCreateAccount}
          onLogin={handleLogin}
        />
      ) : (
      <>
      {/* ---------- HEADER / TABS EN ONGLETS DE CLASSEUR ---------- */}
      <header
        style={{
          // Le dégradé part de la couleur du rôle et rejoint toujours le
          // Dark Teal institutionnel : chaque espace garde son identité
          // tout en restant visiblement « Institut Pasteur de Lille ».
          background: `linear-gradient(112deg, ${roleColor} 0%, ${mixHex(roleColor, INK, 0.55)} 62%, ${lighten(INK, -14)} 100%)`,
          borderBottom: `2px solid ${SIGNAL}`,
        }}
        className="text-white"
      >
        <div className="max-w-[1450px] mx-auto px-5 pt-4 pb-0">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white rounded-xl p-1.5 shrink-0 hidden sm:block" style={{ boxShadow: "0 2px 10px rgba(0,0,0,.18)" }}>
                <BrandEmblem size={28} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] mono uppercase tracking-[0.22em] leading-none" style={{ color: INK_TEXT_MUTED }}>
                  Institut Pasteur de Lille
                </div>
                <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                  <h1 className="disp text-lg sm:text-xl leading-none" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                    Coordination de projets
                  </h1>
                  {session && (() => {
                    const role = roleMeta(session.role);
                    const RoleIcon = role?.Icon;
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide"
                        style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)" }}
                      >
                        {RoleIcon && <RoleIcon size={11} />} {role?.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="mono text-xs px-3 py-1.5 rounded hidden md:block" style={{ background: roleColorSoft }}>
                {events.length} évènements · {projects.length} projets
              </div>
              <button
                onClick={() => {
                  setToast("Ouverture de l'impression… Choisis « Enregistrer en PDF » comme imprimante. Si rien ne s'ouvre, utilise Ctrl+P (Cmd+P sur Mac).");
                  setTimeout(() => setToast(""), 6000);
                  try { window.print(); } catch (err) { /* le message de secours reste affiché */ }
                }}
                title="Imprimer ou enregistrer cette page en PDF (raccourci : Ctrl+P / Cmd+P)"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded transition no-print hover:brightness-110"
                style={{ background: AMBER, color: "#fff" }}
              >
                <Printer size={15} />
                <span>Imprimer / PDF</span>
              </button>
              <button
                onClick={() => setShowAccountModal(true)}
                title="Mon compte"
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded hover:brightness-110 transition"
                style={{ background: roleColorSoft, color: INK_TEXT_BODY }}
              >
                <UserCircle size={14} />
                <span className="hidden sm:inline">{session.nom}</span>
                <span className="hidden lg:inline opacity-70">· {roleMeta(session.role)?.label}</span>
              </button>
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded hover:brightness-110 transition"
                style={{ background: roleColorSoft, color: INK_TEXT_BODY }}
              >
                <LogOut size={14} />
              </button>
              {canEditPlanning && (
                <button
                  onClick={openNew}
                  style={{ background: AMBER }}
                  className="flex items-center gap-1.5 text-white text-sm font-semibold px-3.5 py-2 rounded hover:brightness-110 transition no-print"
                >
                  <Plus size={16} /> Nouvel évènement
                </button>
              )}
            </div>
          </div>
          {/* folder tabs — glisser-déposer pour réorganiser */}
          <SortableTabBar
            tabs={NAV} activeId={tab} onSelect={setTab} onReorder={updateTabOrder}
            activeColor={PAPER} inactiveColor={roleColorSoft} activeTextColor={INK} inactiveTextColor={INK_TEXT_BODY}
          />
        </div>
      </header>

      {/* légende des statuts, toujours visible */}
      <div className="border-b" style={{ background: "#fff", borderColor: LINE }}>
        <div className="max-w-[1450px] mx-auto px-5 py-2 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold uppercase tracking-wide text-[10px]" style={{ color: MUTED }}>Statuts :</span>
          {STATUS_ORDER.map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <StatusDot statut={k} /> {STATUS_META[k].label}
            </span>
          ))}
          {missingInfoEvents.length > 0 && (
            <button
              onClick={() => setTab("dashboard")}
              className="ml-auto flex items-center gap-1.5 font-medium no-print"
              style={{ color: "#8A5620" }}
            >
              <ShieldAlert size={13} /> {missingInfoEvents.length} évènement(s) avec information manquante
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body, .base-text { background: #fff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>
      <div className="print-only max-w-[1450px] mx-auto px-5 pt-6">
        <div className="text-xs mono uppercase tracking-wide" style={{ color: MUTED }}>
          Institut Pasteur de Lille — Coordination de projets · Imprimé le {fmtDate(today)}
        </div>
        <h1 className="disp text-xl" style={{ fontWeight: 600 }}>
          {NAV.find((n) => n.id === tab)?.label || "Application d'organisation et de pilotage de projet"}
        </h1>
      </div>

      <main className="max-w-[1450px] mx-auto px-5 py-6 base-text">
        <>
            {tab === "dashboard" && (
              <Dashboard
                events={scopedEvents} projects={projectStats} intervenants={intervenants}
                missingInfoEvents={missingInfoEvents}
                onGoProjects={() => setTab("projects")}
                onSelectProject={(id) => { setFProjet(id); setTab("events"); }}
                onEditEvent={openEdit} onSetStatut={setEventStatut} canEditPlanning={canEditPlanning}
                taches={taches} myIntervenantCode={linkedIntervenantCode} onRespondDelegation={respondDelegation}
              />
            )}

            {tab === "planning" && (
              <PlanningTab
                projects={scopedProjects} events={scopedEvents} intervenants={intervenants}
                allIntervenantCodes={allIntervenantCodes}
                onSetStatut={setEventStatut} onEdit={openEdit} canEditPlanning={canEditPlanning}
              />
            )}

            {tab === "events" && (
              <EventsTab
                projects={scopedProjects} events={filtered} allEventsUnfiltered={scopedEvents} intervenants={intervenants}
                allIntervenantCodes={allIntervenantCodes} allCategories={allCategories}
                fProjet={fProjet} setFProjet={setFProjet}
                fCategorie={fCategorie} setFCategorie={setFCategorie}
                fType={fType} setFType={setFType}
                fIntervenant={fIntervenant} setFIntervenant={setFIntervenant}
                fStatut={fStatut} setFStatut={setFStatut}
                fSearch={fSearch} setFSearch={setFSearch}
                fUpcoming={fUpcoming} setFUpcoming={setFUpcoming}
                fTransport={fTransport} setFTransport={setFTransport}
                resetFilters={resetFilters}
                onEdit={openEdit} onDelete={requestDeleteEvent} onSetStatut={setEventStatut}
                canEditPlanning={canEditPlanning}
              />
            )}

            {tab === "projects" && (
              <ProjectsTab
                projects={projectStats} events={scopedEvents} intervenants={intervenants}
                allCategories={allCategories}
                expanded={expandedProject} setExpanded={setExpandedProject}
                onEdit={openEdit} onDelete={requestDeleteEvent} onSetStatut={setEventStatut}
                canEditPlanning={canEditPlanning}
                canManageProjects={canManageProjects} onUpdateBudget={updateProjectBudget} onUpdateStatutFinancement={updateProjectStatutFinancement}
              />
            )}

            {tab === "appels_projet" && (
              <AppelsProjetTab
                projects={scopedProjects}
                canManageProjects={canManageProjects} onUpdateBudget={updateProjectBudget} onUpdateStatutFinancement={updateProjectStatutFinancement}
                onGoToProject={(id) => { setExpandedProject(id); setTab("projects"); }}
              />
            )}

            {tab === "devis" && !selectedDevisId && (
              <DevisTab
                devisListe={devisListe} session={session}
                onCreate={createDevis}
                onOpen={(id) => setSelectedDevisId(id)}
                onRequestDelete={requestDeleteDevis}
              />
            )}
            {tab === "devis" && selectedDevisId && (() => {
              const d = devisListe.find((x) => x.id === selectedDevisId);
              if (!d) { setSelectedDevisId(null); return null; }
              return (
                <DevisDetailView
                  devis={d} onUpdate={updateDevis} onUpdateStatut={updateDevisStatut}
                  onClose={() => setSelectedDevisId(null)} canManageProjects={canManageProjects}
                />
              );
            })()}

            {tab === "dossiers_refuses" && (
              <DossiersRefusesTab devisListe={devisListe} projects={scopedProjects} />
            )}

            {tab === "people" && canSeePeople && (
              <PeopleTab
                intervenants={intervenants} events={events} allCodes={allIntervenantCodes}
                onUpdateMetier={updateIntervenantMetier} onUpdateMetiers={updateIntervenantMetiers} onUpdateNom={updateIntervenantNom}
                onUpdateCouleur={updateIntervenantCouleur} onRenameCode={renameIntervenantCode} onAdd={addIntervenant}
                onFilter={(code) => { setFIntervenant(code); setTab("events"); }}
                onUpdateBlocage={updateIntervenantBlocage}
              />
            )}

            {tab === "workload" && canSeeWorkload && (
              <WorkloadTab
                intervenants={intervenants} events={events}
                allIntervenantCodes={allIntervenantCodes}
                tempsTravail={tempsTravail} accounts={accounts}
                projects={projects} etpParMetier={etpParMetier} onUpdateEtpMetier={updateEtpMetier}
              />
            )}

            {tab === "mon_espace" && (
              <MonEspaceTab
                session={session} events={events} projects={projects} intervenants={intervenants}
                tempsTravail={tempsTravail} onAddTemps={addTempsTravail} onRequestDeleteTemps={requestDeleteTemps}
                onSetStatut={setEventStatut} onEdit={openEdit}
                onUpdateComment={updateEventComment} onQuickAdd={quickAddEvent}
                onRequestDeleteEvent={requestDeleteEvent}
                onRaiseAlert={raiseAlert} onClearAlert={clearAlert}
                onOpenAccount={() => setShowAccountModal(true)}
              />
            )}

            {tab === "mes_projets" && (
              <MesProjetsTab
                session={session} projects={projects} events={events} intervenants={intervenants}
                onSetStatut={setEventStatut} onEdit={openEdit} onNewEvent={openNewForProject}
                onToggleFeatured={toggleFeatured} canFeature={session.role === "chef_projet"}
                currentAccount={currentAccount} onUpdateSelection={updateProjetsSelectionnes}
                allCategories={allCategories}
                canManageProjects={canManageProjects} onUpdateBudget={updateProjectBudget} onUpdateStatutFinancement={updateProjectStatutFinancement}
                onCreateProject={createProject}
              />
            )}

            {tab === "secretariat" && (
              <SecretariatTab
                projects={projects} events={events}
                onUpdateProjectMeta={updateProjectMeta}
                financeEntries={financeEntries} onClearFinanceAlert={clearFinanceAlert}
              />
            )}

            {tab === "pilotage" && (
              <PilotageTab
                projects={projects} events={events} intervenants={intervenants} accounts={accounts}
                onGoToProject={(id) => { setExpandedProject(id); setTab("projects"); }}
                onEdit={openEdit}
                currentAccount={currentAccount} onUpdateSelection={updateProjetsSelectionnes}
                allCategories={allCategories}
              />
            )}

            {tab === "mon_temps" && (
              <MonTempsTab
                session={session} taches={taches}
                onAddTache={addTache} onUpdateTache={updateTache} onRequestDeleteTache={requestDeleteTache}
                showTempsTravail={TEMPS_TRAVAIL_ROLES.has(session.role)}
                tempsTravail={tempsTravail} projects={projects} accounts={accounts} events={events}
                onAddTemps={addTempsTravail} onRequestDeleteTemps={requestDeleteTemps}
                allIntervenantCodes={allIntervenantCodes} onDelegateTache={delegateTache}
              />
            )}

            {tab === "gestion_humaine" && (
              <GestionHumaineTab
                events={events} intervenants={intervenants} accounts={accounts}
                tempsTravail={tempsTravail} allIntervenantCodes={allIntervenantCodes}
              />
            )}

            {tab === "backup" && (
              <SauvegardeTab
                events={events} projects={projects} intervenants={intervenants} accounts={accounts}
                tempsTravail={tempsTravail} taches={taches} financeEntries={financeEntries} financeObjectifs={financeObjectifs}
                onRestore={restoreFromBackup}
              />
            )}

            {tab === "finance" && (
              <FinanceTab
                session={session} entries={financeEntries} objectifs={financeObjectifs}
                onAdd={addFinanceEntry} onUpdate={updateFinanceEntry} onRequestDelete={requestDeleteFinance}
                onUpdateObjectifs={updateFinanceObjectifs} projects={projects}
                currentAccount={currentAccount} onUpdateFinanceSelection={updateFinanceSelection}
              />
            )}
        </>
      </main>

      {toast && (
        <div
          className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-sm flex items-start gap-2 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50"
          style={{ background: CARE_DARK }}
        >
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <span>{toast}</span>
        </div>
      )}

      {showForm && (
        <EventForm
          form={form} setForm={setForm} projects={projects} intervenants={intervenants}
          allCodes={allIntervenantCodes} allCategories={allCategories}
          onToggleIntervenant={toggleFormIntervenant}
          onCreateProject={createProject} canManageProjects={canManageProjects}
          onSubmit={submitForm} onClose={closeForm}
          onDelete={editingId ? () => { closeForm(); requestDeleteEvent(editingId); } : null}
          isEdit={!!editingId}
        />
      )}

      {showAccountModal && currentAccount && (
        <AccountModal account={currentAccount} intervenants={intervenants} onClose={() => setShowAccountModal(false)} onSave={handleSaveAccount} />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Supprimer cet évènement ? Cette action est irréversible."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={confirmDeleteEvent}
        />
      )}

      {confirmDeleteTacheId && (
        <ConfirmDialog
          message="Supprimer cette tâche ?"
          onCancel={() => setConfirmDeleteTacheId(null)}
          onConfirm={confirmDeleteTache}
        />
      )}

      {confirmDeleteTempsId && (
        <ConfirmDialog
          message="Supprimer cette entrée de temps de travail ?"
          onCancel={() => setConfirmDeleteTempsId(null)}
          onConfirm={confirmDeleteTemps}
        />
      )}

      {confirmDeleteFinanceId && (
        <ConfirmDialog
          message="Supprimer cette ligne du suivi financier ?"
          onCancel={() => setConfirmDeleteFinanceId(null)}
          onConfirm={confirmDeleteFinance}
        />
      )}
      {confirmDeleteDevisId && (
        <ConfirmDialog
          message="Supprimer définitivement ce devis ?"
          onCancel={() => setConfirmDeleteDevisId(null)}
          onConfirm={confirmDeleteDevis}
        />
      )}
      </>
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ events: allEvents, projects, intervenants, missingInfoEvents, onSelectProject, onEditEvent, onSetStatut, canEditPlanning, taches, myIntervenantCode, onRespondDelegation }) {
  const [viewMode, setViewMode] = useState("lineaire"); // "lineaire" | "kanban"
  const [commentaires, setCommentaires] = useState({});
  // Sélection de période — mois par mois, ou une période personnalisée
  // (dates de début/fin libres). Par défaut, tout est affiché comme
  // avant ; le choix d'une période filtre l'ensemble des chiffres du
  // tableau de bord (statuts, avancement, alertes, prochaines actions).
  const [periodMode, setPeriodMode] = useState("all"); // "all" | "month" | "range"
  const [periodMonth, setPeriodMonth] = useState(today.slice(0, 7));
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const events = useMemo(() => {
    if (periodMode === "month") return allEvents.filter((e) => e.date && e.date.startsWith(periodMonth));
    if (periodMode === "range" && periodStart && periodEnd) return allEvents.filter((e) => e.date && e.date >= periodStart && e.date <= periodEnd);
    return allEvents;
  }, [allEvents, periodMode, periodMonth, periodStart, periodEnd]);
  const periodLabel = periodMode === "month"
    ? new Date(periodMonth + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : periodMode === "range" && periodStart && periodEnd
      ? `du ${fmtDate(periodStart)} au ${fmtDate(periodEnd)}`
      : null;
  const tachesDeleguees = useMemo(
    () => (myIntervenantCode ? (taches || []).filter((t) => t.delegueA === myIntervenantCode && t.delegueStatut === "en_attente") : []),
    [taches, myIntervenantCode]
  );
  const upcoming = events
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
  const uncertain = events.filter((e) => e.incertain);
  const alertedEvents = useMemo(() => events.filter((e) => e.alerte), [events]);
  const byCategorie = useMemo(() => {
    const projIds = new Set(events.map((e) => e.projetId));
    const countByProj = {};
    events.forEach((e) => { countByProj[e.projetId] = (countByProj[e.projetId] || 0) + 1; });
    const m = {};
    projects.forEach((p) => { if (periodMode === "all" || projIds.has(p.id)) m[p.categorie] = (m[p.categorie] || 0) + (periodMode === "all" ? p.count : (countByProj[p.id] || 0)); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [projects, events, periodMode]);
  const statusCounts = useMemo(() => {
    const c = { previsionnel: 0, en_cours: 0, realise: 0, annule: 0 };
    events.forEach((e) => { const s = normalizeStatut(e.statut); c[s] = (c[s] || 0) + 1; });
    return c;
  }, [events]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {tachesDeleguees.length > 0 && (
        <div className="lg:col-span-3 rounded-lg border p-5" style={{ borderColor: PURPLE + "55", background: PURPLE + "0a" }}>
          <div className="flex items-center gap-2 mb-3">
            <Send size={16} style={{ color: PURPLE }} />
            <span className="text-sm font-bold" style={{ color: PURPLE }}>
              {tachesDeleguees.length > 1 ? `${tachesDeleguees.length} tâches te sont déléguées` : "Une tâche t'est déléguée"} — réponse attendue
            </span>
          </div>
          <div className="space-y-3">
            {tachesDeleguees.map((t) => (
              <div key={t.id} className="bg-white rounded-md border p-3" style={{ borderColor: LINE }}>
                <p className="text-sm font-medium mb-2">{t.texte}</p>
                <input
                  value={commentaires[t.id] ?? ""} onChange={(e) => setCommentaires((c) => ({ ...c, [t.id]: e.target.value }))}
                  placeholder="Commentaire (optionnel)"
                  className="w-full text-xs border rounded-md px-2.5 py-1.5 mb-2" style={{ borderColor: LINE }}
                />
                <div className="flex gap-2">
                  <button onClick={() => onRespondDelegation(t.id, "accepte", commentaires[t.id])} className="text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ background: GREEN }}>Accepter</button>
                  <button onClick={() => onRespondDelegation(t.id, "refuse", commentaires[t.id])} className="text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ background: RED }}>Refuser</button>
                  <button onClick={() => onRespondDelegation(t.id, "peut_etre", commentaires[t.id])} className="text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ background: AMBER }}>Peut-être</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-lg border p-3 flex flex-wrap items-center gap-2" style={{ borderColor: LINE }}>
          <span className="text-xs font-medium muted pl-1">Période :</span>
          <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
            <button onClick={() => setPeriodMode("all")} className="text-xs font-semibold px-3 py-1.5" style={{ background: periodMode === "all" ? CARE : "transparent", color: periodMode === "all" ? "#fff" : INK }}>Tout</button>
            <button onClick={() => setPeriodMode("month")} className="text-xs font-semibold px-3 py-1.5" style={{ background: periodMode === "month" ? CARE : "transparent", color: periodMode === "month" ? "#fff" : INK }}>Un mois</button>
            <button onClick={() => setPeriodMode("range")} className="text-xs font-semibold px-3 py-1.5" style={{ background: periodMode === "range" ? CARE : "transparent", color: periodMode === "range" ? "#fff" : INK }}>Période choisie</button>
          </div>
          {periodMode === "month" && (
            <input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }} />
          )}
          {periodMode === "range" && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }} />
              <span className="text-xs muted">→</span>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }} />
            </div>
          )}
          {periodLabel && <span className="text-xs mono px-2 py-1 rounded" style={{ background: CARE + "12", color: CARE_DARK }}>{events.length} action{events.length > 1 ? "s" : ""} {periodLabel}</span>}
        </div>

        <div className="bg-white rounded-lg border p-3 flex items-center gap-2" style={{ borderColor: LINE }}>
          <span className="text-xs font-medium muted pl-1">Affichage des actions :</span>
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: LINE }}>
            <button
              onClick={() => setViewMode("lineaire")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
              style={{ background: viewMode === "lineaire" ? CARE : "transparent", color: viewMode === "lineaire" ? "#fff" : INK }}
            >
              <LayoutList size={13} /> Linéaire
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
              style={{ background: viewMode === "kanban" ? CARE : "transparent", color: viewMode === "kanban" ? "#fff" : INK }}
            >
              <LayoutGrid size={13} /> Par statut
            </button>
          </div>
        </div>

        {alertedEvents.length > 0 && (
          <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: RED }} />
              <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: RED }}>
                Alertes de l'équipe ({alertedEvents.length})
              </span>
              <span className="flex-1 h-px" style={{ background: RED + "33" }} />
            </div>
            <ul className="space-y-2">
              {alertedEvents.map((e) => {
                const proj = projects.find((p) => p.id === e.projetId);
                return (
                  <li key={e.id} className="flex items-start gap-2 text-xs">
                    <AlertTriangle size={13} style={{ color: RED }} className="shrink-0 mt-0.5" />
                    <span className="flex-1">
                      <span className="font-semibold">{e.alerte.auteur}</span> — {proj?.nom} ({fmtDate(e.date)}) : {e.alerte.message}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <SectionLabel>Avancement global</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATUS_ORDER.map((k) => (
              <div key={k} className="rounded-md p-3 text-center" style={{ background: STATUS_META[k].color + "15" }}>
                <div className="disp text-2xl" style={{ fontWeight: 600, color: STATUS_META[k].color }}>{statusCounts[k]}</div>
                <div className="text-[11px] font-medium mt-0.5" style={{ color: STATUS_META[k].color }}>{STATUS_META[k].label}</div>
              </div>
            ))}
          </div>
        </div>

        {viewMode === "kanban" ? (
          <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
            <SectionLabel>Toutes les actions — par statut ({events.length})</SectionLabel>
            <KanbanBoard
              events={events} projects={projects} intervenants={intervenants}
              onSetStatut={onSetStatut} onEdit={onEditEvent} canEditPlanning={canEditPlanning}
            />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
              <SectionLabel>Prochaines échéances</SectionLabel>
              {upcoming.length === 0 ? (
                <p className="text-sm muted">Aucune échéance à venir enregistrée.</p>
              ) : (
                <div className="space-y-1.5">
                  {upcoming.map((e) => {
                    const proj = projects.find((p) => p.id === e.projetId);
                    const missing = isMissingInfo(e);
                    const Wrapper = canEditPlanning ? "button" : "div";
                    return (
                      <Wrapper
                        key={e.id} onClick={canEditPlanning ? () => onEditEvent(e) : undefined}
                        className="w-full flex items-center gap-3 py-2.5 text-left row-status rounded-md px-2"
                        style={statusRowStyle(e.statut)}
                      >
                        <StatusDot statut={e.statut} />
                        <div className="mono text-center w-14 shrink-0">
                          <div className="text-[10px] uppercase muted">{dow(e.date)}</div>
                          <div className="text-sm font-semibold">{fmtDate(e.date).slice(0, 5)}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{e.type} — {proj?.nom}</div>
                          <div className="text-xs muted truncate flex items-center gap-1">
                            <MapPin size={11} /> {e.lieu || "—"} {e.horaire ? `· ${e.horaire}` : ""}
                          </div>
                        </div>
                        {missing.length > 0 && <MissingBadge missing={missing} />}
                        {e.alerte && <AlertBadge alerte={e.alerte} />}
                        <div className="flex gap-1 shrink-0">
                          {e.intervenants.map((c) => <IntervenantChip key={c} code={c} intervenants={intervenants} />)}
                        </div>
                      </Wrapper>
                    );
                  })}
                </div>
              )}
              <button onClick={() => onSelectProject("all")} className="text-xs font-medium mt-3" style={{ color: CARE_DARK }}>
                Voir tous les évènements →
              </button>
            </div>

            <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
              <SectionLabel>Dossiers projets</SectionLabel>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="text-left border rounded-md p-3 hover:shadow-sm transition"
                    style={{ borderColor: LINE }}
                  >
                    <div className="text-[10px] mono uppercase tracking-wide muted">{p.categorie}</div>
                    <div className="text-sm font-semibold leading-snug mt-0.5">{p.nom}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs muted">{p.count} évènement{p.count > 1 ? "s" : ""}</span>
                      {p.next && (
                        <span className="text-[11px] mono px-1.5 py-0.5 rounded" style={{ background: CARE + "1a", color: CARE_DARK }}>
                          {fmtDate(p.next)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <SectionLabel>Répartition par thématique</SectionLabel>
          <div className="space-y-2">
            {byCategorie.map(([cat, count]) => {
              const max = byCategorie[0][1];
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1 items-center gap-1">
                    <span className="flex items-center gap-1 min-w-0"><span className="truncate">{cat}</span><ProgrammeTag categorie={cat} /></span>
                    <span className="mono muted shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: PAPER_DARK }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${(count / max) * 100}%`, background: CARE }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} style={{ color: AMBER }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: CARE_DARK }}>
              Informations manquantes
            </span>
            <span className="flex-1 h-px" style={{ background: LINE }} />
          </div>
          {missingInfoEvents.length === 0 ? (
            <p className="text-sm muted">Tous les évènements ont un lieu et au moins un intervenant renseignés.</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {missingInfoEvents.slice(0, 10).map(({ e, missing }) => {
                const proj = projects.find((p) => p.id === e.projetId);
                return (
                  <li key={e.id}>
                    <button onClick={() => onEditEvent(e)} className="w-full text-left flex items-start gap-2 text-xs hover:bg-[#FAFBFC] rounded p-1 -m-1">
                      <AlertCircle size={13} style={{ color: AMBER }} className="shrink-0 mt-0.5" />
                      <span className="flex-1">
                        <span className="font-medium">{proj?.nom}</span> — {e.type} ({fmtDate(e.date)})
                      </span>
                      <MissingBadge missing={missing} />
                    </button>
                  </li>
                );
              })}
              {missingInfoEvents.length > 10 && (
                <li className="text-xs muted">+ {missingInfoEvents.length - 10} autre(s)…</li>
              )}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <SectionLabel>Dates à sécuriser</SectionLabel>
          {uncertain.length === 0 ? (
            <p className="text-sm muted">Aucune date incertaine.</p>
          ) : (
            <ul className="space-y-2">
              {uncertain.slice(0, 6).map((e) => {
                const proj = projects.find((p) => p.id === e.projetId);
                return (
                  <li key={e.id} className="flex items-start gap-2 text-xs">
                    <AlertCircle size={14} style={{ color: AMBER }} className="shrink-0 mt-0.5" />
                    <span><span className="font-medium">{proj?.nom}</span> — {e.type} : {e.notes || "date à confirmer"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PLANNING — VUE MACRO / MICRO
   ============================================================ */
function PlanningTab({ projects, events, intervenants, allIntervenantCodes, onSetStatut, onEdit, canEditPlanning }) {
  const [view, setView] = useState("macro"); // "macro" | "micro"
  const [pProjet, setPProjet] = useState("all");
  const [pStatut, setPStatut] = useState("all");
  const [pSearch, setPSearch] = useState("");

  const filtered = useMemo(() => {
    return events
      .filter((e) => pProjet === "all" || e.projetId === pProjet)
      .filter((e) => pStatut === "all" || e.statut === pStatut)
      .filter((e) => {
        if (!pSearch.trim()) return true;
        const proj = projects.find((p) => p.id === e.projetId);
        const hay = [e.type, e.lieu, e.notes, proj?.nom].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(pSearch.toLowerCase());
      })
      .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  }, [events, pProjet, pStatut, pSearch, projects]);

  const monthsOrdered = useMemo(() => {
    const set = new Set();
    filtered.forEach((e) => { monthsSpanned(e).forEach((m) => set.add(m)); });
    return Array.from(set).sort().map((ym) => ({
      key: ym,
      label: new Date(ym + "-01").toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    }));
  }, [filtered]);

  const projectsWithEvents = useMemo(() => {
    const ids = new Set(filtered.map((e) => e.projetId));
    return projects.filter((p) => ids.has(p.id));
  }, [filtered, projects]);

  const groupedByMonth = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const key = e.date ? e.date.slice(0, 7) : "sans-date";
      (map[key] = map[key] || []).push(e);
    });
    return map;
  }, [filtered]);
  const monthKeysMicro = useMemo(() => {
    const keys = Object.keys(groupedByMonth).filter((k) => k !== "sans-date").sort();
    if (groupedByMonth["sans-date"]) keys.push("sans-date");
    return keys;
  }, [groupedByMonth]);

  return (
    <div>
      <div className="bg-white rounded-lg border p-4 mb-4 flex flex-wrap items-center gap-2" style={{ borderColor: LINE }}>
        <div className="flex rounded-md border overflow-hidden" style={{ borderColor: LINE }}>
          <button
            onClick={() => setView("macro")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            style={{ background: view === "macro" ? CARE : "transparent", color: view === "macro" ? "#fff" : INK }}
          >
            <LayoutGrid size={13} /> Vue macro
          </button>
          <button
            onClick={() => setView("micro")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            style={{ background: view === "micro" ? CARE : "transparent", color: view === "micro" ? "#fff" : INK }}
          >
            <LayoutList size={13} /> Vue micro (agenda)
          </button>
          <button
            onClick={() => setView("kanban")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            style={{ background: view === "kanban" ? CARE : "transparent", color: view === "kanban" ? "#fff" : INK }}
          >
            <Table2 size={13} /> Par statut
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 muted" />
          <input
            value={pSearch} onChange={(e) => setPSearch(e.target.value)}
            placeholder="Rechercher…"
            className="pl-8 pr-3 py-1.5 text-sm border rounded-md w-56"
            style={{ borderColor: LINE }}
          />
        </div>
        <select value={pProjet} onChange={(e) => setPProjet(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
          <option value="all">Tous les projets</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <select value={pStatut} onChange={(e) => setPStatut(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
          <option value="all">Tous les statuts</option>
          {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
        </select>
        <div className="ml-auto text-xs muted">{filtered.length} évènement(s)</div>
      </div>

      {view === "macro" ? (
        <div className="bg-white rounded-lg border p-5 overflow-x-auto" style={{ borderColor: LINE }}>
          <SectionLabel>Vue macro — densité de la planification par projet et par mois</SectionLabel>
          {monthsOrdered.length === 0 ? (
            <p className="text-sm muted py-6 text-center">Aucun évènement daté ne correspond à ces filtres.</p>
          ) : (
            <table className="text-xs min-w-full">
              <thead>
                <tr>
                  <th className="text-left px-2 py-2 sticky left-0 bg-white z-10 min-w-[220px]">Projet</th>
                  {monthsOrdered.map((m) => (
                    <th key={m.key} className="px-2 py-2 text-center mono whitespace-nowrap">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectsWithEvents.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: LINE }}>
                    <td className="px-2 py-2 sticky left-0 bg-white">
                      <div className="text-[10px] mono uppercase muted flex items-center gap-1">{p.categorie}<ProgrammeTag categorie={p.categorie} /></div>
                      <div className="font-medium">{p.nom}</div>
                    </td>
                    {monthsOrdered.map((m) => {
                      const evs = filtered.filter((e) => e.projetId === p.id && monthsSpanned(e).includes(m.key));
                      if (evs.length === 0) return <td key={m.key} className="px-2 py-2 text-center"><span className="opacity-20">·</span></td>;
                      const counts = { previsionnel: 0, en_cours: 0, realise: 0, annule: 0 };
                      evs.forEach((e) => { const s = normalizeStatut(e.statut); counts[s] = (counts[s] || 0) + 1; });
                      return (
                        <td key={m.key} className="px-2 py-2 text-center">
                          <div
                            className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md text-white font-semibold mb-1"
                            style={{ background: CARE, opacity: 0.4 + Math.min(evs.length, 6) * 0.1 }}
                            title={`${evs.length} évènement(s)`}
                          >
                            {evs.length}
                          </div>
                          <div className="flex items-center justify-center gap-0.5">
                            {STATUS_ORDER.filter((k) => counts[k] > 0).map((k) => (
                              <span key={k} title={`${counts[k]} ${STATUS_META[k].label.toLowerCase()}`} style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_META[k].color, display: "inline-block" }} />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : view === "micro" ? (
        <div className="space-y-5">
          {monthKeysMicro.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-sm muted" style={{ borderColor: LINE }}>
              Aucun évènement ne correspond à ces filtres.
            </div>
          ) : (
            monthKeysMicro.map((key) => {
              const label = key === "sans-date" ? "Sans date" : new Date(key + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
              return (
                <div key={key} className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                  <div className="px-4 py-2.5 text-sm font-semibold sticky top-0" style={{ background: PAPER_DARK }}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                    <span className="mono text-xs muted ml-2">({groupedByMonth[key].length})</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: LINE }}>
                    {groupedByMonth[key].map((e) => {
                      const proj = projects.find((p) => p.id === e.projetId);
                      const missing = isMissingInfo(e);
                      return (
                        <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm row-status" style={statusRowStyle(e.statut)}>
                          <div className="mono w-24 shrink-0 muted">{fmtDateRange(e)}</div>
                          <div className="w-36 shrink-0"><Pill color={CARE}>{e.type}</Pill></div>
                          {canEditPlanning ? (
                            <button onClick={() => onEdit(e)} className="flex-1 min-w-0 text-left">
                              <div className="font-medium truncate">{proj?.nom}</div>
                              <div className="text-xs muted truncate">{e.lieu || "Lieu non renseigné"}{e.horaire && e.horaire !== "—" ? ` · ${e.horaire}` : ""}</div>
                            </button>
                          ) : (
                            <div className="flex-1 min-w-0 text-left">
                              <div className="font-medium truncate">{proj?.nom}</div>
                              <div className="text-xs muted truncate">{e.lieu || "Lieu non renseigné"}{e.horaire && e.horaire !== "—" ? ` · ${e.horaire}` : ""}</div>
                            </div>
                          )}
                          {missing.length > 0 && <MissingBadge missing={missing} />}
                          {e.alerte && <AlertBadge alerte={e.alerte} />}
                          <div className="flex gap-1 shrink-0">
                            {e.intervenants.map((c) => <IntervenantChip key={c} code={c} intervenants={intervenants} />)}
                          </div>
                          <StatusControl statut={e.statut} onChange={(s) => onSetStatut(e.id, s)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <KanbanBoard
          events={filtered} projects={projects} intervenants={intervenants}
          onSetStatut={onSetStatut} onEdit={onEdit} canEditPlanning={canEditPlanning}
        />
      )}
    </div>
  );
}

/* ============================================================
   TABLEAU KANBAN — lecture des évènements en colonnes par statut.
   Changer le statut d'une carte (via StatusControl) la fait
   changer de colonne automatiquement.
   ============================================================ */
function KanbanCard({ e, proj, intervenants, onSetStatut, onEdit, canEditPlanning }) {
  const missing = isMissingInfo(e);
  const meta = STATUS_META[normalizeStatut(e.statut)];
  return (
    <div className="bg-white rounded-md p-2.5 shadow-sm" style={{ borderLeft: `3px solid ${meta.color}` }}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Pill color={CARE}>{e.type}</Pill>
        <span className="text-[11px] mono muted shrink-0">{fmtDateRange(e)}</span>
      </div>
      {canEditPlanning ? (
        <button onClick={() => onEdit(e)} className="block text-left w-full">
          <div className="text-xs font-semibold truncate">{proj?.nom}</div>
        </button>
      ) : (
        <div className="text-xs font-semibold truncate">{proj?.nom}</div>
      )}
      <div className="text-[11px] muted truncate mt-0.5">
        {e.lieu || "Lieu non renseigné"}{e.horaire && e.horaire !== "—" ? ` · ${e.horaire}` : ""}
      </div>
      {(missing.length > 0 || e.alerte) && (
        <div className="flex gap-1 flex-wrap mt-1.5">
          {missing.length > 0 && <MissingBadge missing={missing} />}
          {e.alerte && <AlertBadge alerte={e.alerte} />}
        </div>
      )}
      <div className="flex items-center justify-between gap-1 mt-2">
        <div className="flex gap-1 flex-wrap">
          {e.intervenants.map((c) => <IntervenantChip key={c} code={c} intervenants={intervenants} />)}
        </div>
        <StatusControl statut={e.statut} onChange={(s) => onSetStatut(e.id, s)} />
      </div>
    </div>
  );
}

function KanbanBoard({ events, projects, intervenants, onSetStatut, onEdit, canEditPlanning }) {
  const grouped = useMemo(() => {
    const map = {};
    STATUS_ORDER.forEach((k) => { map[k] = []; });
    events.forEach((e) => {
      const s = normalizeStatut(e.statut);
      (map[s] = map[s] || []).push(e);
    });
    return map;
  }, [events]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 items-start">
      {STATUS_ORDER.map((statusKey) => {
        const meta = STATUS_META[statusKey];
        const list = grouped[statusKey] || [];
        return (
          <div key={statusKey} className="shrink-0 w-[280px]">
            <div className="flex items-center gap-2 mb-2 px-1">
              <StatusDot statut={statusKey} />
              <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-[11px] mono muted ml-auto">{list.length}</span>
            </div>
            <div className="rounded-lg p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto" style={{ background: PAPER_DARK }}>
              {list.length === 0 ? (
                <p className="text-xs muted text-center py-6">Aucun évènement</p>
              ) : (
                list.map((e) => {
                  const proj = projects.find((p) => p.id === e.projetId);
                  return (
                    <KanbanCard
                      key={e.id} e={e} proj={proj} intervenants={intervenants}
                      onSetStatut={onSetStatut} onEdit={onEdit} canEditPlanning={canEditPlanning}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   EVENTS TAB
   ============================================================ */
function EventsTab({
  projects, events, allEventsUnfiltered, intervenants, allIntervenantCodes, allCategories,
  fProjet, setFProjet, fCategorie, setFCategorie, fType, setFType,
  fIntervenant, setFIntervenant, fStatut, setFStatut, fSearch, setFSearch, fUpcoming, setFUpcoming,
  fTransport, setFTransport,
  resetFilters, onEdit, onDelete, onSetStatut, canEditPlanning,
}) {
  const [viewMode, setViewMode] = useState("lineaire"); // "lineaire" | "kanban"
  const [showFilters, setShowFilters] = useState(false);
  const [showTransportSummary, setShowTransportSummary] = useState(false);
  const activeFilterCount = [fProjet, fCategorie, fType, fIntervenant, fStatut, fTransport].filter((v) => v !== "all").length + (fUpcoming ? 1 : 0);
  const transportCounts = useMemo(() => {
    const m = {};
    MODES_TRANSPORT.forEach((mo) => { m[mo] = 0; });
    let sansMode = 0;
    (allEventsUnfiltered || events).forEach((e) => { if (e.modeTransport) m[e.modeTransport] = (m[e.modeTransport] || 0) + 1; else sansMode += 1; });
    return { parMode: m, sansMode };
  }, [allEventsUnfiltered, events]);
  const byCat = useMemo(() => {
    const m = {};
    projects.forEach((p) => { (m[p.categorie] = m[p.categorie] || []).push(p); });
    return m;
  }, [projects]);
  return (
    <div>
      <div className="bg-white rounded-lg border p-4 mb-4" style={{ borderColor: LINE }}>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
            <button
              onClick={() => setViewMode("lineaire")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
              style={{ background: viewMode === "lineaire" ? CARE : "transparent", color: viewMode === "lineaire" ? "#fff" : INK }}
            >
              <LayoutList size={13} /> Linéaire
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
              style={{ background: viewMode === "kanban" ? CARE : "transparent", color: viewMode === "kanban" ? "#fff" : INK }}
            >
              <LayoutGrid size={13} /> Par statut
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 muted" />
            <input
              value={fSearch} onChange={(e) => setFSearch(e.target.value)}
              placeholder="Rechercher (lieu, contact, note...)"
              className="pl-8 pr-3 py-1.5 text-sm border rounded-md w-64"
              style={{ borderColor: LINE }}
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border shrink-0"
            style={{ borderColor: activeFilterCount > 0 ? CARE : LINE, color: activeFilterCount > 0 ? CARE_DARK : INK, background: activeFilterCount > 0 ? CARE + "12" : "transparent" }}
          >
            <Filter size={13} /> Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            {showFilters ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <button
            onClick={() => setShowTransportSummary((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border shrink-0"
            style={{ borderColor: showTransportSummary ? PURPLE : LINE, color: showTransportSummary ? PURPLE : INK, background: showTransportSummary ? PURPLE + "12" : "transparent" }}
          >
            <Car size={13} /> Modes de transport
          </button>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="text-xs font-medium ml-auto flex items-center gap-1" style={{ color: CARE_DARK }}>
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
        {showTransportSummary && (
          <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t" style={{ borderColor: LINE }}>
            {MODES_TRANSPORT.map((m) => {
              const tm = transportMeta(m);
              const TIcon = tm.Icon;
              const active = fTransport === m;
              return (
                <button
                  key={m}
                  onClick={() => setFTransport(active ? "all" : m)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md"
                  style={{ background: active ? tm.color : tm.color + "14", color: active ? "#fff" : tm.color }}
                >
                  <TIcon size={12} /> {m} <span className="mono">({transportCounts.parMode[m] || 0})</span>
                </button>
              );
            })}
            {transportCounts.sansMode > 0 && (
              <span className="text-xs muted">{transportCounts.sansMode} évènement{transportCounts.sansMode > 1 ? "s" : ""} sans mode renseigné</span>
            )}
          </div>
        )}
        {showFilters && (
          <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t" style={{ borderColor: LINE }}>
            <select value={fProjet} onChange={(e) => setFProjet(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5 max-w-[220px]" style={{ borderColor: LINE }}>
              <option value="all">Tous les projets</option>
              {allCategories.filter((c) => byCat[c]).map((cat) => (
                <optgroup key={cat} label={programmeForCategorie(cat) ? `${programmeForCategorie(cat).label} — ${cat}` : cat}>
                  {byCat[cat].map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </optgroup>
              ))}
            </select>
            <select value={fCategorie} onChange={(e) => setFCategorie(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
              <option value="all">Toutes les thématiques</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{programmeForCategorie(c) ? `${c} (${programmeForCategorie(c).label})` : c}</option>
              ))}
            </select>
            <select value={fType} onChange={(e) => setFType(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
              <option value="all">Tous les types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={fIntervenant} onChange={(e) => setFIntervenant(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
              <option value="all">Tous les intervenants</option>
              {allIntervenantCodes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fStatut} onChange={(e) => setFStatut(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
              <option value="all">Tous les statuts</option>
              {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
            </select>
            <select value={fTransport} onChange={(e) => setFTransport(e.target.value)} className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}>
              <option value="all">Tous les modes de transport</option>
              {MODES_TRANSPORT.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={fUpcoming} onChange={(e) => setFUpcoming(e.target.checked)} />
              À venir uniquement
            </label>
          </div>
        )}
      </div>

      {viewMode === "lineaire" ? (
        <>
          <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: LINE }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] mono uppercase tracking-wide" style={{ background: PAPER_DARK }}>
                  <th className="px-3 py-2.5">Statut</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Projet</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Horaire</th>
              <th className="px-3 py-2.5">Lieu</th>
              <th className="px-3 py-2.5">Intervenants</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-sm muted">Aucun évènement ne correspond à ces filtres.</td></tr>
            )}
            {events.map((e) => {
              const proj = projects.find((p) => p.id === e.projetId);
              const missing = isMissingInfo(e);
              return (
                <tr key={e.id} className="border-t row-status" style={{ borderColor: LINE, ...statusRowStyle(e.statut) }}>
                  <td className="px-3 py-2.5"><StatusControl statut={e.statut} onChange={(s) => onSetStatut(e.id, s)} /></td>
                  <td className="px-3 py-2.5 mono whitespace-nowrap">
                    {fmtDateRange(e)}
                    {e.incertain && <span title="Date incertaine"><AlertCircle size={12} className="inline ml-1 -mt-0.5" style={{ color: AMBER }} /></span>}
                  </td>
                  <td className="px-3 py-2.5 max-w-[220px]">
                    <div className="font-medium truncate">{proj?.nom}</div>
                    <div className="text-[11px] muted truncate flex items-center gap-1">
                      {proj?.categorie}
                      <ProgrammeTag categorie={proj?.categorie} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><Pill color={CARE}>{e.type}</Pill></td>
                  <td className="px-3 py-2.5 whitespace-nowrap opacity-90">{e.horaire || "—"}</td>
                  <td className="px-3 py-2.5 max-w-[200px] truncate" title={e.lieu}>
                    {e.lieu || <span style={{ color: AMBER }}>Non renseigné</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 flex-wrap items-center">
                      {e.intervenants.length === 0 ? <span style={{ color: AMBER }} className="text-xs">Aucun</span> :
                        e.intervenants.map((c) => <IntervenantChip key={c} code={c} intervenants={intervenants} />)}
                      {missing.length > 0 && <MissingBadge missing={missing} />}
                      {e.alerte && <AlertBadge alerte={e.alerte} />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {canEditPlanning ? (
                      <>
                        <button onClick={() => onEdit(e)} className="text-xs font-medium mr-2" style={{ color: CARE_DARK }}>Modifier</button>
                        <button onClick={() => onDelete(e.id)} className="text-xs font-medium" style={{ color: RED }}>Suppr.</button>
                      </>
                    ) : <span className="text-xs muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
            </table>
          </div>
          <div className="text-xs muted mt-2">{events.length} évènement(s) affiché(s)</div>
        </>
      ) : (
        <>
          <KanbanBoard
            events={events} projects={projects} intervenants={intervenants}
            onSetStatut={onSetStatut} onEdit={onEdit} canEditPlanning={canEditPlanning}
          />
          <div className="text-xs muted mt-2">{events.length} évènement(s) affiché(s)</div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   PROJECTS TAB
   ============================================================ */
function CategoryFolder({ cat, projs, events, intervenants, expanded, setExpanded, onEdit, onDelete, onSetStatut, canEditPlanning, isOpen, onToggle, nested, canManageProjects, onUpdateBudget, onUpdateStatutFinancement }) {
  const catEvCount = projs.reduce((s, p) => s + events.filter((e) => e.projetId === p.id).length, 0);
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: LINE, background: nested ? "#fff" : PAPER_DARK }}>
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-4 py-3 text-left">
        {isOpen ? <ChevronDown size={16} className="muted shrink-0" /> : <ChevronRight size={16} className="muted shrink-0" />}
        <FolderOpen size={16} style={{ color: CARE_DARK }} className="shrink-0" />
        <span className="text-sm font-semibold flex-1">{cat}</span>
        <span className="text-xs mono muted">{projs.length} sous-projet{projs.length > 1 ? "s" : ""} · {catEvCount} évt.</span>
      </button>
      {isOpen && (
        <div className="space-y-2 px-3 pb-3">
          {projs.map((p) => {
            const isProjOpen = expanded === p.id;
            const evs = events.filter((e) => e.projetId === p.id).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
            return (
              <div key={p.id} className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div
                  onClick={() => setExpanded(isProjOpen ? null : p.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isProjOpen ? <ChevronDown size={16} className="muted shrink-0" /> : <ChevronRight size={16} className="muted shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                        {p.nom}
                        {p.statutFinancement && (
                          <span
                            title={PROJECT_STATUT_META[p.statutFinancement].label}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: PROJECT_STATUT_META[p.statutFinancement].color + "1a", color: PROJECT_STATUT_META[p.statutFinancement].color }}
                          >
                            {React.createElement(PROJECT_STATUT_META[p.statutFinancement].Icon, { size: 10 })}
                            {PROJECT_STATUT_META[p.statutFinancement].label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs muted truncate">
                        Chef·fe de projet : {p.chargeDeProjet} {p.structure ? `· ${p.structure}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canManageProjects && (
                      <>
                        <input
                          type="number" placeholder="Budget €" defaultValue={p.budget ?? ""}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => onUpdateBudget(p.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                          className="w-24 text-xs border rounded px-1.5 py-1 text-right" style={{ borderColor: LINE }}
                        />
                        <ProjectStatutControl
                          statut={p.statutFinancement} date={p.statutFinancementDate}
                          onChange={(statut, date) => onUpdateStatutFinancement(p.id, statut, date)}
                        />
                      </>
                    )}
                    <div className="text-xs mono muted">{evs.length} évt.</div>
                  </div>
                </div>
                {isProjOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: LINE }}>
                    {p.contact && p.contact !== "—" && (
                      <div className="text-xs flex items-start gap-1.5 mt-3 mb-3 muted">
                        <Phone size={12} className="mt-0.5 shrink-0" /> {p.contact}
                      </div>
                    )}
                    {p.notes && <div className="text-xs muted italic mb-3">{p.notes}</div>}
                    {evs.length === 0 ? (
                      <p className="text-sm muted">Aucun évènement programmé pour ce dossier.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {evs.map((e) => {
                          const missing = isMissingInfo(e);
                          return (
                            <div key={e.id} className="flex items-center gap-3 py-2 text-sm row-status" style={{ ...statusRowStyle(e.statut), paddingLeft: 8, borderRadius: 6 }}>
                              <div className="mono w-20 shrink-0 opacity-90">{fmtDateRange(e)}</div>
                              <div className="w-32 shrink-0"><Pill color={CARE}>{e.type}</Pill></div>
                              <div className="flex-1 min-w-0 truncate opacity-80">{e.lieu || "Lieu non renseigné"}{e.horaire && e.horaire !== "—" ? ` · ${e.horaire}` : ""}</div>
                              {missing.length > 0 && <MissingBadge missing={missing} />}
                              {e.alerte && <AlertBadge alerte={e.alerte} />}
                              <div className="flex gap-1 shrink-0">
                                {e.intervenants.map((c) => <IntervenantChip key={c} code={c} intervenants={intervenants} />)}
                              </div>
                              <StatusControl statut={e.statut} onChange={(s) => onSetStatut(e.id, s)} />
                              {canEditPlanning && (
                                <>
                                  <button onClick={() => onEdit(e)} className="text-xs font-medium shrink-0" style={{ color: CARE_DARK }}>Modifier</button>
                                  <button onClick={() => onDelete(e.id)} className="text-xs font-medium shrink-0" style={{ color: RED }}>Suppr.</button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DEVIS — vue détaillée : édition + calculateur + impression
   ============================================================ */
// Confirmation dédiée pour finaliser un devis — récapitule ce qui va se
// passer avant de verrouiller le brouillon, et enchaîne aussitôt sur le
// PDF officiel une fois confirmé (impression identique à celle qu'on
// obtenait déjà avec les modèles fournis).
function FinaliserDevisModal({ devis, calc, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: CARE + "18" }}>
            <Send size={16} style={{ color: CARE_DARK }} />
          </span>
          <h2 className="disp text-base" style={{ fontWeight: 600 }}>Finaliser ce devis ?</h2>
        </div>
        <p className="text-sm mb-3" style={{ color: INK_TEXT_BODY }}>
          Le devis passera en <strong>« En cours de validation »</strong> et le PDF officiel s'ouvrira aussitôt, prêt à être envoyé au partenaire pour signature.
        </p>
        <div className="rounded-md p-3 mb-4 text-sm space-y-0.5" style={{ background: "#FAFBFC", border: `1px solid ${LINE}` }}>
          <div className="flex justify-between"><span className="muted">Destinataire</span><span className="font-semibold">{devis.destinataire?.entreprise || "—"}</span></div>
          <div className="flex justify-between"><span className="muted">N° de devis</span><span className="font-semibold">{devis.numeroDevis || "—"}</span></div>
          <div className="flex justify-between"><span className="muted">Montant total</span><span className="font-semibold">{calc.totalHT}€ HT · {calc.totalTTC}€ TTC</span></div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button onClick={onConfirm} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Check size={15} /> Finaliser et envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

function DevisDetailView({ devis, onUpdate, onUpdateStatut, onClose, canManageProjects }) {
  const d = devis;
  const calc = calculDevis(d);
  const [newProfil, setNewProfil] = useState(DEVIS_PROFILS[0]);
  const [newPhase, setNewPhase] = useState(DEVIS_PHASES[0]);
  const [newJournees, setNewJournees] = useState("1");

  const setDest = (patch) => onUpdate(d.id, { destinataire: { ...d.destinataire, ...patch } });
  const setInterloc = (patch) => onUpdate(d.id, { interlocuteurCeps: { ...d.interlocuteurCeps, ...patch } });
  const setDep = (patch) => onUpdate(d.id, { deplacement: { ...d.deplacement, ...patch } });
  const setFacturation = (patch) => onUpdate(d.id, { coordonneesFacturation: { ...d.coordonneesFacturation, ...patch } });

  const addLigne = () => {
    const nb = Number(newJournees);
    if (!nb || nb <= 0) return;
    onUpdate(d.id, { lignesPersonnel: [...(d.lignesPersonnel || []), { profil: newProfil, phase: newPhase, nombreJournees: nb }] }, `Ajout ligne : ${newProfil} — ${newPhase} (${nb}j)`);
    setNewJournees("1");
  };
  const removeLigne = (idx) => {
    onUpdate(d.id, { lignesPersonnel: (d.lignesPersonnel || []).filter((_, i) => i !== idx) }, "Suppression d'une ligne de prestation");
  };

  const meta = DEVIS_STATUT_META[d.statut];
  const verrouille = d.statut === "valide" || d.statut === "refuse";
  const [showFinaliser, setShowFinaliser] = useState(false);

  const confirmerFinalisation = () => {
    onUpdateStatut(d.id, "en_cours_validation");
    setShowFinaliser(false);
    // Le PDF officiel s'ouvre tout de suite, sans étape supplémentaire —
    // laisse le temps au statut/à la version de se répercuter dans la
    // vue imprimable avant de déclencher l'impression.
    setTimeout(() => window.print(), 250);
  };

  return (
    <div className="space-y-5">
      <div className="no-print flex items-center gap-2 flex-wrap">
        <button onClick={onClose} className="flex items-center gap-1 text-xs font-medium px-2 py-1.5" style={{ color: CARE_DARK }}>
          <ChevronLeft size={14} /> Retour aux devis
        </button>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase ml-2"
          style={{ background: meta.color + "1a", color: meta.color }}
        >
          {meta.label}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          {d.statut === "brouillon" ? (
            <button
              onClick={() => setShowFinaliser(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded text-white"
              style={{ background: CARE }}
            >
              <Send size={14} /> Finaliser et envoyer
            </button>
          ) : (
            <>
              {DEVIS_STATUT_ORDER.map((s) => {
                const m = DEVIS_STATUT_META[s];
                const Icon = m.Icon;
                const active = d.statut === s;
                return (
                  <button
                    key={s} onClick={() => onUpdateStatut(d.id, s)}
                    title={m.label}
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: active ? m.color : "transparent", border: `1px solid ${active ? m.color : LINE}`, color: active ? "#fff" : m.color }}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded text-white ml-2"
            style={{ background: AMBER }}
          >
            <Printer size={14} /> Télécharger en PDF
          </button>
        </div>
      </div>

      {showFinaliser && (
        <FinaliserDevisModal
          devis={d} calc={calc}
          onClose={() => setShowFinaliser(false)}
          onConfirm={confirmerFinalisation}
        />
      )}

      {/* ---------- FORMULAIRE (masqué à l'impression) ---------- */}
      <div className="no-print space-y-4">
        <div className="bg-white rounded-lg border p-4 grid sm:grid-cols-3 gap-3" style={{ borderColor: LINE }}>
          <div>
            <label className="text-xs font-medium block mb-1">N° de devis <span className="muted font-normal">(ex : SAN-2026-014 pour V1/V2/SAN…)</span></label>
            <input value={d.numeroDevis || ""} onChange={(e) => onUpdate(d.id, { numeroDevis: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Type d'expertise</label>
            <select value={d.typeExpertise || ""} onChange={(e) => onUpdate(d.id, { typeExpertise: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}>
              <option value="">— À préciser —</option>
              {TYPES_EXPERTISE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Date d'émission</label>
            <input type="date" value={d.dateEmission || ""} onChange={(e) => onUpdate(d.id, { dateEmission: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Destinataire</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={d.destinataire?.entreprise || ""} onChange={(e) => setDest({ entreprise: e.target.value })} placeholder="Entreprise" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.destinataire?.adresse || ""} onChange={(e) => setDest({ adresse: e.target.value })} placeholder="Adresse" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.destinataire?.nom || ""} onChange={(e) => setDest({ nom: e.target.value })} placeholder="Nom Prénom du contact" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.destinataire?.poste || ""} onChange={(e) => setDest({ poste: e.target.value })} placeholder="Poste" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.destinataire?.email || ""} onChange={(e) => setDest({ email: e.target.value })} placeholder="Email" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.destinataire?.tel || ""} onChange={(e) => setDest({ tel: e.target.value })} placeholder="Téléphone" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
          <p className="text-[11px] muted mt-3 mb-1.5">3ᵉ interlocuteur CEPS (en plus de Samira Saidi et Eric Guiot, fixes sur la trame)</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={d.interlocuteurCeps?.nom || ""} onChange={(e) => setInterloc({ nom: e.target.value })} placeholder="Nom Prénom" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.interlocuteurCeps?.poste || ""} onChange={(e) => setInterloc({ poste: e.target.value })} placeholder="Poste" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Contexte de la demande</SectionLabel>
          <textarea value={d.contexteDemande || ""} onChange={(e) => onUpdate(d.id, { contexteDemande: e.target.value })} rows={3} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Prestation — dépenses de personnel</SectionLabel>
          {(d.lignesPersonnel || []).length > 0 && (
            <div className="space-y-1 mb-3">
              {d.lignesPersonnel.map((l, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b" style={{ borderColor: LINE }}>
                  <span className="flex-1">{l.profil} <span className="muted">— {l.phase}</span></span>
                  <span className="mono muted">{l.nombreJournees} j × {DEVIS_TARIFS_JOUR[l.profil]}€</span>
                  <span className="mono font-semibold w-20 text-right">{DEVIS_TARIFS_JOUR[l.profil] * l.nombreJournees}€</span>
                  <button onClick={() => removeLigne(i)}><Trash2 size={13} style={{ color: RED }} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={newProfil} onChange={(e) => setNewProfil(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}>
              {DEVIS_PROFILS.map((p) => <option key={p} value={p}>{p} — {DEVIS_TARIFS_JOUR[p]}€/j</option>)}
            </select>
            <select value={newPhase} onChange={(e) => setNewPhase(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}>
              {DEVIS_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" min="0.5" step="0.5" value={newJournees} onChange={(e) => setNewJournees(e.target.value)} className="w-20 text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }} placeholder="Jours" />
            <button onClick={addLigne} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ background: CARE }}>
              <Plus size={13} /> Ajouter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Déplacement</SectionLabel>
          <div className="grid sm:grid-cols-3 gap-3 mb-2">
            <div>
              <label className="text-[11px] muted block mb-1">Kilomètres ({DEVIS_TARIF_KM}€/km)</label>
              <input type="number" min="0" value={d.deplacement?.km || ""} onChange={(e) => setDep({ km: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-[11px] muted block mb-1">Péages (€)</label>
              <input type="number" min="0" value={d.deplacement?.peages || ""} onChange={(e) => setDep({ peages: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-[11px] muted block mb-1">Train / Avion (€)</label>
              <input type="number" min="0" value={d.deplacement?.trainAvion || ""} onChange={(e) => setDep({ trainAvion: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-[11px] muted block mb-1">Métro / Bus / Taxi (€)</label>
              <input type="number" min="0" value={d.deplacement?.metroBusTaxi || ""} onChange={(e) => setDep({ metroBusTaxi: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-[11px] muted block mb-1">Nombre de repas ({DEVIS_TARIF_REPAS}€)</label>
              <input type="number" min="0" value={d.deplacement?.nombreRepas || ""} onChange={(e) => setDep({ nombreRepas: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-[11px] muted block mb-1">Nombre de nuits d'hôtel ({DEVIS_TARIF_HOTEL}€)</label>
              <input type="number" min="0" value={d.deplacement?.nombreNuitsHotel || ""} onChange={(e) => setDep({ nombreNuitsHotel: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 grid sm:grid-cols-3 gap-3" style={{ borderColor: LINE }}>
          <div>
            <label className="text-xs font-medium block mb-1">Marge</label>
            <select value={d.margeIndex ?? 0} onChange={(e) => onUpdate(d.id, { margeIndex: Number(e.target.value) })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}>
              {DEVIS_PALIERS_PCT.map((p, i) => <option key={i} value={i}>{Math.round(p * 100)}%</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Sécurité déplacement</label>
            <select value={d.securiteIndex ?? 0} onChange={(e) => onUpdate(d.id, { securiteIndex: Number(e.target.value) })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}>
              {DEVIS_PALIERS_PCT.map((p, i) => <option key={i} value={i}>{Math.round(p * 100)}%</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Durée de la session (jours, si formation)</label>
            <input type="number" min="0" step="0.5" value={d.dureeSessionJours || ""} onChange={(e) => onUpdate(d.id, { dureeSessionJours: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
        </div>

        <div className="rounded-lg border p-5" style={{ borderColor: CARE + "55", background: CARE + "0a" }}>
          <SectionLabel>Récapitulatif</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Intervention / Expertise" value={`${calc.interventionHT}€ HT`} color={CARE} />
            <StatCard label="Déplacement" value={`${calc.deplacementHT}€ HT`} color={CARE} />
            <StatCard label="Total HT" value={`${calc.totalHT}€`} color={INK} />
            <StatCard label="Total TTC (TVA 20%)" value={`${calc.totalTTC}€`} color={GREEN} />
          </div>
          {calc.moyenneJournaliereHT != null && (
            <p className="text-xs muted mt-2">Moyenne journalière : {calc.moyenneJournaliereHT}€ HT/jour</p>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Conditions financières</SectionLabel>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" checked={(d.conditionsFinancieres?.mode || "totalite") === "totalite"} onChange={() => onUpdate(d.id, { conditionsFinancieres: { ...d.conditionsFinancieres, mode: "totalite" } })} />
              Totalité facturée après prestation
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" checked={d.conditionsFinancieres?.mode === "50-50"} onChange={() => onUpdate(d.id, { conditionsFinancieres: { ...d.conditionsFinancieres, mode: "50-50" } })} />
              50% à la signature / 50% au solde
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Coordonnées de facturation</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={d.coordonneesFacturation?.societe || ""} onChange={(e) => setFacturation({ societe: e.target.value })} placeholder="Société" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.coordonneesFacturation?.representant || ""} onChange={(e) => setFacturation({ representant: e.target.value })} placeholder="Représentée par" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.coordonneesFacturation?.fonction || ""} onChange={(e) => setFacturation({ fonction: e.target.value })} placeholder="Fonction" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.coordonneesFacturation?.email || ""} onChange={(e) => setFacturation({ email: e.target.value })} placeholder="E-mail" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.coordonneesFacturation?.adresse || ""} onChange={(e) => setFacturation({ adresse: e.target.value })} placeholder="Adresse" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            <input value={d.coordonneesFacturation?.tvaIntra || ""} onChange={(e) => setFacturation({ tvaIntra: e.target.value })} placeholder="N° TVA Intracommunautaire" className="text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <SectionLabel>Historique des versions</SectionLabel>
          <div className="space-y-1">
            {(d.historique || []).map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1 border-b" style={{ borderColor: LINE }}>
                <span className="mono w-16 shrink-0">v{h.version}</span>
                <span className="w-20 shrink-0 muted">{fmtDate(h.date)}</span>
                <span className="w-28 shrink-0">{h.auteur}</span>
                <span className="flex-1 muted">{h.modifications}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- APERÇU IMPRIMABLE (visible seulement à l'impression) ---------- */}
      <DevisPrintView devis={d} calc={calc} />
    </div>
  );
}

// Reprend la trame Word R3-EN-02 le plus fidèlement possible pour
// l'export PDF (bouton « Télécharger en PDF » → impression navigateur).
function DevisPrintView({ devis: d, calc }) {
  return (
    <div className="print-only" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#18191A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, borderBottom: "1px solid #ccc", paddingBottom: 8 }}>
        <span>{DEVIS_CODE_DOCUMENT} V1</span>
        <span>Centre d'Education en Prévention Santé « CEPS »</span>
      </div>
      <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: 700, margin: "18px 0" }}>
        DEVIS — Prestation d'expertise en Éducation Santé
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Destinataire</div>
          <div>{d.destinataire?.entreprise}</div>
          <div>{d.destinataire?.adresse}</div>
          <div style={{ marginTop: 6 }}>{d.destinataire?.nom} {d.destinataire?.poste ? `— ${d.destinataire.poste}` : ""}</div>
          <div>{d.destinataire?.email} {d.destinataire?.tel}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 10 }}>
          <div><strong>N° devis :</strong> {d.numeroDevis || "—"}</div>
          <div><strong>Version :</strong> {d.version}</div>
          <div><strong>Date :</strong> {fmtDate(d.dateEmission)}</div>
        </div>
      </div>

      <div style={{ fontSize: 10, marginBottom: 16, lineHeight: 1.5 }}>
        <strong>Vos interlocuteurs — Institut Pasteur de Lille, Centre Prévention Santé Longévité « CPSL » — Centre d'Education en Prévention Santé « CEPS »</strong>
        <div>1, rue du Pr Calmette - B.P. 245 - 59019 Lille Cedex - Fondation reconnue d'utilité publique</div>
        <div>SIRET: 783 696 834 00010 - 731 Z - C.C.P. 1.63 X LILLE</div>
        <div style={{ display: "flex", gap: 24, marginTop: 6 }}>
          <div><strong>Samira SAIDI</strong><br />Assistante Chef de projet CEPS<br />samira.saidi@pasteur-lille.fr — 03.20.87.71.99</div>
          <div><strong>Eric Guiot</strong><br />Responsable du CEPS<br />Eric.guiot@pasteur-lille.fr — 03.20.87.71.08</div>
          {d.interlocuteurCeps?.nom && <div><strong>{d.interlocuteurCeps.nom}</strong><br />{d.interlocuteurCeps.poste}</div>}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 16 }}>
        <thead><tr style={{ background: "#EAF4F4" }}>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>Auteur</th>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>Date</th>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>Version</th>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>Modifications apportées</th>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>N° DEVIS</th>
        </tr></thead>
        <tbody>
          {(d.historique || []).map((h, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{h.auteur}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{fmtDate(h.date)}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{h.version}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{h.modifications}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{d.numeroDevis || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontWeight: 700, marginBottom: 4 }}>Contexte de la demande</div>
      <p style={{ marginBottom: 16 }}>{d.contexteDemande || "—"}</p>

      <div style={{ fontWeight: 700, marginBottom: 4 }}>Le Centre d'Education en Prévention Santé de l'Institut Pasteur de Lille (CEPS)</div>
      <p style={{ marginBottom: 8, fontSize: 10.5, lineHeight: 1.5 }}>
        L'Institut Pasteur de Lille, fondé il y a plus de 130 ans, est une fondation privée à but non lucratif, reconnue d'utilité publique et dédiée à la recherche biomédicale et à la prévention.
      </p>
      <p style={{ marginBottom: 8, fontSize: 10.5, lineHeight: 1.5 }}>
        Le Centre Prévention Santé Longévité (CPSL) incarne l'excellence dans le domaine de la recherche et de la prévention en santé publique. Grâce à une équipe pluridisciplinaire (scientifiques, médecins, infirmières, ingénieurs, diététiciennes, éducateurs-médico-sportifs, psychologues – neuropsychologues), il accompagne les individus de tous âges dans leur parcours de santé, en offrant une approche holistique qui englobe la santé mentale, la nutrition, l'activité physique, l'éducation en santé, la vaccination, les bilans de santé, les parcours longévité et bien d'autres.
      </p>
      <p style={{ marginBottom: 8, fontSize: 10.5, lineHeight: 1.5 }}>
        Depuis sa création le CEPS évolue au cœur de ce complexe scientifique unique en France. L'équipe pluridisciplinaire met son expertise au service de tous les acteurs de la prévention sur des thématiques variées : la nutrition par l'alimentation et l'activité physique, la sédentarité, la santé mentale, le sommeil, la gestion du stress, la cognition, les addictions et la santé globale.
      </p>
      <p style={{ marginBottom: 16, fontSize: 10.5, lineHeight: 1.5 }}>
        Le CEPS propose des prestations d'accompagnement dans le développement de projets en éducation santé, il conduit et accompagne la mise en œuvre de projets (conseil stratégie, consulting en projet santé, appui à la méthodologie, participation à la rédaction de contenus adaptés, créations et apport d'outils pédagogiques, montée en compétences de professionnels, interventions à destination du grand public…), de conseil scientifique en nutrition (revue de la littérature, rédaction de synthèses bibliographiques…), participe à la conception de protocole de recherche-action. Il accompagne également les entreprises dans des expertises santé pour leurs collaborateurs et/ou leurs clients. Enfin, le CEPS intervient sur des publics spécifiques : vieillissement, handicap, obésité, petite enfance…
      </p>

      <div style={{ fontWeight: 700, marginBottom: 4 }}>Prestation proposée</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 8 }}>
        <thead><tr style={{ background: "#EAF4F4" }}>
          <th style={{ border: "1px solid #ccc", padding: 4, textAlign: "left" }}>Détail de la prestation</th>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>€ HT</th>
          <th style={{ border: "1px solid #ccc", padding: 4 }}>€ TTC</th>
        </tr></thead>
        <tbody>
          {(d.lignesPersonnel || []).map((l, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{l.profil} — {l.phase} ({l.nombreJournees} j)</td>
              <td style={{ border: "1px solid #ccc", padding: 4, textAlign: "right" }}>{DEVIS_TARIFS_JOUR[l.profil] * l.nombreJournees}€</td>
              <td style={{ border: "1px solid #ccc", padding: 4, textAlign: "right" }}>{Math.round(DEVIS_TARIFS_JOUR[l.profil] * l.nombreJournees * 1.2 * 100) / 100}€</td>
            </tr>
          ))}
          <tr><td style={{ border: "1px solid #ccc", padding: 4 }}>Déplacement, hébergement et repas</td>
            <td style={{ border: "1px solid #ccc", padding: 4, textAlign: "right" }}>{calc.deplacementHT}€</td>
            <td style={{ border: "1px solid #ccc", padding: 4, textAlign: "right" }}>{calc.deplacementTTC}€</td>
          </tr>
          <tr style={{ fontWeight: 700 }}>
            <td style={{ border: "1px solid #ccc", padding: 4 }}>Montant total de la prestation</td>
            <td style={{ border: "1px solid #ccc", padding: 4, textAlign: "right" }}>{calc.totalHT}€</td>
            <td style={{ border: "1px solid #ccc", padding: 4, textAlign: "right" }}>{calc.totalTTC}€</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 9, fontStyle: "italic", marginBottom: 16 }}>
        Prestation soumise à la TVA de 20% en sus du Montant H.T. — T.V.A. : FR 52783696834 - T.V.A. acquittée sur les débits.
      </p>

      <div style={{ fontWeight: 700, marginBottom: 4 }}>Validité et conditions</div>
      <p style={{ marginBottom: 4 }}><strong>Validité :</strong> Cette proposition est valable 2 mois à compter de la date d'émission.</p>
      <p style={{ marginBottom: 4 }}><strong>Utilisation du nom :</strong> Aucune utilisation du logo de l'Institut Pasteur de Lille n'est autorisée. Toute mention relative au Centre d'Education en Prévention santé de l'Institut Pasteur de Lille ne pourra être autorisée sans la signature préalable d'une convention spécifique.</p>
      <p style={{ marginBottom: 4 }}>
        <strong>Conditions financières :</strong>{" "}
        {d.conditionsFinancieres?.mode === "50-50"
          ? `50% du montant total sera facturé à la signature de cette proposition, soit ${Math.round(calc.totalHT / 2 * 100) / 100}€ H.T. ; le solde sera facturé après la prestation, soit ${Math.round(calc.totalHT / 2 * 100) / 100}€ H.T.`
          : `La totalité du montant sera facturée après la prestation, soit ${calc.totalHT}€ H.T.`}
        {" "}Le règlement devra être perçu dans les 30 jours suivant l'émission de la facture.
      </p>

      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Coordonnées de facturation</div>
      <p style={{ marginBottom: 16 }}>
        Société : {d.coordonneesFacturation?.societe || "…"} — Représentée par : {d.coordonneesFacturation?.representant || "…"} — Fonction : {d.coordonneesFacturation?.fonction || "…"}<br />
        E-Mail : {d.coordonneesFacturation?.email || "…"} — Adresse : {d.coordonneesFacturation?.adresse || "…"}<br />
        N° TVA Intracommunautaire : {d.coordonneesFacturation?.tvaIntra || "…"}
      </p>

      <p style={{ marginBottom: 16 }}>
        Nous vous remercions de bien vouloir nous retourner le présent devis, dûment paraphé sur toutes les pages, excepté la dernière, daté, signé et revêtu de votre cachet commercial, précédés de la mention « Bon pour accord ».
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 11 }}>
        <div>
          <strong>Pour accord</strong><br /><br />
          Nom : _______________________<br /><br />
          Date : _______________________
        </div>
        <div style={{ textAlign: "right" }}>
          Signature et cachet de l'entreprise, précédés de la mention manuscrite « Bon pour accord » :<br /><br /><br />
          ____________________________
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 8.5, fontStyle: "italic", color: "#666", borderTop: "1px solid #ccc", paddingTop: 6 }}>
        Toute personne utilisant une version imprimée de ce document doit vérifier sur le logiciel Qualité qu'elle utilise la version en application. — {DEVIS_CODE_DOCUMENT} V1
      </p>
    </div>
  );
}


/* ============================================================
   APPELS À PROJET EN COURS DE DÉPÔT
   ------------------------------------------------------------
   Vue dédiée aux projets en attente de retour d'un financeur —
   pour piloter le portefeuille de candidatures sans avoir à les
   chercher dans l'ensemble des dossiers projets.
   ============================================================ */
/* ============================================================
   DEVIS — liste
   ============================================================ */
function DevisTab({ devisListe, session, onCreate, onOpen, onRequestDelete }) {
  const [showNew, setShowNew] = useState(false);
  const [filterStatut, setFilterStatut] = useState("all");
  const list = useMemo(() => {
    const sorted = [...devisListe].sort((a, b) => (b.dateEmission || "").localeCompare(a.dateEmission || ""));
    return filterStatut === "all" ? sorted : sorted.filter((d) => d.statut === filterStatut);
  }, [devisListe, filterStatut]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-5" style={{ borderColor: CARE + "55", background: CARE + "0a" }}>
        <div className="flex items-center gap-2 mb-2">
          <FileSignature size={16} style={{ color: CARE_DARK }} />
          <span className="text-sm font-bold" style={{ color: CARE_DARK }}>Devis de prestation d'expertise</span>
        </div>
        <p className="text-sm" style={{ color: INK_TEXT_BODY }}>
          Génère un devis à partir de la grille tarifaire du CEPS, suis sa validation, et exporte-le en PDF pour l'envoyer au partenaire dès qu'il est prêt.
        </p>
      </div>

      <div className="bg-white rounded-lg border p-3 flex flex-wrap items-center gap-2" style={{ borderColor: LINE }}>
        <button onClick={() => setFilterStatut("all")} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ background: filterStatut === "all" ? INK : PAPER_DARK, color: filterStatut === "all" ? "#fff" : INK }}>
          Tous ({devisListe.length})
        </button>
        {DEVIS_STATUT_ORDER.filter((s) => s !== "refuse").map((s) => {
          const meta = DEVIS_STATUT_META[s];
          const count = devisListe.filter((d) => d.statut === s).length;
          return (
            <button key={s} onClick={() => setFilterStatut(s)} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ background: filterStatut === s ? meta.color : PAPER_DARK, color: filterStatut === s ? "#fff" : INK }}>
              {meta.label} ({count})
            </button>
          );
        })}
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white ml-auto" style={{ background: AMBER }}>
          <Plus size={13} /> Nouveau devis
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center" style={{ borderColor: LINE }}>
          <FileSignature size={28} className="mx-auto mb-3" style={{ color: "#C4CBD1" }} />
          <p className="text-sm muted">Aucun devis pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => {
            const calc = calculDevis(d);
            const meta = DEVIS_STATUT_META[d.statut];
            const StatutIcon = meta.Icon;
            return (
              <button
                key={d.id} onClick={() => onOpen(d.id)}
                className="w-full bg-white rounded-lg border p-4 flex items-center gap-3 flex-wrap text-left hover:shadow-md transition"
                style={{ borderColor: LINE }}
              >
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 uppercase"
                  style={{ background: meta.color + "1a", color: meta.color }}
                >
                  <StatutIcon size={10} /> {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {d.destinataire?.entreprise || "Client à préciser"}
                    {d.numeroDevis && <span className="font-normal muted"> · {d.numeroDevis}</span>}
                  </div>
                  <div className="text-xs muted truncate">
                    {d.contexteDemande ? d.contexteDemande.slice(0, 70) : "Contexte non renseigné"} · v{d.version} · {fmtDate(d.dateEmission)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="disp text-base font-bold" style={{ color: CARE_DARK }}>{calc.totalHT}€ HT</div>
                  <div className="text-[11px] muted">{calc.totalTTC}€ TTC</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestDelete(d.id); }}
                  className="shrink-0" title="Supprimer ce devis"
                >
                  <Trash2 size={14} style={{ color: RED }} />
                </button>
              </button>
            );
          })}
        </div>
      )}

      {showNew && (
        <NouveauDevisModal
          onClose={() => setShowNew(false)}
          onCreate={(payload) => { const id = onCreate(payload); setShowNew(false); onOpen(id); }}
        />
      )}
    </div>
  );
}

function NouveauDevisModal({ onClose, onCreate }) {
  const [entreprise, setEntreprise] = useState("");
  const [numeroDevis, setNumeroDevis] = useState("");
  const [typeExpertise, setTypeExpertise] = useState("");

  const submit = () => {
    if (!entreprise.trim()) return;
    onCreate({ destinataire: { entreprise: entreprise.trim() }, numeroDevis: numeroDevis.trim(), typeExpertise });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Nouveau devis</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Entreprise / partenaire destinataire</label>
            <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} autoFocus className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} placeholder="ex : Ville de Lille" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">N° de devis (optionnel — ex : SAN-2026-014)</label>
            <input value={numeroDevis} onChange={(e) => setNumeroDevis(e.target.value)} className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} placeholder="tu pourras le préciser plus tard aussi" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Type d'expertise</label>
            <select value={typeExpertise} onChange={(e) => setTypeExpertise(e.target.value)} className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }}>
              <option value="">— À préciser —</option>
              {TYPES_EXPERTISE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: LINE }}>
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button onClick={submit} style={{ background: AMBER }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Plus size={15} /> Créer ce devis
          </button>
        </div>
      </div>
    </div>
  );
}

function AppelsProjetTab({ projects, canManageProjects, onUpdateBudget, onUpdateStatutFinancement, onGoToProject }) {
  const enDepot = useMemo(
    () => projects
      .filter((p) => p.statutFinancement === "depot")
      .sort((a, b) => (a.statutFinancementDate || "").localeCompare(b.statutFinancementDate || "")),
    [projects]
  );
  const totalBudget = Math.round(enDepot.reduce((s, p) => s + financeNum(p.budget), 0) * 100) / 100;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-5" style={{ borderColor: PURPLE + "55", background: PURPLE + "0a" }}>
        <div className="flex items-center gap-2 mb-2">
          <Send size={16} style={{ color: PURPLE }} />
          <span className="text-sm font-bold" style={{ color: PURPLE }}>Appels à projet en cours de dépôt</span>
        </div>
        <p className="text-sm" style={{ color: INK_TEXT_BODY }}>
          Les projets déposés auprès d'un financeur, en attente de retour (validation, refus). Le statut se change directement depuis « Dossiers projets » ou « Mes projets » — cette vue ne fait que les rassembler pour un suivi rapide du portefeuille de candidatures.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Appels à projet en attente" value={enDepot.length} color={PURPLE} />
        <StatCard label="Budget total en jeu" value={`${totalBudget}€`} color={CARE} />
      </div>

      {enDepot.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center" style={{ borderColor: LINE }}>
          <Send size={28} className="mx-auto mb-3" style={{ color: "#C4CBD1" }} />
          <p className="text-sm muted">Aucun appel à projet en attente de retour pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enDepot.map((p) => (
            <div key={p.id} className="bg-white rounded-lg border p-4 flex items-center gap-3 flex-wrap" style={{ borderColor: LINE }}>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] mono uppercase muted flex items-center gap-1">{p.categorie}<ProgrammeTag categorie={p.categorie} /></div>
                <button onClick={() => onGoToProject && onGoToProject(p.id)} className="text-sm font-semibold truncate text-left hover:underline" style={{ color: INK }}>
                  {p.nom}
                </button>
                <div className="text-xs muted truncate">
                  Chef·fe de projet : {p.chargeDeProjet} {p.structure ? `· ${p.structure}` : ""}
                  {p.statutFinancementDate && <> · déposé le {fmtDate(p.statutFinancementDate)}</>}
                </div>
              </div>
              {canManageProjects && (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number" placeholder="Budget €" defaultValue={p.budget ?? ""}
                    onBlur={(e) => onUpdateBudget(p.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                    className="w-24 text-xs border rounded px-1.5 py-1 text-right" style={{ borderColor: LINE }}
                  />
                  <ProjectStatutControl
                    statut={p.statutFinancement} date={p.statutFinancementDate}
                    onChange={(statut, date) => onUpdateStatutFinancement(p.id, statut, date)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DOSSIERS REFUSÉS — mémoire des expertises (devis) et des appels
   à projet refusés, pour garder une trace sans polluer les vues
   actives ni le prévisionnel financier.
   ============================================================ */
function DossiersRefusesTab({ devisListe, projects }) {
  const devisRefuses = useMemo(
    () => devisListe.filter((d) => d.statut === "refuse").sort((a, b) => (b.statutDate || "").localeCompare(a.statutDate || "")),
    [devisListe]
  );
  const projetsRefuses = useMemo(
    () => projects.filter((p) => p.statutFinancement === "refuse").sort((a, b) => (b.statutFinancementDate || "").localeCompare(a.statutFinancementDate || "")),
    [projects]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-5" style={{ borderColor: MUTED + "55", background: "#F4F6F7" }}>
        <div className="flex items-center gap-2 mb-2">
          <Archive size={16} style={{ color: MUTED }} />
          <span className="text-sm font-bold" style={{ color: MUTED }}>Dossiers refusés</span>
        </div>
        <p className="text-sm" style={{ color: INK_TEXT_BODY }}>
          La mémoire des expertises (devis) et des appels à projet qui n'ont pas abouti — retirés du prévisionnel actif, mais conservés ici pour garder une trace et pouvoir y revenir si besoin.
        </p>
      </div>

      <div>
        <SectionLabel>Devis refusés ({devisRefuses.length})</SectionLabel>
        {devisRefuses.length === 0 ? (
          <p className="text-sm muted bg-white rounded-lg border p-6 text-center" style={{ borderColor: LINE }}>Aucun devis refusé pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {devisRefuses.map((d) => {
              const calc = calculDevis(d);
              return (
                <div key={d.id} className="bg-white rounded-lg border p-4 flex items-center gap-3 flex-wrap" style={{ borderColor: LINE, opacity: 0.85 }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{d.destinataire?.entreprise || "Client non précisé"} {d.numeroDevis && <span className="font-normal muted">· {d.numeroDevis}</span>}</div>
                    <div className="text-xs muted truncate">Refusé le {fmtDate(d.statutDate)} · {d.typeExpertise || "type non précisé"}</div>
                  </div>
                  <div className="text-right shrink-0 mono text-sm" style={{ color: MUTED }}>{calc.totalHT}€ HT</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Appels à projet refusés ({projetsRefuses.length})</SectionLabel>
        {projetsRefuses.length === 0 ? (
          <p className="text-sm muted bg-white rounded-lg border p-6 text-center" style={{ borderColor: LINE }}>Aucun appel à projet refusé pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {projetsRefuses.map((p) => (
              <div key={p.id} className="bg-white rounded-lg border p-4 flex items-center gap-3 flex-wrap" style={{ borderColor: LINE, opacity: 0.85 }}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{p.nom}</div>
                  <div className="text-xs muted truncate">Chef·fe de projet : {p.chargeDeProjet} · Refusé le {fmtDate(p.statutFinancementDate)}</div>
                </div>
                {p.budget != null && <div className="text-right shrink-0 mono text-sm" style={{ color: MUTED }}>{p.budget}€</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectsTab({ projects, events, intervenants, allCategories, expanded, setExpanded, onEdit, onDelete, onSetStatut, canEditPlanning, canManageProjects, onUpdateBudget, onUpdateStatutFinancement }) {
  const byCat = useMemo(() => {
    const m = {};
    projects.forEach((p) => { (m[p.categorie] = m[p.categorie] || []).push(p); });
    return m;
  }, [projects]);
  const [openFolders, setOpenFolders] = useState(() => new Set(allCategories));
  const [openProgrammes, setOpenProgrammes] = useState(() => new Set(PROGRAMMES.map((pr) => pr.id)));
  const toggleFolder = (cat) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };
  const toggleProgramme = (id) => {
    setOpenProgrammes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const categoriesInProgrammes = new Set(PROGRAMMES.flatMap((pr) => pr.categories));
  const independentCategories = allCategories.filter((c) => byCat[c] && !categoriesInProgrammes.has(c));

  return (
    <div className="space-y-4">
      {PROGRAMMES.map((pr) => {
        const catsPresent = pr.categories.filter((c) => byCat[c]);
        if (catsPresent.length === 0) return null;
        const totalProjets = catsPresent.reduce((s, c) => s + byCat[c].length, 0);
        const totalEvts = catsPresent.reduce((s, c) => s + byCat[c].reduce((s2, p) => s2 + events.filter((e) => e.projetId === p.id).length, 0), 0);
        const isOpen = openProgrammes.has(pr.id);
        return (
          <div key={pr.id} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${CARE}` }}>
            <button onClick={() => toggleProgramme(pr.id)} className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left" style={{ background: CARE }}>
              {isOpen ? <ChevronDown size={17} className="text-white shrink-0" /> : <ChevronRight size={17} className="text-white shrink-0" />}
              <Briefcase size={17} className="text-white shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white">{pr.label}</span>
                <div className="text-[11px] text-white opacity-80 truncate">{pr.description}</div>
              </div>
              <span className="text-xs mono text-white opacity-90 shrink-0">{catsPresent.length} thématiques · {totalProjets} sous-projets · {totalEvts} évt.</span>
            </button>
            {isOpen && (
              <div className="p-3 space-y-3" style={{ background: CARE + "0d" }}>
                {catsPresent.map((cat) => (
                  <CategoryFolder
                    key={cat} cat={cat} projs={byCat[cat]} events={events} intervenants={intervenants}
                    expanded={expanded} setExpanded={setExpanded} onEdit={onEdit} onDelete={onDelete}
                    onSetStatut={onSetStatut} canEditPlanning={canEditPlanning}
                    canManageProjects={canManageProjects} onUpdateBudget={onUpdateBudget} onUpdateStatutFinancement={onUpdateStatutFinancement}
                    isOpen={openFolders.has(cat)} onToggle={() => toggleFolder(cat)} nested
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {independentCategories.map((cat) => (
        <CategoryFolder
          key={cat} cat={cat} projs={byCat[cat]} events={events} intervenants={intervenants}
          expanded={expanded} setExpanded={setExpanded} onEdit={onEdit} onDelete={onDelete}
          onSetStatut={onSetStatut} canEditPlanning={canEditPlanning}
          canManageProjects={canManageProjects} onUpdateBudget={onUpdateBudget} onUpdateStatutFinancement={onUpdateStatutFinancement}
          isOpen={openFolders.has(cat)} onToggle={() => toggleFolder(cat)}
        />
      ))}
    </div>
  );
}

/* ============================================================
   PEOPLE TAB
   ============================================================ */
const BLOCAGE_MOTIFS = ["Arrêt maladie", "Démission", "Autre"];

function PeopleTab({ intervenants, events, allCodes, onUpdateMetier, onUpdateMetiers, onUpdateNom, onUpdateCouleur, onRenameCode, onAdd, onFilter, onUpdateBlocage }) {
  const [newCode, setNewCode] = useState("");
  const [newNom, setNewNom] = useState("");
  const [editingCode, setEditingCode] = useState(null);
  const [editingMetiers, setEditingMetiers] = useState(null);
  const [blockingCode, setBlockingCode] = useState(null);
  const [motif, setMotif] = useState(BLOCAGE_MOTIFS[0]);
  const [detail, setDetail] = useState("");
  const submitAdd = () => { onAdd(newCode, newNom); setNewCode(""); setNewNom(""); };
  const handleEnter = (e) => { if (e.key === "Enter") submitAdd(); };
  const confirmBlocage = (code) => {
    onUpdateBlocage(code, { statutActivite: "bloque", blocageMotif: motif, blocageDetail: motif === "Autre" ? detail : "", blocageDate: today });
    setBlockingCode(null); setDetail("");
  };
  return (
    <div>
      <div className="bg-white rounded-lg border p-4 mb-4 flex flex-wrap items-center gap-2" style={{ borderColor: LINE }}>
        <input
          value={newCode} onChange={(e) => setNewCode(e.target.value)} onKeyDown={handleEnter}
          placeholder="Code (ex : SP)"
          className="text-sm border rounded-md px-2.5 py-1.5 w-32" style={{ borderColor: LINE }}
        />
        <input
          value={newNom} onChange={(e) => setNewNom(e.target.value)} onKeyDown={handleEnter}
          placeholder="Nom complet (optionnel)"
          className="text-sm border rounded-md px-2.5 py-1.5 w-56" style={{ borderColor: LINE }}
        />
        <button
          type="button" onClick={submitAdd}
          className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md text-white"
          style={{ background: CARE }}
        >
          <Plus size={14} /> Ajouter un intervenant
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allCodes.map((code) => {
          const meta = intervenants.find((i) => i.code === code) || { code, metier: "À définir", nomComplet: "" };
          const count = events.filter((e) => e.intervenants.includes(code)).length;
          const upcomingCount = events.filter((e) => e.intervenants.includes(code) && e.date && e.date >= today).length;
          return (
            <div key={code} className="bg-white rounded-lg border p-4" style={{ borderColor: meta.statutActivite === "bloque" ? RED + "55" : LINE, opacity: meta.statutActivite === "bloque" ? 0.85 : 1 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    style={{ background: getIntervenantColor(code, intervenants) }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  >
                    {code.slice(0, 2)}
                  </span>
                  {editingCode === code ? (
                    <input
                      autoFocus defaultValue={code}
                      onBlur={(e) => { onRenameCode(code, e.target.value); setEditingCode(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditingCode(null); }}
                      className="font-semibold text-sm w-16 border rounded px-1 py-0.5"
                      style={{ borderColor: CARE }}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingCode(code)}
                      title="Modifier les initiales de cet·te intervenant·e"
                      className="flex items-center gap-1 font-semibold text-sm"
                    >
                      {code} <PenLine size={11} style={{ color: MUTED }} />
                    </button>
                  )}
                  <label
                    title="Changer la couleur de cet·te intervenant·e"
                    className="w-5 h-5 rounded border cursor-pointer overflow-hidden shrink-0 relative"
                    style={{ borderColor: LINE }}
                  >
                    <PenLine size={10} className="absolute inset-0 m-auto pointer-events-none" style={{ color: MUTED, mixBlendMode: "difference" }} />
                    <input
                      type="color"
                      value={getIntervenantColor(code, intervenants)}
                      onChange={(e) => onUpdateCouleur(code, e.target.value)}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
                <button onClick={() => onFilter(code)} className="text-[11px] font-medium" style={{ color: CARE_DARK }}>
                  Voir agenda →
                </button>
              </div>
              {meta.statutActivite === "bloque" && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded mb-2" style={{ background: RED + "12", color: RED }}>
                  <AlertTriangle size={11} />
                  Bloqué·e — {meta.blocageMotif}{meta.blocageDetail ? ` (${meta.blocageDetail})` : ""} depuis le {fmtDate(meta.blocageDate)}
                </div>
              )}
              <input
                value={meta.nomComplet || ""}
                onChange={(e) => onUpdateNom(code, e.target.value)}
                placeholder="Nom complet (ex : Olivier)"
                className="w-full text-xs border rounded-md px-2 py-1.5 mb-2"
                style={{ borderColor: !meta.nomComplet ? AMBER : LINE }}
              />
              <div className="border rounded-md px-2 py-1.5 mb-2" style={{ borderColor: LINE }}>
                <button
                  type="button"
                  onClick={() => setEditingMetiers(editingMetiers === code ? null : code)}
                  className="w-full flex items-center justify-between text-xs text-left"
                >
                  <span className={intervenantMetiers(meta).length === 0 ? "muted" : ""}>
                    {intervenantMetiersLabel(meta)}
                  </span>
                  {editingMetiers === code ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />}
                </button>
                {editingMetiers === code && (
                  <div className="pt-2 mt-1.5 border-t space-y-1" style={{ borderColor: LINE }}>
                    <p className="text-[10px] muted mb-1">Coche tous les métiers exercés — la personne sera comptée dans le plan de charge de chacun.</p>
                    {PROFESSIONS.filter((p) => p !== "À définir").map((p) => {
                      const checked = intervenantMetiers(meta).includes(p);
                      return (
                        <label key={p} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                          <input
                            type="checkbox" checked={checked}
                            onChange={() => {
                              const current = intervenantMetiers(meta).filter((m) => m !== "À définir");
                              const next = checked ? current.filter((m) => m !== p) : [...current, p];
                              onUpdateMetiers(code, next);
                            }}
                          />
                          {p}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs muted mb-2">
                <span>{count} évènement{count > 1 ? "s" : ""} au total</span>
                <span>{upcomingCount} à venir</span>
              </div>
              {meta.statutActivite === "bloque" ? (
                <button
                  onClick={() => onUpdateBlocage(code, { statutActivite: "actif", blocageMotif: "", blocageDetail: "", blocageDate: null })}
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded-md"
                  style={{ background: GREEN + "15", color: GREEN }}
                >
                  Débloquer cet·te intervenant·e
                </button>
              ) : blockingCode === code ? (
                <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: LINE }}>
                  <select value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full text-xs border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}>
                    {BLOCAGE_MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {motif === "Autre" && (
                    <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Préciser…" className="w-full text-xs border rounded-md px-2 py-1.5" style={{ borderColor: LINE }} />
                  )}
                  <div className="flex gap-1.5">
                    <button onClick={() => confirmBlocage(code)} className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-md text-white" style={{ background: RED }}>Confirmer</button>
                    <button onClick={() => setBlockingCode(null)} className="text-xs muted px-2">Annuler</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setBlockingCode(code)} className="w-full text-xs font-semibold px-2 py-1.5 rounded-md" style={{ background: RED + "10", color: RED }}>
                  Bloquer cet·te intervenant·e
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   WORKLOAD TAB (PLAN DE CHARGE)
   ============================================================ */
function WorkloadTab({ intervenants, events, allIntervenantCodes, tempsTravail, accounts, projects, etpParMetier, onUpdateEtpMetier }) {
  const [selectedPerson, setSelectedPerson] = useState("all");
  const [selectedMetier, setSelectedMetier] = useState("all");
  const [metric, setMetric] = useState("hours"); // "hours" | "count"
  const [minHours, setMinHours] = useState("");
  const [maxHours, setMaxHours] = useState("");

  const eventsWithHours = useMemo(
    () => events.map((e) => ({
      ...e, _hours: getEventHours(e),
      // Trajet aller-retour estimé, en heures — compté intégralement pour
      // CHAQUE intervenant·e assigné·e (un binôme qui se déplace ensemble
      // supporte chacun·e le même temps de trajet, ce n'est pas partagé).
      _travelHours: e.tempsTrajetMin ? Math.round(((Number(e.tempsTrajetMin) * 2) / 60) * 100) / 100 : 0,
    })),
    [events]
  );

  // Relie chaque temps de travail déclaré manuellement (Mon espace, Mon
  // temps) à son code intervenant, pour l'ajouter à la charge de travail —
  // sans compter deux fois les actions déjà planifiées dans l'agenda,
  // puisque ce tableau ne contient que les déclarations manuelles.
  const declaredByCode = useMemo(() => {
    const map = {};
    (tempsTravail || []).forEach((t) => {
      const acc = (accounts || []).find((a) => a.id === t.proprietaire);
      const code = acc?.intervenantCode;
      if (!code) return;
      (map[code] = map[code] || []).push(t);
    });
    return map;
  }, [tempsTravail, accounts]);

  const monthsOrdered = useMemo(() => {
    const set = new Set();
    eventsWithHours.forEach((e) => { if (e.date) set.add(e.date.slice(0, 7)); });
    Object.values(declaredByCode).flat().forEach((t) => { if (t.date) set.add(t.date.slice(0, 7)); });
    return Array.from(set).sort().map((ym) => ({
      key: ym,
      label: new Date(ym + "-01").toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    }));
  }, [eventsWithHours, declaredByCode]);

  const workloadAll = useMemo(() => {
    const map = {};
    eventsWithHours.forEach((e) => {
      e.intervenants.forEach((code) => {
        if (!map[code]) map[code] = { code, total: 0, hours: 0, unknownDuration: 0, declared: 0, travel: 0 };
        map[code].total += 1;
        if (e._hours !== null) map[code].hours += e._hours;
        else map[code].unknownDuration += 1;
        if (e._travelHours > 0) {
          map[code].hours += e._travelHours;
          map[code].travel += e._travelHours;
        }
      });
    });
    Object.entries(declaredByCode).forEach(([code, entries]) => {
      if (!map[code]) map[code] = { code, total: 0, hours: 0, unknownDuration: 0, declared: 0, travel: 0 };
      const h = entries.reduce((s, t) => s + (t.duree || 0), 0);
      map[code].hours += h;
      map[code].declared += Math.round(h * 100) / 100;
    });
    return Object.values(map).sort((a, b) => (metric === "hours" ? b.hours - a.hours : b.total - a.total));
  }, [eventsWithHours, declaredByCode, metric]);

  const workload = useMemo(() => {
    const min = minHours === "" ? -Infinity : Number(minHours);
    const max = maxHours === "" ? Infinity : Number(maxHours);
    return workloadAll.filter((w) => w.hours >= min && w.hours <= max);
  }, [workloadAll, minHours, maxHours]);

  // Codes des intervenant·es exerçant le métier sélectionné — sert à la
  // fois à filtrer l'affichage et à isoler le sous-groupe pour la lecture
  // ETP / prévisionnel ci-dessous.
  const codesForMetier = useMemo(() => {
    if (selectedMetier === "all") return null;
    return new Set(intervenants.filter((i) => intervenantMetiers(i).includes(selectedMetier)).map((i) => i.code));
  }, [intervenants, selectedMetier]);

  const byMetier = useMemo(() => {
    if (!codesForMetier) return workload;
    return workload.filter((w) => codesForMetier.has(w.code));
  }, [workload, codesForMetier]);

  const displayedPeople = selectedPerson === "all" ? byMetier : byMetier.filter((w) => w.code === selectedPerson);
  const top = displayedPeople.slice(0, 8);

  // Besoin prévisionnel exprimé par les projets pour ce métier — cumul du
  // nombre de personnes demandées dans « Moyens humains prévus » sur
  // l'ensemble des projets (tous statuts confondus), pour donner une idée
  // du volume de sollicitation à anticiper, indépendamment de qui est
  // déjà affecté à un évènement concret.
  const besoinPrevisionnel = useMemo(() => {
    if (selectedMetier === "all") return 0;
    return (projects || []).reduce((sum, p) => {
      const lignes = Array.isArray(p.moyensHumains) ? p.moyensHumains.filter((m) => m.metier === selectedMetier) : [];
      return sum + lignes.reduce((s, m) => s + (Number(m.nombre) || 0), 0);
    }, 0);
  }, [projects, selectedMetier]);

  const etpDisponible = selectedMetier !== "all" ? etpParMetier?.[selectedMetier] : undefined;
  const ETP_HEURES_AN = 1607; // durée légale annuelle française — repère standard, pas une règle absolue
  const capaciteHeures = etpDisponible ? Math.round(etpDisponible * ETP_HEURES_AN) : null;
  const chargeHeuresMetier = Math.round(byMetier.reduce((s, w) => s + w.hours, 0) * 100) / 100;
  const depassement = capaciteHeures != null && chargeHeuresMetier > capaciteHeures;

  // Effectif rattaché à ce métier d'après les métiers validés par le·la
  // chef·fe d'équipe dans l'onglet « Intervenants ». On part du
  // référentiel (pas des évènements) pour que les personnes sans aucune
  // action planifiée apparaissent quand même — sinon elles seraient
  // invisibles ici alors qu'elles font bien partie de l'effectif.
  const effectifMetier = useMemo(() => {
    if (selectedMetier === "all") return [];
    return intervenants
      .filter((i) => intervenantMetiers(i).includes(selectedMetier))
      .map((i) => {
        const w = workloadAll.find((x) => x.code === i.code);
        return {
          code: i.code,
          nom: i.nomComplet || "",
          bloque: i.statutActivite === "bloque",
          blocageMotif: i.blocageMotif,
          autresMetiers: intervenantMetiers(i).filter((m) => m !== selectedMetier),
          hours: w ? Math.round(w.hours * 100) / 100 : 0,
          count: w ? w.total : 0,
        };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [intervenants, selectedMetier, workloadAll]);
  const effectifActif = effectifMetier.filter((e) => !e.bloque).length;

  const chartData = useMemo(() => {
    return monthsOrdered.map(({ key, label }) => {
      const row = { mois: label };
      top.forEach((w) => {
        const evs = eventsWithHours.filter((e) => e.date?.startsWith(key) && e.intervenants.includes(w.code));
        const declared = (declaredByCode[w.code] || []).filter((t) => t.date?.startsWith(key));
        row[w.code] = metric === "hours"
          ? Math.round((evs.reduce((s, e) => s + (e._hours || 0), 0) + declared.reduce((s, t) => s + (t.duree || 0), 0)) * 100) / 100
          : evs.length;
      });
      return row;
    });
  }, [monthsOrdered, top, eventsWithHours, declaredByCode, metric]);

  const personDetail = selectedPerson !== "all"
    ? eventsWithHours
        .filter((e) => e.intervenants.includes(selectedPerson))
        .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
    : null;
  const personDeclared = selectedPerson !== "all" ? (declaredByCode[selectedPerson] || []) : [];

  const unit = metric === "hours" ? "h" : "évt.";
  const totalTeamHours = Math.round(workloadAll.reduce((s, w) => s + w.hours, 0) * 100) / 100;
  const totalTeamCount = workloadAll.reduce((s, w) => s + w.total, 0);
  const pieData = useMemo(() => {
    return displayedPeople
      .map((w) => ({
        name: w.code, value: metric === "hours" ? Math.round(w.hours * 100) / 100 : w.total,
        color: getIntervenantColor(w.code, intervenants),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [displayedPeople, metric, intervenants]);
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div>
          <label className="text-[11px] font-medium block mb-1 muted">Métier</label>
          <select
            value={selectedMetier} onChange={(e) => { setSelectedMetier(e.target.value); setSelectedPerson("all"); }}
            className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}
          >
            <option value="all">Tous les métiers</option>
            {PROFESSIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium block mb-1 muted">Personne</label>
          <select
            value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}
            className="text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}
          >
            <option value="all">{selectedMetier === "all" ? "Tous les intervenants" : "Tout ce métier"}</option>
            {(codesForMetier ? allIntervenantCodes.filter((c) => codesForMetier.has(c)) : allIntervenantCodes).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium block mb-1 muted">Unité affichée</label>
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: LINE }}>
            <button
              onClick={() => setMetric("hours")}
              className="text-xs font-semibold px-3 py-1.5"
              style={{ background: metric === "hours" ? CARE : "transparent", color: metric === "hours" ? "#fff" : INK }}
            >Heures</button>
            <button
              onClick={() => setMetric("count")}
              className="text-xs font-semibold px-3 py-1.5"
              style={{ background: metric === "count" ? CARE : "transparent", color: metric === "count" ? "#fff" : INK }}
            >Évènements</button>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-medium block mb-1 muted">Total heures : min</label>
          <input
            type="number" min="0" value={minHours} onChange={(e) => setMinHours(e.target.value)}
            placeholder="0" className="w-24 text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium block mb-1 muted">Total heures : max</label>
          <input
            type="number" min="0" value={maxHours} onChange={(e) => setMaxHours(e.target.value)}
            placeholder="—" className="w-24 text-sm border rounded-md px-2.5 py-1.5" style={{ borderColor: LINE }}
          />
        </div>
        {(selectedPerson !== "all" || selectedMetier !== "all" || minHours !== "" || maxHours !== "") && (
          <button
            onClick={() => { setSelectedPerson("all"); setSelectedMetier("all"); setMinHours(""); setMaxHours(""); }}
            className="text-xs font-medium ml-auto flex items-center gap-1 self-end mb-1.5" style={{ color: CARE_DARK }}
          >
            <Filter size={12} /> Réinitialiser
          </button>
        )}
        <div className="text-[11px] muted basis-full">
          La durée est estimée à partir du champ « horaire » de chaque évènement (ex. 9h30-16h30). Les horaires non renseignés ou imprécis (« matin », « visio », « —») ne sont pas comptabilisés dans les heures et apparaissent séparément.
        </div>
      </div>

      {selectedMetier !== "all" && (
        <div className="rounded-lg border p-5" style={{ borderColor: depassement ? RED + "55" : CARE + "55", background: depassement ? RED + "0a" : CARE + "0a" }}>
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={16} style={{ color: depassement ? RED : CARE_DARK }} />
            <span className="text-sm font-bold" style={{ color: depassement ? RED : CARE_DARK }}>Quotité d'activité — {selectedMetier}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-white rounded-md border p-3" style={{ borderColor: LINE }}>
              <label className="text-[10px] uppercase tracking-wide muted font-semibold block mb-1">ETP disponible</label>
              <input
                type="number" min="0" step="0.1" value={etpDisponible ?? ""}
                onChange={(e) => onUpdateEtpMetier(selectedMetier, e.target.value)}
                placeholder="ex : 2.5" className="w-full text-lg font-bold border-0 p-0 focus:outline-none" style={{ color: INK }}
              />
              <span className="text-[10px] muted">Ce que tu as réellement à disposition</span>
            </div>
            <StatCard label="Postes demandés (projets)" value={besoinPrevisionnel} color={PURPLE} />
            <StatCard label="Charge planifiée" value={`${chargeHeuresMetier}h`} color={CARE} />
            <StatCard
              label="Capacité (ETP × 1607h/an)"
              value={capaciteHeures != null ? `${capaciteHeures}h` : "—"}
              color={depassement ? RED : GREEN}
            />
          </div>

          <div className="bg-white rounded-md border p-3 mb-3" style={{ borderColor: LINE }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} style={{ color: CARE_DARK }} />
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: CARE_DARK }}>
                Intervenant·es de ce métier — {effectifMetier.length} personne{effectifMetier.length > 1 ? "s" : ""}
                {effectifMetier.length !== effectifActif && ` (dont ${effectifMetier.length - effectifActif} bloquée${effectifMetier.length - effectifActif > 1 ? "s" : ""})`}
              </span>
            </div>
            {effectifMetier.length === 0 ? (
              <p className="text-xs muted">
                Aucun·e intervenant·e n'est rattaché·e à ce métier pour l'instant. Le rattachement se fait dans l'onglet « Intervenants », en cochant les métiers exercés par chaque personne.
              </p>
            ) : (
              <div className="space-y-1">
                {effectifMetier.map((e) => (
                  <button
                    key={e.code}
                    onClick={() => setSelectedPerson(selectedPerson === e.code ? "all" : e.code)}
                    className="w-full flex items-center gap-2.5 text-xs py-1.5 px-1.5 rounded text-left hover:bg-[#FAFBFC]"
                    style={selectedPerson === e.code ? { background: CARE + "12" } : undefined}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: getIntervenantColor(e.code, intervenants), opacity: e.bloque ? 0.45 : 1 }}
                    >
                      {e.code.slice(0, 2)}
                    </span>
                    <span className="font-semibold shrink-0" style={e.bloque ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                      {e.code}
                    </span>
                    <span className="muted truncate flex-1 min-w-0">
                      {e.nom}
                      {e.autresMetiers.length > 0 && <span className="opacity-70"> · aussi {e.autresMetiers.join(", ")}</span>}
                    </span>
                    {e.bloque && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: RED + "12", color: RED }}>
                        Bloqué·e{e.blocageMotif ? ` — ${e.blocageMotif}` : ""}
                      </span>
                    )}
                    <span className="mono shrink-0 font-semibold">{e.hours}h</span>
                    <span className="mono muted shrink-0 w-16 text-right">{e.count} évt.</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] muted mt-2">
              Effectif issu des métiers cochés par le·la chef·fe d'équipe dans l'onglet « Intervenants ». Clique sur une personne pour n'afficher qu'elle dans le reste du plan de charge.
            </p>
          </div>
          {capaciteHeures != null && (
            <p className="text-xs font-medium" style={{ color: depassement ? RED : "#1E7A4C" }}>
              {depassement
                ? `⚠ La charge déjà planifiée (${chargeHeuresMetier}h) dépasse la capacité déclarée (${capaciteHeures}h) pour ce métier.`
                : `La charge planifiée reste dans la capacité déclarée (${chargeHeuresMetier}h / ${capaciteHeures}h).`}
            </p>
          )}
          <p className="text-[10.5px] muted mt-2">
            « Postes demandés » cumule les moyens humains prévus déclarés sur chaque projet (onglet « Mes projets »/« Dossiers projets ») pour ce métier — un repère sur le volume à anticiper, indépendant des affectations déjà planifiées dans l'agenda. 1607h/an est le repère légal français à temps plein — à ajuster mentalement si la période observée n'est pas une année complète.
          </p>
        </div>
      )}

      {selectedPerson !== "all" && (
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <div className="flex items-center gap-3 mb-4">
            <span
              style={{ background: getIntervenantColor(selectedPerson, intervenants) }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            >
              {selectedPerson.slice(0, 2)}
            </span>
            <div>
              <div className="font-semibold text-sm">{selectedPerson}</div>
              <div className="text-xs muted">
                {intervenantMetiersLabel(intervenants.find((i) => i.code === selectedPerson))}
              </div>
            </div>
            {(() => {
              const w = workloadAll.find((x) => x.code === selectedPerson);
              return (
                <div className="ml-auto flex gap-4 text-right">
                  <div>
                    <div className="disp text-2xl" style={{ fontWeight: 600 }}>{w ? Math.round(w.hours * 100) / 100 : 0}h</div>
                    <div className="text-[10px] muted uppercase tracking-wide">heures estimées</div>
                  </div>
                  <div>
                    <div className="disp text-2xl" style={{ fontWeight: 600 }}>{w ? w.total : 0}</div>
                    <div className="text-[10px] muted uppercase tracking-wide">évènements</div>
                  </div>
                  {w && w.unknownDuration > 0 && (
                    <div>
                      <div className="disp text-2xl opacity-50" style={{ fontWeight: 600 }}>{w.unknownDuration}</div>
                      <div className="text-[10px] muted uppercase tracking-wide">durée inconnue</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          {personDetail && personDetail.length > 0 && (
            <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: LINE }}>
              {personDetail.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2 text-sm">
                  <StatusDot statut={e.statut} />
                  <div className="mono w-20 shrink-0 opacity-90">{fmtDate(e.date)}</div>
                  <div className="w-32 shrink-0"><Pill color={CARE}>{e.type}</Pill></div>
                  <div className="flex-1 min-w-0 truncate opacity-80">{e.lieu}{e.horaire && e.horaire !== "—" ? ` · ${e.horaire}` : ""}</div>
                  {e._travelHours > 0 && (
                    <div className="mono text-[11px] w-24 text-right shrink-0" style={{ color: MUTED }} title={`${e.kilometres ? e.kilometres + " km" : ""} aller simple`}>
                      +{e._travelHours}h trajet
                    </div>
                  )}
                  <div className="mono text-xs w-14 text-right shrink-0">{e._hours !== null ? `${e._hours}h` : "?"}</div>
                </div>
              ))}
            </div>
          )}
          {personDeclared.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: LINE }}>
              <div className="text-[11px] font-mono uppercase tracking-wide muted mb-2">Temps de travail déclarés manuellement</div>
              <div className="divide-y" style={{ borderColor: LINE }}>
                {personDeclared.map((t) => {
                  const cat = ttCategorieMeta(t.categorieId);
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                      <div className="mono w-20 shrink-0 opacity-90">{fmtDate(t.date)}</div>
                      <div className="flex-1 min-w-0 truncate" style={{ color: cat.color }}>{cat.label}{t.note ? ` · ${t.note}` : ""}</div>
                      <div className="mono text-xs w-14 text-right shrink-0">{t.duree}h</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>
          Charge mensuelle {selectedPerson === "all" ? "— top intervenants" : `— ${selectedPerson}`} ({metric === "hours" ? "heures estimées" : "nb. d'évènements"})
        </SectionLabel>
        {chartData.length === 0 ? (
          <p className="text-sm muted">Pas assez de données datées pour construire le graphique.</p>
        ) : (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: INK }} axisLine={{ stroke: LINE }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: INK }} axisLine={{ stroke: LINE }} tickLine={false} allowDecimals={metric === "hours"} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: LINE }} formatter={(v) => [`${v} ${unit}`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {top.map((w) => (
                  <Bar key={w.code} dataKey={w.code} stackId="a" fill={getIntervenantColor(w.code, intervenants)} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total heures — toute l'équipe" value={`${totalTeamHours}h`} />
        <StatCard label="Total évènements — toute l'équipe" value={totalTeamCount} />
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Répartition {metric === "hours" ? "des heures" : "des évènements"} par intervenant·e (%)</SectionLabel>
        {pieData.length === 0 ? (
          <p className="text-sm muted text-center py-10">Aucune donnée sur cette sélection.</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4 items-center">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: LINE }} formatter={(v) => [`${v} ${unit}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <IntervenantChip code={d.name} intervenants={intervenants} />
                  <span className="flex-1" />
                  <span className="mono">{d.value}{unit}</span>
                  <span className="mono font-semibold w-12 text-right" style={{ color: CARE_DARK }}>
                    {pieTotal > 0 ? Math.round((d.value / pieTotal) * 1000) / 10 : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-5 overflow-x-auto" style={{ borderColor: LINE }}>
        <SectionLabel>Matrice intervenant × mois ({metric === "hours" ? "heures" : "évènements"})</SectionLabel>
        <table className="text-xs min-w-full">
          <thead>
            <tr>
              <th className="text-left px-2 py-2 sticky left-0 bg-white">Intervenant</th>
              {monthsOrdered.map((m) => (
                <th key={m.key} className="px-2 py-2 text-center mono whitespace-nowrap">{m.label}</th>
              ))}
              <th className="px-2 py-2 text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {displayedPeople.map((w) => (
              <tr key={w.code} className="border-t" style={{ borderColor: LINE }}>
                <td className="px-2 py-1.5 sticky left-0 bg-white">
                  <IntervenantChip code={w.code} intervenants={intervenants} />
                </td>
                {monthsOrdered.map((m) => {
                  const evs = eventsWithHours.filter((e) => e.date?.startsWith(m.key) && e.intervenants.includes(w.code));
                  const val = metric === "hours"
                    ? Math.round(evs.reduce((s, e) => s + (e._hours || 0), 0) * 100) / 100
                    : evs.length;
                  return (
                    <td key={m.key} className="px-2 py-1.5 text-center">
                      {val > 0 ? (
                        <span
                          className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded text-white font-semibold"
                          style={{ background: getIntervenantColor(w.code, intervenants), opacity: 0.35 + Math.min(val, 10) * 0.065 }}
                        >
                          {val}
                        </span>
                      ) : <span className="opacity-20">·</span>}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center font-semibold">
                  {metric === "hours" ? `${Math.round(w.hours * 100) / 100}h` : w.total}
                </td>
              </tr>
            ))}
            {displayedPeople.length === 0 && (
              <tr><td colSpan={monthsOrdered.length + 2} className="text-center py-6 muted">Aucun intervenant ne correspond à ces filtres.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {displayedPeople.map((w) => {
          const meta = intervenants.find((i) => i.code === w.code);
          return (
            <button
              key={w.code}
              onClick={() => setSelectedPerson(w.code)}
              className="text-left bg-white rounded-lg border p-4 hover:shadow-sm transition"
              style={{ borderColor: LINE }}
            >
              <div className="flex items-center gap-2 mb-1">
                <IntervenantChip code={w.code} intervenants={intervenants} />
                <span className="text-xs muted">{intervenantMetiersLabel(meta)}</span>
              </div>
              <div className="disp text-2xl" style={{ fontWeight: 600 }}>
                {metric === "hours" ? `${Math.round(w.hours * 100) / 100}h` : w.total}
                <span className="text-xs font-normal ml-1.5" style={{ color: CARE_DARK }}>
                  ({metric === "hours"
                    ? (totalTeamHours > 0 ? Math.round((w.hours / totalTeamHours) * 1000) / 10 : 0)
                    : (totalTeamCount > 0 ? Math.round((w.total / totalTeamCount) * 1000) / 10 : 0)}%)
                </span>
              </div>
              <div className="text-[11px] muted">
                {metric === "hours"
                  ? `${w.total} évènement${w.total > 1 ? "s" : ""}${w.unknownDuration ? ` · ${w.unknownDuration} durée inconnue` : ""}${w.declared ? ` · dont ${w.declared}h déclarées` : ""}${w.travel ? ` · dont ${Math.round(w.travel * 100) / 100}h de trajet` : ""}`
                  : `${Math.round(w.hours * 100) / 100}h estimées`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   MON ESPACE — vue personnelle intervenant·e
   ============================================================ */
const ABSENCE_TYPES = ["Congé payé", "RTT", "JNT", "Congés / Vacances"];

function AbsenceQuickForm({ onAdd, onClose }) {
  const [type, setType] = useState("Congé payé");
  const [date, setDate] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const submit = () => {
    if (!date) return;
    onAdd({ type, date, dateFin, commentaireIntervenant: commentaire, statut: "en_cours" });
  };
  return (
    <div className="rounded-md border p-3 space-y-2" style={{ borderColor: PURPLE, background: PURPLE + "0d" }}>
      <div className="grid grid-cols-2 gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}>
          {ABSENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }} />
      </div>
      <input
        type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
        placeholder="Date de fin (si plusieurs jours)"
        className="w-full text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}
      />
      <input
        value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Commentaire (optionnel)"
        className="w-full text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}
      />
      <p className="text-[10px] muted">RTT : réduction du temps de travail · JNT : journée non travaillée.</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="text-xs font-medium px-3 py-1.5 rounded-md">Annuler</button>
        <button type="button" onClick={submit} className="text-xs font-semibold text-white px-3 py-1.5 rounded-md" style={{ background: PURPLE }}>Ajouter</button>
      </div>
    </div>
  );
}

function TempsTravailQuickForm({ projects, onAdd, onClose }) {
  const [categorieId, setCategorieId] = useState(INTERVENANT_TT_CATEGORY_IDS[0]);
  const [projetId, setProjetId] = useState("");
  const [date, setDate] = useState(today);
  const [duree, setDuree] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const submit = () => {
    if (!duree) return;
    onAdd({ categorieId, projetId: projetId || null, date, duree, note: commentaire });
  };
  return (
    <div className="rounded-md border p-3 space-y-2" style={{ borderColor: CARE, background: CARE + "0d" }}>
      <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className="w-full text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}>
        {INTERVENANT_TT_CATEGORY_IDS.map((id) => {
          const c = ttCategorieMeta(id);
          return <option key={id} value={id}>{c.label}</option>;
        })}
      </select>
      <select value={projetId} onChange={(e) => setProjetId(e.target.value)} className="w-full text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}>
        <option value="">Aucun projet en particulier</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }} />
        <input type="number" step="0.5" min="0" value={duree} onChange={(e) => setDuree(e.target.value)} placeholder="Durée (h)" className="text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }} />
      </div>
      <input
        value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Précision (optionnel)"
        className="w-full text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="text-xs font-medium px-3 py-1.5 rounded-md">Annuler</button>
        <button type="button" onClick={submit} className="text-xs font-semibold text-white px-3 py-1.5 rounded-md" style={{ background: CARE }}>Enregistrer</button>
      </div>
    </div>
  );
}

function MonEspaceTab({ session, events, projects, intervenants, tempsTravail, onAddTemps, onRequestDeleteTemps, onSetStatut, onEdit, onUpdateComment, onQuickAdd, onRequestDeleteEvent, onRaiseAlert, onClearAlert, onOpenAccount }) {
  const code = session.intervenantCode;
  const [monthCursor, setMonthCursor] = useState(today.slice(0, 7));
  const [commentOpenId, setCommentOpenId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [alertOpenId, setAlertOpenId] = useState(null);
  const [alertDraft, setAlertDraft] = useState("");
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [gaugePeriod, setGaugePeriod] = useState("month");

  const myEvents = useMemo(() => {
    if (!code) return [];
    return events
      .filter((e) => e.intervenants.includes(code))
      .map((e) => ({ ...e, _hours: getEventHours(e) }))
      .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  }, [events, code]);

  const monthEvents = useMemo(() => myEvents.filter((e) => monthsSpanned(e).includes(monthCursor)), [myEvents, monthCursor]);
  const monthHours = Math.round(monthEvents.reduce((s, e) => s + (e._hours || 0), 0) * 100) / 100;
  const monthCompletion = computeCompletion(monthEvents);
  const monthLabelText = new Date(monthCursor + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const yearlyMonths = useMemo(() => {
    const set = new Set([today.slice(0, 7)]);
    myEvents.forEach((e) => monthsSpanned(e).forEach((m) => set.add(m)));
    return Array.from(set).sort().map((key) => {
      const evs = myEvents.filter((e) => monthsSpanned(e).includes(key));
      return {
        key,
        label: new Date(key + "-01").toLocaleDateString("fr-FR", { month: "short" }),
        count: evs.length,
        hours: Math.round(evs.reduce((s, e) => s + (e._hours || 0), 0) * 100) / 100,
      };
    });
  }, [myEvents]);
  const maxYearlyCount = Math.max(1, ...yearlyMonths.map((m) => m.count));

  const gaugeYear = monthCursor.slice(0, 4);
  const myTempsTravail = useMemo(
    () => tempsTravail.filter((t) => t.proprietaire === session.accountId),
    [tempsTravail, session.accountId]
  );
  const travailInPeriod = useMemo(() => {
    return myTempsTravail.filter((t) => (
      gaugePeriod === "month" ? (t.date || "").startsWith(monthCursor) : (t.date || "").startsWith(gaugeYear)
    ));
  }, [myTempsTravail, gaugePeriod, monthCursor, gaugeYear]);
  const contentByProject = useMemo(() => {
    const map = {};
    travailInPeriod.forEach((t) => {
      const cat = ttCategorieMeta(t.categorieId);
      map[cat.label] = (map[cat.label] || 0) + t.duree;
    });
    return Object.entries(map).map(([nom, h]) => ({ nom, h: Math.round(h * 100) / 100 })).sort((a, b) => b.h - a.h);
  }, [travailInPeriod]);
  const contentTotal = Math.round(travailInPeriod.reduce((s, t) => s + t.duree, 0) * 100) / 100;
  const contentMax = Math.max(1, ...contentByProject.map((c) => c.h));

  const absencesThisYear = useMemo(
    () => myEvents.filter((e) => ABSENCE_TYPES.includes(e.type) && (e.date || "").startsWith(gaugeYear)),
    [myEvents, gaugeYear]
  );
  const absenceDaysThisYear = absencesThisYear.reduce((s, e) => s + daysCount(e), 0);

  const openComment = (e) => {
    if (commentOpenId === e.id) { setCommentOpenId(null); return; }
    setCommentOpenId(e.id);
    setCommentDraft(e.commentaireIntervenant || "");
    setAlertOpenId(null);
  };
  const saveComment = (id) => {
    onUpdateComment(id, commentDraft);
    setCommentOpenId(null);
  };

  const openAlert = (e) => {
    if (alertOpenId === e.id) { setAlertOpenId(null); return; }
    setAlertOpenId(e.id);
    setAlertDraft(e.alerte?.message || "");
    setCommentOpenId(null);
  };
  const sendAlert = (id) => {
    if (!alertDraft.trim()) return;
    onRaiseAlert(id, alertDraft.trim());
    setAlertOpenId(null);
  };

  const addAbsence = (partial) => {
    onQuickAdd({
      projetId: "ABSENCES", type: partial.type, date: partial.date, dateFin: partial.dateFin,
      intervenants: [code], commentaireIntervenant: partial.commentaireIntervenant, statut: partial.statut,
    });
    setShowAbsenceForm(false);
  };
  const addTravail = (partial) => {
    onAddTemps({
      categorieId: partial.categorieId, projetId: partial.projetId,
      duree: partial.duree, date: partial.date, note: partial.note,
    });
    setShowContentForm(false);
  };

  if (!code) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center" style={{ borderColor: LINE }}>
        <HeartHandshake size={28} style={{ color: CARE }} className="mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">Bienvenue, {session.nom} !</p>
        <p className="text-sm muted max-w-md mx-auto mb-4">
          Ton profil n'est relié à aucun code intervenant, donc ton agenda personnel ne peut pas encore être filtré.
          Ouvre « Mon compte » pour choisir ou créer ton code.
        </p>
        <button
          onClick={onOpenAccount}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md"
          style={{ background: CARE }}
        >
          <UserCircle size={15} /> Ouvrir mon compte
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ---- navigation mensuelle + actions rapides ---- */}
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthCursor((m) => shiftMonth(m, -1))} className="w-8 h-8 rounded-md border flex items-center justify-center" style={{ borderColor: LINE }}>
            <ChevronLeft size={15} />
          </button>
          <div className="text-sm font-semibold capitalize w-36 text-center">{monthLabelText}</div>
          <button onClick={() => setMonthCursor((m) => shiftMonth(m, 1))} className="w-8 h-8 rounded-md border flex items-center justify-center" style={{ borderColor: LINE }}>
            <ChevronRight size={15} />
          </button>
          {monthCursor !== today.slice(0, 7) && (
            <button onClick={() => setMonthCursor(today.slice(0, 7))} className="text-xs font-medium" style={{ color: CARE_DARK }}>Aujourd'hui</button>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setShowAbsenceForm((s) => !s); setShowContentForm(false); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white"
            style={{ background: PURPLE }}
          >
            <PlaneTakeoff size={13} /> Déclarer une absence
          </button>
          <button
            onClick={() => { setShowContentForm((s) => !s); setShowAbsenceForm(false); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white"
            style={{ background: CARE }}
          >
            <PenLine size={13} /> Temps de travail
          </button>
        </div>
      </div>

      {showAbsenceForm && <AbsenceQuickForm onAdd={addAbsence} onClose={() => setShowAbsenceForm(false)} />}
      {showContentForm && <TempsTravailQuickForm projects={projects} onAdd={addTravail} onClose={() => setShowContentForm(false)} />}

      {/* ---- stats du mois sélectionné ---- */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label={`Évènements — ${monthLabelText}`} value={monthEvents.length} />
        <StatCard label={`Heures estimées — ${monthLabelText}`} value={`${monthHours}h`} />
        <StatCard label="Taux de réalisation du mois" value={monthCompletion.pct !== null ? `${monthCompletion.pct}%` : "—"} color={GREEN} />
      </div>

      {/* ---- vue macro annuelle ---- */}
      <div className="bg-white rounded-lg border p-5 overflow-x-auto" style={{ borderColor: LINE }}>
        <SectionLabel>Vue macro de l'année — clique un mois pour l'ouvrir</SectionLabel>
        <div className="flex gap-2 min-w-max">
          {yearlyMonths.map((m) => {
            const active = m.key === monthCursor;
            return (
              <button
                key={m.key} onClick={() => setMonthCursor(m.key)}
                className="flex flex-col items-center justify-end gap-1 rounded-md px-2.5 py-2 w-16 shrink-0"
                style={{ background: active ? CARE : PAPER_DARK, color: active ? "#fff" : INK }}
              >
                <div
                  className="w-full rounded"
                  style={{ height: 6 + (m.count / maxYearlyCount) * 34, background: active ? "#fff" : CARE, opacity: active ? 0.9 : 0.35 + (m.count / maxYearlyCount) * 0.5 }}
                />
                <span className="text-[10px] mono capitalize">{m.label}</span>
                <span className="text-[10px] font-semibold">{m.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- agenda du mois, avec commentaire par action ---- */}
      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Mon agenda — {monthLabelText}</SectionLabel>
        {monthEvents.length === 0 ? (
          <p className="text-sm muted">Rien de prévu ce mois-ci.</p>
        ) : (
          <div className="space-y-1.5">
            {monthEvents.map((e) => {
              const proj = projects.find((p) => p.id === e.projetId);
              const missing = isMissingInfo(e);
              const commentOpen = commentOpenId === e.id;
              const alertOpen = alertOpenId === e.id;
              return (
                <div key={e.id}>
                  <div className="flex items-center gap-3 py-2 text-sm row-status" style={{ ...statusRowStyle(e.statut), paddingLeft: 8, borderRadius: 6 }}>
                    <div className="mono w-24 shrink-0 opacity-90">{fmtDateRange(e)}</div>
                    <div className="w-32 shrink-0"><Pill color={CARE}>{e.type}</Pill></div>
                    <div className="flex-1 min-w-0 truncate">
                      <span className="font-medium">{proj?.nom}</span>
                      {e.type !== "Création de contenu" && !TYPES_SANS_LIEU.has(e.type) && ` — ${e.lieu || "lieu non renseigné"}`}
                      {e.horaire && e.horaire !== "—" ? ` · ${e.horaire}` : ""}{e._hours ? ` · ${e._hours}h` : ""}
                    </div>
                    {missing.length > 0 && <MissingBadge missing={missing} />}
                    {e.alerte && <AlertBadge alerte={e.alerte} />}
                    <button
                      onClick={() => openAlert(e)} title="Signaler un problème (indisponibilité, conflit…)"
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: e.alerte ? RED : "transparent", border: `1px solid ${e.alerte ? RED : LINE}`, color: e.alerte ? "#fff" : MUTED }}
                    >
                      <AlertTriangle size={13} />
                    </button>
                    <button
                      onClick={() => openComment(e)} title="Commentaire"
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: e.commentaireIntervenant ? CARE : "transparent", border: `1px solid ${e.commentaireIntervenant ? CARE : LINE}`, color: e.commentaireIntervenant ? "#fff" : MUTED }}
                    >
                      <MessageSquare size={13} />
                    </button>
                    <StatusControl statut={e.statut} onChange={(s) => onSetStatut(e.id, s)} />
                  </div>
                  {commentOpen && (
                    <div className="ml-4 mb-2 p-3 rounded-md" style={{ background: PAPER_DARK }}>
                      <textarea
                        autoFocus value={commentDraft} onChange={(ev) => setCommentDraft(ev.target.value)}
                        rows={2} placeholder="ex : dossier papier laissé à l'accueil, imprévu rencontré…"
                        className="w-full text-sm border rounded-md px-2.5 py-2 mb-2" style={{ borderColor: LINE }}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setCommentOpenId(null)} className="text-xs font-medium px-3 py-1.5 rounded-md">Annuler</button>
                        <button onClick={() => saveComment(e.id)} style={{ background: CARE }} className="text-xs font-semibold text-white px-3 py-1.5 rounded-md">Enregistrer</button>
                      </div>
                    </div>
                  )}
                  {alertOpen && (
                    <div className="ml-4 mb-2 p-3 rounded-md" style={{ background: RED + "0f", border: `1px solid ${RED}33` }}>
                      <p className="text-xs mb-2" style={{ color: RED }}>
                        Cette alerte sera visible par toute l'équipe de coordination (chargé·es/chef·fes de projet, secrétariat).
                      </p>
                      <textarea
                        autoFocus value={alertDraft} onChange={(ev) => setAlertDraft(ev.target.value)}
                        rows={2} placeholder="ex : je ne suis pas disponible ce jour-là, conflit d'agenda avec…"
                        className="w-full text-sm border rounded-md px-2.5 py-2 mb-2" style={{ borderColor: LINE }}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setAlertOpenId(null)} className="text-xs font-medium px-3 py-1.5 rounded-md">Annuler</button>
                        {e.alerte && (
                          <button onClick={() => { onClearAlert(e.id); setAlertOpenId(null); }} className="text-xs font-medium px-3 py-1.5 rounded-md" style={{ color: MUTED }}>Retirer l'alerte</button>
                        )}
                        <button onClick={() => sendAlert(e.id)} style={{ background: RED }} className="text-xs font-semibold text-white px-3 py-1.5 rounded-md">Envoyer l'alerte</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- jauge du temps de création de contenu ---- */}
      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: CARE_DARK }}>
            Temps de travail
          </span>
          <span className="flex-1 h-px" style={{ background: LINE }} />
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: LINE }}>
            <button onClick={() => setGaugePeriod("month")} className="text-xs font-semibold px-2.5 py-1" style={{ background: gaugePeriod === "month" ? CARE : "transparent", color: gaugePeriod === "month" ? "#fff" : INK }}>Ce mois</button>
            <button onClick={() => setGaugePeriod("year")} className="text-xs font-semibold px-2.5 py-1" style={{ background: gaugePeriod === "year" ? CARE : "transparent", color: gaugePeriod === "year" ? "#fff" : INK }}>Cette année</button>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="disp text-2xl" style={{ fontWeight: 600 }}>{contentTotal}h</span>
          <span className="text-xs muted">au total {gaugePeriod === "month" ? "ce mois-ci" : "cette année"}</span>
        </div>
        {contentByProject.length === 0 ? (
          <p className="text-sm muted">Aucun temps de travail déclaré sur cette période.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {contentByProject.map((c) => (
              <div key={c.nom}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{c.nom}</span>
                  <span className="mono muted shrink-0">{c.h}h</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: PAPER_DARK }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${(c.h / contentMax) * 100}%`, background: CARE }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {travailInPeriod.length > 0 && (
          <div className="space-y-1 pt-3 border-t" style={{ borderColor: LINE }}>
            {travailInPeriod.slice().sort((a, b) => b.date.localeCompare(a.date)).map((t) => {
              const cat = ttCategorieMeta(t.categorieId);
              return (
                <div key={t.id} className="flex items-center gap-3 text-xs py-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                  <span className="mono w-20 shrink-0 opacity-80">{fmtDate(t.date)}</span>
                  <span className="flex-1 truncate muted">{cat.label}{t.note ? ` · ${t.note}` : ""}</span>
                  <span className="mono shrink-0">{t.duree}h</span>
                  <button onClick={() => onRequestDeleteTemps(t.id)} className="shrink-0" title="Supprimer cette déclaration">
                    <Trash2 size={13} style={{ color: RED }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- récapitulatif des absences ---- */}
      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Mes absences — {gaugeYear}</SectionLabel>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="disp text-2xl" style={{ fontWeight: 600, color: PURPLE }}>{absenceDaysThisYear}</span>
          <span className="text-xs muted">jour{absenceDaysThisYear > 1 ? "s" : ""} déclaré{absenceDaysThisYear > 1 ? "s" : ""} cette année</span>
        </div>
        {absencesThisYear.length === 0 ? (
          <p className="text-sm muted">Aucune absence déclarée pour l'instant.</p>
        ) : (
          <div className="space-y-1">
            {absencesThisYear.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-xs py-1.5 border-t" style={{ borderColor: LINE }}>
                <span className="mono w-28 shrink-0 opacity-80">{fmtDateRange(e)}</span>
                <Pill color={PURPLE}>{e.type}</Pill>
                <span className="flex-1 truncate muted">{e.commentaireIntervenant}</span>
                <span className="mono shrink-0">{daysCount(e)} j.</span>
                <button onClick={() => onRequestDeleteEvent(e.id)} className="shrink-0" title="Supprimer cette absence">
                  <Trash2 size={13} style={{ color: RED }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   MES PROJETS — chargé·e / chef·fe de projet
   ============================================================ */
function MesProjetsCard({ p, events, intervenants, onSetStatut, onEdit, onNewEvent, onToggleFeatured, canFeature, canManageProjects, onUpdateBudget, onUpdateStatutFinancement }) {
  const [expanded, setExpanded] = useState(false);
  const evs = events.filter((e) => e.projetId === p.id).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const completion = computeCompletion(evs);
  const upcoming = evs.filter((e) => e.date && e.date >= today);
  const displayed = expanded ? evs : upcoming.slice(0, 4);
  const hiddenCount = evs.length - displayed.length;
  return (
    <div className="bg-white rounded-lg overflow-hidden" style={{ border: `${p.featured ? 2 : 1}px solid ${p.featured ? AMBER : LINE}` }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: PAPER_DARK }}>
        {canFeature && (
          <button onClick={() => onToggleFeatured(p.id)} title={p.featured ? "Retirer la mise en avant" : "Mettre en avant"} type="button">
            <Star size={16} fill={p.featured ? AMBER : "none"} style={{ color: AMBER }} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] mono uppercase muted flex items-center gap-1">{p.categorie}<ProgrammeTag categorie={p.categorie} /></div>
          <div className="text-sm font-semibold truncate flex items-center gap-1.5">
            {p.nom}
            {p.statutFinancement && (
              <span
                title={PROJECT_STATUT_META[p.statutFinancement].label}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ background: PROJECT_STATUT_META[p.statutFinancement].color + "1a", color: PROJECT_STATUT_META[p.statutFinancement].color }}
              >
                {React.createElement(PROJECT_STATUT_META[p.statutFinancement].Icon, { size: 10 })}
              </span>
            )}
          </div>
        </div>
        {canManageProjects && (
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number" placeholder="Budget €" defaultValue={p.budget ?? ""}
              onBlur={(e) => onUpdateBudget(p.id, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
              className="w-20 text-xs border rounded px-1.5 py-1 text-right" style={{ borderColor: LINE }}
            />
            <ProjectStatutControl
              statut={p.statutFinancement} date={p.statutFinancementDate}
              onChange={(statut, date) => onUpdateStatutFinancement(p.id, statut, date)}
            />
          </div>
        )}
        <div className="text-right shrink-0">
          <div className="disp text-lg" style={{ fontWeight: 600 }}>{completion.pct !== null ? `${completion.pct}%` : "—"}</div>
          <div className="text-[10px] muted">{completion.realise}/{completion.total - completion.annule} réalisés</div>
        </div>
        <button onClick={() => onNewEvent(p.id)} className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md text-white" style={{ background: CARE }}>
          <Plus size={13} /> Évènement
        </button>
      </div>
      {Array.isArray(p.moyensHumains) && p.moyensHumains.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b" style={{ borderColor: LINE, background: "#FAFBFC" }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide muted mr-1">Moyens humains prévus :</span>
          {p.moyensHumains.map((m, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: CARE + "14", color: CARE_DARK }}>
              {m.nombre}× {m.metier}
            </span>
          ))}
        </div>
      )}
      <div className="px-4 py-3">
        {evs.length === 0 ? (
          <p className="text-xs muted">Aucune action pour l'instant.</p>
        ) : displayed.length === 0 ? (
          <p className="text-xs muted">Aucune échéance à venir — {evs.length} action{evs.length > 1 ? "s" : ""} passée{evs.length > 1 ? "s" : ""} au total.</p>
        ) : (
          <div className="space-y-1.5">
            {displayed.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-1.5 text-sm row-status" style={{ ...statusRowStyle(e.statut), paddingLeft: 8, borderRadius: 6 }}>
                <div className="mono w-20 shrink-0 opacity-90">{fmtDateRange(e)}</div>
                <div className="w-28 shrink-0"><Pill color={CARE}>{e.type}</Pill></div>
                <button onClick={() => onEdit(e)} className="flex-1 min-w-0 text-left truncate opacity-80">{e.lieu || "Lieu non renseigné"}</button>
                {e.alerte && <AlertBadge alerte={e.alerte} />}
                <div className="flex gap-1 shrink-0">{e.intervenants.map((c) => <IntervenantChip key={c} code={c} intervenants={intervenants} />)}</div>
                <StatusControl statut={e.statut} onChange={(s) => onSetStatut(e.id, s)} />
              </div>
            ))}
          </div>
        )}
        {evs.length > 4 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold mt-2 pt-2 border-t"
            style={{ color: CARE_DARK, borderColor: LINE }}
          >
            {expanded ? (
              <>Réduire <ChevronUp size={13} /></>
            ) : (
              <>Voir {hiddenCount > 0 ? `les ${hiddenCount} autre${hiddenCount > 1 ? "s" : ""} évènement${hiddenCount > 1 ? "s" : ""}` : "tout"} ({evs.length} au total) <ChevronDown size={13} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MODALE — NOUVEAU PROJET (depuis « Mes projets »)
   ------------------------------------------------------------
   Création complète, avec le détail des moyens humains prévus
   par métier (indicatif — ne crée pas d'intervenant·es).
   ============================================================ */
function NouveauProjetModal({ allCategories, onClose, onCreate }) {
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState("");
  const [chargeDeProjet, setChargeDeProjet] = useState("");
  const [structure, setStructure] = useState("");
  const [budget, setBudget] = useState("");
  const [moyens, setMoyens] = useState([{ metier: PROFESSIONS[0], nombre: 1 }]);

  const updateMoyen = (idx, patch) => setMoyens((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  const addMoyen = () => setMoyens((prev) => [...prev, { metier: PROFESSIONS[0], nombre: 1 }]);
  const removeMoyen = (idx) => setMoyens((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    if (!nom.trim()) return;
    onCreate({
      nom, categorie, chargeDeProjet, structure, budget,
      moyensHumains: moyens.filter((m) => m.metier && Number(m.nombre) > 0).map((m) => ({ metier: m.metier, nombre: Number(m.nombre) })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Nouveau projet</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="text-xs font-medium block mb-1">Nom du projet</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} autoFocus className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} placeholder="Ex. Journées du cœur des femmes 2027" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Catégorie / programme</label>
              <input value={categorie} onChange={(e) => setCategorie(e.target.value)} list="np-categories" className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} placeholder="Ex. Form'action DDPP" />
              <datalist id="np-categories">{allCategories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Chef·fe de projet</label>
              <input value={chargeDeProjet} onChange={(e) => setChargeDeProjet(e.target.value)} className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Structure partenaire</label>
              <input value={structure} onChange={(e) => setStructure(e.target.value)} className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Budget prévisionnel (€)</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>

          <div className="pt-2 border-t" style={{ borderColor: LINE }}>
            <label className="text-xs font-semibold block mb-2 mt-2">Moyens humains prévus, par métier</label>
            <div className="space-y-2">
              {moyens.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={m.metier} onChange={(e) => updateMoyen(idx, { metier: e.target.value })}
                    className="flex-1 min-w-0 text-sm border rounded-md px-2 py-1.5" style={{ borderColor: LINE }}
                  >
                    {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="number" min="1" value={m.nombre}
                    onChange={(e) => updateMoyen(idx, { nombre: e.target.value })}
                    className="w-16 text-sm border rounded-md px-2 py-1.5 text-center" style={{ borderColor: LINE }}
                  />
                  <button type="button" onClick={() => removeMoyen(idx)} className="shrink-0" title="Retirer cette ligne">
                    <Trash2 size={14} style={{ color: RED }} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addMoyen} className="flex items-center gap-1 text-xs font-medium mt-2" style={{ color: CARE_DARK }}>
              <Plus size={13} /> Ajouter un métier
            </button>
            <p className="text-[11px] muted mt-2">Indicatif : ça ne crée pas automatiquement de comptes intervenant·es, ça sert juste à documenter le besoin prévu pour ce projet.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0" style={{ borderColor: LINE }}>
          <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button type="button" onClick={submit} style={{ background: AMBER }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Plus size={15} /> Créer ce projet
          </button>
        </div>
      </div>
    </div>
  );
}

function MesProjetsTab({ session, projects, events, intervenants, onSetStatut, onEdit, onNewEvent, onToggleFeatured, canFeature, currentAccount, onUpdateSelection, allCategories, canManageProjects, onUpdateBudget, onUpdateStatutFinancement, onCreateProject }) {
  const explicitIds = currentAccount?.projetsSelectionnes;
  const hasExplicit = Array.isArray(explicitIds);
  const mine = useMemo(() => {
    if (hasExplicit) return projects.filter((p) => explicitIds.includes(p.id));
    return projects.filter((p) => matchesPerson(p.chargeDeProjet, session.nom));
  }, [projects, session.nom, hasExplicit, explicitIds]);
  const [showAll, setShowAll] = useState(mine.length === 0);
  const [showPicker, setShowPicker] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const list = showAll ? projects : mine;

  const overall = useMemo(() => {
    const ids = new Set(list.map((p) => p.id));
    return computeCompletion(events.filter((e) => ids.has(e.projetId)));
  }, [list, events]);

  const alertedEvents = useMemo(() => {
    const ids = new Set(list.map((p) => p.id));
    return events.filter((e) => e.alerte && ids.has(e.projetId));
  }, [list, events]);

  // Regroupement par programme (ex. ARS DDPP) pour que les chargé·es et
  // chef·fes de projet voient d'un coup d'œil que ces dossiers relèvent
  // du même financeur, plutôt que d'une longue liste plate.
  const categoriesInProgrammes = new Set(PROGRAMMES.flatMap((pr) => pr.categories));
  const programmeGroups = PROGRAMMES.map((pr) => ({
    ...pr,
    projs: list.filter((p) => pr.categories.includes(p.categorie)),
  })).filter((g) => g.projs.length > 0);
  const otherByCat = useMemo(() => {
    const m = {};
    list.filter((p) => !categoriesInProgrammes.has(p.categorie)).forEach((p) => {
      (m[p.categorie] = m[p.categorie] || []).push(p);
    });
    return m;
  }, [list]);

  const cardProps = { events, intervenants, onSetStatut, onEdit, onNewEvent, onToggleFeatured, canFeature, canManageProjects, onUpdateBudget, onUpdateStatutFinancement };

  return (
    <div className="space-y-5">
      {alertedEvents.length > 0 && (
        <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: RED }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: RED }}>
              Alertes sur ces projets ({alertedEvents.length})
            </span>
            <span className="flex-1 h-px" style={{ background: RED + "33" }} />
          </div>
          <ul className="space-y-2">
            {alertedEvents.map((e) => {
              const proj = projects.find((p) => p.id === e.projetId);
              return (
                <li key={e.id} className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={13} style={{ color: RED }} className="shrink-0 mt-0.5" />
                  <span className="flex-1">
                    <span className="font-semibold">{e.alerte.auteur}</span> — {proj?.nom} ({fmtDate(e.date)}) : {e.alerte.message}
                  </span>
                  <button onClick={() => onEdit(e)} className="text-xs font-medium shrink-0" style={{ color: CARE_DARK }}>Ouvrir →</button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div>
          <div className="text-sm font-semibold">Bonjour {session.nom}</div>
          <div className="text-xs muted">
            {mine.length} projet{mine.length > 1 ? "s" : ""} {hasExplicit ? "choisi" + (mine.length > 1 ? "s" : "") : "associé" + (mine.length > 1 ? "s" : "")} {hasExplicit ? "" : "à ton nom"}
            {!hasExplicit && mine.length === 0 ? " — aucune correspondance trouvée automatiquement, tous les projets sont affichés" : ""}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {canManageProjects && (
            <button onClick={() => setShowNewProject(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ background: AMBER }}>
              <Plus size={13} /> Nouveau projet
            </button>
          )}
          <button onClick={() => setShowPicker(true)} className="text-xs font-medium px-3 py-1.5 rounded-md text-white" style={{ background: CARE }}>
            Choisir mes projets
          </button>
          {mine.length > 0 && (
            <button onClick={() => setShowAll((s) => !s)} className="text-xs font-medium px-3 py-1.5 rounded-md border" style={{ borderColor: CARE, color: CARE_DARK }}>
              {showAll ? "Voir seulement mes projets" : "Voir tous les projets"}
            </button>
          )}
          <div className="text-right">
            <div className="disp text-xl" style={{ fontWeight: 600, color: GREEN }}>{overall.pct !== null ? `${overall.pct}%` : "—"}</div>
            <div className="text-[10px] muted uppercase">réalisé</div>
          </div>
        </div>
      </div>

      {showPicker && (
        <ProjectPickerModal
          projects={projects} allCategories={allCategories}
          selected={hasExplicit ? explicitIds : mine.map((p) => p.id)}
          title="Choisir mes projets"
          hint="Coche les projets que tu gères. Ils seront affichés en priorité dans « Mes projets », et dans tes autres onglets (Tableau de bord, Calendrier, Recherche d'actions, Dossiers projets, Plan de charge)."
          onClose={() => setShowPicker(false)}
          onSave={(ids) => { onUpdateSelection(ids); setShowAll(false); setShowPicker(false); }}
        />
      )}

      {showNewProject && (
        <NouveauProjetModal
          allCategories={allCategories}
          onClose={() => setShowNewProject(false)}
          onCreate={(payload) => { onCreateProject(payload.nom, payload.categorie, payload.chargeDeProjet, payload); setShowNewProject(false); }}
        />
      )}

      {list.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-sm muted" style={{ borderColor: LINE }}>Aucun projet à afficher.</div>
      ) : (
        <div className="space-y-5">
          {programmeGroups.map((g) => (
            <div key={g.id} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${CARE}` }}>
              <div className="px-4 py-3" style={{ background: CARE }}>
                <div className="flex items-center gap-2">
                  <Briefcase size={15} className="text-white shrink-0" />
                  <span className="text-sm font-semibold text-white">{g.label}</span>
                  <span className="text-xs mono text-white opacity-90 ml-auto">{g.projs.length} projet{g.projs.length > 1 ? "s" : ""}</span>
                </div>
                <div className="text-[11px] text-white opacity-80 mt-0.5">{g.description}</div>
              </div>
              <div className="p-3 space-y-3" style={{ background: CARE + "0d" }}>
                {g.projs.map((p) => <MesProjetsCard key={p.id} p={p} {...cardProps} />)}
              </div>
            </div>
          ))}

          {Object.entries(otherByCat).map(([cat, projs]) => (
            <div key={cat}>
              <div className="text-xs font-semibold muted uppercase tracking-wide mb-2 px-1">{cat}</div>
              <div className="space-y-3">
                {projs.map((p) => <MesProjetsCard key={p.id} p={p} {...cardProps} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SECRÉTARIAT — contacts, logistique, informations administratives
   ============================================================ */
function SecretariatTab({ projects, events, onUpdateProjectMeta, financeEntries, onClearFinanceAlert }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter((p) => [p.nom, p.structure, p.contact, p.chargeDeProjet].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [projects, search]);

  const missing = useMemo(() => events.map((e) => ({ e, missing: isMissingInfo(e) })).filter((x) => x.missing.length > 0), [events]);
  const preinscrits = useMemo(
    () => events.filter((e) => e.preinscrits !== null && e.preinscrits !== undefined).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")),
    [events]
  );
  const facturationsAFaire = useMemo(() => (financeEntries || []).filter((e) => e.alerteFacturation), [financeEntries]);

  return (
    <div className="space-y-5">
      {facturationsAFaire.length > 0 && (
        <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: RED }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: RED }}>
              Facturations à réaliser ({facturationsAFaire.length})
            </span>
            <span className="flex-1 h-px" style={{ background: RED + "33" }} />
          </div>
          <ul className="space-y-2">
            {facturationsAFaire.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-xs">
                <AlertTriangle size={13} style={{ color: RED }} className="shrink-0 mt-0.5" />
                <span className="flex-1">
                  <span className="font-semibold">{e.client}</span> — {e.alerteFacturation.message}
                  <span className="muted"> · signalé par {e.alerteFacturation.auteur} le {fmtDate(e.alerteFacturation.date)}</span>
                </span>
                <button onClick={() => onClearFinanceAlert(e.id)} className="text-xs font-medium shrink-0" style={{ color: CARE_DARK }}>
                  Marquer facturé
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet, une structure, un contact…"
            className="pl-8 pr-3 py-1.5 text-sm border rounded-md w-full" style={{ borderColor: LINE }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5 overflow-x-auto" style={{ borderColor: LINE }}>
        <SectionLabel>Annuaire des contacts &amp; structures ({filtered.length})</SectionLabel>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] mono uppercase tracking-wide" style={{ background: PAPER_DARK }}>
              <th className="px-3 py-2">Projet</th>
              <th className="px-3 py-2">Chef·fe de projet</th>
              <th className="px-3 py-2">Structure</th>
              <th className="px-3 py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: LINE }}>
                <td className="px-3 py-2 font-medium align-top">
                  {p.nom}
                  <div className="text-[11px] muted flex items-center gap-1">{p.categorie}<ProgrammeTag categorie={p.categorie} /></div>
                </td>
                <td className="px-3 py-2 opacity-80 align-top">{p.chargeDeProjet}</td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={p.structure} onBlur={(e) => onUpdateProjectMeta(p.id, { structure: e.target.value })}
                    className="w-full text-sm border rounded px-2 py-1" style={{ borderColor: LINE }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={p.contact} onBlur={(e) => onUpdateProjectMeta(p.id, { contact: e.target.value })}
                    className="w-full text-sm border rounded px-2 py-1" style={{ borderColor: LINE }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] muted mt-2">Clique dans un champ « Structure » ou « Contact » pour le modifier, puis clique ailleurs pour enregistrer.</p>
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Suivi des préinscriptions</SectionLabel>
        {preinscrits.length === 0 ? (
          <p className="text-sm muted">Aucun effectif renseigné pour l'instant.</p>
        ) : (
          <div className="space-y-1">
            {preinscrits.map((e) => {
              const proj = projects.find((pp) => pp.id === e.projetId);
              return (
                <div key={e.id} className="flex items-center gap-3 py-1.5 text-sm border-t" style={{ borderColor: LINE }}>
                  <div className="mono w-24 shrink-0 opacity-80">{fmtDate(e.date)}</div>
                  <div className="flex-1 min-w-0 truncate">{proj?.nom} — {e.type}</div>
                  <div className="mono text-sm font-semibold px-2 py-0.5 rounded" style={{ background: CARE + "18", color: CARE_DARK }}>{e.preinscrits}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Informations manquantes à compléter ({missing.length})</SectionLabel>
        {missing.length === 0 ? (
          <p className="text-sm muted">Tout est renseigné, bravo !</p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {missing.map(({ e, missing: m }) => {
              const proj = projects.find((p) => p.id === e.projetId);
              return (
                <li key={e.id} className="flex items-center gap-2 text-xs">
                  <AlertCircle size={13} style={{ color: AMBER }} className="shrink-0" />
                  <span className="flex-1"><span className="font-medium">{proj?.nom}</span> — {e.type} ({fmtDate(e.date)})</span>
                  <MissingBadge missing={m} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PILOTAGE — vue globale du·de la chef·fe d'équipe
   ============================================================ */
function PilotageTab({ projects: allProjects, events: allEvents, intervenants, accounts, onGoToProject, onEdit, currentAccount, onUpdateSelection, allCategories }) {
  const [showPicker, setShowPicker] = useState(false);
  const filterIds = currentAccount?.projetsSelectionnes;
  const isFiltered = Array.isArray(filterIds) && filterIds.length > 0;
  const projects = isFiltered ? allProjects.filter((p) => filterIds.includes(p.id)) : allProjects;
  const events = isFiltered ? allEvents.filter((e) => filterIds.includes(e.projetId)) : allEvents;

  const globalStats = useMemo(() => {
    const c = { previsionnel: 0, en_cours: 0, realise: 0, annule: 0 };
    events.forEach((e) => { const s = normalizeStatut(e.statut); c[s] = (c[s] || 0) + 1; });
    return c;
  }, [events]);
  const globalCompletion = useMemo(() => computeCompletion(events), [events]);
  const budgetStats = useMemo(() => {
    const total = Math.round(projects.reduce((s, p) => s + (financeNum(p.budget)), 0) * 100) / 100;
    const validated = projects.filter((p) => p.statutFinancement === "valide").length;
    const enDepot = projects.filter((p) => p.statutFinancement === "depot").length;
    const refuses = projects.filter((p) => p.statutFinancement === "refuse").length;
    return { total, validated, enDepot, refuses, count: projects.length };
  }, [projects]);
  const alertedEvents = useMemo(() => events.filter((e) => e.alerte), [events]);

  const byCategorie = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      const evs = events.filter((e) => e.projetId === p.id);
      if (!map[p.categorie]) map[p.categorie] = { total: 0, realise: 0, annule: 0 };
      map[p.categorie].total += evs.length;
      map[p.categorie].realise += evs.filter((e) => normalizeStatut(e.statut) === "realise").length;
      map[p.categorie].annule += evs.filter((e) => normalizeStatut(e.statut) === "annule").length;
    });
    return Object.entries(map).map(([cat, v]) => {
      const denom = v.total - v.annule;
      return { cat, ...v, pct: denom > 0 ? Math.round((v.realise / denom) * 100) : null };
    }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [projects, events]);

  const byProject = useMemo(() => {
    return projects.map((p) => {
      const evs = events.filter((e) => e.projetId === p.id);
      return { p, alertCount: evs.filter((e) => e.alerte).length, ...computeCompletion(evs) };
    }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [projects, events]);

  const roster = useMemo(() => {
    const m = {};
    accounts.forEach((a) => { (m[a.role] = m[a.role] || []).push(a.nom); });
    return m;
  }, [accounts]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div className="text-xs muted">
          {isFiltered ? `Filtré sur ${filterIds.length} projet${filterIds.length > 1 ? "s" : ""}` : `Tous les projets affichés (${allProjects.length})`}
        </div>
        <div className="ml-auto flex items-center gap-2 no-print">
          {isFiltered && (
            <button onClick={() => onUpdateSelection([])} className="text-xs font-medium px-3 py-1.5 rounded-md border" style={{ borderColor: LINE, color: MUTED }}>
              Retirer le filtre
            </button>
          )}
          <button onClick={() => setShowPicker(true)} className="text-xs font-medium px-3 py-1.5 rounded-md text-white" style={{ background: CARE }}>
            Filtrer les projets affichés
          </button>
        </div>
      </div>

      {showPicker && (
        <ProjectPickerModal
          projects={allProjects} allCategories={allCategories}
          selected={filterIds || []}
          title="Filtrer les projets affichés"
          hint="Par défaut, tu vois tous les projets. Coche ceux que tu veux isoler pour cette vue (laisse tout décoché pour tout revoir)."
          onClose={() => setShowPicker(false)}
          onSave={(ids) => { onUpdateSelection(ids); setShowPicker(false); }}
        />
      )}

      {alertedEvents.length > 0 && (
        <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: RED }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: RED }}>
              Alertes de l'équipe ({alertedEvents.length})
            </span>
            <span className="flex-1 h-px" style={{ background: RED + "33" }} />
          </div>
          <ul className="space-y-2">
            {alertedEvents.map((e) => {
              const proj = projects.find((p) => p.id === e.projetId);
              return (
                <li key={e.id} className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={13} style={{ color: RED }} className="shrink-0 mt-0.5" />
                  <span className="flex-1">
                    <span className="font-semibold">{e.alerte.auteur}</span> — {proj?.nom} ({fmtDate(e.date)}) : {e.alerte.message}
                  </span>
                  {onEdit && <button onClick={() => onEdit(e)} className="text-xs font-medium shrink-0" style={{ color: CARE_DARK }}>Ouvrir →</button>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Taux de réalisation global" value={globalCompletion.pct !== null ? `${globalCompletion.pct}%` : "—"} color={GREEN} />
        <StatCard label={STATUS_META.previsionnel.label} value={globalStats.previsionnel} color={PURPLE} />
        <StatCard label={STATUS_META.en_cours.label} value={globalStats.en_cours} color={AMBER} />
        <StatCard label="Réalisé" value={globalStats.realise} color={GREEN} />
        <StatCard label="Annulé" value={globalStats.annule} color={RED} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Budget total des projets" value={`${budgetStats.total}€`} color={CARE} />
        <StatCard label="Projets validés par un financeur" value={`${budgetStats.validated} / ${budgetStats.count}`} color={GREEN} />
        <StatCard label="En cours de dépôt (attente de retour)" value={budgetStats.enDepot} color={PURPLE} />
        <StatCard label="Projets refusés" value={budgetStats.refuses} color={RED} />
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Avancement par dossier</SectionLabel>
        <div className="space-y-2.5">
          {byCategorie.map(({ cat, total, realise, pct }) => (
            <div key={cat}>
              <div className="flex justify-between text-xs mb-1 items-center gap-1">
                <span className="font-medium flex items-center gap-1 min-w-0"><span className="truncate">{cat}</span><ProgrammeTag categorie={cat} /></span>
                <span className="mono muted shrink-0">{pct !== null ? `${pct}%` : "—"} · {realise}/{total}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: PAPER_DARK }}>
                <div className="h-2 rounded-full" style={{ width: `${pct || 0}%`, background: GREEN }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5 overflow-x-auto" style={{ borderColor: LINE }}>
        <SectionLabel>Avancement par projet</SectionLabel>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] mono uppercase tracking-wide" style={{ background: PAPER_DARK }}>
              <th className="px-3 py-2">Projet</th>
              <th className="px-3 py-2">Chef·fe de projet</th>
              <th className="px-3 py-2 text-center">Réalisé</th>
              <th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center">%</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {byProject.map(({ p, total, realise, pct, alertCount }) => (
              <tr key={p.id} className="border-t" style={{ borderColor: LINE }}>
                <td className="px-3 py-2 font-medium">
                  {p.featured && <Star size={12} className="inline mr-1 -mt-0.5" style={{ color: AMBER }} fill={AMBER} />}
                  {alertCount > 0 && <AlertTriangle size={12} className="inline mr-1 -mt-0.5" style={{ color: RED }} />}
                  {p.nom}
                  <div className="text-[11px] muted">{p.categorie}</div>
                </td>
                <td className="px-3 py-2 opacity-80">{p.chargeDeProjet}</td>
                <td className="px-3 py-2 text-center">{realise}</td>
                <td className="px-3 py-2 text-center">{total}</td>
                <td className="px-3 py-2 text-center font-semibold">{pct !== null ? `${pct}%` : "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => onGoToProject(p.id)} className="text-xs font-medium" style={{ color: CARE_DARK }}>Voir →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Équipe enregistrée</SectionLabel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ROLES.map((r) => (
            <div key={r.id}>
              <div className="text-xs font-semibold mb-1">{r.label}</div>
              {(roster[r.id] || []).length === 0 ? (
                <p className="text-xs muted">Personne pour l'instant</p>
              ) : (
                <ul className="text-xs space-y-0.5">
                  {(roster[r.id] || []).map((n, i) => <li key={i} className="muted">{n}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   GESTION DU TEMPS — checklist + matrice d'Eisenhower
   Personnel à chaque compte (chargé·e / chef·fe de projet / chef·fe
   d'équipe) : tâches ajoutées et supprimées manuellement, classées
   par Urgent × Important pour nourrir la matrice.
   ============================================================ */
const EISENHOWER_QUADRANTS = [
  { key: "q1", urgent: true, important: true, label: "Urgent & important", sub: "À faire maintenant", color: RED },
  { key: "q2", urgent: false, important: true, label: "Important, non urgent", sub: "À planifier", color: CARE },
  { key: "q3", urgent: true, important: false, label: "Urgent, non important", sub: "À déléguer", color: AMBER },
  { key: "q4", urgent: false, important: false, label: "Ni urgent ni important", sub: "À éliminer / plus tard", color: MUTED },
];

const DELEGATION_STATUT_META = {
  en_attente: { label: "En attente de réponse", color: PURPLE },
  accepte: { label: "Acceptée", color: GREEN },
  refuse: { label: "Refusée", color: RED },
  peut_etre: { label: "Peut-être", color: AMBER },
};

function TacheRow({ t, compact, onUpdate, onRequestDelete, allIntervenantCodes, onDelegate }) {
  const [showDelegate, setShowDelegate] = useState(false);
  const [codeChoisi, setCodeChoisi] = useState(allIntervenantCodes?.[0] || "");
  const delegMeta = t.delegueStatut ? DELEGATION_STATUT_META[t.delegueStatut] : null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? "bg-white rounded-md p-2" : "py-2 px-2 rounded-md"}`} style={!compact ? { background: t.fait ? PAPER_DARK : "transparent" } : undefined}>
      <button
        onClick={() => onUpdate(t.id, { fait: !t.fait })}
        className={`${compact ? "w-4 h-4" : "w-5 h-5"} rounded border flex items-center justify-center shrink-0`}
        style={{ borderColor: t.fait ? GREEN : LINE, background: t.fait ? GREEN : "transparent" }}
      >
        {t.fait && <Check size={compact ? 10 : 12} className="text-white" />}
      </button>
      <span className={`flex-1 min-w-0 truncate ${compact ? "text-xs" : "text-sm"}`} style={t.fait ? { textDecoration: "line-through", opacity: 0.5 } : undefined}>
        {t.texte}
      </span>
      {delegMeta && (
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          title={t.delegueCommentaire || ""}
          style={{ background: delegMeta.color + "1a", color: delegMeta.color }}
        >
          → {t.delegueA} · {delegMeta.label}
        </span>
      )}
      {!compact && (
        <>
          <button
            onClick={() => onUpdate(t.id, { urgent: !t.urgent })}
            className="text-[10px] font-bold px-2 py-1 rounded shrink-0"
            style={{ background: t.urgent ? RED : "transparent", color: t.urgent ? "#fff" : MUTED, border: `1px solid ${t.urgent ? RED : LINE}` }}
          >
            URGENT
          </button>
          <button
            onClick={() => onUpdate(t.id, { important: !t.important })}
            className="text-[10px] font-bold px-2 py-1 rounded shrink-0"
            style={{ background: t.important ? CARE : "transparent", color: t.important ? "#fff" : MUTED, border: `1px solid ${t.important ? CARE : LINE}` }}
          >
            IMPORTANT
          </button>
        </>
      )}
      {compact && (
        <>
          <button onClick={() => onUpdate(t.id, { urgent: !t.urgent })} title="Basculer urgent" className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: t.urgent ? RED : RED + "15", color: RED }}>
            <Clock3 size={10} />
          </button>
          <button onClick={() => onUpdate(t.id, { important: !t.important })} title="Basculer important" className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: t.important ? CARE : CARE + "15", color: t.important ? "#fff" : CARE }}>
            <Star size={10} />
          </button>
        </>
      )}
      {allIntervenantCodes && allIntervenantCodes.length > 0 && (
        <button onClick={() => setShowDelegate((s) => !s)} title="Déléguer cette tâche" className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded" style={{ background: PURPLE + "15", color: PURPLE }}>
          <Send size={10} /> Déléguer
        </button>
      )}
      <button onClick={() => onRequestDelete(t.id)} className="shrink-0"><Trash2 size={compact ? 12 : 14} style={{ color: RED }} /></button>

      {showDelegate && (
        <div className="w-full flex items-center gap-2 pt-1.5 mt-1 border-t" style={{ borderColor: LINE }}>
          <select value={codeChoisi} onChange={(e) => setCodeChoisi(e.target.value)} className="text-xs border rounded-md px-2 py-1" style={{ borderColor: LINE }}>
            {allIntervenantCodes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => { onDelegate(t.id, codeChoisi); setShowDelegate(false); }}
            className="text-xs font-semibold px-2.5 py-1 rounded-md text-white"
            style={{ background: PURPLE }}
          >
            Confirmer la délégation
          </button>
          <button onClick={() => setShowDelegate(false)} className="text-xs muted">Annuler</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MON TEMPS — regroupe Tâches (matrice d'Eisenhower) et Temps de
   travail sous un seul onglet, pour alléger la barre de navigation.
   ============================================================ */
function MonTempsTab({ session, taches, onAddTache, onUpdateTache, onRequestDeleteTache, showTempsTravail, tempsTravail, projects, accounts, events, onAddTemps, onRequestDeleteTemps, allIntervenantCodes, onDelegateTache }) {
  const [sub, setSub] = useState("taches"); // "taches" | "travail"
  return (
    <div className="space-y-4">
      {showTempsTravail && (
        <div className="flex rounded-md border overflow-hidden w-fit" style={{ borderColor: LINE }}>
          <button
            onClick={() => setSub("taches")}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2"
            style={{ background: sub === "taches" ? CARE : "transparent", color: sub === "taches" ? "#fff" : INK }}
          >
            <ListChecks size={14} /> Tâches à faire
          </button>
          <button
            onClick={() => setSub("travail")}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2"
            style={{ background: sub === "travail" ? CARE : "transparent", color: sub === "travail" ? "#fff" : INK }}
          >
            <PieChartIcon size={14} /> Temps de travail
          </button>
        </div>
      )}
      {sub === "taches" || !showTempsTravail ? (
        <TachesTab session={session} taches={taches} onAdd={onAddTache} onUpdate={onUpdateTache} onRequestDelete={onRequestDeleteTache} allIntervenantCodes={allIntervenantCodes} onDelegate={onDelegateTache} />
      ) : (
        <TempsTravailTab
          session={session} tempsTravail={tempsTravail} projects={projects}
          events={events} onAdd={onAddTemps} onRequestDelete={onRequestDeleteTemps}
        />
      )}
    </div>
  );
}

function TachesTab({ session, taches, onAdd, onUpdate, onRequestDelete, allIntervenantCodes, onDelegate }) {
  const mine = useMemo(() => taches.filter((t) => t.proprietaire === session.accountId), [taches, session.accountId]);
  const [viewMode, setViewMode] = useState("matrice"); // "liste" | "matrice"
  const [newTexte, setNewTexte] = useState("");
  const [showDone, setShowDone] = useState(false);

  const displayed = showDone ? mine : mine.filter((t) => !t.fait);
  const doneCount = mine.filter((t) => t.fait).length;

  const submit = () => {
    if (!newTexte.trim()) return;
    onAdd(newTexte);
    setNewTexte("");
  };
  const handleEnter = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
          <button
            onClick={() => setViewMode("liste")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            style={{ background: viewMode === "liste" ? CARE : "transparent", color: viewMode === "liste" ? "#fff" : INK }}
          >
            <LayoutList size={13} /> Liste
          </button>
          <button
            onClick={() => setViewMode("matrice")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            style={{ background: viewMode === "matrice" ? CARE : "transparent", color: viewMode === "matrice" ? "#fff" : INK }}
          >
            <LayoutGrid size={13} /> Matrice d'Eisenhower
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-xs ml-auto shrink-0">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Afficher les tâches terminées ({doneCount})
        </label>
      </div>

      <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newTexte} onChange={(e) => setNewTexte(e.target.value)} onKeyDown={handleEnter}
            placeholder="Ajouter une tâche… (ex : relancer le CCAS pour la session 8)"
            className="flex-1 min-w-[220px] text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }}
          />
          <button onClick={submit} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md shrink-0" style={{ background: CARE }}>
            <Plus size={15} /> Ajouter
          </button>
          <select
            value=""
            onChange={(e) => { if (e.target.value) onAdd(e.target.value); }}
            className="text-sm border rounded-md px-2.5 py-2 shrink-0" style={{ borderColor: LINE, color: MUTED }}
          >
            <option value="">Suggestions rapides…</option>
            {TACHE_SUGGESTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <p className="text-[11px] muted mt-2">
          Classe chaque tâche en <span style={{ color: RED }}>urgente</span> et/ou <span style={{ color: CARE }}>importante</span> pour la voir apparaître dans le bon quadrant de la matrice. Choisir une suggestion l'ajoute directement à la liste.
        </p>
      </div>

      {viewMode === "liste" ? (
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <SectionLabel>Mes tâches ({displayed.length})</SectionLabel>
          {displayed.length === 0 ? (
            <p className="text-sm muted">Aucune tâche pour l'instant.</p>
          ) : (
            <div className="space-y-1">
              {displayed.map((t) => (
                <TacheRow key={t.id} t={t} onUpdate={onUpdate} onRequestDelete={onRequestDelete} allIntervenantCodes={allIntervenantCodes} onDelegate={onDelegate} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {EISENHOWER_QUADRANTS.map((q) => {
            const items = displayed.filter((t) => t.urgent === q.urgent && t.important === q.important);
            return (
              <div key={q.key} className="rounded-lg border overflow-hidden" style={{ borderColor: q.color + "55" }}>
                <div className="px-4 py-2.5" style={{ background: q.color + "15" }}>
                  <div className="text-sm font-semibold" style={{ color: q.color }}>{q.label}</div>
                  <div className="text-[11px] muted">{q.sub} · {items.length}</div>
                </div>
                <div className="p-2 space-y-1.5 min-h-[110px] max-h-[50vh] overflow-y-auto" style={{ background: PAPER_DARK }}>
                  {items.length === 0 ? (
                    <p className="text-xs muted text-center py-6">Aucune tâche</p>
                  ) : (
                    items.map((t) => (
                      <TacheRow key={t.id} t={t} compact onUpdate={onUpdate} onRequestDelete={onRequestDelete} allIntervenantCodes={allIntervenantCodes} onDelegate={onDelegate} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GESTION HUMAINE — réservé au·à la chef·fe d'équipe
   ------------------------------------------------------------
   Vue collective distincte de « Mon temps » (qui reste personnel
   pour tout le monde) : agrège le temps de travail de toute
   l'équipe, l'agenda de tou·tes les intervenant·es, les alertes
   actives et les absences déclarées.
   ============================================================ */
/* ============================================================
   SAUVEGARDER LES DONNÉES — Chef·fe d'équipe uniquement
   ------------------------------------------------------------
   Export complet et daté de toutes les données de l'application,
   dans un format structuré (JSON) pensé pour pouvoir être
   réimporté en cas de besoin (perte de données, changement de
   compte…). Les mots de passe sont retirés par sécurité.
   ============================================================ */
function SauvegardeTab({ events, projects, intervenants, accounts, tempsTravail, taches, financeEntries, financeObjectifs, onRestore }) {
  const [copyState, setCopyState] = useState("");
  const [showText, setShowText] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState("");
  const [pendingImport, setPendingImport] = useState(null); // { data, fileName, summary }
  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileInputRef = useRef(null);

  const fileName = `sauvegarde-ipl-coordination-${today}.json`;

  const backupPayload = useMemo(() => ({
    _meta: {
      application: "Application d'organisation et de pilotage de projet — Institut Pasteur de Lille",
      dateExport: new Date().toISOString(),
      dateExportLisible: fmtDate(today),
      version: 1,
    },
    events, projects, intervenants,
    accounts: accounts.map((a) => ({ ...a, password: "••• retiré de la sauvegarde pour la sécurité •••" })),
    tempsTravail, taches, financeEntries, financeObjectifs,
  }), [events, projects, intervenants, accounts, tempsTravail, taches, financeEntries, financeObjectifs]);

  const backupText = useMemo(() => JSON.stringify(backupPayload, null, 2), [backupPayload]);

  const doExport = () => {
    const ta = document.createElement("textarea");
    ta.value = backupText;
    ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    setCopyState(ok ? "ok" : "manual");
    if (!ok) setShowText(true);
    setTimeout(() => setCopyState(""), 3500);
  };

  const readBackupFile = (file) => {
    setImportError("");
    if (!file) return;
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setImportError("Ce fichier ne semble pas être une sauvegarde valide (extension .json attendue).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      let data;
      try {
        data = JSON.parse(ev.target.result);
      } catch (err) {
        setImportError("Le fichier n'a pas pu être lu — ce n'est pas un JSON valide.");
        return;
      }
      if (!data || typeof data !== "object" || (!data._meta && !data.events && !data.projects)) {
        setImportError("Ce fichier ne ressemble pas à une sauvegarde générée par cette application.");
        return;
      }
      const summary = {
        dateExportLisible: data._meta?.dateExportLisible || "date inconnue",
        events: Array.isArray(data.events) ? data.events.length : 0,
        projects: Array.isArray(data.projects) ? data.projects.length : 0,
        intervenants: Array.isArray(data.intervenants) ? data.intervenants.length : 0,
        tempsTravail: Array.isArray(data.tempsTravail) ? data.tempsTravail.length : 0,
        taches: Array.isArray(data.taches) ? data.taches.length : 0,
        financeEntries: Array.isArray(data.financeEntries) ? data.financeEntries.length : 0,
      };
      setPendingImport({ data, fileName: file.name, summary });
    };
    reader.onerror = () => setImportError("Impossible de lire ce fichier.");
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    readBackupFile(file);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
        <div className="flex items-center gap-2 mb-2">
          <Save size={16} style={{ color: RED }} />
          <span className="text-sm font-bold" style={{ color: RED }}>Sauvegarder les données</span>
        </div>
        <p className="text-sm" style={{ color: "#7A2A20" }}>
          Génère une copie complète et datée de toutes les données de l'application (planning, projets, intervenant·es, comptes, temps de travail, tâches, suivi financier) — à conserver en lieu sûr pour pouvoir la réimporter en cas de besoin.
        </p>
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Contenu de la sauvegarde — {fmtDate(today)}</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Évènements" value={events.length} />
          <StatCard label="Projets" value={projects.length} />
          <StatCard label="Intervenant·es" value={intervenants.length} />
          <StatCard label="Comptes" value={accounts.length} />
          <StatCard label="Temps déclarés" value={tempsTravail.length} />
          <StatCard label="Tâches" value={taches.length} />
          <StatCard label="Lignes financières" value={financeEntries.length} />
        </div>
        <button onClick={doExport} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2.5 rounded-md" style={{ background: RED }}>
          <Save size={15} /> {copyState === "ok" ? "Copié !" : "Générer et copier la sauvegarde"}
        </button>
        <p className="text-[11px] muted mt-2">
          Nom de fichier suggéré : <span className="mono">{fileName}</span> — colle le contenu copié dans un fichier texte portant ce nom pour le conserver.
        </p>
      </div>

      {copyState === "manual" && (
        <div className="rounded-md border p-3 text-xs" style={{ borderColor: AMBER + "55", background: AMBER + "0d", color: "#8A5620" }}>
          La copie automatique n'a pas fonctionné dans ce navigateur. Le contenu est affiché juste en dessous : clique dedans, sélectionne tout (Ctrl/Cmd+A) puis copie (Ctrl/Cmd+C).
        </div>
      )}

      <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Aperçu des données (format JSON)</SectionLabel>
          <button onClick={() => setShowText((s) => !s)} className="text-xs font-medium" style={{ color: CARE_DARK }}>
            {showText ? "Masquer" : "Afficher"}
          </button>
        </div>
        {showText && (
          <textarea readOnly value={backupText} onClick={(e) => e.target.select()} rows={12} className="w-full text-xs font-mono border rounded-md p-2" style={{ borderColor: LINE }} />
        )}
      </div>

      <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen size={16} style={{ color: RED }} />
          <span className="text-sm font-bold" style={{ color: RED }}>Réimporter une sauvegarde</span>
        </div>
        <p className="text-sm mb-4" style={{ color: "#7A2A20" }}>
          Dépose ici un fichier de sauvegarde généré précédemment pour restaurer les données. Les comptes et mots de passe ne sont jamais modifiés par une restauration.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition"
          style={{ borderColor: dragOver ? RED : RED + "55", background: dragOver ? RED + "14" : "#fff" }}
        >
          <FolderOpen size={28} style={{ color: RED }} />
          <p className="text-sm font-semibold" style={{ color: RED }}>
            {dragOver ? "Dépose le fichier ici…" : "Glisse-dépose ton fichier de sauvegarde ici"}
          </p>
          <p className="text-xs muted">ou clique pour choisir un fichier .json</p>
          <input
            ref={fileInputRef} type="file" accept=".json,application/json" className="hidden"
            onChange={(e) => readBackupFile(e.target.files?.[0])}
          />
        </div>

        {importError && (
          <div className="flex items-center gap-1.5 text-xs mt-3" style={{ color: RED }}>
            <AlertCircle size={13} /> {importError}
          </div>
        )}
      </div>

      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: LINE }}>
              <AlertTriangle size={18} style={{ color: RED }} />
              <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Confirmer la restauration</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm">
                Fichier <span className="font-semibold">{pendingImport.fileName}</span>, sauvegarde du <span className="font-semibold">{pendingImport.summary.dateExportLisible}</span>.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>• {pendingImport.summary.events} évènements</div>
                <div>• {pendingImport.summary.projects} projets</div>
                <div>• {pendingImport.summary.intervenants} intervenant·es</div>
                <div>• {pendingImport.summary.tempsTravail} temps déclarés</div>
                <div>• {pendingImport.summary.taches} tâches</div>
                <div>• {pendingImport.summary.financeEntries} lignes financières</div>
              </div>
              <div className="rounded-md p-3 text-xs" style={{ background: RED + "0f", color: "#7A2A20" }}>
                ⚠️ Ceci va <span className="font-semibold">remplacer toutes les données actuelles</span> de l'application par celles de cette sauvegarde. Cette action est irréversible (sauf à réimporter une sauvegarde plus récente). Les comptes et mots de passe de l'équipe ne seront pas modifiés.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: LINE }}>
              <button onClick={() => setPendingImport(null)} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
              <button
                onClick={() => setConfirmRestore(true)}
                className="text-sm font-semibold text-white px-4 py-2 rounded-md" style={{ background: RED }}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRestore && (
        <ConfirmDialog
          message={`Restaurer définitivement les données depuis « ${pendingImport?.fileName} » ? Toutes les données actuelles seront remplacées.`}
          confirmLabel="Restaurer"
          onCancel={() => setConfirmRestore(false)}
          onConfirm={() => {
            onRestore(pendingImport.data);
            setConfirmRestore(false);
            setPendingImport(null);
          }}
        />
      )}
    </div>
  );
}

function GestionHumaineTab({ events, intervenants, accounts, tempsTravail, allIntervenantCodes }) {
  // Par défaut sur « Tout » : contrairement à « Mon temps » (suivi mois par
  // mois), cette vue collective sert avant tout à voir d'un coup d'œil
  // l'ensemble de l'activité de l'équipe ; filtrer sur le mois en cours
  // masquait la quasi-totalité des actions déjà planifiées.
  const [period, setPeriod] = useState("all"); // "month" | "year" | "all"
  // Le·la chef·fe d'équipe choisit le mois ou l'année précis à consulter
  // (pas seulement « ce mois-ci ») — utile pour revoir un mois passé ou
  // préparer le bilan d'une année antérieure.
  const [refMonth, setRefMonth] = useState(today.slice(0, 7));
  const [refYear, setRefYear] = useState(Number(today.slice(0, 4)));
  const periodLabel = period === "month"
    ? `en ${new Date(refMonth + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
    : period === "year" ? `en ${refYear}` : "sur toute la période";

  const alertedEvents = useMemo(() => events.filter((e) => e.alerte), [events]);

  const team = useMemo(() => computeTeamTT(tempsTravail, accounts, events, period, refMonth, refYear), [tempsTravail, accounts, events, period, refMonth, refYear]);

  const barData = useMemo(() => team.byPerson.map((p) => {
    const row = { nom: p.nom };
    TEMPS_TRAVAIL_CATEGORIES.forEach((c) => { row[c.id] = Math.round((p.summary.byCat[c.id] || 0) * 100) / 100; });
    return row;
  }), [team.byPerson]);

  // Agenda global : heures et nombre d'actions par intervenant·e sur la
  // période (hors congés/absences), pour voir qui porte quoi sur le terrain.
  const agendaParPersonne = useMemo(() => {
    return allIntervenantCodes.map((code) => {
      const evs = events.filter((e) => e.intervenants.includes(code) && matchesPeriodTT(e, period, refMonth, refYear) && !TYPES_PERIODE.has(e.type));
      const hours = evs.reduce((s, e) => s + (getEventHours(e) || 0), 0);
      const meta = intervenants.find((i) => i.code === code);
      return { code, nom: meta?.nomComplet || code, hours: Math.round(hours * 100) / 100, count: evs.length };
    }).filter((p) => p.count > 0).sort((a, b) => b.hours - a.hours);
  }, [allIntervenantCodes, events, intervenants, period, refMonth, refYear]);
  const maxAgendaHours = Math.max(1, ...agendaParPersonne.map((p) => p.hours));

  // Absences déclarées (congés, RTT, JNT…) par intervenant·e, en jours.
  const absences = useMemo(() => {
    const map = {};
    events.filter((e) => TYPES_PERIODE.has(e.type)).forEach((e) => {
      e.intervenants.forEach((code) => {
        if (!map[code]) {
          const meta = intervenants.find((i) => i.code === code);
          map[code] = { code, nom: meta?.nomComplet || code, jours: 0 };
        }
        map[code].jours += daysCount(e);
      });
    });
    return Object.values(map).sort((a, b) => b.jours - a.jours);
  }, [events, intervenants]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2">
          <UserCog size={16} style={{ color: CARBON_BLACK }} />
          <span className="text-sm font-semibold">Vue collective de l'équipe</span>
        </div>
        <div className="flex rounded-md border overflow-hidden shrink-0 ml-auto" style={{ borderColor: LINE }}>
          <button onClick={() => setPeriod("month")} className="text-xs font-semibold px-3 py-1.5" style={{ background: period === "month" ? CARE : "transparent", color: period === "month" ? "#fff" : INK }}>Un mois</button>
          <button onClick={() => setPeriod("year")} className="text-xs font-semibold px-3 py-1.5" style={{ background: period === "year" ? CARE : "transparent", color: period === "year" ? "#fff" : INK }}>Une année</button>
          <button onClick={() => setPeriod("all")} className="text-xs font-semibold px-3 py-1.5" style={{ background: period === "all" ? CARE : "transparent", color: period === "all" ? "#fff" : INK }}>Tout</button>
        </div>
        {period === "month" && (
          <input
            type="month" value={refMonth} onChange={(e) => setRefMonth(e.target.value)}
            className="text-sm border rounded-md px-2.5 py-1.5 shrink-0" style={{ borderColor: LINE }}
          />
        )}
        {period === "year" && (
          <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
            {[refYear - 1, refYear, refYear + 1].map((y) => (
              <button
                key={y} onClick={() => setRefYear(y)}
                className="text-sm font-semibold px-3 py-1.5 mono"
                style={{ background: refYear === y ? INK : "transparent", color: refYear === y ? "#fff" : INK }}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {team.byPerson.length === 0 && (
        <div className="rounded-lg border p-4 flex items-start gap-2.5" style={{ borderColor: AMBER + "55", background: AMBER + "0d" }}>
          <AlertCircle size={16} style={{ color: AMBER }} className="shrink-0 mt-0.5" />
          <div className="text-xs" style={{ color: "#8A5620" }}>
            <span className="font-semibold">Ces 4 chiffres sont à 0 car personne n'a encore relié son compte.</span> Cette section (chefferie vs terrain) ne concerne que les chef·fes de projet et le·la chef·fe d'équipe : chacun·e doit ouvrir <span className="font-semibold">« Mon compte »</span> et choisir son code intervenant pour que son temps sur le terrain s'y ajoute automatiquement — ou déclarer manuellement du temps depuis <span className="font-semibold">« Mon temps → Temps de travail »</span>.
            <br />L'agenda de <span className="font-semibold">tou·tes les intervenant·es</span> (indépendant de ce réglage) reste visible juste en dessous, dans « Agenda de l'équipe ».
          </div>
        </div>
      )}

      {alertedEvents.length > 0 && (
        <div className="rounded-lg border p-5" style={{ borderColor: RED + "55", background: RED + "0a" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: RED }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.15em]" style={{ color: RED }}>
              Alertes de l'équipe ({alertedEvents.length})
            </span>
            <span className="flex-1 h-px" style={{ background: RED + "33" }} />
          </div>
          <ul className="space-y-2">
            {alertedEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-xs">
                <AlertTriangle size={13} style={{ color: RED }} className="shrink-0 mt-0.5" />
                <span className="flex-1"><span className="font-semibold">{e.alerte.auteur}</span> — {fmtDate(e.date)} : {e.alerte.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={`Heures équipe déclarées ${periodLabel}`} value={`${team.teamSummary.total}h`} />
        <StatCard label="Part chefferie de projet" value={`${team.teamSummary.pctChefferie}%`} color={DARK_RASPBERRY} />
        <StatCard label="Part terrain / intervention" value={`${team.teamSummary.pctTerrain}%`} color={FRESH_GREEN} />
        <StatCard label="Personnes ayant déclaré" value={team.byPerson.length} />
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Répartition du temps de l'équipe par nature</SectionLabel>
        <TTPieChart byCat={team.teamSummary.byCat} total={team.teamSummary.total} />
      </div>

      {team.byPerson.length > 0 && (
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
          <SectionLabel>Répartition par personne (chef·fes de projet / chef·fe d'équipe)</SectionLabel>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nom" tick={{ fontSize: 11, fill: INK }} axisLine={{ stroke: LINE }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: INK }} axisLine={{ stroke: LINE }} tickLine={false} allowDecimals />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: LINE }} formatter={(v) => [`${v} h`]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {TEMPS_TRAVAIL_CATEGORIES.map((c) => (
                  <Bar key={c.id} dataKey={c.id} name={c.label} stackId="a" fill={c.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1.5">
            {team.byPerson.map((p) => (
              <div key={p.nom} className="flex items-center justify-between text-xs py-1.5 border-t" style={{ borderColor: LINE }}>
                <span className="font-medium">{p.nom} <span className="muted font-normal">· {p.role}</span></span>
                <span className="mono">{p.summary.total}h · chefferie {p.summary.pctChefferie}% · terrain {p.summary.pctTerrain}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Agenda de l'équipe — tou·tes les intervenant·es ({periodLabel})</SectionLabel>
        {agendaParPersonne.length === 0 ? (
          <p className="text-sm muted">Aucune action planifiée sur cette période.</p>
        ) : (
          <div className="space-y-2">
            {agendaParPersonne.map((p) => (
              <div key={p.code} className="flex items-center gap-3">
                <IntervenantChip code={p.code} intervenants={intervenants} />
                <span className="text-xs flex-1 truncate">{p.nom}</span>
                <span className="text-xs mono muted shrink-0">{p.count} action{p.count > 1 ? "s" : ""}</span>
                <div className="w-40 h-2 rounded-full shrink-0" style={{ background: PAPER_DARK }}>
                  <div className="h-2 rounded-full" style={{ width: `${(p.hours / maxAgendaHours) * 100}%`, background: getIntervenantColor(p.code, intervenants) }} />
                </div>
                <span className="text-xs mono font-semibold w-14 text-right shrink-0">{p.hours}h</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Absences déclarées ({periodLabel === "sur toute la période" ? "toute la période" : periodLabel})</SectionLabel>
        {absences.length === 0 ? (
          <p className="text-sm muted">Aucune absence déclarée.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {absences.map((a) => (
              <div key={a.code} className="flex items-center gap-2 border rounded-md px-3 py-2" style={{ borderColor: LINE }}>
                <IntervenantChip code={a.code} intervenants={intervenants} />
                <span className="text-xs flex-1 truncate">{a.nom}</span>
                <span className="text-xs mono font-semibold shrink-0">{a.jours} j.</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MODALE — AJOUTER UNE LIGNE AU SUIVI FINANCIER
   ============================================================ */
/* ============================================================
   MODALE — CHOISIR MES PROJETS FINANCIERS (Chef·fe de projet)
   ------------------------------------------------------------
   Filtre d'affichage personnel sur le Suivi financier — n'affecte
   jamais les données réelles ni ce que voient les autres rôles.
   ============================================================ */
function FinanceEntryPickerModal({ entries, selected, onSave, onClose }) {
  const [sel, setSel] = useState(new Set(selected || []));
  const [search, setSearch] = useState("");
  const byCat = useMemo(() => {
    const m = {};
    entries.forEach((e) => { (m[e.categorie] = m[e.categorie] || []).push(e); });
    return m;
  }, [entries]);
  const toggle = (id) => setSel((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const matches = (e) => !search.trim() || e.client.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Choisir mes projets financiers</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: LINE }}>
          <p className="text-xs muted mb-2">Coche les lignes que tu veux suivre. Ceci ne change que ton propre affichage — les montants restent partagés avec toute l'équipe.</p>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client / projet…"
            className="w-full text-sm border rounded-md px-3 py-2" style={{ borderColor: LINE }}
          />
          <div className="flex items-center gap-3 mt-2 text-xs">
            <button type="button" onClick={() => setSel(new Set(entries.map((e) => e.id)))} className="font-medium" style={{ color: CARE_DARK }}>Tout cocher</button>
            <button type="button" onClick={() => setSel(new Set())} className="font-medium" style={{ color: MUTED }}>Tout décocher</button>
            <span className="ml-auto muted">{sel.size} sélectionné{sel.size > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {FINANCE_CATEGORIES.filter((c) => byCat[c.id]).map((c) => {
            const list = (byCat[c.id] || []).filter(matches);
            if (list.length === 0) return null;
            return (
              <div key={c.id}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: c.color }}>{c.label}</div>
                <div className="space-y-0.5">
                  {list.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm py-1.5 px-1.5 rounded hover:bg-[#FAFBFC] cursor-pointer">
                      <input type="checkbox" checked={sel.has(e.id)} onChange={() => toggle(e.id)} />
                      <span className="flex-1 min-w-0 truncate">{e.client}{e.type ? ` — ${e.type}` : ""}{e.financeur ? ` · ${e.financeur}` : ""}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0" style={{ borderColor: LINE }}>
          <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button type="button" onClick={() => onSave(Array.from(sel))} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function FinanceEntryModal({ onSave, onClose }) {
  const [categorie, setCategorie] = useState(FINANCE_CATEGORIES[0].id);
  const [client, setClient] = useState("");
  const [financeur, setFinanceur] = useState("");
  const [type, setType] = useState("");
  const [typeExpertise, setTypeExpertise] = useState("");
  const [annee, setAnnee] = useState("2026");
  const [base, setBase] = useState("");
  const [prev, setPrev] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!client.trim()) { setError("Indique un nom de client ou de projet."); return; }
    setError("");
    onSave({
      categorie, client: client.trim(),
      financeur: financeur.trim() || undefined, type: type.trim() || undefined,
      typeExpertise: categorie === "expertise" ? (typeExpertise || undefined) : undefined,
      annee: annee.trim() || undefined,
      base: base !== "" ? Number(base) : undefined, prev: prev !== "" ? Number(prev) : undefined,
    });
  };
  const handleEnter = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Ajouter une ligne au suivi financier</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="text-xs font-medium block mb-1">Catégorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}>
              {FINANCE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          {categorie === "expertise" && (
            <div>
              <label className="text-xs font-medium block mb-1">Type d'expertise</label>
              <select value={typeExpertise} onChange={(e) => setTypeExpertise(e.target.value)} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}>
                <option value="">— À préciser —</option>
                {TYPES_EXPERTISE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium block mb-1">Client / Projet</label>
            <input value={client} onChange={(e) => setClient(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} placeholder="ex : Ville de Lille" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Financeur (optionnel)</label>
            <input value={financeur} onChange={(e) => setFinanceur(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} placeholder="ex : ARS DPPS" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Type de projet / description</label>
            <input value={type} onChange={(e) => setType(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} placeholder="ex : Conférences" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Année</label>
              <input value={annee} onChange={(e) => setAnnee(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Base (€)</label>
              <input type="number" value={base} onChange={(e) => setBase(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Prévisionnel (€)</label>
              <input type="number" value={prev} onChange={(e) => setPrev(e.target.value)} onKeyDown={handleEnter} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
          <p className="text-[11px] muted">Les montants mensuels (janv. à déc.) se déclarent ensuite directement dans le tableau, mois par mois.</p>
          {error && <div className="flex items-center gap-1.5 text-xs" style={{ color: RED }}><AlertCircle size={13} /> {error}</div>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0" style={{ borderColor: LINE }}>
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button onClick={submit} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Save size={15} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUIVI FINANCIER — déclaration, suivi, évaluation, dashboard
   ============================================================ */
function FinanceEntryRow({ e, onUpdate, onRequestDelete }) {
  const [editingMonth, setEditingMonth] = useState(null);
  const realise = financeRealise(e);
  const ecart = financeEcart(e);
  const atterrissage = financeAtterrissage(e);
  return (
    <div className="border-t" style={{ borderColor: LINE }}>
      <div className="flex items-center gap-2 px-2 py-2 text-xs">
        <div className="w-48 shrink-0">
          <div className="font-semibold truncate flex items-center gap-1">
            {e.client}
            {e.alerteFacturation && (
              <span title={`${e.alerteFacturation.message} (signalé par ${e.alerteFacturation.auteur} le ${fmtDate(e.alerteFacturation.date)})`}>
                <AlertTriangle size={11} style={{ color: RED }} className="shrink-0" />
              </span>
            )}
          </div>
          {e.type && <div className="muted truncate">{e.type}</div>}
          {e.typeExpertise && (
            <div className="mt-0.5">
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: CARE + "1a", color: CARE_DARK }}>{e.typeExpertise}</span>
            </div>
          )}
          {e.financeur && <div className="muted truncate">{e.financeur}</div>}
        </div>
        <div className="w-20 shrink-0 text-right mono">{e.base != null ? `${e.base}€` : "—"}</div>
        <div className="w-20 shrink-0 text-right mono">{e.prev != null ? `${e.prev}€` : "—"}</div>
        {FINANCE_MONTHS.map((m) => (
          <div key={m.key} className="w-16 shrink-0 text-center">
            {editingMonth === m.key ? (
              <input
                type="number" autoFocus defaultValue={e[m.key] ?? ""}
                onBlur={(ev) => { onUpdate(e.id, { [m.key]: ev.target.value === "" ? undefined : Number(ev.target.value) }); setEditingMonth(null); }}
                onKeyDown={(ev) => { if (ev.key === "Enter") ev.target.blur(); if (ev.key === "Escape") setEditingMonth(null); }}
                className="w-14 text-xs border rounded px-1 py-1 text-center" style={{ borderColor: CARE }}
              />
            ) : (
              <button onClick={() => setEditingMonth(m.key)} className="w-14 h-6 rounded text-xs hover:bg-[#F2F4F6]" style={{ color: e[m.key] != null ? INK : "#C4CBD1" }}>
                {e[m.key] != null ? e[m.key] : "—"}
              </button>
            )}
          </div>
        ))}
        <div className="w-20 shrink-0 text-right mono font-semibold">{realise}€</div>
        <div className="w-20 shrink-0 text-right mono" style={{ color: ecart > 0 ? AMBER : ecart < 0 ? GREEN : MUTED }}>
          {ecart > 0 ? `${ecart}€` : ecart < 0 ? `+${-ecart}€` : "0€"}
        </div>
        <div className="w-20 shrink-0 text-right mono font-semibold" style={{ color: CARE_DARK }} title="Atterrissage prévisionnel : réalisé + reste à réaliser">
          {atterrissage}€
        </div>
        <button onClick={() => onRequestDelete(e.id)} className="shrink-0 ml-1"><Trash2 size={13} style={{ color: RED }} /></button>
      </div>
    </div>
  );
}

function FinanceTab({ session, entries: allEntries, objectifs, onAdd, onUpdate, onRequestDelete, onUpdateObjectifs, projects, currentAccount, onUpdateFinanceSelection }) {
  const [view, setView] = useState("suivi"); // "suivi" | "dashboard"
  const [filterCat, setFilterCat] = useState("all");
  const [filterExpertiseType, setFilterExpertiseType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFinancePicker, setShowFinancePicker] = useState(false);
  const [copyState, setCopyState] = useState("");
  const [showExportText, setShowExportText] = useState(false);
  const [objDraft, setObjDraft] = useState(objectifs);

  // Filtre personnel « mes projets financiers », réservé au·à la chef·fe
  // de projet — n'affecte jamais ce que voient le secrétariat ou le·la
  // chef·fe d'équipe, ni les montants/totaux réellement enregistrés.
  // Chef·fe de projet ET chef·fe d'équipe peuvent filtrer leur propre vue —
  // exactement comme pour « Choisir mes projets » côté planning.
  const canFilterFinance = session.role === "chef_projet" || session.role === "chef_equipe";
  const financeSel = currentAccount?.financeSelectionnes;
  const hasFinanceSel = canFilterFinance && Array.isArray(financeSel);
  const myFinanceEntries = useMemo(
    () => (hasFinanceSel ? allEntries.filter((e) => financeSel.includes(e.id)) : allEntries),
    [allEntries, hasFinanceSel, financeSel]
  );
  const [showAllFinance, setShowAllFinance] = useState(!hasFinanceSel || myFinanceEntries.length === 0);
  const scopedByPerson = canFilterFinance && !showAllFinance ? myFinanceEntries : allEntries;

  // Sélecteur d'année pour le reporting — N-1 / N (année en cours) / N+1,
  // utile pour préparer le reporting de l'année à venir ou revoir le bilan
  // de l'année précédente. Par défaut sur l'année en cours.
  const currentYear = Number(today.slice(0, 4));
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const entries = useMemo(
    () => scopedByPerson.filter((e) => financeEntryMatchesYear(e, selectedYear)),
    [scopedByPerson, selectedYear]
  );

  const byCat = useMemo(() => {
    const m = {};
    FINANCE_CATEGORIES.forEach((c) => { m[c.id] = []; });
    entries.forEach((e) => { (m[e.categorie] = m[e.categorie] || []).push(e); });
    return m;
  }, [entries]);

  const totals = useMemo(() => {
    const t = { base: 0, prev: 0, realise: 0, facture: 0, encaissement: 0, atterrissage: 0 };
    entries.forEach((e) => {
      t.base += financeNum(e.base); t.prev += financeNum(e.prev);
      t.realise += financeRealise(e); t.facture += financeNum(e.facture); t.encaissement += financeNum(e.encaissement);
      t.atterrissage += financeAtterrissage(e);
    });
    Object.keys(t).forEach((k) => { t[k] = Math.round(t[k] * 100) / 100; });
    return t;
  }, [entries]);

  const byCategorieTotals = useMemo(() => FINANCE_CATEGORIES.map((c) => {
    const list = byCat[c.id] || [];
    return {
      ...c, count: list.length,
      realise: Math.round(list.reduce((s, e) => s + financeRealise(e), 0) * 100) / 100,
      prev: Math.round(list.reduce((s, e) => s + financeNum(e.prev), 0) * 100) / 100,
    };
  }), [byCat]);

  const monthlyTotals = useMemo(() => FINANCE_MONTHS.map((m) => {
    const row = { mois: m.label };
    FINANCE_CATEGORIES.forEach((c) => {
      row[c.id] = Math.round((byCat[c.id] || []).reduce((s, e) => s + financeNum(e[m.key]), 0) * 100) / 100;
    });
    return row;
  }), [byCat]);

  // Chaque objectif se compare à son propre périmètre : CEPS = tout confondu,
  // Éducation santé = les projets subventionnés, Expertise = les expertises
  // seules — comparer un objectif « Expertise » au réalisé global donnait
  // des pourcentages absurdes (300%+).
  const realiseFor = (key) => {
    if (key === "expertise") return byCategorieTotals.find((c) => c.id === "expertise")?.realise || 0;
    if (key === "educ") return byCategorieTotals.find((c) => c.id === "subvention")?.realise || 0;
    return totals.realise;
  };
  const pctObjectif = (key, obj) => (obj > 0 ? Math.round((realiseFor(key) / obj) * 1000) / 10 : 0);

  const doExport = () => {
    const header = ["Catégorie", "Thème", "Client", "Financeur", "Type", "Année", "Base", "N-1", "Prévisionnel",
      ...FINANCE_MONTHS.map((m) => m.label), "Réalisé", "Écart", "Facturé", "Réf. facture", "Encaissement", "Solde"];
    const rows = entries.map((e) => [
      financeCategorieMeta(e.categorie).label, e.theme || "", e.client || "", e.financeur || "", e.type || "", e.annee || "",
      e.base ?? "", e.n1 ?? "", e.prev ?? "",
      ...FINANCE_MONTHS.map((m) => e[m.key] ?? ""),
      financeRealise(e), financeEcart(e), e.facture ?? "", e.refFacture ?? "", e.encaissement ?? "", e.solde ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => {
      const s = String(v).replace(/"/g, '""');
      return /[",;\n]/.test(s) ? `"${s}"` : s;
    }).join(";")).join("\n");

    const ta = document.createElement("textarea");
    ta.value = csv;
    ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    setCopyState(ok ? "ok" : "manual");
    if (!ok) setShowExportText(true);
    setTimeout(() => setCopyState(""), 3500);
  };
  const exportCsvText = useMemo(() => {
    const header = ["Catégorie", "Client", "Financeur", "Type", "Base", "Prévisionnel", ...FINANCE_MONTHS.map((m) => m.label), "Réalisé", "Écart"];
    const rows = entries.map((e) => [
      financeCategorieMeta(e.categorie).label, e.client || "", e.financeur || "", e.type || "",
      e.base ?? "", e.prev ?? "", ...FINANCE_MONTHS.map((m) => e[m.key] ?? ""), financeRealise(e), financeEcart(e),
    ]);
    return [header, ...rows].map((r) => r.join(";")).join("\n");
  }, [entries]);

  const filteredCats = filterCat === "all" ? FINANCE_CATEGORIES : FINANCE_CATEGORIES.filter((c) => c.id === filterCat);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
          <button onClick={() => setView("suivi")} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2" style={{ background: view === "suivi" ? CARE : "transparent", color: view === "suivi" ? "#fff" : INK }}>
            <Table2 size={14} /> Déclaration &amp; suivi
          </button>
          <button onClick={() => setView("dashboard")} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2" style={{ background: view === "dashboard" ? CARE : "transparent", color: view === "dashboard" ? "#fff" : INK }}>
            <PieChartIcon size={14} /> Dashboard
          </button>
        </div>
        <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <button
              key={y} onClick={() => setSelectedYear(y)}
              title={y === currentYear - 1 ? "Année N-1" : y === currentYear + 1 ? "Année N+1 (reporting anticipé)" : "Année en cours"}
              className="text-sm font-semibold px-3.5 py-2 mono"
              style={{ background: selectedYear === y ? INK : "transparent", color: selectedYear === y ? "#fff" : INK }}
            >
              {y}
            </button>
          ))}
        </div>
        {canFilterFinance && (
          <button
            onClick={() => setShowAllFinance((s) => !s)}
            className="text-xs font-medium px-3 py-1.5 rounded-md border shrink-0"
            style={{ borderColor: CARE, color: CARE_DARK }}
          >
            {showAllFinance ? "Voir seulement mes projets" : "Voir tous les projets"}
          </button>
        )}
        {canFilterFinance && (
          <button
            onClick={() => setShowFinancePicker(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-md border shrink-0"
            style={{ borderColor: LINE, color: MUTED }}
          >
            Choisir mes projets financiers
          </button>
        )}
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md ml-auto shrink-0" style={{ background: AMBER }}>
          <Plus size={15} /> Ajouter une ligne
        </button>
        <button onClick={doExport} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md border shrink-0" style={{ borderColor: CARE, color: CARE_DARK }}>
          <ClipboardList size={15} /> {copyState === "ok" ? "Copié !" : "Exporter pour le contrôle de gestion"}
        </button>
      </div>

      {canFilterFinance && (
        <p className="text-[11px] muted px-1 -mt-2">
          {canFilterFinance && !showAllFinance
            ? `Vue filtrée sur ${myFinanceEntries.length} projet${myFinanceEntries.length > 1 ? "s" : ""} financier${myFinanceEntries.length > 1 ? "s" : ""} — ce filtre n'est visible que par toi, les montants et les totaux restent partagés avec toute l'équipe.`
            : "Filtre personnel : ce que tu choisis de voir ici ne change rien à ce que voient le secrétariat et le·la chef·fe d'équipe."}
        </p>
      )}

      {showFinancePicker && (
        <FinanceEntryPickerModal
          entries={allEntries}
          selected={hasFinanceSel ? financeSel : myFinanceEntries.map((e) => e.id)}
          onClose={() => setShowFinancePicker(false)}
          onSave={(ids) => { onUpdateFinanceSelection(ids); setShowAllFinance(false); setShowFinancePicker(false); }}
        />
      )}

      <div className="rounded-lg border p-4 flex items-start gap-2.5" style={{ borderColor: AMBER + "55", background: AMBER + "0d" }}>
        <AlertCircle size={16} style={{ color: AMBER }} className="shrink-0 mt-0.5" />
        <div className="text-xs" style={{ color: "#8A5620" }}>
          <span className="font-semibold">Données importées depuis « TABLEAU_DES_ENCOURS_2026.xlsx » — à vérifier avant transmission au contrôle de gestion.</span>{" "}
          Pour « Projets subventionnés », le total recalculé ici (270&nbsp;785€ de réalisé) diffère du total affiché dans le fichier d'origine (262&nbsp;365€) : plusieurs lignes de financement combiné (un même projet avec plusieurs bailleurs, ex. Nutrissimo Santé/AG2R, IPL opérateur nutrition 2026…) semblent absentes du total calculé dans le fichier Excel source, alors que les montants existent bien ligne par ligne. J'ai choisi d'importer <span className="font-semibold">toutes les lignes visibles</span> plutôt que de risquer d'en oublier — merci de vérifier ces lignes-là avant diffusion officielle.
        </div>
      </div>

      {copyState === "manual" && (
        <div className="rounded-md border p-3 text-xs" style={{ borderColor: AMBER + "55", background: AMBER + "0d", color: "#8A5620" }}>
          La copie automatique n'a pas fonctionné dans ce navigateur. Le tableau est affiché juste en dessous : clique dedans, sélectionne tout (Ctrl/Cmd+A) puis copie (Ctrl/Cmd+C), et colle-le dans Excel.
        </div>
      )}
      {showExportText && (
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Données à copier (format Excel, séparateur point-virgule)</SectionLabel>
            <button onClick={() => setShowExportText(false)}><X size={14} /></button>
          </div>
          <textarea readOnly value={exportCsvText} onClick={(e) => e.target.select()} rows={8} className="w-full text-xs font-mono border rounded-md p-2" style={{ borderColor: LINE }} />
        </div>
      )}

      {showAddModal && (
        <FinanceEntryModal onClose={() => setShowAddModal(false)} onSave={(payload) => { onAdd(payload); setShowAddModal(false); }} />
      )}

      {view === "suivi" ? (
        <>
          <div className="bg-white rounded-lg border p-3 flex flex-wrap gap-2 items-center" style={{ borderColor: LINE }}>
            <button onClick={() => setFilterCat("all")} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ background: filterCat === "all" ? INK : PAPER_DARK, color: filterCat === "all" ? "#fff" : INK }}>
              Toutes catégories
            </button>
            {FINANCE_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setFilterCat(c.id)} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ background: filterCat === c.id ? c.color : PAPER_DARK, color: filterCat === c.id ? "#fff" : INK }}>
                {c.label}
              </button>
            ))}
            {filterCat === "expertise" && (
              <select
                value={filterExpertiseType} onChange={(e) => setFilterExpertiseType(e.target.value)}
                className="text-xs border rounded-md px-2.5 py-1.5 ml-auto" style={{ borderColor: LINE }}
              >
                <option value="all">Tous types d'expertise</option>
                {TYPES_EXPERTISE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {filteredCats.map((c) => {
            const list0 = byCat[c.id] || [];
            const list = c.id === "expertise" && filterExpertiseType !== "all"
              ? list0.filter((e) => e.typeExpertise === filterExpertiseType)
              : list0;
            if (list.length === 0) return null;
            const catRealise = Math.round(list.reduce((s, e) => s + financeRealise(e), 0) * 100) / 100;
            const catPrev = Math.round(list.reduce((s, e) => s + financeNum(e.prev), 0) * 100) / 100;
            return (
              <div key={c.id} className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: c.color + "12" }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</span>
                  <span className="text-xs mono muted ml-auto">{list.length} ligne{list.length > 1 ? "s" : ""} · réalisé {catRealise}€ / prév. {catPrev}€</span>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    <div className="flex items-center gap-2 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide muted" style={{ background: PAPER_DARK }}>
                      <div className="w-48 shrink-0">Client / projet</div>
                      <div className="w-20 shrink-0 text-right">Base</div>
                      <div className="w-20 shrink-0 text-right">Prév.</div>
                      {FINANCE_MONTHS.map((m) => <div key={m.key} className="w-16 shrink-0 text-center">{m.label}</div>)}
                      <div className="w-20 shrink-0 text-right">Réalisé</div>
                      <div className="w-20 shrink-0 text-right">Écart</div>
                      <div className="w-20 shrink-0 text-right">Atterrissage</div>
                      <div className="w-4 shrink-0" />
                    </div>
                    {list.map((e) => <FinanceEntryRow key={e.id} e={e} onUpdate={onUpdate} onRequestDelete={onRequestDelete} />)}
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] muted px-1">Clique sur un montant mensuel pour le modifier — le réalisé et l'écart se recalculent automatiquement.</p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total réalisé" value={`${totals.realise}€`} />
            <StatCard label="Total prévisionnel" value={`${totals.prev}€`} />
            <StatCard label="Perspective (atterrissage)" value={`${totals.atterrissage}€`} color={CARE} />
            <StatCard label="Total facturé" value={`${totals.facture}€`} />
            <StatCard label="Total encaissé" value={`${totals.encaissement}€`} />
          </div>

          <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Objectifs 2026 — évaluation</SectionLabel>
              {(session.role === "chef_equipe" || session.role === "secretariat") && (
                <button
                  onClick={() => { onUpdateObjectifs(objDraft); }}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border" style={{ borderColor: CARE, color: CARE_DARK }}
                >Enregistrer les objectifs</button>
              )}
            </div>
            <div className="space-y-3">
              {[["ceps", "Objectif CEPS (global)"], ["educ", "Objectif Éducation santé (subventions)"], ["expertise", "Objectif Expertise"]].map(([key, label]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{label} <span className="muted font-normal">— réalisé {realiseFor(key)}€</span></span>
                    <span className="flex items-center gap-2">
                      <input
                        type="number" value={objDraft[key]} onChange={(ev) => setObjDraft({ ...objDraft, [key]: Number(ev.target.value) })}
                        className="w-24 text-xs border rounded px-1.5 py-1 text-right" style={{ borderColor: LINE }}
                      /> €
                      <span className="mono font-semibold" style={{ color: CARE_DARK }}>{pctObjectif(key, objDraft[key])}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: PAPER_DARK }}>
                    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(100, pctObjectif(key, objDraft[key]))}%`, background: CARE }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
            <SectionLabel>Budgets des projets opérationnels — alimenté en direct depuis « Dossiers projets »</SectionLabel>
            {(() => {
              const budgeted = (projects || []).filter((p) => p.budget != null);
              const totalBudget = Math.round(budgeted.reduce((s, p) => s + financeNum(p.budget), 0) * 100) / 100;
              const validatedBudget = Math.round(budgeted.filter((p) => p.statutFinancement === "valide").reduce((s, p) => s + financeNum(p.budget), 0) * 100) / 100;
              if (budgeted.length === 0) {
                return <p className="text-sm muted">Aucun budget de projet renseigné pour l'instant — les chef·fes de projet et le·la chef·fe d'équipe peuvent en saisir depuis l'onglet « Dossiers projets ».</p>;
              }
              return (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <StatCard label={`Budget total (${budgeted.length} projet${budgeted.length > 1 ? "s" : ""})`} value={`${totalBudget}€`} />
                    <StatCard label="Dont budget validé par un financeur" value={`${validatedBudget}€`} color={GREEN} />
                  </div>
                  <div className="space-y-1.5">
                    {budgeted.sort((a, b) => financeNum(b.budget) - financeNum(a.budget)).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-t" style={{ borderColor: LINE }}>
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{p.nom}</span>
                          {p.statutFinancement === "valide" && <Check size={12} style={{ color: GREEN }} className="shrink-0" />}
                        </span>
                        <span className="mono font-semibold shrink-0">{p.budget}€</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
            <SectionLabel>Répartition du réalisé par catégorie</SectionLabel>
            {totals.realise === 0 ? (
              <p className="text-sm muted text-center py-10">Aucun montant réalisé pour l'instant.</p>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4 items-center">
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byCategorieTotals.filter((c) => c.realise > 0)} dataKey="realise" nameKey="label" cx="50%" cy="50%" outerRadius={95} innerRadius={50} paddingAngle={2}>
                        {byCategorieTotals.filter((c) => c.realise > 0).map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: LINE }} formatter={(v) => [`${v}€`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {byCategorieTotals.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="flex-1">{c.label}</span>
                      <span className="mono">{c.realise}€</span>
                      <span className="mono font-semibold w-12 text-right" style={{ color: CARE_DARK }}>
                        {totals.realise > 0 ? Math.round((c.realise / totals.realise) * 1000) / 10 : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
            <SectionLabel>Réalisé mensuel — toutes catégories</SectionLabel>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyTotals} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: INK }} axisLine={{ stroke: LINE }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: INK }} axisLine={{ stroke: LINE }} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: LINE }} formatter={(v) => [`${v}€`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {FINANCE_CATEGORIES.map((c) => <Bar key={c.id} dataKey={c.id} name={c.label} stackId="a" fill={c.color} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   MODALE — AJOUTER UN TEMPS DE TRAVAIL
   ============================================================ */
function TempsTravailModal({ projects, onSave, onClose }) {
  const [categorieId, setCategorieId] = useState(TEMPS_TRAVAIL_CATEGORIES[0].id);
  const [duree, setDuree] = useState("");
  const [date, setDate] = useState(today);
  const [projetId, setProjetId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const n = Number(duree);
    if (!n || n <= 0) { setError("Indique une durée en heures (supérieure à 0)."); return; }
    setError("");
    onSave({ categorieId, duree: n, date, projetId: projetId || null, note });
  };
  const handleEnter = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: LINE }}>
          <h2 className="disp text-lg" style={{ fontWeight: 600 }}>Ajouter un temps de travail</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="text-xs font-medium block mb-1">Nature du temps</label>
            <select
              value={categorieId} onChange={(e) => setCategorieId(e.target.value)}
              className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
            >
              {TEMPS_TRAVAIL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Durée (heures)</label>
              <input
                type="number" step="0.5" min="0" value={duree} onChange={(e) => setDuree(e.target.value)} onKeyDown={handleEnter}
                placeholder="ex : 3.5" className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Projet lié (optionnel)</label>
            <select
              value={projetId} onChange={(e) => setProjetId(e.target.value)}
              className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
            >
              <option value="">Aucun projet en particulier</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Note (optionnel)</label>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="ex : préparation de la journée AP du 12/09"
              className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
            />
          </div>
          {error && <div className="flex items-center gap-1.5 text-xs" style={{ color: RED }}><AlertCircle size={13} /> {error}</div>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0" style={{ borderColor: LINE }}>
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
          <button onClick={submit} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEMPS DE TRAVAIL — pilotage individuel et collectif
   ============================================================ */
function matchesPeriodTT(t, period, refMonth, refYear) {
  if (period === "all") return true;
  if (period === "month") return t.date && t.date.startsWith(refMonth || today.slice(0, 7));
  if (period === "year") return t.date && t.date.startsWith(String(refYear || today.slice(0, 4)));
  return true;
}

function summarizeTT(entries) {
  const total = entries.reduce((s, t) => s + t.duree, 0);
  const byCat = {};
  TEMPS_TRAVAIL_CATEGORIES.forEach((c) => { byCat[c.id] = 0; });
  entries.forEach((t) => { byCat[t.categorieId] = (byCat[t.categorieId] || 0) + t.duree; });
  const chefferie = entries.filter((t) => TT_CHEFFERIE_IDS.has(t.categorieId)).reduce((s, t) => s + t.duree, 0);
  const terrain = entries.filter((t) => TT_TERRAIN_IDS.has(t.categorieId)).reduce((s, t) => s + t.duree, 0);
  return {
    total: Math.round(total * 100) / 100,
    byCat,
    pctChefferie: total > 0 ? Math.round((chefferie / total) * 100) : 0,
    pctTerrain: total > 0 ? Math.round((terrain / total) * 100) : 0,
  };
}

function TTPieChart({ byCat, total }) {
  const data = TEMPS_TRAVAIL_CATEGORIES
    .map((c) => ({ name: c.label, value: Math.round((byCat[c.id] || 0) * 100) / 100, color: c.color }))
    .filter((d) => d.value > 0);
  if (total === 0 || data.length === 0) {
    return <p className="text-sm muted text-center py-10">Aucun temps enregistré sur cette période.</p>;
  }
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={50} paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: LINE }} formatter={(v) => [`${v} h`]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Calcul consolidé de l'équipe (tou·tes les chef·fes de projet et le·la
// chef·fe d'équipe ayant relié un code intervenant) — réutilisé à la
// fois par « Gestion humaine » et pour le détail par personne.
function computeTeamTT(tempsTravail, accounts, events, period, refMonth, refYear) {
  const manual = tempsTravail.filter((t) => matchesPeriodTT(t, period, refMonth, refYear));
  // Relié au planning : chef·fes de projet, chef·fe d'équipe ET
  // intervenant·es dès lors qu'iels ont un code relié — leurs actions
  // planifiées enrichissent aussi la gestion humaine et le plan de charge.
  const autos = accounts
    .filter((a) => (TEMPS_TRAVAIL_ROLES.has(a.role) || a.role === "intervenant") && a.intervenantCode)
    .map((a) => ({ acc: a, entry: autoPlannedEntry(events, a.intervenantCode, period, refMonth, refYear) }))
    .filter((x) => x.entry)
    .map((x) => ({ ...x.entry, id: `${x.entry.id}-${x.acc.id}`, proprietaire: x.acc.id }));
  const allInPeriod = [...manual, ...autos];
  const teamSummary = summarizeTT(allInPeriod);
  const map = {};
  allInPeriod.forEach((t) => {
    const acc = accounts.find((a) => a.id === t.proprietaire);
    const nom = acc?.nom || "Ancien compte";
    if (!map[nom]) map[nom] = { nom, role: acc ? roleMeta(acc.role)?.label : "—", entries: [] };
    map[nom].entries.push(t);
  });
  const byPerson = Object.values(map).map((p) => ({ ...p, summary: summarizeTT(p.entries) })).sort((a, b) => b.summary.total - a.summary.total);
  return { allInPeriod, teamSummary, byPerson };
}

function TempsTravailTab({ session, tempsTravail, projects, events, onAdd, onRequestDelete }) {
  const [period, setPeriod] = useState("month"); // "month" | "year" | "all"
  const [showModal, setShowModal] = useState(false);
  const isChefEquipe = session.role === "chef_equipe";

  const mine = useMemo(() => {
    const manual = tempsTravail.filter((t) => t.proprietaire === session.accountId && matchesPeriodTT(t, period));
    const auto = autoPlannedEntry(events, session.intervenantCode, period);
    return auto ? [...manual, auto] : manual;
  }, [tempsTravail, session.accountId, session.intervenantCode, period, events]);
  const mySummary = useMemo(() => summarizeTT(mine), [mine]);

  const periodLabel = period === "month" ? "ce mois-ci" : period === "year" ? "cette année" : "sur toute la période";
  const displayed = mine;
  const displaySummary = mySummary;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: LINE }}>
        <div className="flex rounded-md border overflow-hidden shrink-0" style={{ borderColor: LINE }}>
          <button onClick={() => setPeriod("month")} className="text-xs font-semibold px-3 py-1.5" style={{ background: period === "month" ? CARE : "transparent", color: period === "month" ? "#fff" : INK }}>Ce mois</button>
          <button onClick={() => setPeriod("year")} className="text-xs font-semibold px-3 py-1.5" style={{ background: period === "year" ? CARE : "transparent", color: period === "year" ? "#fff" : INK }}>Cette année</button>
          <button onClick={() => setPeriod("all")} className="text-xs font-semibold px-3 py-1.5" style={{ background: period === "all" ? CARE : "transparent", color: period === "all" ? "#fff" : INK }}>Tout</button>
        </div>
        {isChefEquipe && (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md" style={{ background: PAPER_DARK, color: MUTED }}>
            <Users size={13} /> Vue collective déplacée dans « Gestion humaine »
          </div>
        )}
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md ml-auto shrink-0" style={{ background: AMBER }}>
          <Plus size={15} /> Ajouter un temps
        </button>
      </div>

      {(() => {
        const plannedEvs = events.filter((e) => matchesPeriodTT(e, period));
        const totalPlanned = Math.round(plannedEvs.reduce((s, e) => s + (getEventHours(e) || 0), 0) * 100) / 100;
        return (
          <div className="rounded-lg border p-3 text-xs flex items-center gap-2 flex-wrap" style={{ borderColor: CARE + "55", background: CARE + "0a", color: CARE_DARK }}>
            <CalendarDays size={14} className="shrink-0" />
            <span>
              <strong>{totalPlanned}h</strong> déjà planifiées dans l'agenda sur cette période, toutes actions confondues ({plannedEvs.length} action{plannedEvs.length > 1 ? "s" : ""}).
              {!session.intervenantCode && " Relie ton code intervenant depuis « Mon compte » pour que tes propres actions s'ajoutent automatiquement à ton temps personnel ci-dessous."}
            </span>
          </div>
        );
      })()}

      {showModal && (
        <TempsTravailModal
          projects={projects}
          onClose={() => setShowModal(false)}
          onSave={(payload) => { onAdd(payload); setShowModal(false); }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={`Heures déclarées ${periodLabel}`} value={`${displaySummary.total}h`} />
        <StatCard label="Part chefferie de projet" value={`${displaySummary.pctChefferie}%`} color={DARK_RASPBERRY} />
        <StatCard label="Part terrain / intervention" value={`${displaySummary.pctTerrain}%`} color={FRESH_GREEN} />
        <StatCard label="Entrées enregistrées" value={mine.length} />
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Répartition par nature de temps — moi</SectionLabel>
        <TTPieChart byCat={displaySummary.byCat} total={displaySummary.total} />
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: LINE }}>
        <SectionLabel>Détail des entrées (moi) — {displayed.length}</SectionLabel>
        {displayed.length === 0 ? (
          <p className="text-sm muted">Aucune entrée pour l'instant.</p>
        ) : (
          <div className="space-y-1">
            {displayed.slice().sort((a, b) => b.date.localeCompare(a.date)).map((t) => {
              const cat = ttCategorieMeta(t.categorieId);
              const proj = projects.find((p) => p.id === t.projetId);
              const acc = null;
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 text-sm border-t" style={{ borderColor: LINE }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                  <div className="mono w-20 shrink-0 opacity-90">{fmtDate(t.date)}</div>
                  <div className="w-48 shrink-0 truncate flex items-center gap-1" style={{ color: cat.color }}>
                    {cat.label}
                    {t.auto && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: cat.color + "22" }}>AUTO</span>}
                  </div>
                  {acc && <div className="w-24 shrink-0 truncate text-xs muted">{acc.nom}</div>}
                  <div className="flex-1 min-w-0 truncate text-xs muted">{proj ? proj.nom : ""}{t.note ? (proj ? " · " : "") + t.note : ""}</div>
                  <div className="mono text-xs font-semibold shrink-0">{t.duree}h</div>
                  {!t.auto && t.proprietaire === session.accountId && (
                    <button onClick={() => onRequestDelete(t.id)} className="shrink-0"><Trash2 size={13} style={{ color: RED }} /></button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   FORMULAIRE EVENEMENT (modal)
   ============================================================ */
function EventForm({ form, setForm, projects, intervenants, allCodes, allCategories, onToggleIntervenant, onCreateProject, onSubmit, onClose, onDelete, isEdit, canManageProjects }) {
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjNom, setNewProjNom] = useState("");
  const [newProjCat, setNewProjCat] = useState(allCategories[0] || "");
  const [newProjCatCustom, setNewProjCatCustom] = useState("");
  const [newProjChef, setNewProjChef] = useState("");

  const byCat = useMemo(() => {
    const m = {};
    projects.forEach((p) => { (m[p.categorie] = m[p.categorie] || []).push(p); });
    return m;
  }, [projects]);

  const confirmNewProject = () => {
    if (!newProjNom.trim()) return;
    const categorie = newProjCat === "__new__" ? newProjCatCustom.trim() : newProjCat;
    const id = onCreateProject(newProjNom.trim(), categorie || "Autre", newProjChef);
    setForm((f) => ({ ...f, projetId: id }));
    setCreatingProject(false);
    setNewProjNom(""); setNewProjChef(""); setNewProjCatCustom("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0007" }}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: LINE }}>
          <h2 className="disp text-xl" style={{ fontWeight: 600 }}>{isEdit ? "Modifier l'évènement" : "Nouvel évènement"}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
          <div>
            <label className="text-xs font-medium block mb-1">Statut</label>
            <StatusControl statut={form.statut} onChange={(s) => setForm({ ...form, statut: s })} size="lg" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Projet / dossier</label>
            {!creatingProject ? (
              <div className="flex gap-2">
                <select
                  value={form.projetId} onChange={(e) => setForm({ ...form, projetId: e.target.value })}
                  className="flex-1 min-w-0 text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                >
                  {allCategories.filter((c) => byCat[c]).map((cat) => (
                    <optgroup key={cat} label={programmeForCategorie(cat) ? `${programmeForCategorie(cat).label} — ${cat}` : cat}>
                      {byCat[cat].map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </optgroup>
                  ))}
                </select>
                {canManageProjects && (
                  <button
                    type="button" onClick={() => setCreatingProject(true)}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 rounded-md border"
                    style={{ borderColor: CARE, color: CARE_DARK }}
                  >
                    <Plus size={13} /> Nouveau
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-md border p-3 space-y-2" style={{ borderColor: CARE, background: CARE + "0d" }}>
                <input
                  autoFocus value={newProjNom} onChange={(e) => setNewProjNom(e.target.value)}
                  placeholder="Nom du nouveau projet / sous-projet"
                  className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                />
                <div className="flex gap-2">
                  <select
                    value={newProjCat} onChange={(e) => setNewProjCat(e.target.value)}
                    className="flex-1 text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                  >
                    {allCategories.map((c) => (
            <option key={c} value={c}>{programmeForCategorie(c) ? `${c} (${programmeForCategorie(c).label})` : c}</option>
          ))}
                    <option value="__new__">+ Nouveau dossier…</option>
                  </select>
                </div>
                {newProjCat === "__new__" && (
                  <input
                    value={newProjCatCustom} onChange={(e) => setNewProjCatCustom(e.target.value)}
                    placeholder="Nom du nouveau dossier (ex : Programme XYZ)"
                    className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                  />
                )}
                <input
                  value={newProjChef} onChange={(e) => setNewProjChef(e.target.value)}
                  placeholder="Chef·fe de projet (optionnel)"
                  className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setCreatingProject(false)} className="text-xs font-medium px-3 py-1.5 rounded-md">Annuler</button>
                  <button type="button" onClick={confirmNewProject} style={{ background: CARE }} className="text-xs font-semibold text-white px-3 py-1.5 rounded-md">Créer ce projet</button>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Type d'activité</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
          {TYPES_PERIODE.has(form.type) && (
            <div>
              <label className="text-xs font-medium block mb-1">Date de fin (période sur plusieurs jours)</label>
              <input type="date" value={form.dateFin || ""} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Horaire</label>
              <input value={form.horaire} onChange={(e) => setForm({ ...form, horaire: e.target.value })} placeholder="ex : 9h30-16h30" className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Durée (heures)</label>
              <input type="number" step="0.5" min="0" value={form.dureeHeures} onChange={(e) => setForm({ ...form, dureeHeures: e.target.value })} placeholder="calculée depuis l'horaire si vide" className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
          <div className="rounded-md border p-3" style={{ borderColor: LINE, background: "#FAFBFC" }}>
            <label className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: INK_TEXT_BODY }}>
              <PlaneTakeoff size={13} /> Trajet depuis l'Institut Pasteur de Lille
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] muted block mb-1">Temps de trajet estimé (minutes, aller simple)</label>
                <input
                  type="number" min="0" step="5" value={form.tempsTrajetMin}
                  onChange={(e) => setForm({ ...form, tempsTrajetMin: e.target.value })}
                  placeholder="ex : 45" className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                />
              </div>
              <div>
                <label className="text-[11px] muted block mb-1">Distance estimée (km, aller simple)</label>
                <input
                  type="number" min="0" step="1" value={form.kilometres}
                  onChange={(e) => setForm({ ...form, kilometres: e.target.value })}
                  placeholder="ex : 38" className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[11px] muted block mb-1">Mode de déplacement</label>
              <select
                value={form.modeTransport} onChange={(e) => setForm({ ...form, modeTransport: e.target.value })}
                className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
              >
                <option value="">— À préciser —</option>
                {MODES_TRANSPORT.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <p className="text-[10.5px] muted mt-1.5">Compté une fois par personne présente (aller simple) — vient enrichir le Plan de charge de chaque intervenant·e assigné·e.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Préinscrits</label>
              <input type="number" value={form.preinscrits} onChange={(e) => setForm({ ...form, preinscrits: e.target.value })} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">
              Lieu {(!form.lieu || form.lieu.trim() === "") && <span style={{ color: AMBER }}>(manquant)</span>}
            </label>
            <input value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="ex : Visio, ou adresse complète" className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">
              Intervenants {form.intervenants.length === 0 && <span style={{ color: AMBER }}>(aucun renseigné)</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allCodes.map((code) => {
                const active = form.intervenants.includes(code);
                return (
                  <button
                    type="button" key={code} onClick={() => onToggleIntervenant(code)}
                    style={{
                      background: active ? getIntervenantColor(code, intervenants) : "transparent",
                      borderColor: getIntervenantColor(code, intervenants), color: active ? "#fff" : getIntervenantColor(code, intervenants),
                    }}
                    className="text-xs font-semibold px-2 py-1 rounded-full border"
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Notes / contact</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1 flex items-center gap-1.5">
              <MessageSquare size={13} /> Commentaire de l'intervenant·e
            </label>
            <textarea
              value={form.commentaireIntervenant} onChange={(e) => setForm({ ...form, commentaireIntervenant: e.target.value })}
              rows={2} placeholder="ex : dossier papier laissé à l'accueil, imprévu rencontré…"
              className="w-full text-sm border rounded-md px-2.5 py-2" style={{ borderColor: LINE }}
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={form.incertain} onChange={(e) => setForm({ ...form, incertain: e.target.checked })} />
            Date à confirmer / incertaine
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t shrink-0" style={{ borderColor: LINE }}>
          {isEdit && onDelete ? (
            <button
              onClick={() => { onDelete(); }}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md"
              style={{ color: RED }}
            >
              <Trash2 size={15} /> Supprimer
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-md">Annuler</button>
            <button onClick={onSubmit} style={{ background: CARE }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md">
              <Save size={15} /> Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
