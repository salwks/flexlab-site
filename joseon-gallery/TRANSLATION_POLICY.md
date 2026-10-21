# Joseon Painting Archive Translation Policy

## Core principle

Translation is not treated as complete merely because a string has been converted into another language. Each locale should use established art-historical terminology and natural wording used in that language. Korean translations made from foreign museum text must be checked against Korean authoritative sources whenever possible.

## Korean (foreign language -> Korean)

1. Do not literal-translate a foreign museum title when an established Korean title exists.
2. First identify the exact object, artist, date/period, format, material, and collection number when available.
3. Verify Korean names and terminology against authoritative Korean sources before committing a Korean title or description.
4. Preferred source order:
   - National Museum of Korea / eMuseum and other national museum collection databases
   - National Folk Museum of Korea
   - National Palace Museum of Korea
   - Korea Heritage Service and national heritage databases
   - Academy of Korean Studies / Encyclopedia of Korean Culture
   - Institute for the Translation of Korean Classics / Korean Classics Database for historical names and terms
   - Korean museum exhibition catalogues and peer-reviewed Korean scholarship
5. For works held overseas, compare the holding museum's object record with Korean catalogues or scholarship that discuss the same object whenever such material exists.
6. If a Korean canonical title cannot be confirmed, use a conservative descriptive translation and retain the original foreign title in review metadata. Mark it provisional rather than inventing a polished but unsupported title.
7. Artist names, place names, reign names, Buddhist/Daoist/Shamanic terms, court offices, objects, clothing, rituals, and iconographic terms require terminology verification, not phonetic guesswork.
8. A foreign institution's interpretation may be preserved as interpretation, but it must not be silently rewritten as established Korean historical fact.

## English

1. Prefer official English titles published by the holding institution when they exist.
2. For Korean concepts without a stable English equivalent, keep an established romanized Korean term where that is standard in museum/academic usage and explain only where necessary.
3. Use museum and art-history register, not literal Korean syntax.
4. Verify names, dynastic periods, object types, and specialist vocabulary against authoritative English museum/catalogue usage.

## Japanese

1. Use natural Japanese museum and art-history terminology.
2. Prefer established Japanese readings/terms for East Asian art-historical concepts rather than mechanically transliterating Korean or English.
3. Preserve Korean-specific concepts when replacing them with a Japanese analogue would change meaning.
4. Cross-check major object types and proper nouns against Japanese museum/catalogue usage when available.

## Chinese

1. Use natural Simplified Chinese museum and art-history terminology for the zh locale.
2. Use established Chinese art-historical terms where equivalent, but do not collapse Korean-specific institutions, rites, clothing, folk belief, or object names into a different Chinese historical concept.
3. Proper nouns and specialist terms must be checked for established Chinese usage when available.

## Verification statuses

- `seeded`: copied from an existing source-language title or metadata; not yet translation-verified.
- `provisional`: translated conservatively but authoritative terminology/title confirmation is still incomplete.
- `verified`: checked against an authoritative source appropriate to the target language.
- `canonical`: exact established title/name confirmed from an authoritative catalogue or collection record.

Only `verified` or `canonical` entries should be described as fully translated.

## Review metadata

For translations that required historical/terminology verification, record:
- work ID
- locale
- status
- original title/text
- chosen localized title/text
- references used
- short review note when an ambiguity was resolved

The runtime gallery continues to read only the locale JSON. Review metadata is kept separately so verification evidence does not increase page payload.
