import { describe, it, expect } from 'vitest'
import { resolveConflict } from '../conflictResolver'

const older = {
  id: 'entity-1',
  name: 'older version',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T10:00:00.000Z',
}

const newer = {
  id: 'entity-1',
  name: 'newer version',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T10:00:00.000Z',
}

describe('resolveConflict() — last-write-wins', () => {
  it('returns local when local is newer', () => {
    const result = resolveConflict(newer, older)
    expect(result.name).toBe('newer version')
  })

  it('returns remote when remote is newer', () => {
    const result = resolveConflict(older, newer)
    expect(result.name).toBe('newer version')
  })

  it('returns local when timestamps are equal (local wins on tie)', () => {
    const localTie = { ...older, name: 'local on tie' }
    const remoteTie = { ...older, name: 'remote on tie' }
    const result = resolveConflict(localTie, remoteTie)
    expect(result.name).toBe('local on tie')
  })

  it('preserves all entity fields from the winning record', () => {
    const result = resolveConflict(older, newer)
    expect(result.id).toBe('entity-1')
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
    expect(result.updatedAt).toBe('2024-01-02T10:00:00.000Z')
  })

  it('does not mutate the input objects', () => {
    const localCopy = { ...older }
    const remoteCopy = { ...newer }
    resolveConflict(localCopy, remoteCopy)
    expect(localCopy.name).toBe('older version')
    expect(remoteCopy.name).toBe('newer version')
  })

  it('works with business entity shape', () => {
    const localBusiness = {
      id: 'biz-1',
      name: 'My Tailoring Business',
      ownerName: 'Alice',
      createdAt: '2024-06-01T00:00:00.000Z',
      updatedAt: '2024-06-15T12:00:00.000Z',
    }
    const remoteBusiness = {
      id: 'biz-1',
      name: 'My Tailoring Business (Remote)',
      ownerName: 'Alice',
      createdAt: '2024-06-01T00:00:00.000Z',
      updatedAt: '2024-06-15T09:00:00.000Z', // older than local
    }
    const result = resolveConflict(localBusiness, remoteBusiness)
    expect(result.name).toBe('My Tailoring Business')
    expect(result.updatedAt).toBe('2024-06-15T12:00:00.000Z')
  })

  it('works with measurement set entity shape', () => {
    const localMs = {
      id: 'ms-1',
      customerId: 'cust-1',
      label: 'Initial Fitting',
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-01T08:00:00.000Z',
    }
    const remoteMs = {
      id: 'ms-1',
      customerId: 'cust-1',
      label: 'Initial Fitting (Updated)',
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-02T08:00:00.000Z', // newer than local
    }
    const result = resolveConflict(localMs, remoteMs)
    expect(result.label).toBe('Initial Fitting (Updated)')
  })

  it('handles millisecond-precision timestamps correctly', () => {
    const a = { id: '1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.100Z' }
    const b = { id: '1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.200Z' }
    expect(resolveConflict(a, b)).toEqual(b)
    expect(resolveConflict(b, a)).toEqual(b)
  })
})
