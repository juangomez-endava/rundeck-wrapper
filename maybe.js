const Just = (value) => ({
    get(){ return value },
    map(f){ return Just(f(value)) },
    chain(f){ return f(value) },
    isJust(){ return true },
    isNone(){ return false },
    onNone(f){ return value }
})

const None = {
    get(){ return undefined },
    map(f){ return None },
    chain(f){ return None },
    isJust(){ return false },
    isNone(){ return true },
    onNone(f){ return typeof(f) === 'function' ? f() : f }
}

const Maybe = {
    fromFalsy: (v) => v ? Just(v) : None,
    fromNullish: (v) => (v === undefined || v === null) ? None : Just(v),
    None: () => None,
    Just,
}

module.exports = Maybe;