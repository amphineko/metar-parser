import * as E from 'fp-ts/lib/Either'
import { messageTypeDecoder, timestampDecoder } from './parser'

describe('MessageTypeDecoder', () => {
    test('decode METAR should success', () => {
        const result = messageTypeDecoder.decode('METAR')
        expect(E.isRight(result)).toBe(true)
        expect(E.getOrElseW(() => null)(result)).toBe('METAR')
    })

    test('decode SPECI should success', () => {
        const result = messageTypeDecoder.decode('SPECI')
        expect(E.isRight(result)).toBe(true)
        expect(E.getOrElseW(() => null)(result)).toBe('SPECI')
    })

    test('decode CATGIRL should fail', () => {
        const result = messageTypeDecoder.decode('CATGIRL')
        expect(E.isLeft(result)).toBe(true)
        expect(E.getOrElseW(() => null)(result)).toBeNull()
    })
})

describe('TimestampDecoder', () => {
    test('decode 150315Z should success', () => {
        const decoded = timestampDecoder.decode('150324Z')
        const result = E.getOrElseW(() => null)(decoded)
        expect(result).not.toBeNull()
        expect((result as Date).getUTCDate()).toBe(15)
        expect((result as Date).getUTCHours()).toBe(3)
        expect((result as Date).getUTCMinutes()).toBe(24)
    })

    test('decode 322561Z should fail', () => {
        const decoded = timestampDecoder.decode('322561Z')
        expect(E.isLeft(decoded))
    })
})
