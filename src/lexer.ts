import { createToken, Lexer } from 'chevrotain'
import * as chevrotain from 'chevrotain'

export const WhiteSpace = createToken({
    group: chevrotain.Lexer.SKIPPED,
    name: 'WhiteSpace',
    pattern: /\s+/
})

/* ----- special patterns ----- */

export const Identifier = createToken({
    name: 'Identifier',
    pattern: /[a-zA-Z]+/
})

export const Integer = createToken({
    name: 'Integer',
    pattern: /\d+/
})

/* ----- keywords ----- */

export const AUTO = createToken({
    label: 'Code Word AUTO',
    longer_alt: Identifier,
    name: 'Auto',
    pattern: /AUTO/
})

export const G = createToken({
    longer_alt: Identifier,
    name: 'Gust',
    pattern: /G/
})

export const KT = createToken({
    label: 'Knots',
    longer_alt: Identifier,
    name: 'KT',
    pattern: /KT/
})

export const MPS = createToken({
    label: 'Metres Per Second',
    longer_alt: Identifier,
    name: 'MPS',
    pattern: /MPS/
})

export const METAR = createToken({
    label: 'Report Type METAR',
    longer_alt: Identifier,
    name: 'METAR',
    pattern: /(METAR)/
})

export const SPECI = createToken({
    label: 'Report Type SPECI',
    longer_alt: Identifier,
    name: 'SPECI',
    pattern: /(SPECI)/
})

export const V = createToken({
    label: 'Wind Variation Separator',
    longer_alt: Identifier,
    name: 'Variation',
    pattern: /V/
})

export const VRB = createToken({
    label: 'Variable Wind Indicator',
    longer_alt: Identifier,
    name: 'Variable',
    pattern: /VRB/
})

/* ----- module exports ----- */

export const METARTokens = [
    WhiteSpace,

    /* keywords */

    METAR,
    SPECI,
    AUTO,
    MPS,
    VRB,
    KT,
    G,
    V,

    /* special patterns */

    Identifier,
    Integer
]

/**
 * Lexical tokenizer for METAR reports
 *
 * This lexer is implemented according to FM-15 (WMO No.306 2019 edition)
 *
 * @example
 *
 * const lexingResult = METARLexer.tokenize(input)
 * except(lexingResult.errors.length).toBe(0)
 *
 * @see METARParser
 */
export const METARLexer = new Lexer(METARTokens, {
    ensureOptimizations: true
})
