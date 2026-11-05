<?php
declare(strict_types=1);

/**
 * Declarative admin resources. Each entry drives the generic list / create / edit / delete / export
 * screens. Field types: text, textarea, select, bool, date, int, email, url, decimal, readonly, fk, password, file.
 *  roles  : roles allowed to edit (ADMIN always allowed). view_roles: additional read-only roles.
 *  create / delete : whether those actions exist.
 *  validate(array $data, ?array $old): ?string — return an error message to block saving.
 */

function enum_opts(array $values): array
{
    return array_combine($values, array_map('human_enum', $values));
}

function admin_entities(): array
{
    static $E = null;
    if ($E !== null) return $E;
    $yes = fn($v) => !empty($v);

    $E = [
        'clinical-reviews' => [
            'table' => 'clinical_reviews', 'title' => 'Clinical Review Register', 'singular' => 'clinical review record',
            'roles' => ['CLINICAL_REVIEWER'], 'view_roles' => ['CONTENT_EDITOR', 'ANALYST'],
            'intro' => 'Section 4. Licence numbers are internal due-diligence information and are never published unless the reviewer has expressly consented.',
            'list' => ['reviewer_full_name', 'professional_qualification', 'organization_position', 'years_experience', 'review_date', 'decision'],
            'search' => ['reviewer_full_name', 'organization_position', 'content_version_reviewed'],
            'filters' => ['decision'],
            'order' => 'id',
            'fields' => [
                'reviewer_full_name' => ['Reviewer full name', 'text', 'required' => true, 'help' => 'Do not invent surnames — enter only what the reviewer has supplied.'],
                'public_display_name' => ['Public display name', 'text', 'help' => 'Shown on the site, e.g. “Catherine, RN”.'],
                'professional_qualification' => ['Professional qualification', 'text', 'required' => true],
                'regulatory_authority' => ['Regulatory authority', 'text', 'required' => true],
                'license_number' => ['Licence / registration number (internal)', 'text'],
                'license_public_consent' => ['Reviewer consents to public disclosure of licence number', 'bool'],
                'organization_position' => ['Organization / position', 'text'],
                'years_experience' => ['Years of experience', 'text'],
                'content_version_reviewed' => ['Content / version reviewed', 'text'],
                'scope_of_review' => ['Scope of review', 'textarea'],
                'review_date' => ['Review date', 'date', 'help' => 'Leave empty until the verified date is supplied.'],
                'decision' => ['Decision', 'select', 'options' => enum_opts(['PENDING', 'CHANGES_REQUIRED', 'APPROVED', 'SUPERSEDED']), 'required' => true],
                'comments' => ['Comments', 'textarea'],
                'approval_reference' => ['Signature / approval reference', 'text'],
                'created_at' => ['Created at', 'readonly'], 'updated_at' => ['Updated at', 'readonly'],
            ],
        ],

        'sources' => [
            'table' => 'sources', 'title' => 'Knowledge Sources', 'singular' => 'source', 'roles' => ['CONTENT_EDITOR'], 'view_roles' => ['CLINICAL_REVIEWER', 'ANALYST'],
            'intro' => 'Section 28. Every clinically relevant article must cite identifiable sources. Citing an organization does not imply its endorsement.',
            'list' => ['source_key', 'organization', 'title', 'publication_date', 'access_date'],
            'search' => ['organization', 'title', 'url', 'source_key'], 'order' => 'organization, title',
            'delete_check' => fn($id) => Db::val('SELECT COUNT(*) FROM article_sources WHERE source_id = ?', [$id]) ? 'This source is cited by articles. Remove it from those articles first.' : null,
            'fields' => [
                'source_key' => ['Source key', 'text', 'required' => true, 'help' => 'Short unique code, e.g. whoHiv'],
                'organization' => ['Organization', 'text', 'required' => true],
                'title' => ['Source title', 'text', 'required' => true],
                'url' => ['Source URL', 'url', 'required' => true],
                'publication_date' => ['Publication / update date', 'text'],
                'access_date' => ['Access date', 'date'],
                'licence_note' => ['Licence note', 'text'],
                'related' => ['Relevant articles', 'readonly', 'virtual' => fn($r) => implode(', ', array_column(Db::all(
                    'SELECT a.article_code FROM article_sources x JOIN articles a ON a.id = x.article_id WHERE x.source_id = ?', [$r['id'] ?? 0]), 'article_code'))],
            ],
        ],

        'knowledge' => [
            'table' => 'knowledge_chunks', 'title' => 'Knowledge passages (Ask HerHealth)', 'singular' => 'knowledge passage', 'roles' => ['CONTENT_EDITOR'],
            'view_roles' => ['CLINICAL_REVIEWER', 'ANALYST'],
            'intro' => 'Approved question/answer passages used for grounded answers. A passage is only retrieved when its article is clinically APPROVED and APPROVED/PUBLISHED. Editing a passage of an approved article sends the article back for clinical re-review.',
            'list' => ['article_id', 'question', 'answer'], 'search' => ['question', 'tags', 'answer'], 'order' => 'article_id, sort_order',
            'filters' => ['article_id'],
            'after_save' => function (int $id, array $d, ?array $old) {
                if ($old && ($old['answer'] !== $d['answer'] || $old['question'] !== $d['question'])) {
                    Db::run("UPDATE articles SET content_status = 'CLINICAL_REVIEW', clinical_review_status = 'PENDING' WHERE id = ? AND clinical_review_status = 'APPROVED'", [$d['article_id']]);
                }
            },
            'fields' => [
                'article_id' => ['Article', 'fk', 'sql' => 'SELECT id, CONCAT(article_code, " — ", title) AS label FROM articles ORDER BY id', 'required' => true],
                'question' => ['Question', 'text', 'required' => true],
                'tags' => ['Search tags', 'text', 'help' => 'Extra words people may use (including Liberian English) to find this answer.'],
                'answer' => ['Approved answer', 'textarea', 'required' => true],
                'sort_order' => ['Order', 'int'],
            ],
        ],

        'translations' => [
            'table' => 'article_translations', 'title' => 'Translations', 'singular' => 'translation', 'roles' => ['LANGUAGE_REVIEWER', 'CONTENT_EDITOR'],
            'view_roles' => ['CLINICAL_REVIEWER', 'ANALYST'],
            'intro' => 'Sections 10–11. Approved English → draft → fluent/native reviewer → health terminology review → comprehension check → APPROVED → PUBLISHED. Machine-generated drafts can never be approved or published.',
            'list' => ['article_id', 'language_code', 'source_article_version', 'version', 'translator', 'reviewer', 'status', 'review_date'],
            'search' => ['title', 'translator', 'reviewer'], 'filters' => ['language_code', 'status'], 'order' => 'article_id',
            'validate' => function (array $d) {
                if (in_array($d['status'], ['APPROVED', 'PUBLISHED'], true)) {
                    if (!empty($d['is_machine_draft'])) return 'A machine-generated draft cannot be approved. Have a fluent translator rewrite it and untick “machine draft”.';
                    foreach (['translator' => 'translator', 'reviewer' => 'fluent reviewer', 'terminology_reviewer' => 'terminology reviewer', 'review_date' => 'review date'] as $f => $n) {
                        if (empty($d[$f])) return "Enter the $n before approving.";
                    }
                    if (empty($d['comprehension_checked'])) return 'Confirm the comprehension check before approving.';
                }
                return null;
            },
            'fields' => [
                'article_id' => ['Article', 'fk', 'sql' => 'SELECT id, CONCAT(article_code, " — ", title) AS label FROM articles ORDER BY id', 'required' => true],
                'language_code' => ['Language', 'fk', 'sql' => "SELECT code AS id, name AS label FROM languages WHERE code <> 'en' ORDER BY sort_order", 'required' => true],
                'source_article_version' => ['Source article version', 'text', 'required' => true, 'help' => 'Version of the approved English article that was translated.'],
                'version' => ['Translation version', 'text', 'required' => true],
                'title' => ['Title', 'text', 'required' => true],
                'summary' => ['Summary', 'textarea', 'required' => true],
                'body' => ['Body (blank line between paragraphs)', 'textarea', 'required' => true, 'rows' => 12],
                'key_points' => ['Key points (one per line)', 'textarea'],
                'when_to_get_help' => ['When to get help (one per line)', 'textarea'],
                'translator' => ['Translator', 'text'],
                'reviewer' => ['Fluent / native-language reviewer', 'text'],
                'terminology_reviewer' => ['Health terminology reviewer', 'text'],
                'comprehension_checked' => ['Comprehension check completed', 'bool'],
                'is_machine_draft' => ['Machine-generated draft', 'bool'],
                'status' => ['Status', 'select', 'options' => enum_opts(['DRAFT', 'NATIVE_REVIEW', 'TERMINOLOGY_REVIEW', 'COMPREHENSION_CHECK', 'APPROVED', 'PUBLISHED']), 'required' => true],
                'review_date' => ['Review date', 'date'],
            ],
        ],

        'languages' => [
            'table' => 'languages', 'pk' => 'code', 'title' => 'Languages', 'singular' => 'language', 'roles' => ['LANGUAGE_REVIEWER'], 'view_roles' => ['CONTENT_EDITOR', 'ANALYST'],
            'intro' => 'Interface wording lives in /locales/<code>.json. A language may be offered publicly while IN_REVIEW only with a visible “under language review” label.',
            'list' => ['code', 'name', 'status', 'is_public', 'translator', 'reviewer', 'review_date'], 'order' => 'sort_order',
            'delete' => false,
            'validate' => function (array $d) {
                if (in_array($d['status'], ['APPROVED', 'PUBLISHED'], true) && (empty($d['reviewer']) || empty($d['review_date']))) return 'Record the reviewer and review date before approving a language.';
                return null;
            },
            'fields' => [
                'code' => ['Code', 'text', 'required' => true, 'create_only' => true],
                'name' => ['Name', 'text', 'required' => true],
                'native_name' => ['Native name', 'text', 'required' => true],
                'status' => ['Status', 'select', 'options' => enum_opts(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'WITHDRAWN']), 'required' => true],
                'is_public' => ['Selectable by the public', 'bool'],
                'translator' => ['Translator', 'text'], 'reviewer' => ['Reviewer', 'text'], 'review_date' => ['Review date', 'date'],
                'notes' => ['Notes', 'textarea'], 'sort_order' => ['Order', 'int'],
            ],
        ],

        'audio' => [
            'table' => 'audio_lessons', 'title' => 'Audio lessons', 'singular' => 'audio lesson', 'roles' => ['CONTENT_EDITOR'], 'view_roles' => ['ANALYST'],
            'intro' => 'Section 12. Upload compressed human recordings (MP3/M4A/OGG/Opus, 32–64 kbps mono recommended, max 8 MB). Audio never autoplays. Lessons without a recording are read by the phone’s own voice from the transcript.',
            'list' => ['article_id', 'language_code', 'voice_type', 'narrator', 'size_bytes', 'status'], 'filters' => ['status', 'voice_type'], 'order' => 'article_id',
            'validate' => function (array $d) {
                if ($d['voice_type'] === 'HUMAN' && $d['status'] === 'PUBLISHED' && empty($d['file_path'])) return 'Upload the recording before publishing a human-voice lesson.';
                return null;
            },
            'fields' => [
                'article_id' => ['Article', 'fk', 'sql' => 'SELECT id, CONCAT(article_code, " — ", title) AS label FROM articles ORDER BY id', 'required' => true],
                'language_code' => ['Language', 'fk', 'sql' => 'SELECT code AS id, name AS label FROM languages ORDER BY sort_order', 'required' => true],
                'title' => ['Title', 'text', 'required' => true],
                'voice_type' => ['Voice', 'select', 'options' => ['HUMAN' => 'Human recording', 'DEVICE_TTS' => 'Device text-to-speech (no file)'], 'required' => true],
                'audio_file' => ['Recording file', 'file'],
                'file_path' => ['Stored file', 'readonly'],
                'narrator' => ['Narrator', 'text'],
                'duration_seconds' => ['Duration (seconds)', 'int'],
                'size_bytes' => ['Size (bytes)', 'readonly'],
                'transcript' => ['Transcript (required for accessibility)', 'textarea', 'required' => true, 'rows' => 10],
                'status' => ['Status', 'select', 'options' => enum_opts(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']), 'required' => true],
            ],
        ],

        'facilities' => [
            'table' => 'facilities', 'title' => 'Health Facilities', 'singular' => 'facility', 'roles' => ['FACILITY_VERIFIER'], 'view_roles' => ['CONTENT_EDITOR', 'ANALYST'],
            'intro' => 'Section 13. Only VERIFIED facilities are shown to the public. Telephone numbers and coordinates appear only when separately ticked as verified. Never enter information you have not confirmed.',
            'list' => ['name', 'county', 'district', 'facility_type', 'telephone', 'verification_date', 'status'],
            'search' => ['name', 'district', 'location_detail'], 'filters' => ['county', 'status', 'facility_type'], 'order' => 'county, name',
            'services' => true,
            'validate' => function (array $d) {
                if ($d['status'] === 'VERIFIED') {
                    foreach (['verification_source' => 'verification source', 'verified_by' => 'verified by', 'verification_date' => 'verification date'] as $f => $n) {
                        if (empty($d[$f])) return "Enter the $n before marking this facility VERIFIED.";
                    }
                }
                if (!empty($d['telephone_verified']) && empty($d['telephone'])) return 'Enter the telephone number or untick “telephone verified”.';
                if (!empty($d['coordinates_verified']) && ($d['latitude'] === null || $d['longitude'] === null)) return 'Enter both coordinates or untick “coordinates verified”.';
                if ($d['latitude'] !== null && ($d['latitude'] < 4 || $d['latitude'] > 9 || $d['longitude'] < -12 || $d['longitude'] > -7)) return 'Coordinates are outside Liberia.';
                return null;
            },
            'fields' => [
                'name' => ['Facility name', 'text', 'required' => true],
                'facility_type' => ['Type', 'select', 'options' => enum_opts(['HOSPITAL', 'HEALTH_CENTER', 'CLINIC', 'HELPLINE', 'SUPPORT_SERVICE', 'OTHER']), 'required' => true],
                'county' => ['County', 'select', 'options' => array_combine(Content::COUNTIES, Content::COUNTIES), 'required' => true],
                'district' => ['District', 'text'],
                'location_detail' => ['Location / town', 'text'],
                'telephone' => ['Telephone (only if verified)', 'text'],
                'telephone_verified' => ['Telephone verified', 'bool'],
                'latitude' => ['Latitude', 'decimal'], 'longitude' => ['Longitude', 'decimal'],
                'coordinates_verified' => ['Coordinates verified', 'bool'],
                'opening_hours' => ['Opening hours', 'text'],
                'verification_source' => ['Verification source', 'text', 'help' => 'e.g. “Phone call to facility in-charge”, “Site visit”'],
                'verified_by' => ['Verified by', 'text'],
                'verification_date' => ['Verification date', 'date'],
                'last_reverified_date' => ['Last re-verification date', 'date'],
                'status' => ['Status', 'select', 'options' => enum_opts(['PENDING_VERIFICATION', 'VERIFIED', 'NEEDS_REVERIFICATION', 'INACTIVE']), 'required' => true],
                'internal_notes' => ['Internal notes', 'textarea'],
            ],
        ],

        'safety-terms' => [
            'table' => 'safety_terms', 'title' => 'Safety lexicon', 'singular' => 'safety term', 'roles' => ['CLINICAL_REVIEWER'], 'view_roles' => ['CONTENT_EDITOR', 'ANALYST'],
            'intro' => 'Only PROVISIONAL and CLINICALLY_VALIDATED terms are active. PROPOSED terms wait for a registered nurse’s decision. Use “a + b” to require both phrases. Re-run the safety suite after any change.',
            'list' => ['level', 'term', 'status', 'decided_by', 'decided_at'], 'search' => ['term'], 'filters' => ['level', 'status'], 'order' => 'FIELD(status,"PROPOSED","PROVISIONAL","CLINICALLY_VALIDATED","REJECTED"), level, term',
            'validate' => function (array $d) {
                if (in_array($d['status'], ['CLINICALLY_VALIDATED', 'REJECTED'], true) && (empty($d['decided_by']) || empty($d['decided_at']))) return 'Record which registered nurse decided, and when.';
                return null;
            },
            'fields' => [
                'level' => ['Level', 'select', 'options' => enum_opts(['RED', 'PROTECTION', 'MENTAL_HEALTH_CRISIS', 'AMBER']), 'required' => true],
                'term' => ['Term', 'text', 'required' => true],
                'status' => ['Status', 'select', 'options' => enum_opts(['PROVISIONAL', 'CLINICALLY_VALIDATED', 'PROPOSED', 'REJECTED']), 'required' => true],
                'rationale' => ['Rationale', 'textarea'],
                'decided_by' => ['Decided by (clinical reviewer)', 'text'],
                'decided_at' => ['Decision date', 'date'],
            ],
        ],

        'safety-cases' => [
            'table' => 'safety_cases', 'title' => 'Safety test cases', 'singular' => 'safety test case', 'roles' => ['CLINICAL_REVIEWER'], 'view_roles' => ['CONTENT_EDITOR', 'ANALYST'],
            'intro' => 'Synthetic test questions (not user data). Change an expected classification only on a recorded clinical decision — never just to make a test pass.',
            'list' => ['code', 'category', 'question', 'expected_risk', 'expected_pathways', 'clinical_status'], 'search' => ['code', 'question'], 'filters' => ['category', 'clinical_status'], 'order' => 'code',
            'validate' => function (array $d, ?array $old) {
                if ($old && ($old['expected_risk'] !== $d['expected_risk'] || $old['expected_pathways'] !== $d['expected_pathways']) && empty($d['clinical_note'])) {
                    return 'Changing the expected result requires a clinical note recording the nurse’s decision.';
                }
                return null;
            },
            'fields' => [
                'code' => ['Code', 'text', 'required' => true], 'category' => ['Category', 'text', 'required' => true],
                'question' => ['Test question', 'textarea', 'required' => true],
                'expected_risk' => ['Expected risk', 'select', 'options' => enum_opts(['GREEN', 'AMBER', 'RED', 'PROTECTION', 'MENTAL_HEALTH_CRISIS']), 'required' => true],
                'also_acceptable_risk' => ['Also acceptable risk (comma separated)', 'text'],
                'expected_pathways' => ['Expected pathways (comma separated)', 'text', 'required' => true, 'help' => 'ANSWER, FALLBACK, EMERGENCY, PROTECTION, MENTAL_HEALTH_CRISIS, MEDICATION, OUT_OF_SCOPE'],
                'clinical_status' => ['Clinical status', 'select', 'options' => enum_opts(['PROVISIONAL', 'AWAITING_CLINICAL_DECISION', 'CLINICALLY_VALIDATED']), 'required' => true],
                'clinical_note' => ['Clinical note / decision', 'textarea'],
                'is_active' => ['Active', 'bool'],
            ],
        ],

        'safety-messages' => [
            'table' => 'safety_messages', 'title' => 'Safety pathway messages', 'singular' => 'pathway message', 'roles' => ['CLINICAL_REVIEWER'], 'view_roles' => ['CONTENT_EDITOR'],
            'intro' => 'Fixed texts shown instead of an AI answer. Never include an emergency number that has not been verified.',
            'list' => ['pathway', 'language_code', 'title', 'status'], 'order' => 'pathway, language_code',
            'fields' => [
                'pathway' => ['Pathway', 'select', 'options' => enum_opts(['EMERGENCY', 'PROTECTION', 'MENTAL_HEALTH_CRISIS', 'MEDICATION', 'OUT_OF_SCOPE', 'FALLBACK']), 'required' => true],
                'language_code' => ['Language', 'fk', 'sql' => 'SELECT code AS id, name AS label FROM languages ORDER BY sort_order', 'required' => true],
                'title' => ['Title', 'text', 'required' => true],
                'body' => ['Body (blank line between paragraphs)', 'textarea', 'required' => true],
                'status' => ['Status', 'select', 'options' => enum_opts(['PROVISIONAL', 'CLINICALLY_VALIDATED']), 'required' => true],
            ],
        ],

        'ai-interactions' => [
            'table' => 'ai_interactions', 'title' => 'AI interaction review', 'singular' => 'interaction', 'roles' => ['CLINICAL_REVIEWER'], 'view_roles' => ['ANALYST', 'CONTENT_EDITOR'],
            'intro' => 'Metadata only — the question text is never stored. Review pathways, confidence and post-check flags for patterns.',
            'list' => ['created_at', 'environment', 'language_code', 'input_mode', 'risk_level', 'pathway', 'matched_article_id', 'confidence', 'provider', 'postcheck_flag', 'reviewed_status'],
            'filters' => ['environment', 'pathway', 'risk_level', 'reviewed_status'], 'order' => 'id DESC', 'create' => false,
            'fields' => [
                'created_at' => ['Time', 'readonly'], 'environment' => ['Environment', 'readonly'], 'language_code' => ['Language', 'readonly'],
                'input_mode' => ['Input', 'readonly'], 'risk_level' => ['Risk', 'readonly'], 'pathway' => ['Pathway', 'readonly'],
                'topic_category' => ['Topic', 'readonly'], 'matched_article_id' => ['Article', 'readonly'], 'confidence' => ['Confidence', 'readonly'],
                'provider' => ['Provider', 'readonly'], 'postcheck_flag' => ['Post-check flag', 'readonly'], 'latency_ms' => ['Latency (ms)', 'readonly'],
                'reviewed_status' => ['Review', 'select', 'options' => enum_opts(['UNREVIEWED', 'OK', 'CONCERN']), 'required' => true],
                'review_note' => ['Review note', 'textarea'],
            ],
        ],

        'feedback' => [
            'table' => 'feedback', 'title' => 'Feedback', 'singular' => 'feedback item', 'roles' => ['CONTENT_EDITOR'], 'view_roles' => ['ANALYST', 'CLINICAL_REVIEWER'],
            'intro' => 'Anonymous feedback. Phone numbers and e-mail addresses are removed automatically. Comments are deleted after the retention period.',
            'list' => ['created_at', 'environment', 'target_type', 'article_id', 'useful', 'comment', 'status'], 'search' => ['comment'],
            'filters' => ['environment', 'target_type', 'useful', 'status'], 'order' => 'id DESC', 'create' => false,
            'fields' => [
                'created_at' => ['Received', 'readonly'], 'environment' => ['Environment', 'readonly'], 'target_type' => ['About', 'readonly'],
                'article_id' => ['Article', 'readonly'], 'useful' => ['Useful', 'readonly'], 'comment' => ['Comment', 'readonly'], 'language_code' => ['Language', 'readonly'],
                'status' => ['Status', 'select', 'options' => enum_opts(['NEW', 'REVIEWED', 'ACTIONED', 'DISMISSED']), 'required' => true],
                'admin_note' => ['Admin note', 'textarea'],
            ],
        ],

        'user-tests' => [
            'table' => 'user_tests', 'title' => 'Usability test sessions', 'singular' => 'test session', 'roles' => ['ANALYST', 'CONTENT_EDITOR'],
            'intro' => 'Sections 20–21. Adults (18+) only. Never record names — use an anonymous participant ID. Record exactly what happened; never fabricate results.',
            'list' => ['participant_code', 'test_date', 'age_range', 'language_code', 'device', 'ease_rating', 'understandability_rating', 'useful_to_community', 'consent_confirmed'],
            'search' => ['participant_code', 'device', 'comments'], 'filters' => ['language_code', 'useful_to_community'], 'order' => 'test_date DESC, participant_code',
            'tasks' => true,
            'validate' => function (array $d) {
                if (empty($d['consent_confirmed'])) return 'Consent must be confirmed before a session can be recorded.';
                if (preg_match('/[a-z]{3,}\s+[a-z]{3,}/i', (string) $d['participant_code'])) return 'Use an anonymous participant ID such as P-001, not a name.';
                return null;
            },
            'fields' => [
                'participant_code' => ['Anonymous participant ID', 'text', 'required' => true, 'help' => 'e.g. P-001'],
                'test_date' => ['Test date', 'date', 'required' => true],
                'age_range' => ['Age range', 'select', 'options' => enum_opts(['18-24', '25-34', '35-44', '45-54', '55+']), 'required' => true],
                'gender' => ['Gender (optional)', 'select', 'options' => ['PREFER_NOT_TO_SAY' => 'Prefer not to say', 'FEMALE' => 'Female', 'MALE' => 'Male', 'OTHER' => 'Other']],
                'language_code' => ['Language used', 'fk', 'sql' => 'SELECT code AS id, name AS label FROM languages ORDER BY sort_order', 'required' => true],
                'device' => ['Device', 'text', 'help' => 'e.g. Tecno Spark 8, Android 11, 3G'],
                'completion_time_seconds' => ['Total completion time (seconds)', 'int'],
                'errors_count' => ['Errors', 'int'],
                'ease_rating' => ['How easy was HerHealth to use? (1–5)', 'select', 'options' => ['' => '—', 1 => '1', 2 => '2', 3 => '3', 4 => '4', 5 => '5']],
                'understandability_rating' => ['Was the health information understandable? (1–5)', 'select', 'options' => ['' => '—', 1 => '1', 2 => '2', 3 => '3', 4 => '4', 5 => '5']],
                'useful_to_community' => ['Would HerHealth be useful to women or girls in your community?', 'select', 'options' => ['' => '—', 'YES' => 'Yes', 'NO' => 'No', 'UNSURE' => 'Unsure']],
                'difficult_text' => ['What was difficult to use?', 'textarea'],
                'improve_text' => ['What should we improve?', 'textarea'],
                'comments' => ['Facilitator comments', 'textarea'],
                'consent_confirmed' => ['Informed consent confirmed (adult participant)', 'bool'],
                'environment' => ['Environment', 'select', 'options' => ['testing' => 'Testing', 'pilot' => 'Pilot'], 'required' => true],
            ],
        ],

        'testing-changes' => [
            'table' => 'testing_changes', 'title' => 'Changes made because of testing', 'singular' => 'change', 'roles' => ['ANALYST', 'CONTENT_EDITOR'],
            'intro' => 'Evidence of learning (section 22): what testers found and what was changed as a result.',
            'list' => ['change_date', 'finding', 'change_made'], 'search' => ['finding', 'change_made'], 'order' => 'change_date DESC',
            'fields' => ['finding' => ['Finding', 'textarea', 'required' => true], 'change_made' => ['Change made', 'textarea', 'required' => true], 'change_date' => ['Date', 'date']],
        ],

        'categories' => [
            'table' => 'categories', 'title' => 'Categories', 'singular' => 'category', 'roles' => ['CONTENT_EDITOR'], 'list' => ['icon', 'name', 'slug', 'sort_order'], 'order' => 'sort_order',
            'delete_check' => fn($id) => Db::val('SELECT COUNT(*) FROM articles WHERE category_id = ?', [$id]) ? 'Move or delete the articles in this category first.' : null,
            'fields' => ['name' => ['Name', 'text', 'required' => true], 'slug' => ['Slug', 'text', 'required' => true], 'icon' => ['Icon (emoji)', 'text'], 'sort_order' => ['Order', 'int']],
        ],

        'users' => [
            'table' => 'admin_users', 'title' => 'Users & Roles', 'singular' => 'admin user', 'roles' => [],
            'intro' => 'Team accounts only — the public never has accounts. New users must change their password at first sign-in.',
            'list' => ['full_name', 'email', 'role', 'is_active', 'last_login_at'], 'search' => ['full_name', 'email'], 'filters' => ['role'], 'order' => 'full_name',
            'password' => true,
            'delete_check' => fn($id) => (int) $id === (int) ($_SESSION['admin_id'] ?? 0) ? 'You cannot delete your own account.' : null,
            'fields' => [
                'full_name' => ['Full name', 'text', 'required' => true], 'email' => ['E-mail', 'email', 'required' => true],
                'role' => ['Role', 'select', 'options' => enum_opts(Auth::ROLES), 'required' => true],
                'is_active' => ['Active', 'bool'], 'new_password' => ['Set password (min 12 characters)', 'password'],
                'must_change_password' => ['Must change password at next sign-in', 'bool'],
                'last_login_at' => ['Last sign-in (UTC)', 'readonly'],
            ],
        ],

        'audit-logs' => [
            'table' => 'audit_logs', 'title' => 'Audit log', 'singular' => 'entry', 'roles' => [], 'view_roles' => [], 'create' => false, 'delete' => false, 'readonly' => true,
            'list' => ['created_at', 'admin_id', 'action', 'entity', 'entity_id', 'details'], 'search' => ['action', 'entity', 'details'], 'filters' => ['entity', 'action'], 'order' => 'id DESC',
            'fields' => ['created_at' => ['Time (UTC)', 'readonly'], 'admin_id' => ['Admin', 'readonly'], 'action' => ['Action', 'readonly'], 'entity' => ['Entity', 'readonly'],
                'entity_id' => ['ID', 'readonly'], 'details' => ['Details', 'readonly']],
        ],

        'events' => [
            'table' => 'events', 'title' => 'Analytics events', 'singular' => 'event', 'roles' => [], 'view_roles' => ['ANALYST'], 'create' => false, 'delete' => false, 'readonly' => true,
            'list' => ['created_at', 'environment', 'event_type', 'language_code', 'article_id', 'meta'], 'filters' => ['environment', 'event_type'], 'order' => 'id DESC',
            'fields' => ['created_at' => ['Time (UTC)', 'readonly'], 'environment' => ['Environment', 'readonly'], 'event_type' => ['Event', 'readonly'],
                'language_code' => ['Language', 'readonly'], 'article_id' => ['Article', 'readonly'], 'meta' => ['Detail', 'readonly']],
        ],
    ];
    return $E;
}
