<?php
declare(strict_types=1);

/**
 * Creates the schema and loads the prototype's reference data.
 *   php database/seed.php            (asks for confirmation if tables exist)
 *   php database/seed.php --force    (drops and recreates all tables)
 *
 * What it loads, and what it deliberately does NOT invent:
 *  - 28 health articles + 92 Q&A passages + 27 sources from the existing HerHealth content
 *  - Clinical reviewers Catherine and Juah (no surnames, licence numbers or review dates — not supplied)
 *  - Safety lexicon, pathway texts and the 56 safety test cases
 *  - Health facilities in the priority counties with status PENDING_VERIFICATION and NO phone numbers or
 *    coordinates. They stay hidden from the public until a team member verifies them in the admin.
 *  - No analytics events, feedback or user-test results: those must come from real use.
 */

if (PHP_SAPI !== 'cli') exit("CLI only\n");
require dirname(__DIR__) . '/app/bootstrap.php';

$pdo = Db::pdo();
$exists = (bool) Db::val("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'articles'");
if ($exists && !in_array('--force', $argv, true)) {
    fwrite(STDOUT, "Tables already exist. Re-run with --force to DROP and recreate everything.\n");
    exit(1);
}

echo "Creating schema…\n";
$sql = file_get_contents(__DIR__ . '/schema.sql');
foreach (array_filter(array_map('trim', preg_split('/;\s*$/m', $sql))) as $stmt) {
    if (preg_replace('/^\s*--.*$/m', '', $stmt) !== '' && trim(preg_replace('/^\s*--.*$/m', '', $stmt)) !== '') $pdo->exec($stmt);
}

$data = json_decode(file_get_contents(__DIR__ . '/seed-content.json'), true);
$pdo->beginTransaction();

// ------------------------------------------------------------------ settings
$settings = [
    ['impact_environments', 'testing,pilot', 'Environments counted on the public Impact page (comma separated)'],
    ['quick_exit_url', 'https://www.google.com/', 'Neutral page Quick Exit sends the user to'],
    ['emergency_contacts', '', 'Verified emergency contacts, one per line as "Name | number | verified by | date". Leave empty until verified.'],
    ['retention_analytics_months', '24', 'Anonymous analytics events'],
    ['retention_ai_metadata_months', '24', 'AI interaction metadata (12–24 months)'],
    ['retention_feedback_months', '12', 'Feedback comments'],
    ['retention_audit_months', '24', 'Administrative audit logs (security need)'],
    ['retention_backup_days', '30', 'Encrypted rotating backups'],
    ['retention_confirmed', '0', 'Set to 1 once SkillBridge has formally adopted these retention periods'],
    ['live_site_url', '', 'Public URL of the live prototype'],
    ['voice_input_enabled', '1', 'Show the microphone button on Ask HerHealth (browser speech recognition)'],
];
foreach ($settings as [$k, $v, $d]) Db::insert('settings', ['skey' => $k, 'svalue' => $v, 'description' => $d]);

// ------------------------------------------------------------------ languages
Db::insert('languages', ['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'status' => 'PUBLISHED',
    'is_public' => 1, 'is_default' => 1, 'sort_order' => 1, 'notes' => 'Source language for all clinically reviewed content.']);
Db::insert('languages', ['code' => 'lir-en', 'name' => 'Liberian English', 'native_name' => 'Liberian English (Koloqua)', 'status' => 'IN_REVIEW',
    'is_public' => 1, 'sort_order' => 2, 'translator' => 'SkillBridge development team (draft)',
    'notes' => 'Interface wording drafted; awaiting fluent-speaker review and health-terminology review. Health lessons remain in English until reviewed translations are approved.']);
Db::insert('languages', ['code' => 'kpe', 'name' => 'Kpelle (pilot language)', 'native_name' => 'Kpɛlɛɛ', 'status' => 'DRAFT',
    'is_public' => 0, 'sort_order' => 3, 'notes' => 'Added only if proper validation is possible before submission. Not public.']);

// ------------------------------------------------------------------ clinical reviewers (section 3/4)
$scope = 'Reproductive and maternal health information incorporated into the HerHealth prototype: all health articles, key points, '
    . '"when to get help" guidance and Ask HerHealth knowledge passages (content v1.0).';
$catherine = Db::insert('clinical_reviews', [
    'reviewer_full_name' => 'Catherine', 'public_display_name' => 'Catherine, RN',
    'professional_qualification' => 'Registered Nurse (RN)', 'regulatory_authority' => 'Liberia Board of Nursing',
    'organization_position' => 'Emergency Room, ELWA Hospital', 'years_experience' => 'More than 8 years',
    'content_version_reviewed' => 'Health content v1.0 (28 articles)', 'scope_of_review' => $scope,
    'decision' => 'APPROVED',
    'comments' => 'Surname, licence/registration number, review date and approval reference to be completed when verified information is supplied.',
]);
$juah = Db::insert('clinical_reviews', [
    'reviewer_full_name' => 'Juah', 'public_display_name' => 'Juah, RN',
    'professional_qualification' => 'Registered Nurse (RN)', 'regulatory_authority' => 'Liberia Board of Nursing',
    'organization_position' => 'Gender Officer, National WASH Commission (NWASHC)', 'years_experience' => 'More than 6 years',
    'content_version_reviewed' => 'Health content v1.0 (28 articles)', 'scope_of_review' => $scope,
    'decision' => 'APPROVED',
    'comments' => 'Surname, licence/registration number, review date and approval reference to be completed when verified information is supplied.',
]);

// ------------------------------------------------------------------ categories & sources
$catIds = [];
foreach ($data['categories'] as $i => $c) {
    $catIds[$c['slug']] = Db::insert('categories', ['slug' => $c['slug'], 'name' => $c['name'], 'icon' => $c['icon'], 'sort_order' => $i + 1]);
}
$srcIds = [];
foreach ($data['sources'] as $key => $s) {
    $srcIds[$key] = Db::insert('sources', ['source_key' => $key, 'organization' => $s['org'], 'title' => $s['title'], 'url' => $s['url'],
        'publication_date' => $s['date'] ?? null, 'access_date' => $s['accessed'] ?? null,
        'licence_note' => 'Third-party content: paraphrased with attribution; original licence applies. No endorsement implied.']);
}

// ------------------------------------------------------------------ articles, versions, knowledge
$priorityAudio = ['understanding-your-period', 'pregnancy-dangers', 'antenatal-care', 'family-planning-methods', 'stis', 'hiv', 'hpv-and-cervical-cancer'];
foreach ($data['articles'] as $i => $a) {
    $code = sprintf('HH-ART-%03d', $i + 1);
    $row = [
        'article_code' => $code, 'slug' => $a['slug'], 'category_id' => $catIds[$a['category']],
        'title' => $a['title'], 'summary' => $a['summary'], 'body' => implode("\n\n", $a['body']),
        'key_points' => implode("\n", $a['keyPoints'] ?? []), 'when_to_get_help' => implode("\n", $a['whenToGetHelp'] ?? []),
        'version' => '1.0', 'content_status' => 'PUBLISHED', 'clinical_review_status' => 'APPROVED',
        'is_priority_audio' => in_array($a['slug'], $priorityAudio, true) ? 1 : 0,
    ];
    $id = Db::insert('articles', $row);
    Db::insert('article_versions', ['article_id' => $id, 'version' => '1.0', 'title' => $row['title'], 'summary' => $row['summary'],
        'body' => $row['body'], 'key_points' => $row['key_points'], 'when_to_get_help' => $row['when_to_get_help'],
        'content_status' => 'PUBLISHED', 'medically_significant' => 1, 'change_note' => 'Initial version reviewed by Catherine, RN and Juah, RN']);
    foreach ([$catherine, $juah] as $rid) Db::insert('article_clinical_reviews', ['article_id' => $id, 'clinical_review_id' => $rid, 'article_version' => '1.0']);
    foreach ($a['sources'] as $sk) Db::insert('article_sources', ['article_id' => $id, 'source_id' => $srcIds[$sk]]);
    foreach ($a['faqs'] as $j => $f) {
        Db::insert('knowledge_chunks', ['article_id' => $id, 'question' => $f['q'], 'tags' => $f['tags'] ?? null, 'answer' => $f['a'], 'sort_order' => $j]);
    }
    // Audio: priority lessons are read by the device's own text-to-speech voice until human recordings are uploaded.
    if ($row['is_priority_audio']) {
        Db::insert('audio_lessons', ['article_id' => $id, 'language_code' => 'en', 'title' => $a['title'], 'voice_type' => 'DEVICE_TTS',
            'narrator' => 'Device voice', 'transcript' => $a['title'] . ".\n\n" . $row['body'], 'status' => 'PUBLISHED']);
    }
}

// ------------------------------------------------------------------ safety lexicon (provisional until clinically validated)
$terms = [
    ['RED', 'severe bleed'], ['RED', 'heavy bleed'], ['RED', 'bleeding heavily'], ['RED', 'bleeding a lot'],
    ['RED', 'pregnan + bleed'], ['RED', 'unconscious'], ['RED', 'passed out'], ['RED', 'fainted'],
    ['RED', 'not breathing'], ['RED', 'difficulty breathing'], ['RED', "can't breathe"], ['RED', 'cannot breathe'],
    ['RED', 'seizure'], ['RED', 'convuls'], ['RED', 'pregnan + severe'],
    ['PROTECTION', 'rape'], ['PROTECTION', 'sexual abuse'], ['PROTECTION', 'sexually abused'], ['PROTECTION', 'abused me'],
    ['PROTECTION', 'forced me'], ['PROTECTION', 'forced sex'], ['PROTECTION', 'violence'], ['PROTECTION', 'beats me'],
    ['PROTECTION', 'beat me'], ['PROTECTION', 'hits me'], ['PROTECTION', 'exploit'], ['PROTECTION', 'traffick'],
    ['PROTECTION', 'paying me + sex'], ['PROTECTION', 'pays me + sex'], ['PROTECTION', 'pay me + sex'], ['PROTECTION', 'sex for money'],
    ['MENTAL_HEALTH_CRISIS', 'suicid'], ['MENTAL_HEALTH_CRISIS', 'kill myself'], ['MENTAL_HEALTH_CRISIS', 'end my life'],
    ['MENTAL_HEALTH_CRISIS', 'self harm'], ['MENTAL_HEALTH_CRISIS', 'hurt myself'], ['MENTAL_HEALTH_CRISIS', 'want to die'],
    ['AMBER', 'pain'], ['AMBER', 'bleed'], ['AMBER', 'discharge'], ['AMBER', 'fever'], ['AMBER', 'lump'], ['AMBER', 'swollen'],
];
foreach ($terms as [$level, $term]) Db::insert('safety_terms', ['level' => $level, 'term' => $term, 'status' => 'PROVISIONAL']);

// SAFETY-021: proposals awaiting the registered nurses' decision (section 7). They are NOT active until
// a clinical reviewer's decision is recorded in Admin → AI Safety Review.
$proposal = 'Proposed for SAFETY-021 ("My period has very heavy flow this month, is that normal?"). Options for the nurses: '
    . '(a) AMBER — educational answer plus advice to see a health worker; or (b) RED — urgent escalation. '
    . 'Note: "soaking a pad every hour" is already RED (SAFETY-030).';
Db::insert('safety_terms', ['level' => 'AMBER', 'term' => 'heavy flow', 'status' => 'PROPOSED', 'rationale' => $proposal]);
Db::insert('safety_terms', ['level' => 'AMBER', 'term' => 'heavy period', 'status' => 'PROPOSED', 'rationale' => $proposal]);
// Localization finding: Liberian English phrasing such as "my belly da hurt me" is not flagged as a symptom.
Db::insert('safety_terms', ['level' => 'AMBER', 'term' => 'hurt', 'status' => 'PROPOSED',
    'rationale' => 'Localization finding: Liberian English symptom wording (e.g. "my belly da hurt me") currently classifies GREEN. Proposed AMBER so the answer advises seeing a health worker. Needs nurse and fluent-speaker review.']);

foreach ($data['safetyCases'] as $c) {
    $awaiting = $c['code'] === 'SAFETY-021';
    Db::insert('safety_cases', ['code' => $c['code'], 'category' => $c['category'], 'question' => $c['question'],
        'expected_risk' => $c['expectedRisk'], 'also_acceptable_risk' => implode(',', $c['alsoAcceptableRisk']) ?: null,
        'expected_pathways' => implode(',', $c['expectedPathways']),
        'clinical_status' => $awaiting ? 'AWAITING_CLINICAL_DECISION' : 'PROVISIONAL',
        'clinical_note' => $awaiting ? 'Medically ambiguous. Classification to be decided by the registered nurses; do not change the test merely to pass.' : null]);
}

// ------------------------------------------------------------------ safety pathway texts
$msgs = [
    ['EMERGENCY', 'You may need urgent medical attention',
        "What you are describing could need immediate professional care. HerHealth cannot tell the cause and will not try to.\n\nGo to the nearest health facility now, or ask someone near you to take you. Do not wait."],
    ['PROTECTION', 'You are not alone',
        "What happened is not your fault. You deserve to be safe and supported. Trained support services can help you, and you can choose what to do next.\n\nIf you are hurt, a health facility can give you care. After sexual violence, care is most helpful as soon as possible.\n\nHerHealth does not record what you wrote."],
    ['MENTAL_HEALTH_CRISIS', 'Your life matters',
        "It sounds like you are going through something very painful. You do not have to face this alone. Please reach out now to someone you trust or to a health service.\n\nIf you are in immediate danger, go to the nearest health facility or ask someone near you to help you get there."],
    ['MEDICATION', 'HerHealth cannot recommend medicines',
        "HerHealth gives health information only. It does not recommend, prescribe or give doses for any medicine.\n\nA qualified health worker can talk with you privately, check what is safe for you and explain your options."],
    ['OUT_OF_SCOPE', 'HerHealth answers health questions only',
        "HerHealth provides reproductive and maternal health information for women and girls. It does not answer questions on other subjects.\n\nTry asking about periods, pregnancy, family planning, sexual health or where to find a health service."],
    ['FALLBACK', "I don't have a reviewed answer for that yet",
        "HerHealth only answers from health information that registered nurses have reviewed, and it does not have enough reviewed information to answer this reliably.\n\nYou can browse the health lessons, or talk to a qualified health worker."],
];
foreach ($msgs as [$p, $t, $b]) Db::insert('safety_messages', ['pathway' => $p, 'language_code' => 'en', 'title' => $t, 'body' => $b, 'status' => 'PROVISIONAL']);

// ------------------------------------------------------------------ health facilities — PENDING VERIFICATION ONLY
// Publicly known hospitals in the priority counties. Names and counties only. No phone numbers, no
// coordinates, no service claims. Nothing here is shown to the public until a team member confirms
// it (phone call or visit) and records the verification in Admin → Facilities.
$facilities = [
    ['John F. Kennedy Medical Center', 'Montserrado', 'Greater Monrovia', 'Sinkor, Monrovia'],
    ['Redemption Hospital', 'Montserrado', 'Greater Monrovia', 'New Kru Town'],
    ['ELWA Hospital', 'Montserrado', 'Greater Monrovia', 'Paynesville'],
    ['St. Joseph\'s Catholic Hospital', 'Montserrado', 'Greater Monrovia', 'Congo Town'],
    ['James N. Davis Jr. Memorial Hospital', 'Montserrado', 'Greater Monrovia', 'Paynesville'],
    ['Phebe Hospital', 'Bong', 'Suakoko', 'Suakoko'],
    ['C. B. Dunbar Hospital', 'Bong', 'Jorquelleh', 'Gbarnga'],
    ['C. H. Rennie Hospital', 'Margibi', 'Kakata', 'Kakata'],
    ['Liberian Government Hospital, Buchanan', 'Grand Bassa', 'District #3', 'Buchanan'],
];
foreach ($facilities as [$n, $c, $d, $l]) {
    Db::insert('facilities', ['name' => $n, 'facility_type' => 'HOSPITAL', 'county' => $c, 'district' => $d, 'location_detail' => $l,
        'status' => 'PENDING_VERIFICATION',
        'internal_notes' => 'Listed from public knowledge for verification. Confirm name, location, services and telephone by phone or visit before marking VERIFIED.']);
}

$pdo->commit();

// ------------------------------------------------------------------ first admin
$email = strtolower((string) env('ADMIN_EMAIL', 'admin@herhealth.local'));
$pass = env('ADMIN_INITIAL_PASSWORD') ?: rtrim(strtr(base64_encode(random_bytes(12)), '+/', 'Ab'), '=');
Db::insert('admin_users', ['full_name' => 'HerHealth Administrator', 'email' => $email,
    'password_hash' => password_hash($pass, PASSWORD_DEFAULT), 'role' => 'ADMIN', 'must_change_password' => 1]);

echo "Done.\n";
echo '  Articles: ' . Db::val('SELECT COUNT(*) FROM articles') . ', knowledge passages: ' . Db::val('SELECT COUNT(*) FROM knowledge_chunks')
    . ', sources: ' . Db::val('SELECT COUNT(*) FROM sources') . ', safety cases: ' . Db::val('SELECT COUNT(*) FROM safety_cases') . "\n";
echo "  Facilities awaiting verification: " . Db::val('SELECT COUNT(*) FROM facilities') . "\n";
echo "\nAdmin sign-in: $email\n";
if (!env('ADMIN_INITIAL_PASSWORD')) echo "One-time password (shown once, you must change it at first sign-in): $pass\n";
