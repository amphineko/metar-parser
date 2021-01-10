import { createToken, Lexer } from 'chevrotain'
import * as chevrotain from 'chevrotain'

export const WhiteSpace = createToken({
    group: chevrotain.Lexer.SKIPPED,
    name: 'WhiteSpace',
    pattern: /\s+/
})

/* ----- keywords ----- */

export const AUTO = createToken({
    label: 'Code Word AUTO',
    name: 'Auto',
    pattern: /AUTO/
})

export const G = createToken({
    label: 'Gust Indicator of Wind Group',
    name: 'Gust',
    pattern: /G/
})

export const KT = createToken({
    label: 'Knots',
    name: 'KT',
    pattern: /KT/
})

export const MPS = createToken({
    label: 'Metres Per Second',
    name: 'MPS',
    pattern: /MPS/
})

export const Type = createToken({
    label: 'Report Type',
    name: 'Type',
    pattern: /(METAR|SPECI)/
})

export const V = createToken({
    label: 'Wind Variation Separator',
    name: 'Variation',
    pattern: /V/
})

export const VRB = createToken({
    label: 'Variable Wind Indicator',
    name: 'Variable',
    pattern: /VRB/
})

/* ----- special patterns ----- */

export const StationIdentifier = createToken({
    label: 'ICAO Station Identifier',
    name: 'ICAO',
    pattern: /[a-zA-Z]{4}/
})

export const Int2D = createToken({
    label: '2-digit Integer',
    name: 'Integer2D',
    pattern: /\d\d/
})

export const Int3D = createToken({
    label: '3-digit Integer',
    name: 'Integer3D',
    pattern: /\d\d\d/
})

export const Timestamp = createToken({
    name: 'Timestamp',
    pattern: /\d\d\d\d\d\dZ/
})

/* ----- module exports ----- */

export const METARTokens = [
    WhiteSpace,
    Type,

    /* keywords */

    AUTO,
    MPS,
    VRB,
    KT,
    G,
    V,

    /* special patterns */

    StationIdentifier,
    Timestamp,
    Int3D,
    Int2D
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
export const METARLexer = new Lexer(METARTokens)
