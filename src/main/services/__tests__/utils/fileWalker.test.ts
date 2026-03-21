import { promises as fs } from 'fs'
import { join } from 'path'
import { FileWalker } from '../../utils/fileWalker'

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn()
  }
}))

describe('FileWalker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('walk traverses directories and calls callback for files', async () => {
    const dir = '/tmp/test'
    const files = ['file1.jpg', 'file2.png']
    const subDirs = ['subdir']

    ;(fs.readdir as jest.Mock)
      .mockResolvedValueOnce([
        { name: 'file1.jpg', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ])
      .mockResolvedValueOnce([
        { name: 'file2.png', isDirectory: () => false, isFile: () => true }
      ])

    const callback = jest.fn()
    const walker = new FileWalker()
    await walker.walk(dir, callback)

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(join(dir, 'file1.jpg'), expect.anything())
    expect(callback).toHaveBeenCalledWith(join(dir, 'subdir', 'file2.png'), expect.anything())
  })

  test('filters files by extension', async () => {
    const dir = '/tmp/test'
    ;(fs.readdir as jest.Mock).mockResolvedValueOnce([
      { name: 'file1.jpg', isDirectory: () => false, isFile: () => true },
      { name: 'file2.txt', isDirectory: () => false, isFile: () => true }
    ])

    const callback = jest.fn()
    const walker = new FileWalker(undefined, { extensions: ['.jpg'] })
    await walker.walk(dir, callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(join(dir, 'file1.jpg'), expect.anything())
  })

  test('ignores specified paths', async () => {
    const dir = '/tmp/test'
    const ignored = join(dir, 'ignored')
    ;(fs.readdir as jest.Mock).mockResolvedValueOnce([
      { name: 'file1.jpg', isDirectory: () => false, isFile: () => true },
      { name: 'ignored', isDirectory: () => true, isFile: () => false }
    ])

    const callback = jest.fn()
    const walker = new FileWalker(undefined, { ignorePaths: [ignored] })
    await walker.walk(dir, callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(fs.readdir).not.toHaveBeenCalledWith(ignored, expect.anything())
  })
})
