// HerHealth static preview — health content.
//
// Every article and answer below is a plain-language paraphrase written for this prototype from the
// official public pages cited with it (accessed 31 October 2026). Nothing is copied word for word.
// Status: NOT yet reviewed by a HerHealth health reviewer. A qualified health professional must
// review each item before the service is used by the public. Figures are global or regional, not
// Liberia-specific.

import { MORE_ARTICLES, MORE_CATEGORIES, MORE_SOURCES } from "./content-more.js";

const ACCESSED = "2026-10-31";
export const REVIEW_STATUS = "Sourced from official health organisations · Awaiting review by a HerHealth health reviewer";

export const SOURCES = {
  nhsPeriods: { org: "NHS (UK)", title: "Periods", url: "https://www.nhs.uk/conditions/periods/", date: "Last reviewed 5 Jan 2023 (review overdue)", accessed: ACCESSED },
  nhsPain: { org: "NHS (UK)", title: "Period pain", url: "https://www.nhs.uk/conditions/period-pain/", date: "Last reviewed 18 Mar 2026", accessed: ACCESSED },
  nhsHeavy: { org: "NHS (UK)", title: "Heavy periods", url: "https://www.nhs.uk/conditions/heavy-periods/", date: "Last reviewed 19 Sep 2024", accessed: ACCESSED },
  whoAnc: {
    org: "World Health Organization",
    title: "Pregnant women must be able to access the right care at the right time",
    url: "https://www.who.int/news/item/07-11-2016-pregnant-women-must-be-able-to-access-the-right-care-at-the-right-time-says-who",
    date: "7 Nov 2016",
    accessed: ACCESSED,
  },
  whoMaternal: { org: "World Health Organization", title: "Maternal mortality (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/maternal-mortality", date: "7 Apr 2025", accessed: ACCESSED },
  whoAdolescentPreg: { org: "World Health Organization", title: "Adolescent pregnancy (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/adolescent-pregnancy", date: "10 Apr 2024", accessed: ACCESSED },
  whoFp: { org: "World Health Organization", title: "Family planning/contraception methods (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception", date: "3 Jul 2025", accessed: ACCESSED },
  whoSti: { org: "World Health Organization", title: "Sexually transmitted infections (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/sexually-transmitted-infections-(stis)", date: "10 Sep 2025", accessed: ACCESSED },
  whoHiv: { org: "World Health Organization", title: "HIV and AIDS (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/hiv-aids", date: "27 Jul 2026", accessed: ACCESSED },
  whoCervical: { org: "World Health Organization", title: "Cervical cancer (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/cervical-cancer", date: "3 Jul 2026", accessed: ACCESSED },
  whoPostnatal: {
    org: "World Health Organization",
    title: "WHO urges quality care for women and newborns in critical first weeks after childbirth",
    url: "https://www.who.int/news/item/30-03-2022-who-urges-quality-care-for-women-and-newborns-in-critical-first-weeks-after-childbirth",
    date: "30 Mar 2022",
    accessed: ACCESSED,
  },
  whoBreastfeeding: { org: "World Health Organization", title: "Breastfeeding (health topic)", url: "https://www.who.int/health-topics/breastfeeding", date: "Living page", accessed: ACCESSED },
  whoTeenMental: { org: "World Health Organization", title: "Mental health of adolescents (fact sheet)", url: "https://www.who.int/news-room/fact-sheets/detail/mental-health-of-adolescents", date: "1 Sep 2025", accessed: ACCESSED },
};

export const CATEGORIES = [
  { slug: "menstrual-health", name: "Menstrual Health", icon: "🌸" },
  { slug: "pregnancy", name: "Pregnancy", icon: "🤰" },
  { slug: "family-planning", name: "Family Planning", icon: "💊" },
  { slug: "sexual-health", name: "Sexual Health", icon: "💜" },
  { slug: "sti-hiv", name: "STIs & HIV", icon: "🎗️" },
  { slug: "hpv-cervical", name: "HPV & Cervical Health", icon: "🩺" },
  { slug: "maternal-health", name: "Maternal Health", icon: "👶" },
  { slug: "mental-wellbeing", name: "Mental Wellbeing", icon: "🧠" },
];

export const ARTICLES = [
  // ---------------- Menstrual health ----------------
  {
    slug: "understanding-your-period",
    category: "menstrual-health",
    title: "Understanding your period",
    summary: "What a period is, how long a normal cycle lasts, and what you can use during your period.",
    body: [
      "A period is the part of the monthly cycle when blood comes out of the vagina for a few days. It is a normal part of a healthy body.",
      "Most periods come about every 28 days, but anywhere from every 21 to 35 days is common. Bleeding usually lasts 2 to 7 days, often about 5, and is heaviest in the first 2 days. The blood is red on heavy days and can be pink or brown on lighter days.",
      "Periods usually start around age 12, but starting earlier or later is common and not usually a worry. For most girls, periods become regular by about age 16 to 18.",
      "Before a period some people feel bloated, have sore breasts, mood changes, spots or headaches. This usually gets better when the period starts. Not everyone gets these feelings.",
      "You can use pads (including washable, reusable pads), tampons, menstrual cups or period underwear. A tampon that is put in correctly should not be felt, and it cannot get lost inside the body.",
    ],
    keyPoints: ["A cycle of 21 to 35 days is common.", "Bleeding for 2 to 7 days is common.", "Periods often start around age 12 and become regular by 16 to 18."],
    whenToGetHelp: [
      "Bleeding between periods, after sex, or after your periods have stopped for good (menopause).",
      "Missing three periods in a row when you are not pregnant.",
      "Any big change in your periods that worries you.",
    ],
    sources: ["nhsPeriods"],
    faqs: [
      { q: "What is a period?", tags: "menstruation monthly bleeding", a: "A period is when blood comes out of the vagina for a few days as part of the monthly cycle. It is a normal sign that the body is working as expected." },
      { q: "How long is a normal menstrual cycle?", tags: "cycle length regular how often period come days", a: "Most periods come about every 28 days, but every 21 to 35 days is common. Bleeding usually lasts 2 to 7 days, and is heaviest in the first 2 days." },
      { q: "At what age do periods start?", tags: "first period age girl puberty start late early", a: "Periods usually start around age 12. Starting a little earlier or later is common and is not usually a worry. Most girls have regular periods by about 16 to 18." },
      { q: "What can I use during my period?", tags: "pads tampons cup period products hygiene sanitary", a: "You can use pads (including washable, reusable pads), tampons, menstrual cups or period underwear. Choose what is comfortable and available to you. A tampon cannot get lost inside the body." },
      { q: "When should I see a health worker about my periods?", tags: "worry problem irregular missed period bleeding between", a: "See a health worker if you bleed between periods or after sex, if you bleed after your periods have stopped for good, or if you have missed three periods in a row and are not pregnant." },
    ],
  },
  {
    slug: "period-pain",
    category: "menstrual-health",
    title: "Period pain",
    summary: "Why periods can hurt, what you can do at home, and when pain needs a health worker.",
    body: [
      "Period pain is common. It happens because the womb tightens during a period. It is often felt as cramps in the lower tummy that can spread to the back and thighs, and it usually lasts up to 3 days.",
      "Things that can help at home include a warm bath or shower, a hot water bottle wrapped in a cloth on your tummy, gently rubbing your tummy and back, and gentle exercise such as walking. Cutting down on alcohol and not smoking may also help.",
      "Sometimes painful periods are caused by a health condition, such as endometriosis, fibroids or an infection in the pelvis. A coil (IUD) can also cause pain in the first months after it is fitted.",
      "HerHealth does not recommend medicines or doses. A health worker or pharmacist can advise you on what is safe for you.",
    ],
    keyPoints: ["Period pain is often normal.", "Warmth, gentle massage and gentle exercise can help.", "Pain that stops your daily life should be checked."],
    whenToGetHelp: [
      "Pain that is severe, worse than usual, or not helped by the things you usually do.",
      "Pain that stops you from doing your normal daily activities.",
      "Periods that become more painful, heavier or irregular.",
      "Pain during sex, or when you pee or poo, or bleeding between periods.",
      "A swollen tummy, loss of appetite, or losing weight without trying.",
    ],
    sources: ["nhsPain"],
    faqs: [
      { q: "Is period pain normal?", tags: "cramps hurt stomach tummy ache", a: "Some period pain is common. It happens because the womb tightens during your period, and it usually lasts up to 3 days. Pain that is severe, getting worse, or stops your normal daily life should be checked by a health worker." },
      { q: "What can I do at home for period pain?", tags: "relief help cramps remedy home ease", a: "A warm bath or shower, a hot water bottle wrapped in a cloth on your tummy, gently rubbing your tummy and back, and gentle exercise such as walking can help. Cutting down on alcohol and not smoking may also help." },
      { q: "When is period pain a sign of a problem?", tags: "severe bad worse doctor problem", a: "Get help if the pain is severe or worse than usual, stops your daily activities, or comes with heavier or irregular periods, pain during sex or when you pee or poo, bleeding between periods, a swollen tummy or weight loss." },
    ],
  },
  {
    slug: "heavy-periods",
    category: "menstrual-health",
    title: "Heavy periods",
    summary: "How to tell if your periods are heavy, what can cause it, and when to get checked.",
    body: [
      "Many women have heavy periods, and for some this is normal. But if heavy bleeding affects your daily life, a health worker can help.",
      "Signs of heavy periods include needing to change a pad or tampon every 1 to 2 hours, needing to use two products at once, bleeding for more than 7 days, passing blood clots bigger than about 2.5 cm, bleeding through to clothes or bedding, or often feeling tired or short of breath.",
      "Heavy periods can happen when periods first start, after pregnancy, or as a woman gets close to menopause. They can also be caused by conditions of the womb or ovaries, bleeding disorders, or some medicines. Rarely, they can be a sign of cancer of the womb.",
      "A health worker may do blood tests, for example to check for a low blood count (anaemia).",
    ],
    keyPoints: ["Changing a pad every 1 to 2 hours is a sign of heavy bleeding.", "Periods lasting more than 7 days should be checked.", "Feeling very tired or short of breath can be linked to heavy periods."],
    whenToGetHelp: [
      "Heavy periods that affect your life, or that you have had for some time.",
      "Severe pain during periods.",
      "Bleeding between periods or after sex.",
    ],
    sources: ["nhsHeavy"],
    faqs: [
      { q: "How do I know if my period is too heavy?", tags: "heavy flow lot of blood clots change pad often", a: "Signs include changing a pad or tampon every 1 to 2 hours, using two products at once, bleeding for more than 7 days, clots bigger than about 2.5 cm, bleeding through clothes, or often feeling tired or short of breath." },
      { q: "What causes heavy periods?", tags: "reason cause why heavy flow", a: "Heavy periods can happen when periods first start, after pregnancy, or near menopause. They can also be caused by conditions of the womb or ovaries, bleeding disorders or some medicines. Rarely, they can be a sign of womb cancer, so ongoing heavy periods should be checked." },
    ],
  },

  // ---------------- Pregnancy ----------------
  {
    slug: "antenatal-care",
    category: "pregnancy",
    title: "Antenatal care: check-ups during pregnancy",
    summary: "When to start pregnancy check-ups, how many to have, and what happens at them.",
    body: [
      "Antenatal care means the check-ups a woman has with a midwife or other trained health worker while she is pregnant. These visits help keep mother and baby healthy.",
      "The World Health Organization recommends that the first check-up happens in the first 12 weeks of pregnancy, and that a pregnant woman has at least eight contacts in total. After the first, contacts are suggested at about 20, 26, 30, 34, 36, 38 and 40 weeks.",
      "At these visits health workers can talk with you about healthy eating and which vitamins or minerals you may need, physical activity, avoiding tobacco, alcohol and drugs, and preventing malaria and HIV. You may have blood tests, a tetanus vaccination and a scan to check on the baby.",
      "Health workers can also help with common problems such as nausea, back pain and constipation, talk about family planning for after the birth, and support women who are experiencing violence from a partner.",
    ],
    keyPoints: ["Start check-ups in the first 12 weeks of pregnancy.", "Aim for at least eight antenatal contacts.", "Check-ups cover nutrition, malaria and HIV prevention, tests and vaccination."],
    whenToGetHelp: ["Go for your first check-up as soon as you know you are pregnant, ideally in the first 12 weeks.", "If you have heavy bleeding or fits (convulsions), go to a health facility immediately."],
    sources: ["whoAnc"],
    faqs: [
      { q: "When should I start antenatal care?", tags: "first check up pregnancy visit clinic start ANC", a: "The World Health Organization recommends your first antenatal check-up in the first 12 weeks of pregnancy. Go as soon as you know you are pregnant." },
      { q: "How many antenatal visits should I have?", tags: "number check ups contacts pregnancy ANC eight", a: "The World Health Organization recommends at least eight antenatal contacts: the first in the first 12 weeks, then at about 20, 26, 30, 34, 36, 38 and 40 weeks." },
      { q: "What happens at an antenatal check-up?", tags: "visit test pregnancy check what happen", a: "Health workers talk with you about healthy eating, vitamins and minerals, physical activity, and preventing malaria and HIV. You may have blood tests, a tetanus vaccination and a scan, and get help with problems like nausea or back pain." },
      { q: "What should I eat during pregnancy?", tags: "food diet nutrition vitamins pregnant eat", a: "At antenatal check-ups a health worker will advise you on healthy eating and on which vitamins or minerals you may need, such as iron and folic acid. Ask at your next visit about what is right for you." },
    ],
  },
  {
    slug: "pregnancy-dangers",
    category: "pregnancy",
    title: "Staying safe in pregnancy and childbirth",
    summary: "The main dangers in pregnancy and birth, and why giving birth with a skilled health worker matters.",
    body: [
      "Most deaths from pregnancy and childbirth can be prevented or treated. The World Health Organization lists the main causes as severe bleeding (mostly after birth), infections (usually after birth), high blood pressure in pregnancy (pre-eclampsia and eclampsia), complications during delivery, and unsafe abortion.",
      "Severe bleeding after birth can kill a healthy woman within hours if she is not cared for. Health workers can give treatment straight after birth that reduces this risk.",
      "High blood pressure in pregnancy should be found and managed early, before it leads to fits (convulsions). This is one reason antenatal check-ups matter.",
      "Having a skilled health worker with you during and after childbirth can make the difference between life and death for a woman and her newborn.",
    ],
    keyPoints: ["Most pregnancy-related deaths are preventable.", "Give birth with a skilled health worker whenever possible.", "Heavy bleeding and fits (convulsions) are emergencies."],
    whenToGetHelp: ["Heavy bleeding during pregnancy or after birth: go to a health facility immediately.", "Fits (convulsions): get urgent help.", "Feeling very unwell after giving birth: see a health worker quickly."],
    sources: ["whoMaternal"],
    faqs: [
      { q: "What are the danger signs in pregnancy?", tags: "danger warning signs risk pregnant complication", a: "The main dangers are severe bleeding, infection, high blood pressure that can lead to fits (convulsions), problems during delivery, and unsafe abortion. Heavy bleeding and fits are emergencies: go to a health facility immediately." },
      { q: "Why should I give birth with a skilled health worker?", tags: "deliver birth hospital clinic midwife home skilled attendant", a: "Complications can happen quickly during and after birth. Care from a skilled health worker can make the difference between life and death for the mother and the baby, for example by treating heavy bleeding straight away." },
    ],
  },
  {
    slug: "teenage-pregnancy",
    category: "pregnancy",
    title: "Pregnancy in adolescent girls",
    summary: "Why pregnancy carries extra risks for girls under 20, and why care matters.",
    body: [
      "Pregnancy carries higher risks for adolescent girls (aged 10 to 19) than for women in their early twenties. Girls have a higher risk of eclampsia (fits linked to high blood pressure) and serious infections, and their babies are more likely to be born small or too early.",
      "Child marriage, sexual abuse, and difficulty getting contraception all increase the chance that a girl becomes pregnant. Sub-Saharan Africa has the highest rate of births to adolescent girls in the world.",
      "A pregnant girl deserves respectful care. Going to antenatal check-ups early helps protect her and her baby.",
    ],
    keyPoints: ["Pregnancy is riskier for girls under 20.", "Early antenatal care helps protect mother and baby.", "No girl should be forced into marriage or sex."],
    whenToGetHelp: ["Start antenatal check-ups as early as possible.", "If someone is forcing you into sex or marriage, you can ask a trusted adult or a support service for help."],
    sources: ["whoAdolescentPreg"],
    faqs: [
      { q: "Is pregnancy dangerous for teenage girls?", tags: "teen adolescent young girl pregnant risk age", a: "Pregnancy carries higher risks for girls aged 10 to 19, including fits linked to high blood pressure and serious infections, and babies are more likely to be born small or early. Early, regular antenatal check-ups help protect both mother and baby." },
    ],
  },

  // ---------------- Family planning ----------------
  {
    slug: "family-planning-methods",
    category: "family-planning",
    title: "Family planning and contraception",
    summary: "What family planning is, the main types of contraception, and common worries.",
    body: [
      "Family planning lets people choose whether and when to have children, and how many. It is done using contraception and, for couples who struggle to get pregnant, treatment for infertility.",
      "Some methods are very effective and last a long time: implants, intrauterine devices (IUDs or coils), and sterilisation. Others work well when used correctly every time: pills, injections, patches and vaginal rings. Condoms prevent pregnancy if used correctly. Methods based on tracking fertile days, and withdrawal, are less reliable.",
      "The methods in WHO guidelines have been tested for safety and are safe for most people. Modern contraceptives do not cause infertility.",
      "The right method depends on your health, your needs and what you prefer. A health worker can help you choose.",
      "Condoms are the only method that protects against both pregnancy and sexually transmitted infections, including HIV.",
    ],
    keyPoints: ["Implants and IUDs are among the most effective methods.", "Modern contraceptives do not cause infertility.", "Only condoms also protect against STIs and HIV."],
    whenToGetHelp: ["Talk to a health worker to choose a method that suits you.", "If you have side effects that worry you, go back to a health worker rather than stopping on your own."],
    sources: ["whoFp"],
    faqs: [
      { q: "What is family planning?", tags: "birth spacing contraception plan children", a: "Family planning lets people decide whether and when to have children, and how many. It uses contraception and, for couples having difficulty, infertility treatment. It also helps protect the health of women and girls." },
      { q: "What family planning methods are available?", tags: "contraceptive types options pills implant injection IUD coil", a: "Long-lasting, very effective methods include implants, IUDs (coils) and sterilisation. Pills, injections, patches and rings work well when used correctly. Condoms prevent pregnancy if used correctly. Counting fertile days and withdrawal are less reliable. A health worker can help you choose." },
      { q: "Which contraceptive is the most effective?", tags: "best effective reliable method", a: "Implants, intrauterine devices (IUDs or coils) and sterilisation are among the most effective, long-lasting methods. Pills, injections, patches and rings also work well when used correctly every time." },
      { q: "Do contraceptives cause infertility?", tags: "barren cannot get pregnant later myth side effect", a: "No. The World Health Organization says modern contraceptive methods do not cause infertility." },
      { q: "Which contraceptive also protects against STIs and HIV?", tags: "condom protect infection disease", a: "Condoms are the only contraceptive method that protects against both pregnancy and sexually transmitted infections, including HIV." },
    ],
  },

  // ---------------- Sexual health ----------------
  {
    slug: "safer-sex",
    category: "sexual-health",
    title: "Protecting yourself during sex",
    summary: "How condoms, testing and vaccines help protect your sexual health.",
    body: [
      "Condoms, used correctly and every time, are one of the most effective ways to protect against sexually transmitted infections (STIs), including HIV. Use them for vaginal, oral and anal sex when possible.",
      "Condoms do not fully protect against infections that cause sores outside the area they cover, such as syphilis and genital herpes.",
      "Testing for HIV and other STIs, and treating sexual partners, help stop infections from spreading. Vaccines are available against two infections spread by sex: hepatitis B and HPV.",
      "Many STIs cause no symptoms, so you can have one without knowing. Getting tested is the only way to be sure.",
    ],
    keyPoints: ["Use a condom correctly every time you have sex.", "Many STIs have no symptoms — testing is the only way to know.", "Vaccines protect against hepatitis B and HPV."],
    whenToGetHelp: ["If you notice anything unusual in your genital area or are worried about an infection, see a health worker.", "If you had sex without a condom and are worried about HIV, ask a health worker quickly about testing and prevention medicine (PEP)."],
    sources: ["whoSti", "whoHiv"],
    faqs: [
      { q: "How can I protect myself during sex?", tags: "safe sex protection condom", a: "Use a condom correctly every time you have sex. Get tested for HIV and other STIs, and make sure partners are tested and treated too. Vaccines protect against hepatitis B and HPV." },
      { q: "Do condoms protect against all STIs?", tags: "condom protection herpes syphilis", a: "Condoms used correctly every time are one of the best protections against STIs, including HIV. But they do not fully protect against infections that cause sores outside the area they cover, such as syphilis and genital herpes." },
    ],
  },

  // ---------------- STIs & HIV ----------------
  {
    slug: "stis",
    category: "sti-hiv",
    title: "Sexually transmitted infections (STIs)",
    summary: "How STIs spread, why many have no symptoms, and which can be cured.",
    body: [
      "More than 30 kinds of bacteria, viruses and parasites can be passed on through vaginal, anal or oral sex. Some STIs can also pass from a mother to her baby during pregnancy, childbirth or breastfeeding.",
      "STIs often cause no symptoms. More than 1 million curable STIs are caught every day around the world, and most of them have no symptoms.",
      "Four common STIs can be cured with medicine: syphilis, gonorrhoea, chlamydia and trichomoniasis. Infections caused by viruses, such as herpes and HIV, cannot be cured, but medicines can control them.",
      "Untreated STIs can cause serious problems, including infertility in women, problems in pregnancy, stillbirth and harm to newborn babies. They can also increase the risk of getting HIV. Pregnant women are among the groups for whom STI testing is especially important.",
    ],
    keyPoints: ["Many STIs have no symptoms.", "Syphilis, gonorrhoea, chlamydia and trichomoniasis can be cured.", "Partners need treatment too, to stop reinfection."],
    whenToGetHelp: ["If you are worried you may have an STI — many have no symptoms, so ask for a test.", "If you are pregnant, ask about STI testing at your antenatal check-up.", "If a partner tells you they have an STI."],
    sources: ["whoSti"],
    faqs: [
      { q: "What are STIs?", tags: "sexually transmitted infection disease std", a: "STIs are infections passed on through vaginal, anal or oral sex. More than 30 kinds of bacteria, viruses and parasites can spread this way, and some can also pass from mother to baby." },
      { q: "Can I have an STI without symptoms?", tags: "no symptoms know if I have", a: "Yes. STIs often cause no symptoms at all, so you can have one without knowing. Testing is the only way to be sure." },
      { q: "Can STIs be cured?", tags: "cure treatment treatable gonorrhoea syphilis chlamydia", a: "Syphilis, gonorrhoea, chlamydia and trichomoniasis can be cured with medicine from a health worker. Herpes and HIV cannot be cured, but medicines can control them. Partners need treatment too." },
      { q: "Can an STI harm my baby?", tags: "pregnant pregnancy baby newborn pass", a: "Yes. Some STIs can pass to a baby during pregnancy or birth and can cause stillbirth, early birth, low birth weight or serious illness in the newborn. Ask for STI testing at your antenatal check-ups." },
      { q: "How can STIs be prevented?", tags: "prevent avoid protect", a: "Use condoms correctly every time you have sex, get tested, and make sure sexual partners are tested and treated. Vaccines can protect against hepatitis B and HPV." },
    ],
  },
  {
    slug: "hiv",
    category: "sti-hiv",
    title: "HIV: prevention, testing and treatment",
    summary: "How HIV spreads, how it does not, testing, treatment and protecting babies.",
    body: [
      "HIV is a virus that attacks the body's defence (immune) system. Without treatment it can lead to AIDS, often after many years.",
      "HIV spreads through blood, semen, vaginal fluids and breast milk. It can pass from a mother to her baby during pregnancy, birth or breastfeeding. It does not spread through kissing, hugging, shaking hands, or sharing food, water or personal objects.",
      "You can lower your risk by using condoms, getting tested for HIV and other STIs, and using prevention medicine. PrEP is medicine taken by people without HIV to lower their risk. PEP is medicine taken soon after a possible exposure. A health worker can advise you.",
      "Rapid tests give same-day results, and HIV self-tests exist. A positive result must be confirmed by a trained health worker. After a recent risk, a test can be repeated after 28 days.",
      "There is no cure, but treatment (antiretroviral therapy) lets people with HIV live full and healthy lives. People on treatment whose blood shows no virus do not pass HIV to sexual partners.",
      "Pregnant women with HIV should start treatment as soon as possible. This protects their own health and helps prevent HIV passing to the baby.",
    ],
    keyPoints: ["HIV is not spread by hugging, kissing or sharing food.", "Treatment lets people with HIV live full, healthy lives.", "Treatment in pregnancy helps protect the baby."],
    whenToGetHelp: ["If you think you were exposed to HIV, see a health worker as soon as possible about PEP.", "If you are pregnant, ask for an HIV test at your antenatal check-up."],
    sources: ["whoHiv"],
    faqs: [
      { q: "How does HIV spread?", tags: "transmit catch get infected", a: "HIV spreads through blood, semen, vaginal fluids and breast milk, mainly through sex without a condom, sharing needles, and from mother to baby during pregnancy, birth or breastfeeding." },
      { q: "Can HIV spread by hugging, kissing or sharing food?", tags: "myth touch casual contact", a: "No. HIV does not spread through kissing, hugging, shaking hands, or sharing food, water or personal objects." },
      { q: "Is there a cure for HIV?", tags: "cure treatment ART antiretroviral", a: "There is no cure, but antiretroviral treatment stops the virus from multiplying. People on treatment can live full and healthy lives, and those whose blood shows no virus do not pass HIV to sexual partners." },
      { q: "Can a mother with HIV have a healthy baby?", tags: "pregnant pregnancy baby mother to child", a: "Yes, with treatment. Pregnant women with HIV should start antiretroviral treatment as soon as possible. It protects their health and helps prevent HIV passing to the baby. Babies of mothers with HIV should be tested early." },
      { q: "What are PrEP and PEP?", tags: "prevention medicine prep pep", a: "PrEP is medicine people without HIV can take to lower their risk of getting it. PEP is medicine taken soon after a possible exposure to HIV. A health worker can tell you if either is right for you." },
      { q: "How can I get tested for HIV?", tags: "test testing know status self test", a: "Health facilities offer rapid HIV tests with same-day results, and HIV self-tests also exist. A positive result must be confirmed by a trained health worker. If you had a recent risk, test again after 28 days." },
    ],
  },

  // ---------------- HPV & cervical health ----------------
  {
    slug: "hpv-and-cervical-cancer",
    category: "hpv-cervical",
    title: "HPV and cervical cancer",
    summary: "What HPV is, how vaccination and screening protect women, and warning signs.",
    body: [
      "HPV (human papillomavirus) is a very common infection passed on through sex. Almost all sexually active people get it at some point, usually without symptoms, and the body usually clears it on its own.",
      "When certain types of HPV stay in the cervix for a long time, they can cause changes in the cells that may slowly become cancer. This usually takes 15 to 20 years, but can be faster (5 to 10 years) in women whose immune system is weak, such as women with untreated HIV.",
      "Vaccination protects against the HPV types that cause most cervical cancers. The World Health Organization's priority group is girls aged 9 to 14, before they become sexually active.",
      "Screening finds changes before they become cancer. WHO recommends screening every 5 to 10 years from age 30, or every 3 to 5 years from age 25 for women living with HIV. Women can collect an HPV test sample themselves, and this is as reliable as a sample taken by a health worker.",
      "Not smoking and using condoms also help reduce risk. Early cell changes can be treated with a simple procedure, and cervical cancer can be cured if found early and treated promptly.",
    ],
    keyPoints: ["HPV vaccination is recommended for girls aged 9 to 14.", "Screening from age 30 (25 for women with HIV) finds changes early.", "Cervical cancer can be cured if found early."],
    whenToGetHelp: [
      "Bleeding between periods, after sex, or after menopause.",
      "More vaginal discharge than usual, or discharge that smells bad.",
      "Ongoing pain in the back, legs or pelvis, swollen legs, weight loss or tiredness.",
    ],
    sources: ["whoCervical"],
    faqs: [
      { q: "What is HPV?", tags: "human papillomavirus virus infection", a: "HPV (human papillomavirus) is a very common infection passed on through sex. Most people get it at some point without symptoms, and the body usually clears it. Some types, if they stay for years, can cause cervical cancer." },
      { q: "How can women protect themselves from HPV and cervical cancer?", tags: "prevent protect HPV cervical cancer women", a: "HPV vaccination (for girls aged 9 to 14), regular screening (every 5 to 10 years from age 30, or every 3 to 5 years from 25 for women with HIV), not smoking and using condoms all help. Early cell changes found by screening can be treated." },
      { q: "Who should get the HPV vaccine?", tags: "vaccine vaccination girls age doses", a: "The World Health Organization's priority group is girls aged 9 to 14, before they become sexually active. One or two doses are given depending on the country's schedule; people with weak immune systems, including people living with HIV, may need more." },
      { q: "When should I be screened for cervical cancer?", tags: "screening test check pap HPV test age", a: "WHO recommends screening with an HPV test every 5 to 10 years starting at age 30. Women living with HIV should start at 25 and screen every 3 to 5 years. Women can collect the sample themselves." },
      { q: "What are the warning signs of cervical cancer?", tags: "symptoms signs cervical cancer", a: "See a health worker if you have bleeding between periods, after sex or after menopause, more or bad-smelling discharge, ongoing back, leg or pelvic pain, swollen legs, weight loss or tiredness. Early changes usually cause no symptoms, so screening matters." },
      { q: "Can cervical cancer be cured?", tags: "cure treat treatment cervical", a: "Yes, if it is found early and treated promptly. Early cell changes can be treated with a simple procedure before they ever become cancer." },
    ],
  },

  // ---------------- Maternal health ----------------
  {
    slug: "care-after-birth",
    category: "maternal-health",
    title: "Care for mother and baby after birth",
    summary: "When mother and baby should be checked in the first six weeks after birth.",
    body: [
      "The first weeks after birth are when most deaths of mothers and newborns happen, so check-ups for both are very important.",
      "The World Health Organization recommends care in a health facility for at least 24 hours after birth, and at least three more check-ups in the first six weeks: between 48 and 72 hours, between 7 and 14 days, and in week six. If the baby is born at home, the first check should happen as early as possible and within 24 hours.",
      "Check-ups look for danger signs in the mother or baby, and help with common problems such as pain and swollen breasts. They include support with breastfeeding, vaccination for the baby, family planning, and checking how the mother is feeling emotionally.",
      "Having a baby can bring a lot of stress and worry. Health workers can check for depression and anxiety after birth and help you get support.",
    ],
    keyPoints: ["Stay at least 24 hours in a health facility after birth if you can.", "Three more check-ups in the first six weeks.", "Your feelings matter too — ask for help if you feel low or anxious."],
    whenToGetHelp: ["Heavy bleeding or feeling very unwell after birth: go to a health facility immediately.", "If your baby is not feeding well or seems unwell, get help quickly.", "If you feel very sad, worried or unable to cope."],
    sources: ["whoPostnatal"],
    faqs: [
      { q: "When should mother and baby be checked after birth?", tags: "postnatal after delivery check up visit newborn", a: "WHO recommends care in a health facility for at least 24 hours after birth, then at least three more check-ups: at 48–72 hours, at 7–14 days, and in week six. After a home birth, the first check should be within 24 hours." },
      { q: "What happens at a postnatal check-up?", tags: "after birth visit postnatal check", a: "Health workers look for danger signs in mother and baby, help with problems like pain and swollen breasts, support breastfeeding, vaccinate the baby, talk about family planning, and check how the mother is feeling emotionally." },
      { q: "Is it normal to feel sad or worried after having a baby?", tags: "postnatal depression anxiety mood after birth feelings", a: "Having a baby can bring a lot of stress and worry. Health workers can check for depression and anxiety after birth and help you get support, so tell them how you are feeling." },
    ],
  },
  {
    slug: "breastfeeding",
    category: "maternal-health",
    title: "Breastfeeding",
    summary: "When to start, how long to give only breastmilk, and the benefits for mother and baby.",
    body: [
      "WHO and UNICEF recommend starting breastfeeding within the first hour after birth.",
      "For the first 6 months, babies should have only breastmilk — no other food or drinks, not even water. Breastfeed whenever the baby wants, day and night.",
      "From 6 months, start giving safe, nourishing foods while continuing to breastfeed up to two years of age or longer.",
      "Breastmilk is safe and clean, and contains antibodies that help protect babies from many common childhood illnesses. Breastfed children are less likely to become overweight or develop diabetes later in life. Women who breastfeed have a lower risk of breast and ovarian cancer.",
    ],
    keyPoints: ["Start within the first hour after birth.", "Only breastmilk for the first 6 months — not even water.", "Keep breastfeeding with other foods up to 2 years or beyond."],
    whenToGetHelp: ["If breastfeeding is painful or your breasts are very swollen, ask a health worker for help.", "If your baby is not feeding well or seems unwell."],
    sources: ["whoBreastfeeding"],
    faqs: [
      { q: "When should I start breastfeeding?", tags: "start breastfeed newborn first hour", a: "WHO and UNICEF recommend starting breastfeeding within the first hour after birth." },
      { q: "How long should I give my baby only breastmilk?", tags: "exclusive breastfeeding six months water food", a: "For the first 6 months, give only breastmilk — no other food or drinks, not even water. Then add safe, nourishing foods while continuing to breastfeed up to 2 years or beyond." },
      { q: "What are the benefits of breastfeeding?", tags: "benefits good why breastfeed", a: "Breastmilk is clean and safe and contains antibodies that protect babies from common illnesses. Breastfed children are less likely to become overweight or develop diabetes later. Mothers who breastfeed have a lower risk of breast and ovarian cancer." },
    ],
  },

  // ---------------- Mental wellbeing ----------------
  {
    slug: "mental-wellbeing",
    category: "mental-wellbeing",
    title: "Looking after your mental wellbeing",
    summary: "Common feelings and conditions in young people, what helps, and when to reach out.",
    body: [
      "Mental health problems are common. Around the world, about one in seven young people aged 10 to 19 has a mental health condition. Anxiety and depression are among the most common.",
      "Anxiety can feel like panic or constant worry. Depression and anxiety can both cause sudden changes in mood. They can affect school, friendships and daily life, and pulling away from others can make loneliness worse.",
      "Things that help protect mental health include good sleep, regular exercise, learning ways to cope with problems and manage emotions, and having supportive people at home, at school and in the community.",
      "Shame and stigma often stop people from asking for help. Reaching out is a sign of strength. Talking to someone you trust or a health worker can help.",
    ],
    keyPoints: ["About one in seven young people has a mental health condition.", "Sleep, exercise and supportive people help.", "Asking for help is a sign of strength."],
    whenToGetHelp: ["If worry or sadness lasts a long time or stops you from doing daily things.", "If you have thoughts of harming yourself or ending your life, get help now from someone you trust or the nearest health facility."],
    sources: ["whoTeenMental"],
    faqs: [
      { q: "Is it normal to feel anxious or sad?", tags: "worry stress sad down low mood feel", a: "Everyone feels worried or sad sometimes. When these feelings last a long time or stop you from doing daily things, it may be anxiety or depression, which are common and can be helped. Talk to someone you trust or a health worker." },
      { q: "What can help my mental wellbeing?", tags: "cope coping stress better mental health tips", a: "Good sleep, regular exercise, learning ways to cope with problems and manage emotions, and spending time with supportive people all help protect mental health." },
      { q: "Where can I get help for my mental health?", tags: "help support talk someone counselling", a: "Start by talking to someone you trust, such as a family member, teacher or friend, or a health worker. Asking for help is a sign of strength. If you ever think about harming yourself, get help immediately." },
    ],
  },
];

Object.assign(SOURCES, MORE_SOURCES);
CATEGORIES.push(...MORE_CATEGORIES);
ARTICLES.push(...MORE_ARTICLES);

/** Flattened Q&A library used by Ask HerHealth. */
export const LIBRARY = ARTICLES.flatMap((a) =>
  a.faqs.map((f, i) => ({ id: `${a.slug}#${i}`, ...f, article: a.slug, articleTitle: a.title, category: a.category, sources: a.sources, whenToGetHelp: a.whenToGetHelp })),
);
