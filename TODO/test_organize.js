const assert = require('assert')
const path = require('path')
const { parseDateFromFilename, getUniquePath } = require('./organize_photos')

console.log('Running tests...')

// Test: Date Parsing
{
  const date = parseDateFromFilename('DJI_20251115_0001.MP4')
  assert.ok(date instanceof Date, 'Should return a Date object')
  assert.strictEqual(date.toISOString().slice(0, 10), '2025-11-15', 'Date mismatch for DJI')
}

// Test: Collision Handling
{
  const mockExists = (p) => {
    // Simulate: 'image.jpg' and 'image_1.jpg' exist, 'image_2.jpg' does not
    return p.endsWith('image.jpg') || p.endsWith('image_1.jpg')
  }

  const unique = getUniquePath('/tmp/image.jpg', mockExists)
  assert.strictEqual(path.basename(unique), 'image_2.jpg', 'Should skip _1 if exists')

  const unique2 = getUniquePath('/tmp/new.jpg', (p) => false)
  assert.strictEqual(path.basename(unique2), 'new.jpg', 'Should return original if no conflict')
}

console.log('All tests passed!')
