# GitHub repository metadata (sections 25–27)

Set these in the repository's **About** panel (gear icon on the repository home page):

- **Description:** Open-source AI-assisted reproductive and maternal health information platform for women and adolescent girls in Liberia.
- **Website:** the current live HerHealth prototype URL.
- **Topics:** `femtech` `digital-health` `reproductive-health` `maternal-health` `liberia` `ai` `rag` `pwa` `open-source` `health-tech`

With the GitHub CLI:

```bash
gh repo edit sha-drach/herhealth-liberia --description "Open-source AI-assisted reproductive and maternal health information platform for women and adolescent girls in Liberia." --homepage "<live prototype URL>" --add-topic femtech,digital-health,reproductive-health,maternal-health,liberia,ai,rag,pwa,open-source,health-tech
```

## Ownership

HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation (stated in README, LICENSE, footer and admin). If a SkillBridge Liberia GitHub organization is created later, transfer the repository after testing — do not risk breaking the live deployment right before submission.

## Licensing

Software: MIT (`LICENSE`, © SkillBridge Liberia Corporation). Third-party health materials (WHO, UNICEF, NHS…) keep their own licences; SkillBridge's content licence is not applied to them. Source attribution is kept per article.
