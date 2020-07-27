const Ok = (value) => ({
    get(){ return value },
    map(f){ return Ok(f(value)) },
    chain(f){ return f(value) },
    isOk(){ return true },
    isErr(){ return false },
    onError(f){ return value },
    catch(f){ return this }
})

const Err = (e) => ({
    get(){ return e },
    map(f){ return Err(e) },
    chain(f){ return f(e) },
    isOk(){ return false },
    isErr(){ return true },
    onError(f){ return typeof f === "function" ? f(e) : f },
    catch(f){ return f(e) }
})

const Result = {
    fromError: (e) => e instanceof Error ? Err(e) : Ok(e),
    fromFalsy: (v,msg) => v ? Ok(v) : Err(msg),
    Err,
    Ok
}

module.exports = Result