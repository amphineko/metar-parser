import { EmbeddedActionsParser } from 'chevrotain'

import * as Lexer from './lexer'

type ReportType = 'METAR' | 'SPECI'

interface Timestamp {
    date: number
    hours: number
    minutes: number
}

interface Wind {
    direction?: number
    speed: number
    gust?: number
    unit: string
    variable: boolean
    variation?: { low: number, high: number }
}

export interface METAR {
    auto: boolean
    station: string
    timestamp: Timestamp
    type?: ReportType
    wind: Wind
}

/**
 * Lexical parser for METAR reports
 *
 * This parser is implemented according to FM-15 (WMO No.306 2019 edition)
 *
 * @example
 *
 * const parser = new METARParser()
 * parser.input = lexingResult.tokens
 * except(parser.errors.length).toBe(0)
 *
 * const result = parser.metarStatement()
 *
 * @see METARLexer
 *
 * @todo Implement other/remaining groups
 */
export class METARParser extends EmbeddedActionsParser {
    constructor() {
        super(Lexer.METARTokens)
        this.performSelfAnalysis()
    }

    /**
     * Parse METAR report according to FM-15
     */
    public readonly metarStatement = this.RULE('metarStatement', () => {
        const type = this.SUBRULE(this.reportTypeGroup)
        const station = this.SUBRULE(this.stationIdentifierGroup)
        const timestamp = this.SUBRULE(this.timestampGroup)
        const autoFlag = this.OPTION(() => this.SUBRULE(this.autoFlag))
        const wind = this.OPTION2(() => this.SUBRULE(this.windGroup))

        // TODO: add other/remaining groups

        return this.ACTION((): METAR => ({
            type: type,
            station: station,
            timestamp: timestamp,
            auto: autoFlag ?? false,
            wind: wind
        }))
    })

    /**
     * 15.1.1 Code name METAR or SPECI
     */
    protected readonly reportTypeGroup = this.RULE('reportTypeGroup', () => {
        const token = this.or(0, [
            { ALT: () => this.consume(0, Lexer.METAR) },
            { ALT: () => this.consume(0, Lexer.SPECI) }
        ])
        return this.ACTION(() => token.image as ReportType)
    })

    /**
     * 15.2 Reporting Station Identifier
     */
    protected readonly stationIdentifierGroup = this.RULE('stationIdentifierGroup', () => this.or(0, [{
        ALT: () => {
            const token = this.consume(0, Lexer.Identifier)
            return this.ACTION(() => token.image)
        },
        GATE: () => this.LA(1).image.length === 4
    }]))

    /**
     * 15.3 Timestamp
     */
    protected readonly timestampGroup = this.RULE('timestampGroup', () => this.or(0, [{
        ALT: () => {
            const timestamp = this.consume(0, Lexer.Integer)
            this.consume(0, Lexer.Identifier)
            return this.ACTION(() => {
                const result: Timestamp = {
                    date: parseInt(timestamp.image.substr(0, 2)),
                    hours: parseInt(timestamp.image.substr(2, 2)),
                    minutes: parseInt(timestamp.image.substr(4, 2))
                }
                return result
            })
        },
        GATE: () =>
            this.LA(1).image.length === 6 && // 6-digit timestamp
            this.LA(2).image.toUpperCase() === 'Z' // followed by ZULU
    }]))

    /**
     * 15.4 AUTO
     */
    protected readonly autoFlag = this.RULE('autoFlag', () => {
        this.CONSUME(Lexer.AUTO)
        return this.ACTION(() => true)
    })

    /**
     * 15.5 Wind
     */
    protected readonly windGroup = this.RULE('windGroup', () => {
        const firstToken: {
            direction?: number
            speed: number
            variable: boolean
        } = this.OR([
            // TODO: better type guard for OR invocation
            {
                GATE: () => this.LA(1).image.length === 5,
                ALT: () => {
                    const token = this.CONSUME(Lexer.Integer)
                    return this.ACTION(() => ({
                        direction: parseInt(token.image.substr(0, 3)),
                        speed: parseInt(token.image.substr(3, 2)),
                        variable: false
                    }))
                }
            },
            {
                GATE: () => this.LA(2).image.length === 2,
                ALT: () => {
                    this.CONSUME(Lexer.VRB)
                    const token = this.CONSUME1(Lexer.Integer)
                    return this.ACTION(() => ({
                        direction: undefined,
                        speed: parseInt(token.image),
                        variable: true
                    }))
                }
            }
        ])

        const gust = this.OPTION(() => {
            this.CONSUME(Lexer.G)
            const token = this.OR1([{
                ALT: () => this.CONSUME2(Lexer.Integer),
                GATE: () => this.LA(1).image.length === 2
            }])
            return this.ACTION(() => parseInt(token.image))
        })

        const unitToken = this.OR2([
            { ALT: () => this.CONSUME(Lexer.KT) },
            { ALT: () => this.CONSUME(Lexer.MPS) }
        ])

        const variationToken = this.OPTION2(() => {
            const lowToken = this.OR3([{
                ALT: () => this.CONSUME3(Lexer.Integer),
                GATE: () => this.LA(1).image.length === 3
            }])
            this.CONSUME(Lexer.V)
            const highToken = this.OR4([{
                ALT: () => this.CONSUME4(Lexer.Integer),
                GATE: () => this.LA(1).image.length === 3
            }])
            return this.ACTION(() => ({
                low: parseInt(lowToken.image),
                high: parseInt(highToken.image)
            }))
        })

        return this.ACTION(() => {
            const result: Wind = {
                direction: firstToken.variable ? undefined : firstToken.direction,
                speed: firstToken.speed,
                gust: gust,
                unit: unitToken.image,
                variable: firstToken.variable,
                variation: variationToken
            }
            return result
        })
    })
}
