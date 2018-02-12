_ = require('../lib/util')

describe 'Util spec', ->
  it 'can sum()', ->
    expect(_.sum(3, 4)).toEqual 7
