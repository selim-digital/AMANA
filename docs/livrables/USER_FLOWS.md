# AMANA — USER_FLOWS

> Les 10 parcours principaux du MVP. Les identifiants d'écrans (`SCR-…`) sont définis dans `SCREENS.md`. Les événements analytics sont en `snake_case`, émis côté serveur quand c'est possible, anonymisés côté analytics.
> Contraintes transverses valables partout : onboarding ≤ 10 min · DISC ≤ 11 questions jamais nommé « test » · max 3 projets actifs · toute conversation se conclut par une action datée · ton jamais culpabilisant ni anthropomorphique · contrôle total de la mémoire par l'utilisateur.

---

## 1. Je m'inscris

**Déclencheur** : arrivée sur l'app (lien, landing, install PWA).

**Étapes**
1. `SCR-LOGIN` — deux options : « Continuer avec Google » ou champ email → « Recevoir mon lien ». Aucun mot de passe.
2. *(magic link)* Écran de confirmation « Lien envoyé à … » avec bouton « Renvoyer » (actif après 30 s). L'utilisateur clique le lien dans son email → retour dans l'app, session ouverte.
3. *(Google)* OAuth → retour dans l'app, session ouverte.
4. Mini-formulaire de bienvenue : **prénom** (requis), langue (FR pré-sélectionnée), fuseau (auto-détecté, modifiable).
5. Redirection automatique vers `SCR-ONB-1`.

**Règles métier**
- Inscription et connexion sont le même parcours (compte créé au premier lien validé).
- Le prénom est saisi ici et réutilisé par l'onboarding (arbitrage : la compilation le plaçait dans l'onboarding, la roadmap à l'inscription — l'inscription gagne, l'onboarding personnalise).
- Session persistante (PWA) ; pas de re-login quotidien.

**Cas d'erreur**
- Email invalide → validation inline, message neutre.
- Lien expiré (> 15 min) ou déjà utilisé → écran « Ce lien n'est plus valide », bouton renvoyer.
- OAuth refusé/annulé → retour `SCR-LOGIN` sans message d'erreur culpabilisant.

**Analytics** : `signup_started`, `signup_completed` (props : `method: magic_link|google`).

---

## 2. Je fais l'onboarding narratif

**Déclencheur** : première connexion après inscription (reprise automatique si incomplet).

**Étapes**
1. `SCR-ONB-1` — promesse et marque (Décharger → Clarifier → Avancer).
2. `SCR-ONB-2` — le sens du mot AMANA (« le dépôt confié »).
3. `SCR-ONB-3` — accueil personnalisé par le prénom, annonce du chemin (« quelques minutes pour construire ton histoire »).
4. `SCR-ONB-4` à `SCR-ONB-11` — les 8 étapes narratives, en scroll vertical sur le chemin : situation actuelle · vision · domaines de vie · projets en cours · charge mentale · style d'accompagnement souhaité · **DISC via 11 questions max** (micro-cartes à choix rapide) · motivation profonde.
5. `SCR-ONB-12` — synthèse narrative (« mission personnelle »), **ajustable** champ par champ avant validation.
6. `SCR-ONB-13` — 3 portes d'entrée : (1) Commencer par un projet → parcours 5 · (2) Architecturer ma vie · (3) Architecturer un domaine → conversation guidée (`SCR-CONV`) qui se conclut par un premier projet simplifié ou une action datée.
7. Sortie : premier dashboard généré (`SCR-DASH`).

**Règles métier**
- **Durée totale ≤ 10 min** ; indicateur de progression sur le chemin (étapes, pas de %).
- Les mots « test », « diagnostic », « analyse psychologique » sont **interdits** ; le DISC produit une couche d'adaptation invisible, jamais une étiquette affichée (la synthèse dit « comment AMANA s'adapte », pas « tu es un profil D »).
- Chaque étape 4–11 propose « Répondre plus tard » (lacune enregistrée dans le profil, complétable ensuite via conversation) ; la synthèse reste générable avec des trous.
- Toute réponse alimente le profil évolutif et la mémoire **stable** via le filtre utilité·durabilité·importance.

**Cas d'erreur**
- Interruption / fermeture → reprise exacte à l'étape atteinte à la connexion suivante.
- Perte réseau → réponses conservées localement, resynchronisées.
- Génération de synthèse échouée → synthèse minimale à partir des réponses brutes + possibilité de régénérer.

**Analytics** : `onboarding_started`, `onboarding_step_completed` (prop : `step`), `disc_completed` (prop : `question_count`), `onboarding_completed` (prop : `duration_seconds`), `entry_door_selected` (prop : `door: project|life|domain`).

---

## 3. Je vide ma tête (décharge mentale)

**Déclencheur** : bouton central « Déposer » (nav basse), carte dashboard, porte d'entrée onboarding, ou rappel.

**Étapes**
1. `SCR-DUMP` — grand champ texte libre plein écran, placeholder apaisant (« Dépose ici tout ce qui occupe ton esprit, en vrac. »). Dictée via clavier natif.
2. L'utilisateur écrit librement (aucune structure demandée), puis touche « Déposer ».
3. État de traitement (chemin animé sobre, message : « Structuration en cours… ») pendant l'appel IA (tool use).
4. Enchaînement automatique sur le parcours 4 (`SCR-DUMP-REVIEW`).

**Règles métier**
- Brouillon auto-sauvegardé localement toutes les ~3 s ; **le texte n'est jamais perdu**.
- Aucune limite basse ; garde-fou technique haut (~10 000 caractères) avec invite à déposer en plusieurs fois.
- Aucun jugement, aucune correction du texte ; le contenu brut n'entre pas tel quel en mémoire (seuls les items validés au parcours 4 le font).

**Cas d'erreur**
- Échec de l'appel IA → texte intact, message neutre + « Réessayer ».
- Hors-ligne → brouillon conservé, envoi proposé au retour du réseau.

**Analytics** : `braindump_started`, `braindump_submitted` (prop : `char_count`), `braindump_failed` (prop : `reason`).

---

## 4. L'IA classe mes idées et je valide

**Déclencheur** : fin du traitement d'une décharge mentale.

**Étapes**
1. `SCR-DUMP-REVIEW` — propositions groupées en 4 types : **projets · tâches · décisions · rappels**. Chaque carte : type (modifiable), titre proposé (éditable), rattachement suggéré (projet/domaine), échéance si détectée.
2. L'utilisateur traite item par item : **Valider · Corriger (type/titre/rattachement) · Rejeter** — ou « Tout valider » après relecture.
3. Si un item « projet » ferait dépasser **3 actifs** → il est proposé en statut **futurs** (boîte à idées) avec une phrase d'explication non culpabilisante.
4. Écran de synthèse : « X actions, Y rappels, Z idées déposées » + proposition d'**une première action datée** parmi les items créés (pré-sélectionnée, modifiable).
5. Retour `SCR-DASH`, mis à jour.

**Règles métier**
- **Rien n'est créé sans validation explicite** ; l'IA propose, l'utilisateur dispose.
- Items rejetés : ni créés, ni mémorisés.
- Items validés : créent les entités correspondantes + alimentent la mémoire **évolutive** (filtre utilité·durabilité·importance).
- Items non classables par l'IA → section « À trier » restant en bas de l'écran, jamais bloquante.

**Cas d'erreur**
- Classification partielle (timeout) → items reçus affichés, relance du reste sans re-soumettre le texte.
- Conflit (projet homonyme existant) → proposition de rattacher plutôt que dupliquer.

**Analytics** : `braindump_classified` (props : `item_count`, `by_type`), `braindump_item_validated` / `braindump_item_corrected` / `braindump_item_rejected` (prop : `type`), `braindump_completed` (prop : `first_action_dated: bool`).

---

## 5. Je crée un projet guidé

**Déclencheur** : « Nouveau projet » (`SCR-PROJ-LIST` ou dashboard), porte 1 de l'onboarding, ou promotion d'un item de décharge / boîte à idées.

**Étapes**
1. `SCR-CONV` en mode « création de projet » — entonnoir : **Exploration** (questions ouvertes, le flou est autorisé) → **Clarification** (de quoi s'agit-il vraiment ?) → **Alignement** (lien avec valeurs/vision du profil) → **Exécution**.
2. `SCR-PROJ-NEW` — récapitulatif pré-rempli par la conversation : nom, vision courte, objectif, domaine (étiquette), **prochaine action + échéance** (obligatoires), statut proposé.
3. « Créer le projet » → `SCR-PROJ` (détail), première action visible.

**Règles métier**
- **Max 3 projets actifs** : si atteint, choix explicite — passer un actif en secondaire/en attente, ou créer celui-ci en **futurs**. Jamais de 4ᵉ actif.
- La création se conclut **toujours** par une prochaine action datée.
- Phase de création = le flou est utile : l'IA ne presse pas, ne sur-structure pas ; elle reformule avant de proposer.
- 5 statuts possibles dès la création : actif / secondaire / en attente / futur / (abandonné n'est pas proposable à la création).

**Cas d'erreur**
- Abandon en cours de conversation → brouillon sauvé en **futurs** avec le contenu déjà clarifié.
- IA indisponible → bascule sur le formulaire `SCR-PROJ-NEW` vierge (création manuelle simple).

**Analytics** : `project_creation_started` (prop : `source: dashboard|onboarding|braindump|ideas_box`), `project_created` (props : `status`, `has_dated_action: bool`), `project_status_changed` (props : `from`, `to`).

---

## 6. Je crée / termine une action

**Déclencheur** : depuis un projet, le dashboard, une conversation, une décharge validée, ou un rappel.

**Étapes — création**
1. `SCR-ACTION` (bottom sheet) — titre (requis) ; optionnels : projet lié, domaine, priorité, durée estimée, date/heure, échéance, contexte, personnes, description.
2. « Ajouter » → l'action apparaît dans le projet et, si datée aujourd'hui, dans le dashboard.

**Étapes — terminer**
1. Cocher l'action (dashboard, projet ou détail) → transition visuelle sobre (point du chemin qui s'allume).
2. Micro-feedback optionnel : « Qu'est-ce que cette action t'a appris ? » (champ apprentissage, **skippable en un tap**).
3. Mise à jour de l'indice **Action** et de la progression du projet ; event enregistré.

**Règles métier**
- 5 états : à faire / en cours / terminé / reporté / bloqué.
- **Reporté** exige une nouvelle date (reprogrammation, pas d'abandon silencieux).
- **Bloqué** déclenche une proposition d'analyse causale en conversation (clarté ? émotion ? organisation ? ressources ? surcharge ?) et l'offre de réduire à une étape de 10 minutes. La procrastination est un symptôme, jamais une faute.
- Le feedback post-action n'est jamais obligatoire ni culpabilisant.

**Cas d'erreur**
- Échec réseau → UI optimiste + resynchronisation ; indicateur discret « en attente de synchro ».
- Action liée à un projet supprimé → rattachement « sans projet », jamais de perte.

**Analytics** : `task_created` (prop : `source`), `task_completed` (prop : `had_learning: bool`), `task_postponed`, `task_blocked` (prop : `cause` si identifiée), `task_feedback_submitted`.

---

## 7. Je consulte mes priorités du jour

**Déclencheur** : première ouverture de la journée (rituel du matin) ou notification matinale.

**Étapes**
1. `SCR-DASH` — **intention du jour** : question adaptée au profil, en serif (moment de sens), avec champ de réponse courte optionnel.
2. AMANA propose **1 priorité essentielle + 2 secondaires** (à partir des échéances, projets actifs, priorités et mémoire). L'essentielle répond à : « Si tu ne pouvais accomplir qu'une seule chose aujourd'hui, laquelle aurait le plus d'impact ? »
3. L'utilisateur confirme, ou remplace via un sélecteur parmi ses actions « à faire ».
4. Le dashboard affiche la journée : priorités, projets actifs, 3 indices Clarté / Action / Alignement.

**Étapes — cas nominal en journée** : ouverture directe sur le dashboard du jour, priorités cochables, accès conversation et décharge.

**Règles métier**
- **Jamais plus de 3 priorités affichées** ; la carte essentielle porte le seul accent or de l'écran.
- Priorités modifiables à tout moment dans la journée ; re-proposition seulement le lendemain.
- Important / Urgent / Essentiel : la proposition privilégie l'essentiel (progression) sur l'activité.
- Aucune action disponible → invitation douce vers la décharge mentale ou la création de projet (jamais un dashboard vide muet).

**Cas d'erreur**
- Échec de la proposition IA → dashboard fonctionnel avec les actions triées par échéance ; la carte intention affiche une question générique.

**Analytics** : `dashboard_viewed` (prop : `first_of_day: bool`), `daily_intention_set`, `priorities_confirmed` (prop : `modified: bool`).

---

## 8. Je fais mon bilan du soir

**Déclencheur** : notification du soir (heure réglable, désactivable) ou carte « Bilan du soir » sur le dashboard après ~18 h.

**Étapes**
1. `SCR-BILAN` — 3 questions + 1, une par carte, en serif : **Qu'as-tu accompli ?** (liste du jour pré-cochée, ajustable) · **Qu'as-tu appris ?** (texte court optionnel) · **Qu'est-ce qui est à ajuster ?** · **Lâcher-prise : est-ce que je porte uniquement ce qui dépend réellement de moi ?** (réponse courte / curseur).
2. Actions du jour non faites → pour chacune : reprogrammer (date proposée) ou déposer en attente — formulé sans reproche.
3. Synthèse de clôture (2–3 phrases, valorisant efforts et apprentissages, pas seulement les résultats) + mise à jour des indices (Alignement notamment).
4. Retour `SCR-DASH` en état « journée close ».

**Règles métier**
- Durée cible ≤ 2 min ; **entièrement skippable sans conséquence ni rappel culpabilisant** (pas de « série brisée »).
- Les apprentissages passent le filtre mémoire et alimentent la couche **apprentissage**.
- Les bilans du soir nourrissent le **bilan hebdomadaire généré** (accomplissements, apprentissages, blocages, priorités).

**Cas d'erreur**
- Interruption → réponses partielles sauvegardées, reprise possible jusqu'à minuit ; ensuite le bilan est simplement absent (aucun rattrapage exigé).

**Analytics** : `evening_review_started`, `evening_review_completed` (props : `duration_seconds`, `letting_go_answered: bool`), `task_postponed` (prop : `source: evening_review`).

---

## 9. Je consulte / modifie ma mémoire

**Déclencheur** : Profil → « Ma mémoire », lien contextuel depuis une réponse IA (« ceci vient de ta mémoire »), ou Réglages.

**Étapes**
1. `SCR-MEM` — liste des éléments mémorisés, groupés par couche : **Stable** (identité, valeurs, vision) · **Évolutive** (projets, priorités, contexte) · **Apprentissage** (forces, blocages, méthodes). Chaque item : contenu, source (onboarding / conversation / décharge / bilan), date.
2. Recherche plein texte ; tap sur un item → détail.
3. Actions par item : **Modifier** (édition directe du contenu) · **Supprimer** (confirmation, définitif) · **Désactiver** (conservé mais jamais utilisé en conversation).
4. Réglage global sur l'écran : « Suspendre toute nouvelle mémorisation » (interrupteur).

**Règles métier**
- **Contrôle total** : tout élément est consultable, modifiable, supprimable, désactivable — sans exception.
- Suppression = effacement immédiat, embedding compris ; la modification est prise en compte dès la conversation suivante.
- Transparence : chaque item indique pourquoi il a été retenu (utilité / durabilité / importance).
- Aucune donnée « cachée » : ce que l'écran montre est exactement ce que l'agent peut rappeler.

**Cas d'erreur**
- Échec de suppression → message explicite + réessayer ; l'item n'est jamais montré comme supprimé s'il ne l'est pas.
- Liste vide → explication pédagogique de ce qu'AMANA mémorise (et ne mémorise pas), sans invite pressante.

**Analytics** (jamais le contenu, uniquement les gestes) : `memory_viewed`, `memory_item_edited` (prop : `layer`), `memory_item_deleted` (prop : `layer`), `memory_item_disabled`, `memory_capture_disabled` / `memory_capture_enabled`.

---

## 10. Je reçois un rappel intelligent et j'agis

**Déclencheur** : moteur de rappels — 4 moments : avant échéance · au moment prévu · échéance manquée · après une réussite.

**Étapes**
1. Notification push web (ou email en repli) — contextualisée, sobre, non culpabilisante. Exemples de tonalité : avant échéance : « “{action}” arrive à échéance demain. Est-ce toujours la bonne priorité ? » · manquée : « “{action}” n'a pas trouvé sa place hier. La reprogrammer ? » · réussite : « “{action}” est terminée. Deux minutes pour en tirer quelque chose ? »
2. Tap → deep link vers `SCR-ACTION` (détail) ou `SCR-CONV` (capitalisation après réussite).
3. Choix proposés : **Faire maintenant** (passe « en cours ») · **Reprogrammer** (sélecteur de date) · **Marquer fait** · **« Ce n'est plus une priorité »** (→ statut reporté / en attente, avec question courte facultative sur la cause).
4. Retour `SCR-DASH` mis à jour.

**Règles métier**
- **Fréquence plafonnée** (garde-fou anti-addiction, ex. ≤ 3 notifications/jour) ; plages de silence et heure des rituels réglables dans `SCR-SETTINGS` ; tout canal désactivable.
- Jamais de reproche, jamais de compte à rebours anxiogène, jamais de notification « pour faire revenir ».
- Une échéance manquée ne génère qu'un seul rappel de reprogrammation.
- iOS : le push web exige la PWA installée → l'app propose l'installation guidée, l'email reste le repli.

**Cas d'erreur**
- Permission push refusée → repli email silencieux, aucune insistance.
- Deep link vers un objet supprimé → dashboard avec message neutre (« Cet élément n'existe plus »).

**Analytics** : `reminder_sent` (props : `type: before_due|at_time|missed|after_success`, `channel: push|email`), `reminder_opened`, `reminder_action` (prop : `action: do_now|reschedule|done|deprioritize|dismissed`).
