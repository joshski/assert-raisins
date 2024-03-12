import assert from 'node:assert'
import { test, beforeEach, beforeAll } from './api.js'
import { run, TestReport, Reporter } from './run.js'
import { it, describe, beforeEach as nodeBeforeEach } from 'node:test'

describe('api', function() {
  let reporter: Reporter
  let messages: Array<TestReport>

  nodeBeforeEach(function() {
    messages = []
    reporter = {
      report: msg => messages.push(msg)
    }
  })

  describe('run', function() {
    it('runs tests', async function() {
      let invoke = 0

      test('test 1', () => { invoke++ })
      test('test 2', async () => { await Promise.resolve(invoke++) })

      await run({ fileName: 'file1', reporter })

      assert.equal(invoke, 2)
      assert.deepStrictEqual(
        messages,
        [
          {
            fileName: 'file1',
            testName: 'test 1'
          },
          {
            fileName: 'file1',
            testName: 'test 2'
          }
        ]
      )
    })

    it('runs faliing test', async function() {
      test('test 1', () => { assert.ok(false) })

      await run({ fileName: 'file2', reporter })

      assert.equal(messages.length, 1)
      assert.equal(messages[0].fileName, 'file2')
      assert.equal(messages[0].error?.constructor.name, 'AssertionError')
    })
  })

  describe('beforeAll', function() {
    it('runs once per file', async function() {
      let invoke = 0
      beforeAll(() => { invoke++ })

      test('test 1', () => {})
      test('test 11', () => {})

      await run({ reporter, fileName: 'file3' })

      assert.equal(invoke, 1)
    })

    it('can cleanup after itself', async function() {
      let invoke = 0

      beforeAll(cleanup => { cleanup(() => { invoke++ }) })
      test('test 1', () => {})

      await run({ reporter, fileName: 'file3' })

      assert.equal(invoke, 1)
    })

    it('can cleanup multiple times', async function() {
      let invoke = 0

      beforeAll(cleanup => {
        cleanup(() => { invoke++ })
        cleanup(() => { invoke++ })
      })

      test('test 1', () => {})

      await run({ reporter, fileName: 'file3' })

      assert.equal(invoke, 2)
    })
  })

  describe('beforeEach', function() {
    it('runs before every test', async function() {
      let invoke = 0

      beforeEach(() => { invoke++ })

      test('test 1', () => {})
      test('test 2', () => {})

      await run({ reporter, fileName: 'file3' })

      assert.equal(invoke, 2)
    })

    it('can cleanup after itself', async function() {
      let invoke = 0

      beforeEach(cleanup => { cleanup(() => { invoke++ }) })
      test('test 1', () => {})

      await run({ reporter, fileName: 'file3' })

      assert.equal(invoke, 1)
    })

    it('can cleanup multiple times', async function() {
      let invoke = 0

      beforeEach(cleanup => {
        cleanup(() => { invoke++ })
        cleanup(() => { invoke++ })
      })

      test('test 1', () => {})

      await run({ reporter, fileName: 'file3' })

      assert.equal(invoke, 2)
    })
  })
})
