import { pipe } from 'fp-ts/lib/function'
import * as D from 'io-ts/Decoder'
import * as E from 'fp-ts/lib/Either'

// function SingleMatchDecoder<T>(regex: RegExp, failureMessage: string): D.Decoder<string, T> {
//     return {
//         decode: (input: string) => {
//             const result = regex.exec(input)
//             return result !== null && result.length > 0
//                 ? D.success(result[0] as unknown as T)
//                 : D.failure(input, failureMessage)
//         }
//     }
// }

function regexDecoder<T>(regex: RegExp, message: string, writer: (matches: string[]) => T): D.Decoder<unknown, T> {
    return pipe(
        D.string,
        D.parse((s) => {
            const matches = regex.exec(s)
            return matches === null
                ? D.failure(s, message)
                : D.success(writer(matches))
        })
    )
}

/* Message Type */

export type MessageType = 'METAR' | 'SPECI'

export const messageTypeDecoder = D.literal('METAR', 'SPECI')

interface ICAOBrand {
    readonly FourCharacter: unique symbol
}

/* Station Code and ICAO */

type ICAO = string & ICAOBrand

export const stationDecoder = pipe(
    D.string,
    D.parse((s) => {
        const result = s.toUpperCase()
        return /^[A-Z]{4}$/.test(result)
            ? D.success(result as ICAO)
            : D.failure(s, 'Station code should be in ICAO form')
    })
)

/* Timestamp */

interface RawTimestamp {
    dayOfMonth: number
    hours: number
    minutes: number
}

export const rawTimestampDecoder = pipe(
    D.string,
    D.parse((s) => {
        const matches = /^(\d\d)(\d\d)(\d\d)Z$/.exec(s)

        if (matches === null) return D.failure(s, 'Invalid format of timestamp (DDHHMMZ)')

        const result: RawTimestamp = {
            dayOfMonth: parseInt(matches[1]),
            hours: parseInt(matches[2]),
            minutes: parseInt(matches[3])
        }

        return D.success(result)
    }),
    D.refine((t): t is RawTimestamp => t.dayOfMonth > 0 && t.dayOfMonth < 31, 'in [1, 31]'),
    D.refine((t): t is RawTimestamp => t.hours >= 0 && t.hours <= 23, 'in [0, 23]'),
    D.refine((t): t is RawTimestamp => t.minutes >= 0 && t.hours <= 59, 'in [0, 59]')
)

export const timestampDecoder = pipe(
    rawTimestampDecoder,
    D.parse((t) => {
        const result = new Date()
        result.setUTCDate(t.dayOfMonth) // TODO: validate if date is out of range for this month, e.g `30 February`
        result.setUTCHours(t.hours)
        result.setUTCMinutes(t.minutes)
        return D.success(result)
    })
)

/* Wind Direction */

interface Wind {
    direction: number
    speed: number
    unit: 'KT' | 'MPS'
}

export const windDecoder = regexDecoder(
    /^(\d\d\d)(\d\d)(MPS|KT)$/,
    'Invalid format of wind direction (dddffGffKT)',
    (matches): Wind => ({
        direction: parseInt(matches[1]),
        speed: parseInt(matches[2]),
        unit: matches[3] as 'KT' | 'MPS'
    })
)

/* Wind Variation */

interface WindVariation {
    varyFrom: number
    varyTo: number
}

export const windVariationDecoder = regexDecoder(
    /^(\d\d\d)V(\d\d\d)$/,
    'Invalid format of wind variation (dddVddd)',
    (matches): WindVariation => ({
        varyFrom: parseInt(matches[1]),
        varyTo: parseInt(matches[2])
    })
)

/* METAR Weather */

export interface Weather {
    type: MessageType
    station: ICAO
    timestamp: RawTimestamp

    wind: Wind
    windVariation: WindVariation
}

function DecoderPair<T>(decoder: D.Decoder<unknown, T>, writer: (a: Weather, i: T) => void): {
    decoder: D.Decoder<unknown, T>
    write: (a: Weather, i: T) => void
} {
    return { decoder: decoder, write: writer }
}

const decoders = [
    DecoderPair(messageTypeDecoder, (a, i) => { a.type = i }),
    DecoderPair(stationDecoder, (a, i) => { a.station = i }),
    DecoderPair(rawTimestampDecoder, (a, i) => { a.timestamp = i }),
    DecoderPair(windDecoder, (a, i) => { a.wind = i }),
    DecoderPair(windVariationDecoder, (a, i) => { a.windVariation = i })
]

export const METARDecoder = pipe(
    D.string,
    D.parse((s) => {
        const w: Weather = {} as unknown as Weather
        const parts = s.split(/\s+/)

        for (const part of parts) {
            for (const decoder of decoders) {
                const result: E.Either<D.DecodeError, any> = decoder.decoder.decode(part)
                if (E.isLeft(result)) continue
                decoder.write(w, result.right)
            }
        }

        console.log(w)

        return D.success(w)
    })
)
