-- HerHealth Liberia — MySQL / MariaDB schema (Functional MVP 0.1)
-- Engine: InnoDB, charset utf8mb4. Requires MySQL 5.7+ / MariaDB 10.3+.
-- Privacy rule: no table stores raw health questions, names of public users, phone numbers of
-- public users or IP addresses. Rate limiting stores only a keyed hash with a short time window.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_test_tasks, user_tests, testing_changes, safety_results, safety_runs, safety_cases,
  safety_terms, safety_messages, ai_interactions, events, feedback, audio_lessons, article_translations,
  article_versions, article_sources, article_clinical_reviews, knowledge_chunks, articles, categories, sources,
  clinical_reviews, facility_services, facilities, languages, audit_logs, admin_users, settings, rate_limits;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------- administration

CREATE TABLE admin_users (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name            VARCHAR(120) NOT NULL,
  email                VARCHAR(190) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  role                 ENUM('ADMIN','CONTENT_EDITOR','CLINICAL_REVIEWER','LANGUAGE_REVIEWER','FACILITY_VERIFIER','ANALYST') NOT NULL DEFAULT 'ANALYST',
  is_active            TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  failed_attempts      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until         DATETIME NULL,
  last_login_at        DATETIME NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT UNSIGNED NULL,
  action      VARCHAR(60)  NOT NULL,
  entity      VARCHAR(60)  NOT NULL,
  entity_id   VARCHAR(60)  NULL,
  details     TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_created (created_at),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  skey        VARCHAR(80) PRIMARY KEY,
  svalue      TEXT NULL,
  description VARCHAR(255) NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rate_limits (
  bucket       VARCHAR(40) NOT NULL,
  key_hash     CHAR(64)    NOT NULL,
  window_start DATETIME    NOT NULL,
  hits         INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, key_hash),
  INDEX idx_rl_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- languages (section 10/11)
-- UI strings live in /locales/<code>.json; this table records each language's validation status.

CREATE TABLE languages (
  code            VARCHAR(16) PRIMARY KEY,
  name            VARCHAR(80) NOT NULL,
  native_name     VARCHAR(80) NOT NULL,
  status          ENUM('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
  is_public       TINYINT(1) NOT NULL DEFAULT 0,
  is_default      TINYINT(1) NOT NULL DEFAULT 0,
  translator      VARCHAR(120) NULL,
  reviewer        VARCHAR(120) NULL,
  review_date     DATE NULL,
  notes           TEXT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- clinical review register (section 4)

CREATE TABLE clinical_reviews (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reviewer_full_name       VARCHAR(160) NOT NULL,
  public_display_name      VARCHAR(160) NULL,
  professional_qualification VARCHAR(160) NOT NULL,
  regulatory_authority     VARCHAR(160) NOT NULL,
  license_number           VARCHAR(80)  NULL COMMENT 'Internal due-diligence only',
  license_public_consent   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Publish licence number only with express consent',
  organization_position    VARCHAR(200) NULL,
  years_experience         VARCHAR(40)  NULL,
  content_version_reviewed VARCHAR(120) NULL,
  scope_of_review          TEXT NULL,
  review_date              DATE NULL,
  decision                 ENUM('PENDING','CHANGES_REQUIRED','APPROVED','SUPERSEDED') NOT NULL DEFAULT 'PENDING',
  comments                 TEXT NULL,
  approval_reference       VARCHAR(200) NULL COMMENT 'Signature / approval reference',
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cr_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- health content (sections 6, 28)

CREATE TABLE categories (
  id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL,
  icon        VARCHAR(16) NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sources (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_key       VARCHAR(60) NOT NULL UNIQUE,
  organization     VARCHAR(160) NOT NULL,
  title            VARCHAR(300) NOT NULL,
  url              VARCHAR(500) NOT NULL,
  publication_date VARCHAR(80) NULL COMMENT 'Publication / update date as stated by the source',
  access_date      DATE NULL,
  licence_note     VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE articles (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_code           VARCHAR(20) NOT NULL UNIQUE,
  slug                   VARCHAR(120) NOT NULL UNIQUE,
  category_id            SMALLINT UNSIGNED NOT NULL,
  title                  VARCHAR(200) NOT NULL,
  summary                VARCHAR(500) NOT NULL,
  body                   MEDIUMTEXT NOT NULL COMMENT 'Paragraphs separated by blank lines',
  key_points             TEXT NULL COMMENT 'One per line',
  when_to_get_help       TEXT NULL COMMENT 'One per line',
  version                VARCHAR(20) NOT NULL DEFAULT '1.0',
  content_status         ENUM('DRAFT','CLINICAL_REVIEW','APPROVED','TRANSLATION','LANGUAGE_REVIEW','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  clinical_review_status ENUM('NOT_REVIEWED','PENDING','CHANGES_REQUIRED','APPROVED','SUPERSEDED') NOT NULL DEFAULT 'NOT_REVIEWED',
  clinical_review_date   DATE NULL,
  is_priority_audio      TINYINT(1) NOT NULL DEFAULT 0,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_article_status (content_status, clinical_review_status),
  CONSTRAINT fk_article_category FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Which approved clinical-review records cover which article
CREATE TABLE article_clinical_reviews (
  article_id         INT UNSIGNED NOT NULL,
  clinical_review_id INT UNSIGNED NOT NULL,
  article_version    VARCHAR(20) NOT NULL,
  linked_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id, clinical_review_id, article_version),
  CONSTRAINT fk_acr_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_acr_review  FOREIGN KEY (clinical_review_id) REFERENCES clinical_reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE article_sources (
  article_id    INT UNSIGNED NOT NULL,
  source_id     INT UNSIGNED NOT NULL,
  relevance     VARCHAR(255) NULL,
  PRIMARY KEY (article_id, source_id),
  CONSTRAINT fk_as_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_as_source  FOREIGN KEY (source_id)  REFERENCES sources(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Immutable snapshot of every saved version (version control)
CREATE TABLE article_versions (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id            INT UNSIGNED NOT NULL,
  version               VARCHAR(20) NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  summary               VARCHAR(500) NOT NULL,
  body                  MEDIUMTEXT NOT NULL,
  key_points            TEXT NULL,
  when_to_get_help      TEXT NULL,
  content_status        VARCHAR(30) NOT NULL,
  medically_significant TINYINT(1) NOT NULL DEFAULT 0,
  change_note           VARCHAR(500) NULL,
  created_by            INT UNSIGNED NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_av_article (article_id, created_at),
  CONSTRAINT fk_av_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_av_admin   FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approved knowledge used by Ask HerHealth (question/answer passages). Only rows whose article is
-- clinically APPROVED and APPROVED/PUBLISHED are ever retrieved.
CREATE TABLE knowledge_chunks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id  INT UNSIGNED NOT NULL,
  question    VARCHAR(300) NOT NULL,
  tags        VARCHAR(400) NULL,
  answer      TEXT NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_chunk (question, tags, answer),
  CONSTRAINT fk_kc_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Translation workflow (section 10/11)
CREATE TABLE article_translations (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id             INT UNSIGNED NOT NULL,
  language_code          VARCHAR(16) NOT NULL,
  source_article_version VARCHAR(20) NOT NULL,
  version                VARCHAR(20) NOT NULL DEFAULT '1.0',
  title                  VARCHAR(200) NOT NULL,
  summary                VARCHAR(500) NOT NULL,
  body                   MEDIUMTEXT NOT NULL,
  key_points             TEXT NULL,
  when_to_get_help       TEXT NULL,
  translator             VARCHAR(120) NULL,
  reviewer               VARCHAR(120) NULL COMMENT 'Fluent / native-language reviewer',
  terminology_reviewer   VARCHAR(120) NULL COMMENT 'Health terminology review',
  comprehension_checked  TINYINT(1) NOT NULL DEFAULT 0,
  is_machine_draft       TINYINT(1) NOT NULL DEFAULT 0,
  status                 ENUM('DRAFT','NATIVE_REVIEW','TERMINOLOGY_REVIEW','COMPREHENSION_CHECK','APPROVED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  review_date            DATE NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_translation (article_id, language_code),
  CONSTRAINT fk_tr_article  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_tr_language FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audio lessons (section 12)
CREATE TABLE audio_lessons (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id       INT UNSIGNED NOT NULL,
  language_code    VARCHAR(16) NOT NULL,
  title            VARCHAR(200) NOT NULL,
  file_path        VARCHAR(255) NULL COMMENT 'Relative to public/uploads/audio',
  mime_type        VARCHAR(60) NULL,
  size_bytes       INT UNSIGNED NULL,
  duration_seconds SMALLINT UNSIGNED NULL,
  voice_type       ENUM('HUMAN','DEVICE_TTS') NOT NULL DEFAULT 'HUMAN',
  narrator         VARCHAR(120) NULL,
  transcript       MEDIUMTEXT NOT NULL,
  status           ENUM('DRAFT','REVIEW','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_audio_article (article_id, language_code, status),
  CONSTRAINT fk_audio_article  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_audio_language FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- verified health facilities (section 13)

CREATE TABLE facilities (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(200) NOT NULL,
  facility_type        ENUM('HOSPITAL','HEALTH_CENTER','CLINIC','HELPLINE','SUPPORT_SERVICE','OTHER') NOT NULL DEFAULT 'HOSPITAL',
  county               ENUM('Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh','Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba','River Cess','River Gee','Sinoe') NOT NULL,
  district             VARCHAR(120) NULL,
  location_detail      VARCHAR(255) NULL,
  telephone            VARCHAR(40) NULL COMMENT 'Only when verified',
  telephone_verified   TINYINT(1) NOT NULL DEFAULT 0,
  latitude             DECIMAL(9,6) NULL,
  longitude            DECIMAL(9,6) NULL,
  coordinates_verified TINYINT(1) NOT NULL DEFAULT 0,
  opening_hours        VARCHAR(160) NULL,
  verification_source  VARCHAR(255) NULL,
  verified_by          VARCHAR(120) NULL,
  verification_date    DATE NULL,
  last_reverified_date DATE NULL,
  status               ENUM('PENDING_VERIFICATION','VERIFIED','NEEDS_REVERIFICATION','INACTIVE') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  internal_notes       TEXT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fac_county_status (county, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE facility_services (
  facility_id INT UNSIGNED NOT NULL,
  service     ENUM('MATERNAL','ANTENATAL','FAMILY_PLANNING','HIV_STI','ADOLESCENT','EMERGENCY','GBV_SUPPORT','CERVICAL_SCREENING','GENERAL') NOT NULL,
  verified    TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (facility_id, service),
  CONSTRAINT fk_fs_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- AI safety (sections 7, 8, 9)

CREATE TABLE safety_terms (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  level       ENUM('RED','PROTECTION','MENTAL_HEALTH_CRISIS','AMBER') NOT NULL,
  term        VARCHAR(120) NOT NULL COMMENT 'Word stems; "a + b" means both phrases must appear',
  status      ENUM('PROVISIONAL','CLINICALLY_VALIDATED','PROPOSED','REJECTED') NOT NULL DEFAULT 'PROVISIONAL',
  rationale   TEXT NULL,
  decided_by  VARCHAR(160) NULL,
  decided_at  DATE NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_term (level, term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE safety_messages (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pathway       ENUM('EMERGENCY','PROTECTION','MENTAL_HEALTH_CRISIS','MEDICATION','OUT_OF_SCOPE','FALLBACK') NOT NULL,
  language_code VARCHAR(16) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  body          TEXT NOT NULL,
  status        ENUM('PROVISIONAL','CLINICALLY_VALIDATED') NOT NULL DEFAULT 'PROVISIONAL',
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_msg (pathway, language_code),
  CONSTRAINT fk_msg_language FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE safety_cases (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                  VARCHAR(20) NOT NULL UNIQUE,
  category              VARCHAR(40) NOT NULL,
  question              VARCHAR(400) NOT NULL COMMENT 'Synthetic test question, not user data',
  expected_risk         ENUM('GREEN','AMBER','RED','PROTECTION','MENTAL_HEALTH_CRISIS') NOT NULL,
  also_acceptable_risk  VARCHAR(120) NULL COMMENT 'Comma separated',
  expected_pathways     VARCHAR(120) NOT NULL COMMENT 'Comma separated',
  clinical_status       ENUM('PROVISIONAL','AWAITING_CLINICAL_DECISION','CLINICALLY_VALIDATED') NOT NULL DEFAULT 'PROVISIONAL',
  clinical_note         TEXT NULL,
  is_active             TINYINT(1) NOT NULL DEFAULT 1,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE safety_runs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  environment   VARCHAR(20) NOT NULL,
  provider      VARCHAR(40) NOT NULL,
  total         SMALLINT UNSIGNED NOT NULL,
  passed        SMALLINT UNSIGNED NOT NULL,
  red_total     SMALLINT UNSIGNED NOT NULL,
  red_passed    SMALLINT UNSIGNED NOT NULL,
  lexicon_hash  CHAR(64) NOT NULL,
  triggered_by  VARCHAR(160) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE safety_results (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  run_id          INT UNSIGNED NOT NULL,
  case_id         INT UNSIGNED NOT NULL,
  actual_risk     VARCHAR(30) NOT NULL,
  actual_pathway  VARCHAR(30) NOT NULL,
  passed          TINYINT(1) NOT NULL,
  detail          VARCHAR(255) NULL,
  INDEX idx_sr_run (run_id),
  CONSTRAINT fk_sr_run  FOREIGN KEY (run_id)  REFERENCES safety_runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_sr_case FOREIGN KEY (case_id) REFERENCES safety_cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI interaction metadata only. The raw question is NEVER stored.
CREATE TABLE ai_interactions (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  environment        ENUM('development','testing','pilot','production') NOT NULL,
  session_hash       CHAR(64) NULL,
  language_code      VARCHAR(16) NOT NULL,
  input_mode         ENUM('TEXT','VOICE') NOT NULL DEFAULT 'TEXT',
  risk_level         VARCHAR(30) NOT NULL,
  pathway            VARCHAR(30) NOT NULL,
  topic_category     VARCHAR(80) NULL,
  matched_article_id INT UNSIGNED NULL,
  confidence         DECIMAL(4,3) NULL,
  provider           VARCHAR(40) NOT NULL,
  postcheck_flag     VARCHAR(60) NULL,
  latency_ms         INT UNSIGNED NULL,
  reviewed_status    ENUM('UNREVIEWED','OK','CONCERN') NOT NULL DEFAULT 'UNREVIEWED',
  review_note        VARCHAR(500) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_env_created (environment, created_at),
  INDEX idx_ai_pathway (pathway),
  CONSTRAINT fk_ai_article FOREIGN KEY (matched_article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- analytics & feedback (sections 17–19)

CREATE TABLE events (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  environment   ENUM('development','testing','pilot','production') NOT NULL,
  event_type    ENUM('app_open','session_start','article_view','audio_started','audio_completed','question_asked',
                     'question_supported','referral_search','language_selected','feedback_submitted','quick_exit','offline_save') NOT NULL,
  anon_user     CHAR(64) NULL COMMENT 'HMAC of a random device id; not linkable to a person',
  session_hash  CHAR(64) NULL,
  language_code VARCHAR(16) NULL,
  article_id    INT UNSIGNED NULL,
  meta          VARCHAR(120) NULL COMMENT 'Non-identifying detail, e.g. county searched, pathway',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ev_env_type (environment, event_type, created_at),
  INDEX idx_ev_user (anon_user),
  CONSTRAINT fk_ev_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  environment   ENUM('development','testing','pilot','production') NOT NULL,
  target_type   ENUM('ARTICLE','ANSWER','APP') NOT NULL DEFAULT 'APP',
  article_id    INT UNSIGNED NULL,
  useful        ENUM('YES','NO') NULL,
  rating        TINYINT UNSIGNED NULL,
  comment       VARCHAR(1000) NULL COMMENT 'Identifiers stripped before saving; deleted after 12 months',
  language_code VARCHAR(16) NULL,
  status        ENUM('NEW','REVIEWED','ACTIONED','DISMISSED') NOT NULL DEFAULT 'NEW',
  admin_note    VARCHAR(500) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fb_env (environment, created_at),
  CONSTRAINT fk_fb_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- structured user testing (sections 20–22)

CREATE TABLE user_tests (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  participant_code         VARCHAR(20) NOT NULL UNIQUE COMMENT 'Anonymous ID e.g. P-001; never a name',
  age_range                ENUM('18-24','25-34','35-44','45-54','55+') NOT NULL,
  gender                   ENUM('FEMALE','MALE','OTHER','PREFER_NOT_TO_SAY') NOT NULL DEFAULT 'PREFER_NOT_TO_SAY',
  language_code            VARCHAR(16) NOT NULL,
  device                   VARCHAR(120) NULL,
  completion_time_seconds  INT UNSIGNED NULL,
  errors_count             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ease_rating              TINYINT UNSIGNED NULL,
  understandability_rating TINYINT UNSIGNED NULL,
  useful_to_community      ENUM('YES','NO','UNSURE') NULL,
  difficult_text           TEXT NULL,
  improve_text             TEXT NULL,
  comments                 TEXT NULL,
  consent_confirmed        TINYINT(1) NOT NULL DEFAULT 0,
  test_date                DATE NOT NULL,
  environment              ENUM('testing','pilot') NOT NULL DEFAULT 'testing',
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_ease CHECK (ease_rating IS NULL OR ease_rating BETWEEN 1 AND 5),
  CONSTRAINT chk_under CHECK (understandability_rating IS NULL OR understandability_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_test_tasks (
  user_test_id INT UNSIGNED NOT NULL,
  task_no      TINYINT UNSIGNED NOT NULL,
  attempted    TINYINT(1) NOT NULL DEFAULT 0,
  completed    TINYINT(1) NOT NULL DEFAULT 0,
  seconds      INT UNSIGNED NULL,
  errors       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_test_id, task_no),
  CONSTRAINT fk_utt_test FOREIGN KEY (user_test_id) REFERENCES user_tests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What changed because of testing (evidence of learning)
CREATE TABLE testing_changes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  finding      TEXT NOT NULL,
  change_made  TEXT NOT NULL,
  change_date  DATE NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
