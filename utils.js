const Maybe = require('./maybe')

const apply = args => f => f(...args)
const split = c => v => v.split(c)
const last = arr => arr[arr.length - 1]
const trim = str => str.trim()
const prop = attr => obj => obj ? obj[attr]: undefined
const pick = (...keys) => (obj) => keys.reduce((acc,key) => ({
    ...acc,
    [key]: prop(key)(obj)
}) ,{})

const maybeProp = name => obj => Maybe.fromNullish(prop(name)(obj))

const effect = f => x => {
    f(x);
    return x
}

const log = effect(console.log)

const min = m => x => x <= m ? m : x

const defaultTo = (or) => (value) => value === undefined ? or : value

const extract = f => typeof f === "function" ? f(): f

const reverse = arr => [...arr].reverse()
const takeLast = (n,arr) => reverse(reverse(arr).slice(0,n))

module.exports = {
    apply,
    split,
    last,
    trim,
    prop,
    pick,
    maybeProp,
    log,
    min,
    defaultTo,
    effect,
    extract,
    reverse,
    takeLast,
}
