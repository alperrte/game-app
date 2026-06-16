import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('should join non-falsy class names correctly', () => {
    expect(cn('p-4', 'bg-slate-900')).toBe('p-4 bg-slate-900')
  })
  
  it('should ignore falsy values', () => {
    expect(cn('p-4', false, undefined, null, 'bg-slate-900')).toBe('p-4 bg-slate-900')
  })
})
