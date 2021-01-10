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
    variation: { low: number, high: number }
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
        const token = this.CONSUME(Lexer.Type)
        return this.ACTION(() => token.image as ReportType)
    })

    /**
     * 15.2 Reporting Station Identifier
     */
    protected readonly stationIdentifierGroup = this.RULE('stationIdentifierGroup', () => {
        const token = this.CONSUME(Lexer.StationIdentifier)
        return this.ACTION(() => token.image)
    })

    /**
     * 15.3 Timestamp
     */
    protected readonly timestampGroup = this.RULE('timestampGroup', () => {
        const token = this.CONSUME(Lexer.Timestamp)
        return this.ACTION(() => {
            const result: Timestamp = {
                date: parseInt(token.image.substr(0, 2)),
                hours: parseInt(token.image.substr(2, 2)),
                minutes: parseInt(token.image.substr(4, 2))
            }
            return result
        })
    })

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
        const directionToken = this.OR([
            { ALT: () => this.CONSUME(Lexer.Int3D) },
            { ALT: () => this.CONSUME(Lexer.VRB) }
        ])
        const speedToken = this.CONSUME(Lexer.Int2D)

        const gustToken = this.OPTION(() => {
            this.CONSUME(Lexer.G)
            const gustSpeedToken = this.CONSUME2(Lexer.Int2D)
            return this.ACTION(() => parseInt(gustSpeedToken.image))
        })

        const unitToken = this.OR2([
            { ALT: () => this.CONSUME(Lexer.KT) },
            { ALT: () => this.CONSUME(Lexer.MPS) }
        ])

        const variationToken = this.OPTION2(() => {
            const lowToken = this.CONSUME2(Lexer.Int3D)
            this.CONSUME(Lexer.V)
            const highToken = this.CONSUME3(Lexer.Int3D)
            return this.ACTION(() => ({
                low: parseInt(lowToken.image),
                high: parseInt(highToken.image)
            }))
        })

        return this.ACTION(() => {
            const result: Wind = {
                direction: directionToken.tokenType.name === Lexer.Int3D.name
                    ? parseInt(directionToken.image)
                    : undefined,
                speed: parseInt(speedToken.image),
                gust: gustToken,
                unit: unitToken.image,
                variable: directionToken.tokenType.name === Lexer.VRB.name,
                variation: variationToken
            }
            return result
        })
    })
}
