// HerHealth static preview — additional women's health content (second batch).
// Plain-language paraphrases written for this prototype from the official pages cited with each
// article (accessed 1 November 2026). Nothing is copied word for word. NOT yet reviewed by a
// HerHealth health reviewer. Figures are global or regional, not Liberia-specific. UK service names
// (GP, NHS 111) from NHS pages are replaced with "health worker" / "health facility".

const ACCESSED = "2026-11-01";
const who = (title, slug, date) => ({ org: "World Health Organization", title, url: `https://www.who.int/news-room/fact-sheets/detail/${slug}`, date, accessed: ACCESSED });

export const MORE_SOURCES = {
  whoEc: who("Emergency contraception (fact sheet)", "emergency-contraception", "9 Nov 2021"),
  whoAnaemia: who("Anaemia (fact sheet)", "anaemia", "10 Feb 2025"),
  whoMalaria: who("Malaria (fact sheet)", "malaria", "4 Dec 2025"),
  whoViolence: who("Violence against women (fact sheet)", "violence-against-women", "18 Jun 2026"),
  whoFgm: who("Female genital mutilation (fact sheet)", "female-genital-mutilation", "31 Jan 2025"),
  whoBreast: who("Breast cancer (fact sheet)", "breast-cancer", "3 Jul 2026"),
  whoMenopause: who("Menopause (fact sheet)", "menopause", "16 Oct 2024"),
  whoInfertility: who("Infertility (fact sheet)", "infertility", "28 Nov 2025"),
  whoEndo: who("Endometriosis (fact sheet)", "endometriosis", "15 Oct 2025"),
  whoPcos: who("Polycystic ovary syndrome (fact sheet)", "polycystic-ovary-syndrome", "22 Jan 2026"),
  whoNewborn: who("Newborn mortality (fact sheet)", "newborn-mortality", "14 Mar 2024"),
  nhsDischarge: { org: "NHS (UK)", title: "Vaginal discharge", url: "https://www.nhs.uk/conditions/vaginal-discharge/", date: "Last reviewed 15 Feb 2024", accessed: ACCESSED },
  nhsUti: { org: "NHS (UK)", title: "Urinary tract infections (UTIs)", url: "https://www.nhs.uk/conditions/urinary-tract-infections-utis/", date: "Last reviewed 11 Jul 2025", accessed: ACCESSED },
  unicefMenstrual: { org: "UNICEF", title: "Menstrual hygiene", url: "https://www.unicef.org/wash/menstrual-hygiene", date: "Undated page", accessed: ACCESSED },
};

export const MORE_CATEGORIES = [
  { slug: "womens-health", name: "Women's Health", icon: "🌺" },
  { slug: "safety-rights", name: "Safety & Rights", icon: "🛡️" },
];

export const MORE_ARTICLES = [
  // ---------------- Family planning ----------------
  {
    slug: "emergency-contraception",
    category: "family-planning",
    title: "Emergency contraception",
    summary: "What to do after sex without protection, or if a condom broke or a pill was missed.",
    body: [
      "Emergency contraception can prevent pregnancy after sex without contraception, if contraception failed (for example a condom broke or slipped, or pills were missed), or after sexual assault.",
      "The World Health Organization recommends using it within 5 days (120 hours) of unprotected sex. It works better the sooner it is used.",
      "There are emergency contraceptive pills and the copper IUD (coil). The copper IUD is the most effective emergency method, but it is not fitted after sexual assault because of the higher risk of infection.",
      "Any woman or girl of reproductive age can use emergency contraception — there are no age limits. It is not an abortion: it works by preventing or delaying the release of an egg, and it cannot end a pregnancy that has already started or harm a developing baby.",
      "Side effects such as nausea, tiredness or a little irregular bleeding are usually mild and pass on their own. Emergency contraception does not harm future fertility. If you need it often, a health worker can help you choose a regular method.",
    ],
    keyPoints: ["Use within 5 days of unprotected sex — the sooner the better.", "It does not cause abortion and does not harm future fertility.", "There is no age limit."],
    whenToGetHelp: ["Go to a health worker or health facility as soon as possible after unprotected sex.", "After sexual assault, a health facility can also offer other care and support."],
    sources: ["whoEc"],
    faqs: [
      { q: "What is emergency contraception?", tags: "morning after pill emergency contraceptive", a: "Emergency contraception can prevent pregnancy after sex without protection, if a condom broke or pills were missed, or after sexual assault. It comes as pills or a copper IUD (coil)." },
      { q: "How soon after sex do I need emergency contraception?", tags: "morning after pill time days hours late", a: "WHO recommends using emergency contraception within 5 days (120 hours) of unprotected sex. It works better the sooner it is used, so go to a health worker as soon as you can." },
      { q: "Does emergency contraception cause abortion?", tags: "morning after pill abortion pregnancy harm baby", a: "No. Emergency contraception prevents or delays the release of an egg. It cannot end a pregnancy that has already started and it does not harm a developing baby." },
      { q: "Can emergency contraception make me infertile?", tags: "morning after pill future fertility side effects", a: "No. WHO says emergency contraception does not harm future fertility. Side effects such as nausea or slight irregular bleeding are usually mild and pass on their own." },
      { q: "Can a young girl use emergency contraception?", tags: "teen age limit adolescent girl morning after", a: "Yes. WHO says any woman or girl of reproductive age can use emergency contraception, and there are no age limits." },
    ],
  },

  // ---------------- Menstrual health ----------------
  {
    slug: "menstrual-hygiene",
    category: "menstrual-health",
    title: "Managing your period with dignity",
    summary: "Why menstrual health matters, and what girls and women need to manage their periods well.",
    body: [
      "About 1.8 billion people around the world have a period every month. Periods are natural, but many girls and women cannot manage them in a healthy and dignified way.",
      "Stigma, teasing, cultural taboos, poverty, and a lack of toilets, water and period products can make periods hard. This can cause stress and worry, and can stop girls from going to school or taking part in community life.",
      "UNICEF says four things help: support from the people around you, knowledge and skills about periods, safe toilets and washing facilities, and access to pads or other absorbent materials.",
      "There is nothing shameful about having a period. Talking openly helps girls feel confident and safe.",
    ],
    keyPoints: ["Periods are natural and nothing to be ashamed of.", "Girls need support, knowledge, facilities and period products.", "No girl should have to miss school because of her period."],
    whenToGetHelp: ["If you have no safe way to manage your period, talk to a trusted adult, teacher or health worker.", "If your periods are very painful or very heavy, see a health worker."],
    sources: ["unicefMenstrual"],
    faqs: [
      { q: "Why do some girls miss school during their period?", tags: "school period stigma pads toilets miss class", a: "UNICEF says stigma, teasing, a lack of toilets, water and period products, and poverty can stop girls from going to school during their period. Support, knowledge, safe facilities and access to pads help girls stay in school." },
      { q: "Is it shameful to have a period?", tags: "shame embarrassed period taboo", a: "No. Periods are a natural part of life for about 1.8 billion people every month. There is nothing shameful about them, and talking openly helps girls feel confident and safe." },
    ],
  },
  {
    slug: "endometriosis",
    category: "menstrual-health",
    title: "Endometriosis",
    summary: "A common condition that can cause very painful periods and long-lasting pelvic pain.",
    body: [
      "Endometriosis is a long-lasting condition in which tissue similar to the lining of the womb grows outside the womb. It causes inflammation and scar tissue.",
      "It affects about 1 in 10 women of reproductive age around the world. Symptoms can include severe pain during periods, heavy periods, pelvic pain that continues after the period ends, bloating and nausea, and difficulty getting pregnant. It can also cause pain during sex, when passing urine or stools, and can affect mental health. Some women have no symptoms.",
      "Because symptoms vary, endometriosis is often found late — on average 4 to 12 years after symptoms start.",
      "There is no cure, but medicines (including pain relief and hormonal treatments), surgery for some women, physiotherapy and talking therapies can reduce pain and improve daily life. Fertility treatment may help women who want to become pregnant.",
    ],
    keyPoints: ["About 1 in 10 women have endometriosis.", "Severe period pain is not something you just have to live with.", "Treatment can control symptoms, even though there is no cure."],
    whenToGetHelp: ["Talk to a health worker about period pain that is severe or that stops your daily life.", "Tell a health worker if you have pelvic pain that does not go away when your period ends."],
    sources: ["whoEndo"],
    faqs: [
      { q: "What is endometriosis?", tags: "endometriosis womb lining pain", a: "Endometriosis is a long-lasting condition where tissue like the lining of the womb grows outside the womb, causing inflammation and scarring. It affects about 1 in 10 women of reproductive age." },
      { q: "What are the symptoms of endometriosis?", tags: "endometriosis signs severe period pain pelvic", a: "Symptoms can include severe period pain, heavy periods, pelvic pain that continues after your period, bloating, nausea, pain during sex, and difficulty getting pregnant. Some women have no symptoms." },
      { q: "Can endometriosis be cured?", tags: "endometriosis cure treatment", a: "There is no cure, but treatment helps. Medicines, surgery for some women, physiotherapy and talking therapies can reduce pain and improve daily life. A health worker can explain the options." },
    ],
  },

  // ---------------- Sexual health ----------------
  {
    slug: "vaginal-discharge",
    category: "sexual-health",
    title: "Vaginal discharge: what is normal",
    summary: "What healthy discharge looks like, signs of infection, and how to care for the area.",
    body: [
      "Vaginal discharge is normal and most women and girls have it. It keeps the vagina clean and moist and helps protect it from infection.",
      "Normal discharge has no strong or unpleasant smell and can be clear or white, thick and sticky, or slippery and wet. There may be more during pregnancy, when you are sexually active, when using contraception, and around the middle of your cycle.",
      "A change in smell, colour or texture can be a sign of infection. A fishy smell can mean bacterial vaginosis; thick white discharge like cottage cheese can mean thrush; green, yellow or frothy discharge can mean trichomoniasis; and discharge with pelvic pain, bleeding, blisters or sores can be a sign of a sexually transmitted infection.",
      "To avoid irritation, wash the skin around the vagina gently with water and mild, unperfumed soap. Do not use perfumed soaps, scented wipes or deodorants there, and do not wash inside the vagina (douching).",
    ],
    keyPoints: ["Discharge is normal and protects the vagina.", "Do not wash inside the vagina.", "A change in smell, colour or texture should be checked."],
    whenToGetHelp: [
      "Discharge that changes colour, smell or texture, or there is much more than usual.",
      "Itching or soreness, pain when you pass urine, or pelvic pain.",
      "Bleeding between periods or after sex.",
    ],
    sources: ["nhsDischarge"],
    faqs: [
      { q: "Is vaginal discharge normal?", tags: "discharge white normal vagina fluid", a: "Yes. Most women and girls have discharge. It keeps the vagina clean and moist and helps protect it from infection. Normal discharge is clear or white and has no strong or unpleasant smell." },
      { q: "When is vaginal discharge a sign of infection?", tags: "discharge smell colour green yellow fishy itching infection", a: "See a health worker if discharge changes colour, smell or texture, if there is much more than usual, or if you have itching, soreness, pain when passing urine, pelvic pain, or bleeding between periods or after sex. Do not try to diagnose it yourself." },
      { q: "How should I clean my private parts?", tags: "wash clean hygiene vagina soap douche", a: "Wash the skin around the vagina gently with water and mild, unperfumed soap. Do not use perfumed soaps, scented wipes or deodorants there, and do not wash inside the vagina, because it cleans itself." },
    ],
  },

  // ---------------- Pregnancy ----------------
  {
    slug: "malaria-in-pregnancy",
    category: "pregnancy",
    title: "Malaria and pregnancy",
    summary: "Why malaria is especially dangerous in pregnancy and how to protect yourself.",
    body: [
      "Malaria is spread by the bites of infected mosquitoes. It is a serious disease, but it can be prevented and cured. Africa carries about 95% of the world's malaria cases and deaths.",
      "Pregnant women and girls, babies and young children are at higher risk of severe malaria. Malaria in pregnancy can cause a baby to be born too early or too small.",
      "Protect yourself by sleeping under an insecticide-treated mosquito net, and by using repellent, protective clothing and window screens where you can. In pregnancy, health workers may offer preventive malaria treatment at antenatal check-ups.",
      "Early signs are fever, headache and chills, usually 10 to 15 days after a bite. Malaria can become severe very quickly, so a suspected case should be tested and treated straight away.",
    ],
    keyPoints: ["Sleep under a treated mosquito net every night.", "Ask about preventive malaria treatment at antenatal check-ups.", "Fever in pregnancy needs a malaria test straight away."],
    whenToGetHelp: [
      "Fever, headache or chills: get tested for malaria at a health facility the same day.",
      "Extreme tiredness, confusion, fits (convulsions), difficulty breathing, dark urine, yellow eyes or unusual bleeding are emergencies.",
    ],
    sources: ["whoMalaria"],
    faqs: [
      { q: "Is malaria dangerous in pregnancy?", tags: "malaria pregnant pregnancy baby risk harm affect unborn", a: "Yes. Pregnant women are at higher risk of severe malaria, and malaria in pregnancy can cause a baby to be born too early or too small. Sleep under a treated net and ask about preventive treatment at antenatal check-ups." },
      { q: "How can I prevent malaria?", tags: "malaria prevent mosquito net bite", a: "Sleep under an insecticide-treated mosquito net, and use repellent, protective clothing and window screens where you can. Pregnant women can ask about preventive malaria treatment at antenatal check-ups." },
      { q: "What are the signs of malaria?", tags: "malaria symptoms fever chills headache", a: "Early signs are fever, headache and chills. Severe signs include extreme tiredness, confusion, fits, difficulty breathing, dark urine, yellow eyes and unusual bleeding. Malaria can become severe quickly, so get tested and treated straight away." },
    ],
  },

  // ---------------- Maternal health ----------------
  {
    slug: "newborn-care",
    category: "maternal-health",
    title: "Caring for your newborn baby",
    summary: "Essential care in the first weeks, and the danger signs that need help fast.",
    body: [
      "The first month is the most dangerous time of a baby's life, and three-quarters of newborn deaths happen in the first week. Sub-Saharan Africa has the highest rate of newborn deaths in the world. Many can be prevented with simple care.",
      "Every baby needs: to be kept warm, especially with skin-to-skin contact with the mother; clean care of the umbilical cord and skin; early and exclusive breastfeeding; a check for health problems; and preventive care such as vaccines.",
      "Families should register the birth, bring the baby for vaccinations on time, and go to the postnatal check-ups. Staying at the health facility for 24 hours after birth is recommended.",
      "Babies born early or small need extra care: skin-to-skin warmth, help with breastfeeding, careful hand-washing and close watching for danger signs.",
    ],
    keyPoints: ["Keep your baby warm with skin-to-skin contact.", "Breastfeed early and give only breastmilk.", "Know the danger signs and act fast."],
    whenToGetHelp: [
      "The baby is not feeding well or stops feeding.",
      "The baby is less active than usual, has difficulty breathing, has a fever or feels cold.",
      "The baby has fits (convulsions). Go to a health facility immediately.",
    ],
    sources: ["whoNewborn"],
    faqs: [
      { q: "What are the danger signs in a newborn baby?", tags: "newborn baby danger signs sick infant", a: "Get help fast if your baby has feeding problems, is less active than usual, has difficulty breathing, has a fever or feels cold, or has fits (convulsions)." },
      { q: "How do I care for my newborn baby?", tags: "newborn care baby warm cord breastfeed", a: "Keep your baby warm with skin-to-skin contact, keep the umbilical cord and skin clean, breastfeed early and give only breastmilk, go to postnatal check-ups and get vaccinations on time." },
      { q: "How do I keep my newborn warm?", tags: "baby cold warm skin to skin", a: "Skin-to-skin contact between mother and baby is one of the best ways to keep a newborn warm. Babies born early or small especially need this warmth." },
    ],
  },

  // ---------------- Women's health ----------------
  {
    slug: "anaemia",
    category: "womens-health",
    title: "Anaemia (low blood)",
    summary: "Why anaemia is common in women and girls, its signs, and how to prevent it.",
    body: [
      "Anaemia means there are too few red blood cells or too little haemoglobin, so the body does not get enough oxygen. It is very common in women and girls — about 3 in 10 women and nearly 4 in 10 pregnant women worldwide — and Africa is among the most affected regions.",
      "Common signs are tiredness, dizziness, cold hands and feet, headache and shortness of breath when active. Severe anaemia can cause pale skin and nails and a fast heartbeat.",
      "Causes include lack of iron and other nutrients, blood loss from heavy periods or childbirth, and infections such as malaria and worms. In pregnancy, anaemia is linked to babies born early or small and to deaths of mothers.",
      "To help prevent it: eat iron-rich foods such as fish, meat, poultry, beans and dark green leafy vegetables, together with foods rich in vitamin C; avoid tea and coffee with iron-rich meals; prevent and treat malaria and worms; wash hands with soap and use clean toilets; space pregnancies at least 2 years apart; and get heavy periods treated. Take supplements only if a health worker recommends them.",
    ],
    keyPoints: ["Anaemia is very common in women and pregnant women.", "Eat iron-rich foods with vitamin C.", "Prevent malaria and treat heavy periods."],
    whenToGetHelp: ["If you often feel very tired, dizzy or short of breath.", "If you are pregnant, ask about anaemia checks at antenatal care.", "If your periods are very heavy."],
    sources: ["whoAnaemia"],
    faqs: [
      { q: "What is anaemia?", tags: "anaemia anemia low blood iron", a: "Anaemia means there are too few red blood cells or too little haemoglobin, so the body gets less oxygen. It is very common in women, girls and pregnant women." },
      { q: "What are the signs of anaemia?", tags: "anaemia anemia symptoms tired dizzy weak", a: "Common signs are tiredness, dizziness, cold hands and feet, headache and shortness of breath when active. Severe anaemia can cause pale skin and nails and a fast heartbeat." },
      { q: "How can I prevent anaemia?", tags: "anaemia anemia prevent iron food", a: "Eat iron-rich foods such as fish, meat, beans and dark green leafy vegetables with vitamin C-rich foods, avoid tea and coffee with those meals, prevent malaria and worms, space pregnancies at least 2 years apart, and get heavy periods treated. Take supplements only if a health worker recommends them." },
      { q: "What foods are rich in iron?", tags: "iron foods eat diet blood", a: "WHO lists lean red meat, fish, poultry, beans and other legumes, fortified cereals and dark green leafy vegetables. Eating vitamin C-rich foods at the same meal helps the body absorb the iron." },
    ],
  },
  {
    slug: "urinary-tract-infections",
    category: "womens-health",
    title: "Urinary tract infections (UTIs)",
    summary: "Common signs of a bladder infection and simple ways to help prevent it.",
    body: [
      "A urinary tract infection (UTI) is an infection of the bladder, urethra or kidneys, usually caused by bacteria from the bowel. Women get UTIs more easily than men because their urethra is shorter.",
      "Signs include pain or burning when passing urine, needing to pass urine more often or more urgently, cloudy or bloody urine, lower tummy pain or pain in the back just under the ribs, fever or shivering, and feeling tired or weak.",
      "Rest and drinking enough fluids can help. To help prevent UTIs: wipe from front to back after using the toilet, keep the area clean and dry, drink plenty of water, pass urine soon after sex, wear cotton underwear, do not hold in urine, and avoid scented soaps in the genital area.",
      "A kidney infection can be serious if it is not treated.",
    ],
    keyPoints: ["Wipe from front to back.", "Drink plenty of water and do not hold in urine.", "Pass urine soon after sex."],
    whenToGetHelp: [
      "If you are pregnant and have signs of a UTI, see a health worker quickly.",
      "Fever or shivering, pain in the back under the ribs, or blood in your urine.",
      "Symptoms that get worse quickly or keep coming back.",
      "Confusion, drowsiness or difficulty speaking: go to a health facility immediately.",
    ],
    sources: ["nhsUti"],
    faqs: [
      { q: "What are the signs of a urinary tract infection?", tags: "UTI bladder infection burning pee urine pain", a: "Signs include pain or burning when passing urine, needing to go more often or urgently, cloudy or bloody urine, lower tummy pain or back pain under the ribs, fever or shivering, and feeling tired or weak." },
      { q: "How can I prevent a UTI?", tags: "UTI bladder infection prevent", a: "Wipe from front to back, keep the area clean and dry, drink plenty of water, pass urine soon after sex, wear cotton underwear, do not hold in urine, and avoid scented soaps in the genital area." },
      { q: "When is a UTI serious?", tags: "UTI kidney infection serious pregnant", a: "See a health worker quickly if you are pregnant, have a fever or shivering, pain in the back under the ribs, blood in your urine, or symptoms that get worse or keep coming back. Confusion or drowsiness is an emergency." },
    ],
  },
  {
    slug: "pcos",
    category: "womens-health",
    title: "Polycystic ovary syndrome (PCOS)",
    summary: "A common hormone condition that can cause irregular periods, extra hair and difficulty getting pregnant.",
    body: [
      "PCOS is a common hormone condition, affecting about 1 in 10 women of reproductive age. Up to 70% of women with PCOS do not know they have it.",
      "Signs can include irregular, absent or sometimes heavy periods; difficulty getting pregnant; extra hair on the face or body; thinning hair on the head; and acne or oily skin. It is a leading cause of infertility.",
      "PCOS can raise the risk of diabetes, high blood pressure, heart disease and problems in pregnancy. It can also affect self-esteem and mood.",
      "There is no cure, but treatment can help with periods, skin and hair, and fertility, and can lower long-term health risks. Healthy eating and physical activity help all women with PCOS, even without weight loss.",
    ],
    keyPoints: ["About 1 in 10 women have PCOS — most don't know it.", "Irregular periods and extra hair are common signs.", "Treatment and healthy habits help, even without a cure."],
    whenToGetHelp: ["Talk to a health worker if your periods are irregular or absent, or if you have trouble getting pregnant."],
    sources: ["whoPcos"],
    faqs: [
      { q: "What is PCOS?", tags: "polycystic ovary syndrome hormones", a: "Polycystic ovary syndrome (PCOS) is a common hormone condition affecting about 1 in 10 women of reproductive age. Most women with PCOS don't know they have it." },
      { q: "What are the signs of PCOS?", tags: "PCOS symptoms irregular periods hair acne", a: "Signs can include irregular or absent periods, difficulty getting pregnant, extra hair on the face or body, thinning hair on the head, and acne or oily skin." },
      { q: "Can a woman with PCOS get pregnant?", tags: "PCOS pregnant fertility", a: "Yes, many can, with support. PCOS is a leading cause of infertility, but lifestyle changes and fertility treatments can help. Pregnancies may need extra check-ups." },
    ],
  },
  {
    slug: "infertility",
    category: "womens-health",
    title: "Difficulty getting pregnant (infertility)",
    summary: "What infertility is, its causes in both women and men, and how it can often be prevented.",
    body: [
      "Infertility means not becoming pregnant after 12 months or more of regular sex without contraception. About 1 in 6 people experience it during their lives.",
      "Infertility can be caused by problems in the man, the woman, or both — and sometimes no cause is found. Yet women are often blamed, and many face stigma, violence or divorce because of it.",
      "In women, causes include blocked fallopian tubes (often from untreated STIs, unsafe abortion, or infection after childbirth), conditions of the womb such as fibroids or endometriosis, and PCOS. In men, causes include blockages from injury or infection, hormone problems, and problems with sperm. Smoking, heavy drinking and obesity can affect both.",
      "Infertility can often be prevented: by preventing and treating STIs early, by avoiding unsafe abortion and infections after childbirth, and by healthy habits. Contraception does not cause infertility.",
    ],
    keyPoints: ["Men can be the cause as often as women.", "Untreated STIs are a preventable cause.", "Contraception does not cause infertility."],
    whenToGetHelp: ["If you have not become pregnant after 12 months of regular sex without contraception, a couple can talk to a health worker together."],
    sources: ["whoInfertility", "whoFp"],
    faqs: [
      { q: "What is infertility?", tags: "infertility cannot get pregnant barren", a: "Infertility means not becoming pregnant after 12 months or more of regular sex without contraception. About 1 in 6 people experience it during their lives." },
      { q: "Is infertility always the woman's fault?", tags: "infertility man woman blame husband cause", a: "No. Infertility can be caused by the man, the woman, or both, and sometimes no cause is found. Blaming women is unfair and harmful." },
      { q: "How can infertility be prevented?", tags: "infertility prevent STI", a: "Many causes can be prevented: get STIs tested and treated early, avoid unsafe abortion and infection after childbirth, and avoid smoking and heavy drinking." },
    ],
  },
  {
    slug: "breast-health",
    category: "womens-health",
    title: "Breast health and breast cancer",
    summary: "Know the changes to look for, and why seeing a health worker early matters.",
    body: [
      "Breast cancer is the most common cancer in women. Being a woman and getting older (over 40) are the biggest risk factors; most women who get it have no family history. Other risks include obesity, harmful alcohol use and tobacco.",
      "Know how your breasts normally look and feel. Signs to check include a lump or thickening (often painless), a change in size or shape, dimpling, redness or other skin changes, changes to the nipple, and bloody or unusual fluid from the nipple.",
      "Most breast lumps are not cancer. But any lump should be checked by a health worker, even if it does not hurt.",
      "Treatment works best when cancer is found early and the full treatment is completed.",
    ],
    keyPoints: ["Most breast lumps are not cancer — but get every lump checked.", "Painless lumps still need checking.", "Early treatment works best."],
    whenToGetHelp: ["A new lump or thickening in the breast or armpit.", "Changes in breast shape, skin, or nipple, or fluid from the nipple.", "A breast wound that does not heal."],
    sources: ["whoBreast"],
    faqs: [
      { q: "What are the signs of breast cancer?", tags: "breast cancer lump signs symptoms", a: "Signs include a lump or thickening (often painless), a change in breast size or shape, dimpling or redness of the skin, changes to the nipple, and bloody or unusual fluid from the nipple. See a health worker about any of these." },
      { q: "Is every breast lump cancer?", tags: "breast lump cancer worry", a: "No — most breast lumps are not cancer. But every lump should be checked by a health worker, even if it does not hurt." },
    ],
  },
  {
    slug: "menopause",
    category: "womens-health",
    title: "Menopause",
    summary: "When periods stop for good, common symptoms, and health after menopause.",
    body: [
      "Menopause is when monthly periods stop for good because the ovaries stop releasing eggs. It is confirmed after 12 months in a row without a period. Most women reach menopause between ages 45 and 55.",
      "The years before (perimenopause) can bring changes in periods, hot flushes and night sweats, vaginal dryness and pain during sex, leaking urine, trouble sleeping, and mood changes. Some women have few symptoms; others have symptoms that affect daily life.",
      "Pregnancy is still possible until periods have stopped for 12 months, so keep using contraception until then. STIs, including HIV, can still be caught after menopause.",
      "After menopause, bones get weaker and the risk of heart disease rises. Treatments are available for symptoms. Talk to a health worker — there is no need to feel embarrassed.",
    ],
    keyPoints: ["Menopause usually happens between 45 and 55.", "Use contraception until 12 months without a period.", "Treatments can ease symptoms — ask a health worker."],
    whenToGetHelp: ["If symptoms affect your health or daily life.", "Any bleeding after your periods have stopped for good should be checked."],
    sources: ["whoMenopause", "nhsPeriods"],
    faqs: [
      { q: "What is menopause?", tags: "menopause periods stop change of life when start age", a: "Menopause is when monthly periods stop for good because the ovaries stop releasing eggs. It is confirmed after 12 months in a row without a period, and usually happens between ages 45 and 55." },
      { q: "What are the symptoms of menopause?", tags: "menopause hot flushes sweats symptoms", a: "Symptoms can include changes in periods, hot flushes and night sweats, vaginal dryness and pain during sex, leaking urine, trouble sleeping, and mood changes. Treatments can help — talk to a health worker." },
      { q: "Can I get pregnant during menopause?", tags: "menopause pregnant contraception", a: "Pregnancy is still possible until your periods have stopped for 12 months in a row, so keep using contraception until then." },
    ],
  },

  // ---------------- Safety & rights ----------------
  {
    slug: "violence-against-women",
    category: "safety-rights",
    title: "Violence against women",
    summary: "What violence includes, how it harms health, and that support is available.",
    body: [
      "Violence against women includes physical, sexual and emotional harm, threats and controlling behaviour — by a partner, an ex-partner or anyone else. About 1 in 3 women worldwide have experienced physical or sexual violence. In sub-Saharan Africa, about 1 in 3 women have experienced violence from a partner.",
      "Violence harms health: injuries, pain, unwanted pregnancy, sexually transmitted infections including HIV, problems in pregnancy, and depression, anxiety and trouble sleeping. It also harms children who live with it.",
      "Violence is never the victim's fault. Health services can offer care, including sexual and reproductive health care and mental health support, and can connect survivors with other services.",
    ],
    keyPoints: ["Violence is never your fault.", "It includes physical, sexual and emotional abuse and control.", "Health services can help survivors."],
    whenToGetHelp: ["If you are hurt, a health facility can give you care.", "If you are in danger, get to a safe place and reach out to someone you trust or a support service."],
    sources: ["whoViolence"],
    faqs: [
      { q: "What counts as violence against women?", tags: "violence abuse partner husband control", a: "It includes physical, sexual and emotional harm, threats, and controlling behaviour by a partner, an ex-partner or anyone else. About 1 in 3 women worldwide have experienced physical or sexual violence. It is never the woman's fault." },
      { q: "How does violence affect a woman's health?", tags: "violence health effects abuse", a: "It can cause injuries, pain, unwanted pregnancy, STIs including HIV, problems in pregnancy, and depression, anxiety and trouble sleeping. Health services can offer care and support." },
    ],
  },
  {
    slug: "female-genital-mutilation",
    category: "safety-rights",
    title: "Female genital mutilation (FGM)",
    summary: "What FGM is, why it has no health benefits, and the harm it causes.",
    body: [
      "Female genital mutilation (FGM) means cutting or injuring a girl's or woman's genitals for non-medical reasons. It is mostly done to girls between infancy and adolescence.",
      "FGM has no health benefits. It can cause severe pain, heavy bleeding, infection, problems passing urine, shock and even death.",
      "Long-term, it can cause infections, painful periods and sex, scarring, mental distress, and serious problems during childbirth for both mother and baby.",
      "FGM is recognised internationally as a violation of the human rights of girls and women. WHO strongly urges health workers never to perform it — having it done by a health worker does not make it safe. Women who have had FGM can get care for its effects.",
    ],
    keyPoints: ["FGM has no health benefits.", "It can cause lifelong harm, including in childbirth.", "It is a violation of girls' and women's rights."],
    whenToGetHelp: ["If a girl is at risk of FGM, reach out to a trusted adult, health worker or support service.", "Women who have had FGM can ask a health worker for care, especially during pregnancy."],
    sources: ["whoFgm"],
    faqs: [
      { q: "What is female genital mutilation?", tags: "FGM cutting circumcision girls bush", a: "Female genital mutilation (FGM) means cutting or injuring a girl's or woman's genitals for non-medical reasons. It has no health benefits and is a violation of the human rights of girls and women." },
      { q: "What are the health effects of FGM?", tags: "FGM harm effects cutting childbirth", a: "FGM can cause severe pain, heavy bleeding, infection, shock and death at the time. Long-term, it can cause infections, painful periods and sex, scarring, mental distress, and serious problems during childbirth." },
      { q: "Is FGM safe if a health worker does it?", tags: "FGM medicalized nurse doctor safe", a: "No. WHO strongly urges health workers never to perform FGM. It has no health benefits however it is done." },
    ],
  },
];
